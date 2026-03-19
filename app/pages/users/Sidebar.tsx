'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { LogOut } from 'lucide-react';
import Cookies from 'js-cookie';
import GroupModal from './chat/groupmodel';
import ProfileModal from './profilecard/page';
import Dialog from '../../../components/ui/Dialog';
import GitHubRepos from '../../users/dashboard/components/GitHubRepos';

interface Intern {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
}

export default function Sidebar() {
  const { theme } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(false);

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    // Clear all auth cookies
    Cookies.remove('token', { path: '/' });
    Cookies.remove('user', { path: '/' });

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

    // Force redirect to login
    window.location.href = '/landing/auth/login';
  };

  // ---------------- FETCH INTERNS ----------------
  const fetchInterns = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      let currentUserEmail = '';
      try {
        const userCookie = Cookies.get('user');
        if (userCookie) {
          currentUserEmail = JSON.parse(userCookie).email;
        }
      } catch (e) {
        console.error('Error parsing user cookie', e);
      }
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (currentUserEmail) params.append('excludeEmail', currentUserEmail);

      const res = await fetch(
        `/api/users/sidebar/get-interns?${params.toString()}`,
        { signal }
      );
      const data = await res.json();
      if (data.success) setInterns(data.interns);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => fetchInterns(controller.signal), 400);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchInterns();
    };
    window.addEventListener('profilePictureUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
    };
  }, []);

  return (
    <>
      {/* 🔥 RAY LINE + MICRO ANIMATIONS */}
      <style jsx global>{`
        .ray-left,
        .ray-right {
          position: absolute;
          top: 0;
          height: 2px;
          width: 50%;
          background: linear-gradient(
            to right,
            transparent,
            #2563eb,
            transparent
          );
          filter: drop-shadow(0 0 6px #2563eb);
        }

        .ray-left {
          left: -50%;
          animation: rayLeft 2.8s linear infinite;
        }

        .ray-right {
          right: -50%;
          animation: rayRight 2.8s linear infinite;
        }

        @keyframes rayLeft {
          0% { left: -50%; opacity: 0 }
          40% { opacity: 1 }
          100% { left: 50%; opacity: 0 }
        }

        @keyframes rayRight {
          0% { right: -50%; opacity: 0 }
          40% { opacity: 1 }
          100% { right: 50%; opacity: 0 }
        }
      `}</style>

      {/* SIDEBAR */}
      <div
        className={`w-80 h-60rem flex flex-col transition-colors duration-300 ${theme === 'dark'
          ? 'bg-black border-gray-700'
          : 'bg-white border-gray-200'
          }`}
      >
        {/* SEARCH */}
        <div className="p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search repos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`flex-1 px-4 py-2 border rounded-lg outline-none ${theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-black'
                }`}
            />
            <button
              onClick={handleLogout}
              className={`px-3 py-2 rounded-lg border transition hover:scale-105 cursor-pointer ${theme === 'dark'
                ? 'bg-red-900/20 border-red-700 text-red-400'
                : 'bg-red-50 border-red-300 text-red-600'
                }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HEADER WITH RAYS */}
        <div className="p-4 relative overflow-hidden">
          <div className="relative h-[2px] mb-3">
            <span className="ray-left" />
            <span className="ray-right" />
          </div>

          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">GitHub</h3>
            <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full shadow">
              Your Repos
            </span>
          </div>

          <p className="text-sm text-gray-500">
            Browse your code projects
          </p>

          <div className="relative h-[2px] mt-3">
            <span className="ray-left" />
            <span className="ray-right" />
          </div>
        </div>

        {/* GITHUB REPOS */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <GitHubRepos searchTerm={searchTerm} />
          </div>
        </div>
      </div>

      {/* FLOATING CHAT */}
      <div
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer z-40 animate-pulse hover:scale-110 transition"
        onClick={() => setIsChatModalOpen(true)}
      >
        💬
      </div>

      <GroupModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />

      <ProfileModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
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
    </>
  );
}
