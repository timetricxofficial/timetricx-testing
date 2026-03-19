'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../../contexts/ToastContext';

/* ================= CUSTOM CALENDAR PICKER ================= */
function CalendarPicker({
  value,
  onChange,
  theme,
  label,
  minDate,
  disabled = false,
  disabledLeaves = [],
  companyHolidays = [],
}: {
  value: string;
  onChange: (val: string) => void;
  theme: string;
  label: string;
  minDate?: string;
  disabled?: boolean;
  disabledLeaves?: any[];
  companyHolidays?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const ref = useRef<HTMLDivElement>(null);

  // When value changes, sync viewDate
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isDateDisabled = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (d < today) return true;
    if (minDate) {
      const min = new Date(minDate + 'T00:00:00');
      if (d < min) return true;
    }

    if (disabledLeaves.length > 0) {
      const checkTime = d.getTime();
      for (const leave of disabledLeaves) {
        if (leave.status === 'rejected') continue;
        const lStart = new Date(leave.fromDate).getTime();
        const lEnd = new Date(leave.toDate).getTime();
        if (checkTime >= lStart && checkTime <= lEnd) return true;
      }
    }

    if (companyHolidays.length > 0) {
      const checkDateStr = dateStr; // YYYY-MM-DD
      const isHoliday = companyHolidays.some(h => {
        const hDate = new Date(h.date);
        const hDateStr = `${hDate.getFullYear()}-${(hDate.getMonth() + 1).toString().padStart(2, '0')}-${hDate.getDate().toString().padStart(2, '0')}`;
        return hDateStr === checkDateStr;
      });
      if (isHoliday) return true;
    }

    return false;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Display button */}
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(!open); }}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl border text-left transition-all duration-200 text-sm cursor-pointer
          ${open ? 'ring-2 ring-green-500 border-transparent' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${theme === 'dark'
            ? 'bg-gray-800/50 border-gray-600 text-white hover:border-gray-500'
            : 'bg-white/50 border-gray-300 text-gray-900 hover:border-gray-400'
          } backdrop-blur-sm`}
      >
        {value ? (
          <span className="font-medium">{formatDisplay(value)}</span>
        ) : (
          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
            Select date
          </span>
        )}
      </button>

      {/* Calendar popup — centered overlay on top of everything */}
      <AnimatePresence>
        {open && (
          <>
            {/* Dark backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[80]"
              onClick={() => setOpen(false)}
            />

            {/* Centered calendar popup */}
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, type: 'spring', damping: 25 }}
              className={`fixed z-[90] w-[340px] p-5 rounded-2xl shadow-2xl border
                top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                ${theme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
                }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold opacity-70">{label}</h4>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={`p-1 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  ✕
                </button>
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer
                  ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="text-sm font-semibold">
                  {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>

                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer
                  ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 text-center mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[11px] font-semibold opacity-50 py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const isSelected = value === dateStr;
                  const isDisabled = isDateDisabled(dateStr);
                  const isToday = dateStr === `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          onChange(dateStr);
                          setOpen(false);
                        }
                      }}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-150 mx-auto flex items-center justify-center
                      ${isSelected
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-110'
                          : isDisabled
                            ? 'opacity-25 cursor-not-allowed'
                            : isToday
                              ? theme === 'dark'
                                ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-800/50 cursor-pointer'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                              : theme === 'dark'
                                ? 'hover:bg-gray-700 text-gray-300 cursor-pointer'
                                : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Today shortcut */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
                    if (!isDateDisabled(todayStr)) {
                      onChange(todayStr);
                      setOpen(false);
                    }
                  }}
                  className="text-xs text-green-600 hover:text-green-500 font-medium cursor-pointer"
                >
                  Today
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= LEAVE MODAL ================= */
export default function LeaveModal({
  isOpen,
  onClose,
  theme = 'light',
  userEmail = ''
}: {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  userEmail?: string;
}) {

  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  /* ================= FETCH LEAVES ================= */
  const fetchLeaves = async () => {
    try {
      const res = await fetch(
        `/api/users/dashboard/leaves/getleaves?email=${userEmail}`
      );
      const data = await res.json();

      if (data.success) {
        setLeaves(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch('/api/users/dashboard/company-holidays');
      const data = await res.json();
      if (data.success) {
        setCompanyHolidays(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchLeaves();
      fetchHolidays();
      setViewMode('list');
    }
  }, [isOpen]);

  /* ================= APPLY LEAVE ================= */
  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      toastWarning('Please fill all fields');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/users/dashboard/leaves/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          startDate,
          endDate,
          reason: reason.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        toastSuccess('Leave request submitted');
        setStartDate('');
        setEndDate('');
        setReason('');
        onClose();
      } else {
        toastError(data.message || 'Failed');
      }

    } catch (err) {
      console.error(err);
      toastError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // When start date changes, reset end date if it's before/equal start
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && endDate <= val) {
      setEndDate('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`w-[480px] max-h-[85vh] overflow-y-auto p-8 rounded-2xl shadow-2xl transform transition-all duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${theme === 'dark'
        ? 'bg-gray-900/90 text-white border border-gray-700'
        : 'bg-white/90 text-gray-900 border border-gray-200'
        } backdrop-blur-xl`}>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Leave Management
          </h2>

          <div className="flex items-center gap-2">
            {viewMode === 'list' && (
              <button
                onClick={() => setViewMode('form')}
                className="flex cursor-pointer items-center gap-1 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                title="Apply for Leave"
              >
                <Plus size={16} />
                Take Leave
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ================= LIST VIEW ================= */}
        {viewMode === 'list' && (
          <>
            {leaves.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No leave requests yet
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Click "Take Leave" to apply for leave
                </p>
              </div>
            )}

            {leaves.map((leave) => (
              <div
                key={leave._id}
                className={`rounded-xl p-4 mb-3 transition-all duration-200 hover:shadow-lg backdrop-blur-sm ${theme === 'dark'
                  ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70'
                  : 'bg-white/50 border border-gray-200 hover:bg-white/70'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {new Date(leave.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' - '}
                      {new Date(leave.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {leave.totalDays} day(s)
                    </p>
                  </div>

                  <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${leave.status === 'approved'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : leave.status === 'rejected'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                    {leave.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs mt-3 text-gray-600 dark:text-gray-300 line-clamp-2">
                  {leave.reason}
                </p>

                {leave.status === 'rejected' && leave.rejectionReason && (
                  <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      <span className="font-medium">Reason:</span> {leave.rejectionReason}
                    </p>
                  </div>
                )}

                <p className="text-xs mt-2 text-gray-400">
                  Applied on {new Date(leave.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </>
        )}

        {/* ================= FORM VIEW ================= */}
        {viewMode === 'form' && (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* 🔥 CUSTOM CALENDAR — START DATE */}
                <CalendarPicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  theme={theme}
                  label="Start Date *"
                  disabledLeaves={leaves}
                  companyHolidays={companyHolidays}
                />

                {/* 🔥 CUSTOM CALENDAR — END DATE (disabled until start is selected) */}
                <CalendarPicker
                  value={endDate}
                  onChange={setEndDate}
                  theme={theme}
                  label="End Date *"
                  minDate={startDate}
                  disabled={!startDate}
                  disabledLeaves={leaves}
                  companyHolidays={companyHolidays}
                />
              </div>

              {/* 🔥 Selected range display */}
              {startDate && endDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2
                    ${theme === 'dark'
                      ? 'bg-green-900/30 text-green-400 border border-green-800'
                      : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                >
                  📅 {new Date(startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  {' → '}
                  {new Date(endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' · '}
                  {Math.ceil((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Reason *</label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for leave..."
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none ${theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                    } backdrop-blur-sm`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${theme === 'dark'
                  ? 'bg-gray-800/70 hover:bg-gray-700/70 text-gray-300 border border-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  } backdrop-blur-sm`}
              >
                Back
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg backdrop-blur-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Apply
                  </span>
                )}
              </button>
            </div>
          </>
        )}

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className={`mt-6 w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] cursor-pointer ${theme === 'dark'
            ? 'bg-gray-800/70 hover:bg-gray-700/70 text-gray-300 border border-gray-700'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
            } backdrop-blur-sm`}
        >
          Close
        </button>

      </div>
    </div>
  );
}

