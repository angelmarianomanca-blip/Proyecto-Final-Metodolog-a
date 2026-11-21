'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  SESSION_INACTIVITY_MINUTES,
  SESSION_INACTIVITY_MS,
  SESSION_LAST_ACTIVITY_KEY,
} from '@/lib/constants';

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'pointerdown',
];

const ACTIVITY_THROTTLE_MS = 10_000;
const CHECK_INTERVAL_MS = 15_000;

export function SessionInactivityGuard() {
  const router = useRouter();
  const loggingOutRef = React.useRef(false);
  const lastWriteRef = React.useRef(0);

  React.useEffect(() => {
    const readLastActivity = (): number | null => {
      try {
        const raw = window.localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
        if (!raw) return null;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };

    const writeLastActivity = (now: number) => {
      lastWriteRef.current = now;
      try {
        window.localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(now));
      } catch {
        // Ignorar si localStorage no está disponible
      }
    };

    const triggerAutoLogout = async () => {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      try {
        window.localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
      } catch {
        // Ignorar
      }
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Aunque falle la red, redirigimos al login
      }
      toast.info(
        `Tu sesión se cerró automáticamente tras ${SESSION_INACTIVITY_MINUTES} minutos de inactividad. Volvé a iniciar sesión.`
      );
      router.push('/login');
      router.refresh();
    };

    const checkInactivity = () => {
      if (loggingOutRef.current) return;
      const last = readLastActivity();
      const now = Date.now();
      if (last === null) {
        writeLastActivity(now);
        return;
      }
      if (now - last >= SESSION_INACTIVITY_MS) {
        void triggerAutoLogout();
      }
    };

    const handleActivity = () => {
      if (loggingOutRef.current) return;
      const now = Date.now();
      // Verificar primero si ya expiró antes de refrescar (ej. PC suspendida)
      const last = readLastActivity();
      if (last !== null && now - last >= SESSION_INACTIVITY_MS) {
        void triggerAutoLogout();
        return;
      }
      if (now - lastWriteRef.current >= ACTIVITY_THROTTLE_MS) {
        writeLastActivity(now);
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    // Comprobación inicial al montar
    checkInactivity();

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    const intervalId = window.setInterval(checkInactivity, CHECK_INTERVAL_MS);

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleActivity);
      }
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
