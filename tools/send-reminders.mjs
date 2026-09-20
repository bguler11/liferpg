/**
 * Life RPG hatırlatma göndericisi.
 *
 * GitHub Actions saat başı çalıştırır. Her cihaz kaydı (users/{uid}/push/{token})
 * kendi saat dilimini ve hedef saatini taşır; sadece o saate gelen kayıtlara
 * bildirim gider. Günün çekirdek görevleri bitmişse bildirim gönderilmez.
 *
 * Ortam değişkeni: FIREBASE_SERVICE_ACCOUNT = servis hesabı JSON'u (tek satır).
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const DEFAULT_HOUR = 20;
const DEFAULT_TZ = 'Europe/Istanbul';
/** Actions cron'u gecikebilir; hedef saatten sonraki bu kadar saat içinde hâlâ gönder. */
const WINDOW = 3;
const DRY = process.argv.includes('--dry-run');

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.error('FIREBASE_SERVICE_ACCOUNT yok.');
  process.exit(1);
}
let creds;
try {
  creds = JSON.parse(raw);
} catch {
  console.error('FIREBASE_SERVICE_ACCOUNT geçerli JSON değil. Secret olarak indirdiğin dosyanın tamamını yapıştır.');
  process.exit(1);
}
for (const k of ['project_id', 'client_email', 'private_key']) {
  if (!creds[k]) {
    console.error(`Servis hesabı JSON'unda "${k}" yok. Yanlış dosya olabilir.`);
    process.exit(1);
  }
}
initializeApp({ credential: cert(creds) });
const db = getFirestore();

/** Verilen saat diliminde "şimdi": YYYY-MM-DD ve 0-23 saat. */
function localNow(tz) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
  } catch {
    return localNow(DEFAULT_TZ);
  }
  const o = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { date: `${o.year}-${o.month}-${o.day}`, hour: Number(o.hour) };
}

const addDays = (s, n) => {
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
  return t.toISOString().slice(0, 10);
};
const diffDays = (a, b) => {
  const p = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 86400000);
};

/**
 * Bugün için durum: kaç çekirdek görev kaldı.
 * logic.ts'teki kuralın aynısı — zor modda NORMAL (2), normal modda MİN (1) gerekir.
 */
function todayStatus(state, date) {
  if (!state || !Array.isArray(state.habits)) return null;
  const idx = diffDays(state.startDate, date);
  if (idx < 0) return { notStarted: true };
  if (idx >= (state.total ?? 66)) return { finished: true };
  const need = state.mode === 'normal' ? 1 : 2;
  const levels = state.logs?.[date]?.levels ?? {};
  const core = state.habits.filter((h) => h.core);
  const left = core.filter((h) => (levels[h.id] ?? 0) < need);
  return { dayNum: idx + 1, total: core.length, left: left.map((h) => h.name) };
}

function message(st, name) {
  const who = name ? `${name}, ` : '';
  if (st.left.length === st.total) {
    return { title: `Gün ${st.dayNum} · hiç işaret yok`, body: `${who}bugün ${st.total} çekirdek görev duruyor. Birini bitir, seri kopmasın.` };
  }
  const list = st.left.slice(0, 3).join(', ') + (st.left.length > 3 ? '…' : '');
  return { title: `Gün ${st.dayNum} · ${st.left.length} görev kaldı`, body: `${list}. Şimdi kapatırsan gün TAMAM.` };
}

let snap;
try {
  snap = await db.collectionGroup('push').where('enabled', '==', true).get();
} catch (e) {
  if (String(e).includes('FAILED_PRECONDITION')) {
    console.error('Firestore index eksik. Depo kökünde: npx firebase-tools deploy --only firestore:indexes');
  }
  throw e;
}
console.log(`${snap.size} cihaz kaydı bulundu.`);

let sent = 0, skipped = 0, dropped = 0;
for (const docSnap of snap.docs) {
  const p = docSnap.data();
  const uid = docSnap.ref.parent.parent?.id;
  if (!uid || !p.token) continue;

  const tz = p.tz || DEFAULT_TZ;
  const target = typeof p.hour === 'number' ? p.hour : DEFAULT_HOUR;
  const { date, hour } = localNow(tz);

  if (hour < target || hour >= target + WINDOW) { skipped++; continue; }
  if (p.lastSentDate === date) { skipped++; continue; }

  const state = (await db.doc(`users/${uid}/app/state`).get()).data();
  const st = todayStatus(state, date);
  if (!st || st.notStarted || st.finished || st.left.length === 0) {
    await docSnap.ref.update({ lastSentDate: date, lastResult: 'gerek yok' });
    skipped++;
    continue;
  }

  const m = message(st, state?.name);
  console.log(`${uid.slice(0, 6)}… ${tz} ${date} ${hour}:00 → ${m.title}`);
  if (DRY) { sent++; continue; }

  try {
    await getMessaging().send({
      token: p.token,
      data: { title: m.title, body: m.body, url: '/', tag: 'liferpg-' + date },
      webpush: { headers: { Urgency: 'high', TTL: '7200' } }
    });
    await docSnap.ref.update({ lastSentDate: date, lastResult: 'gönderildi' });
    sent++;
  } catch (e) {
    const code = e?.errorInfo?.code || e?.code || '';
    if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
      await docSnap.ref.delete(); // cihaz uygulamayı silmiş ya da token ölmüş
      dropped++;
    } else {
      console.error(`gönderilemedi (${uid.slice(0, 6)}…): ${code || e}`);
      await docSnap.ref.update({ lastResult: 'hata: ' + (code || String(e)).slice(0, 120) });
    }
  }
}
console.log(`bitti — gönderilen ${sent}, atlanan ${skipped}, silinen token ${dropped}${DRY ? ' (kuru çalışma)' : ''}`);
