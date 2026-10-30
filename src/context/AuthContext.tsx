import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfileInfo {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Trader' | 'Billing Operator';
  avatar?: string;
  marketLocation: string;
}

interface AuthContextType {
  clerkKey: string | null;
  isClerkEnabled: boolean;
  currentUser: UserProfileInfo;
  demoUser: UserProfileInfo;
  isLocalAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setClerkKey: (key: string) => void;
  clearClerkKey: () => void;
  loginLocalUser: (user?: Partial<UserProfileInfo>) => void;
  logoutLocalUser: () => void;
}

const DEFAULT_DEMO_USER: UserProfileInfo = {
  id: 'usr-demo-trader',
  name: 'Brijesh Khanolkar',
  email: 'admin@turmabill.local',
  role: 'Admin',
  marketLocation: 'Sangli APMC Yard',
};

const AuthContext = createContext<AuthContextType>({
  clerkKey: null,
  isClerkEnabled: false,
  currentUser: DEFAULT_DEMO_USER,
  demoUser: DEFAULT_DEMO_USER,
  isLocalAuthenticated: false,
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  setClerkKey: () => {},
  clearClerkKey: () => {},
  loginLocalUser: () => {},
  logoutLocalUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clerkKey, setClerkKeyState] = useState<string | null>(() => {
    const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (envKey && envKey.trim() && (envKey.startsWith('pk_test_') || envKey.startsWith('pk_live_')) && !envKey.includes('your_clerk_publishable_key')) {
      return envKey.trim();
    }
    const local = localStorage.getItem('turmabill_clerk_pub_key');
    if (local && (local.startsWith('pk_test_') || local.startsWith('pk_live_'))) {
      return local.trim();
    }
    return null;
  });

  const [localUser, setLocalUser] = useState<UserProfileInfo | null>(() => {
    try {
      const stored = localStorage.getItem('turmabill_user_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse local user session:', e);
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isClerkEnabled = Boolean(
    clerkKey && 
    (clerkKey.startsWith('pk_test_') || clerkKey.startsWith('pk_live_')) &&
    !clerkKey.includes('your_clerk_publishable_key')
  );

  const isLocalAuthenticated = Boolean(localUser);

  const setClerkKey = (key: string) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('turmabill_clerk_pub_key', trimmed);
      setClerkKeyState(trimmed);
    }
  };

  const clearClerkKey = () => {
    localStorage.removeItem('turmabill_clerk_pub_key');
    setClerkKeyState(null);
  };

  const loginLocalUser = (userInfo?: Partial<UserProfileInfo>) => {
    const userToSave: UserProfileInfo = {
      id: userInfo?.id || `usr-${Date.now()}`,
      name: userInfo?.name || (userInfo?.email ? userInfo.email.split('@')[0] : DEFAULT_DEMO_USER.name),
      email: userInfo?.email || DEFAULT_DEMO_USER.email,
      role: userInfo?.role || 'Admin',
      marketLocation: userInfo?.marketLocation || 'Sangli APMC Yard',
      avatar: userInfo?.avatar,
    };
    try {
      localStorage.setItem('turmabill_user_session', JSON.stringify(userToSave));
    } catch (e) {
      console.error('Failed to save user session to localStorage', e);
    }
    setLocalUser(userToSave);
  };

  const logoutLocalUser = () => {
    try {
      localStorage.removeItem('turmabill_user_session');
    } catch (e) {
      console.error('Failed to remove user session', e);
    }
    setLocalUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        clerkKey,
        isClerkEnabled,
        currentUser: localUser || DEFAULT_DEMO_USER,
        demoUser: DEFAULT_DEMO_USER,
        isLocalAuthenticated,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        setClerkKey,
        clearClerkKey,
        loginLocalUser,
        logoutLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAppAuth = () => useContext(AuthContext);
