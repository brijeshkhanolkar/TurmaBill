import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { User, LogOut, Settings, Key, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAppAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function UserMenu() {
  const { isClerkEnabled } = useAppAuth();

  if (isClerkEnabled) {
    return <ClerkOrLocalUserMenu />;
  }

  return <LocalUserDropdown />;
}

function ClerkOrLocalUserMenu() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <UserButton 
          afterSignOutUrl="/sign-in"
          fallbackRedirectUrl="/sign-in"
          userProfileMode="navigation"
          userProfileUrl="/user-profile"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8 rounded-full border border-amber-200/80 shadow-xs ring-2 ring-[#C8920A]/20',
            }
          }}
        />
      </div>
    );
  }

  return <LocalUserDropdown />;
}

function LocalUserDropdown() {
  const { currentUser, isClerkEnabled, openAuthModal, logoutLocalUser } = useAppAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    logoutLocalUser();
    toast.success('Signed out of TurmaBill');
    navigate('/sign-in', { replace: true });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-gray-200 hover:border-gray-300 bg-white shadow-xs transition-all cursor-pointer select-none"
        title="Account & Authentication"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C8920A] to-[#E5A91A] text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {currentUser.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden lg:flex flex-col text-left">
          <span className="text-xs font-semibold text-gray-800 leading-tight">{currentUser.name}</span>
          <span className="text-[10px] text-gray-500 leading-tight">{currentUser.role}</span>
        </div>
        <ChevronDown size={12} className="text-gray-400 ml-0.5" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 border-b border-gray-100">
            <div className="font-bold text-sm text-gray-900">{currentUser.name}</div>
            <div className="text-xs text-gray-500 truncate">{currentUser.email}</div>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8920A]" />
              {currentUser.marketLocation}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/user-profile');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer text-left"
            >
              <User size={14} className="text-gray-400" />
              Account Profile
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer text-left"
            >
              <Settings size={14} className="text-gray-400" />
              Market Settings & Charges
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                openAuthModal();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#C8920A] hover:bg-amber-50 rounded-xl transition-colors cursor-pointer text-left"
            >
              <Key size={14} className="text-[#C8920A]" />
              {isClerkEnabled ? 'Configure Clerk Key' : 'Connect Clerk Auth'}
            </button>
          </div>

          <div className="pt-1 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
            >
              <LogOut size={14} className="text-rose-500" />
              Sign Out / Switch User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
