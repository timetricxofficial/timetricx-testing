'use client';

import { useEffect, useState, useCallback } from 'react';

const HEARTBEAT_INTERVAL = 3000;
const HEARTBEAT_TIMEOUT = 10000;

export function useLeaderElection() {
  const [isLeader, setIsLeader] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const channel = new (window.BroadcastChannel || class { 
      onmessage = null; 
      postMessage(msg: any) {
        localStorage.setItem('face_verification_fallback_msg', JSON.stringify({ msg, t: Date.now() }));
      }
      close() {}
    })('face_verification_leader');

    const tabId = Math.random().toString(36).substring(7);

    const claimLeadership = () => {
      localStorage.setItem('face_verification_leader_id', tabId);
      localStorage.setItem('face_verification_leader_last_seen', Date.now().toString());
      setIsLeader(true);
      channel.postMessage({ type: 'leader_claimed', id: tabId });
    };

    const checkLeadership = () => {
      const leaderId = localStorage.getItem('face_verification_leader_id');
      const lastSeen = parseInt(localStorage.getItem('face_verification_leader_last_seen') || '0');
      const now = Date.now();

      if (!leaderId || (leaderId !== tabId && (now - lastSeen > HEARTBEAT_TIMEOUT))) {
        claimLeadership();
      } else if (leaderId === tabId) {
        localStorage.setItem('face_verification_leader_last_seen', now.toString());
        setIsLeader(true);
      } else {
        setIsLeader(false);
      }
    };

    checkLeadership();
    const heartbeatTimer = setInterval(checkLeadership, HEARTBEAT_INTERVAL);

    channel.onmessage = (event: any) => {
      const data = event.data || (event.key === 'face_verification_fallback_msg' ? JSON.parse(event.newValue).msg : null);
      if (!data) return;

      if (data.type === 'who_is_leader' && isLeader) {
        channel.postMessage({ type: 'leader_claimed', id: tabId });
      } else if (data.type === 'leader_claimed' && data.id !== tabId) {
        setIsLeader(false);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'face_verification_fallback_msg' && e.newValue) {
        const { msg } = JSON.parse(e.newValue);
        if (msg.type === 'leader_claimed' && msg.id !== tabId) {
          setIsLeader(false);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    const handleUnload = () => {
      if (isLeader) {
        localStorage.removeItem('face_verification_leader_id');
        localStorage.removeItem('face_verification_leader_last_seen');
        channel.postMessage({ type: 'leader_resigned' });
      }
      clearInterval(heartbeatTimer);
      channel.close();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('storage', handleStorage);
      handleUnload();
    };
  }, [isLeader]);

  return { isLeader };
}
