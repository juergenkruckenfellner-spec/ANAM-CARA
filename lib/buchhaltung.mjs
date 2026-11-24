// Abwicklung der Reisen: Anfragen entscheiden, Rechnungen, Zahlungseingang, Erinnerungen und Mahnwesen.
// Alle Daten laufen über die Speicherschicht (store.mjs). Rechnungen werden nie gelöscht, nur storniert
// (Aufbewahrungspflicht 7 Jahre, § 132 BAO) – ausgenommen klar markierte Beispieldaten.
import { store, alle } from './store.mjs';
import { id, jetzt, esc, signieren, pruefen } from './util.mjs';
import { sende, rahmen } from './mail.mjs';
import { anfragen, anfrageSpeichern, retreats, inhalt, protokoll } from './daten.mjs';

// ---------- Einstellungen ----------
export const STANDARD_RE = {
  aussteller: '', adresse: '', uid: '', email: '', iban: '', bic: '', bank: '',
  praefix: 'AC-', zielTage: 14, anzahlungProzent: 20,
  ustHinweis: 'Gemäß § 6 Abs. 1 Z 27 UStG umsatzsteuerbefreit (Kleinunternehmerregelung).',
  fuss: 'Danke für dein Vertrauen. Wir freuen uns auf die gemeinsame Zeit in Irland.',
  auto: false, erinnerungTage: 3, mahnung1Tage: 14, mahnung2Tage: 28, gebuehr1: 0, gebuehr2: 10, fristTage: 7,
};
export async function reEinstellungen() {
  const s = await store();
  const g = (await s.getJSON('rechnung-einstellungen')) || {};
  const E = { ...STANDARD_RE, ...g };
  // Fallback auf die Impressumsangaben
  const I = (await inhalt()).einstellungen;
  if (!E.aussteller) E.aussteller = I.wortlaut || 'Anam Cara – Sabine Rueland & Nina Walcher';
  if (!E.adresse) E.adresse = (I.adressen || []).join('\n');
  if (!E.uid && I.uid) E.uid = I.uid;
  if (!E.email) E.email = I.email || '';
  return E;
}
export async function reEinstellungenSpeichern(e) {
  const alt = (await (await store()).getJSON('rechnung-einstellungen')) || {};
  const n = { ...alt };
  for (const k of ['aussteller', 'adresse', 'uid', 'email', 'iban', 'bic', 'bank', 'praefix', 'ustHinweis', 'fuss']) if (typeof e[k] === 'string') n[k] = e[k].trim().slice(0, k === 'adresse' || k === 'fuss' || k === 'ustHinweis' ? 600 : 120);
  for (const k of ['zielTage', 'anzahlungProzent', 'erinnerungTage', 'mahnung1Tage', 'mahnung2Tage', 'gebuehr1', 'gebuehr2', 'fristTage']) if (e[k] !== undefined && e[k] !== '') { const z = Number(e[k]); if (Number.isFinite(z) && z >= 0 && z <= 365) n[k] = z; }
  if (typeof e.auto === 'boolean') n.auto = e.auto;
  await (await store()).setJSON('rechnung-einstellungen', n);
}

// ---------- Hilfen ----------
export const euro = n => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('de-AT', { style: 'currency', currency: 'EUR' });
const rund = n => Math.round((Number(n) || 0) * 100) / 100;
export const heute = () => new Date().toISOString().slice(0, 10);
const plusTage = (iso, t) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + Number(t || 0)); return d.toISOString().slice(0, 10); };
const tageZwischen = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
export const datumDe = iso => iso ? new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
const datumEn = iso => iso ? new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
export const preisAusText = t => { const m = String(t || '').match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:,(\d{2}))?\s*€|€\s*(\d{1,3}(?:[.,\s]\d{3})+|\d+)/); if (!m) return 0; const roh = (m[1] || m[3] || '').replace(/[.\s,]/g, ''); return Number(roh) + (m[2] ? Number(m[2]) / 100 : 0); };

export const STUFEN = { erinnerung: 'Zahlungserinnerung', mahnung1: '1. Mahnung', mahnung2: '2. und letzte Mahnung' };

// ---------- Rechnungen ----------
export async function rechnungen() { return (await alle('rechnung/')).sort((a, b) => (b.datum + b.erstellt).localeCompare(a.datum + a.erstellt)); }
export async function rechnung(rid) { return (await store()).getJSON('rechnung/' + rid); }
export async function rechnungSpeichern(r) { r.geaendert = jetzt(); await (await store()).setJSON('rechnung/' + r.id, r); return r; }

