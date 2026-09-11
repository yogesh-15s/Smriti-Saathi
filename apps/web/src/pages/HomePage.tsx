import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Stethoscope,
  Users,
  Brain,
  Sparkles,
  Volume2,
  ShieldCheck,
  Languages,
  Activity,
  ArrowRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useAccessibility } from '../context/AccessibilityContext.js';

export const HomePage: React.FC = () => {
  const { isAuthenticated, role, getRoleHomeUrl } = useAuth();
  const { highContrast, toggleHighContrast, fontScale, cycleFontScale } = useAccessibility();

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white py-16 sm:py-24 border-b border-slate-200/80">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-ner-tea/10 via-ner-brahmaputra/5 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ner-tea/10 text-ner-tea text-xs sm:text-sm font-bold mb-6 border border-ner-tea/20">
              <Sparkles className="w-4 h-4 text-ner-golden" />
              <span>Dedicated to Elderly Care across 8 North Eastern States</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
              Empowering Memory & Independence with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ner-tea via-emerald-700 to-ner-brahmaputra">
                Cognitive Care
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed font-medium">
              An accessible, culturally aligned cognitive gaming and memory assistance platform designed for elderly dementia patients, loving caretakers, and clinical practitioners in the North Eastern Region.
            </p>

            {/* Quick Action Navigation if logged in or main CTA */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to={getRoleHomeUrl()}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-ner-tea text-white text-base font-bold shadow-lg shadow-ner-tea/25 hover:bg-ner-forest hover:scale-[1.02] transition-all"
                >
                  <span>Go to My {role?.toUpperCase()} Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-ner-tea text-white text-base font-bold shadow-lg shadow-ner-tea/25 hover:bg-ner-forest hover:scale-[1.02] transition-all"
                  >
                    <span>Sign In to Your Portal</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-ner-forest text-base font-bold border-2 border-ner-tea/30 hover:bg-emerald-50/50 hover:border-ner-tea transition-all"
                  >
                    <span>New Account Registration</span>
                  </Link>
                </>
              )}
            </div>

            {/* Elderly Accessibility Quick-Check Bar */}
            <div className="mt-8 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 inline-flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-amber-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-ner-golden" />
                Elderly Friendly Mode:
              </span>
              <button
                onClick={toggleHighContrast}
                className="underline hover:text-black focus:outline-none"
              >
                Toggle High-Contrast (Current: {highContrast ? 'ON' : 'OFF'})
              </button>
              <span className="text-amber-300">|</span>
              <button
                onClick={cycleFontScale}
                className="underline hover:text-black focus:outline-none"
              >
                Enlarge Text (Current: {fontScale.toUpperCase()})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Portals Selector Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Three Portals Tailored for Dementia Care
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              Choose your role to see how the platform adapts to your everyday needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. Patient Portal */}
            <div className="group relative rounded-3xl p-8 bg-gradient-to-b from-emerald-50/50 to-white border-2 border-emerald-100 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-600/30 group-hover:scale-110 transition-transform">
                  <HeartPulse className="w-8 h-8" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                  Role: Patient
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Elderly Patient Portal
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                  Extra-large touch targets, voice prompts, and culturally familiar memory games inspired by North Eastern tea gardens, wildlife, and music.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-semibold mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Daily medicine reminder with "Taken" button</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Assam Flora & Kaziranga memory games</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>One-tap Emergency Caretaker Alert (SOS)</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/patient"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>Enter Patient Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 2. Caretaker Portal */}
            <div className="group relative rounded-3xl p-8 bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-100 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-6 shadow-md shadow-amber-600/30 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-2">
                  Role: Caretaker
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Caretaker Companion
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                  Peace of mind for sons, daughters, and guardians. Schedule medications, track daily game activity, and link to family members with ease.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-semibold mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Set & monitor medication schedules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Unique patient linking code (e.g. NER-8K2Q)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Real-time alert on missed tasks or SOS</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/caretaker"
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-center text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>Enter Caretaker Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3. Doctor Portal */}
            <div className="group relative rounded-3xl p-8 bg-gradient-to-b from-blue-50/50 to-white border-2 border-blue-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-ner-brahmaputra text-white flex items-center justify-center mb-6 shadow-md shadow-ner-brahmaputra/30 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mb-2">
                  Role: Doctor / Neurologist
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Doctor Clinical Console
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                  Verified clinician workspace. Track longitudinal cognitive score curves, detect sudden MMSE drops, and review patient medical profiles.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-semibold mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-ner-brahmaputra shrink-0" />
                    <span>Longitudinal cognitive score tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-ner-brahmaputra shrink-0" />
                    <span>License-verified medical practitioner accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-ner-brahmaputra shrink-0" />
                    <span>Automated score drop alerts for intervention</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/doctor"
                className="w-full py-3 px-4 rounded-xl bg-ner-brahmaputra hover:bg-blue-800 text-white font-bold text-center text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>Enter Doctor Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Cultural & Linguistic Alignment Highlights */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Designed for the North Eastern Region (NER)
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              Built ground-up with cultural familiarity, low-bandwidth resilience, and regional linguistic roots
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Cultural Stimuli</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Puzzles and memory prompts centered on Bihu melodies, Kaziranga flora, Mizo cheraw dances, and regional landmarks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Languages className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Regional Dialects</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Architected for Assamese (অসমীয়া), Bodo (बर’), Khasi, Mizo, Nagamese, Hindi, and English.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Low Bandwidth Ready</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Offline-capable API contracts that cache reminders and game sessions locally when hill-station connectivity dips.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Volume2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Accessible Sensory Cues</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                High-contrast visual cues, large fonts, and audio feedback engineered for seniors facing cognitive decline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-ner-tea" />
            <span>AI-Based Cognitive Gaming and Memory Assistance Platform for NER</span>
          </div>
          <div>Smart India Hackathon 2026 Initiative • Role-Based Healthcare Architecture</div>
        </div>
      </footer>
    </div>
  );
};
