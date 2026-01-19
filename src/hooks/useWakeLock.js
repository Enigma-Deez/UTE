/* src/hooks/useWakeLock.js */
import { useRef, useEffect } from 'react';

export const useWakeLock = (shouldLock) => {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    const requestLock = async () => {
      if ('wakeLock' in navigator && shouldLock) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock active');
        } catch (err) {
          console.warn(`Wake Lock denied: ${err.name}, ${err.message}`);
        }
      }
    };

    const releaseLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    if (shouldLock) {
      requestLock();
    } else {
      releaseLock();
    }

    // Re-acquire lock if page visibility changes (e.g. user switches tab and comes back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldLock) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldLock]);
};