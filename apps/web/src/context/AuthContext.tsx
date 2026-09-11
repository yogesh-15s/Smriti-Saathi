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

interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
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
    return data;
  };

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return handleAuthSuccess(response);
  };

  const registerCaretaker = async (payload: RegisterCaretakerRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth/register/caretaker', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleAuthSuccess(response);
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
