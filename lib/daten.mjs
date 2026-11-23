// Fachliche Datenschicht. Funktionen und Seiten greifen NUR hierüber auf Daten zu.
import { store, alle } from './store.mjs';
import { STANDARD_INHALT, STANDARD_RETREATS } from './inhalt-standard.mjs';
import { id, jetzt, sha } from './util.mjs';

// ---------- Inhalte ----------
export async function inhalt() {
  const s = await store();
  const g = await s.getJSON('inhalt');
  if (!g) return structuredClone(STANDARD_INHALT);
  // fehlende Felder aus dem Standard ergänzen (neue Felder nach Updates)
  const m = structuredClone(STANDARD_INHALT);
  for (const l of ['de', 'en']) m.texte[l] = { ...m.texte[l], ...(g.texte?.[l] || {}) };
  m.einstellungen = { ...m.einstellungen, ...(g.einstellungen || {}) };
  m.einstellungen.abschnitte = { ...STANDARD_INHALT.einstellungen.abschnitte, ...(g.einstellungen?.abschnitte || {}) };
  m.einstellungen.fristen = { ...STANDARD_INHALT.einstellungen.fristen, ...(g.einstellungen?.fristen || {}) };
  m.einstellungen.bildplaetze = { ...STANDARD_INHALT.einstellungen.bildplaetze, ...(g.einstellungen?.bildplaetze || {}) };
  m.einstellungen.social = { ...STANDARD_INHALT.einstellungen.social, ...(g.einstellungen?.social || {}) };
  m.entwurf = g.entwurf ?? true;
  m.geaendert = g.geaendert;
  return m;
}
export async function inhaltSpeichern(i) {
  const s = await store();
  i.geaendert = jetzt();
  await s.setJSON('inhalt', i);
}

// ---------- Retreats ----------
export async function retreats() {
  const s = await store();
  return (await s.getJSON('retreats')) ?? structuredClone(STANDARD_RETREATS);
}
export async function retreatsSpeichern(liste) {
  const s = await store();
  await s.setJSON('retreats', liste);
}

// ---------- Konten (Verwaltung + Teilnehmerinnen) ----------
export async function konten() { return alle('konto/'); }
export async function konto(kid) { return (await store()).getJSON('konto/' + kid); }
export async function kontoNachMail(mail) {
  const k = (await konten()).find(x => x.email === String(mail).toLowerCase().trim());
  return k || null;
}
// Anmeldename: E-Mail-Adresse oder Benutzername (ohne Groß-/Kleinschreibung)
export async function kontoNachKennung(kennung) {
  const w = String(kennung || '').toLowerCase().trim();
  if (!w) return null;
  return (await konten()).find(x => x.email === w || (x.benutzer && x.benutzer === w)) || null;
}
export async function kontoSpeichern(k) { await (await store()).setJSON('konto/' + k.id, k); }
export async function kontoLoeschen(kid) {
  const s = await store();
  await s.del('konto/' + kid);
}

// ---------- Anmeldesperre ----------
export async function fehlversuch(schluessel) {
  const s = await store(); const k = 'sperre/' + sha(schluessel).slice(0, 32);
  const v = (await s.getJSON(k)) || { n: 0, bis: 0 };
  v.n += 1; if (v.n >= 5) { v.bis = Date.now() + 15 * 60 * 1000; v.n = 0; }
  await s.setJSON(k, v); return v;
}
export async function gesperrt(schluessel) {
  const s = await store(); const v = await s.getJSON('sperre/' + sha(schluessel).slice(0, 32));
  return v && v.bis > Date.now() ? v.bis : 0;
}
export async function sperreAufheben(schluessel) { const s = await store(); await s.del('sperre/' + sha(schluessel).slice(0, 32)); }

