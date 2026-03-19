'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useTheme } from '../../../contexts/ThemeContext';
import { Profile, WorkingTime, GitAndFaceAttendance, CalenderAteendance, TrackTeam, MeetingNotification, LeaveModal, HelpModal, DashboardSkeleton, HolidayAnnouncementModal } from './components';
import Dialog from '../../../components/ui/Dialog';

import Loading from '../../../components/ui/Loading';

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState('');
  const [designation, setDesignation] = useState('');
  const [loading, setLoading] = useState(true);

  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openHelpModal, setOpenHelpModal] = useState(false);
  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  /* ================= AUTH ================= */

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = Cookies.get('token');
        const userCookie = Cookies.get('user');

        if (!token || !userCookie) {
          window.location.href = '/landing/auth/login';
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(userCookie);
        } catch (e) {
          console.error("Error parsing user cookie in dashboard", e);
          window.location.href = '/landing/auth/login';
          return;
        }

        if (!parsed) {
          window.location.href = '/landing/auth/login';
          return;
        }

        setProfilePicture(parsed.profilePicture || '');
        setDesignation(parsed.designation || '');

        const res = await fetch('/api/check-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: parsed.email }),
        });

        const data = await res.json();

        if (!data.success) {
          Cookies.remove('token');
          Cookies.remove('user');
          router.push('/landing/auth/login');
          return;
        }

        setUser(data.data.user);
      } catch {
        router.push('/landing/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setOpenProfileMenu(false);
      }
    };

    if (openProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openProfileMenu]);



  const handleLogoutClick = () => {
    setOpenProfileMenu(false);
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    // Clear all auth cookies
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

    // Clear session and local storage
    localStorage.clear();
    sessionStorage.clear();

    // Use window.location for a hard redirect to ensure state is completely reset
    window.location.href = '/landing/auth/login';
  };

  if (loading) {
    return <Loading fullPage />;
  }

  return (
    <>
      <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>

        {/* ================= HEADER ================= */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Dashboard
            </h1>
            <p className="text-3xl font-semibold text-green-600 mt-2">
              Welcome, {user?.name || 'User'}!
            </p>
          </div>
          {/* TAKE LEAVE BUTTON */}
          {/* <div className="flex items-right justify-end">
            
            </div> */}

          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenLeaveModal(true)}
              className={`px-4 py-2 text-sm rounded-lg cursor-pointer transition-all ${theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
              Take Leave
            </button>
            <MeetingNotification
              userEmail={user?.email || ''}
              theme={theme}
            />

            {/* PROFILE CARD */}
            <div ref={profileRef} className="flex items-center gap-4 border-2 border-blue-500 rounded-full p-2">
              <div className="flex items-center gap-4">

                {profilePicture ? (
                  <img
                    src={profilePicture}
                    className="w-10 h-10 rounded-3xl object-cover"
                    alt="profile"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}

                <div className="leading-tight">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {user.email}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {designation}
                  </p>
                </div>

                {/* DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() => setOpenProfileMenu(!openProfileMenu)}
                    className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-600/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><g fill="currentColor"><path d="m15.68 7.116l-6 5l.64.768l6-5z" /><path d="m16.32 7.884l-6 5c-.512.427-1.152-.341-.64-.768l6-5c.512-.427 1.152.341.64.768" /><path d="m3.68 7.884l6 5l.64-.768l-6-5z" /><path d="m4.32 7.116l6 5c.512.427-.128 1.195-.64.768l-6-5c-.512-.427.128-1.195.64-.768" /></g></svg>
                  </button>

                  {openProfileMenu && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl border z-50 overflow-hidden transform transition-all duration-200 origin-top-right ${theme === 'dark'
                      ? 'bg-gray-900/95 border-gray-700 text-white'
                      : 'bg-white/95 border-gray-200 text-gray-900'
                      } backdrop-blur-xl`}>

                      <button
                        onClick={() => {
                          setOpenProfileMenu(false);
                          router.push('/users/completedprofile');
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 ${theme === 'dark'
                          ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </button>

                      <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}></div>

                      <button
                        onClick={() => {
                          setOpenProfileMenu(false);
                          setOpenHelpModal(true);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 ${theme === 'dark'
                          ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help
                      </button>

                      <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}></div>

                      <button
                        onClick={handleLogoutClick}
                        className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 ${theme === 'dark'
                          ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                          : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>

                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ================= GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Profile />
            <WorkingTime />


          </div>

          <div className="lg:col-span-3 space-y-6">
            <GitAndFaceAttendance />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <TrackTeam />
              <CalenderAteendance />
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <HelpModal
        isOpen={openHelpModal}
        onClose={() => setOpenHelpModal(false)}
        theme={theme}
        userEmail={user?.email || ''}
      />

      <LeaveModal
        isOpen={openLeaveModal}
        onClose={() => setOpenLeaveModal(false)}
        theme={theme}
        userEmail={user?.email || ''}
      />

      {/* LOGOUT CONFIRMATION */}
      <Dialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        title="Logout Confirmation"
        message="Are you sure you want to logout from your account?"
        type="warning"
        confirmLabel="Logout"
        onConfirm={confirmLogout}
      />

      <HolidayAnnouncementModal />
    </>
  );
}
