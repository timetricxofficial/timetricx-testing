'use client';

import { useState, useEffect } from 'react';

interface InternshipProgressProps {
  createdAt: string;
  theme: string;
}

export function InternshipProgress({ createdAt, theme }: InternshipProgressProps) {
  const [progress, setProgress] = useState(0);
  const [monthsPassed, setMonthsPassed] = useState(0);

  useEffect(() => {
    const startDate = new Date(createdAt);
    const now = new Date();
    
    // Calculate months passed
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30;
    
    setMonthsPassed(Math.floor(diffMonths));
    
    // Calculate percentage (6 months total)
    const percentage = Math.min((diffMonths / 6) * 100, 100);
    setProgress(Math.floor(percentage));
  }, [createdAt]);

  const isComplete = progress >= 100;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} shadow-sm border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
      {/* Circular Progress */}
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={isComplete ? '#00c950' : '#3b82f6'}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={isComplete ? '' : 'animate-spin-slow'}
            style={{ 
              transformOrigin: 'center',
              animation: isComplete ? 'none' : 'spin 3s linear infinite'
            }}
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Internship Progress
        </p>
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {monthsPassed} of 6 months completed
        </p>
        
        {isComplete ? (
          <button 
            className="mt-2 text-xs bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1"
            onClick={() => alert('Certificate download started!')}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Certificate
          </button>
        ) : (
          <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {6 - monthsPassed} months remaining
          </p>
        )}
      </div>
    </div>
  );
}
