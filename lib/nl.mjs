// Newsletter nach Hofgassl-Standard: Vorschau-Pflicht, Portionen, dreifacher Schutz vor Doppelversand,
// Fortsetzen, Anhalten bei Quota/Schlüsselfehler, Abbestellen mit zwei Rückfragen.
import { esc, sha, signieren, jetzt, zeitraum } from './util.mjs';
import { kontakte, kontakt, nlEntwurf, nlLauf, nlLaufSpeichern, nlMerkzettel, nlMerkzettelSpeichern, retreats, bilder } from './daten.mjs';
import { sende } from './mail.mjs';
import { retreatPfad } from './seiten.mjs';

export const signatur = e => sha((e.betreff || '') + '|' + JSON.stringify(e.bloecke || []) + '|' + (e.anrede || '') + (e.anredeFrei || '')).slice(0, 20);

function anredeZeile(e, k) {
  const vor = (k?.name || '').trim().split(/\s+/)[0];
  if (e.anrede === 'keine') return '';
  if (e.anrede === 'frei') return (e.anredeFrei || '').replace('{vorname}', vor || '').trim();
  if (e.anrede === 'hallo') return vor ? `Hallo ${vor},` : 'Hallo,';
  return vor ? `Liebe ${vor},` : 'Liebe Leserin,';
}

const textZuHtml = t => String(t || '').split(/\n\s*\n/).map(p => {
  let h = esc(p.trim()).replace(/\n/g, '<br>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#A9521B">$1</a>');
  return h ? `<p style="margin:0 0 16px">${h}</p>` : '';
}).join('');

export async function briefHtml(e, k, seite, abmeldeLink) {
  const [rs, bl] = await Promise.all([retreats(), bilder()]);
  const teile = [];
  const an = anredeZeile(e, k); if (an) teile.push(`<p style="margin:0 0 16px">${esc(an)}</p>`);
  for (const b of e.bloecke || []) {
    if (b.typ === 'text') teile.push(textZuHtml(b.text));
    if (b.typ === 'bild') { const x = bl.find(y => y.id === b.id); if (x) teile.push(`<p style="margin:0 0 18px"><img src="${seite}/.netlify/images?url=${encodeURIComponent('/bild/' + x.id)}&w=1100&fm=jpg&q=78" width="536" alt="${esc(x.alt?.de || '')}" style="display:block;width:100%;height:auto;border:0"></p>`); }
    if (b.typ === 'reise') {
      const r = rs.find(y => y.id === b.rid);
      if (r) teile.push(`<table role="presentation" width="100%" style="border:1px solid #E4D9C8;background:#F3ECE1;margin:0 0 18px"><tr><td style="padding:18px 20px">
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#A9521B">${esc(zeitraum(r.von, r.bis, 'de'))} · ${esc(r.ort.de)}</div>
<div style="font-family:Cormorant,Georgia,serif;font-size:26px;color:#22362A;margin:6px 0">${esc(r.titel.de)}</div>
<div style="margin:0 0 10px">${esc(r.kurz.de)}</div><a href="${seite}${retreatPfad(r.slug, 'de')}" style="color:#2F4A3A;font-weight:bold">Zur Reise</a></td></tr></table>`);
    }
    if (b.typ === 'knopf' && b.url) teile.push(`<p style="margin:22px 0"><a href="${esc(b.url)}" style="display:inline-block;background:#A9521B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:3px">${esc(b.text || 'Mehr erfahren')}</a></p>`);
  }
  teile.push(`<p style="margin:24px 0 0">Herzlich<br>Sabine &amp; Nina</p>`);
  const fuss = `<div style="max-width:600px;margin:44px auto 0;font-size:12px;color:#7A6F64;text-align:center;line-height:1.6">
Du erhältst diesen Brief, weil du dich auf anam-cara.at angemeldet hast.<br>
<a href="${esc(abmeldeLink)}" style="display:inline-block;margin-top:10px;font-size:12px;color:#5D5249;border:1px solid #CDBFAa;padding:5px 10px;border-radius:3px;text-decoration:none">Newsletter abbestellen</a></div>`;
  const { rahmen } = await import('./mail.mjs');
  return rahmen(teile.join(''), seite, fuss);
}

export const abmeldeLink = (seite, mail) => `${seite}/newsletter/abbestellen?t=${encodeURIComponent(signieren({ m: mail, z: 'ab' }))}`;

