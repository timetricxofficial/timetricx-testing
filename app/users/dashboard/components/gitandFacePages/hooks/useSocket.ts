'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

interface UseSocketProps {
  onVerificationRequest: (adminId: string | null, scheduledTime: string) => void;
}

export function useSocket({ onVerificationRequest }: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (!userCookie) return;

    try {
      const user = JSON.parse(userCookie);
      if (!user || !user._id) return;

      const socketInstance = io(window.location.origin, {
        path: '/api/socket',
      });

      socketInstance.on('connect', () => {
        
        socketInstance.emit('join_room', user._id);
      });

      socketInstance.on('trigger_face_verification', (data) => {
        
        const checkInTime = localStorage.getItem('face_verify_checkin_time');
        const scheduledTime = checkInTime 
          ? parseISTDate(checkInTime).toISOString() 
          : new Date().toISOString();
        
        onVerificationRequest(data?.adminId || null, scheduledTime);
      });

      socketRef.current = socketInstance;

      return () => {
        socketInstance.disconnect();
        socketRef.current = null;
      };
    } catch (e) {
      console.error('Error setting up socket:', e);
    }
  }, [onVerificationRequest]);

  const emitVerificationResult = (data: {
    userId: string;
    adminId: string;
    userName: string;
    status: 'verified' | 'partial_match' | 'present_but_failed' | 'not_present';
    score: number;
    message: string;
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('verification_result', data);
      
    } else {
      console.error('❌ Socket not available, cannot emit verification_result');
    }
  };

  return { socketRef, emitVerificationResult };
}

function parseISTDate(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split(', ');
  const [day, month, year] = datePart.split('/');
  const [time, period] = timePart.split(' ');
  const [hours, minutes, seconds] = time.split(':');
  
  let hour24 = parseInt(hours);
  if (period.toLowerCase() === 'pm' && hour24 !== 12) hour24 += 12;
  if (period.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;
  
  return new Date(`${year}-${month}-${day}T${String(hour24).padStart(2, '0')}:${minutes}:${seconds}.000+05:30`);
}
