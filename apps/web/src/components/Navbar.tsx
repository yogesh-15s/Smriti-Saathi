import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Type,
  Languages,
  LogOut,
  User,
  HeartPulse,
  Stethoscope,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext.js';
import { useAuth } from '../context/AuthContext.js';
import { RegionalLanguage } from '@ner/types';

export const Navbar: React.FC = () => {
  const {
    highContrast,
    toggleHighContrast,
    fontScale,
    cycleFontScale,
    language,
    setLanguage,
    supportedLanguages,
  } = useAccessibility();

  const { user, isAuthenticated, role, logout, getRoleHomeUrl } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = () => {
    if (!role) return null;
    switch (role) {
      case 'patient':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <HeartPulse className="w-3.5 h-3.5" /> Patient Portal
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Stethoscope className="w-3.5 h-3.5" /> Doctor Console
          </span>
        );
      case 'caretaker':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Users className="w-3.5 h-3.5" /> Caretaker Link
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-ner-tea rounded-lg p-1"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ner-tea to-ner-forest text-white flex items-center justify-center shadow-md shadow-ner-tea/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-ner-forest">
                  NER Dementia Care
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-ner-golden/15 text-ner-golden rounded-full border border-ner-golden/30">
                  NER AI Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden md:block">
                Cognitive Gaming & Memory Assistance for North Eastern Region
              </p>
            </div>
          </Link>

          {/* Accessibility Controls & User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Accessibility Controls Group */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1">
              {/* High Contrast Mode Toggle */}
              <button
                onClick={toggleHighContrast}
                title={highContrast ? 'Switch to Normal Contrast' : 'Switch to High Contrast (for Elderly Visual Clarity)'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  highContrast
                    ? 'bg-yellow-400 text-black shadow-sm ring-2 ring-yellow-500'
                    : 'text-slate-700 hover:bg-white hover:shadow-xs'
                }`}
                aria-label="Toggle High Contrast Mode"
              >
                {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span className="hidden lg:inline">{highContrast ? 'High Contrast: ON' : 'High Contrast'}</span>
              </button>

              {/* Font Size Scaler */}
              <button
                onClick={cycleFontScale}
                title={`Current Text Size: ${fontScale.toUpperCase()}. Click to enlarge.`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs transition-all"
                aria-label="Cycle Font Size"
              >
                <Type className="w-4 h-4 text-ner-tea" />
                <span className="font-semibold uppercase">{fontScale}</span>
              </button>

              {/* Regional Language Selector */}
              <div className="relative hidden sm:flex items-center">
                <Languages className="w-4 h-4 absolute left-2 text-slate-400 pointer-events-none" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as RegionalLanguage)}
                  className="pl-7 pr-3 py-1.5 text-xs font-semibold rounded-lg bg-transparent text-slate-700 hover:bg-white border-0 focus:ring-1 focus:ring-ner-tea cursor-pointer transition-colors"
                  aria-label="Select North Eastern Regional Language"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auth State & Navigation */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-2">
                <Link
                  to={getRoleHomeUrl()}
                  className="hidden md:flex flex-col text-right group"
                  title="Go to role dashboard"
                >
                  <span className="text-sm font-bold text-slate-900 group-hover:text-ner-tea transition-colors">
                    {user.name}
                  </span>
                  <div>{getRoleBadge()}</div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign out of your session"
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs sm:text-sm font-bold text-ner-forest hover:text-ner-tea transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-ner-tea hover:bg-ner-forest rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
