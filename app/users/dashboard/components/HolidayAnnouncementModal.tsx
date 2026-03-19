'use client'
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../../contexts/ThemeContext';
import Cookies from 'js-cookie';

interface CompanyHoliday {
    _id: string;
    title: string;
    date: string;
    animationUrl: string;
    animationResourceType: 'image' | 'video';
}

type ModalMode = 'holiday' | 'approved' | 'rejected' | 'weekend' | null;

export default function HolidayAnnouncementModal() {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [todayHoliday, setTodayHoliday] = useState<CompanyHoliday | null>(null);
    const [showReasonMode, setShowReasonMode] = useState(false);
    const [reason, setReason] = useState("");
    const [modalMode, setModalMode] = useState<ModalMode>(null);

    useEffect(() => {
        const fetchHolidays = async () => {
            const userCookie = Cookies.get("user");
            if (!userCookie) return;
            let user;
            try {
                user = JSON.parse(userCookie);
            } catch (e) {
                console.error("Error parsing user cookie", e);
                return;
            }
            if (!user || !user.email) return;

            try {
                const res = await fetch('/api/users/dashboard/company-holidays', { cache: 'no-store' });
                const data = await res.json();

                if (data.success && data.data) {
                    const now = new Date();
                    const todayDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

                    const holidayToday = data.data.find((h: CompanyHoliday) => {
                        const hDate = new Date(h.date);
                        const hDateStr = `${hDate.getFullYear()}-${(hDate.getMonth() + 1).toString().padStart(2, '0')}-${hDate.getDate().toString().padStart(2, '0')}`;
                        return hDateStr === todayDateStr;
                    });

                    if (holidayToday) {
                        setTodayHoliday(holidayToday);

                        // Check if request is already made
                        const reqRes = await fetch(`/api/attendance/holiday-requests?email=${user.email}&date=${todayDateStr}`, { cache: 'no-store' });
                        const reqData = await reqRes.json();

                        if (!reqData.data) {
                            // No request made — show holiday announcement
                            const hasSeen = sessionStorage.getItem(`seen_holiday_${holidayToday._id}`);
                            if (!hasSeen) {
                                setModalMode('holiday');
                                setIsOpen(true);
                            }
                        } else if (reqData.data.status === 'approved') {
                            // Request approved — show approval popup once
                            const hasSeenApproval = sessionStorage.getItem(`seen_approved_${holidayToday._id}`);
                            if (!hasSeenApproval) {
                                setModalMode('approved');
                                setIsOpen(true);
                            }
                        } else if (reqData.data.status === 'rejected') {
                            // Request rejected — show rejection popup once
                            const hasSeenRejection = sessionStorage.getItem(`seen_rejected_${holidayToday._id}`);
                            if (!hasSeenRejection) {
                                setModalMode('rejected');
                                setIsOpen(true);
                            }
                        }
                        // if status is 'pending', don't show any modal
                    } else {
                        // Check if it's a weekend (Sat/Sun)
                        const day = now.getDay();
                        if (day === 0 || day === 6) { // 0 = Sunday, 6 = Saturday
                            setTodayHoliday({
                                _id: 'weekend',
                                title: day === 0 ? 'Sunday' : 'Saturday',
                                date: todayDateStr,
                                animationUrl: 'https://cdn.lottiestatus.com/animations/weekend_chill.mp4', // placeholder or specific
                                animationResourceType: 'video'
                            });

                            // Check if request is already made for this weekend
                            const reqRes = await fetch(`/api/attendance/holiday-requests?email=${user.email}&date=${todayDateStr}`, { cache: 'no-store' });
                            const reqData = await reqRes.json();

                            if (!reqData.data) {
                                const hasSeen = sessionStorage.getItem(`seen_weekend_${todayDateStr}`);
                                if (!hasSeen) {
                                    setModalMode('weekend');
                                    setIsOpen(true);
                                }
                            } else if (reqData.data.status === 'approved') {
                                const hasSeenApproval = sessionStorage.getItem(`seen_approved_weekend_${todayDateStr}`);
                                if (!hasSeenApproval) {
                                    setModalMode('approved');
                                    setIsOpen(true);
                                }
                            } else if (reqData.data.status === 'rejected') {
                                const hasSeenRejection = sessionStorage.getItem(`seen_rejected_weekend_${todayDateStr}`);
                                if (!hasSeenRejection) {
                                    setModalMode('rejected');
                                    setIsOpen(true);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch holidays for announcement:", err);
            }
        };
        fetchHolidays();
    }, []);

    // Listen for real-time status changes from polling
    useEffect(() => {
        const handleStatusChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            const newStatus = customEvent.detail?.status;
            if (newStatus === 'approved') {
                setModalMode('approved');
                setIsOpen(true);
            } else if (newStatus === 'rejected') {
                setModalMode('rejected');
                setIsOpen(true);
            }
        };

        window.addEventListener('holidayRequestStatusChanged', handleStatusChange);
        return () => window.removeEventListener('holidayRequestStatusChanged', handleStatusChange);
    }, []);

    const handleIgnore = () => {
        if (todayHoliday) {
            if (todayHoliday._id === 'weekend') {
                sessionStorage.setItem(`seen_weekend_${todayHoliday.date.substring(0, 10)}`, 'true');
            } else {
                sessionStorage.setItem(`seen_holiday_${todayHoliday._id}`, 'true');
            }
        }
        setIsOpen(false);
    };

    const handleDismissApproved = () => {
        if (todayHoliday) {
            if (todayHoliday._id === 'weekend') {
                sessionStorage.setItem(`seen_approved_weekend_${todayHoliday.date.substring(0, 10)}`, 'true');
            } else {
                sessionStorage.setItem(`seen_approved_${todayHoliday._id}`, 'true');
            }
        }
        setIsOpen(false);
    };

    const handleDismissRejected = () => {
        if (todayHoliday) {
            if (todayHoliday._id === 'weekend') {
                sessionStorage.setItem(`seen_rejected_weekend_${todayHoliday.date.substring(0, 10)}`, 'true');
            } else {
                sessionStorage.setItem(`seen_rejected_${todayHoliday._id}`, 'true');
            }
        }
        setIsOpen(false);
    };

    const handleInitialRequestClick = () => {
        setShowReasonMode(true);
    };

    const handleRequestToWork = async () => {
        if (!reason.trim()) {
            alert("Please provide a reason to work on this holiday.");
            return;
        }
        if (todayHoliday) {
            try {
                const userCookie = Cookies.get("user");
                if (userCookie) {
                    const user = JSON.parse(userCookie);

                    const res = await fetch('/api/attendance/holiday-requests', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: user.email,
                            holidayId: todayHoliday._id,
                            holidayDate: todayHoliday.date,
                            reason: reason.trim()
                        })
                    });

                    const data = await res.json();
                    if (data.success) {
                        alert('Work request submitted successfully!');
                        if (todayHoliday) {
                            if (todayHoliday._id === 'weekend') {
                                sessionStorage.setItem(`seen_weekend_${todayHoliday.date.substring(0, 10)}`, 'true');
                            } else {
                                sessionStorage.setItem(`seen_holiday_${todayHoliday._id}`, 'true');
                            }
                        }
                        window.location.reload();
                    } else {
                        alert(data.message || 'Failed to submit request');
                    }
                }
            } catch (err) {
                console.error("Error submitting work request", err);
            }
        }
        setIsOpen(false);
    };

    if (!isOpen || !todayHoliday) return null;

    const isVideo = todayHoliday.animationResourceType === 'video';

    // ========== APPROVED POPUP ==========
    if (modalMode === 'approved') {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/60">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 30 }}
                        className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                            }`}
                    >
                        <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-green-100">
                            <span className="text-5xl">✅</span>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-xl font-semibold uppercase tracking-widest text-green-600 mb-1">
                                Request Approved!
                            </h2>
                            <h1 className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">
                                You can work today
                            </h1>
                            <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Your request to work on <strong>{todayHoliday.title === 'Saturday' || todayHoliday.title === 'Sunday' ? 'this weekend' : todayHoliday.title}</strong> has been approved. You can now check in!
                            </p>
                        </motion.div>
                        <button
                            onClick={handleDismissApproved}
                            className="w-full py-3 px-4 shadow-lg shadow-green-500/30 rounded-xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:opacity-90 transition-transform active:scale-95"
                        >
                            Got it, let&apos;s work! 💪
                        </button>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // ========== REJECTED POPUP ==========
    if (modalMode === 'rejected') {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/60">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 30 }}
                        className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                            }`}
                    >
                        <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-red-100">
                            <span className="text-5xl">🎉</span>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-xl font-semibold uppercase tracking-widest text-[#f43f5e] mb-1">
                                {todayHoliday._id === 'weekend' ? 'Enjoy Your Weekend!' : 'Enjoy Your Holiday!'}
                            </h2>
                            <h1 className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
                                Request Not Approved
                            </h1>
                            <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Your request to work on <strong>{todayHoliday.title === 'Saturday' || todayHoliday.title === 'Sunday' ? 'this weekend' : todayHoliday.title}</strong> was not accepted. Take a rest and enjoy your day off! 🌴
                            </p>
                        </motion.div>
                        <button
                            onClick={handleDismissRejected}
                            className={`w-full py-3 px-4 rounded-xl font-bold transition-all active:scale-95 ${theme === 'dark'
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Okay, enjoy! 🎊
                        </button>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // ========== HOLIDAY ANNOUNCEMENT (default / no request or re-request) ==========
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/60">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 30 }}
                    className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                        }`}
                >
                    {/* Animated Background / Media */}
                    <div className="w-48 h-48 mb-6 rounded-2xl overflow-hidden shadow-lg border-4 border-white/10 relative">
                        {isVideo ? (
                            <video
                                src={todayHoliday.animationUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={todayHoliday.animationUrl}
                                alt={todayHoliday.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full"
                    >
                        {!showReasonMode ? (
                            <>
                                <h2 className="text-xl font-semibold uppercase tracking-widest text-[#f43f5e] mb-1">
                                    {todayHoliday._id === 'weekend' ? 'Today is a Weekend' : 'Today is a Holiday'}
                                </h2>
                                <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
                                    {todayHoliday.title}
                                </h1>
                                <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {todayHoliday._id === 'weekend'
                                        ? 'If you want to work, request to check-in. If the admin approves, your weekend work will be counted; otherwise, it will not be counted.'
                                        : 'Enjoy your day off! You are not expected to work today.'}
                                </p>
                            </>
                        ) : (
                            <div className="mb-6 w-full text-left">
                                <h2 className="text-xl font-semibold mb-2">Why do you want to work today?</h2>
                                <textarea
                                    className={`w-full p-4 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'
                                        } border`}
                                    rows={3}
                                    placeholder="Enter your reason here..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}
                    </motion.div>

                    <div className="flex items-center gap-4 w-full">
                        {!showReasonMode ? (
                            <>
                                <button
                                    onClick={handleIgnore}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all transition-transform active:scale-95 ${theme === 'dark'
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Ignore
                                </button>
                                <button
                                    onClick={handleInitialRequestClick}
                                    className="flex-1 py-3 px-4 shadow-lg shadow-blue-500/30 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:opacity-90 transition-transform active:scale-95"
                                >
                                    Request to Work
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowReasonMode(false)}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all transition-transform active:scale-95 ${theme === 'dark'
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestToWork}
                                    className="flex-1 py-3 px-4 shadow-lg shadow-blue-500/30 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:opacity-90 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!reason.trim()}
                                >
                                    Submit Request
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
