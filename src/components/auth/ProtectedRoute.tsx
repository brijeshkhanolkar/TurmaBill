import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAppAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isClerkEnabled, isLocalAuthenticated } = useAppAuth();

  // If locally authenticated (via terminal login, Google fallback, or demo trader), grant access
  if (isLocalAuthenticated) {
    return <>{children}</>;
  }

  // If Clerk is not enabled, allow access with demo admin
  if (!isClerkEnabled) {
    return <>{children}</>;
  }

  return <ClerkProtected>{children}</ClerkProtected>;
};

function ClerkProtected({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLocalAuthenticated } = useAppAuth();
  const location = useLocation();

  if (isLocalAuthenticated) {
    return <>{children}</>;
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl animate-pulse">
          🌾
        </div>
        <p className="mt-3 text-xs text-gray-500 font-medium">Verifying TurmaBill session…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
