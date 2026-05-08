'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';

interface CompleteProfileModalProps {
  isOpen: boolean;
  userData: any;
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, userData }) => {
  const router = useRouter();
  const { theme } = useTheme();

  if (!isOpen || !userData) return null;

  const missingFields: string[] = [];
  if (!userData.mobileNumber) missingFields.push('Mobile Number');
  if (!userData.workingRole) missingFields.push('Working Role');
  if (!userData.skills || userData.skills.length === 0) missingFields.push('Skills');
  if (!userData.bio) missingFields.push('Bio');
  if (!userData.gender) missingFields.push('Gender');
  if (!userData.location) missingFields.push('Location');

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500" />
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700" />

      {/* Modal Container */}
      <div className={`relative w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] transform transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ${
        theme === 'dark' 
          ? 'bg-slate-900/90 border border-slate-800/50 backdrop-blur-2xl' 
          : 'bg-white/90 border border-slate-200/50 backdrop-blur-2xl'
      }`}>
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500" />

        <div className="p-8 md:p-10">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className={`relative w-16 h-16 flex items-center justify-center rounded-full shadow-inner transform transition-transform group-hover:scale-110 duration-500 ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <UserIcon className="w-8 h-8 text-blue-500" />
                <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg">
                  <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
                </div>
              </div>
            </div>
            
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Profile</span>
            </h2>
            
            <p className={`text-base leading-relaxed mb-6 max-w-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              The following fields are still empty. Please fill them to continue.
            </p>

            {/* Missing Fields Tags */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {missingFields.map((field) => (
                <span 
                  key={field}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    theme === 'dark' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : 'bg-red-50 border-red-100 text-red-600'
                  }`}
                >
                  {field}
                </span>
              ))}
            </div>

            {/* Benefit Row */}
            <div className={`flex items-center gap-4 p-4 w-full mb-8 rounded-2xl transition-all border ${
              theme === 'dark' 
                ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Professional Identity</p>
                <p className="text-xs text-slate-500">Essential for your digital presence.</p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => router.push('/users/completedprofile')}
              className="group relative w-full overflow-hidden rounded-2xl p-[1px] focus:outline-none transition-all active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500" />
              <div className={`relative flex items-center justify-center gap-2 px-6 py-4 rounded-[0.95rem] font-bold text-white transition-all group-hover:bg-transparent ${
                theme === 'dark' ? 'bg-slate-900/20' : 'bg-white/20'
              }`}>
                <span>Go to Profile Setup</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfileModal;