async function naechsteNummer(E) {
  const s = await store(); const jahr = new Date().getFullYear();
  const z = (await s.getJSON('rechnung-zaehler')) || { jahr, n: 0 };
  if (z.jahr !== jahr) { z.jahr = jahr; z.n = 0; }
  z.n += 1; await s.setJSON('rechnung-zaehler', z);
  return `${E.praefix || 'AC-'}${jahr}-${String(z.n).padStart(3, '0')}`;
}

// Berechnete Werte: bezahlt, Gebühren, offen, Status, nächste Mahnstufe
export function auswerten(r, E) {
  const summe = rund((r.positionen || []).reduce((s, p) => s + (Number(p.betrag) || 0), 0));
  const bezahlt = rund((r.zahlungen || []).reduce((s, z) => s + (Number(z.betrag) || 0), 0));
  const gebuehren = rund((r.stufen || []).reduce((s, x) => s + (Number(x.gebuehr) || 0), 0));
  const offen = rund(summe + gebuehren - bezahlt);
  const h = heute();
  const frist = r.neueFrist && r.neueFrist > r.faellig ? r.neueFrist : r.faellig;
  const tageUeber = offen > 0 && r.faellig < h ? tageZwischen(r.faellig, h) : 0;
  const status = r.storniert ? 'storniert' : offen <= 0 ? 'bezahlt' : !r.versandt ? 'entwurf' : frist < h ? 'ueberfaellig' : bezahlt > 0 ? 'teilbezahlt' : 'offen';
  const erledigt = new Set((r.stufen || []).map(x => x.stufe));
  let naechste = null;
  if (['ueberfaellig', 'teilbezahlt', 'offen'].includes(status) && r.faellig < h) {
    for (const [st, t] of [['erinnerung', E.erinnerungTage], ['mahnung1', E.mahnung1Tage], ['mahnung2', E.mahnung2Tage]]) {
      if (erledigt.has(st)) continue;
      // nach einer Mahnung erst nach Ablauf der neuen Frist zur nächsten Stufe
      const ab = [plusTage(r.faellig, t), r.neueFrist ? plusTage(r.neueFrist, 1) : ''].sort().pop();
      naechste = { stufe: st, name: STUFEN[st], faelligAb: ab, jetzt: ab <= h };
      break;
    }
  }
  const letzte = (r.stufen || []).filter(x => STUFEN[x.stufe]).slice(-1)[0] || null;
  return { ...r, summe, bezahlt, gebuehren, offen, status, tageUeber, naechste, letzteStufe: letzte, frist };
}

export async function rechnungErstellen({ anfrage, name, email, adresse, retreat, art, preis, positionen, beispiel, sprache }, wer = 'System') {
  const E = await reEinstellungen();
  const r = {
    id: id(9), nr: beispiel ? 'BEISPIEL-' + id(2).toUpperCase() : await naechsteNummer(E), beispiel: !!beispiel,
    anfrageId: anfrage?.id || '', name: String(name || anfrage?.name || '').slice(0, 120), email: String(email || anfrage?.email || '').toLowerCase().slice(0, 200),
    adresse: String(adresse || anfrage?.adresse || '').slice(0, 400), sprache: sprache || anfrage?.sprache || 'de',
    retreatId: retreat?.id || '', retreatTitel: retreat ? retreat.titel.de : '', leistung: retreat ? { von: retreat.von, bis: retreat.bis } : null,
    art: art || 'gesamt', datum: heute(), faellig: plusTage(heute(), E.zielTage), positionen: [], zahlungen: [], stufen: [], verlauf: [], erstellt: jetzt(),
  };
  if (Array.isArray(positionen) && positionen.length) r.positionen = positionen.map(p => ({ text: String(p.text || '').slice(0, 300), betrag: rund(p.betrag) })).filter(p => p.text);
  else {
    const reisepreis = rund(preis || preisAusText(retreat?.preis?.de));
    const titel = retreat ? `${retreat.titel.de} (${datumDe(retreat.von)} – ${datumDe(retreat.bis)})` : 'Retreat';
    if (art === 'anzahlung') {
      const anz = rund(reisepreis * E.anzahlungProzent / 100);
      r.positionen = [{ text: `Anzahlung ${E.anzahlungProzent} % – ${titel}, Reisepreis ${euro(reisepreis)}`, betrag: anz }];
    } else if (art === 'rest') {
      const bisher = (await rechnungen()).filter(x => !x.storniert && x.email === r.email && x.retreatId === r.retreatId && x.art === 'anzahlung')
        .reduce((s, x) => s + (x.positionen || []).reduce((a, p) => a + p.betrag, 0), 0);
      r.positionen = [{ text: `Restzahlung – ${titel}`, betrag: rund(reisepreis) }];
      if (bisher) r.positionen.push({ text: 'abzüglich Anzahlung', betrag: -rund(bisher) });
      if (retreat?.von && plusTage(retreat.von, -42) > r.faellig) r.faellig = plusTage(retreat.von, -42); // Restzahlung 6 Wochen vor Reisebeginn
    } else r.positionen = [{ text: `Teilnahme ${titel}`, betrag: reisepreis }];
  }
  r.verlauf.push({ zeit: jetzt(), was: 'Rechnung erstellt', wer });
  await rechnungSpeichern(r);
  if (!beispiel) await protokoll(wer, `Rechnung ${r.nr} erstellt`);
  return r;
}

