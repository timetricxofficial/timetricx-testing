'use client';

import { useState, useEffect } from 'react';
import { Video, Bell, Pin, Clock, ExternalLink, X, MessageCircle } from 'lucide-react';
import Cookies from 'js-cookie';

export default function MeetingNotification({
  theme = 'light',
  userEmail = ''
}: {
  theme?: 'light' | 'dark';
  userEmail?: string;
}) {

  const [openModal, setOpenModal] = useState(false);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingMeeting, setUpcomingMeeting] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  const currentEmail = Cookies.get("userEmail") || userEmail;

  /* ================= LIVE CLOCK ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ================= ADD 5.5 HOURS FOR IST ================= */
  const parseWithoutTimezone = (dateString: string) => {
    if (!dateString) return new Date();

    const clean = dateString.split("+")[0].replace("Z", "");
    const date = new Date(clean);
    date.setMinutes(date.getMinutes() + 330);
    return date;
  };

  /* ================= FORMAT DATE (IST) ================= */
  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    const [datePart, timePart] = dateString.split("T");
    const [year, month, day] = datePart.split("-");
    const time = timePart.split(".")[0];

    const [hours, minutes, seconds] = time.split(":").map(Number);
    let istHours = hours + 5;
    let istMinutes = minutes + 30;
    let istDay = parseInt(day);
    let istMonth = parseInt(month);
    let istYear = parseInt(year);

    if (istMinutes >= 60) {
      istMinutes -= 60;
      istHours += 1;
    }
    if (istHours >= 24) {
      istHours -= 24;
      istDay += 1;
    }
    const daysInMonth = new Date(istYear, istMonth, 0).getDate();
    if (istDay > daysInMonth) {
      istDay = 1;
      istMonth += 1;
    }
    if (istMonth > 12) {
      istMonth = 1;
      istYear += 1;
    }

    const formattedDay = istDay.toString().padStart(2, '0');
    const formattedMonth = istMonth.toString().padStart(2, '0');
    const formattedHours = istHours.toString().padStart(2, '0');
    const formattedMinutes = istMinutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedDay}-${formattedMonth}-${istYear} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  /* ================= FETCH MEETINGS ================= */
  const fetchMeetings = async (email: string) => {
    try {
      const res = await fetch(`/api/users/meetings/list?email=${email}`);
      const data = await res.json();

      if (data.success) {
        // Sort: pinned first, then by startTime
        const sortedMeetings = [...data.data].sort((a: any, b: any) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });
        setMeetings(sortedMeetings);

        const lowerEmail = email.toLowerCase();
        const unread = sortedMeetings.filter((m: any) => {
          // Check if user has already read this meeting
          const isRead = m.readBy?.includes(lowerEmail);
          
          // Only count as unread if it's NOT read AND it's NOT completed
          const status = getStatus(m.startTime, m.endTime);
          return !isRead && status !== "completed";
        }).length;

        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    }
  };

  useEffect(() => {
    if (!currentEmail) return;
    fetchMeetings(currentEmail);
    const interval = setInterval(() => fetchMeetings(currentEmail), 30000);
    return () => clearInterval(interval);
  }, [currentEmail]);

  useEffect(() => {
    // For navbar 'Join Live' button - STRICTLY exclude pinned meetings
    const upcoming = meetings.find((m: any) => {
      // Skip pinned meetings completely - they should NEVER trigger the navbar button
      if (m.isPinned === true) return false;
      const end = parseWithoutTimezone(m.endTime);
      const endDiff = (end.getTime() - now.getTime()) / (1000 * 60);
      return endDiff > 0 && m.isPinned !== true;
    });
    // Only update if we found a non-pinned meeting, otherwise keep it null/disabled
    if (!upcoming || upcoming.isPinned !== true) {
      setUpcomingMeeting(upcoming || null);
    }
  }, [now, meetings]);

  const handleOpenNotifications = async () => {
    setOpenModal(true);
    if (unreadCount > 0) {
      await fetch('/api/users/meetings/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail })
      });
      setUnreadCount(0);
    }
  };

  const getRemaining = (dateString: string) => {
    const target = parseWithoutTimezone(dateString);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "0m 0s";
    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getStatus = (startString: string, endString: string) => {
    const start = parseWithoutTimezone(startString);
    const end = parseWithoutTimezone(endString);
    if (now < start) return "upcoming";
    if (now >= start && now < end) return "live";
    return "completed";
  };

  return (
    <div className="flex items-center gap-4">

      {/* JOIN BUTTON - NEVER shows for pinned meetings */}
      <button
        onClick={() => {
          if (upcomingMeeting?.meetingLink && !upcomingMeeting?.isPinned) {
            window.open(upcomingMeeting.meetingLink, "_blank");
          }
        }}
        disabled={!upcomingMeeting || upcomingMeeting?.isPinned === true}
        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm
        ${upcomingMeeting && !upcomingMeeting?.isPinned
            ? "bg-emerald-600 animate-pulse hover:bg-emerald-500 text-white cursor-pointer ring-2 ring-emerald-500/20"
            : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
          }`}
      >
        <Video size={18} />
        {upcomingMeeting && !upcomingMeeting?.isPinned ? (getStatus(upcomingMeeting.startTime, upcomingMeeting.endTime) === "live" ? "Join Live" : "Join Meeting") : "No Live Meeting"}
      </button>

      {/* BELL */}
      <div className="relative">
        <button
          onClick={handleOpenNotifications}
          className={`p-2.5 rounded-xl transition-all cursor-pointer border shadow-sm ${theme === 'dark'
              ? 'text-white border-slate-700 hover:bg-slate-800'
              : 'text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
        >
          <Bell size={20} />
        </button>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className={`w-full max-w-md max-h-[85vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col transform transition-all animate-in zoom-in-95 duration-300 ${
            theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'
          }`}>
            
            <div className={`p-6 flex justify-between items-center border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Your Notifications
              </h2>
              <button 
                onClick={() => setOpenModal(false)}
                className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {meetings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <Bell className="text-slate-400" size={32} />
                  </div>
                  <p className="text-slate-500 font-medium">No meetings found</p>
                </div>
              )}

              {meetings.map((m) => {
                const status = getStatus(m.startTime, m.endTime);
                const isPinned = m.isPinned;

                return (
                  <div
                    key={m._id}
                    className={`relative overflow-hidden rounded-2xl border transition-all group ${
                      isPinned 
                        ? (theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200')
                        : (theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md')
                    }`}
                  >
                    {isPinned ? (
                      // PINNED MEETING - Side-by-side layout: Icon | Content
                      <div className="p-6">
                        <div className="flex items-center gap-6">
                          {/* Left: Message Icon in Circle */}
                          <div className={`flex-shrink-0 w-24 h-24 rounded-full flex items-center justify-center ${
                            theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'
                          }`}>
                            <div className="relative">
                               <MessageCircle className="w-12 h-12 text-indigo-600 fill-indigo-600" />
                               <MessageCircle className="w-8 h-8 text-indigo-400 fill-indigo-400 absolute -bottom-1 -right-1 opacity-50" />
                            </div>
                          </div>
                          
                          {/* Vertical Divider */}
                          <div className={`w-px h-24 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                          
                          {/* Right Content: Title, Text, and Button */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <p className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {m.projectName || "Discussion Room"}
                              </p>
                              <p className={`text-sm mt-1 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                This is your meeting room.
                              </p>
                              <p className={`text-sm leading-tight ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                Join anytime to connect and start the discussion.
                              </p>
                            </div>

                            <button
                              onClick={() => window.open(m.meetingLink, "_blank")}
                              className="inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                            >
                              <ExternalLink size={18} />
                              Join Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // NORMAL MEETING - Vertical layout with time/date
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                            ${status === "upcoming" ? "bg-indigo-100 text-indigo-600" : status === "live" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"}
                          `}>
                            {status}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 mb-4">
                          <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {m.projectName || "Project Meeting"}
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <Clock size={12} />
                            <span>{formatDate(m.startTime)} - {formatDate(m.endTime)}</span>
                          </div>
                        </div>

                        {status === "upcoming" && (
                          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-600 text-xs font-semibold">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Starts in {getRemaining(m.startTime)}
                          </div>
                        )}

                        {status === "live" && (
                          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-600 text-xs font-semibold">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            Ends in {getRemaining(m.endTime)}
                          </div>
                        )}

                        {status !== "completed" && (
                          <button
                            onClick={() => window.open(m.meetingLink, "_blank")}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm active:scale-[0.98]"
                          >
                            <ExternalLink size={16} />
                            Join Now
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
              <button
                onClick={() => setOpenModal(false)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all border ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
