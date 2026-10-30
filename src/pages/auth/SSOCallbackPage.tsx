import React from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useAppAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SSOCallbackPage() {
  const { isClerkEnabled } = useAppAuth();
  const navigate = useNavigate();

  if (isClerkEnabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <AuthenticateWithRedirectCallback 
          afterSignInUrl="/"
          afterSignUpUrl="/"
        />
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl animate-pulse">
          🌾
        </div>
        <p className="mt-4 text-xs font-semibold text-gray-700">Completing Google authentication…</p>
        <p className="text-[11px] text-gray-400 mt-1">Please wait while we establish your secure session</p>
      </div>
    );
  }

  // Fallback redirect if invoked in demo mode
  React.useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
}
