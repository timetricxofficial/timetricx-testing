'use client';

import { useState, useEffect } from 'react';

interface InternshipProgressMiniProps {
  createdAt: string;
  theme: string;
}

export function InternshipProgressMini({ createdAt, theme }: InternshipProgressMiniProps) {
  const [progress, setProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const startDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30;
    const percentage = Math.min((diffMonths / 6) * 100, 100);
    setProgress(Math.floor(percentage));
  }, [createdAt]);

  const isComplete = progress >= 100;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Circular Loader Icon */}
      <div className="w-10 h-10 cursor-pointer">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
            strokeWidth="3"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={isComplete ? '#00c950' : '#3b82f6'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={isComplete ? '' : 'animate-pulse'}
          />
        </svg>
        {/* Icon inside */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="16" y2="11" />
              <path d="M12 17l-2 2v-4l2-2 2 2v4l-2-2z" />
            </svg>
          )}
        </div>
      </div>

      {/* Hover Tooltip */}
      {showTooltip && (
        <div className={`absolute right-0 top-12 z-50 p-3 rounded-xl shadow-lg border min-w-[200px] ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <p className="text-sm font-semibold">Internship Progress</p>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {progress}% completed
          </p>
          
          {isComplete ? (
            <button 
              className="mt-2 w-full text-xs bg-green-500 hover:bg-green-600 text-white py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              onClick={() => alert('Certificate download started!')}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Certificate
            </button>
          ) : (
            <p className={`text-[10px] mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {6 - Math.floor((progress / 100) * 6)} months remaining
            </p>
          )}
        </div>
      )}
    </div>
  );
}
