import React from 'react';
import { UserProfile } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Shield, Building2, Key, CheckCircle2 } from 'lucide-react';
import { useAppAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';

export default function UserProfilePage() {
  const { isClerkEnabled, demoUser, openAuthModal, clerkKey } = useAppAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-900"
          >
            Dashboard
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Account Profile & Security</h1>
            <p className="text-xs text-gray-500">Manage your trader identity, credentials, and Clerk authentication</p>
          </div>
        </div>
      </div>

      {isClerkEnabled ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 overflow-hidden flex justify-center">
          <UserProfile routing="path" path="/user-profile" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-6 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#C8920A] to-[#F3C44E] text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {demoUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{demoUser.name}</h2>
              <p className="text-xs text-gray-500">{demoUser.email}</p>
              <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {demoUser.role}
              </span>
            </div>

            <div className="w-full pt-4 border-t border-gray-100 text-left text-xs space-y-3">
              <div className="flex items-center gap-2.5 text-gray-600">
                <Building2 size={15} className="text-gray-400 shrink-0" />
                <span>{demoUser.marketLocation}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Shield size={15} className="text-gray-400 shrink-0" />
                <span>Full APMC Trading Access</span>
              </div>
            </div>
          </div>

          {/* Details & Clerk Status */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-[#C8920A]" />
                  <h3 className="font-bold text-sm text-gray-900">Authentication Status</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Demo Session
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                You are currently running TurmaBill in local developer mode. To enable Google OAuth, Magic Links, and multi-user login for your staff and accountants, connect your Clerk Publishable Key.
              </p>

              <div className="pt-2">
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon={<Key size={14} />}
                  onClick={openAuthModal}
                >
                  Configure Clerk Authentication
                </Button>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100">
                Trading Terminal Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Session Identifier</span>
                  <span className="font-mono text-gray-800 font-semibold">{demoUser.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Trading License / Mandi Code</span>
                  <span className="font-mono text-gray-800 font-semibold">MH-SANGLI-TUR-2026</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Database Persistence</span>
                  <span className="text-emerald-700 font-semibold">IndexedDB Local + Cloud Ready</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">App Version</span>
                  <span className="font-mono text-gray-800 font-semibold">TurmaBill v1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