// ---------- Anfragen ----------
export async function anfragen() { return (await alle('anfrage/')).sort((a, b) => b.zeit.localeCompare(a.zeit)); }
export async function anfrageSpeichern(a) {
  if (!a.id) { a.id = id(9); a.zeit = jetzt(); a.status = 'neu'; }
  await (await store()).setJSON('anfrage/' + a.id, a); return a;
}
export async function anfrage(aid) { return (await store()).getJSON('anfrage/' + aid); }
export async function anfrageLoeschen(aid) { await (await store()).del('anfrage/' + aid); }

// ---------- Newsletter-Kontakte ----------
export const kontaktSchluessel = mail => 'kontakt/' + sha(String(mail).toLowerCase().trim()).slice(0, 40);
export async function kontakte() { return alle('kontakt/'); }
export async function kontakt(mail) { return (await store()).getJSON(kontaktSchluessel(mail)); }
export async function kontaktSpeichern(k) { await (await store()).setJSON(kontaktSchluessel(k.email), k); }
export async function kontaktLoeschen(mail) { await (await store()).del(kontaktSchluessel(mail)); }

// ---------- Stimmen (Feedback von Teilnehmerinnen) ----------
export async function stimmen() { return (await alle('stimme/')).sort((a, b) => b.zeit.localeCompare(a.zeit)); }
export async function stimmeSpeichern(st) { if (!st.id) { st.id = id(9); st.zeit = jetzt(); } await (await store()).setJSON('stimme/' + st.id, st); return st; }
export async function stimmeLoeschen(sid) { await (await store()).del('stimme/' + sid); }

// ---------- Bilder und Dokumente ----------
export async function bilder() { return ((await (await store()).getJSON('bilder')) || []); }
export async function bilderSpeichern(l) { await (await store()).setJSON('bilder', l); }
export async function dateiSpeichern(art, fid, buf, meta) { await (await store()).set(art + '/' + fid, buf, meta); }
export async function datei(art, fid) { const s = await store(); return { buf: await s.get(art + '/' + fid), meta: await s.getMeta(art + '/' + fid) }; }
export async function dateiLoeschen(art, fid) { await (await store()).del(art + '/' + fid); }

// ---------- Newsletter-Versand ----------
export async function nlEntwurf() { return (await (await store()).getJSON('nl/entwurf')) || null; }
export async function nlEntwurfSpeichern(e) { await (await store()).setJSON('nl/entwurf', e); }
export async function nlLauf(lid) { return (await store()).getJSON('nl/lauf/' + lid); }
export async function nlLaufSpeichern(l) { await (await store()).setJSON('nl/lauf/' + l.id, l); }
export async function nlLaeufe() { return (await alle('nl/lauf/')).sort((a, b) => b.start.localeCompare(a.start)); }
export async function nlMerkzettel(schl) { return new Set((await (await store()).getJSON('nl/merk/' + schl)) || []); }
export async function nlMerkzettelSpeichern(schl, set) { await (await store()).setJSON('nl/merk/' + schl, [...set]); }

// ---------- Statistik (ohne Cookies, ohne IP) ----------
export async function zaehlen(tag, pfad, quelle) {
  const s = await store(); const k = 'stat/' + tag;
  const v = (await s.getJSON(k)) || { seiten: {}, quellen: {}, summe: 0 };
  v.summe += 1;
  v.seiten[pfad] = (v.seiten[pfad] || 0) + 1;
  if (quelle) v.quellen[quelle] = (v.quellen[quelle] || 0) + 1;
  await s.setJSON(k, v);
}
export async function statistik(tage = 30) {
  const s = await store(); const out = [];
  for (let i = tage - 1; i >= 0; i--) {
    const t = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    out.push({ tag: t, ...((await s.getJSON('stat/' + t)) || { seiten: {}, quellen: {}, summe: 0 }) });
  }
  return out;
}

