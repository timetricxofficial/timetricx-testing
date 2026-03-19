'use client';
import { useState, useEffect, Suspense } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useToast } from '../../../../contexts/ToastContext';
import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import Loading from '../../../../components/ui/Loading';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function SignupContent() {
  const { theme } = useTheme();
  const { success, error } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [userData, setUserData] = useState({
    fullName: '',
    profilePicture: '' as File | string,
    githubId: '',
    shift: 'day'
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [signupEmail, setSignupEmail] = useState('');

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  useEffect(() => {
    const step = searchParams.get('step');
    const authSuccess = searchParams.get('auth_success');

    // Recover state from localStorage if returning from OAuth
    const savedEmail = localStorage.getItem('signup_email');
    const savedToken = localStorage.getItem('signup_token');
    const savedName = localStorage.getItem('signup_name');

    if (savedEmail) setSignupEmail(savedEmail);
    if (savedToken) setUserToken(savedToken);
    if (savedName) setUserData(prev => ({ ...prev, fullName: savedName }));

    if (step === 'google' || authSuccess === 'google') {
      setShowGoogleModal(true);
    } else if (step === 'profile' || step === 'github') {
      setShowProfileModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const authError = searchParams.get('auth_error');
    if (authError) {
      error(authError === 'account_not_exists' ? 'Account not found. Please register first.' : 'Auth failed: ' + authError);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!otpCooldown) return;
    const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleEmailSignup = async () => {
    if (!emailInput || !passwordInput || !confirmPasswordInput) {
      error('Please fill in all fields');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Cookies.set('user', JSON.stringify(data.data.user), { expires: 365 });
        Cookies.set('token', data.data.token, { expires: 365 });

        // Persist for flow recovery
        localStorage.setItem('signup_email', emailInput);
        localStorage.setItem('signup_token', data.data.token);

        success('Signup successful! Verify your email');
        setSignupEmail(emailInput);
        setUserToken(data.data.token);
        setShowOtpModal(true);
      } else {
        error(data.message || 'Signup failed');
      }
    } catch (e) {
      error('Service error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      error('Please enter complete OTP');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ email: signupEmail, otp: code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success('Verification successful!');
        setShowOtpModal(false);
        setShowGoogleModal(true);
      } else {
        error(data.message || 'Verification failed');
      }
    } catch (e) {
      error('Verification error');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    setIsProfileLoading(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          email: signupEmail,
          name: userData.fullName,
          githubId: userData.githubId,
          shift: userData.shift
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Cleanup
        localStorage.removeItem('signup_email');
        localStorage.removeItem('signup_token');
        localStorage.removeItem('signup_name');

        success('Profile updated! Welcome to Timetricx');
        router.replace('/users/dashboard');
      } else {
        error(data.message || 'Update failed');
      }
    } catch (e) {
      error('Update error');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleGoogleLogin = (isConnect = false) => {
    const redirect = isConnect ? '/landing/auth/signup?step=profile' : '/users/dashboard';
    const mode = isConnect ? 'connect' : 'login';
    const state = JSON.stringify({ mode, redirect, email: signupEmail });
    window.location.href = `/api/auth/google?state=${encodeURIComponent(state)}`;
  };

  const handleGitHubLogin = async (isConnect = false) => {
    // Save name before redirecting
    if (userData.fullName) {
      localStorage.setItem('signup_name', userData.fullName);

      // Also try to save to DB if we have a token
      if (userToken) {
        try {
          await fetch('/api/auth/update-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
              email: signupEmail,
              name: userData.fullName,
              shift: userData.shift
            }),
          });
        } catch (e) {
          console.error("Failed to save name before GitHub redirect", e);
        }
      }
    }
    const redirect = '/users/dashboard';
    const mode = isConnect ? 'connect' : 'login';
    const state = JSON.stringify({ mode, redirect, email: signupEmail });
    window.location.href = `/api/auth/github?state=${encodeURIComponent(state)}`;
  };

  const handleLoginRedirect = () => {
    router.push('/landing/auth/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen grid grid-cols-1 md:grid-cols-2 ${theme === 'dark' ? 'bg-black text-white' : 'bg-[#fcfcff] text-black'} font-sans overflow-hidden transition-colors duration-500`}
    >

      {isLoading && <Loading fullPage hideAnimation text="Creating account..." />}

      {/* LEFT SIDE - FORM (Slides in from left) */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className={`flex flex-col items-center justify-center p-8 md:p-12 ${theme === 'dark' ? 'bg-black' : 'bg-white'} order-2 md:order-1 relative`}
      >
        {/* Mobile Logo */}
        <div className="md:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full border-2 ${theme === 'dark' ? 'border-white' : 'border-black'} flex items-center justify-center`}>
            <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}></div>
          </div>
          <span className="text-lg font-bold">Timetricx</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold mb-3">Create Account</h2>
            <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>Join Timetricx and optimize your productivity.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGoogleLogin(false)}
                className={`flex items-center justify-center gap-3 py-3.5 rounded-2xl ${theme === 'dark' ? 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]' : 'bg-gray-50 border-gray-200 hover:bg-white'} border transition-all font-bold text-sm`}
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Google
              </button>
              <button
                onClick={() => handleGitHubLogin(false)}
                className={`flex items-center justify-center gap-3 py-3.5 rounded-2xl ${theme === 'dark' ? 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]' : 'bg-gray-50 border-gray-200 hover:bg-white'} border transition-all font-bold text-sm`}
              >
                <img src="https://github.com/favicon.ico" className={`w-4 h-4 ${theme === 'dark' ? 'invert' : ''}`} alt="Github" />
                GitHub
              </button>
            </div>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${theme === 'dark' ? 'border-[#222]' : 'border-gray-100'}`}></div></div>
              <span className={`relative z-10 ${theme === 'dark' ? 'bg-black text-gray-600' : 'bg-white text-gray-400'} px-4 text-[10px] font-bold uppercase tracking-widest`}>or register manually</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] focus:bg-[#111]' : 'bg-gray-50 border-gray-200 focus:bg-white'} border focus:border-purple-500/50 outline-none transition-all duration-300 text-sm font-medium`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className={`w-full px-5 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] focus:bg-[#111]' : 'bg-gray-50 border-gray-200 focus:bg-white'} border focus:border-purple-500/50 outline-none transition-all duration-300 text-sm font-medium pr-12`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={`${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-gray-400 hover:text-black'} absolute right-4 top-1/2 -translate-y-1/2 transition-colors`}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Confirm</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className={`w-full px-5 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] focus:bg-[#111]' : 'bg-gray-50 border-gray-200 focus:bg-white'} border focus:border-purple-500/50 outline-none transition-all duration-300 text-sm font-medium pr-12`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-gray-400 hover:text-black'} absolute right-4 top-1/2 -translate-y-1/2 transition-colors`}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleEmailSignup}
              disabled={isLoading}
              className={`w-full py-4.5 rounded-2xl ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100 shadow-[0_10px_30px_rgba(255,255,255,0.05)]' : 'bg-black text-white hover:bg-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.1)]'} text-[15px] font-black transition-all mt-4 uppercase tracking-widest`}
            >
              Get Started
            </button>

            <p className="text-center text-sm text-gray-500 mt-8">
              Already a member?{' '}
              <button onClick={handleLoginRedirect} className={`${theme === 'dark' ? 'text-white' : 'text-black'} hover:text-purple-400 font-extrabold transition-colors`}>Sign In</button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* RIGHT SIDE - VIBRANT CARD (Slides in from right) */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className={`hidden md:flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black' : 'bg-[#fcfcff]'} order-1 md:order-2`}
      >
        <div className="relative w-full h-[95%] rounded-[40px] overflow-hidden flex flex-col justify-end p-12 bg-gradient-to-t from-[#0a0f2c] via-[#1e3a8a] to-[#3b82f6] shadow-[0_0_50px_rgba(59,130,246,0.2)] text-white">
          <div className="absolute top-12 left-12 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <span className="text-xl font-bold tracking-tight">Timetricx</span>
          </div>

          <div className="z-10 relative">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-extrabold leading-tight mb-6"
            >
              Start Your <br /> Journey
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 text-lg max-w-md leading-relaxed mb-10"
            >
              Experience the power of intelligence in every second of your professional day.
            </motion.p>

            <div className="space-y-4">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white text-black shadow-xl"
              >
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">1</div>
                <span className="font-extrabold text-sm">Create Identity</span>
              </motion.div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 opacity-60">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">2</div>
                <span className="font-medium text-sm">Scale Fast</span>
              </div>
            </div>
          </div>

          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 blur-[100px] rounded-full"></div>
        </div>
      </motion.div>

      <AnimatePresence>
        {/* OTP MODAL */}
        {showOtpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/40">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-sm ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#222]' : 'bg-white border-gray-200'} border rounded-[40px] p-10 shadow-2xl relative overflow-hidden text-center`}>
              <h2 className="text-3xl font-extrabold mb-4">Master Key</h2>
              <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-sm mb-8 leading-relaxed`}>Enter the 6-digit verification code sent to <br /><span className={theme === 'dark' ? 'text-white' : 'text-black'}>{signupEmail}</span></p>
              <div className="flex justify-between gap-2 mb-8">
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!/^\d*$/.test(val)) return;
                      const next = [...otpCode];
                      next[idx] = val;
                      setOtpCode(next);
                      if (val && idx < 5) (e.target.nextSibling as HTMLInputElement)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) ((e.target as HTMLInputElement).previousSibling as HTMLInputElement)?.focus();
                    }}
                    className={`w-10 h-14 ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] text-white' : 'bg-gray-50 border-gray-200 text-black'} border rounded-xl text-center text-xl font-bold focus:border-purple-500 outline-none`}
                  />
                ))}
              </div>
              <button onClick={handleOtpVerify} disabled={isOtpLoading} className={`w-full py-4 rounded-2xl ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'} font-black uppercase tracking-widest transition-all shadow-lg`}>
                {isOtpLoading ? 'Verifying...' : 'Verify Key'}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* GOOGLE CONNECT MODAL */}
        {showGoogleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/40">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-sm ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#222]' : 'bg-white border-gray-200'} border rounded-[40px] p-10 shadow-2xl relative overflow-hidden text-center`}>
              <h2 className="text-3xl font-extrabold mb-4">Sync Google</h2>
              <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-sm mb-8 leading-relaxed`}>Connect your Google account to sync meetings and calendar events.</p>
              <button onClick={() => handleGoogleLogin(true)} className={`w-full py-4 rounded-2xl ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'} font-black uppercase tracking-widest flex items-center justify-center gap-2 mb-4 transition-all shadow-lg`}>
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                Connect Google
              </button>
              <button onClick={() => { setShowGoogleModal(false); setShowProfileModal(true); }} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Skip for now</button>
            </motion.div>
          </motion.div>
        )}

        {/* GITHUB / PROFILE MODAL */}
        {showProfileModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/40">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-sm ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#222]' : 'bg-white border-gray-200'} border rounded-[40px] p-10 shadow-2xl relative overflow-hidden`}>
              <h2 className="text-3xl font-extrabold mb-4">Profile Sync</h2>
              <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-sm mb-8 leading-relaxed`}>Final step! Connect GitHub to fetch your commits and projects automatically.</p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Full Name</label>
                  <input type="text" placeholder="Your Name" value={userData.fullName} onChange={e => setUserData({ ...userData, fullName: e.target.value })} className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'} border rounded-xl outline-none focus:border-purple-500`} />
                </div>
                <button onClick={() => handleGitHubLogin(true)} className={`w-full py-3.5 rounded-xl ${theme === 'dark' ? 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]' : 'bg-gray-100 border-gray-200 hover:bg-white'} border text-sm font-bold flex items-center justify-center gap-2 transition-all`}>
                  <img src="https://github.com/favicon.ico" className={`w-4 h-4 ${theme === 'dark' ? 'invert' : ''}`} alt="GH" />
                  Connect GitHub
                </button>
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${theme === 'dark' ? 'border-[#222]' : 'border-gray-100'}`}></div></div>
                  <span className={`relative z-10 ${theme === 'dark' ? 'bg-black' : 'bg-white'} px-4 text-[9px] font-bold text-gray-700 uppercase tracking-widest`}>or finish manually</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">GitHub Username</label>
                  <input type="text" placeholder="username" value={userData.githubId} onChange={e => setUserData({ ...userData, githubId: e.target.value })} className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'} border rounded-xl outline-none focus:border-purple-500`} />
                </div>
              </div>
              <button onClick={handleProfileSubmit} disabled={isProfileLoading} className={`w-full py-4 rounded-xl ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'} font-black uppercase tracking-widest transition-all shadow-lg`}>
                {isProfileLoading ? 'Saving...' : 'Complete Profile'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<Loading fullPage hideAnimation text="Loading..." />}>
      <SignupContent />
    </Suspense>
  );
}
