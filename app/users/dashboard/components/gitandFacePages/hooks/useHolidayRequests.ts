'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useToast } from '../../../../../../contexts/ToastContext';
import { CompanyHoliday, HolidayRequest } from '../types';

export function useHolidayRequests() {
  const { success, error } = useToast();
  
  const [todayHoliday, setTodayHoliday] = useState<CompanyHoliday | null>(null);
  const [holidayWorkRequest, setHolidayWorkRequest] = useState<HolidayRequest | null>(null);
  const [showHolidayReason, setShowHolidayReason] = useState(false);
  const [holidayReason, setHolidayReason] = useState('');
  const [isSubmittingWorkRequest, setIsSubmittingWorkRequest] = useState(false);

  useEffect(() => {
    const fetchHolidayData = async () => {
      const userCookie = Cookies.get('user');
      if (!userCookie) return;

      try {
        const user = JSON.parse(userCookie);
        if (!user || !user.email) return;

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
            const reqRes = await fetch(`/api/attendance/holiday-requests?email=${user.email}&date=${todayDateStr}`, { cache: 'no-store' });
            const reqData = await reqRes.json();
            if (reqData.success && reqData.data) {
              setHolidayWorkRequest(reqData.data);
            }
          } else {
            // Check if it's a weekend (Sat/Sun)
            const day = now.getDay();
            if (day === 0 || day === 6) { // 0 = Sunday, 6 = Saturday
              // Fetch the default holiday from DB
              const defaultHolidayRes = await fetch('/api/users/dashboard/company-holidays?isDefault=true', { cache: 'no-store' });
              const defaultHolidayData = await defaultHolidayRes.json();
              
              if (defaultHolidayData.success && defaultHolidayData.data) {
                // Find the first holiday with isDefault: true
                const defaultHoliday = defaultHolidayData.data.find((h: any) => h.isDefault === true);
                if (defaultHoliday) {
                  const weekendHoliday: CompanyHoliday = {
                    ...defaultHoliday,
                    title: day === 0 ? 'Sunday' : 'Saturday', // Override title with current day
                    date: todayDateStr
                  };
                  setTodayHoliday(weekendHoliday);

                  // Check if request is already made for this weekend
                  const reqRes = await fetch(`/api/attendance/holiday-requests?email=${user.email}&date=${todayDateStr}`, { cache: 'no-store' });
                  const reqData = await reqRes.json();
                  if (reqData.success && reqData.data) {
                    setHolidayWorkRequest(reqData.data);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch holidays or parse user cookie:', err);
      }
    };
    fetchHolidayData();
  }, []);

  useEffect(() => {
    if (!holidayWorkRequest || holidayWorkRequest.status !== 'pending') return;

    const pollStatus = async () => {
      try {
        const userCookie = Cookies.get('user');
        if (!userCookie) return;
        const user = JSON.parse(userCookie);
        const now = new Date();
        const todayDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        const reqRes = await fetch(`/api/attendance/holiday-requests?email=${user.email}&date=${todayDateStr}`, { cache: 'no-store' });
        const reqData = await reqRes.json();

        if (reqData.success && reqData.data && reqData.data.status !== 'pending') {
          setHolidayWorkRequest(reqData.data);
          window.dispatchEvent(new CustomEvent('holidayRequestStatusChanged', {
            detail: { status: reqData.data.status }
          }));
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const interval = setInterval(pollStatus, 10000);
    return () => clearInterval(interval);
  }, [holidayWorkRequest]);

  const handleRequestToWork = async () => {
    if (!holidayReason.trim()) {
      error('Please provide a reason to work.');
      return;
    }

    if (todayHoliday) {
      setIsSubmittingWorkRequest(true);
      try {
        const userCookie = Cookies.get('user');
        if (userCookie) {
          const user = JSON.parse(userCookie);

          const res = await fetch('/api/attendance/holiday-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              holidayId: todayHoliday._id,
              holidayDate: todayHoliday.date,
              reason: holidayReason.trim()
            })
          });

          const data = await res.json();
          if (data.success) {
            success('Work request submitted successfully!');
            setHolidayWorkRequest({ _id: data.data._id, status: 'pending' });
            setShowHolidayReason(false);
          } else {
            error(data.message || 'Failed to submit request');
          }
        }
      } catch (err) {
        console.error('Error submitting work request', err);
        error('Error submitting work request');
      } finally {
        setIsSubmittingWorkRequest(false);
      }
    }
  };

  return {
    todayHoliday,
    holidayWorkRequest,
    showHolidayReason,
    holidayReason,
    isSubmittingWorkRequest,
    setShowHolidayReason,
    setHolidayReason,
    setHolidayWorkRequest,
    handleRequestToWork
  };
}
