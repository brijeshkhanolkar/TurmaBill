import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, Lock, Eye, EyeOff, RotateCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '../../components/ui';

interface ForgotPasswordViewProps {
  onBackToSignIn: () => void;
  onSuccessLogin?: (email: string) => void;
  initialEmail?: string;
}

export function ForgotPasswordView({ onBackToSignIn, onSuccessLogin, initialEmail = '' }: ForgotPasswordViewProps) {
  const [step, setStep] = useState<'request_otp' | 'verify_otp' | 'success'>('request_otp');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (step === 'verify_otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const generateRandomOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const code = generateRandomOtp();
      setGeneratedOtp(code);
      setLoading(false);
      setStep('verify_otp');
      setResendCooldown(60);
      setCanResend(false);
      toast.success(`Verification OTP sent to ${email}! (Code: ${code})`, {
        duration: 8000,
        icon: '📬'
      });
    }, 600);
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    const code = generateRandomOtp();
    setGeneratedOtp(code);
    setResendCooldown(60);
    setCanResend(false);
    toast.success(`New OTP code sent! (Code: ${code})`, {
      duration: 8000,
      icon: '📬'
    });
  };

  const handleVerifyAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }
    if (otp.trim() !== generatedOtp && otp.trim() !== '123456') {
      toast.error('Invalid OTP code. Please enter the code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      toast.success('Password reset successfully! You can now sign in.');
    }, 800);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {step === 'request_otp' && (
        <div className="space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-2">
              <KeyRound size={14} className="text-[#C8920A]" />
              Account Recovery
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Forgot Password?</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your registered trader email address and we will dispatch a secure 6-digit verification OTP.
            </p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yashraj@turmabill.com"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center h-10 font-semibold"
              loading={loading}
              icon={<Mail size={16} />}
            >
              Send Verification OTP
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onBackToSignIn}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <ArrowLeft size={13} /> Back to Sign In
            </button>
          </div>
        </div>
      )}

      {step === 'verify_otp' && (
        <div className="space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold mb-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              OTP Verification
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Enter Verification Code</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We have sent a 6-digit OTP code to <strong className="text-gray-800">{email}</strong>
            </p>
          </div>

          {/* OTP Preview Callout Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-[#C8920A] shrink-0" />
              <span>Simulated Email OTP Code:</span>
            </div>
            <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-950">
              {generatedOtp || '123456'}
            </span>
          </div>

          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full h-11 text-center font-mono text-xl tracking-[0.5em] font-bold border border-gray-200 rounded-xl focus:border-[#C8920A] focus:ring-2 focus:ring-[#C8920A]/20 focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-7 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center h-10 font-semibold"
              loading={loading}
              icon={<Lock size={15} />}
            >
              Verify OTP & Reset Password
            </Button>
          </form>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={onBackToSignIn}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              <ArrowLeft size={13} /> Cancel
            </button>

            {canResend ? (
              <button
                onClick={handleResendOtp}
                className="inline-flex items-center gap-1 font-semibold text-[#C8920A] hover:underline cursor-pointer"
              >
                <RotateCw size={13} /> Resend OTP
              </button>
            ) : (
              <span className="text-gray-400 font-mono">
                Resend code in {resendCooldown}s
              </span>
            )}
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Password Reset Complete!</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              Your password has been securely updated. You can enter your trading dashboard immediately or sign in with your new credentials.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              className="w-full justify-center h-10 font-semibold"
              onClick={() => {
                if (onSuccessLogin) {
                  onSuccessLogin(email);
                } else {
                  onBackToSignIn();
                }
              }}
            >
              Enter Trading Dashboard Now
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-center h-9 text-xs font-semibold text-gray-700"
              onClick={onBackToSignIn}
            >
              Back to Sign In Form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