// ---------- Sicherung ----------
const SICHERBAR = ['inhalt', 'retreats', 'bilder'];
const SICHER_PRAEFIXE = ['konto/', 'anfrage/', 'kontakt/', 'stimme/', 'nl/lauf/'];
export async function sicherungErstellen() {
  const s = await store(); const daten = {};
  for (const k of SICHERBAR) daten[k] = await s.getJSON(k);
  for (const p of SICHER_PRAEFIXE) for (const k of await s.list(p)) daten[k] = await s.getJSON(k);
  return { art: 'anamcara-sicherung', fassung: 1, erstellt: jetzt(), daten };
}
export async function sicherungAblegen() {
  const s = await store(); const sich = await sicherungErstellen();
  const tag = sich.erstellt.slice(0, 10);
  await s.setJSON('sicherung/' + tag, sich);
  const alleS = (await s.list('sicherung/')).sort();
  for (const alt of alleS.slice(0, Math.max(0, alleS.length - 30))) await s.del(alt);
  return tag;
}
export async function sicherungenListe() { return (await (await store()).list('sicherung/')).sort().reverse(); }
export async function sicherungLaden(tag) { return (await store()).getJSON('sicherung/' + tag); }
export async function sicherungEinspielen(sich) {
  if (sich?.art !== 'anamcara-sicherung' || typeof sich.daten !== 'object') throw new Error('Keine gültige Sicherungsdatei.');
  const s = await store();
  for (const [k, v] of Object.entries(sich.daten)) {
    const erlaubt = SICHERBAR.includes(k) || SICHER_PRAEFIXE.some(p => k.startsWith(p));
    if (erlaubt && v !== null && v !== undefined) await s.setJSON(k, v);
  }
}

// ---------- Fristen / Löschautomatik ----------
export async function aufraeumen() {
  const i = await inhalt(); const f = i.einstellungen.fristen; const jetztMs = Date.now();
  let geloescht = 0;
  for (const a of await anfragen()) {
    if (jetztMs - Date.parse(a.zeit) > f.anfragenMonate * 30.5 * 864e5) { await anfrageLoeschen(a.id); geloescht++; }
  }
  for (const k of await kontakte()) {
    if (k.status === 'unbestaetigt' && jetztMs - Date.parse(k.angelegt) > f.unbestaetigtTage * 864e5) { await kontaktLoeschen(k.email); geloescht++; }
  }
  const rs = await retreats();
  for (const k of await konten()) {
    if (k.rolle !== 'teilnehmerin') continue;
    const ende = Math.max(0, ...(k.retreats || []).map(rid => Date.parse((rs.find(r => r.id === rid)?.bis || '1970-01-01') + 'T23:59:59')));
    if (ende && ende > 0 && jetztMs - ende > f.teilnehmerinnenMonateNachReise * 30.5 * 864e5) { await kontoLoeschen(k.id); geloescht++; }
  }
  const s = await store();
  for (const k of await s.list('stat/')) {
    if (jetztMs - Date.parse(k.slice(5)) > 400 * 864e5) await s.del(k);
  }
  return geloescht;
}

// ---------- Protokoll wichtiger Aktionen (ohne Inhaltsdaten) ----------
export async function protokoll(wer, was) {
  const s = await store(); const tag = jetzt().slice(0, 7);
  const l = (await s.getJSON('protokoll/' + tag)) || [];
  l.push({ zeit: jetzt(), wer, was: String(was).slice(0, 200) });
  await s.setJSON('protokoll/' + tag, l);
}
export async function protokollLesen() {
  const s = await store(); const keys = (await s.list('protokoll/')).sort().reverse().slice(0, 3);
  let out = []; for (const k of keys) out = out.concat(((await s.getJSON(k)) || []).reverse());
  return out.slice(0, 300);
}
// ---------- Anmeldecodes (zweiter Schritt) ----------
export async function codeSetzen(kid, code) { await (await store()).setJSON('code/' + kid, { h: sha(code), bis: Date.now() + 10 * 60 * 1000, n: 0 }); }
export async function codePruefen(kid, code) {
  const s = await store(); const v = await s.getJSON('code/' + kid);
  if (!v || v.bis < Date.now()) return false;
  if (v.h === sha(String(code).trim())) { await s.del('code/' + kid); return true; }
  v.n++; if (v.n >= 5) await s.del('code/' + kid); else await s.setJSON('code/' + kid, v);
  return false;
}
