// Mail-Wache: prüft täglich, ob Anfragen per Mail ankommen, und schlägt im Dashboard Alarm,
// damit keine Anfrage unbemerkt liegen bleibt (Absenderdomain, Zustellung der Testmail,
// Zustellung jeder Anfrage-Meldung, unbearbeitete Anfragen). Notfalls Ersatzweg per SMS/Mail an die Verwaltung.
import * as D from './daten.mjs';
import { store } from './store.mjs';
import { env, jetzt } from './util.mjs';
import { sende, rahmen, absatz, knopf, zustellstand } from './mail.mjs';

export const STANDARD_EMPFAENGER = 'office@anam-cara.at';
export const empfaenger = i => (i?.einstellungen?.email || env('MAIL_EMPFAENGER') || STANDARD_EMPFAENGER).trim();
const SCHLUESSEL = 'system/mailwache';
const FEHLER = new Set(['bounced', 'failed', 'complained', 'suppressed', 'canceled']);

export async function wacheLesen() { return (await (await store()).getJSON(SCHLUESSEL)) || null; }
async function wacheSchreiben(w) { await (await store()).setJSON(SCHLUESSEL, w); }

// Sofortmeldung, wenn eine einzelne Anfrage nicht per Mail gemeldet werden konnte
export async function sofortWarnen(text) {
  const w = (await wacheLesen()) || { probleme: [] };
  w.probleme = [...(w.probleme || []).filter(p => p.text !== text), { stufe: 'rot', text, zeit: jetzt() }];
  w.ok = false; w.zeit = w.zeit || jetzt();
  await wacheSchreiben(w);
}

async function resend(pfad) {
  const r = await fetch('https://api.resend.com' + pfad, { headers: { Authorization: 'Bearer ' + env('RESEND_API_KEY') } });
  if (!r.ok) throw new Error(`Resend ${r.status}`);
  return r.json();
}

