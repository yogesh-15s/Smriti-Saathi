import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  LogIn,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  HeartPulse,
  Stethoscope,
  Users,
  Sparkles,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, loginWithPhone, getRoleHomeUrl } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  // Login Method: 'email' | 'phone'
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Phone form state
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [phoneAuthType, setPhoneAuthType] = useState<'pin' | 'otp'>('pin');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Common status
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSuccessfulAuth = (role: any) => {
    if (redirectPath) {
      navigate(redirectPath);
    } else {
      navigate(getRoleHomeUrl(role));
    }
  };

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setGoogleLoading(true);

    try {
      const response = await loginWithGoogle();
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
      const response = await login({
        identifier: email.trim(),
        password: emailPassword || undefined,
      });
      handleSuccessfulAuth(response.user.role);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Email login failed. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Phone Sign In Handler
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    // Format phone with +91 if not provided
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91 ${cleanPhone}`;

    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      if (phoneAuthType === 'otp') {
        if (!otpSent) {
          // Simulate OTP dispatch (with test code 123456)
          setOtpSent(true);
          setInfoMessage('Verification OTP sent! For evaluation / demo testing, enter OTP: 123456');
          setLoading(false);
          return;
        }

        if (!otpCode.trim()) {
          setErrorMessage('Please enter the 6-digit OTP received on your mobile');
          setLoading(false);
          return;
        }

        const response = await loginWithPhone(formattedPhone, otpCode.trim(), true);
        handleSuccessfulAuth(response.user.role);
      } else {
        // PIN / Password login
        const response = await loginWithPhone(formattedPhone, phonePassword.trim(), false);
        handleSuccessfulAuth(response.user.role);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Phone sign-in failed. Please verify your phone number and PIN/OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Preset demo accounts for evaluation
  const setDemoCredentials = (type: 'patient' | 'caretaker' | 'doctor') => {
    setErrorMessage(null);
    setInfoMessage(null);
    setOtpSent(false);

    if (type === 'patient') {
      setAuthMethod('phone');
      setPhone('+91 98765 43210');
      setPhonePassword('patient123');
      setPhoneAuthType('pin');
    } else if (type === 'caretaker') {
      setAuthMethod('email');
      setEmail('caretaker@nerdementia.in');
      setEmailPassword('caretaker123');
    } else if (type === 'doctor') {
      setAuthMethod('email');
      setEmail('dr.baruah@guwahatimed.in');
      setEmailPassword('doctor123');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ner-tea to-ner-forest text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-ner-tea/30">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Unified Sign In
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
            One secure login for Patients, Doctors, and Caretakers
          </p>
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
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            or sign in with
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Auth Method Switcher (Email vs Phone) */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              authMethod === 'email'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4 text-ner-forest" />
            Email Address
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              authMethod === 'phone'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Phone className="w-4 h-4 text-ner-forest" />
            Phone Number
          </button>
        </div>

        {/* Email Login Form */}
        {authMethod === 'email' && (
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
                  placeholder="name@domain.com"
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
                  <span>Sign In with Email</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Phone Login Form */}
        {authMethod === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
              >
                Mobile Phone Number
              </label>
              <div className="relative flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-xs font-bold">
                  +91
                </span>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-r-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ner-tea focus:border-transparent text-sm font-medium transition-all"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Optimized for elderly patients with simplified mobile sign-in.
              </p>
            </div>

            {/* Sub-toggle: PIN vs OTP */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-600">Verification Mode:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneAuthType('pin');
                    setOtpSent(false);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    phoneAuthType === 'pin'
                      ? 'bg-ner-tea text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Password / PIN
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneAuthType('otp')}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    phoneAuthType === 'otp'
                      ? 'bg-ner-tea text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  SMS / OTP
                </button>
              </div>
            </div>

            {phoneAuthType === 'pin' ? (
              <div>
                <label
                  htmlFor="phonePassword"
                  className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
                >
                  Password or Secure PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="phonePassword"
                    type="password"
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ner-tea focus:border-transparent text-sm font-medium transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                {otpSent ? (
                  <div>
                    <label
                      htmlFor="otpCode"
                      className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
                    >
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <input
                        id="otpCode"
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ner-tea focus:border-transparent text-base tracking-widest font-bold transition-all text-center"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    Click below to generate a fast verification code for this mobile number.
                  </p>
                )}
              </div>
            )}

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
                    {phoneAuthType === 'otp' && !otpSent
                      ? 'Send Verification OTP'
                      : 'Sign In with Phone'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Fast-Fill Demo Selector */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-ner-golden" /> Quick Demo Accounts
            </span>
            <span className="text-[10px] text-slate-400 font-medium">1-click test</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('patient')}
              className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1"
            >
              <HeartPulse className="w-3.5 h-3.5" /> Patient
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('caretaker')}
              className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors flex items-center justify-center gap-1"
            >
              <Users className="w-3.5 h-3.5" /> Caretaker
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('doctor')}
              className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center gap-1"
            >
              <Stethoscope className="w-3.5 h-3.5" /> Doctor
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-5 text-center text-xs text-slate-600 font-medium">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-ner-tea hover:text-ner-forest font-bold underline"
          >
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
