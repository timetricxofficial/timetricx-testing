'use client';

import { useEffect, useState, useRef } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import Cookies from 'js-cookie';
import { useToast } from '../../../../contexts/ToastContext';

import { ProfileSkeleton } from './SkeletonLoader';

export default function Profile() {
  const { success, error } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Check token validation
  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      window.location.href = '/landing/auth/login'
      return
    }
  }, [])

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userCookie = Cookies.get('user');

        if (userCookie) {
          let userData;
          try {
            userData = JSON.parse(userCookie);
          } catch (e) {
            console.error('Error parsing user data from cookie', e);
            setLoading(false);
            return;
          }

          if (!userData || !userData.email) {
            setLoading(false);
            return;
          }

          // Fetch fresh user details from API
          const response = await fetch('/api/getuserdetails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userData.email }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            // Update cookies with fresh data
            Cookies.set('user', JSON.stringify(result.data.user), { expires: 365 });
            setUser(result.data.user);
          } else {
            // Use cookie data if API fails
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        // Fallback to cookie data
        const userCookie = Cookies.get('user');
        if (userCookie) {
          try {
            setUser(JSON.parse(userCookie));
          } catch (e) { }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleProfileUpload = async (file: File) => {
    if (!user?.email) {
      error('User email missing. Please re-login.');
      return;
    }

    const formData = new FormData();
    formData.append('email', user.email);
    formData.append('image', file);

    try {
      setUploading(true);
      const response = await fetch('/api/users/dashboard/upload-profile', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        error(result.message || 'Profile update failed');
        return;
      }

      const updatedUser = {
        ...user,
        profilePicture: result.data?.profilePicture || user.profilePicture,
      };

      setUser(updatedUser);
      Cookies.set('user', JSON.stringify(updatedUser), { expires: 365 });

      // Dispatch custom event to notify dashboard of profile picture update
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', {
        detail: { profilePicture: result.data?.profilePicture }
      }));

      success('Profile picture updated!');
    } catch (err) {
      console.error('Profile upload error:', err);
      error('Profile update failed');
    } finally {
      setUploading(false);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mark: Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <>
      <div className="bg-white rounded-4xl shadow-sm border border-gray-200 p-6 flex flex-col h-90 relative overflow-hidden">
        {/* Upload Loader Overlay - Only over profile card */}
        {uploading && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center rounded-4xl">
            <div className="bg-white rounded-lg p-4 flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-700 text-sm font-medium">Uploading...</p>
            </div>
          </div>
        )}
        {/* Background Profile Picture */}
        <div className="absolute inset-0">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile Background"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600"></div>
          )}
        </div>

        {/* Content on top of background */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Top Settings Icon */}
          <div className="flex justify-between items-start">
            <div className="flex-1"></div>
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1.5 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-md cursor-pointer"
              >
                <svg
                  className="w-5 h-5 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute top-10 right-0 bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-60 min-w-[200px] p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      // Handle upload new picture
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          void handleProfileUpload(file);
                        }
                      };
                      input.click();
                    }}
                    className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-600 text-sm font-black text-gray-800 hover:text-white cursor-pointer rounded-[1rem] transition-all duration-300 active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Camera size={16} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span>{uploading ? 'Processing...' : 'Upload New Picture'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Empty space in middle */}
          <div className="flex-1"></div>

          {/* Bottom Content with Glassy Effect */}
          <div className="relative">
            {/* Glassy Overlay only on bottom section */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg w-120 h-70 -ml-20 "></div>

            {/* Content on top of glassy overlay */}
            <div className="relative z-10  text-center rounded-lg">


              <h2 className="text-lg font-bold text-[#00c950]">{user?.name || 'User'}</h2>
              <p className="text-lg font-medium text-blue-600">{user?.workingRole || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
