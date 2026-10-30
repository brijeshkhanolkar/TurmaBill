import React, { useState } from 'react';
import { Key, ShieldCheck, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppAuth } from '../../context/AuthContext';
import { Modal, Button, Input } from '../ui';

export function ClerkSetupModal() {
  const { isAuthModalOpen, closeAuthModal, clerkKey, setClerkKey, clearClerkKey, isClerkEnabled } = useAppAuth();
  const [inputKey, setInputKey] = useState(clerkKey || '');

  const handleSave = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      toast.error('Please enter a valid Clerk publishable key');
      return;
    }
    if (!trimmed.startsWith('pk_test_') && !trimmed.startsWith('pk_live_')) {
      toast.error('Publishable key must start with pk_test_ or pk_live_');
      return;
    }
    setClerkKey(trimmed);
    toast.success('Clerk publishable key activated! Reloading authentication...');
    closeAuthModal();
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const handleRemove = () => {
    clearClerkKey();
    setInputKey('');
    toast('Clerk key cleared. Switched back to local demo mode.', { icon: 'ℹ️' });
    closeAuthModal();
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title="Clerk Authentication Setup"
      size="md"
      footer={
        <div className="flex justify-between w-full items-center">
          {isClerkEnabled ? (
            <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleRemove}>
              Disconnect Key
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={closeAuthModal}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={handleSave}>
              Save & Activate
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
            <ShieldCheck size={18} className="text-[#C8920A]" />
            Enterprise User & Organization Management
          </div>
          <p className="leading-relaxed text-amber-800">
            Connect your Clerk application to enable secure OAuth logins (Google, Email, Phone OTP), role-based permissions, and commercial APMC account access.
          </p>
        </div>

        <div className="space-y-2">
          <Input
            label="Clerk Publishable Key"
            placeholder="pk_test_... or pk_live_..."
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            helperText="Starts with pk_test_ for development or pk_live_ for production"
          />
        </div>

        <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-2">
          <div className="font-semibold text-gray-700">How to get your free Clerk key:</div>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 pl-1">
            <li>Create or sign in to your free account at <a href="https://dashboard.clerk.com/" target="_blank" rel="noreferrer" className="text-[#C8920A] underline inline-flex items-center gap-0.5">dashboard.clerk.com <ExternalLink size={11} /></a></li>
            <li>Select your application & click <strong>API Keys</strong> in the left sidebar</li>
            <li>Copy the <strong>Publishable key</strong> and paste it above</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
}
