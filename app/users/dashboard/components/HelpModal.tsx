'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
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

  const {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning
  } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'form' | 'chat'>('list');

  const [tickets, setTickets] = useState<any[]>([]);

  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [loadingTickets, setLoadingTickets] = useState(false);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);

      const res = await fetch(
        `/api/users/dashboard/help/getdata?email=${userEmail}`
      );

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

  /* ================= CREATE ================= */

  const handleSubmit = async () => {

    if (!subject.trim() || !message.trim()) {
      toastWarning('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        '/api/users/dashboard/help/request',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userEmail,
            subject,
            category,
            priority,
            message
          })
        }
      );

      const data = await res.json();

      if (data.success) {

        toastSuccess('Ticket created');

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
      toastError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* ================= REPLY ================= */

  const sendReply = async () => {

    if (!replyMessage.trim()) return;

    try {

      const res = await fetch(
        '/api/users/dashboard/help/reply',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ticketId: selectedTicket._id,
            sender: 'user',
            text: replyMessage
          })
        }
      );

      const data = await res.json();

      if (data.success) {

        setReplyMessage('');

        setSelectedTicket(data.data);

        fetchTickets();

      } else {
        toastError(data.message || 'Failed');
      }

    } catch (err) {
      console.error(err);
      toastError('Reply failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

      <div
        className={`w-[650px] max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col ${theme === 'dark'
          ? 'bg-[#0f172a] border border-white/10 text-white'
          : 'bg-white border border-gray-200 text-gray-900'
          }`}
      >

        {/* HEADER */}

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">

          <div>
            <h2 className="text-xl font-bold">
              {viewMode === 'list'
                ? 'Help Center'
                : viewMode === 'form'
                  ? 'Create Ticket'
                  : selectedTicket?.subject}
            </h2>

            <p className="text-xs opacity-70 mt-1">
              Raise issue and chat with admin
            </p>
          </div>

          <div className="flex items-center gap-2">

            {viewMode === 'list' && (
              <button
                onClick={() => setViewMode('form')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  New Ticket
                </div>
              </button>
            )}

            {(viewMode === 'form' || viewMode === 'chat') && (
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-sm cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-black/10 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= LIST ================= */}

        {viewMode === 'list' && (
          <div className="flex-1 overflow-y-auto p-5">

            {loadingTickets && (
              <div className="py-10 flex justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loadingTickets && tickets.length === 0 && (
              <div className="text-center py-20 opacity-70">
                <MessageCircle size={40} className="mx-auto mb-4" />
                <p>No help tickets yet</p>
              </div>
            )}

            {!loadingTickets && tickets.map((ticket) => (

              <div
                key={ticket._id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setViewMode('chat');
                }}
                className={`p-5 rounded-2xl mb-4 cursor-pointer transition-all hover:scale-[1.01] ${theme === 'dark'
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                  : 'bg-gray-50 border border-gray-200 hover:bg-white'
                  }`}
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-2 flex-wrap">

                      <h3 className="font-semibold truncate">
                        {ticket.subject}
                      </h3>

                      <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${ticket.priority === 'high'
                        ? 'bg-red-500/20 text-red-500'
                        : ticket.priority === 'medium'
                          ? 'bg-orange-500/20 text-orange-500'
                          : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        {ticket.priority}
                      </span>
                    </div>

                    <p className="text-xs opacity-70 mt-2 line-clamp-2">
                      {ticket.lastMessage}
                    </p>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">

                      <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 uppercase">
                        {ticket.category}
                      </span>

                      <span className={`text-[10px] px-2 py-1 rounded-lg uppercase ${ticket.status === 'open'
                        ? 'bg-green-500/10 text-green-500'
                        : ticket.status === 'in_progress'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-gray-500/10 text-gray-400'
                        }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] opacity-50 whitespace-nowrap">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= FORM ================= */}

        {viewMode === 'form' && (

          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            <div>
              <label className="text-sm font-medium block mb-2">
                Subject
              </label>

              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter issue subject"
                className={`w-full px-4 py-3 rounded-2xl outline-none border ${theme === 'dark'
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-gray-50 border-gray-200'
                  }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="text-sm font-medium block mb-2">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl outline-none border ${theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <option value="technical">Technical</option>
                  <option value="attendance">Attendance</option>
                  <option value="account">Account</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl outline-none border ${theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Message
              </label>

              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue..."
                className={`w-full px-4 py-4 rounded-2xl outline-none resize-none border ${theme === 'dark'
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-gray-50 border-gray-200'
                  }`}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Create Ticket'}
            </button>
          </div>
        )}

        {/* ================= CHAT ================= */}

        {viewMode === 'chat' && selectedTicket && (

          <>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-black/[0.02] dark:bg-white/[0.02]">

              {selectedTicket.messages?.map((msg: any, idx: number) => (

                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user'
                    ? 'justify-end'
                    : 'justify-start'}
                  `}
                >

                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-lg ${msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : theme === 'dark'
                        ? 'bg-white/10 text-white rounded-bl-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                      }`}
                  >

                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>

                    <p className={`text-[10px] mt-2 ${msg.sender === 'user'
                      ? 'text-blue-100'
                      : 'opacity-50'}
                    `}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT */}

            {selectedTicket.status !== 'closed' && (

              <div className="p-4 border-t border-white/10">

                <div className="flex items-end gap-3">

                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className={`flex-1 px-4 py-3 rounded-2xl resize-none outline-none border ${theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  />

                  <button
                    onClick={sendReply}
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


