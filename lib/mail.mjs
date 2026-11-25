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
    const tid = 'test-' + Date.now() + '-' + id(4);
    await s.setJSON('testpost/' + tid.slice(5), { an, betreff, html, text, kopf, idem, absender, antwortAn });
    return { ok: true, status: 200, id: tid };
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
    if (r.ok) { const j = await r.json().catch(() => ({})); return { ok: true, status: r.status, id: j.id || '' }; }
    const t = await r.text();
    const quota = /quota|limit/i.test(t) && r.status === 429;
    if ((r.status === 429 && !quota) || r.status >= 500) { if (versuch < 2) { await warte(1000 * (versuch + 1)); continue; } }
    return { ok: false, status: r.status, fehler: t.slice(0, 300), stopp: [401, 403].includes(r.status) || quota };
  }
  return { ok: false, status: 0, fehler: 'Unbekannter Fehler' };
}
// Zustellstand einer verschickten Mail (delivered, bounced, sent …) beim Versanddienst abfragen
export async function zustellstand(mid) {
  if (!mid) return null;
  if (env('MAIL_TESTMODUS') === '1') return env('MAIL_TEST_ZUSTAND') || 'delivered';
  if (!env('RESEND_API_KEY')) return null;
  const r = await fetch('https://api.resend.com/emails/' + encodeURIComponent(mid), { headers: { Authorization: 'Bearer ' + env('RESEND_API_KEY') } });
  if (!r.ok) return null;
  return (await r.json()).last_event || null;
}
const warte = ms => new Promise(r => setTimeout(r, ms));

// Mailrahmen in Hausfarben mit dem Anam-Cara-Logo, Schrift von der eigenen Seite
export function rahmen(inhaltHtml, seite, fuss = '') {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
@font-face{font-family:Cormorant;src:url(${seite}/assets/fonts/cormorant-latin-500-normal.woff2) format('woff2');font-weight:500}
@font-face{font-family:'Alegreya Sans';src:url(${seite}/assets/fonts/alegreya-sans-latin-400-normal.woff2) format('woff2')}
</style></head><body style="margin:0;background:#F3ECE1;padding:24px 12px;font-family:'Alegreya Sans',Georgia,serif;color:#2B2622;font-size:17px;line-height:1.6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FBF8F3;border:1px solid #E4D9C8">
<tr><td align="center" style="padding:30px 32px 6px"><img src="${seite}/assets/logo/logo-mail.png" width="230" height="112" alt="Anam Cara · Soul Sisters Gatherings" style="display:block;width:230px;max-width:70%;height:auto;border:0;margin:0 auto"></td></tr>
<tr><td style="padding:0 32px"><div style="height:1px;background:#E4D9C8;margin:18px 0 6px;font-size:0;line-height:0">&nbsp;</div></td></tr>
<tr><td style="padding:8px 32px 24px">${inhaltHtml}</td></tr>
<tr><td align="center" style="padding:6px 32px 26px;border-top:1px solid #E4D9C8;font-family:'Alegreya Sans',Georgia,serif;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#B0673F">Sabine Rueland &amp; Nina Walcher · Anam Cara</td></tr>
</table>${fuss}</td></tr></table></body></html>`;
}
export const absatz = t => `<p style="margin:0 0 14px">${esc(t)}</p>`;
export const knopf = (href, t) => `<p style="margin:22px 0"><a href="${esc(href)}" style="display:inline-block;background:#B55A1F;color:#fff;text-decoration:none;padding:12px 22px;border-radius:3px">${esc(t)}</a></p>`;
