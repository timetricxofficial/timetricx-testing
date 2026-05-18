'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { GitData } from '../types';

export function useGitData() {
  const [data, setData] = useState<GitData | null>(null);

  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (!userCookie) return;

    try {
      const user = JSON.parse(userCookie);
      if (!user || !user.email) return;

      fetch('/api/attendance/git-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
        .then(res => res.json())
        .then(d => {
          if (d.success) setData(d.data);
        });
    } catch (e) {
      console.error('Error parsing user cookie', e);
    }
  }, []);

  return { data };
}
