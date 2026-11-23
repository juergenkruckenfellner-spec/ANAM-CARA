import crypto from 'node:crypto';

export const SICHERHEIT = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'",
};

export const env = k => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k] ?? '';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const id = (n = 12) => crypto.randomBytes(n).toString('base64url');
export const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
export const jetzt = () => new Date().toISOString();

function geheimnis() {
  const g = env('SITZUNG_GEHEIMNIS');
  if (!g || g.length < 32) throw new Error('SITZUNG_GEHEIMNIS fehlt oder ist zu kurz (mind. 32 Zeichen).');
  return g;
}

// Signierte Kurz-Tokens (Sitzung, Newsletter-Bestätigung, Abmeldung)
export function signieren(obj) {
  const body = Buffer.from(JSON.stringify(obj)).toString('base64url');
  const mac = crypto.createHmac('sha256', geheimnis()).update(body).digest('base64url');
  return body + '.' + mac;
}
export function pruefen(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const soll = crypto.createHmac('sha256', geheimnis()).update(body).digest('base64url');
  const a = Buffer.from(mac || ''), b = Buffer.from(soll);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const o = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (o.exp && Date.now() > o.exp) return null;
    return o;
  } catch { return null; }
}

// Kennwörter: scrypt, eigenes Salz, zeitkonstanter Vergleich
export function hashKennwort(pw) {
  const salz = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(pw, salz, 64).toString('hex');
  return `scrypt$${salz}$${h}`;
}
export function kennwortOk(pw, gespeichert) {
  if (!gespeichert || !pw) return false;
  const [, salz, h] = gespeichert.split('$');
  const ist = crypto.scryptSync(pw, salz, 64);
  const soll = Buffer.from(h, 'hex');
  return ist.length === soll.length && crypto.timingSafeEqual(ist, soll);
}
export function kennwortRegel(pw) {
  if (typeof pw !== 'string' || pw.length < 10) return 'Das Kennwort braucht mindestens 10 Zeichen.';
  if (pw.length > 200) return 'Das Kennwort ist zu lang.';
  return null;
}

export function json(daten, status = 200, extra = {}) {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { ...SICHERHEIT, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}

export function cookies(req) {
  const out = {};
  (req.headers.get('cookie') || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function emailOk(e) {
  return typeof e === 'string' && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

export const kurz = (s, n = 2000) => String(s ?? '').trim().slice(0, n);

// Herkunftsprüfung gegen CSRF bei schreibenden Anfragen
export function herkunftOk(req) {
  const o = req.headers.get('origin');
  if (!o) return req.headers.get('sec-fetch-site') === 'same-origin' || req.method === 'GET';
  try { return new URL(o).host === new URL(req.url).host; } catch { return false; }
}

export function seitenUrl(req) {
  const e = env('SEITEN_URL');
  if (e) return e.replace(/\/$/, '');
  const u = new URL(req.url);
  return u.origin;
}

export function datumLang(iso, lang = 'de') {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-AT', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function zeitraum(von, bis, lang = 'de') {
  if (!von) return '';
  const a = new Date(von + 'T12:00:00'), b = new Date((bis || von) + 'T12:00:00');
  const L = lang === 'en' ? 'en-GB' : 'de-AT';
  const gleichesJahr = a.getFullYear() === b.getFullYear();
  const t1 = a.toLocaleDateString(L, { day: 'numeric', month: 'long', ...(gleichesJahr ? {} : { year: 'numeric' }) });
  const t2 = b.toLocaleDateString(L, { day: 'numeric', month: 'long', year: 'numeric' });
  return `${t1} – ${t2}`;
}
