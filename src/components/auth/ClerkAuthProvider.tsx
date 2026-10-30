import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { useAppAuth } from '../../context/AuthContext';

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

export const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#C8920A',
    colorText: '#111827',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#111827',
    borderRadius: '0.75rem',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  elements: {
    card: 'shadow-xl border border-gray-100 rounded-2xl p-6 sm:p-8',
    headerTitle: 'text-gray-900 font-bold text-xl tracking-tight',
    headerSubtitle: 'text-gray-500 text-xs mt-1',
    socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl h-10',
    formButtonPrimary: 'bg-[#C8920A] hover:bg-[#B38008] text-white font-semibold rounded-xl h-10 transition-colors shadow-sm',
    formFieldInput: 'border-gray-200 rounded-lg text-sm focus:border-[#C8920A] focus:ring-2 focus:ring-[#C8920A]/20 h-10',
    formFieldLabel: 'text-xs font-semibold text-gray-700',
    footerActionLink: 'text-[#C8920A] hover:text-[#B38008] font-semibold text-xs',
    dividerLine: 'bg-gray-100',
    dividerText: 'text-xs text-gray-400 font-medium',
  },
};

export const ClerkAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  const { clerkKey, isClerkEnabled } = useAppAuth();

  if (isClerkEnabled && clerkKey) {
    return (
      <ClerkProvider 
        publishableKey={clerkKey}
        appearance={CLERK_APPEARANCE}
      >
        {children}
      </ClerkProvider>
    );
  }

  // Fallback when Clerk publishable key is not yet set
  return <>{children}</>;
};
