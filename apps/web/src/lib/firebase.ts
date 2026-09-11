import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser,
} from 'firebase/auth';

// Read config from Vite environment variables with fallback to project defaults
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAfRmELsrj734q7k5pF3vZ0NSRoMyyGfUY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sih-1-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sih-1-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sih-1-project.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '71129384332',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:71129384332:web:2e90728f8b08388d2502a9',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-B0QEGZ39JC',
};

// Safe singleton initialization
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken,
  };
}

/**
 * Sign in with Email and Password via Firebase
 */
export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken,
  };
}

/**
 * Sign up with Email and Password via Firebase
 */
export async function signUpWithEmail(
  email: string,
  pass: string
): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken,
  };
}

/**
 * Initialize invisible ReCAPTCHA verifier for Phone Auth
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - will proceed with submit
    },
  });
}

/**
 * Send Phone verification code via Firebase
 */
export async function sendPhoneVerificationCode(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

/**
 * Firebase sign out
 */
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}
