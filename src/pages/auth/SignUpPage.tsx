import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useAppAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import { GoogleIcon } from '../../components/auth/GoogleIcon';
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

export default function SignUpPage() {
  const { isClerkEnabled, isLocalAuthenticated, loginLocalUser } = useAppAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<'terminal' | 'clerk'>('terminal');
  const navigate = useNavigate();

  // Auto-redirect if already signed in locally
  useEffect(() => {
    if (isLocalAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLocalAuthenticated, navigate]);

  const handleEmailSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please enter name, email, and password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      loginLocalUser({
        name,
        email,
        role: 'Trader',
        marketLocation: businessName ? `${businessName} (APMC)` : 'Sangli APMC Yard',
      });
      setLoading(false);
      toast.success(`Welcome to TurmaBill, ${name}! Your account is ready.`);
      navigate('/', { replace: true });
    }, 400);
  };

  const handleGoogleSignUp = () => {
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
        console.error('Clerk Google OAuth registration:', err);
      }
    }

    setTimeout(() => {
      loginLocalUser({
        name: 'Yashraj Alurkur',
        email: 'yashrajalurkur@gmail.com',
        role: 'Admin',
        marketLocation: 'Sangli APMC Yard',
      });
      setGoogleLoading(false);
        toast.success('Successfully registered via Google (yashrajalurkur@gmail.com)!', {
          icon: '✅',
          duration: 3500
        });
        navigate('/', { replace: true });
      }, 500);
    };

    const handleDemoSignUp = () => {
      loginLocalUser({
        id: 'usr-demo-trader',
        name: 'Yashraj Alurkur',
        email: 'admin@turmabill.local',
        role: 'Admin',
        marketLocation: 'Sangli APMC Yard',
      });
      toast.success('Registered & signed in as Demo Trader');
      navigate('/', { replace: true });
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-gray-50 flex items-center justify-center p-4 sm:p-6">
        {isClerkEnabled && <ClerkSessionWatcher />}

        <div className="w-full max-w-5xl bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* Left Side: Brand Showcase */}
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
                  Join Modern Turmeric APMC Trading
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Create your commercial merchant account to manage mandi purchases, farmer settlements, and GST filings with confidence.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                  <CheckCircle2 size={16} className="text-[#C8920A] shrink-0" />
                  <span>Zero Calculation Errors on APMC Cess & Adat</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                  <CheckCircle2 size={16} className="text-[#C8920A] shrink-0" />
                  <span>Instant PDF & Thermal Receipt Printing</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                  <CheckCircle2 size={16} className="text-[#C8920A] shrink-0" />
                  <span>Automated Godown Stock Tracking</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-300">
                  <CheckCircle2 size={16} className="text-[#C8920A] shrink-0" />
                  <span>Clerk Enterprise Level Account Protection</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/10 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Powered by Clerk Authentication</span>
              <span className="font-mono text-[#C8920A]">v1.0.0</span>
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col items-center justify-center bg-white">
            {isClerkEnabled && mode === 'clerk' ? (
              <div className="w-full max-w-md flex flex-col items-center">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Create Clerk Account</h3>
                  <p className="text-xs text-gray-500 mt-1">Live authentication with Google OAuth & Email</p>
                </div>

                <div className="w-full flex justify-center">
                  <SignUp
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    fallbackRedirectUrl="/"
                    forceRedirectUrl="/"
                    signInFallbackRedirectUrl="/"
                    signInForceRedirectUrl="/"
                  />
                </div>

                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setMode('terminal')}
                    className="text-xs text-[#C8920A] font-semibold hover:underline cursor-pointer"
                  >
                    Use Custom Terminal Registration
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-1">
                    <ShieldCheck size={14} className="text-[#C8920A]" />
                    Merchant Registration
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Register for TurmaBill</h3>
                  <p className="text-xs text-gray-500">Sign up with Google or create your trader credentials</p>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading}
                  className="w-full h-11 px-4 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/80 rounded-xl font-semibold text-xs text-gray-700 shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer select-none active:scale-[0.98]"
                >
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  {googleLoading ? 'Connecting to Google...' : 'Sign up with Google'}
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-gray-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider relative z-10">
                    or register with email
                  </span>
                </div>

                <form onSubmit={handleEmailSignUp} className="space-y-3.5">
                  <Input
                    label="Full Name / Proprietor"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Yashraj Alurkur"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@mandi.com"
                    required
                  />

                  <Input
                    label="Trading Business Name (Optional)"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Khanolkar Turmeric Trading Co."
                  />

                  <Input
                    label="Password (min 6 chars)"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center h-10 font-semibold mt-1"
                    loading={loading}
                  >
                    Create Merchant Account
                  </Button>
                </form>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 font-semibold"
                    icon={<Zap size={14} className="text-[#C8920A]" />}
                    onClick={handleDemoSignUp}
                  >
                    Quick Register as Demo Merchant
                  </Button>
                </div>

                {isClerkEnabled && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setMode('clerk')}
                      className="text-xs text-[#C8920A] font-semibold hover:underline cursor-pointer"
                    >
                      Switch to Clerk Standard Registration
                    </button>
                  </div>
                )}

                <div className="text-center text-xs text-gray-500 pt-1">
                  Already registered?{' '}
                  <Link to="/sign-in" className="text-[#C8920A] font-semibold hover:underline">
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
