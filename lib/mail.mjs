// Mailversand über Resend (EU-Region wählbar, AVV im Dienste-Register).
import { env, id, esc } from './util.mjs';
import { store } from './store.mjs';

export function mailBereit() { return !!env('RESEND_API_KEY') || env('MAIL_TESTMODUS') === '1'; }

export async function sende({ an, betreff, html, text, antwortAn, kopf = {}, idem }) {
  const absender = env('MAIL_ABSENDER') || 'Anam Cara <post@anam-cara.at>';
  if (env('MAIL_TESTMODUS') === '1') {
    const fehler = env('MAIL_TEST_FEHLER');
    if (fehler === '429quota') return { ok: false, status: 429, fehler: 'You have reached your daily quota', stopp: true };
    if (fehler === '401') return { ok: false, status: 401, fehler: 'API key is invalid', stopp: true };
    const s = await store();
    await s.setJSON('testpost/' + Date.now() + '-' + id(4), { an, betreff, html, text, kopf, idem, absender });
    return { ok: true, status: 200 };
  }
  const key = env('RESEND_API_KEY');
  if (!key) return { ok: false, status: 0, fehler: 'Kein Versanddienst eingerichtet (RESEND_API_KEY fehlt).' };
  const headers = { Authorization: 'Bearer ' + key, 'content-type': 'application/json' };
  if (idem) headers['Idempotency-Key'] = idem;
  const body = { from: absender, to: [an], subject: betreff, html, text, headers: kopf };
  if (antwortAn) body.reply_to = antwortAn;
  for (let versuch = 0; versuch < 3; versuch++) {
    let r;
    try { r = await fetch('https://api.resend.com/emails', { method: 'POST', headers, body: JSON.stringify(body) }); }
    catch (e) { if (versuch === 2) return { ok: false, status: 0, fehler: 'Netzwerkfehler: ' + e.message }; await warte(800 * (versuch + 1)); continue; }
    if (r.ok) return { ok: true, status: r.status };
    const t = await r.text();
    const quota = /quota|limit/i.test(t) && r.status === 429;
    if ((r.status === 429 && !quota) || r.status >= 500) { if (versuch < 2) { await warte(1000 * (versuch + 1)); continue; } }
    return { ok: false, status: r.status, fehler: t.slice(0, 300), stopp: [401, 403].includes(r.status) || quota };
  }
  return { ok: false, status: 0, fehler: 'Unbekannter Fehler' };
}
const warte = ms => new Promise(r => setTimeout(r, ms));

// Schlichter Mailrahmen in Hausfarben, Schrift von der eigenen Seite
export function rahmen(inhaltHtml, seite, fuss = '') {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
@font-face{font-family:Cormorant;src:url(${seite}/assets/fonts/cormorant-latin-500-normal.woff2) format('woff2');font-weight:500}
@font-face{font-family:'Alegreya Sans';src:url(${seite}/assets/fonts/alegreya-sans-latin-400-normal.woff2) format('woff2')}
</style></head><body style="margin:0;background:#F3ECE1;padding:24px 12px;font-family:'Alegreya Sans',Georgia,serif;color:#2B2622;font-size:17px;line-height:1.6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FBF8F3;border:1px solid #E4D9C8">
<tr><td style="padding:28px 32px 8px;font-family:Cormorant,Georgia,serif;font-size:26px;color:#2F4A3A;letter-spacing:.02em">Anam Cara</td></tr>
<tr><td style="padding:8px 32px 28px">${inhaltHtml}</td></tr>
</table>${fuss}</td></tr></table></body></html>`;
}
export const absatz = t => `<p style="margin:0 0 14px">${esc(t)}</p>`;
export const knopf = (href, t) => `<p style="margin:22px 0"><a href="${esc(href)}" style="display:inline-block;background:#B55A1F;color:#fff;text-decoration:none;padding:12px 22px;border-radius:3px">${esc(t)}</a></p>`;
