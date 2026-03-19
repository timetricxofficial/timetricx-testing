'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useToast } from '../../../../contexts/ToastContext';
import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import Loading from '../../../../components/ui/Loading';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { theme } = useTheme();
  const { success, error } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showDeviceOtpModal, setShowDeviceOtpModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [deviceOtpCode, setDeviceOtpCode] = useState(['', '', '', '', '', '']);
  const [deviceMaskedEmail, setDeviceMaskedEmail] = useState('');
  const [isDeviceOtpLoading, setIsDeviceOtpLoading] = useState(false);
  const [isDeviceOtpSending, setIsDeviceOtpSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [userData, setUserData] = useState({
    fullName: '',
    profilePicture: '' as File | string,
    githubId: '',
    shift: 'day',
    email: ''
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  // Generate device fingerprint
  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('timetricx_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('timetricx_device_id', deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    const authError = searchParams.get('auth_error');
    if (authError) {
      if (authError === 'account_not_exists') {
        error('Account not found. Please sign up first.');
      } else {
        error('Authentication failed: ' + authError);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const token = Cookies.get('token');
    const userCookie = Cookies.get('user');
    if (!token || !userCookie) {
      setIsAuthChecking(false);
      return;
    }

    let user;
    try {
      user = JSON.parse(userCookie);
    } catch {
      setIsAuthChecking(false);
      return;
    }

    if (!user?.email) {
      setIsAuthChecking(false);
      return;
    }

    const checkProviders = async () => {
      try {
        const res = await fetch('/api/auth/check-login-validation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: user.email }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.hasAuthProvider) {
          router.replace('/users');
        }
      } catch {
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkProviders();
  }, [router]);

  useEffect(() => {
    if (!otpCooldown) return;
    const timer = setTimeout(() => {
      setOtpCooldown(prev => (prev > 0 ? prev - 1 : 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleEmailLogin = async () => {
    setSubmitAttempted(true);
    if (!emailValue || !passwordValue) {
      error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailValue, password: passwordValue, deviceId }),
      });
      const data = await response.json();

      // 🔒 Login OTP required (every login)
      if (data.action === 'login_otp_required') {
        setDeviceMaskedEmail(data.maskedEmail || '');
        setShowDeviceOtpModal(true);
        setOtpCooldown(30); // Start 30s cooldown
        success(data.message || 'OTP sent to your emails');
        return;
      }

      if (data.action === 'github') {
        setUserData(prev => ({ ...prev, email: emailValue }));
        setShowProfileModal(true);
        return;
      }

      if (data.action === 'google') {
        setShowGoogleModal(true);
        return;
      }

      error(data.message || 'Invalid credentials');
    } catch (err) {
      error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 📧 Resend login OTP
  const handleResendLoginOtp = async () => {
    setIsDeviceOtpSending(true);
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailValue, password: passwordValue, deviceId }),
      });
      const data = await res.json();
      if (data.action === 'login_otp_required') {
        success(data.message || 'OTP resent successfully to both of your emails');
        setDeviceMaskedEmail(data.maskedEmail || '');
        setOtpCooldown(30); // Reset 30s cooldown
      } else {
        error(data.message || 'Failed to resend OTP');
      }
    } catch {
      error('Failed to resend OTP');
    } finally {
      setIsDeviceOtpSending(false);
    }
  };

  // ✅ Verify login OTP
  const handleVerifyLoginOtp = useCallback(async (codeToUse?: string) => {
    const otpValue = codeToUse || deviceOtpCode.join('');
    if (otpValue.length !== 6) return;

    setIsDeviceOtpLoading(true);
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailValue, password: passwordValue, deviceId, otp: otpValue }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Cookies.set('user', JSON.stringify(data.data.user), { expires: 365 });
        Cookies.set('token', data.data.token, { expires: 7 });
        if (data.data.deviceId) {
          localStorage.setItem('timetricx_device_id', data.data.deviceId);
        }
        setShowDeviceOtpModal(false);
        success('Login successful! Redirecting...');
        setTimeout(() => router.replace('/users'), 1500);
      } else {
        error(data.message || 'Invalid OTP');
        // Clear code on error so user can retry
        setDeviceOtpCode(['', '', '', '', '', '']);
      }
    } catch {
      error('Verification failed');
    } finally {
      setIsDeviceOtpLoading(false);
    }
  }, [deviceOtpCode, emailValue, passwordValue, router]);

  // 🔥 Auto-verify when 6 digits are filled
  useEffect(() => {
    const fullCode = deviceOtpCode.join('');
    if (fullCode.length === 6 && !isDeviceOtpLoading && showDeviceOtpModal) {
      handleVerifyLoginOtp(fullCode);
    }
  }, [deviceOtpCode, isDeviceOtpLoading, showDeviceOtpModal, handleVerifyLoginOtp]);


  const handleSignupRedirect = () => {
    router.push('/landing/auth/signup');
  };

  const handleGoogleLogin = () => {
    const deviceId = getDeviceId();
    const state = JSON.stringify({ mode: 'login', redirect: '/users/dashboard', deviceId });
    window.location.href = `/api/auth/google?state=${encodeURIComponent(state)}`;
  };

  const handleGitHubLogin = () => {
    const deviceId = getDeviceId();
    const state = JSON.stringify({ mode: 'login', redirect: '/users/dashboard', deviceId });
    window.location.href = `/api/auth/github?state=${encodeURIComponent(state)}`;
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      error('Please enter your email');
      return;
    }
    setIsForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForgotPasswordModal(false);
        setShowOtpModal(true);
        setResetToken(data.data.token);
        success('OTP sent successfully!');
      } else {
        error(data.message || 'Failed to send OTP');
      }
    } catch (e) {
      error('Service error');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // 🔍 Real-time Email existence check
  useEffect(() => {
    if (!forgotEmail || !showForgotPasswordModal) {
      setEmailExists(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Basic regex check before calling API
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
        setEmailExists(null);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const res = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: forgotEmail }),
        });
        const data = await res.json();
        setEmailExists(data.exists || false);
      } catch {
        setEmailExists(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [forgotEmail, showForgotPasswordModal]);

  // ✅ Verify Reset OTP
  const handleVerifyResetOtp = useCallback(async (codeToUse?: string) => {
    const otpValue = codeToUse || otpCode.join('');
    if (otpValue.length !== 6) return;

    setIsOtpLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: otpValue, token: resetToken }),
      });
      const data = await res.json();

      if (data.success) {
        setShowOtpModal(false);
        setShowResetPasswordModal(true);
        success('Identity verified!');
      } else {
        error(data.message || 'Invalid OTP');
        setOtpCode(['', '', '', '', '', '']);
      }
    } catch {
      error('Verification failed');
    } finally {
      setIsOtpLoading(false);
    }
  }, [otpCode, forgotEmail, resetToken]);

  // 🔥 Auto-verify Reset OTP
  useEffect(() => {
    const fullCode = otpCode.join('');
    if (fullCode.length === 6 && !isOtpLoading && showOtpModal) {
      handleVerifyResetOtp(fullCode);
    }
  }, [otpCode, isOtpLoading, showOtpModal, handleVerifyResetOtp]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      error('Passwords do not match');
      return;
    }
    setIsResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        success('Password updated! Please login.');
        setShowResetPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        error(data.message || 'Reset failed');
      }
    } catch {
      error('Service error');
    } finally {
      setIsResetLoading(false);
    }
  };

  if (isAuthChecking) {
    return <Loading fullPage hideAnimation text="Checking session..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen grid grid-cols-1 md:grid-cols-2 ${theme === 'dark' ? 'bg-black text-white' : 'bg-[#fcfcff] text-black'} font-sans overflow-hidden transition-colors duration-500`}
    >

      {isLoading && <Loading fullPage hideAnimation text="Logging in..." />}

      {/* LEFT SIDE - VIBRANT CARD (Sliding Animation) */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className={`hidden md:flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black' : 'bg-[#fcfcff]'}`}
      >
        <div className="relative w-full h-[95%] rounded-[40px] overflow-hidden flex flex-col justify-end p-12 bg-gradient-to-t from-[#2a0e4a] via-[#4c1d95] to-[#7c3aed] shadow-[0_0_50px_rgba(124,58,237,0.3)] text-white">
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
              Empower Your <br /> Workflow
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 text-lg max-w-md leading-relaxed mb-10"
            >
              Join the future of productivity tracking. Manage attendance, projects, and teams with intelligence.
            </motion.p>

            <div className="space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl"
              >
                <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">1</div>
                <span className="font-medium text-sm">Secure Authentication</span>
              </motion.div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 opacity-60">
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">2</div>
                <span className="font-medium text-sm">Workspace Sync</span>
              </div>
            </div>
          </div>

          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 blur-[100px] rounded-full"></div>
        </div>
      </motion.div>

      {/* RIGHT SIDE - FORM (Sliding Animation from opposite side) */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className={`flex flex-col items-center justify-center p-8 md:p-12 ${theme === 'dark' ? 'bg-black' : 'bg-white'} relative`}
      >
        {/* Mobile Logo */}
        <div className="md:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <span className="text-lg font-bold">Timetricx</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-12">
            <h2 className="text-4xl font-extrabold mb-3">Sign In</h2>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Enter your credentials to access your dashboard.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`flex items-center justify-center gap-3 py-3.5 rounded-2xl ${theme === 'dark' ? 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]' : 'bg-gray-50 border-gray-200 hover:bg-white'} border transition-all duration-300 font-bold text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Google
              </button>
              <button
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className={`flex items-center justify-center gap-3 py-3.5 rounded-2xl ${theme === 'dark' ? 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]' : 'bg-gray-50 border-gray-200 hover:bg-white'} border transition-all duration-300 font-bold text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <img src="https://github.com/favicon.ico" className={`w-4 h-4 ${theme === 'dark' ? 'invert' : ''}`} alt="Github" />
                GitHub
              </button>
            </div>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${theme === 'dark' ? 'border-[#222]' : 'border-gray-100'}`}></div></div>
              <span className={`relative z-10 ${theme === 'dark' ? 'bg-black text-gray-600' : 'bg-white text-gray-400'} px-4 text-[10px] font-bold uppercase tracking-[0.2em]`}>secure connection</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={emailValue}
                  disabled={isLoading}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] focus:bg-[#111]' : 'bg-gray-50 border-gray-200 focus:bg-white'} border focus:border-purple-500/50 outline-none transition-all duration-300 text-sm font-medium ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 mx-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
                  <button onClick={() => setShowForgotPasswordModal(true)} className="text-[11px] text-purple-400/80 hover:text-purple-300 transition-colors font-bold uppercase tracking-wider">Forgot Key?</button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordValue}
                    disabled={isLoading}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    className={`w-full px-5 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] focus:bg-[#111]' : 'bg-gray-50 border-gray-200 focus:bg-white'} border focus:border-purple-500/50 outline-none transition-all duration-300 text-sm font-medium pr-12 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleEmailLogin}
              disabled={isLoading}
              className={`w-full py-4.5 rounded-2xl ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100 shadow-[0_10px_30px_rgba(255,255,255,0.05)]' : 'bg-black text-white hover:bg-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.1)]'} text-[15px] font-black active:scale-[0.98] transition-all duration-300 mt-4 uppercase tracking-widest`}
            >
              Sign In
            </button>

            <p className="text-center text-sm text-gray-500 mt-8">
              New to Timetricx?{' '}
              <button onClick={handleSignupRedirect} className={`${theme === 'dark' ? 'text-white' : 'text-black'} hover:text-purple-400 font-extrabold transition-colors`}>Create Account</button>
            </p>
          </div>
        </div>
      </motion.div>
      {/* MODALS */}
      <AnimatePresence>
        {showForgotPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/40">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#222]' : 'bg-white border-gray-200'} border rounded-[40px] p-10 shadow-2xl relative overflow-hidden text-left`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full"></div>
              <h2 className="text-3xl font-extrabold mb-4">Reset Key</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">System will send a verification token to your registered email address.</p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Identity Email</label>
                    {isCheckingEmail ? (
                      <span className="text-[9px] text-purple-400 font-bold animate-pulse">Checking DB...</span>
                    ) : emailExists === true ? (
                      <span className="text-[9px] text-green-500 font-extrabold uppercase tracking-tight">Account Found</span>
                    ) : emailExists === false ? (
                      <span className="text-[9px] text-red-500 font-extrabold uppercase tracking-tight">Account Not Found</span>
                    ) : null}
                  </div>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setEmailExists(null); // Clear status while typing
                    }}
                    className={`w-full px-5 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d]' : 'bg-gray-50'} border transition-all duration-300 text-sm font-medium ${emailExists === true ? 'border-green-500/50' :
                      emailExists === false ? 'border-red-500/50' :
                        theme === 'dark' ? 'border-[#1a1a1a] focus:border-purple-500/50' : 'border-gray-200 focus:border-purple-500/50'
                      } outline-none`}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => { setShowForgotPasswordModal(false); setEmailExists(null); }} className={`flex-1 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'} text-sm font-bold border transition-all`}>Abort</button>
                  <button
                    onClick={handleForgotPassword}
                    disabled={isForgotLoading || isCheckingEmail || emailExists === false}
                    className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${(isForgotLoading || isCheckingEmail || emailExists === false)
                      ? 'bg-gray-500 opacity-50 cursor-not-allowed text-white'
                      : theme === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
                      }`}
                  >
                    {isForgotLoading ? 'Sending' : 'Send'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showOtpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/40">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-sm ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#222]' : 'bg-white border-gray-200'} border rounded-[40px] p-10 shadow-2xl relative overflow-hidden text-center`}>
              <h2 className="text-3xl font-extrabold mb-4">Verify Identity</h2>
              <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-sm mb-8 leading-relaxed`}>Enter the 6-digit code sent to <br /><span className={`${theme === 'dark' ? 'text-white' : 'text-black'} font-bold`}>{forgotEmail}</span></p>
              <div className="flex justify-center gap-2 mb-8">
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    className={`w-11 h-14 text-center text-xl font-black ${theme === 'dark' ? 'bg-[#111] border-[#333] text-white focus:border-purple-500' : 'bg-gray-50 border-gray-200 text-black focus:border-purple-500'} border rounded-xl outline-none transition-all`}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      if (pasted.length > 0) {
                        const newCode = [...otpCode];
                        for (let j = 0; j < 6; j++) { newCode[j] = pasted[j] || ''; }
                        setOtpCode(newCode);
                        // Focus last digit or 6th box
                        const lastIdx = Math.min(pasted.length - 1, 5);
                        (e.currentTarget.parentElement?.children[lastIdx] as HTMLInputElement)?.focus();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const newCode = [...otpCode];
                      newCode[i] = val;
                      setOtpCode(newCode);
                      if (val && i < 5) (e.currentTarget.parentElement?.children[i + 1] as HTMLInputElement)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                        (e.currentTarget.parentElement?.children[i - 1] as HTMLInputElement)?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              {isOtpLoading && (
                <div className="flex items-center justify-center gap-2 text-purple-400 font-bold mb-6 animate-pulse">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </div>
              )}
              <button onClick={() => setShowOtpModal(false)} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        {showResetPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/40">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#222]' : 'bg-white border-gray-200'} border rounded-[40px] p-10 shadow-2xl relative overflow-hidden`}>
              <h2 className="text-3xl font-extrabold mb-8">New Key</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full px-5 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'} border focus:border-purple-500/50 outline-none transition-all text-sm font-medium pr-12`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-5 py-4 rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'} border focus:border-purple-500/50 outline-none transition-all text-sm font-medium pr-12`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleUpdatePassword}
                  disabled={isResetLoading}
                  className={`w-full py-4 rounded-2xl ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'} font-black uppercase tracking-widest transition-all shadow-xl`}
                >
                  {isResetLoading ? 'Updating...' : 'Update & Secure'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showGoogleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/40">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-sm ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#222]' : 'bg-white border-gray-200'} border rounded-[40px] p-10 shadow-2xl relative overflow-hidden text-center`}>
              <h2 className="text-3xl font-extrabold mb-4">Sync Google</h2>
              <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-sm mb-8 leading-relaxed`}>Your account doesn't have Google connected. Sync to manage meetings.</p>
              <button onClick={handleGoogleLogin} className={`w-full py-4 rounded-2xl ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'} font-black uppercase tracking-widest flex items-center justify-center gap-2 mb-4 transition-all shadow-lg`}>
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                Connect Google
              </button>
              <button onClick={() => { setShowGoogleModal(false); router.replace('/users/dashboard'); }} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Skip for now</button>
            </motion.div>
          </motion.div>
        )}

        {showProfileModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/40">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#222]' : 'bg-white border-gray-200'} border rounded-[40px] p-10 shadow-2xl relative overflow-hidden`}>
              <h2 className="text-3xl font-extrabold mb-4 text-center">Profile Sync</h2>
              <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-sm mb-8 leading-relaxed text-center`}>Join Timetricx and optimize your productivity automatically.</p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Full Name</label>
                  <input type="text" placeholder="Your Name" value={userData.fullName} onChange={e => setUserData({ ...userData, fullName: e.target.value })} className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'} border rounded-xl outline-none focus:border-purple-500`} />
                </div>
                <button onClick={() => handleGitHubLogin()} className={`w-full py-3.5 rounded-xl ${theme === 'dark' ? 'bg-[#111] border-[#222] hover:bg-[#1a1a1a]' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'} border text-sm font-bold flex items-center justify-center gap-2 transition-all`}>
                  <img src="https://github.com/favicon.ico" className={`w-4 h-4 ${theme === 'dark' ? 'invert' : ''}`} alt="GH" />
                  Connect GitHub
                </button>
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${theme === 'dark' ? 'border-[#222]' : 'border-gray-100'}`}></div></div>
                  <span className={`relative z-10 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} px-4 text-[9px] font-bold text-gray-700 uppercase tracking-widest`}>or finish manually</span>
                </div>
                <button onClick={() => { setShowProfileModal(false); router.push('/users/dashboard'); }} className={`w-full py-4 rounded-xl ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'} font-black uppercase tracking-widest transition-all shadow-md`}>Enter Dashboard</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeviceOtpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#0a0a0a] border border-[#222] rounded-[40px] p-10 shadow-2xl relative overflow-hidden text-center text-white">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold mb-3">Login Verification</h2>
              <p className="text-gray-500 text-sm mb-2 leading-relaxed">Verify your identity to <span className="text-orange-400 font-bold">login</span>.</p>
              <p className="text-gray-600 text-xs mb-6">You received your OTP on <span className="text-white font-bold">both emails</span></p>
              <div className="flex justify-center gap-2 mb-6">
                {deviceOtpCode.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    className="w-11 h-14 text-center text-xl font-black bg-[#111] border border-[#333] rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all text-white"
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      if (pasted.length > 0) {
                        const newCode = [...deviceOtpCode];
                        for (let j = 0; j < 6; j++) { newCode[j] = pasted[j] || ''; }
                        setDeviceOtpCode(newCode);
                        const lastIdx = Math.min(pasted.length - 1, 5);
                        (e.currentTarget.parentElement?.children[lastIdx] as HTMLInputElement)?.focus();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const newCode = [...deviceOtpCode];
                      newCode[i] = val;
                      setDeviceOtpCode(newCode);
                      if (val && i < 5) (e.target.parentElement?.children[i + 1] as HTMLInputElement)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !deviceOtpCode[i] && i > 0) {
                        (e.currentTarget.parentElement?.children[i - 1] as HTMLInputElement)?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              <div className="h-10 mb-4 flex items-center justify-center">
                {isDeviceOtpLoading && (
                  <div className="flex items-center gap-2 text-orange-500 font-bold animate-pulse">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button onClick={handleResendLoginOtp} disabled={isDeviceOtpSending || otpCooldown > 0} className={`text-xs font-bold uppercase tracking-widest transition-colors ${(isDeviceOtpSending || otpCooldown > 0) ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-orange-400'}`}>
                  {isDeviceOtpSending ? 'Sending...' : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                </button>
                <button onClick={() => { setShowDeviceOtpModal(false); setDeviceOtpCode(['', '', '', '', '', '']); }} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