export function rechnungsLink(r, seite) { return `${seite}/api/rechnung/ansehen?id=${r.id}&t=${encodeURIComponent(signieren({ r: r.id }))}`; }
export function linkPruefen(rid, t) { const o = pruefen(t); return o && o.r === rid; }

// ---------- Mails ----------
const absaetzeHtml = text => String(text || '').split(/\n\s*\n/).filter(x => x.trim()).map(p =>
  `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${u}" style="color:#B55A1F">${u.length > 60 ? (u.includes('/rechnung/') ? 'Rechnung ansehen' : u.includes('/einladung') ? 'Zugang einrichten' : u.slice(0, 60) + '…') : u}</a>`)}</p>`).join('');

export async function mailVorlage(art, { anfrage: a, rechnung: r, retreat, einladung, seite, E }) {
  const en = (a?.sprache || r?.sprache) === 'en';
  const vor = String(a?.name || r?.name || '').split(' ')[0];
  const reise = retreat ? `${retreat.titel[en ? 'en' : 'de']} (${en ? datumEn(retreat.von) : datumDe(retreat.von)} – ${en ? datumEn(retreat.bis) : datumDe(retreat.bis)})` : (a?.retreat || r?.retreatTitel || (en ? 'our retreat' : 'unserem Retreat'));
  const gruss = en ? 'Warm wishes,\nSabine & Nina' : 'Herzlich,\nSabine & Nina';
  const x = r ? auswerten(r, E) : null;
  const link = r ? rechnungsLink(r, seite) : '';
  const bank = E.iban ? (en ? `Bank details: ${E.aussteller}, IBAN ${E.iban}${E.bic ? ', BIC ' + E.bic : ''}. Reference: ${r?.nr}` : `Bankverbindung: ${E.aussteller}, IBAN ${E.iban}${E.bic ? ', BIC ' + E.bic : ''}. Verwendungszweck: ${r?.nr}`) : '';
  const T = {
    eingang: [en ? 'We have received your enquiry – Anam Cara' : 'Deine Anfrage ist bei uns angekommen – Anam Cara',
      en ? `Dear ${vor},\n\nthank you for your enquiry about ${reise}. We have received it and will get back to you personally within two days.\n\n${a?.art === 'kennen' ? 'We are looking forward to our 15-minute call.\n\n' : ''}${gruss}`
        : `Liebe ${vor},\n\ndanke für deine Anfrage zu ${reise}. Sie ist gut bei uns angekommen, wir melden uns innerhalb von zwei Tagen persönlich bei dir.\n\n${a?.art === 'kennen' ? 'Wir freuen uns auf unser 15-minütiges Kennenlerngespräch.\n\n' : ''}${gruss}`],
    zusage: [en ? `Your place is confirmed – ${retreat?.titel.en || 'Anam Cara'}` : `Dein Platz ist bestätigt – ${retreat?.titel.de || 'Anam Cara'}`,
      en ? `Dear ${vor},\n\nwe are delighted: your place for ${reise} is confirmed.\n\n${r ? `Your invoice for the deposit (${euro(x.offen)}, due ${datumEn(r.faellig)}) is here:\n${link}\n\n${bank ? bank + '\n\n' : ''}` : ''}${einladung ? `In your personal area you will find travel information, packing list and documents. Please set your password here (valid for 14 days):\n${einladung}\n\n` : ''}The booking itself is made through our travel partner JB Travel GmbH, who will send you the travel documents.\n\n${gruss}`
        : `Liebe ${vor},\n\nwir freuen uns sehr: Dein Platz für ${reise} ist bestätigt.\n\n${r ? `Hier findest du deine Rechnung über die Anzahlung (${euro(x.offen)}, zahlbar bis ${datumDe(r.faellig)}):\n${link}\n\n${bank ? bank + '\n\n' : ''}` : ''}${einladung ? `In deinem persönlichen Bereich findest du ab jetzt Reiseinfos, Packliste und Unterlagen. Bitte leg hier dein Kennwort fest (der Link gilt 14 Tage):\n${einladung}\n\n` : ''}Die Buchung selbst läuft über unseren Reisepartner, die JB Travel GmbH, die dir auch die Reiseunterlagen schickt.\n\n${gruss}`],
    absage: [en ? 'Your enquiry – Anam Cara' : 'Deine Anfrage – Anam Cara',
      en ? `Dear ${vor},\n\nthank you very much for your interest in ${reise}. Unfortunately we cannot offer you a place this time – the group is full.\n\nWe would love to let you know first when the next retreat is fixed. Just reply to this email if you would like that.\n\n${gruss}`
        : `Liebe ${vor},\n\nvon Herzen danke für dein Interesse an ${reise}. Leider können wir dir diesmal keinen Platz anbieten – die Gruppe ist voll.\n\nGerne melden wir uns als Erstes bei dir, sobald das nächste Retreat feststeht. Antworte einfach auf diese Mail, wenn du das möchtest.\n\n${gruss}`],
    warteliste: [en ? 'You are on the waiting list – Anam Cara' : 'Du stehst auf der Warteliste – Anam Cara',
      en ? `Dear ${vor},\n\n${reise} is fully booked at the moment. We have put you on the waiting list and will contact you straight away if a place becomes free.\n\n${gruss}`
        : `Liebe ${vor},\n\n${reise} ist im Moment ausgebucht. Wir haben dich auf die Warteliste gesetzt und melden uns sofort, wenn ein Platz frei wird.\n\n${gruss}`],
    rechnung: [en ? `Invoice ${r?.nr} – Anam Cara` : `Rechnung ${r?.nr} – Anam Cara`,
      en ? `Dear ${vor},\n\nhere is your invoice ${r?.nr} for ${euro(x?.offen)}, due ${datumEn(r?.faellig)}:\n${link}\n\n${bank}\n\n${gruss}`
        : `Liebe ${vor},\n\nhier findest du deine Rechnung ${r?.nr} über ${euro(x?.offen)}, zahlbar bis ${datumDe(r?.faellig)}:\n${link}\n\n${bank}\n\n${gruss}`],
    zahlung: [en ? `Payment received – ${r?.nr}` : `Zahlung erhalten – ${r?.nr}`,
      en ? `Dear ${vor},\n\nthank you, we have received your payment for invoice ${r?.nr}.${x?.offen > 0 ? ` The remaining amount is ${euro(x.offen)}.` : ' The invoice is now paid in full.'}\n\n${gruss}`
        : `Liebe ${vor},\n\ndanke, deine Zahlung zur Rechnung ${r?.nr} ist bei uns eingegangen.${x?.offen > 0 ? ` Offen sind noch ${euro(x.offen)}.` : ' Die Rechnung ist damit vollständig bezahlt.'}\n\n${gruss}`],
    erinnerung: [en ? `Friendly reminder: invoice ${r?.nr}` : `Kleine Erinnerung: Rechnung ${r?.nr}`,
      en ? `Dear ${vor},\n\nperhaps it slipped your mind: invoice ${r?.nr} over ${euro(x?.offen)} was due on ${datumEn(r?.faellig)}. If you have already paid, please ignore this message.\n\nInvoice: ${link}\n\n${bank}\n\n${gruss}`
        : `Liebe ${vor},\n\nvielleicht ist es im Alltag untergegangen: Die Rechnung ${r?.nr} über ${euro(x?.offen)} war am ${datumDe(r?.faellig)} fällig. Wenn du schon überwiesen hast, betrachte diese Nachricht bitte als erledigt.\n\nRechnung: ${link}\n\n${bank}\n\n${gruss}`],
    mahnung1: [en ? `Reminder: invoice ${r?.nr}` : `1. Mahnung: Rechnung ${r?.nr}`,
      en ? `Dear ${vor},\n\nwe have not yet received payment for invoice ${r?.nr}. Please transfer the open amount of ${euro(rund((x?.offen || 0) + Number(E.gebuehr1 || 0)))}${E.gebuehr1 ? ` (incl. ${euro(E.gebuehr1)} reminder fee)` : ''} by ${datumEn(plusTage(heute(), E.fristTage))}.\n\nInvoice: ${link}\n\n${bank}\n\nIf there is anything we should know, just reply to this email.\n\n${gruss}`
        : `Liebe ${vor},\n\nzur Rechnung ${r?.nr} haben wir leider noch keine Zahlung erhalten. Bitte überweise den offenen Betrag von ${euro(rund((x?.offen || 0) + Number(E.gebuehr1 || 0)))}${E.gebuehr1 ? ` (inkl. ${euro(E.gebuehr1)} Mahnspesen)` : ''} bis ${datumDe(plusTage(heute(), E.fristTage))}.\n\nRechnung: ${link}\n\n${bank}\n\nWenn es einen Grund für die Verzögerung gibt, antworte einfach auf diese Mail – wir finden eine Lösung.\n\n${gruss}`],
    mahnung2: [en ? `Final reminder: invoice ${r?.nr}` : `2. und letzte Mahnung: Rechnung ${r?.nr}`,
      en ? `Dear ${vor},\n\ndespite our reminder, invoice ${r?.nr} is still unpaid. Please transfer ${euro(rund((x?.offen || 0) + Number(E.gebuehr2 || 0)))}${E.gebuehr2 ? ` (incl. ${euro(E.gebuehr2)} reminder fee)` : ''} by ${datumEn(plusTage(heute(), E.fristTage))} at the latest. Otherwise we unfortunately have to release your place.\n\nInvoice: ${link}\n\n${bank}\n\n${gruss}`
        : `Liebe ${vor},\n\ntrotz unserer Erinnerung ist die Rechnung ${r?.nr} noch offen. Bitte überweise ${euro(rund((x?.offen || 0) + Number(E.gebuehr2 || 0)))}${E.gebuehr2 ? ` (inkl. ${euro(E.gebuehr2)} Mahnspesen)` : ''} spätestens bis ${datumDe(plusTage(heute(), E.fristTage))}. Andernfalls müssen wir deinen Platz leider wieder freigeben.\n\nRechnung: ${link}\n\n${bank}\n\n${gruss}`],
  };
  const [betreff, text] = T[art] || ['', ''];
  return { an: a?.email || r?.email || '', betreff, text };
}

// Mail versenden (oder als „im eigenen Mailprogramm gesendet“ vermerken) und im Verlauf festhalten
export async function mailAbschicken({ art, anfrage: a, rechnung: r, an, betreff, text, manuell, wer, seite }) {
  const beispiel = a?.beispiel || r?.beispiel || /@example\.(org|com)$/.test(an || '');
  let ergebnis = { ok: true, weg: 'manuell' };
  if (!manuell) {
    if (beispiel) return { ok: false, fehler: 'Das ist ein Beispiel mit erfundener Adresse – es wird keine Mail verschickt.' };
    const r2 = await sende({ an, betreff, text, html: rahmen(absaetzeHtml(text), seite), antwortAn: (await reEinstellungen()).email || undefined, idem: `ac-${art}-${(r || a).id}-${heute()}` });
    if (!r2.ok) return { ok: false, fehler: r2.fehler || 'Versand fehlgeschlagen.' };
    ergebnis = { ok: true, weg: 'mail' };
  }
  const eintrag = { zeit: jetzt(), was: `${NAMEN[art] || art} ${ergebnis.weg === 'mail' ? 'per Mail gesendet' : 'im eigenen Mailprogramm gesendet'}`, wer };
  if (r) {
    const E = await reEinstellungen();
    r.verlauf = [...(r.verlauf || []), eintrag];
    if (art === 'rechnung' || art === 'zusage') r.versandt = r.versandt || jetzt();
    if (STUFEN[art]) {
      r.stufen = [...(r.stufen || []), { stufe: art, zeit: jetzt(), gebuehr: art === 'mahnung1' ? Number(E.gebuehr1 || 0) : art === 'mahnung2' ? Number(E.gebuehr2 || 0) : 0, weg: ergebnis.weg }];
      r.neueFrist = plusTage(heute(), E.fristTage);
    }
    await rechnungSpeichern(r);
  }
  if (a) { a.verlauf = [...(a.verlauf || []), eintrag]; await anfrageSpeichern(a); }
  return ergebnis;
}
export const NAMEN = { eingang: 'Eingangsbestätigung', zusage: 'Zusage', absage: 'Absage', warteliste: 'Wartelisten-Info', rechnung: 'Rechnung', zahlung: 'Zahlungsbestätigung', ...STUFEN };

// ---------- Automatische Erinnerungen (täglich) ----------
export async function automatischMahnen(seite) {
  const E = await reEinstellungen(); if (!E.auto) return 0;
  const rs = await retreats(); let n = 0;
  for (const roh of await rechnungen()) {
    if (roh.beispiel || roh.storniert || !roh.versandt) continue;
    const x = auswerten(roh, E);
    if (!x.naechste?.jetzt) continue;
    if ((roh.stufen || []).some(s => s.zeit.slice(0, 10) === heute())) continue; // höchstens eine Stufe pro Tag
    const v = await mailVorlage(x.naechste.stufe, { rechnung: roh, retreat: rs.find(r => r.id === roh.retreatId), seite, E });
    const e = await mailAbschicken({ art: x.naechste.stufe, rechnung: roh, an: v.an, betreff: v.betreff, text: v.text, wer: 'Automatik', seite });
    if (e.ok) n++; else break; // bei Versandfehler (z. B. Kontingent) sofort anhalten
  }
  if (n) await protokoll('System', `${n} Zahlungserinnerung(en) automatisch versendet`);
  return n;
}

// ---------- Beispieldaten ----------
export async function beispieleAnlegen() {
  const s = await store();
  if (await s.getJSON('system/beispiele-1')) return false;
  await s.setJSON('system/beispiele-1', { zeit: jetzt() });
  const rs = await retreats(); const r = rs[0];
  const tag = (t) => plusTage(heute(), t);
  const A = [
    { name: 'Andrea Huber', email: 'andrea.huber@example.org', telefon: '+43 660 000 0001', art: 'retreat', nachricht: 'Liebe Sabine, liebe Nina,\n\nich habe von Rooted & Wild gelesen und bin ganz berührt. Gibt es die Möglichkeit eines Einzelzimmers? Und wie ist die Anreise von Graz am besten?\n\nLiebe Grüße, Andrea', status: 'neu', tage: -1 },
    { name: 'Claudia Steiner', email: 'claudia.steiner@example.org', telefon: '+43 660 000 0002', art: 'kennen', wann: 'Dienstag oder Donnerstag ab 18 Uhr', nachricht: 'Ich möchte gerne mehr über das Retreat erfahren, bevor ich mich entscheide.', status: 'neu', tage: -2 },
    { name: 'Sophie Wagner', email: 'sophie.wagner@example.org', art: 'warte', nachricht: 'Bitte merkt mich für die nächste Reise vor, im Herbst 2027 kann ich leider nicht.', status: 'in-arbeit', tage: -6 },
    { name: 'Martina Gruber', email: 'martina.gruber@example.org', telefon: '+43 660 000 0004', art: 'retreat', nachricht: 'Ich bin dabei! Bitte schickt mir alle Infos zur Buchung.', status: 'angenommen', tage: -40, adresse: 'Martina Gruber\nMusterweg 4\n1070 Wien' },
    { name: 'Elisabeth Moser', email: 'elisabeth.moser@example.org', art: 'retreat', nachricht: 'Sehr gerne möchte ich einen Platz reservieren.', status: 'angenommen', tage: -45, adresse: 'Elisabeth Moser\nBeispielgasse 12\n5020 Salzburg' },
  ];
  const ang = {};
  for (const x of A) {
    const a = await anfrageSpeichern({ art: x.art, name: x.name, email: x.email, telefon: x.telefon || '', retreat: r && x.art !== 'warte' ? r.titel.de : '', retreatId: r && x.art !== 'warte' ? r.id : '', wann: x.wann || '', nachricht: x.nachricht, sprache: 'de', beispiel: true, adresse: x.adresse || '' });
    a.zeit = new Date(Date.now() + x.tage * 864e5).toISOString(); a.status = x.status; a.verlauf = [{ zeit: a.zeit, was: 'Anfrage über die Website', wer: 'Website' }];
    if (x.status === 'angenommen') a.verlauf.push({ zeit: new Date(Date.now() + (x.tage + 1) * 864e5).toISOString(), was: 'Angenommen, Zusage gesendet', wer: 'Beispiel' });
    await anfrageSpeichern(a); ang[x.name] = a;
  }
  if (r) {
    const m1 = await rechnungErstellen({ anfrage: ang['Martina Gruber'], retreat: r, art: 'anzahlung', beispiel: true });
    Object.assign(m1, { datum: tag(-39), faellig: tag(-25), versandt: new Date(Date.now() - 39 * 864e5).toISOString(), zahlungen: [{ id: id(5), datum: tag(-30), betrag: m1.positionen[0].betrag, notiz: 'Überweisung' }] });
    await rechnungSpeichern(m1);
    const m2 = await rechnungErstellen({ anfrage: ang['Martina Gruber'], retreat: r, art: 'rest', beispiel: true });
    Object.assign(m2, { datum: tag(-2), faellig: tag(12), versandt: new Date(Date.now() - 2 * 864e5).toISOString() });
    await rechnungSpeichern(m2);
    const e1 = await rechnungErstellen({ anfrage: ang['Elisabeth Moser'], retreat: r, art: 'anzahlung', beispiel: true });
    Object.assign(e1, { datum: tag(-44), faellig: tag(-30), versandt: new Date(Date.now() - 44 * 864e5).toISOString(), stufen: [{ stufe: 'erinnerung', zeit: new Date(Date.now() - 26 * 864e5).toISOString(), gebuehr: 0, weg: 'mail' }], neueFrist: tag(-19) });
    e1.verlauf.push({ zeit: new Date(Date.now() - 26 * 864e5).toISOString(), was: 'Zahlungserinnerung per Mail gesendet', wer: 'Automatik' });
    await rechnungSpeichern(e1);
  }
  return true;
}
export async function beispieleEntfernen() {
  const s = await store(); let n = 0;
  for (const a of await anfragen()) if (a.beispiel) { await s.del('anfrage/' + a.id); n++; }
  for (const r of await rechnungen()) if (r.beispiel) { await s.del('rechnung/' + r.id); n++; }
  return n;
}

// ---------- Rechnung als Seite (druckbar, als PDF speicherbar) ----------
const LOGO = '<img class="re-monde" src="/assets/logo/monde.png" width="514" height="138" alt="">';

export function rechnungHtml(roh, E, retreat, { admin = false } = {}) {
  const r = auswerten(roh, E);
  const en = r.sprache === 'en';
  const d = en ? datumEn : datumDe;
  const L = en ? { titel: 'Invoice', nr: 'Invoice no.', datum: 'Invoice date', leistung: 'Service period', faellig: 'Due date', an: 'Billed to', pos: 'Description', betrag: 'Amount', summe: 'Total', bezahlt: 'Payments received', geb: 'Reminder fees', offen: 'Amount due', bank: 'Payment details', zweck: 'Reference', drucken: 'Print / save as PDF', bezahltStempel: 'Paid', storno: 'Cancelled' }
    : { titel: 'Rechnung', nr: 'Rechnungsnummer', datum: 'Rechnungsdatum', leistung: 'Leistungszeitraum', faellig: 'Zahlbar bis', an: 'Rechnung an', pos: 'Leistung', betrag: 'Betrag', summe: 'Gesamtbetrag', bezahlt: 'Bereits bezahlt', geb: 'Mahnspesen', offen: 'Offener Betrag', bank: 'Zahlung', zweck: 'Verwendungszweck', drucken: 'Drucken / als PDF speichern', bezahltStempel: 'Bezahlt', storno: 'Storniert' };
  const stufe = r.letzteStufe && r.offen > 0 ? STUFEN[r.letzteStufe.stufe] : '';
  return `<!doctype html><html lang="${en ? 'en' : 'de'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(L.titel)} ${esc(r.nr)} – Anam Cara</title><link rel="stylesheet" href="/assets/css/rechnung.css?v=3"><link rel="icon" href="/assets/logo/favicon-32.png" type="image/png"></head>
