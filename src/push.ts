import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteToken, getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { app, db } from './firebase';

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
export const pushConfigured = Boolean(VAPID);
export const DEFAULT_HOUR = 20;

/** Firestore doküman kimliği: token'da '/' olmaz ama garanti olsun. */
const idOf = (token: string) => token.replace(/\//g, '_');
const tz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';
  } catch {
    return 'Europe/Istanbul';
  }
};

let messaging: Messaging | null = null;
function getMsg(): Messaging | null {
  if (!app) return null;
  messaging ??= getMessaging(app);
  return messaging;
}

/** Bildirim service worker'ı; PWA'nınkiyle çakışmasın diye ayrı kapsamda. */
function pushSW(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/push-sw.js', { scope: '/push-scope/' });
}

export type PushState = {
  /** Tarayıcı destekliyor mu (iOS'ta yalnız ana ekrana eklenince true olur). */
  supported: boolean | null;
  /** Bu cihazda bildirim açık mı. */
  on: boolean;
  hour: number;
  blocked: boolean;
  busy: boolean;
  error: string | null;
};

export function usePush(uid: string | null) {
  const [s, setS] = useState<PushState>({ supported: null, on: false, hour: DEFAULT_HOUR, blocked: false, busy: false, error: null });
  const token = useRef<string | null>(null);

  const patch = useCallback((p: Partial<PushState>) => setS((x) => ({ ...x, ...p })), []);

  // Destek + mevcut durum
  useEffect(() => {
    let dead = false;
    (async () => {
      const ok = pushConfigured && Boolean(db) && 'Notification' in window && (await isSupported().catch(() => false));
      if (dead) return;
      if (!ok || !uid) {
        patch({ supported: ok, on: false });
        return;
      }
      const blocked = Notification.permission === 'denied';
      if (Notification.permission !== 'granted') {
        patch({ supported: true, on: false, blocked });
        return;
      }
      // İzin zaten var: sessizce token'ı al ve kayda bak.
      try {
        const t = await getToken(getMsg()!, { vapidKey: VAPID, serviceWorkerRegistration: await pushSW() });
        if (dead || !t) return;
        token.current = t;
        const snap = await getDoc(doc(db!, 'users', uid, 'push', idOf(t)));
        if (dead) return;
        const d = snap.data();
        patch({ supported: true, on: Boolean(d?.enabled), hour: typeof d?.hour === 'number' ? d.hour : DEFAULT_HOUR, blocked: false });
      } catch {
        if (!dead) patch({ supported: true, on: false });
      }
    })();
    return () => {
      dead = true;
    };
  }, [uid, patch]);

  const enable = useCallback(async () => {
    if (!uid || !db) return;
    patch({ busy: true, error: null });
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        patch({ busy: false, blocked: perm === 'denied', error: 'Bildirim izni verilmedi.' });
        return;
      }
      const t = await getToken(getMsg()!, { vapidKey: VAPID, serviceWorkerRegistration: await pushSW() });
      if (!t) throw new Error('Token alınamadı');
      token.current = t;
      await setDoc(doc(db, 'users', uid, 'push', idOf(t)), {
        token: t,
        uid,
        tz: tz(),
        hour: s.hour,
        enabled: true,
        ua: navigator.userAgent.slice(0, 180),
        updatedAt: Date.now()
      });
      patch({ on: true, busy: false, blocked: false });
    } catch (e) {
      patch({ busy: false, error: e instanceof Error ? e.message : 'Bildirim açılamadı' });
    }
  }, [uid, s.hour, patch]);

  const disable = useCallback(async () => {
    if (!uid || !db) return;
    patch({ busy: true, error: null });
    try {
      const t = token.current;
      if (t) {
        await deleteDoc(doc(db, 'users', uid, 'push', idOf(t))).catch(() => {});
        await deleteToken(getMsg()!).catch(() => {});
        token.current = null;
      }
      patch({ on: false, busy: false });
    } catch (e) {
      patch({ busy: false, error: e instanceof Error ? e.message : 'Kapatılamadı' });
    }
  }, [uid, patch]);

  /** Saat bu hesabın tüm cihazları için geçerli. */
  const setHour = useCallback(
    async (hour: number) => {
      patch({ hour });
      if (!uid || !db || !s.on) return;
      const list = await getDocs(collection(db, 'users', uid, 'push'));
      await Promise.all(list.docs.map((d) => updateDoc(d.ref, { hour, tz: tz(), updatedAt: Date.now() }).catch(() => {})));
    },
    [uid, s.on, patch]
  );

  return { push: s, enablePush: enable, disablePush: disable, setPushHour: setHour };
}
