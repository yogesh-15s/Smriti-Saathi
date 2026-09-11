import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard.js';
import { DoctorPatientDetail } from './pages/doctor/DoctorPatientDetail.js';
import { DoctorMessages } from './pages/doctor/DoctorMessages.js';
import { UnauthorizedPage } from './pages/UnauthorizedPage.js';

// Patient Portal Components
import { PatientLayout } from './pages/patient/PatientLayout.js';
import { PatientHome } from './pages/patient/PatientHome.js';
import { PatientGames } from './pages/patient/PatientGames.js';
import { PatientReminders } from './pages/patient/PatientReminders.js';
import { PatientPhotos } from './pages/patient/PatientPhotos.js';

// Caretaker Portal Components
import { CaretakerHome } from './pages/caretaker/CaretakerHome.js';
import { CaretakerPatientDetail } from './pages/caretaker/CaretakerPatientDetail.js';
import { CaretakerMessages } from './pages/caretaker/CaretakerMessages.js';
import { CaretakerInvites } from './pages/caretaker/CaretakerInvites.js';
import { CaretakerNotifications } from './pages/caretaker/CaretakerNotifications.js';

/**
 * Standard Layout wrapper with Navbar
 * Note: Patient portal uses its own dedicated PatientLayout without standard navbar
 */
const StandardLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Outlet />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Dedicated Simplified Patient Portal (No navbar, no menus, discrete corner controls) */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientHome />} />
          <Route path="games" element={<PatientGames />} />
          <Route path="reminders" element={<PatientReminders />} />
          <Route path="photos" element={<PatientPhotos />} />
        </Route>

        {/* 2. Standard Layout Pages (Public, Caretaker, Doctor) */}
        <Route element={<StandardLayout />}>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Caretaker Portal */}
          <Route
            path="/caretaker"
            element={
              <ProtectedRoute requiredRole="caretaker">
                <CaretakerHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caretaker/patient/:id"
            element={
              <ProtectedRoute requiredRole="caretaker">
                <CaretakerPatientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caretaker/patient/:id/messages"
            element={
              <ProtectedRoute requiredRole="caretaker">
                <CaretakerMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caretaker/invites"
            element={
              <ProtectedRoute requiredRole="caretaker">
                <CaretakerInvites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caretaker/notifications"
            element={
              <ProtectedRoute requiredRole="caretaker">
                <CaretakerNotifications />
              </ProtectedRoute>
            }
          />

          {/* Doctor Portal */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patient/:id"
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorPatientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patient/:id/messages"
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorMessages />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
