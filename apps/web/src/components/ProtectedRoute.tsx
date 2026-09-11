import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '@ner/types';
import { useAuth } from '../context/AuthContext.js';

interface ProtectedRouteProps {
  requiredRole: Role;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-ner-tea border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (role !== requiredRole) {
    return (
      <Navigate
        to={`/unauthorized?required=${requiredRole}&current=${role || 'none'}`}
        replace
      />
    );
  }

  return <>{children}</>;
};
