import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  UserPlus,
  Users,
  HeartPulse,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { DementiaStage, RegionalLanguage, SUPPORTED_LANGUAGES } from '@ner/types';

export const SignupPage: React.FC = () => {
  const { registerCaretaker, registerDoctor, registerPatientByCaretaker, getRoleHomeUrl } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role');

  const [activeTab, setActiveTab] = useState<'caretaker' | 'patient' | 'doctor'>(() => {
    if (initialRoleParam === 'patient' || initialRoleParam === 'doctor' || initialRoleParam === 'caretaker') {
      return initialRoleParam;
    }
    return 'caretaker';
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Common user fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<RegionalLanguage>('en');

  // Caretaker specific fields
  const [relationship, setRelationship] = useState('Daughter/Son');
  const [caretakerMode, setCaretakerMode] = useState<'create_new' | 'join_existing' | 'none'>('create_new');
  const [inviteCode, setInviteCode] = useState('');

  // Patient profile fields
  const [patientName, setPatientName] = useState('');
  const [patientDob, setPatientDob] = useState('1952-04-15');
  const [dementiaStage, setDementiaStage] = useState<DementiaStage>('mild');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Doctor specific fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('Neurologist / Geriatrician');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (activeTab === 'caretaker') {
        const response = await registerCaretaker({
          name,
          email,
          phone,
          password,
          preferredLanguage,
          relationship,
          patientOption: caretakerMode !== 'none' ? caretakerMode : undefined,
          ...(caretakerMode === 'join_existing' ? { inviteCode } : {}),
          ...(caretakerMode === 'create_new'
            ? {
                patientDetails: {
                  name: patientName || `${name}'s Parent/Ward`,
                  phone: phone,
                  dateOfBirth: patientDob,
                  dementiaStage,
                  emergencyContact: emergencyContact || phone,
                  preferredLanguage,
                  relationship,
                },
              }
            : {}),
        });
        setSuccessMessage('Caretaker account registered successfully!');
        setTimeout(() => navigate(getRoleHomeUrl('caretaker')), 1200);
      } else if (activeTab === 'doctor') {
        if (!licenseNumber.trim()) {
          throw new Error('Medical License / Registration Number is required for doctor accounts.');
        }
        const response = await registerDoctor({
          name,
          email,
          phone,
          password,
          preferredLanguage,
          licenseNumber: licenseNumber.trim(),
          specialization,
        });
        setSuccessMessage('Doctor account registered! Verification status: Pending Admin Review.');
        setTimeout(() => navigate(getRoleHomeUrl('doctor')), 1200);
      } else if (activeTab === 'patient') {
        const response = await registerPatientByCaretaker({
          name,
          email: email || undefined,
          phone,
          password: password || undefined,
          dateOfBirth: patientDob,
          dementiaStage,
          emergencyContact: emergencyContact || phone,
          preferredLanguage,
        });
        setSuccessMessage('Patient account registered successfully!');
        setTimeout(() => navigate(getRoleHomeUrl('patient')), 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check form fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ner-tea to-ner-forest text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-ner-tea/30">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Register for NER Dementia Platform
          </h1>
          <p className="text-slate-600 text-sm mt-2 font-medium">
            Select your role below to start with the appropriate profile
          </p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('caretaker')}
            className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              activeTab === 'caretaker'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Caretaker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('patient')}
            className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              activeTab === 'patient'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doctor')}
            className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
              activeTab === 'doctor'
                ? 'bg-ner-brahmaputra text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Registration Issue</p>
              <p className="mt-0.5 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Success!</p>
              <p className="mt-0.5 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Base Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priyam Baruah"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-ner-tea focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-ner-tea focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-ner-tea focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password {activeTab === 'patient' ? '(Optional)' : '*'}
              </label>
              <input
                type="password"
                required={activeTab !== 'patient'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-ner-tea focus:outline-none"
              />
            </div>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Preferred Regional Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as RegionalLanguage)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-ner-tea focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name} - {lang.region})
                </option>
              ))}
            </select>
          </div>

          {/* Tab Specific Extra Fields */}
          {activeTab === 'caretaker' && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4">
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                Caretaker Relationship & Patient Setup
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relationship to Patient
                  </label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Son, Daughter, Professional Nurse"
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient Link Option
                  </label>
                  <select
                    value={caretakerMode}
                    onChange={(e) => setCaretakerMode(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-sm bg-white font-medium"
                  >
                    <option value="create_new">Register a new patient profile now</option>
                    <option value="join_existing">I have a patient invite code (NER-XXXX)</option>
                    <option value="none">Link patient later from dashboard</option>
                  </select>
                </div>
              </div>

              {caretakerMode === 'join_existing' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter Patient Invite Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SMT-9X4K"
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-sm bg-white uppercase font-mono tracking-wider font-bold"
                  />
                </div>
              )}

              {caretakerMode === 'create_new' && (
                <div className="pt-2 border-t border-amber-200 space-y-3">
                  <p className="text-xs font-bold text-amber-900">
                    Patient Profile Details:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Patient Name
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Patient Full Name"
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-200 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Dementia Stage
                      </label>
                      <select
                        value={dementiaStage}
                        onChange={(e) => setDementiaStage(e.target.value as DementiaStage)}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-200 text-xs bg-white"
                      >
                        <option value="early">Early Stage</option>
                        <option value="mild">Mild Stage</option>
                        <option value="moderate">Moderate Stage</option>
                        <option value="severe">Severe Stage</option>
                        <option value="unspecified">Unspecified / Initial Assessment</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'patient' && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-4">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                Elderly Patient Health Profile
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={patientDob}
                    onChange={(e) => setPatientDob(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dementia Stage
                  </label>
                  <select
                    value={dementiaStage}
                    onChange={(e) => setDementiaStage(e.target.value as DementiaStage)}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-sm bg-white font-medium"
                  >
                    <option value="early">Early Stage</option>
                    <option value="mild">Mild Stage</option>
                    <option value="moderate">Moderate Stage</option>
                    <option value="severe">Severe Stage</option>
                    <option value="unspecified">Unspecified / Under Evaluation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Emergency Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Caretaker or family member's phone number"
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-sm bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'doctor' && (
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-4">
              <h4 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-ner-brahmaputra" />
                Medical Credential Verification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medical Council Reg. / License No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MCI-NER-49201"
                    className="w-full px-3.5 py-2 rounded-xl border border-blue-200 text-sm bg-white font-mono uppercase"
                  />
                  <span className="text-[11px] text-blue-600 font-medium">
                    Verified against state medical registers. Account status will be "Pending Verification".
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medical Specialization
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Neurologist, Neuropsychiatrist, Geriatrician"
                    className="w-full px-3.5 py-2 rounded-xl border border-blue-200 text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-4 rounded-xl text-white font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              activeTab === 'caretaker'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : activeTab === 'doctor'
                ? 'bg-ner-brahmaputra hover:bg-blue-800 shadow-blue-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Complete {activeTab.toUpperCase()} Registration</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-600 font-medium">
          Already registered?{' '}
          <Link
            to="/login"
            className="text-ner-tea hover:text-ner-forest font-bold underline"
          >
            Sign in to existing account
          </Link>
        </div>
      </div>
    </div>
  );
};
