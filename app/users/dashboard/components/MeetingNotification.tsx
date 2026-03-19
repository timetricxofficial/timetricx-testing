'use client';

import { useState, useEffect } from 'react';
import { Video, Bell } from 'lucide-react';
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

    // remove +00:00 or Z
    const clean = dateString.split("+")[0].replace("Z", "");
    const date = new Date(clean);

    // Add 5.5 hours (330 minutes) for IST conversion
    date.setMinutes(date.getMinutes() + 330);

    return date;
  };

  /* ================= FORMAT DATE (IST) ================= */
  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    const [datePart, timePart] = dateString.split("T");

    const [year, month, day] = datePart.split("-");
    const time = timePart.split(".")[0];

    // Parse time and add 5.5 hours for IST
    const [hours, minutes, seconds] = time.split(":").map(Number);
    let istHours = hours + 5;
    let istMinutes = minutes + 30;
    let istDay = parseInt(day);
    let istMonth = parseInt(month);
    let istYear = parseInt(year);

    // Handle minute overflow
    if (istMinutes >= 60) {
      istMinutes -= 60;
      istHours += 1;
    }

    // Handle hour overflow
    if (istHours >= 24) {
      istHours -= 24;
      istDay += 1;
    }

    // Handle month overflow (simplified)
    const daysInMonth = new Date(istYear, istMonth, 0).getDate();
    if (istDay > daysInMonth) {
      istDay = 1;
      istMonth += 1;
    }

    // Handle year overflow
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
        setMeetings(data.data);

        // unread logic
        const unread = data.data.filter((m: any) =>
          !m.readBy?.includes(email.toLowerCase())
        ).length;

        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    }
  };

  // Fetch meetings once on mount, then every 30 seconds (NOT every second)
  useEffect(() => {
    if (!currentEmail) return;

    fetchMeetings(currentEmail);
    const interval = setInterval(() => fetchMeetings(currentEmail), 30000);

    return () => clearInterval(interval);
  }, [currentEmail]);

  // Update upcoming meeting based on clock (no API call)
  useEffect(() => {
    const upcoming = meetings.find((m: any) => {
      const end = parseWithoutTimezone(m.endTime);
      const endDiff = (end.getTime() - now.getTime()) / (1000 * 60);
      return endDiff > 0;
    });
    setUpcomingMeeting(upcoming || null);
  }, [now, meetings]);

  /* ================= MARK READ ================= */
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

  /* ================= TIME HELPERS ================= */
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

      {/* JOIN BUTTON */}
      <button
        onClick={() => {
          if (upcomingMeeting?.meetingLink) {
            window.open(upcomingMeeting.meetingLink, "_blank");
          }
        }}
        disabled={!upcomingMeeting}
        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all
        ${upcomingMeeting
            ? "bg-green-600 animate-pulse hover:bg-green-500 text-white cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
      >
        <Video size={16} />
        {upcomingMeeting ? (getStatus(upcomingMeeting.startTime, upcomingMeeting.endTime) === "live" ? "Join Live" : "Join Meeting") : "No Meeting"}
      </button>

      {/* BELL */}
      <div className="relative">
        <button
          onClick={handleOpenNotifications}
          className={`p-2 rounded-full transition-all cursor-pointer ${theme === 'dark'
              ? 'text-white hover:bg-white hover:text-black'
              : 'text-gray-600 hover:bg-gray-200'
            }`}
        >
          <Bell size={20} />
        </button>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-96 max-h-[75vh] overflow-y-auto shadow-xl">

            <h2 className="text-lg font-semibold mb-5 border-b pb-2">
              Your Meetings
            </h2>

            {meetings.length === 0 && (
              <p className="text-sm text-gray-500">
                No meetings available
              </p>
            )}

            {meetings.map((m) => {
              const status = getStatus(m.startTime, m.endTime);

              return (
                <div
                  key={m._id}
                  className="p-4 rounded-xl border border-gray-200 mb-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-sm">
                      {m.projectName}
                    </p>

                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium
                      ${status === "upcoming"
                          ? "bg-blue-100 text-blue-600"
                          : status === "live"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-200 text-gray-600"
                        }`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">
                    {formatDate(m.startTime)} - {formatDate(m.endTime)}
                  </p>

                  {status === "upcoming" && (
                    <p className="text-xs text-blue-600 mb-2">
                      Starts in {getRemaining(m.startTime)}
                    </p>
                  )}

                  {status === "live" && (
                    <p className="text-xs text-red-600 mb-2">
                      Ends in {getRemaining(m.endTime)}
                    </p>
                  )}

                  {status !== "completed" && (
                    <button
                      onClick={() => window.open(m.meetingLink, "_blank")}
                      className="w-full mt-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer"
                    >
                      Join Meeting
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setOpenModal(false)}
              className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition cursor-pointer"
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
