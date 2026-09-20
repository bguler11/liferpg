import { useCallback, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, type DocumentReference } from 'firebase/firestore';
import { auth, configured, db, provider } from './firebase';
import { defaults, ds, migrate, type AppState } from './logic';

const KEY = 'liferpg.v2';
const OLD_KEY = 'liferpg.v1';

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'error';

function loadLocal(today: string): AppState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY);
    if (raw) return migrate(JSON.parse(raw), today);
  } catch {
    /* boş başla */
  }
  return defaults(today);
}
function saveLocal(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* depolama dolu/kapalı */
  }
}
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Bugünün tarihi; gece yarısı geçince kendiliğinden güncellenir. */
export function useToday(): string {
  const [today, setToday] = useState(() => ds(new Date()));
  useEffect(() => {
    const t = window.setInterval(() => setToday(ds(new Date())), 15000);
    const vis = () => setToday(ds(new Date()));
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);
  return today;
}

export function useSync(today: string) {
  const [state, setState] = useState<AppState>(() => loadLocal(today));
  const stateRef = useRef(state);
  const todayRef = useRef(today);
  todayRef.current = today;
  const [user, setUser] = useState<User | null | undefined>(configured ? undefined : null);
  const [status, setStatus] = useState<SyncStatus>(configured ? 'connecting' : 'local');
  const [authError, setAuthError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const ref = useRef<DocumentReference | null>(null);

  const push = useCallback(() => {
    if (!ref.current) return;
    window.clearTimeout(timer.current);
    setDoc(ref.current, clone(stateRef.current)).catch(() => setStatus('error'));
  }, []);
  const schedulePush = useCallback(() => {
    if (!ref.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(push, 600);
  }, [push]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Firestore canlı senkron
  useEffect(() => {
    if (!db || !user) {
      ref.current = null;
      return;
    }
    const r = doc(db, 'users', user.uid, 'app', 'state');
    ref.current = r;
    setStatus('connecting');
    const unsub = onSnapshot(
      r,
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (!snap.exists()) {
          push(); // ilk kurulum: yerel durumu buluta yaz
          setStatus('synced');
          return;
        }
        const remote = migrate(snap.data(), todayRef.current);
        const localTs = stateRef.current.updatedAt;
        if (remote.updatedAt > localTs) {
          stateRef.current = remote;
          setState(remote);
          saveLocal(remote);
        } else if (remote.updatedAt < localTs) {
          schedulePush(); // çevrimdışı yapılan değişiklikler
        }
        setStatus('synced');
      },
      () => setStatus('error')
    );
    return () => {
      unsub();
      ref.current = null;
    };
  }, [user, push, schedulePush]);

  // Sekme kapanırken bekleyen yazmayı gönder
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') push();
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [push]);

  const replace = useCallback(
    (next: AppState) => {
      next.updatedAt = Date.now();
      stateRef.current = next;
      setState(next);
      saveLocal(next);
      schedulePush();
    },
    [schedulePush]
  );
  const update = useCallback(
    (mut: (s: AppState) => void) => {
      const next = clone(stateRef.current);
      mut(next);
      replace(next);
    },
    [replace]
  );

  const signIn = useCallback(async () => {
    if (!auth) return;
    setAuthError(null);
    try {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      if (standalone) await signInWithRedirect(auth, provider);
      else await signInWithPopup(auth, provider);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Giriş başarısız');
    }
  }, []);
  const signOut = useCallback(() => (auth ? fbSignOut(auth) : Promise.resolve()), []);

  return { state, update, replace, user, status, signIn, signOut, authError, configured };
}
