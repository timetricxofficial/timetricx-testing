'use client';

interface CompletionPopupProps {
  show: boolean;
}

export function CompletionPopup({ show }: CompletionPopupProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-pulse">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-lg">Working Hours Completed!</span>
        </div>
      </div>
    </div>
  );
}
