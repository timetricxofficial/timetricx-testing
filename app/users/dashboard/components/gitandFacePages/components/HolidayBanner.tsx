'use client';

import { CompanyHoliday, HolidayRequest } from '../types';

interface HolidayBannerProps {
  todayHoliday: CompanyHoliday;
  holidayWorkRequest: HolidayRequest | null;
  showHolidayReason: boolean;
  holidayReason: string;
  isSubmittingWorkRequest: boolean;
  theme: string;
  onShowReasonInput: () => void;
  onHideReasonInput: () => void;
  onReasonChange: (reason: string) => void;
  onSubmitRequest: () => void;
}

export function HolidayBanner({
  todayHoliday,
  holidayWorkRequest,
  showHolidayReason,
  holidayReason,
  isSubmittingWorkRequest,
  theme,
  onShowReasonInput,
  onHideReasonInput,
  onReasonChange,
  onSubmitRequest
}: HolidayBannerProps) {
  const canRequestAgain = !holidayWorkRequest || 
    (holidayWorkRequest.status === 'rejected' && (holidayWorkRequest.requestCount || 1) < 2);

  return (
    <div className="w-72 bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden relative group">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent dark:from-red-900/10 pointer-events-none" />

      <div className="relative flex flex-col items-center text-center">
        {/* Media Section */}
        <div className="w-20 h-20 mb-3 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          {todayHoliday.animationUrl ? (
            todayHoliday.animationResourceType === 'video' ? (
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
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {todayHoliday.isDefault ? '🏠' : '🎉'}
            </div>
          )}
        </div>

        {/* Content Section */}
        <span className="block text-[#f43f5e] font-bold uppercase tracking-widest text-[9px] mb-0.5">
          {todayHoliday.isDefault ? 'Weekend' : 'Holiday'}
        </span>
        
        <h3 className="text-xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
          {todayHoliday.title}
        </h3>
      
        {canRequestAgain ? (
          !showHolidayReason ? (
            <div className="w-full space-y-2">
              {holidayWorkRequest?.status === 'rejected' && (
                <p className="text-[9px] text-red-600 font-bold bg-red-50 dark:bg-red-900/20 py-1 rounded-lg px-2">
                  Previous request not accepted.
                </p>
              )}
              <button
                onClick={onShowReasonInput}
                className="w-full text-[10px] uppercase font-bold tracking-wider bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
              >
                {holidayWorkRequest?.status === 'rejected' ? 'Try Last Attempt' : 'Request to Work'}
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                type="text"
                placeholder="Reason to work?"
                className={`w-full text-xs p-2 rounded-xl border outline-none focus:ring-2 focus:ring-red-400 transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-red-100 text-gray-800 placeholder-red-300'
                }`}
                value={holidayReason}
                onChange={(e) => onReasonChange(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 w-full">
                <button
                  onClick={onHideReasonInput}
                  className={`flex-1 text-[9px] uppercase font-bold tracking-wide py-2 rounded-xl transition-all active:scale-95 ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={onSubmitRequest}
                  disabled={!holidayReason.trim() || isSubmittingWorkRequest}
                  className="flex-1 text-[9px] uppercase font-bold tracking-wide bg-gradient-to-r from-red-500 to-orange-500 text-white disabled:opacity-50 py-2 rounded-xl shadow-md transition-all active:scale-95"
                >
                  {isSubmittingWorkRequest ? '...' : 'Submit'}
                </button>
              </div>
            </div>
          )
        ) : holidayWorkRequest?.status === 'pending' ? (
          <div className="w-full bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/50 rounded-xl py-2 px-3">
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
              Request Pending Approval
            </p>
          </div>
        ) : holidayWorkRequest?.status === 'rejected' ? (
          <div className="w-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-xl py-2 px-3">
            <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">
              Enjoy your holiday! 🌴
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
