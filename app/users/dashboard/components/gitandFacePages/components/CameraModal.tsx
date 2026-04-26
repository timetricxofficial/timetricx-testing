'use client';

import { RefObject } from 'react';

interface CameraModalProps {
  showCamera: boolean;
  isAutoVerifying: boolean;
  isCheckedIn: boolean;
  cameraReady: boolean;
  loading: boolean;
  countdown: number | null;
  theme: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  onClose: () => void;
  onCapture: () => void;
}

export function CameraModal({
  showCamera,
  isAutoVerifying,
  isCheckedIn,
  cameraReady,
  loading,
  countdown,
  theme,
  videoRef,
  onClose,
  onCapture
}: CameraModalProps) {
  if (!showCamera) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-white/10 bg-zinc-900' : 'border-gray-100 bg-white'} shadow-2xl`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-4">
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {isAutoVerifying ? 'Face Verification' : (isCheckedIn ? 'Check Out' : 'Check In')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover -scale-x-100"
            />
            
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            )}

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-7xl font-bold text-white">{countdown}</span>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            {!isAutoVerifying && (
              <button
                onClick={onCapture}
                disabled={!cameraReady || loading}
                className="relative flex-1 overflow-hidden rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Capture'
                )}
              </button>
            )}
            {isAutoVerifying && (
              <div className="flex-1 flex items-center justify-center bg-blue-600/10 rounded-xl border border-blue-500/30">
                <span className="text-blue-500 font-medium text-sm animate-pulse">Auto Capturing...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
