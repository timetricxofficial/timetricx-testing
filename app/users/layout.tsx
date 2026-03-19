'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import Navbar from '../pages/users/Navbar';
import Sidebar from '../pages/users/Sidebar';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from '../../components/ui/Loading';

const AUTO_LOGOUT_MINUTES = 30;
const AUTO_LOGOUT_MS = AUTO_LOGOUT_MINUTES * 60 * 1000;

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  // Dialog state
  const [showNoAccessDialog, setShowNoAccessDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'team' | 'project'>('team');
  const [showForceLogout, setShowForceLogout] = useState(false);

  // 🔥 Auto-logout state
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null); // seconds remaining
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cache results so no repeated API calls / blinks
  const cacheRef = useRef<{ team?: boolean; project?: boolean }>({});

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('token');
      const userCookie = Cookies.get('user');

      if (!token || !userCookie) {
        window.location.href = '/landing/auth/login';
        return;
      }

      try {
        const userData = JSON.parse(userCookie);
        setUser(userData);
        setIsAuthChecking(false);
      } catch (e) {
        console.error('Error parsing user data', e);
        window.location.href = '/landing/auth/login';
      }
    };

    checkAuth();
  }, []);

  /* ============ 🔒 DEVICE SESSION POLLING ============ */
  useEffect(() => {
    if (!user?.email) return;

    // Generate deviceId if not exists
    let deviceId = localStorage.getItem('timetricx_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('timetricx_device_id', deviceId);

      // Register this deviceId with the server (so it knows this is the active device)
      fetch('/api/auth/session-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, deviceId }),
      }).catch(() => { });
    }

    // Track last check time to avoid spamming the server
    let lastCheckedTime = 0;

    const checkSession = async () => {
      // Avoid checking more than once every 60 seconds unless triggered
      const now = Date.now();
      if (now - lastCheckedTime < 60000) return;

      try {
        const currentDeviceId = localStorage.getItem('timetricx_device_id');
        if (!currentDeviceId) return;

        const res = await fetch('/api/auth/session-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, deviceId: currentDeviceId }),
        });
        const data = await res.json();

        lastCheckedTime = Date.now();

        if (!data.valid && data.reason === 'logged_in_other_device') {
          setShowForceLogout(true);
        }
      } catch { }
    };

    // 🖱️ Check only when user interacts (Client-Side logic)
    const handleActivity = () => checkSession();

    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity);

    // Initial check on load
    checkSession();

    return () => {
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [user?.email]);

  const handleForceLogout = () => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('user', { path: '/' });
    Cookies.remove('checkin_time', { path: '/' });
    Cookies.remove('checkout_time', { path: '/' });
    localStorage.removeItem('timetricx_device_id');
    window.location.href = '/landing/auth/login';
  };

  // ==================== AUTO-LOGOUT AFTER CHECKOUT ====================

  const performAutoLogout = useCallback(() => {
    // Clear all timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Clear all auth data
    Cookies.remove('token', { path: '/' });
    Cookies.remove('user', { path: '/' });
    Cookies.remove('checkin_time', { path: '/' });
    Cookies.remove('checkout_time', { path: '/' });

    // Clear all other cookies
    const allCookies = document.cookie.split(';');
    for (let i = 0; i < allCookies.length; i++) {
      const cookie = allCookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      Cookies.remove(name, { path: '/' });
    }

    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login
    window.location.href = '/landing/auth/login';
  }, []);

  const startLogoutTimer = useCallback((remainingMs: number) => {
    // Clear any existing timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Set countdown in seconds
    const remainingSec = Math.ceil(remainingMs / 1000);
    setLogoutCountdown(remainingSec);

    // Main logout timer
    logoutTimerRef.current = setTimeout(() => {
      performAutoLogout();
    }, remainingMs);

    // Countdown ticker (every second)
    countdownIntervalRef.current = setInterval(() => {
      setLogoutCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [performAutoLogout]);

  const cancelLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    logoutTimerRef.current = null;
    countdownIntervalRef.current = null;
    setLogoutCountdown(null);
  }, []);

  // Check for checkout_time cookie on mount and periodically
  useEffect(() => {
    const checkCheckoutStatus = () => {
      const checkoutTime = Cookies.get('checkout_time');
      const checkinTime = Cookies.get('checkin_time');

      // If user has checked in again, cancel any pending logout
      if (checkinTime && !checkoutTime) {
        if (logoutCountdown !== null) {
          cancelLogoutTimer();
        }
        return;
      }

      // If checkout_time exists, calculate remaining time
      if (checkoutTime) {
        const checkoutDate = new Date(checkoutTime);
        const elapsed = Date.now() - checkoutDate.getTime();
        const remaining = AUTO_LOGOUT_MS - elapsed;

        if (remaining <= 0) {
          // Time already expired — logout immediately
          performAutoLogout();
        } else if (logoutCountdown === null) {
          // Start the timer only if not already running
          startLogoutTimer(remaining);
        }
      } else {
        // No checkout_time cookie — no timer needed
        if (logoutCountdown !== null) {
          cancelLogoutTimer();
        }
      }
    };

    // Check immediately
    checkCheckoutStatus();

    // Also poll every 5 seconds in case cookie changes from another component
    const pollInterval = setInterval(checkCheckoutStatus, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [logoutCountdown, cancelLogoutTimer, performAutoLogout, startLogoutTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // ==================== FORMAT COUNTDOWN ====================

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCountdownColor = () => {
    if (logoutCountdown === null) return '';
    if (logoutCountdown <= 300) return 'from-red-600 to-red-700'; // last 5 min
    if (logoutCountdown <= 600) return 'from-orange-500 to-orange-600'; // last 10 min
    return 'from-blue-600 to-indigo-600'; // normal
  };

  const getCountdownBorderColor = () => {
    if (logoutCountdown === null) return '';
    if (logoutCountdown <= 300) return 'border-red-500';
    if (logoutCountdown <= 600) return 'border-orange-400';
    return 'border-blue-500';
  };

  // ==================== TAB NAVIGATION ====================

  const handleTabChange = async (tab: string) => {
    switch (tab) {
      case 'Dashboard':
        router.push('/users/dashboard');
        break;
      case 'Calendar':
        router.push('/users/calander');
        break;
      case 'Projects': {
        // If already checked and has access → navigate instantly
        if (cacheRef.current.project === true) {
          router.push('/users/projects');
          break;
        }
        if (cacheRef.current.project === false) {
          setDialogType('project');
          setShowNoAccessDialog(true);
          break;
        }

        // First time — check silently (no overlay)
        try {
          const userCookie = Cookies.get('user');
          if (!userCookie) break;
          const u = JSON.parse(userCookie);

          const res = await fetch(`/api/users/projects/list?email=${u.email}`);
          const data = await res.json();

          if (data.success && data.projects && data.projects.length > 0) {
            cacheRef.current.project = true;
            router.push('/users/projects');
          } else {
            cacheRef.current.project = false;
            setDialogType('project');
            setShowNoAccessDialog(true);
          }
        } catch {
          router.push('/users/projects');
        }
        break;
      }
      case 'Team': {
        // If already checked and has access → navigate instantly
        if (cacheRef.current.team === true) {
          router.push('/users/team');
          break;
        }
        if (cacheRef.current.team === false) {
          setDialogType('team');
          setShowNoAccessDialog(true);
          break;
        }

        // First time — check silently (no overlay)
        try {
          const userCookie = Cookies.get('user');
          if (!userCookie) break;
          const u = JSON.parse(userCookie);

          const res = await fetch('/api/users/team/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: u.email }),
          });
          const data = await res.json();

          const validTeams = (data.data || []).filter((t: any) => t.members && t.members.length > 1);

          if (validTeams.length > 0) {
            cacheRef.current.team = true;
            router.push('/users/team');
          } else {
            cacheRef.current.team = false;
            setDialogType('team');
            setShowNoAccessDialog(true);
          }
        } catch {
          router.push('/users/team');
        }
        break;
      }
      case 'Documents':
        router.push('/users/documents');
        break;
      default:
        router.push('/users/dashboard');
    }
  };

  const getActiveTab = () => {
    if (pathname.includes('/calander')) return 'Calendar';
    if (pathname.includes('/projects')) return 'Projects';
    if (pathname.includes('/team')) return 'Team';
    if (pathname.includes('/documents')) return 'Documents';
    return 'Dashboard';
  };

  const handleLogout = () => {
    performAutoLogout();
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[#000000]' : 'bg-gray-50'}`}>

      {/* 🔥 AUTO-LOGOUT COUNTDOWN BANNER */}
      <AnimatePresence>
        {logoutCountdown !== null && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`overflow-hidden`}
          >
            <div className={`bg-gradient-to-r ${getCountdownColor()} text-white`}>
              <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-white ${logoutCountdown <= 300 ? 'animate-pulse' : ''}`}></div>
                  <span className="text-sm font-medium">
                    ⏱ Auto-logout after checkout
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 font-mono text-base font-bold tracking-wider`}>
                    {formatCountdown(logoutCountdown)}
                  </div>

                  <button
                    onClick={performAutoLogout}
                    className="text-xs px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors cursor-pointer border border-white/30"
                  >
                    Logout Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isAuthChecking ? (
        <Loading fullPage />
      ) : (
        <div className="flex flex-1">
          <div className="flex-1 flex flex-col">
            <Navbar activeTab={getActiveTab()} setActiveTab={handleTabChange} />

            <main className={`flex-1 overflow-y-auto  ${theme === 'dark' ? 'bg-[#000000]' : 'bg-gray-50'}`}>
              {children}
            </main>
          </div>

          <Sidebar />
        </div>
      )}

      {/* NO ACCESS DIALOG */}
      <AnimatePresence>
        {showNoAccessDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className={`w-[420px] p-8 rounded-2xl shadow-2xl text-center ${theme === 'dark'
                ? 'bg-gray-900 border border-gray-700 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
                }`}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${dialogType === 'team' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                <span className="text-3xl">
                  {dialogType === 'team' ? '👥' : '📋'}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2">
                {dialogType === 'team' ? 'No Team Assigned' : 'No Project Assigned'}
              </h3>

              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {dialogType === 'team'
                  ? "You don't have any team assigned yet. Please contact your admin to get assigned to a team."
                  : "You don't have any project assigned yet. Please contact your admin to get assigned to a project."
                }
              </p>

              <button
                onClick={() => setShowNoAccessDialog(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
            hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer font-medium"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 🔒 FORCE LOGOUT — another device logged in */}
      {showForceLogout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/70">
          <div className={`w-full max-w-sm rounded-[32px] p-10 shadow-2xl text-center ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className={`text-xl font-extrabold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Session Expired
            </h2>
            <p className={`text-sm mb-8 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Your ID is logged in on <span className="text-red-500 font-bold">another device</span>. You have been automatically logged out from this device.
            </p>
            <button
              onClick={handleForceLogout}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-sm hover:bg-red-600 transition-all cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>

  );
}