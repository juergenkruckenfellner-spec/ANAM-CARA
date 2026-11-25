// Einmalig (25.11.2026, Wunsch Nina Walcher): überall nur noch eigene Fotos von Anam Cara.
// Ersetzt die früher mitgelieferten Fremdfotos in der Bildverwaltung durch die eigenen Fotos,
// füllt alle Bildplätze (auch die neuen Unterseiten-Bilder), biegt Reisebilder um und löscht
// die alten Dateien. Selbst hochgeladene Fotos bleiben unberührt.
import * as D from './daten.mjs';
import { store } from './store.mjs';
import { id, jetzt, env } from './util.mjs';
import { STANDARD_BILDER, PLATZ_STANDARD, IMPRESSIONEN_STANDARD, BOGEN_STANDARD } from './seiten.mjs';

const ALTE_NAMEN = new Set(['klippen-bucht', 'temple-house-ruine', 'ben-bulben-kueste', 'felsen-brandung', 'temple-house', 'kueste-weiden', 'kueste-grasnelken'].map(k => k + '.webp'));
const MARKE = 'system/fotos-3';
let erledigt = false;

export async function fotosEigeneTauschen(quellen) {
  if (erledigt) return false;
  const s = await store();
  if (await s.getJSON(MARKE)) { erledigt = true; return false; }
  const sperre = await s.getJSON(MARKE + '-laeuft');
  if (sperre && Date.now() - sperre.t < 120000) return false;
  await s.setJSON(MARKE + '-laeuft', { t: Date.now() });

  const i = await D.inhalt();
  if (!i.einstellungen.fotosImportiert) { await s.setJSON(MARKE, { zeit: jetzt(), nurStandard: true }); erledigt = true; return true; }

  const bl = await D.bilder();
  const alte = bl.filter(b => ALTE_NAMEN.has(b.name)); const altIds = new Set(alte.map(b => b.id));
  const rest = bl.filter(b => !altIds.has(b.id));
  const neu = {};
  const schluessel = [...new Set([...IMPRESSIONEN_STANDARD, ...Object.values(PLATZ_STANDARD)])];
  for (const k of schluessel) {
    const S = STANDARD_BILDER[k];
    const vorhanden = rest.find(b => b.name === k + '.webp');
    if (vorhanden) { if (!vorhanden.titel && S.titel) vorhanden.titel = S.titel; neu[k] = vorhanden; continue; }
    const w = S.breiten[S.breiten.length - 1];
    let r = null;
    for (const q of [...new Set(quellen.filter(Boolean))]) { try { r = await fetch(`${q}${S.statisch}-${w}.webp`); if (r.ok) break; } catch { r = null; } }
    if (!r?.ok) throw new Error('Foto nicht erreichbar: ' + k);
    const bid = id(8); await D.dateiSpeichern('bild', bid, Buffer.from(await r.arrayBuffer()), { typ: 'image/webp' });
    neu[k] = { id: bid, name: k + '.webp', titel: S.titel || '', b: S.b, h: S.h, alt: { ...S.alt }, galerie: false, impression: IMPRESSIONEN_STANDARD.includes(k), credit: '', zeit: jetzt() };
  }
  const reihe = IMPRESSIONEN_STANDARD.map(k => neu[k]);
  const reiheIds = new Set(reihe.map(b => b.id));
  await D.bilderSpeichern([...reihe, ...rest.filter(b => !reiheIds.has(b.id)), ...schluessel.filter(k => !IMPRESSIONEN_STANDARD.includes(k) && !rest.includes(neu[k])).map(k => neu[k])]);

  const frisch = await D.inhalt(); const P = frisch.einstellungen.bildplaetze || {};
  for (const [platz, wert] of Object.entries(P)) if (altIds.has(wert)) P[platz] = '';
  for (const [platz, k] of Object.entries(PLATZ_STANDARD)) if (!P[platz] && neu[k]) P[platz] = neu[k].id;
  frisch.einstellungen.bildplaetze = P; await D.inhaltSpeichern(frisch);

  const rs = await D.retreats(); let rg = false;
  for (const r of rs) {
    if (!r.bild || altIds.has(r.bild)) { r.bild = neu['morgenweg'].id; rg = true; }
    const b = (r.bilder || []).filter(x => !altIds.has(x));
    if (!b.length || b.length !== (r.bilder || []).length) { r.bilder = b.length ? b : BOGEN_STANDARD.map(k => neu[k]?.id).filter(x => x && x !== r.bild); rg = true; }
  }
  if (rg) await D.retreatsSpeichern(rs);

  for (const b of alte) { try { await D.dateiLoeschen('bild', b.id); } catch {} }
  await D.protokoll('System', 'Fremdfotos durch eigene Fotos von Anam Cara ersetzt');
  await s.setJSON(MARKE, { zeit: jetzt(), ersetzt: alte.length });
  erledigt = true;
  if (!env('DEV_STORE_DIR')) { try { const { purgeCache } = await import('@netlify/cache'); await purgeCache({ tags: ['seiten'] }); } catch (e) { console.error('Cache leeren', e.message); } }
  return true;
}

