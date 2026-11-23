// Öffentliche Seiten, Bilder, Sitemap und llms.txt
import { inhalt, retreats, bilder, stimmen, datei } from '../../lib/daten.mjs';
import * as S from '../../lib/seiten.mjs';
import { impressum, datenschutz } from '../../lib/recht.mjs';
import { seitenUrl, esc, zeitraum, SICHERHEIT } from '../../lib/util.mjs';

const KOPF = {
  ...SICHERHEIT,
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'public, max-age=0, must-revalidate',
  'netlify-cdn-cache-control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400',
  'netlify-cache-tag': 'seiten',
  'netlify-vary': 'query=_',
};

export default async (req) => {
  const u = new URL(req.url);
  let pfad = u.pathname.replace(/\/+$/, '') || '/';
  if (pfad === '/en') pfad = '/en/';

  // Bilder aus dem Speicher (Originale; Netlify Image CDN verkleinert)
  if (pfad.startsWith('/bild/')) {
    const fid = pfad.slice(6).replace(/[^\w-]/g, '');
    const bl = await bilder();
    if (!bl.find(b => b.id === fid)) return new Response('Nicht gefunden', { status: 404 });
    const { buf, meta } = await datei('bild', fid);
    if (!buf) return new Response('Nicht gefunden', { status: 404 });
    return new Response(buf, { headers: { ...SICHERHEIT, 'content-type': meta?.typ || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
  }

  const [i, rs, bl, st] = await Promise.all([inhalt(), retreats(), bilder(), stimmen()]);
  const url = seitenUrl(req);
  const l = pfad === '/en/' || pfad.startsWith('/en/') ? 'en' : 'de';
  const ctx = { l, i, rs, url, bilder: bl, stimmen: st, bildNach: bid => bid ? bl.find(b => b.id === bid) : null };
  const R = S.ROUTEN;
  const ok = html => new Response(html, { headers: KOPF });

  if (pfad === '/sitemap.xml') return sitemap(ctx);
  if (pfad === '/llms.txt') return llms(ctx);

  const treffer = Object.entries(R).find(([, v]) => v[l] === pfad || (v[l] === '/en/' && pfad === '/en/'));
  if (treffer) {
    const k = treffer[0];
    if (k === 'start') return ok(S.startseite(ctx));
    if (k === 'retreats') return ok(S.retreatsSeite(ctx));
    if (k === 'ueber') return ok(S.ueberSeite(ctx));
    if (k === 'kontakt' || k === 'kennen' || k === 'warte') return ok(S.formularSeite(ctx, k));
    if (k === 'galerie' && i.einstellungen.abschnitte.galerie) return ok(S.galerieSeite(ctx));
    if (k === 'impressum') return ok(S.rechtsSeite(ctx, 'impressum', impressum(i, l)));
    if (k === 'datenschutz') return ok(S.rechtsSeite(ctx, 'datenschutz', datenschutz(i, l)));
    if (k === 'nlBest' || k === 'nlAb') return new Response(S.nlSeite(ctx, k === 'nlBest' ? 'best' : 'ab', u.searchParams.get('t') || ''), { headers: { ...KOPF, 'netlify-cdn-cache-control': 'no-store' } });
  }
  const m = pfad.match(/^\/(?:en\/)?retreats\/([\w-]+)$/);
  if (m) {
    const r = rs.find(x => x.slug === m[1] && x.veroeffentlicht);
    if (r) return ok(S.retreatSeite(ctx, r));
  }
  return new Response(S.nichtGefunden(ctx), { status: 404, headers: { ...KOPF, 'netlify-cdn-cache-control': 'public, s-maxage=300' } });
};

function sitemap(ctx) {
  const { url, rs, i } = ctx; const R = S.ROUTEN;
  const keys = ['start', 'retreats', 'ueber', 'kennen', 'warte', 'kontakt', 'impressum', 'datenschutz', ...(i.einstellungen.abschnitte.galerie ? ['galerie'] : [])];
  const eintrag = (de, en) => ['de', 'en'].map(l => `<url><loc>${url}${l === 'de' ? de : en}</loc><xhtml:link rel="alternate" hreflang="de-AT" href="${url}${de}"/><xhtml:link rel="alternate" hreflang="en" href="${url}${en}"/></url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${keys.map(k => eintrag(R[k].de, R[k].en)).join('\n')}
${rs.filter(r => r.veroeffentlicht).map(r => eintrag(S.retreatPfad(r.slug, 'de'), S.retreatPfad(r.slug, 'en'))).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { ...KOPF, 'content-type': 'application/xml; charset=utf-8' } });
}

// llms.txt: kompakte, zitierfähige Zusammenfassung für KI-Assistenten (GEO)
function llms(ctx) {
  const { url, rs, i } = ctx; const T = i.texte.de; const E = i.einstellungen;
  const k = S.kommende(rs);
  const txt = `# Anam Cara – Retreats für Frauen

> ${T['seo.start.beschreibung']}

Anam Cara (gälisch für „Seelenfreundin") veranstaltet Retreats für Frauen. Gastgeberinnen: ${E.personen}. Sitz: ${(E.adressen || []).join('; ')} (Steiermark, Österreich). Reiseveranstalter und Buchung: ${E.veranstalter}.

## Zielgruppe
- ${T['fuerwen.1']}
- ${T['fuerwen.2']}
- ${T['fuerwen.3']}

## Termine
${k.map(r => `- [${r.titel.de}](${url}${S.retreatPfad(r.slug, 'de')}): ${zeitraum(r.von, r.bis, 'de')}, ${r.ort.de}. Status: ${r.status}. Preis: ${r.preis.de}. ${r.kurz.de}`).join('\n') || '- Neue Termine in Planung.'}

## Häufige Fragen
${[1, 2, 3, 4, 5, 6].map(n => `- ${T[`faq.${n}.f`]} ${T[`faq.${n}.a`]}`).join('\n')}

## Seiten
- [Retreats & Termine](${url}/retreats)
- [Über Sabine & Nina](${url}/ueber-uns)
- [Kostenloses Kennenlerngespräch](${url}/kennenlernen)
- [Vormerkung für neue Reisen](${url}/vormerken)
- [Kontakt](${url}/kontakt)
- [English version](${url}/en/)
`;
  return new Response(txt, { headers: { ...KOPF, 'content-type': 'text/plain; charset=utf-8' } });
}

export const config = {
  path: ['/', '/en', '/en/*', '/retreats', '/retreats/*', '/ueber-uns', '/kennenlernen', '/vormerken', '/kontakt', '/galerie',
    '/impressum', '/datenschutz', '/newsletter/*', '/bild/*', '/sitemap.xml', '/llms.txt'],
};
