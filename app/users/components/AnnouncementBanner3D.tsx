'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, ChevronRight } from 'lucide-react';
import Cookies from 'js-cookie';

interface Announcement {
  _id: string;
  title: string;
  description: string;
  link?: string;
  linkText: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  startAt: string;
  endAt: string;
}

interface AnnouncementBanner3DProps {
  theme: string;
}

export function AnnouncementBanner3D({ theme }: AnnouncementBanner3DProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // Get user email from cookie
        const userCookie = Cookies.get('user');
        let userEmail = '';
        if (userCookie) {
          try {
            const user = JSON.parse(userCookie);
            userEmail = user.email || '';
          } catch {
            console.error('Failed to parse user cookie');
          }
        }

        // Build URL with email query param if available
        const url = userEmail
          ? `/api/announcements/active?email=${encodeURIComponent(userEmail)}`
          : '/api/announcements/active';

        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setAnnouncements(data.data);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, 8000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [announcements]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          gradient: 'from-red-900 via-red-700 to-rose-600',
          glow: 'red',
          iconBg: 'bg-red-500/20',
          border: 'border-red-400/50',
          shadow: 'shadow-red-500/20',
          Icon: () => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        };
      case 'warning':
        return {
          gradient: 'from-amber-900 via-orange-700 to-amber-600',
          glow: 'orange',
          iconBg: 'bg-orange-500/20',
          border: 'border-orange-400/50',
          shadow: 'shadow-orange-500/20',
          Icon: () => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'success':
        return {
          gradient: 'from-emerald-900 via-green-700 to-teal-600',
          glow: 'green',
          iconBg: 'bg-green-500/20',
          border: 'border-green-400/50',
          shadow: 'shadow-green-500/20',
          Icon: () => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default:
        return {
          gradient: 'from-blue-900 via-indigo-700 to-purple-600',
          glow: 'blue',
          iconBg: 'bg-blue-500/20',
          border: 'border-blue-400/50',
          shadow: 'shadow-blue-500/20',
          Icon: () => (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          )
        };
    }
  };

  const config = getTypeConfig(current.type);

  const handleViewClick = () => {
    if (current.link) {
      window.open(current.link, '_blank');
    }
  };

  const getIcon = () => {
    switch (current.type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes marquee-circular {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-circular {
          animation: marquee-circular 12s linear infinite;
        }
      `}</style>
      <AnimatePresence mode="wait">
        <motion.div
          key={current._id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative z-50"
        >
          {/* Blue Background Banner with Marquee */}
          <div className="relative overflow-hidden bg-blue-600">
            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-4 py-2">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                  {getIcon()}
                </div>

                {/* Marquee Container - Circular scroll */}
                <div className="flex-1 min-w-0 overflow-hidden relative">
                  {current.link ? (
                    <a
                      href={current.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center whitespace-nowrap animate-marquee-circular cursor-pointer hover:opacity-90"
                    >
                      <span className="text-white font-semibold text-sm mr-2">
                        {current.title}
                      </span>
                      <span className="text-white/80 text-sm mr-2">
                        {current.description}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center flex-shrink-0 mr-8">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center whitespace-nowrap animate-marquee-circular">
                      <span className="text-white font-semibold text-sm mr-2">
                        {current.title}
                      </span>
                      <span className="text-white/80 text-sm mr-2">
                        {current.description}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => setAnnouncements(prev => prev.filter((_, i) => i !== currentIndex))}
                  className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
