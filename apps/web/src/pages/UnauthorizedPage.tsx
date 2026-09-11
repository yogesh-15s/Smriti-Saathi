import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const UnauthorizedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requiredRole = searchParams.get('required');
  const currentRole = searchParams.get('current');
  const { user, isAuthenticated, getRoleHomeUrl, logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-md shadow-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
          403 Access Forbidden
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4">
          Role-Restricted Portal
        </h1>

        <p className="mt-3 text-slate-600 text-sm leading-relaxed font-medium">
          This portal requires <span className="font-bold text-slate-900 uppercase">[{requiredRole || 'authorized'}]</span> privileges.
          {isAuthenticated ? (
            <span>
              {' '}You are currently signed in as a <span className="font-bold text-slate-900 uppercase">[{currentRole || user?.role || 'user'}]</span>.
            </span>
          ) : (
            <span> Please sign in with an authorized account.</span>
          )}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={getRoleHomeUrl()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Return to My Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Sign Out / Switch User</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
