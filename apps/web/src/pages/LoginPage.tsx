import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  LogIn,
  AlertCircle,
  Mail,
  Lock,
  HeartPulse,
  Stethoscope,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, getRoleHomeUrl } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  // Role intent: 'patient' | 'caretaker' | 'doctor'
  const [selectedRole, setSelectedRole] = useState<'patient' | 'caretaker' | 'doctor'>('caretaker');

  // Email form state
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Common status
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRoleSelect = (role: 'patient' | 'caretaker' | 'doctor') => {
    setSelectedRole(role);
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const handleSuccessfulAuth = (role: any) => {
    if (redirectPath) {
      navigate(redirectPath);
    } else {
      navigate(getRoleHomeUrl(role || selectedRole));
    }
  };

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setGoogleLoading(true);

    try {
      const response = await loginWithGoogle(selectedRole);
      handleSuccessfulAuth(response.user.role);
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in popup was closed before completing.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'This domain is not authorized in your Firebase Console. Please add "localhost" under Authentication > Settings > Authorized domains.'
        );
      } else {
        setErrorMessage(
          err.message || 'Failed to sign in with Google. Please check your network and Firebase configuration.'
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Email Sign In Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await loginWithEmail(email.trim(), emailPassword, false, selectedRole);
      handleSuccessfulAuth(response.user.role);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Email login failed. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-slate-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ner-tea to-ner-forest text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-ner-tea/30">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Smriti-Saathi Portal
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
            AI-Assisted Dementia Care & Memory Platform for North Eastern Region
          </p>
        </div>

        {/* Role Portal Selector */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
            Select Your Portal Intent
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Patient Option */}
            <button
              type="button"
              onClick={() => handleRoleSelect('patient')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedRole === 'patient'
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-400/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl ${selectedRole === 'patient' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block">Patient</span>
              <span className="text-[10px] text-slate-500 font-medium">Memory & Games</span>
            </button>

            {/* Caretaker Option */}
            <button
              type="button"
              onClick={() => handleRoleSelect('caretaker')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedRole === 'caretaker'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl ${selectedRole === 'caretaker' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block">Caregiver</span>
              <span className="text-[10px] text-slate-500 font-medium">Monitoring & Care</span>
            </button>

            {/* Doctor Option */}
            <button
              type="button"
              onClick={() => handleRoleSelect('doctor')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedRole === 'doctor'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-400/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl ${selectedRole === 'doctor' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block">Doctor</span>
              <span className="text-[10px] text-slate-500 font-medium">Clinical Hub</span>
            </button>
          </div>

          {/* Dynamic Role Capability Banner */}
          <div className={`mt-3.5 p-3 rounded-2xl border text-xs font-medium leading-relaxed flex items-start gap-2.5 transition-all ${
            selectedRole === 'patient'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : selectedRole === 'caretaker'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                {selectedRole === 'patient' && 'Patient Memory Portal'}
                {selectedRole === 'caretaker' && 'Family Caregiver Dashboard'}
                {selectedRole === 'doctor' && 'Clinician Medical Portal'}
              </span>
              {selectedRole === 'patient' &&
                'Signing in as a Patient. Access cognitive games, daily medicine reminders, family memory photos, and voice notes.'}
              {selectedRole === 'caretaker' &&
                'Signing in as a Caregiver. Monitor patient cognitive trends, set safe-zone geofences, track daily medication adherence, and receive alerts.'}
              {selectedRole === 'doctor' &&
                'Signing in as a Doctor. Access MMSE clinical trend curves, review patient adherence metrics, and update care plans.'}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Authentication Notice</p>
              <p className="mt-0.5 text-xs font-medium leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Info Alert */}
        {infoMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Notice</p>
              <p className="mt-0.5 text-xs font-medium leading-relaxed">{infoMessage}</p>
            </div>
          </div>
        )}

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-50 mb-5"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="flex-1 border-t border-slate-200" />
          <span className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            or sign in with email
          </span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === 'doctor'
                    ? 'dr.name@hospital.in'
                    : selectedRole === 'patient'
                    ? 'patient@domain.com'
                    : 'caretaker@domain.com'
                }
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ner-tea focus:border-transparent text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="emailPassword"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="emailPassword"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ner-tea focus:border-transparent text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-sm shadow-md shadow-ner-tea/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>
                  Sign In to {selectedRole === 'doctor' ? 'Doctor' : selectedRole === 'patient' ? 'Patient' : 'Caregiver'} Portal
                </span>
              </>
            )}
          </button>
        </form>

        {/* Footer Registration Link */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-600 font-medium">
          Don't have an account?{' '}
          <Link
            to={`/signup?role=${selectedRole}`}
            className="text-ner-tea hover:text-ner-forest font-bold underline inline-flex items-center gap-0.5"
          >
            <span>Register as {selectedRole === 'doctor' ? 'Doctor' : selectedRole === 'patient' ? 'Patient' : 'Caregiver'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
