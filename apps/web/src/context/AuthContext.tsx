import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  AuthResponse,
  LoginRequest,
  RegisterCaretakerRequest,
  RegisterDoctorRequest,
  RegisterPatientByCaretakerRequest,
} from '@ner/types';
import { apiRequest } from '../lib/api.js';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  firebaseSignOut,
} from '../lib/firebase.js';
import {
  syncUserToFirestore,
  syncPatientProfileToFirestore,
  syncCaretakerLinkToFirestore,
} from '../lib/firestoreHelpers.js';

interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  roles?: string[];
  preferredLanguage: string;
  patientId?: string;
  doctorStatus?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  loginWithEmail: (email: string, password: string, isSignUp?: boolean, targetRole?: Role) => Promise<AuthResponse>;
  loginWithGoogle: (targetRole?: Role) => Promise<AuthResponse>;
  loginWithPhone: (phone: string, passwordOrOtp: string, isOtp?: boolean) => Promise<AuthResponse>;
  registerCaretaker: (payload: RegisterCaretakerRequest) => Promise<AuthResponse>;
  registerDoctor: (payload: RegisterDoctorRequest) => Promise<AuthResponse>;
  registerPatientByCaretaker: (payload: RegisterPatientByCaretakerRequest) => Promise<AuthResponse>;
  logout: () => void;
  getRoleHomeUrl: (role?: Role | null) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('ner_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ner_auth_token');
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Validate session on boot
  useEffect(() => {
    async function checkSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await apiRequest<AuthUser>('/api/auth/me');
        setUser(userData);
        localStorage.setItem('ner_auth_user', JSON.stringify(userData));
      } catch (err) {
        console.warn('Session verification failed, clearing stale auth token');
        logout();
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const handleAuthSuccess = (data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ner_auth_token', data.token);
    localStorage.setItem('ner_auth_user', JSON.stringify(data.user));
    // Sync to Firestore from client (works without admin creds)
    syncUserToFirestore({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      phone: data.user.phone,
      role: data.user.role,
      preferredLanguage: data.user.preferredLanguage,
      patientId: data.user.patientId,
      doctorStatus: data.user.doctorStatus,
    }).catch(() => {});

    // Sync patient profile to Firestore if role is patient
    if (data.user.role?.toLowerCase() === 'patient' && data.user.patientId) {
      syncPatientProfileToFirestore({
        id: data.user.patientId,
        userId: data.user.id,
        name: data.user.name,
        phone: data.user.phone,
        preferredLanguage: data.user.preferredLanguage,
      }).catch(() => {});
    }

    return data;
  };

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    if (credentials.identifier && credentials.identifier.includes('@')) {
      return loginWithEmail(credentials.identifier, credentials.password || '', false, credentials.role);
    }
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return handleAuthSuccess(response);
  };

  const syncFirebaseUserWithBackend = async (
    fbUser: any,
    idToken: string,
    email: string,
    targetRole?: Role
  ): Promise<AuthResponse> => {
    try {
      const response = await apiRequest<AuthResponse>('/api/auth/social-login', {
        method: 'POST',
        body: JSON.stringify({
          email: fbUser.email || email,
          name: fbUser.displayName || (fbUser.email || email).split('@')[0],
          provider: 'firebase',
          phone: fbUser.phoneNumber || '',
          role: targetRole || 'caretaker',
        }),
      });
      return handleAuthSuccess(response);
    } catch (apiErr) {
      console.warn('Backend sync failed, using local Firebase session:', apiErr);
      const chosenRole = (targetRole || 'caretaker') as Role;
      const patientId = chosenRole === 'patient' ? `pat-${fbUser.uid.slice(0, 8)}` : undefined;
      const fallback: AuthResponse = {
        token: idToken || 'fb-session-' + Date.now(),
        user: {
          id: fbUser.uid,
          name: fbUser.displayName || (fbUser.email || email).split('@')[0] || 'User',
          email: fbUser.email || email,
          phone: fbUser.phoneNumber || '',
          role: chosenRole,
          preferredLanguage: 'en',
          patientId,
        },
      };

      if (chosenRole === 'patient' && patientId) {
        syncPatientProfileToFirestore({
          id: patientId,
          userId: fbUser.uid,
          name: fbUser.displayName || (fbUser.email || email).split('@')[0] || 'User',
          phone: fbUser.phoneNumber || '',
          preferredLanguage: 'en',
        }).catch(() => {});
      }

      return handleAuthSuccess(fallback);
    }
  };

  const loginWithEmail = async (
    emailAddress: string,
    pass: string,
    isSignUp: boolean = false,
    targetRole?: Role
  ): Promise<AuthResponse> => {
    const cleanEmail = emailAddress.trim().toLowerCase();

    // 1. Explicit Sign Up mode
    if (isSignUp) {
      try {
        const { user: fbUser, idToken } = await signUpWithEmail(cleanEmail, pass);
        return await syncFirebaseUserWithBackend(fbUser, idToken, cleanEmail, targetRole);
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/operation-not-allowed') {
          throw new Error(
            'Email/Password sign-in is disabled in your Firebase Console. Please open Firebase Console > Authentication > Sign-in method and enable "Email/Password".'
          );
        } else if (fbErr.code === 'auth/email-already-in-use') {
          // Attempt login if user already exists
        } else {
          throw new Error(fbErr.message || 'Failed to create account with email.');
        }
      }
    }

    // 2. Try backend API login first
    try {
      const response = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: cleanEmail, password: pass, role: targetRole }),
      });
      return handleAuthSuccess(response);
    } catch (backendErr: any) {
      console.warn('Backend email login failed/offline, attempting Firebase fallback:', backendErr);
    }

    // 3. Try Firebase signInWithEmail as fallback
    try {
      const { user: fbUser, idToken } = await signInWithEmail(cleanEmail, pass);
      return await syncFirebaseUserWithBackend(fbUser, idToken, cleanEmail, targetRole);
    } catch (fbErr: any) {
      console.warn('Firebase signInWithEmail failed:', fbErr.code, fbErr.message);

      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
        // If password is at least 6 chars, try auto-creating in Firebase for seamless UX
        if (pass && pass.length >= 6) {
          try {
            const { user: newFbUser, idToken } = await signUpWithEmail(cleanEmail, pass);
            return await syncFirebaseUserWithBackend(newFbUser, idToken, cleanEmail, targetRole);
          } catch (autoErr: any) {
            console.warn('Auto-create in Firebase failed:', autoErr.code);
          }
        }
        throw new Error(
          'No account found with this email, or password is incorrect. Please verify your credentials or register a new account.'
        );
      } else if (fbErr.code === 'auth/wrong-password') {
        throw new Error('Incorrect password for this email account.');
      } else {
        throw new Error(fbErr.message || 'Failed to sign in with email.');
      }
    }
  };

  const loginWithGoogle = async (targetRole?: Role): Promise<AuthResponse> => {
    try {
      const { user: fbUser, idToken } = await signInWithGoogle();
      return await syncFirebaseUserWithBackend(fbUser, idToken, fbUser.email || '', targetRole);
    } catch (fbErr: any) {
      console.error('Firebase Google authentication failed:', fbErr);
      throw fbErr;
    }
  };

  const loginWithPhone = async (
    phone: string,
    passwordOrOtp: string,
    isOtp: boolean = false
  ): Promise<AuthResponse> => {
    const payload: any = { phone };
    if (isOtp) {
      payload.otp = passwordOrOtp;
    } else {
      payload.password = passwordOrOtp;
    }

    const response = await apiRequest<AuthResponse>('/api/auth/phone-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleAuthSuccess(response);
  };

  const registerCaretaker = async (payload: RegisterCaretakerRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth/register/caretaker', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const result = handleAuthSuccess(response);

    // Write patient profile + link to Firestore if a new patient was created
    if (payload.patientDetails && response.user.patientId) {
      const patientId = response.user.patientId;
      syncPatientProfileToFirestore({
        id: patientId,
        name: payload.patientDetails.name || '',
        phone: payload.patientDetails.phone || '',
        dementiaStage: payload.patientDetails.dementiaStage,
        emergencyContact: payload.patientDetails.emergencyContact,
        preferredLanguage: payload.patientDetails.preferredLanguage,
        caretakerId: response.user.id,
        caretakerName: response.user.name,
        dateOfBirth: payload.patientDetails.dateOfBirth,
      }).catch(() => {});

      syncCaretakerLinkToFirestore({
        id: `link-${response.user.id}-${patientId}`,
        caretakerId: response.user.id,
        patientId,
        relationship: payload.patientDetails.relationship || 'Caregiver',
        status: 'active',
      }).catch(() => {});
    }

    return result;
  };

  const registerDoctor = async (payload: RegisterDoctorRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth/register/doctor', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleAuthSuccess(response);
  };

  const registerPatientByCaretaker = async (
    payload: RegisterPatientByCaretakerRequest
  ): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleAuthSuccess(response);
  };

  const logout = () => {
    firebaseSignOut().catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem('ner_auth_token');
    localStorage.removeItem('ner_auth_user');
  };

  const getRoleHomeUrl = (targetRole?: Role | null): string => {
    const r = targetRole || user?.role;
    switch (r) {
      case 'patient':
        return '/patient';
      case 'doctor':
        return '/doctor';
      case 'caretaker':
        return '/caretaker';
      default:
        return '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        loginWithEmail,
        loginWithGoogle,
        loginWithPhone,
        registerCaretaker,
        registerDoctor,
        registerPatientByCaretaker,
        logout,
        getRoleHomeUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
