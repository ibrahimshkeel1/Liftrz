import { useEffect, useState } from 'react';

export interface SessionUser {
  id: string;
  role: 'admin' | 'trainer' | 'client';
  name: string;
  email: string;
  phone?: string;
  trainerId?: string;
  city?: string;
  status?: string;
}

export interface SessionData {
  token: string;
  user: SessionUser;
}

const SESSION_KEY = 'Liftrz-session';
const SESSION_EVENT = 'Liftrz-session-change';

export const getSession = (): SessionData | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
};

export const setSession = (session: SessionData) => {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
};

export const clearSession = () => {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
};

export const roleHome = (role: SessionUser['role']) => {
  if (role === 'admin') return '/admin';
  if (role === 'trainer') return '/trainer/dashboard';
  return '/client/dashboard';
};

export const useSession = () => {
  const [session, setCurrentSession] = useState<SessionData | null>(() => getSession());

  useEffect(() => {
    const sync = () => setCurrentSession(getSession());
    window.addEventListener('storage', sync);
    window.addEventListener(SESSION_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(SESSION_EVENT, sync as EventListener);
    };
  }, []);

  return session;
};