// Einmalig: Kontaktadresse office@anam-cara.at setzen (falls leer) und Fotonachweise an den Fotos ergänzen
const CREDITS = { 'herrenhaus-halle.webp': 'Temple House', 'schlucht-meer.webp': 'MoMent Photography', 'felsen-bucht.webp': 'MoMent Photography' };
let nachgepflegt = false;
export async function datenNachpflegen() {
  if (nachgepflegt) return;
  const s = await store();
  if (await s.getJSON('system/daten-4')) { nachgepflegt = true; return; }
  const i = await D.inhalt(); let ge = false;
  if (!i.einstellungen.email) { i.einstellungen.email = 'office@anam-cara.at'; ge = true; }
  if (ge) await D.inhaltSpeichern(i);
  const bl = await D.bilder(); let gb = false;
  for (const b of bl) if (CREDITS[b.name] && !b.credit) { b.credit = CREDITS[b.name]; gb = true; }
  if (gb) await D.bilderSpeichern(bl);
  await s.setJSON('system/daten-4', { zeit: jetzt() }); nachgepflegt = true;
  if ((ge || gb) && !env('DEV_STORE_DIR')) { try { const { purgeCache } = await import('@netlify/cache'); await purgeCache({ tags: ['seiten'] }); } catch {} }
}

// Einmalig: alle Landschaftsfotos in die Impressionen, Bildbogen der Reise auf etwa die Hälfte der Fotos
let bogenErledigt = false;
export async function impressionenUndBogen() {
  if (bogenErledigt) return;
  const s = await store();
  if (await s.getJSON('system/daten-5')) { bogenErledigt = true; return; }
  const i = await D.inhalt(); const P = i.einstellungen.bildplaetze || {};
  const portraets = new Set([P.nina, P.sabine].filter(Boolean));
  const bl = await D.bilder(); let gb = false;
  for (const b of bl) if (!b.impression && !portraets.has(b.id) && b.name !== 'nina.webp') { b.impression = true; gb = true; }
  if (gb) await D.bilderSpeichern(bl);
  const nachName = n => bl.find(b => b.name === n + '.webp')?.id;
  const rs = await D.retreats(); let rg = false;
  const alt4 = ['herrenhaus-halle', 'schlucht-meer', 'nebelkueste', 'kueste-ginster'].map(nachName);
  for (const r of rs) {
    const b = r.bilder || [];
    if (b.length <= 4 && b.every(x => alt4.includes(x))) {
      const neu = BOGEN_STANDARD.map(nachName).filter(x => x && x !== r.bild);
      if (neu.length > b.length) { r.bilder = neu; rg = true; }
    }
  }
  if (rg) await D.retreatsSpeichern(rs);
  await s.setJSON('system/daten-5', { zeit: jetzt() }); bogenErledigt = true;
  if ((gb || rg) && !env('DEV_STORE_DIR')) { try { const { purgeCache } = await import('@netlify/cache'); await purgeCache({ tags: ['seiten'] }); } catch {} }
}
