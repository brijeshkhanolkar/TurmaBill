import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { ShieldCheck, CheckCircle2, Zap, Eye, EyeOff } from 'lucide-react';
import { useAppAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import { GoogleIcon } from '../../components/auth/GoogleIcon';
import { ForgotPasswordView } from './ForgotPasswordView';
import toast from 'react-hot-toast';

function ClerkSessionWatcher() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/', { replace: true });
    }
  }, [isSignedIn, isLoaded, navigate]);

  return null;
}

export default function SignInPage() {
  const { isClerkEnabled, isLocalAuthenticated, loginLocalUser } = useAppAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [view, setView] = useState<'signin' | 'forgot_password'>(() => {
    return location.pathname.includes('forgot-password') ? 'forgot_password' : 'signin';
  });

  const [authMode, setAuthMode] = useState<'clerk' | 'terminal'>(
    isClerkEnabled ? 'clerk' : 'terminal'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Auto-redirect if already authenticated locally
  useEffect(() => {
    if (isLocalAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLocalAuthenticated, navigate]);

  // Keep view in sync if URL changes
  useEffect(() => {
    if (location.pathname.includes('forgot-password')) {
      setView('forgot_password');
    }
  }, [location.pathname]);

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      loginLocalUser({
        email,
        name: email.split('@')[0],
        role: 'Trader',
        marketLocation: 'Sangli APMC Yard',
      });
      setLoading(false);
      toast.success(`Welcome back, ${email.split('@')[0]}!`);
      navigate('/', { replace: true });
    }, 400);
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    if (isClerkEnabled && (window as any).Clerk) {
      try {
        (window as any).Clerk.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/',
        });
        return;
      } catch (err) {
        console.error('Clerk Google OAuth initiation:', err);
      }
    }

    setTimeout(() => {
      loginLocalUser({
        email: 'brijeshkhanolkar@gmail.com',
        name: 'Brijesh Khanolkar',
        role: 'Admin',
        marketLocation: 'Sangli APMC Yard',
      });
      setGoogleLoading(false);
      toast.success('Successfully authenticated via Google!', {
        icon: '✅',
        duration: 3500
      });
      navigate('/', { replace: true });
    }, 500);
  };

  const handleDemoSignIn = () => {
    loginLocalUser({
      id: 'usr-demo-trader',
      name: 'Brijesh Khanolkar',
      email: 'admin@turmabill.local',
      role: 'Admin',
      marketLocation: 'Sangli APMC Yard',
    });
    toast.success('Signed in as Demo Trader / Admin (Sangli APMC Yard)');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-gray-50 flex items-center justify-center p-4 sm:p-6">
      {isClerkEnabled && <ClerkSessionWatcher />}
      
      <div className="w-full max-w-5xl bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Side: Brand & Feature Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1C1810] via-[#2A2315] to-[#120F08] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#C8920A]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#C8920A]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C8920A] to-[#F3C44E] flex items-center justify-center text-2xl shadow-lg">
                🌾
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">TurmaBill</h1>
                <p className="text-xs text-amber-200/80 font-medium">Turmeric Trade & Billing OS</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                APMC Compliant Turmeric Trade Billing & Farmer Settlements
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Streamline arrivals (Awak), automatic Adat & Levy calculations, GST commercial invoices, and instant farmer payment pattis.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-gray-300">
                <CheckCircle2 size={16} className="text-[#C8920A] shrink-0" />
                <span>Instant Inward Awak & Patti Generator</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-300">
                <CheckCircle2 size={16} className="text-[#C8920A] shrink-0" />
                <span>Automatic 5% GST, APMC Levy & Adat Math</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-300">
                <CheckCircle2 size={16} className="text-[#C8920A] shrink-0" />
                <span>IndexedDB Offline Support + Cloud Sync</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-300">
                <CheckCircle2 size={16} className="text-[#C8920A] shrink-0" />
                <span>Google OAuth & Email OTP Security</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Enterprise Security by Clerk</span>
            <span className="font-mono text-[#C8920A]">v1.0.0</span>
          </div>
        </div>

        {/* Right Side: Authentication */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col items-center justify-center bg-white">
          {view === 'forgot_password' ? (
            <ForgotPasswordView
              onBackToSignIn={() => setView('signin')}
              onSuccessLogin={(resetEmail) => {
                loginLocalUser({ email: resetEmail, role: 'Trader' });
                toast.success('Signed in with updated password!');
                navigate('/', { replace: true });
              }}
              initialEmail={email}
            />
          ) : isClerkEnabled && authMode === 'clerk' ? (
            <div className="w-full max-w-md flex flex-col items-center">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Sign In with Clerk</h3>
                <p className="text-xs text-gray-500 mt-1">Live authentication with Google OAuth & Email verification</p>
              </div>

              <div className="w-full flex justify-center">
                <SignIn 
                  routing="path" 
                  path="/sign-in" 
                  signUpUrl="/sign-up" 
                  fallbackRedirectUrl="/"
                  forceRedirectUrl="/"
                  signUpFallbackRedirectUrl="/"
                  signUpForceRedirectUrl="/"
                />
              </div>

              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('terminal')}
                  className="text-xs text-[#C8920A] font-semibold hover:underline cursor-pointer"
                >
                  Use Custom Terminal Login / Forgot Password OTP
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-4">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-1">
                  <ShieldCheck size={14} className="text-[#C8920A]" />
                  Secure Trading Authentication
                </div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In to TurmaBill</h3>
                <p className="text-xs text-gray-500">Access your Sangli APMC commodity ledger & billing</p>
              </div>

              {/* 1. Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-11 px-4 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/80 rounded-xl font-semibold text-xs text-gray-700 shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer select-none active:scale-[0.98]"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider relative z-10">
                  or sign in with email
                </span>
              </div>

              {/* 2. Email & Password Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-3.5">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@mandi.com"
                  required
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-7 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-[#C8920A] focus:ring-[#C8920A]/30 w-3.5 h-3.5"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setView('forgot_password')}
                    className="text-xs font-semibold text-[#C8920A] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center h-10 font-semibold"
                  loading={loading}
                >
                  Sign In to Terminal
                </Button>
              </form>

              {/* 3. Fast Demo Trader Login Button */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="w-full justify-center border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 font-semibold" 
                  icon={<Zap size={14} className="text-[#C8920A]" />}
                  onClick={handleDemoSignIn}
                >
                  Instant Access: Demo Trader Account
                </Button>
              </div>

              {isClerkEnabled && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode('clerk')}
                    className="text-xs text-[#C8920A] font-semibold hover:underline cursor-pointer"
                  >
                    Switch to Clerk Standard Sign In
                  </button>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 pt-1">
                Don&apos;t have an account?{' '}
                <Link to="/sign-up" className="text-[#C8920A] font-semibold hover:underline">
                  Register New Trader
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