// Eine Portion versenden. Der Server weiß, was gesendet wurde.
export async function portion({ laufId, geraet, n = 15, seite }) {
  const e = await nlEntwurf();
  if (!e || e.laufId !== laufId) return { status: 409, fehler: 'Der Entwurf hat sich geändert. Bitte Vorschau erneut prüfen.' };
  if (!e.ok) return { status: 409, fehler: 'Bitte zuerst die Vorschau prüfen und bestätigen.' };
  const sig = signatur(e);
  const empf = (await kontakte()).filter(k => k.status === 'aktiv').sort((a, b) => a.email.localeCompare(b.email));
  let lauf = await nlLauf(laufId);
  if (!lauf) lauf = { id: laufId, sig, betreff: e.betreff, start: jetzt(), gesamt: empf.length, gesendet: 0, uebergangen: 0, fehler: [], fertig: false };
  if (lauf.sig !== sig) return { status: 409, fehler: 'Inhalt wurde nach dem Start geändert. Für eine neue Aussendung bitte „Neuen Newsletter anlegen".' };
  if (lauf.lebenszeichen && Date.now() - lauf.lebenszeichen < 90e3 && lauf.geraet && lauf.geraet !== geraet) return { status: 423, fehler: 'Auf einem anderen Gerät läuft diese Aussendung gerade. Bitte dort fertig senden.' };
  lauf.geraet = geraet; lauf.lebenszeichen = Date.now(); lauf.gesamt = Math.max(lauf.gesamt, empf.length);
  await nlLaufSpeichern(lauf);

  // Merkzettel pro Brief (Signatur) und pro Lauf, gelesen wird die Vereinigung
  const merkSig = await nlMerkzettel('sig-' + sig), merkLauf = await nlMerkzettel('lauf-' + laufId);
  const erledigt = new Set([...merkSig, ...merkLauf]);
  const offen = empf.filter(k => !erledigt.has(sha(k.email)));
  const start = Date.now(); let gesendet = 0, stopp = null; const fehler = [];
  const max = Math.min(n, 25);
  for (const k of offen.slice(0, max)) {
    if (Date.now() - start > 8000) break; // Zeitwächter
    try {
      const frisch = await kontakt(k.email); // Abbestellt? vor jedem Einzelversand prüfen
      if (!frisch || frisch.status !== 'aktiv') { lauf.uebergangen++; merkLauf.add(sha(k.email)); continue; }
      const ab = abmeldeLink(seite, k.email);
      const html = await briefHtml(e, k, seite, ab);
      const r = await sende({
        an: k.email, betreff: e.betreff, html, text: e.bloecke.filter(b => b.typ === 'text').map(b => b.text).join('\n\n') + '\n\nAbbestellen: ' + ab,
        kopf: { 'List-Unsubscribe': `<${seite}/api/newsletter/abmelden-direkt?t=${encodeURIComponent(ab.split('t=')[1])}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        idem: `nl-${sig}-${sha(k.email)}`.slice(0, 256),
      });
      if (r.ok) { gesendet++; lauf.gesendet++; merkSig.add(sha(k.email)); merkLauf.add(sha(k.email)); }
      else { fehler.push({ an: k.email.replace(/(.).+@/, '$1…@'), status: r.status, text: r.fehler }); if (r.stopp) { stopp = r.fehler || 'Versand angehalten'; break; } }
    } catch (err) { fehler.push({ an: k.email.replace(/(.).+@/, '$1…@'), status: 0, text: err.message }); }
  }
  await nlMerkzettelSpeichern('sig-' + sig, merkSig); await nlMerkzettelSpeichern('lauf-' + laufId, merkLauf);
  const nochOffen = empf.filter(k => !merkSig.has(sha(k.email)) && !merkLauf.has(sha(k.email))).length;
  lauf.fehler = [...(lauf.fehler || []), ...fehler].slice(-50);
  lauf.fertig = nochOffen === 0;
  lauf.hattenSchon = empf.length - offen.length;
  lauf.lebenszeichen = Date.now();
  await nlLaufSpeichern(lauf);
  return { status: 200, gesendet, gesamtGesendet: lauf.gesendet, offen: nochOffen, fertig: lauf.fertig, stopp, fehler, hattenSchon: lauf.hattenSchon };
}
