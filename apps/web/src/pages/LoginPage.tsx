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
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, getRoleHomeUrl } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your phone number or email address');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await login({
        identifier: identifier.trim(),
        password: password || undefined,
      });

      // Redirect to specific requested path or user's assigned role dashboard
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate(getRoleHomeUrl(response.user.role));
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Login failed. Please check your credentials or register an account.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Preset demo accounts for seamless evaluation
  const setDemoCredentials = (type: 'patient' | 'caretaker' | 'doctor') => {
    setErrorMessage(null);
    if (type === 'patient') {
      setIdentifier('+91 98765 43210');
      setPassword('patient123');
    } else if (type === 'caretaker') {
      setIdentifier('caretaker@nerdementia.in');
      setPassword('caretaker123');
    } else if (type === 'doctor') {
      setIdentifier('dr.baruah@guwahatimed.in');
      setPassword('doctor123');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ner-tea to-ner-forest text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-ner-tea/30">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Unified Sign In
          </h1>
          <p className="text-slate-600 text-sm mt-2 font-medium">
            One secure login for Patients, Doctors, and Caretakers
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Authentication Notice</p>
              <p className="mt-0.5 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Phone Input */}
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-bold text-slate-800 mb-2"
            >
              Email or Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. +91 9876543210 or name@domain.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ner-tea focus:border-transparent text-sm font-medium transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              Elderly patients can log in using their registered mobile phone number.
            </p>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-800"
              >
                Password / Secure PIN
              </label>
              <span className="text-xs text-slate-400 font-medium">
                (Optional for assisted patient accounts)
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ner-tea focus:border-transparent text-sm font-medium transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-base shadow-md shadow-ner-tea/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In to Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill Selector (Helpful for quick demonstration / evaluation) */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-ner-golden" /> Quick Demo Fill
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click to populate</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('patient')}
              className="px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1"
            >
              <HeartPulse className="w-3.5 h-3.5" /> Patient
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('caretaker')}
              className="px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors flex items-center justify-center gap-1"
            >
              <Users className="w-3.5 h-3.5" /> Caretaker
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('doctor')}
              className="px-2.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center gap-1"
            >
              <Stethoscope className="w-3.5 h-3.5" /> Doctor
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-slate-600 font-medium">
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
