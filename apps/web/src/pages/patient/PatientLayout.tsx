import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Type, Volume2, ArrowLeft, LogOut, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext.js';
import { useAuth } from '../../context/AuthContext.js';

export const PatientLayout: React.FC = () => {
  const { highContrast, toggleHighContrast, fontScale, cycleFontScale } = useAccessibility();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/patient' || location.pathname === '/patient/';

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  const readAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-slate-900 flex flex-col justify-between selection:bg-emerald-200">
      {/* Top Accessibility Bar - Discrete corner controls without full menu clutter */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div>
          {!isHome && (
            <button
              onClick={() => navigate('/patient')}
              className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-300 hover:border-ner-tea text-slate-800 font-extrabold text-lg sm:text-xl flex items-center gap-3 shadow-md hover:shadow-lg transition-all focus:ring-4 focus:ring-emerald-300"
              aria-label="Go Back Home"
            >
              <ArrowLeft className="w-6 h-6 text-ner-tea" />
              <span>Back Home</span>
            </button>
          )}
        </div>

        {/* Minimal Corner Accessibility & Session Controls */}
        <div className="flex items-center gap-2 sm:gap-3 bg-white/90 p-1.5 rounded-2xl border-2 border-slate-200 shadow-sm">
          <button
            onClick={cycleFontScale}
            className="px-3.5 py-2 rounded-xl text-sm font-black text-ner-forest hover:bg-emerald-50 border border-slate-200 flex items-center gap-1.5 transition-colors"
            title="Make Text Bigger"
            aria-label="Enlarge Text"
          >
            <Type className="w-4 h-4 text-ner-tea" />
            <span>{fontScale === 'xl' ? 'Max Text' : 'Bigger Text'}</span>
          </button>

          <button
            onClick={toggleHighContrast}
            className={`px-3.5 py-2 rounded-xl text-sm font-black border flex items-center gap-1.5 transition-all ${
              highContrast
                ? 'bg-yellow-400 text-black border-yellow-500 ring-2 ring-yellow-400'
                : 'text-slate-800 hover:bg-slate-100 border-slate-200'
            }`}
            title="High Contrast Mode"
            aria-label="Toggle High Contrast"
          >
            {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{highContrast ? 'Clear Vision' : 'High Contrast'}</span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sign out of patient account"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-600" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-8 max-w-5xl mx-auto w-full py-4 sm:py-8">
        <Outlet />
      </main>

      {/* Gentle Audio Cue Reminder & Discreet Sign Out at bottom */}
      <footer className="py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-slate-400 border-t border-slate-200/60 mt-4">
        <span>AI-Assisted Memory Companion • North Eastern Elderly Care</span>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="text-slate-500 hover:text-rose-600 underline font-medium transition-colors"
        >
          Sign Out of Account
        </button>
      </footer>

      {/* Confirmation Modal for Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-slate-200 text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                Do you want to sign out?
              </h3>
              <p className="text-base text-slate-600 font-medium">
                You can sign back into your patient companion whenever you are ready.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-base transition-colors"
              >
                No, Stay Here
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base shadow-md shadow-rose-600/20 transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientLayout;
