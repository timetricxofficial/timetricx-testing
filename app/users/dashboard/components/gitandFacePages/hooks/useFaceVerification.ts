'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import { useToast } from '../../../../../../contexts/ToastContext';
import { VerificationSession } from '../types';

export function useFaceVerification(isCheckedIn: boolean, isLeader: boolean) {
  const { success, error } = useToast();
  
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [nextRetryAt, setNextRetryAt] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'suspicious' | 'missed' | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const [attemptNo, setAttemptNo] = useState<number>(1);
  const [isStartingVerification, setIsStartingVerification] = useState(false);
  const [requestingAdminId, setRequestingAdminId] = useState<string | null>(null);
  
  const onStartCameraRef = useRef<((autoCapture: boolean, scheduledTime: string | null) => void) | null>(null);

  const setStartCameraCallback = useCallback((callback: (autoCapture: boolean, scheduledTime: string | null) => void) => {
    onStartCameraRef.current = callback;
  }, []);

  const parseISTDate = useCallback((dateStr: string): Date => {
    const [datePart, timePart] = dateStr.split(', ');
    const [day, month, year] = datePart.split('/');
    const [time, period] = timePart.split(' ');
    const [hours, minutes, seconds] = time.split(':');
    
    let hour24 = parseInt(hours);
    if (period.toLowerCase() === 'pm' && hour24 !== 12) hour24 += 12;
    if (period.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;
    
    return new Date(`${year}-${month}-${day}T${String(hour24).padStart(2, '0')}:${minutes}:${seconds}.000+05:30`);
  }, []);

  const handleVerificationRequest = useCallback((adminId: string | null, scheduledTime: string) => {
    success('Admin requested a presence check. Verifying...');
    
    if (adminId) {
      setRequestingAdminId(adminId);
    }
    
    setScheduledAt(scheduledTime);
    setAttemptNo(1);
    setVerificationStatus('pending');
    
    if (onStartCameraRef.current) {
      onStartCameraRef.current(true, scheduledTime);
    }
  }, [success]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onStartCameraRef.current) {
            onStartCameraRef.current(true, null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  useEffect(() => {
    const syncVerification = async () => {
      const userCookie = Cookies.get('user');
      if (!userCookie) return;
      
      if (!isCheckedIn) return;
      
      try {
        const user = JSON.parse(userCookie);
        const res = await fetch(`/api/attendance/face-verify-log?email=${user.email}`);
        const data = await res.json();
        
        if (data.success && data.pendingSession) {
          const session: VerificationSession = data.pendingSession;
          
          const sessionDate = new Date(session.scheduledAt).toLocaleDateString('en-CA', {
            timeZone: 'Asia/Kolkata'
          });
          const today = new Date().toLocaleDateString('en-CA', {
            timeZone: 'Asia/Kolkata'
          });
          
          if (sessionDate !== today) {
            console.log('Old pending session found, skipping:', sessionDate);
            return;
          }
          
          const checkInTime = localStorage.getItem('face_verify_checkin_time');
          const scheduledTime = checkInTime ? parseISTDate(checkInTime).toISOString() : session.scheduledAt;
          setScheduledAt(scheduledTime);
          setAttemptNo(session.attempts.length + 1);
          setVerificationStatus(session.finalStatus);
          
          if (session.nextRetryAt) {
            setNextRetryAt(session.nextRetryAt);
            const diff = Math.max(0, new Date(session.nextRetryAt).getTime() - Date.now());
            setRetryCountdown(Math.ceil(diff / 1000));
            
            if (diff <= 0 && onStartCameraRef.current) {
              onStartCameraRef.current(true, null);
            }
          } else {
            if (onStartCameraRef.current) {
              onStartCameraRef.current(true, null);
            }
          }
        }
      } catch (err) {
        console.error('Sync error:', err);
      }
    };
    syncVerification();
  }, [isCheckedIn, parseISTDate]);

  useEffect(() => {
    console.log('[DEBUG] 2-hour scheduler useEffect triggered');
    console.log('[DEBUG] isCheckedIn:', isCheckedIn, 'isLeader:', isLeader);
    
    if (!isCheckedIn || !isLeader) {
      console.log('[DEBUG] Skipping scheduler - isCheckedIn or isLeader is false');
      return;
    }

    const checkInTime = localStorage.getItem('face_verify_checkin_time');
    console.log('[DEBUG] localStorage checkInTime:', checkInTime);
    
    if (checkInTime) {
      const checkInDate = parseISTDate(checkInTime);
      const hoursSinceCheckIn = (Date.now() - checkInDate.getTime()) / (1000 * 60 * 60);
      console.log('[DEBUG] Hours since check-in:', hoursSinceCheckIn);
      
      if (hoursSinceCheckIn >= 8) {
        console.log('[DEBUG] 8 hours completed, stopping verification');
        return;
      }
    } else {
      console.log('[DEBUG] No checkInTime in localStorage!');
      return;
    }
    
    console.log('[DEBUG] ✅ 2-hour scheduler STARTING');

    const interval = setInterval(async () => {
      console.log('[DEBUG] ⏰ 2-hour interval TRIGGERED at:', new Date().toLocaleTimeString());
      
      if (scheduledAt || retryCountdown > 0 || isStartingVerification) {
        console.log('[DEBUG] Skipping 2-hour interval - Session in progress or Retrying');
        return;
      }
      
      const checkInTime = localStorage.getItem('face_verify_checkin_time');
      console.log('[DEBUG] Interval - checkInTime:', checkInTime);
      
      if (checkInTime) {
        const checkInDate = parseISTDate(checkInTime);
        const hoursSinceCheckIn = (Date.now() - checkInDate.getTime()) / (1000 * 60 * 60);
        console.log('[DEBUG] Interval - hoursSinceCheckIn:', hoursSinceCheckIn);
        
        if (hoursSinceCheckIn >= 8) {
          console.log('[DEBUG] 8 hours completed, stopping verification');
          return;
        }
      } else {
        console.log('[DEBUG] No checkInTime in localStorage during interval!');
        return;
      }
      
      const userCookie = Cookies.get('user');
      console.log('[DEBUG] Interval - userCookie exists:', !!userCookie);
      if (!userCookie) {
        console.log('[DEBUG] No userCookie, returning');
        return;
      }
      
      setIsStartingVerification(true);
      
      try {
        const user = JSON.parse(userCookie);
        console.log('[DEBUG] Interval - checking API for:', user.email);
        const res = await fetch(`/api/attendance/face-verify-log?email=${user.email}`);
        const data = await res.json();
        console.log('[DEBUG] Interval - API response:', data);
        
        if (data.success && data.pendingSession) {
          console.log('[DEBUG] Existing pending session found, skipping');
          setIsStartingVerification(false);
          return;
        }

        console.log('[DEBUG] ✅ No pending session, starting new verification');
        const checkInTime = localStorage.getItem('face_verify_checkin_time');
        const scheduledTime = checkInTime ? parseISTDate(checkInTime).toISOString() : new Date().toISOString();
        setScheduledAt(scheduledTime);
        setAttemptNo(1);
        setVerificationStatus('pending');
        localStorage.setItem('face_verify_last_capture', new Date().toISOString());
        console.log('[DEBUG] 📸 Starting camera for auto capture, scheduledAt:', scheduledTime);
        if (onStartCameraRef.current) {
          onStartCameraRef.current(true, scheduledTime);
        }
      } catch (err) {
        console.error('Scheduler pre-check error:', err);
      } finally {
        setIsStartingVerification(false);
      }
    }, 2 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isCheckedIn, isLeader, scheduledAt, retryCountdown, isStartingVerification, parseISTDate]);

  const logVerificationAttempt = useCallback(async (
    email: string,
    status: 'success' | 'partial' | 'fail',
    confidence: number,
    attemptNumber: number,
    effectiveScheduledAt: string
  ) => {
    try {
      const logRes = await fetch('/api/attendance/face-verify-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          scheduledAt: effectiveScheduledAt,
          status,
          confidence,
          attemptNo: attemptNumber
        })
      });
      const logData = await logRes.json();
      if (logData.success) {
        setVerificationStatus(logData.sessionStatus);
        if (logData.sessionStatus === 'pending' && logData.nextRetryAt) {
          setNextRetryAt(logData.nextRetryAt);
          const diff = Math.max(0, new Date(logData.nextRetryAt).getTime() - Date.now());
          setRetryCountdown(Math.ceil(diff / 1000));
        } else {
          setNextRetryAt(null);
          setRetryCountdown(0);
          setScheduledAt(null);
        }
      }
      return logData;
    } catch (err) {
      console.error('Logging error:', err);
      return null;
    }
  }, []);

  const clearVerificationState = useCallback(() => {
    setRequestingAdminId(null);
  }, []);

  return {
    scheduledAt,
    nextRetryAt,
    verificationStatus,
    retryCountdown,
    attemptNo,
    isStartingVerification,
    requestingAdminId,
    handleVerificationRequest,
    logVerificationAttempt,
    clearVerificationState,
    setStartCameraCallback
  };
}
