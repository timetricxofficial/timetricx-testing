'use client';

import { AttendanceData, AttendanceRecord } from '../types';

interface FaceAttendanceCardProps {
  attendancePercentage: number;
  isCheckedIn: boolean;
  workingHours: number;
  attendanceData: AttendanceData | null;
  onCheckInOutClick: () => void;
  theme: string;
}

export function FaceAttendanceCard({
  attendancePercentage,
  isCheckedIn,
  workingHours,
  attendanceData,
  onCheckInOutClick,
  theme
}: FaceAttendanceCardProps) {
  const getLatestRecord = (): AttendanceRecord | null => {
    if (!attendanceData?.records || attendanceData.records.length === 0) return null;
    return [...attendanceData.records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  };

  const latestRecord = getLatestRecord();

  return (
    <div className="w-60 h-full bg-[#00c950] rounded-2xl p-2 shadow">
      <button
        onClick={onCheckInOutClick}
        className={`w-full mb-2 py-2 rounded-lg text-white cursor-pointer
        ${isCheckedIn ? 'bg-red-600' : 'bg-blue-600'}`}
      >
        {isCheckedIn ? '🚪 Check Out' : '📸 Check In'}
      </button>

      <div className={`rounded-2xl p-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <p className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Total Attendance
        </p>

        <h3 className="text-xl font-bold text-blue-600 text-center mb-2">
          {attendancePercentage}%
        </h3>

        {isCheckedIn && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {workingHours >= 6 ? 'Completed Hours' : 'Working Hours'}
              </span>
              <span className="text-xs font-bold text-blue-600">
                {Math.min(workingHours, 6).toFixed(1)} / 6 hrs
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-1">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((workingHours / 6) * 100, 100)}%` }}
              />
            </div>

            {workingHours >= 6 && (
              <p className="text-[10px] text-blue-600">
                ✓ 6 hours completed
              </p>
            )}
          </div>
        )}

        {latestRecord && (
          <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
            <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Latest Attendance
            </p>
            <p className={`text-[10px] mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Date: {latestRecord.date}
            </p>

            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Entry: {latestRecord.entryTime || 'Not marked'}
                </span>
              </div>

              {latestRecord.exitTime && (
                <div className="flex justify-between text-[10px]">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Exit: {latestRecord.exitTime}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
