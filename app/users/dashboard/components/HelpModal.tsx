'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useToast } from '../../../../contexts/ToastContext';

export default function HelpModal({
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
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  /* ================= FETCH TICKETS ================= */
  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);

      const res = await fetch(`/api/users/dashboard/help/getdata?email=${userEmail}`);
      const data = await res.json();

      if (data.success) {
        setTickets(data.data);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen && userEmail) {
      setViewMode('list');
      fetchTickets();
    }
  }, [isOpen]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toastWarning('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/users/dashboard/help/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          subject: subject.trim(),
          category,
          priority,
          message: message.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        setSubject('');
        setMessage('');
        setCategory('technical');
        setPriority('medium');
        setViewMode('list');
        fetchTickets();
      } else {
        toastError(data.message || 'Failed');
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`w-[520px] max-h-[85vh] overflow-y-auto p-8 rounded-2xl shadow-2xl transform transition-all duration-300 ${theme === 'dark'
          ? 'bg-gray-900/90 text-white border border-gray-700'
          : 'bg-white/90 text-gray-900 border border-gray-200'
        } backdrop-blur-xl`}>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {viewMode === 'list' ? 'Your Help requests' : 'Take Help'}
          </h2>

          <div className="flex items-center gap-2">
            {viewMode === 'list' && (
              <button
                onClick={() => setViewMode('form')}
                className="flex cursor-pointer items-center gap-1 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                title="Create New Ticket"
              >
                <Plus size={16} />
                Take Help
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
            {loadingTickets && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!loadingTickets && tickets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No help requests found
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Create a new ticket to get help
                </p>
              </div>
            )}

            {!loadingTickets && tickets.map((ticket) => (
              <div
                key={ticket._id}
                className={`rounded-xl p-4 mb-3 transition-all duration-200 hover:shadow-lg backdrop-blur-sm ${theme === 'dark'
                    ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800/70'
                    : 'bg-white/50 border border-gray-200 hover:bg-white/70'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm flex-1 pr-2">{ticket.subject}</p>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${ticket.status === 'open'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : ticket.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {ticket.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${ticket.priority === 'high'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                      : ticket.priority === 'medium'
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                    }`}>
                    {ticket.priority}
                  </span>
                </div>

                <p className="text-xs mt-3 text-gray-600 dark:text-gray-300 line-clamp-2">
                  {ticket.message}
                </p>

                <p className="text-xs mt-2 text-gray-400">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </>
        )}

        {/* ================= FORM VIEW ================= */}
        {viewMode === 'form' && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter ticket subject"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                    } backdrop-blur-sm`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer ${theme === 'dark'
                        ? 'bg-gray-800/50 border-gray-600 text-white'
                        : 'bg-white/50 border-gray-300 text-gray-900'
                      } backdrop-blur-sm`}
                  >
                    <option value="technical">Technical</option>
                    <option value="account">Account</option>
                    <option value="attendance">Attendance</option>
                    <option value="project">Project</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer ${theme === 'dark'
                        ? 'bg-gray-800/50 border-gray-600 text-white'
                        : 'bg-white/50 border-gray-300 text-gray-900'
                      } backdrop-blur-sm`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Message *</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none ${theme === 'dark'
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg backdrop-blur-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit
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
