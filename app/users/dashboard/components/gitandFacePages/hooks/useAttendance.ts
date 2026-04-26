'use client';

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { AttendanceData } from '../types';

export function useAttendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [workingHours, setWorkingHours] = useState(0);

  const fetchAttendance = useCallback(async () => {
    const userCookie = Cookies.get('user');
    if (!userCookie) return;

    try {
      const user = JSON.parse(userCookie);
      if (!user || !user.email) return;
      const res = await fetch(`/api/attendance/get-attendance?email=${user.email}`);
      const result = await res.json();

      if (result.success) {
        setAttendancePercentage(result.data.percentage);
        setIsCheckedIn(result.data.todayEntry);
        setAttendanceData(result.data);
      }
    } catch (e) {
      console.error('Error fetching attendance or parsing user cookie', e);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    if (Cookies.get('checkin_time')) setIsCheckedIn(true);
  }, [fetchAttendance]);

  const calculateWorkingHours = useCallback(() => {
    let entryTime: Date | null = null;

    const cookieTime = Cookies.get('checkin_time');
    if (cookieTime) {
      const parsed = new Date(cookieTime);
      const today = new Date().toDateString();
      // Only use cookie time if it's from today
      if (parsed.toDateString() === today) {
        entryTime = parsed;
      }
    }

    if (!entryTime && attendanceData?.records) {
      const today = new Date().toISOString().split('T')[0];
      const rec = attendanceData.records.find((r: any) => r.date === today);
      if (rec?.entryTime) {
        const [time, meridian] = rec.entryTime.split(' ');
        let [hh, mm] = time.split(':').map(Number);
        if (meridian === 'PM' && hh !== 12) hh += 12;
        if (meridian === 'AM' && hh === 12) hh = 0;
        entryTime = new Date();
        entryTime.setHours(hh, mm, 0, 0);
      }
    }

    if (!entryTime) return;

    const diff = (Date.now() - entryTime.getTime()) / (1000 * 60 * 60);
    const hours = Math.min(Math.max(0, diff), 8); // Changed from 6 to 8 hours
    setWorkingHours(hours);
  }, [attendanceData]);

  useEffect(() => {
    if (isCheckedIn) {
      calculateWorkingHours();
      const interval = setInterval(calculateWorkingHours, 60000);
      return () => clearInterval(interval);
    }
  }, [isCheckedIn, calculateWorkingHours]);

  const handleCheckInSuccess = useCallback(() => {
    const now = new Date();
    const checkInTime = now.toISOString();
    Cookies.set('checkin_time', checkInTime, { expires: 1 });
    
    const checkInTimeIST = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    localStorage.setItem('face_verify_checkin_time', checkInTimeIST);
    localStorage.removeItem('face_verify_last_capture');
    Cookies.remove('checkout_time');
    setIsCheckedIn(true);
  }, []);

  const handleCheckOutSuccess = useCallback(() => {
    Cookies.remove('checkin_time');
    Cookies.set('checkout_time', new Date().toISOString(), { expires: 1 });
    localStorage.removeItem('face_verify_checkin_time');
    localStorage.removeItem('face_verify_last_capture');
    setIsCheckedIn(false);
  }, []);

  return {
    attendanceData,
    attendancePercentage,
    isCheckedIn,
    workingHours,
    fetchAttendance,
    handleCheckInSuccess,
    handleCheckOutSuccess,
    setIsCheckedIn
  };
}
