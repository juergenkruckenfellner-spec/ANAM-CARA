// Anmeldung, Sitzungen und Rechteprüfung – ausschließlich serverseitig.
// Rechtematrix:  öffentlich → nur Formulare/Seiten · teilnehmerin → eigener Bereich, eigene Reisen
//                admin → Verwaltung komplett. Jede /api/v/*-Route verlangt admin.
import { signieren, pruefen, cookies, json, env, kennwortOk, id, sha } from './util.mjs';
import { konto, konten, kontoNachKennung, fehlversuch, gesperrt, sperreAufheben, codeSetzen, codePruefen, kontoSpeichern, protokoll } from './daten.mjs';
import { sende, rahmen, absatz } from './mail.mjs';
import { store } from './store.mjs';

const COOKIE = 'ac_s';
const DAUER = { admin: 12 * 3600e3, teilnehmerin: 14 * 864e5 };

export function sitzungsCookie(k) {
  const exp = Date.now() + DAUER[k.rolle];
  const t = signieren({ k: k.id, v: k.sitzungVersion || 1, r: k.rolle, exp });
  const sicher = env('DEV_STORE_DIR') ? '' : '; Secure';
  return `${COOKIE}=${encodeURIComponent(t)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(DAUER[k.rolle] / 1000)}${sicher}`;
}
export const abmeldeCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${env('DEV_STORE_DIR') ? '' : '; Secure'}`;

export async function wer(req) {
  const t = cookies(req)[COOKIE];
  const s = pruefen(t);
  if (!s) return null;
  const k = await konto(s.k);
  if (!k || k.aktiv === false || (k.sitzungVersion || 1) !== s.v || k.rolle !== s.r) return null;
  return k;
}

// Liefert Konto oder fertige Fehlerantwort
export async function brauche(req, rolle) {
  const k = await wer(req);
  if (!k) return { fehler: json({ fehler: 'Bitte melde dich an.' }, 401) };
  if (rolle === 'admin' && k.rolle !== 'admin') return { fehler: json({ fehler: 'Kein Zugriff.' }, 403) };
  return { k };
}

// Schritt 1: Kennwort. Schritt 2: Einmalcode per SMS (seven.io) oder E-Mail.
// Erstes Verwaltungskonto (Auftrag: Benutzer „Schladming“). Wird nur angelegt, solange es noch
// gar kein Verwaltungskonto gibt. Gespeichert ist nur der scrypt-Hash; das Kennwort bitte nach der
// ersten Anmeldung in den Einstellungen ändern.
const ERSTKONTO = { benutzer: 'schladming', hash: 'scrypt$34d96b4ff9089304db2baebaab681824$a24dff06480c94daaa1e4248e64ad1a3d3cdf446dc83a2669085bc9ef896ef2b966ef4e0156c85e6965cc2779f4ec597d840fe9ecd1ca8401f96be277898ce3b' };
async function verwaltungAnlegen(kennung) {
  if (kennung !== ERSTKONTO.benutzer) return;
  // Einmalig (Merker in der Ablage): Konto „schladming“ anlegen bzw. auf das vereinbarte Kennwort setzen.
  const s = await store();
  if (await s.getJSON('system/erstkonto-1')) return;
  const alle = await konten();
  const da = alle.find(x => x.benutzer === ERSTKONTO.benutzer || (x.rolle === 'admin' && x.email === ERSTKONTO.benutzer));
  if (da) Object.assign(da, { rolle: 'admin', benutzer: ERSTKONTO.benutzer, hash: ERSTKONTO.hash, aktiv: true, sitzungVersion: (da.sitzungVersion || 1) + 1, kennwortAendern: true });
  await kontoSpeichern(da || { id: id(9), rolle: 'admin', name: 'Verwaltung', benutzer: ERSTKONTO.benutzer, email: '', telefon: '', hash: ERSTKONTO.hash, sitzungVersion: 1, aktiv: true, angelegt: new Date().toISOString(), kennwortAendern: true });
  await s.setJSON('system/erstkonto-1', { zeit: new Date().toISOString(), vorhanden: !!da, weitereAdmins: alle.filter(x => x.rolle === 'admin' && x !== da).length });
  await protokoll('System', da ? 'Verwaltungskonto „Schladming“ auf vereinbartes Kennwort gesetzt' : 'Erstes Verwaltungskonto „Schladming“ angelegt');
}

export async function anmelden(email, kennwort, ip, seite) {
  const mail = String(email || '').toLowerCase().trim();
  const sperrMail = 'm:' + mail, sperrIp = 'i:' + ip;
  const bis = Math.max(await gesperrt(sperrMail), await gesperrt(sperrIp));
  if (bis) return json({ fehler: `Zu viele Versuche. Bitte warte ${Math.ceil((bis - Date.now()) / 60000)} Minuten.` }, 429);
  await verwaltungAnlegen(mail);
  const k = await kontoNachKennung(mail);
  // Immer gleich lange rechnen, damit nicht erkennbar ist, ob es die Adresse gibt
  const ok = kennwortOk(String(kennwort || ''), k?.hash || 'scrypt$00$' + '0'.repeat(128));
  if (!k || !ok || k.aktiv === false) {
    await fehlversuch(sperrMail); await fehlversuch(sperrIp);
    return json({ fehler: 'Anmeldename oder Kennwort stimmen nicht.' }, 403);
  }
  await sperreAufheben(sperrMail);
  // Ohne hinterlegte E-Mail oder Handynummer kann kein Code zugestellt werden → direkt anmelden.
  // Sobald in den Einstellungen eine E-Mail-Adresse steht, ist der Anmeldecode automatisch aktiv.
  if (env('ZF_AUS') === '1' || (!k.email && !k.telefon)) return json({ ok: true, rolle: k.rolle }, 200, { 'set-cookie': sitzungsCookie(k) });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await codeSetzen(k.id, code);
  const weg = await codeSenden(k, code, seite);
  if (!weg.ok) return json({ fehler: k.email ? 'Der Anmeldecode konnte nicht verschickt werden. ' + (weg.fehler || '') : 'Für dieses Konto ist keine E-Mail-Adresse für den Anmeldecode hinterlegt.' }, 503);
  const ticket = signieren({ k: k.id, z: 'code', exp: Date.now() + 10 * 60e3 });
  return json({ schritt: 'code', ticket, weg: weg.weg });
}

export async function codeBestaetigen(ticket, code, ip) {
  const t = pruefen(ticket);
  if (!t || t.z !== 'code') return json({ fehler: 'Die Anmeldung ist abgelaufen. Bitte noch einmal beginnen.' }, 403);
  if (await gesperrt('i:' + ip)) return json({ fehler: 'Zu viele Versuche. Bitte später erneut.' }, 429);
  const ok = await codePruefen(t.k, code);
  if (!ok) { await fehlversuch('i:' + ip); return json({ fehler: 'Der Code stimmt nicht oder ist abgelaufen.' }, 403); }
  const k = await konto(t.k);
  if (!k || k.aktiv === false) return json({ fehler: 'Kein Zugriff.' }, 403);
  k.letzteAnmeldung = new Date().toISOString(); await kontoSpeichern(k);
  await protokoll(k.email, 'Anmeldung (' + k.rolle + ')');
  return json({ ok: true, rolle: k.rolle }, 200, { 'set-cookie': sitzungsCookie(k) });
}

async function codeSenden(k, code, seite) {
  if (!k.email && !(k.telefon && env('SEVEN_API_KEY'))) return { ok: false, weg: 'keiner' };
  const nummer = (k.telefon || '').replace(/[^\d+]/g, '');
  if (nummer && env('SMS_ANBIETER') === 'seven' && env('SEVEN_API_KEY')) {
    try {
      const r = await fetch('https://gateway.seven.io/api/sms', {
        method: 'POST', headers: { 'X-Api-Key': env('SEVEN_API_KEY'), 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ to: nummer, text: `Ihr Anam-Cara-Anmeldecode: ${code} (10 Minuten gültig)`, from: (env('SMS_ABSENDER') || 'AnamCara').slice(0, 11) }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && String(j.success) === '100') return { ok: true, weg: 'sms' };
    } catch {}
    // Ersatzweg E-Mail
  }
  const html = rahmen(absatz(`Hallo ${k.name || ''},`) + absatz('dein Anmeldecode für Anam Cara lautet:') +
    `<p style="font-size:30px;letter-spacing:6px;font-family:Georgia,serif;color:#2F4A3A;margin:8px 0 18px">${code}</p>` +
    absatz('Der Code gilt 10 Minuten. Wenn du dich nicht anmelden wolltest, kannst du diese Nachricht ignorieren.'), seite);
  const r = await sende({ an: k.email, betreff: `Anmeldecode ${code}`, html, text: `Dein Anmeldecode: ${code} (10 Minuten gültig)` });
  return { ok: r.ok, weg: 'mail', fehler: r.fehler };
}

export function neueEinladung(k) {
  const tok = id(18);
  k.einladung = sha(tok);              // nur der Hash wird gespeichert
  k.einladungBis = Date.now() + 14 * 864e5;
  return tok;
}
