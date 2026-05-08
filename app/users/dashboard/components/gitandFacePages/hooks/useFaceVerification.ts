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
  const scheduledAtRef = useRef<string | null>(null);
  const retryCountdownRef = useRef<number>(0);
  const isStartingVerificationRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const setStartCameraCallback = useCallback((callback: (autoCapture: boolean, scheduledTime: string | null) => void) => {
    onStartCameraRef.current = callback;
  }, []);

  // Keep refs in sync with state
  useEffect(() => { scheduledAtRef.current = scheduledAt; }, [scheduledAt]);
  useEffect(() => { retryCountdownRef.current = retryCountdown; }, [retryCountdown]);
  useEffect(() => { isStartingVerificationRef.current = isStartingVerification; }, [isStartingVerification]);

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
    
    
    
    if (!isCheckedIn || !isLeader) {
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Don't start another interval if one is already running
    if (intervalRef.current) {
      
      return;
    }

    const checkInTime = localStorage.getItem('face_verify_checkin_time');
    if (!checkInTime) {
      
      return;
    }

    const checkInDate = parseISTDate(checkInTime);
    const hoursSinceCheckIn = (Date.now() - checkInDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCheckIn >= 8) {
      
      return;
    }
    
    

    intervalRef.current = setInterval(async () => {
      
      
      // Use refs to check current state without closure issues
      if (scheduledAtRef.current || retryCountdownRef.current > 0 || isStartingVerificationRef.current) {
        
        return;
      }
      
      const userCookie = Cookies.get('user');
      if (!userCookie) return;

      isStartingVerificationRef.current = true;
      setIsStartingVerification(true);
      
      try {
        const user = JSON.parse(userCookie);
        const res = await fetch(`/api/attendance/face-verify-log?email=${user.email}`);
        const data = await res.json();
        
        if (data.success && data.pendingSession) {
          
          setScheduledAt(data.pendingSession.scheduledAt);
          setAttemptNo(data.pendingSession.attempts.length + 1);
          isStartingVerificationRef.current = false;
          setIsStartingVerification(false);
          
          if (onStartCameraRef.current) {
            onStartCameraRef.current(true, data.pendingSession.scheduledAt);
          }
          return;
        }

        
        const scheduledTime = parseISTDate(localStorage.getItem('face_verify_checkin_time')!).toISOString();
        
        setScheduledAt(scheduledTime);
        setAttemptNo(1);
        setVerificationStatus('pending');
        
        if (onStartCameraRef.current) {
          
          onStartCameraRef.current(true, scheduledTime);
        } else {
          console.error('[DEBUG] ❌ Cannot open Camera Modal: onStartCameraRef.current is null');
        }
      } catch (err) {
        console.error('Scheduler error:', err);
      } finally {
        isStartingVerificationRef.current = false;
        setIsStartingVerification(false);
      }
    }, 2 * 60 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCheckedIn, isLeader, parseISTDate]);

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
    setScheduledAt(null);
    setVerificationStatus(null);
    setAttemptNo(1);
    setNextRetryAt(null);
    setRetryCountdown(0);
    isStartingVerificationRef.current = false;
    setIsStartingVerification(false);
    
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