export async function mailPruefen(seite, { testSenden = true, anlass = 'täglich' } = {}) {
  const i = await D.inhalt(); const an = empfaenger(i);
  const alt = (await wacheLesen()) || {};
  const probleme = []; const gut = [];
  const rot = t => probleme.push({ stufe: 'rot', text: t }); const gelb = t => probleme.push({ stufe: 'gelb', text: t });
  const testmodus = env('MAIL_TESTMODUS') === '1';
  const absender = env('MAIL_ABSENDER') || 'Anam Cara <post@anam-cara.at>';

  // 1. Einrichtung
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(an)) rot(`Keine gültige Empfangsadresse für Anfragen eingetragen („${an}“).`);
  if (!env('RESEND_API_KEY') && !testmodus) rot('Kein Mailversand eingerichtet (RESEND_API_KEY fehlt in Netlify). Anfragen werden gespeichert, aber nicht per Mail gemeldet.');

  // 2. Absenderdomain bei Resend bestätigt?
  if (env('RESEND_API_KEY') && !testmodus) {
    const domain = (absender.match(/@([^>\s]+)/) || [])[1];
    try {
      const d = (await resend('/domains')).data || [];
      const t = d.find(x => x.name === domain);
      if (!t) rot(`Die Absenderdomain ${domain} ist beim Mailversand (Resend) nicht angelegt. Mails können nicht verschickt werden.`);
      else if (t.status !== 'verified') rot(`Die Absenderdomain ${domain} ist beim Mailversand noch nicht bestätigt (Status: ${t.status}). DNS-Einträge bei World4You prüfen.`);
      else gut.push(`Absenderdomain ${domain} bestätigt`);
    } catch (e) { gelb('Der Status des Mailversands konnte nicht abgefragt werden (' + e.message + ').'); }
  }

  // 3. Zustellung der letzten Testmail
  const lt = alt.letzterTest;
  if (lt?.id) {
    const st = await zustellstand(lt.id).catch(() => null);
    const alterStd = (Date.now() - Date.parse(lt.zeit)) / 36e5;
    if (st && FEHLER.has(st)) rot(`Die Testmail an ${lt.an} vom ${new Date(lt.zeit).toLocaleDateString('de-AT')} wurde NICHT zugestellt (${st}). Anfragen kommen vermutlich nicht an. Postfach ${lt.an} prüfen!`);
    else if (st === 'delivered') gut.push(`Testmail an ${lt.an} zugestellt`);
    else if (st && alterStd > 3) gelb(`Die Testmail an ${lt.an} ist seit ${Math.round(alterStd)} Stunden nicht als zugestellt gemeldet (Stand: ${st}).`);
  }

  // 4. Zustellung jeder Anfrage-Meldung der letzten 7 Tage, unbearbeitete Anfragen
  const anfr = await D.anfragen(); const grenze = Date.now() - 7 * 864e5;
  const nichtGemeldet = [];
  for (const a of anfr.filter(x => Date.parse(x.zeit) > grenze)) {
    const m = a.meldung;
    if (!m) continue;
    if (m.id && !['delivered', ...FEHLER].includes(m.status)) {
      const st = await zustellstand(m.id).catch(() => null);
      if (st && st !== m.status) { m.status = st; await D.anfrageSpeichern(a); }
    }
    if (!m.ok || FEHLER.has(m.status)) nichtGemeldet.push(a);
  }
  if (nichtGemeldet.length) rot(`${nichtGemeldet.length} Anfrage(n) konnten nicht per Mail gemeldet werden: ${nichtGemeldet.slice(0, 5).map(a => a.name).join(', ')}. Bitte unter „Anfragen“ direkt beantworten.`);
  const liegen = anfr.filter(a => a.status === 'neu' && Date.now() - Date.parse(a.zeit) > 48 * 36e5);
  if (liegen.length) gelb(`${liegen.length} Anfrage(n) sind seit über 2 Tagen unbearbeitet: ${liegen.slice(0, 5).map(a => a.name).join(', ')}.`);

  // 5. Neue Testmail
  let letzterTest = lt || null;
  if (testSenden && !probleme.some(p => p.stufe === 'rot' && /RESEND_API_KEY|gültige Empfangsadresse/.test(p.text))) {
    const r = await sende({ an, betreff: 'Zustelltest Anam Cara – bitte nicht antworten', idem: 'mailwache-' + new Date().toISOString().slice(0, 13),
      html: rahmen(absatz('Diese Nachricht schickt die Website von Anam Cara automatisch, um zu prüfen, ob Anfragen in diesem Postfach ankommen.') + absatz('Ihr müsst nichts tun. Kommt diese Mail einmal nicht an, erscheint im Dashboard eine rote Warnung.'), seite),
      text: 'Automatischer Zustelltest der Website Anam Cara. Ihr müsst nichts tun.' });
    if (!r.ok) rot(`Die Testmail an ${an} konnte nicht verschickt werden: ${r.fehler || r.status}. Anfragen werden derzeit vermutlich nicht gemeldet.`);
    else { letzterTest = { id: r.id || '', an, zeit: jetzt() }; gut.push(`Testmail an ${an} verschickt`); }
  }

  const w = { zeit: jetzt(), anlass, an, ok: !probleme.some(p => p.stufe === 'rot'), probleme: probleme.map(p => ({ ...p, zeit: jetzt() })), gut, letzterTest, alarmGesendet: alt.alarmGesendet || '' };

  // 6. Ersatzweg: bei neuem roten Befund die Verwaltung per SMS und an ihre eigenen Adressen informieren (max. 1× pro Tag)
  const heute = jetzt().slice(0, 10);
  if (!w.ok && w.alarmGesendet !== heute) {
    await alarm(w, seite, an).catch(e => console.error('Alarm', e.message));
    w.alarmGesendet = heute;
  }
  await wacheSchreiben(w);
  if (!w.ok) await D.protokoll('System', 'Mail-Wache: ' + w.probleme.filter(p => p.stufe === 'rot').map(p => p.text).join(' | ').slice(0, 300));
  return w;
}

async function alarm(w, seite, an) {
  const admins = (await D.konten()).filter(k => k.rolle === 'admin' && k.aktiv !== false);
  const text = `Anam Cara: Achtung, Anfragen kommen evtl. nicht per Mail an. Bitte im Dashboard nachsehen: ${seite}/verwaltung`;
  for (const k of admins) {
    const nr = (k.telefon || '').replace(/[^\d+]/g, '');
    if (nr && env('SMS_ANBIETER') === 'seven' && env('SEVEN_API_KEY')) {
      try { await fetch('https://gateway.seven.io/api/sms', { method: 'POST', headers: { 'X-Api-Key': env('SEVEN_API_KEY'), 'content-type': 'application/json' }, body: JSON.stringify({ to: nr, text, from: (env('SMS_ABSENDER') || 'AnamCara').slice(0, 11) }) }); } catch {}
    }
    if (k.email && k.email.toLowerCase() !== an.toLowerCase()) {
      await sende({ an: k.email, betreff: 'Achtung: Mailversand von Anam Cara prüfen', html: rahmen(absatz(`Hallo ${k.name || ''},`) + absatz('die tägliche Prüfung hat ein Problem beim Mailversand festgestellt. Neue Anfragen kommen eventuell nicht per Mail an:') + w.probleme.filter(p => p.stufe === 'rot').map(p => absatz('• ' + p.text)).join('') + knopf(seite + '/verwaltung', 'Dashboard öffnen'), seite), text });
    }
  }
}