<body><div class="re-leiste"><button type="button" class="re-knopf" data-drucken>${L.drucken}</button>${admin ? '<a class="re-knopf re-knopf--leise" href="/verwaltung#buchungen">Zur Verwaltung</a>' : ''}</div>
<main class="re-blatt">
  ${r.beispiel ? '<div class="re-wasser" aria-hidden="true">Beispiel</div>' : ''}
  ${r.status === 'bezahlt' ? `<div class="re-stempel">${L.bezahltStempel}</div>` : r.storniert ? `<div class="re-stempel re-stempel--rot">${L.storno}</div>` : ''}
  <header class="re-kopf">
    <div class="re-marke">${LOGO}<p class="re-name">Anam Cara</p><p class="re-unter">Soul Sisters Gatherings</p><p class="re-wer"><span class="re-nw">Sabine Rueland</span> &amp; <span class="re-nw">Nina Walcher</span></p></div>
    <address class="re-absender"><strong>${esc(E.aussteller)}</strong><br>${esc(E.adresse).replace(/\n/g, '<br>')}${E.email ? '<br>' + esc(E.email) : ''}${E.uid ? '<br>UID: ' + esc(E.uid) : ''}</address>
  </header>
  <div class="re-zier" aria-hidden="true"></div>
  <section class="re-mitte">
    <address class="re-an"><span class="re-etikett">${L.an}</span>${esc(r.adresse || r.name).replace(/\n/g, '<br>')}${r.adresse ? '' : `<br><span class="re-fehlt">${en ? 'Address missing' : 'Anschrift fehlt'}</span>`}</address>
    <dl class="re-daten">
      <div><dt>${L.nr}</dt><dd>${esc(r.nr)}</dd></div>
      <div><dt>${L.datum}</dt><dd>${d(r.datum)}</dd></div>
      ${r.leistung ? `<div><dt>${L.leistung}</dt><dd>${d(r.leistung.von)} – ${d(r.leistung.bis)}</dd></div>` : ''}
      <div><dt>${L.faellig}</dt><dd>${d(r.frist)}</dd></div>
    </dl>
  </section>
  <h1 class="re-titel">${L.titel}${stufe ? ` <span class="re-stufe">· ${esc(stufe)}</span>` : ''}</h1>
  <table class="re-tabelle"><thead><tr><th>${L.pos}</th><th>${L.betrag}</th></tr></thead><tbody>
    ${r.positionen.map(p => `<tr><td>${esc(p.text)}</td><td>${euro(p.betrag)}</td></tr>`).join('')}
  </tbody><tfoot>
    <tr class="re-summe"><td>${L.summe}</td><td>${euro(r.summe)}</td></tr>
    ${r.gebuehren ? `<tr><td>${L.geb}</td><td>${euro(r.gebuehren)}</td></tr>` : ''}
    ${r.bezahlt ? `<tr><td>${L.bezahlt}</td><td>− ${euro(r.bezahlt)}</td></tr>` : ''}
    ${r.bezahlt || r.gebuehren ? `<tr class="re-offen"><td>${L.offen}</td><td>${euro(Math.max(0, r.offen))}</td></tr>` : ''}
  </tfoot></table>
  ${E.ustHinweis ? `<p class="re-klein">${esc(E.ustHinweis)}</p>` : ''}
  ${r.offen > 0 && !r.storniert ? `<section class="re-zahlung"><h2>${L.bank}</h2>
    ${E.iban ? `<p>${en ? 'Please transfer' : 'Bitte überweise'} <strong>${euro(r.offen)}</strong> ${en ? 'by' : 'bis'} <strong>${d(r.frist)}</strong>:</p>
    <dl class="re-bank"><div><dt>${en ? 'Account holder' : 'Kontoinhaberin'}</dt><dd>${esc(E.aussteller)}</dd></div><div><dt>IBAN</dt><dd>${esc(E.iban)}</dd></div>${E.bic ? `<div><dt>BIC</dt><dd>${esc(E.bic)}</dd></div>` : ''}${E.bank ? `<div><dt>Bank</dt><dd>${esc(E.bank)}</dd></div>` : ''}<div><dt>${L.zweck}</dt><dd>${esc(r.nr)}</dd></div></dl>`
    : `<p class="re-fehlt">${en ? 'Bank details will follow.' : 'Die Bankverbindung wird noch in den Einstellungen ergänzt.'}</p>`}</section>` : ''}
  <footer class="re-fuss"><p>${esc(E.fuss)}</p><p class="re-ogham" aria-hidden="true">᚛ᚐᚅᚐᚋ ᚉᚐᚏᚐ᚜</p></footer>
</main><script src="/assets/js/rechnung.js?v=1" defer></script></body></html>`;
}
