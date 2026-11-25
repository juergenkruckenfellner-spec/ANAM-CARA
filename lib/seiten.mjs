// Serverseitiges Rendern der öffentlichen Seiten (DE/EN) aus den gespeicherten Inhalten.
import { esc, env, zeitraum, datumLang } from './util.mjs';
import { musikVon } from './inhalt-standard.mjs';

export const ROUTEN = {
  start: { de: '/', en: '/en/' },
  retreats: { de: '/retreats', en: '/en/retreats' },
  ueber: { de: '/ueber-uns', en: '/en/about' },
  kennen: { de: '/kennenlernen', en: '/en/meet-us' },
  warte: { de: '/vormerken', en: '/en/waiting-list' },
  kontakt: { de: '/kontakt', en: '/en/contact' },
  galerie: { de: '/galerie', en: '/en/gallery' },
  impressionen: { de: '/impressionen', en: '/en/impressions' },
  impressum: { de: '/impressum', en: '/en/imprint' },
  datenschutz: { de: '/datenschutz', en: '/en/privacy' },
  nlBest: { de: '/newsletter/bestaetigen', en: '/en/newsletter/confirm' },
  nlAb: { de: '/newsletter/abbestellen', en: '/en/newsletter/unsubscribe' },
};
export const retreatPfad = (slug, l) => (l === 'en' ? '/en/retreats/' : '/retreats/') + slug;

const UI = {
  de: {
    nav: [['retreats', 'Retreats'], ['impressionen', 'Impressionen'], ['ueber', 'Über uns'], ['kennen', 'Kennenlernen'], ['kontakt', 'Kontakt']],
    anmelden: 'Anmelden', menue: 'Menü', schliessen: 'Schließen', sprache: 'English', spracheKurz: 'EN',
    naechste: 'Nächste Reise', alleTermine: 'Alle Termine', details: 'Zur Reise', platz: 'Platz anfragen',
    status: { geplant: 'In Planung', buchbar: 'Plätze frei', ausgebucht: 'Ausgebucht', vorbei: 'Vergangen' },
    preis: 'Preis', ort: 'Ort', termin: 'Termin', plaetze: 'Plätze', ablauf: 'So sieht die Woche aus', leistungen: 'Enthalten',
    mehrUeber: 'Mehr über uns', gratisTitel: 'Zwei Wege, uns kennenzulernen', faqTitel: 'Häufige Fragen',
    name: 'Name', email: 'E-Mail', telefon: 'Telefon', nachricht: 'Nachricht', retreat: 'Welche Reise?', wann: 'Wann passt dir ein Gespräch?',
    wannHinweis: 'zum Beispiel: Dienstag oder Donnerstag nach 18 Uhr', optional: 'freiwillig', pflicht: 'Pflichtfeld',
    nlMit: 'Ich möchte auch den Newsletter erhalten (zwei- bis dreimal im Jahr, jederzeit abbestellbar).',
    senden: 'Nachricht senden', dsHinweis: 'Deine Angaben verwenden wir nur, um deine Anfrage zu beantworten. Mehr dazu in der',
    dsLink: 'Datenschutzerklärung', nlEintragen: 'Eintragen', nlDanke: 'Fast geschafft: Bitte bestätige deine Anmeldung über den Link in der E-Mail, die wir dir gerade geschickt haben.',
    keineReisen: 'Die nächsten Termine stehen bald fest.', vorbei: 'Vergangene Reisen', galerieLeer: '',
    modi: { anfrage: 'Allgemeine Anfrage', retreat: 'Anfrage zu einer Reise', kennen: 'Kennenlerngespräch', warte: 'Vormerkung' },
    zurueck: 'Zur Startseite', nichtGefunden: 'Diese Seite gibt es nicht (mehr).', nichtGefundenText: 'Vielleicht hilft dir einer dieser Wege weiter:',
    impressum: 'Impressum', datenschutz: 'Datenschutz', veranstalter: 'Reiseveranstalter', webseite: 'Website', nachOben: 'Nach oben',
    sprungmarke: 'Zum Inhalt springen', fehlerAllg: 'Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib uns direkt.',
  },
  en: {
    nav: [['retreats', 'Retreats'], ['impressionen', 'Impressions'], ['ueber', 'About us'], ['kennen', 'Meet us'], ['kontakt', 'Contact']],
    anmelden: 'Sign in', menue: 'Menu', schliessen: 'Close', sprache: 'Deutsch', spracheKurz: 'DE',
    naechste: 'Next journey', alleTermine: 'All dates', details: 'About the journey', platz: 'Ask for a place',
    status: { geplant: 'In planning', buchbar: 'Places available', ausgebucht: 'Fully booked', vorbei: 'Past' },
    preis: 'Price', ort: 'Place', termin: 'Dates', plaetze: 'Places', ablauf: 'What the week looks like', leistungen: 'Included',
    mehrUeber: 'More about us', gratisTitel: 'Two ways to get to know us', faqTitel: 'Frequently asked questions',
    name: 'Name', email: 'Email', telefon: 'Phone', nachricht: 'Message', retreat: 'Which journey?', wann: 'When would a call suit you?',
    wannHinweis: 'for example: Tuesday or Thursday after 6 pm', optional: 'optional', pflicht: 'required',
    nlMit: 'I would also like to receive the newsletter (two or three times a year, unsubscribe any time).',
    senden: 'Send message', dsHinweis: 'We only use your details to answer your enquiry. More in our',
    dsLink: 'privacy policy', nlEintragen: 'Subscribe', nlDanke: 'Almost done: please confirm your subscription via the link in the email we have just sent you.',
    keineReisen: 'The next dates will be announced soon.', vorbei: 'Past journeys', galerieLeer: '',
    modi: { anfrage: 'General enquiry', retreat: 'Enquiry about a journey', kennen: 'Introductory call', warte: 'Join the list' },
    zurueck: 'Back to the home page', nichtGefunden: 'This page does not exist (any more).', nichtGefundenText: 'Perhaps one of these will help:',
    impressum: 'Imprint', datenschutz: 'Privacy', veranstalter: 'Tour operator', webseite: 'Website', nachOben: 'Back to top',
    sprungmarke: 'Skip to content', fehlerAllg: 'Sorry, that did not work. Please try again or write to us directly.',
  },
};
export const ui = l => UI[l];

// ---------- kleine Helfer ----------
const absaetze = s => String(s || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
const akzent = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
const zeilen = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);

function spirale() {
  let d = ''; const cx = 20, cy = 20;
  for (let i = 0; i <= 220; i++) {
    const a = i / 220 * Math.PI * 5.2, r = 1.2 + a * 2.65;
    const x = (cx + r * Math.cos(a)).toFixed(2), y = (cy + r * Math.sin(a)).toFixed(2);
    d += (i ? 'L' : 'M') + x + ' ' + y;
  }
  return `<svg class="marke" viewBox="0 0 40 40" width="30" height="30" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}
const SPIRALE = spirale();
// Logo: fünf Aquarell-Monde (Original aus dem Logo freigestellt) + Schriftzug als echter Text
export const MONDE = '<img class="monde" src="/assets/logo/monde.webp" width="514" height="138" alt="" decoding="async">';
// Mitgelieferte Fotos, solange im Dashboard kein eigenes Bild für den Platz gewählt ist
export const STANDARD_BILDER = {
  'klippen-bucht': { statisch: '/assets/fotos/klippen-bucht', breiten: [800, 1400, 2000], b: 2000, h: 1335, alt: { de: 'Steile Klippen über einer stillen Bucht an der irischen Küste', en: 'Steep cliffs above a quiet bay on the Irish coast' }, credit: 'MoMent Photographie' },
  'temple-house-ruine': { statisch: '/assets/fotos/temple-house-ruine', breiten: [800, 1400, 1920], b: 1920, h: 1041, alt: { de: 'Alte Burgruine im Morgennebel bei Temple House in Sligo', en: 'Old castle ruin in the morning mist at Temple House, Sligo' }, credit: 'Temple House' },
  'ben-bulben-kueste': { statisch: '/assets/fotos/ben-bulben-kueste', breiten: [800, 1400, 2000], b: 2000, h: 1333, alt: { de: 'Wellen an der Küste von Sligo, dahinter der Tafelberg Ben Bulben', en: 'Waves on the Sligo coast with Ben Bulben behind' }, credit: 'Temple House' },
  'felsen-brandung': { statisch: '/assets/fotos/felsen-brandung', breiten: [800, 1400], b: 1419, h: 2126, alt: { de: 'Dunkle Felsen in der Brandung einer kleinen Bucht', en: 'Dark rocks in the surf of a small cove' }, credit: 'MoMent Photographie' },
  'temple-house': { statisch: '/assets/fotos/temple-house', breiten: [800, 1400, 2000], b: 2000, h: 1111, alt: { de: 'Temple House, ein Landhaus zwischen alten Bäumen und weiten Wiesen', en: 'Temple House, a country house among old trees and wide meadows' }, credit: 'Temple House' },
  'kueste-weiden': { statisch: '/assets/fotos/kueste-weiden', breiten: [800, 1400, 2000], b: 2000, h: 1331, alt: { de: 'Grüne Hügel mit Schafen und Steinmauern über dem Meer', en: 'Green hills with sheep and stone walls above the sea' }, credit: 'MoMent Photographie' },
  'kueste-grasnelken': { statisch: '/assets/fotos/kueste-grasnelken', breiten: [800, 1400, 2000], b: 2000, h: 1333, alt: { de: 'Blühende Grasnelken auf den Klippen über dem Atlantik', en: 'Sea pinks in bloom on the cliffs above the Atlantic' }, credit: 'Temple House' },
  nina: { statisch: '/assets/bilder/nina-walcher', breiten: [480, 800, 1200], b: 1200, h: 1600, alt: { de: 'Nina Walcher am Meer, den Blick in die Weite gerichtet', en: 'Nina Walcher by the sea, gazing into the distance' } },
};
// Mitgelieferte Fotos für Bildplätze und Impressionen, bis sie beim ersten Öffnen des Dashboards
// in die Bildverwaltung übernommen sind (danach steuert das Dashboard alles).
export const PLATZ_STANDARD = { nina: 'nina', ueber: 'klippen-bucht', hgReisen: 'temple-house-ruine', hgKennen: 'ben-bulben-kueste' };
export const IMPRESSIONEN_STANDARD = ['klippen-bucht', 'temple-house-ruine', 'ben-bulben-kueste', 'felsen-brandung', 'temple-house', 'kueste-weiden', 'kueste-grasnelken'];
export const platzBild = (ctx, k) => ctx.bildNach(ctx.i.einstellungen.bildplaetze[k]) || (ctx.i.einstellungen.fotosImportiert ? null : STANDARD_BILDER[PLATZ_STANDARD[k]] || null);
export function impressionenBilder(ctx) {
  const eigene = (ctx.bilder || []).filter(b => b.impression);
  if (eigene.length || ctx.i.einstellungen.fotosImportiert) return eigene;
  return IMPRESSIONEN_STANDARD.map(k => STANDARD_BILDER[k]);
}
// Hintergrundfoto mit mystischer Bewegung (langsamer Zoom, Parallaxe, ziehender Nebel, Lichtschimmer)
export function fotoHintergrund(b, l, { dunkel = .62 } = {}) {
  if (!b) return '';
  return `<div class="foto-hg${dunkel >= .7 ? ' foto-hg--dunkel' : ''}" aria-hidden="true">${bildTag(b, l, { breite: 1600, sizes: '100vw', cls: 'foto-hg__bild' }).replace(/ alt="[^"]*"/, ' alt=""')}<div class="foto-hg__nebel"></div><div class="foto-hg__nebel foto-hg__nebel--2"></div><div class="foto-hg__licht"></div></div>`;
}
const KELT_PFEIL = r => `<svg viewBox="0 0 64 32" width="56" height="28" aria-hidden="true"${r ? '' : ' style="transform:scaleX(-1)"'}><path d="M10 16c0-5 4-8 8-8s7 3 7 7-3 6-6 6-4-2-4-5 2-3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M25 15c4-6 10-6 14 0s10 6 14 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M25 17c4 6 10 6 14 0s10-6 14 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".55"/><path d="M50 9l8 7-8 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export function impressionenBlock(ctx, { seite = false } = {}) {
  const { l, i } = ctx; const de = l === 'de'; const T = k => esc(i.texte[l][k] || '');
  const bl = impressionenBilder(ctx); if (!bl.length) return '';
  const kopf = seite ? '' : `<div class="kopfzeile"><div><p class="vorzeile">${de ? 'Orte & Stimmungen' : 'Places & moods'}</p><h2 id="imp-t" class="h2">${T('impressionen.titel')}</h2></div><a class="pfeil" href="${ROUTEN.impressionen[l]}">${de ? 'Alle Impressionen' : 'All impressions'}</a></div>`;
  return `<section class="abschnitt impressionen${seite ? ' impressionen--seite' : ''}" aria-labelledby="${seite ? 'h1-imp' : 'imp-t'}">
  ${kopf}
  <div class="schau" data-schau aria-roledescription="${de ? 'Bildfolge' : 'carousel'}" aria-label="${T('impressionen.titel')}" tabindex="0">
    <div class="schau__buehne">
      ${bl.map((b, n) => `<figure class="schau__bild${n === 0 ? ' ist-aktiv' : ''}${b.h > b.b ? ' schau__bild--hoch' : ''}" aria-roledescription="${de ? 'Bild' : 'slide'}" aria-label="${n + 1} / ${bl.length}"${n === 0 ? '' : ' aria-hidden="true"'}>
        ${b.h > b.b ? bildTag(b, l, { breite: 1400, sizes: '100vw', cls: 'schau__fuell', lazy: n > 0 }).replace(/ alt="[^"]*"/, ' alt=""') : ''}${bildTag(b, l, { breite: 1600, sizes: '(min-width: 1200px) 1200px, 100vw', cls: 'schau__foto', lazy: n > 0 })}
        <figcaption><span>${esc(b.alt?.[l] || b.alt?.de || '')}</span>${b.credit ? `<small>${de ? 'Foto' : 'Photo'}: ${esc(b.credit)}</small>` : ''}</figcaption></figure>`).join('')}
      <div class="schau__nebel" aria-hidden="true"></div><div class="schau__fortschritt" aria-hidden="true"></div>
    </div>
    <div class="schau__leiste">
      <button class="schau__pfeil" type="button" data-zurueck aria-label="${de ? 'Vorheriges Bild' : 'Previous picture'}">${KELT_PFEIL(false)}</button>
      <p class="schau__zahl" aria-live="polite"><span data-nr>1</span> <i>/</i> ${bl.length}</p>
      <button class="schau__pfeil" type="button" data-weiter aria-label="${de ? 'Nächstes Bild' : 'Next picture'}">${KELT_PFEIL(true)}</button>
    </div>
  </div>
</section>`;
}
export function impressionenSeite(ctx) {
  const { l, i } = ctx; const de = l === 'de';
  const html = `<section class="seitenkopf"><p class="vorzeile">${de ? 'Orte & Stimmungen' : 'Places & moods'}</p><h1 class="h1" id="h1-imp">${esc(i.texte[l]['impressionen.titel'])}</h1><div class="seitenkopf__lead"><p>${esc(i.texte[l]['impressionen.text'])}</p></div></section>
${impressionenBlock(ctx, { seite: true })}
${gratisBlock(ctx)}`;
  const bl = impressionenBilder(ctx);
  const schema = [{ '@context': 'https://schema.org', '@type': 'ImageGallery', name: i.texte[l]['impressionen.titel'], url: ctx.url + ROUTEN.impressionen[l], image: bl.map(b => ({ '@type': 'ImageObject', contentUrl: ctx.url + (b.statisch ? b.statisch + '-' + b.breiten[b.breiten.length - 1] + '.webp' : '/bild/' + b.id), caption: b.alt?.[l] || b.alt?.de || '', ...(b.credit ? { creditText: b.credit } : {}) })) }];
  return layout(ctx, { titel: `${i.texte[l]['impressionen.titel']} – Anam Cara`, beschreibung: i.texte[l]['impressionen.text'].slice(0, 158), pfad: ROUTEN.impressionen[l], andererPfad: ROUTEN.impressionen[l === 'de' ? 'en' : 'de'], inhaltHtml: html, schema, seite: 'impressionen' });
}

const HUETER = (() => {
  // Triskele im Doppelring, klein: Zugang zur Verwaltung
  const arm = g => { let d = ''; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 3.6, r = 1 + a * 1.25; d += (i ? 'L' : 'M') + (20 + r * Math.cos(a + Math.PI / 2)).toFixed(2) + ' ' + (13.2 + r * Math.sin(a + Math.PI / 2)).toFixed(2); } return `<path d="${d} Q 21.5 18 20 20" transform="rotate(${g} 20 20)"/>`; };
  return `<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">${[0, 120, 240].map(arm).join('')}</g></svg>`;
})();
const zier = () => ZIER.replace('SPIRALE_PLATZ', SPIRALE);

// Gezeichnete Szenen statt Fotos, solange keine eigenen Bilder da sind (keine KI-Bilder, keine Stockfotos)
function zufall(seed) { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; }
function sterne(n, b, h, seed) {
  const r = zufall(seed); let o = '';
  for (let i = 0; i < n; i++) o += `<circle cx="${(r() * b).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(0.5 + r() * 1.1).toFixed(2)}" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`;
  return o;
}
function mondDefs(id) {
  return `<defs><radialGradient id="${id}h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#EFE4CF" stop-opacity=".22"/><stop offset=".45" stop-color="#E8A066" stop-opacity=".06"/><stop offset="1" stop-color="#E8A066" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}m" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="#F7EEDC"/><stop offset=".7" stop-color="#E9DCC2"/><stop offset="1" stop-color="#D8C6A6"/></radialGradient></defs>`;
}
function mond(id, cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r * 3.4}" fill="url(#${id}h)"/>
<g class="z-hof" fill="none"><circle cx="${cx}" cy="${cy}" r="${r * 1.6}"/><circle cx="${cx}" cy="${cy}" r="${r * 2.3}"/></g>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}m)"/>
<g class="z-krater"><circle cx="${cx - r * .3}" cy="${cy - r * .2}" r="${r * .16}"/><circle cx="${cx + r * .28}" cy="${cy + r * .22}" r="${r * .11}"/><circle cx="${cx + r * .05}" cy="${cy - r * .45}" r="${r * .07}"/><circle cx="${cx - r * .12}" cy="${cy + r * .4}" r="${r * .09}"/></g>`;
}
function meerLinien(b, y0, n, abst) {
  return Array.from({ length: n }, (_, i) => { const y = y0 + i * abst; const w = b / 8; return `<path d="M0 ${y} C ${w} ${y - 6}, ${w * 2.6} ${y + 7}, ${w * 4} ${y} S ${w * 6.8} ${y - 7}, ${b} ${y}" opacity="${(0.3 - i * 0.035).toFixed(2)}"/>`; }).join('');
}
function spiegelung(cx, y0, n) {
  return Array.from({ length: n }, (_, i) => { const halb = 46 - i * 4 + (i % 2) * 10; return `<line x1="${cx - halb}" x2="${cx + halb * .7}" y1="${y0 + i * 20}" y2="${y0 + i * 20}" opacity="${(0.7 - i * 0.07).toFixed(2)}"/>`; }).join('');
}
export function nachtLandschaft(cls = '') {
  return `<svg class="szene ${cls}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Zeichnung: Klippen an der irischen Küste in einer Mondnacht">
${mondDefs('q')}<rect class="z-nacht" width="1600" height="900"/>
<g class="z-sterne">${sterne(150, 1600, 600, 7)}</g>
<g class="z-mondgruppe">${mond('q', 1030, 240, 50)}</g>
<path class="z-fern" d="M560 690 C 640 672, 720 676, 800 660 S 960 640, 1040 652 L 1600 640 L1600 700 L560 700Z"/>
<path class="z-mitte" d="M1240 700 L1262 520 C 1300 500, 1340 470, 1390 462 C 1440 455, 1490 430, 1540 420 L 1600 410 L1600 700Z"/>
<path class="z-kante" d="M1240 700 L1262 520 C 1275 512, 1288 506, 1300 500 L 1290 700Z"/>
<path class="z-fels" d="M1170 700 L1188 600 L1214 588 L1226 700Z"/>
<line class="z-dunstlinie" x1="0" x2="1600" y1="662" y2="662"/><line class="z-dunstlinie" x1="300" x2="1600" y1="676" y2="676"/>
<g class="z-meer" fill="none">${meerLinien(1600, 712, 8, 26)}</g>
<g class="z-spiegel">${spiegelung(1030, 716, 8)}</g>
</svg>`;
}
function kuestenZeichnungAlt(cls = '') {
  return `<svg class="szene szene--hoch ${cls}" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Zeichnung: Mondnacht an der irischen Küste">
${mondDefs('p')}<rect class="z-nacht" width="600" height="800"/>
<g class="z-sterne">${sterne(60, 600, 480, 13)}</g>
${mond('p', 300, 250, 58)}
<path class="z-fern" d="M0 560 C 80 548, 160 552, 240 540 S 400 530, 600 536 L600 580 L0 580Z"/>
<path class="z-mitte" d="M420 580 L438 440 C 470 424, 510 404, 560 398 L600 394 L600 580Z"/>
<path class="z-kante" d="M420 580 L438 440 C 448 434, 458 430, 468 426 L 462 580Z"/>
<g class="z-meer" fill="none">${meerLinien(600, 600, 8, 26)}</g>
<g class="z-spiegel">${spiegelung(300, 604, 8)}</g>
</svg>`;
}
// Bewegte Landschaft hinter der Startseite: echtes Foto (Killary Harbour, Connemara), Nebel, Sterne, Mond.
// Die Scrollposition (--p, 0…1) verwandelt Abendlicht in Mondnacht (site.js setzt --p).
export const STANDARD_FOTO = {
  srcset: '/assets/bilder/killary-mweelrea-1000.webp 1000w, /assets/bilder/killary-mweelrea-1400.webp 1400w, /assets/bilder/killary-mweelrea-2400.webp 2400w',
  src: '/assets/bilder/killary-mweelrea-1400.webp', b: 2400, h: 1589,
  alt: { de: 'Abendstimmung über Killary Harbour und dem Mweelrea in Connemara, Irland', en: 'Evening light over Killary Harbour and Mweelrea in Connemara, Ireland' },
  credit: 'Foto: Tanya Hart, „Mweelrea, Killary Harbour, Ireland“, CC BY-SA 2.0, via Wikimedia Commons',
  creditUrl: 'https://commons.wikimedia.org/wiki/File:Mweelrea,_Killary_Harbour,_Ireland.jpg',
};
function kuestenZeichnung(cls = '', l = 'de') {
  return `<img class="${cls}" src="/assets/bilder/killary-mweelrea-1000.webp" srcset="/assets/bilder/killary-mweelrea-1000.webp 1000w, /assets/bilder/killary-mweelrea-1400.webp 1400w" sizes="(min-width: 900px) 30vw, 80vw" width="1000" height="662" alt="${esc(STANDARD_FOTO.alt[l])}" loading="lazy" decoding="async">`;
}
export function landschaft(ctx, eigenesBild) {
  const { l } = ctx;
  const foto = eigenesBild
    ? bildTag(eigenesBild, l, { breite: 2400, sizes: '100vw', lazy: false, cls: 'land__foto' })
    : `<img class="land__foto" src="${STANDARD_FOTO.src}" srcset="${STANDARD_FOTO.srcset}" sizes="100vw" width="${STANDARD_FOTO.b}" height="${STANDARD_FOTO.h}" alt="${esc(STANDARD_FOTO.alt[l])}" fetchpriority="high">`;
  const lichter = Array.from({ length: 9 }, (_, i) => `<span class="land__licht" data-i="${i}"></span>`).join('');
  return `<div class="landschaft" aria-hidden="false">
  <div class="land__bild">${foto}</div>
  <div class="land__himmel" aria-hidden="true"><span class="land__strahl land__strahl--1"></span><span class="land__strahl land__strahl--2"></span><span class="land__strahl land__strahl--3"></span><span class="land__schimmer"></span></div>
  <div class="land__abend"></div>
  <div class="land__nacht"></div>
  <svg class="land__sterne" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><g class="z-sterne">${sterne(170, 1600, 600, 5)}</g></svg>
  <svg class="land__mond" viewBox="0 0 400 400" aria-hidden="true">${mondDefs('lm')}${mond('lm', 200, 200, 72)}</svg>
  <div class="land__nebel land__nebel--1"></div>
  <div class="land__nebel land__nebel--2"></div>
  <div class="land__nebel land__nebel--3"></div>
  <div class="land__lichter" aria-hidden="true">${lichter}</div>
  <div class="land__vignette"></div>
</div>`;
}

// Die fünf Aquarell-Monde aus dem Logo, einzeln (1 = erste Sichel … 3 = Vollmond … 5 = letzte Sichel)
export const logoMond = n => `<span class="logomond"><img src="/assets/logo/mond-${n}.webp" width="128" height="128" alt="" loading="lazy" decoding="async"></span>`;
export function mondphase(p, gross = 30) {
  const r = gross / 2 - 1.5, c = gross / 2;
  if (p <= 0) return `<svg class="mond" viewBox="0 0 ${gross} ${gross}" width="${gross}" height="${gross}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" class="mond__rand"/></svg>`;
  if (p >= 1) return `<svg class="mond" viewBox="0 0 ${gross} ${gross}" width="${gross}" height="${gross}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" class="mond__licht"/></svg>`;
  const rx = Math.abs(r * (1 - 2 * p)).toFixed(2);
  return `<svg class="mond" viewBox="0 0 ${gross} ${gross}" width="${gross}" height="${gross}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" class="mond__rand"/><path class="mond__licht" d="M${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${rx} ${r} 0 0 ${p < 0.5 ? 0 : 1} ${c} ${c - r}Z"/></svg>`;
}
// Ogham, die alte irische Strichschrift: „ANAM CARA“ als Trennlinie
const OGHAM = { b: ['u', 1], l: ['u', 2], f: ['u', 3], s: ['u', 4], n: ['u', 5], h: ['o', 1], d: ['o', 2], t: ['o', 3], c: ['o', 4], q: ['o', 5], m: ['d', 1], g: ['d', 2], z: ['d', 4], r: ['d', 5], a: ['v', 1], o: ['v', 2], u: ['v', 3], e: ['v', 4], i: ['v', 5] };
export function ogham(text = 'anam cara', cls = '') {
  let x = 14, marks = '';
  for (const ch of text.toLowerCase()) {
    if (ch === ' ') { x += 16; continue; }
    const [art, n] = OGHAM[ch] || ['v', 1];
    for (let k = 0; k < n; k++) {
      const px = x + k * 6;
      if (art === 'u') marks += `<line x1="${px}" y1="20" x2="${px}" y2="34"/>`;
      if (art === 'o') marks += `<line x1="${px}" y1="6" x2="${px}" y2="20"/>`;
      if (art === 'd') marks += `<line x1="${px - 5}" y1="32" x2="${px + 5}" y2="8"/>`;
      if (art === 'v') marks += `<line x1="${px}" y1="15" x2="${px}" y2="25"/>`;
    }
    x += n * 6 + 10;
  }
  const w = x + 12;
  return `<svg class="ogham ${cls}" viewBox="0 0 ${w} 40" width="${w}" height="40" role="img" aria-label="Anam Cara in Ogham-Schrift"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 20 L8 14 M2 20 L8 26"/><line x1="2" y1="20" x2="${w - 2}" y2="20"/>${marks}<path d="M${w - 2} 20 L${w - 8} 14 M${w - 2} 20 L${w - 8} 26"/></g></svg>`;
}
// Triskele: drei Spiralen, keltisches Zeichen für Werden, Sein und Vergehen
export function triskele(cls = '') {
  const arm = (grad) => {
    let d = ''; for (let i = 0; i <= 110; i++) { const a = i / 110 * Math.PI * 4.2, r = 1.5 + a * 2.6; const x = 100 + r * Math.cos(a + Math.PI / 2), y = 62 + r * Math.sin(a + Math.PI / 2); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    d += ' Q 108 88 100 100';
    return `<path d="${d}" transform="rotate(${grad} 100 100)"/>`;
  };
  return `<svg class="triskele ${cls}" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">${[0, 120, 240].map(arm).join('')}<circle cx="100" cy="100" r="96" stroke-width="1"/><circle cx="100" cy="100" r="88" stroke-width=".6"/></g></svg>`;
}
const ZIER = `<div class="zier auftritt" aria-hidden="true"><span></span>SPIRALE_PLATZ<span></span></div>`;

function monogramm(name, cls = '') {
  const ini = String(name).split(' ').map(w => w[0]).join('').slice(0, 2);
  return `<svg class="zeichnung ${cls}" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Platz für ein Foto von ${esc(name)}">
<rect width="400" height="500" class="z-nacht"/><g class="z-sterne">${sterne(26, 400, 260, name.length * 31)}</g><circle class="z-mond" cx="300" cy="110" r="26"/>
<path d="M-20 420 C 80 360, 160 400, 240 350 S 380 300, 420 330 L420 520 L-20 520 Z" class="z-mitte"/>
<text x="200" y="250" text-anchor="middle" font-family="Cormorant, Georgia, serif" font-size="120" class="z-ini" font-style="italic">${esc(ini)}</text></svg>`;
}

function cdnAn() { return env('BILD_CDN') !== '0'; }
export function bildTag(b, l, { breite = 1200, cls = '', sizes = '100vw', lazy = true, ersatz = '' } = {}) {
  if (!b) return ersatz;
  if (b.statisch) {
    const alt = esc(b.alt?.[l] || b.alt?.de || '');
    const w = b.breiten.find(x => x >= breite) || b.breiten[b.breiten.length - 1];
    const h = Math.round(breite * b.h / b.b);
    return `<img class="${cls}" src="${b.statisch}-${w}.webp" srcset="${b.breiten.map(x => `${b.statisch}-${x}.webp ${x}w`).join(', ')}" sizes="${sizes}" width="${breite}" height="${h}" alt="${alt}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`;
  }
  const alt = esc(b.alt?.[l] || b.alt?.de || '');
  const q = w => cdnAn() ? `/.netlify/images?url=${encodeURIComponent('/bild/' + b.id)}&w=${w}&fm=webp&q=78` : `/bild/${b.id}`;
  const ws = [480, 800, 1200, 1800].filter(w => w <= Math.max(breite, 480) * 1.6);
  const h = b.b && b.h ? Math.round(breite * b.h / b.b) : Math.round(breite * 0.75);
  const set = cdnAn() ? ` srcset="${ws.map(w => q(w) + ' ' + w + 'w').join(', ')}" sizes="${sizes}"` : '';
  return `<img class="${cls}" src="${q(breite)}"${set} width="${breite}" height="${h}" alt="${alt}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`;
}

// ---------- Rahmen ----------
export function layout(ctx, { titel, beschreibung, pfad, andererPfad, inhaltHtml, schema = [], noindex = false, seite = '' }) {
  const { l, i, url } = ctx; const u = UI[l]; const E = i.einstellungen;
  const navLinks = u.nav.map(([k, t]) => `<a href="${ROUTEN[k][l]}"${ROUTEN[k][l] === pfad ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const alt = andererPfad || (l === 'de' ? '/en/' : '/');
  const dePfad = l === 'de' ? pfad : alt, enPfad = l === 'en' ? pfad : alt;
  const org = organisation(ctx);
  const ld = [org, ...schema].map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('');
  return `<!doctype html>
<html lang="${l === 'en' ? 'en' : 'de-AT'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titel)}</title>
<meta name="description" content="${esc(beschreibung)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}${pfad}">
<link rel="alternate" hreflang="de-AT" href="${url}${dePfad}">
<link rel="alternate" hreflang="en" href="${url}${enPfad}">
<link rel="alternate" hreflang="x-default" href="${url}${dePfad}">`}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(beschreibung)}"><meta property="og:url" content="${url}${pfad}"><meta property="og:image" content="${url}/assets/og-anam-cara.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta property="og:locale" content="${l === 'en' ? 'en_GB' : 'de_AT'}">
${E.gscToken ? `<meta name="google-site-verification" content="${esc(E.gscToken)}">` : ''}
<meta name="theme-color" content="#121C17">
<link rel="icon" href="/assets/logo/favicon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/logo/favicon-192.png" sizes="192x192" type="image/png"><link rel="apple-touch-icon" href="/assets/logo/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/cormorant-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css?v=16">
${ld}
</head>
<body class="seite-${seite}${seite === 'start' ? ' mit-landschaft' : ''}">
<a class="sprung" href="#inhalt">${u.sprungmarke}</a>
<header class="kopf">
  <div class="kopf__innen">
    <a class="logo" href="${ROUTEN.start[l]}" aria-label="Anam Cara – ${l === 'en' ? 'home' : 'Startseite'}">${MONDE}<span class="logo__wort">Anam Cara</span></a>
    <button class="menue-knopf" type="button" aria-expanded="false" aria-controls="hauptnav"><span>${u.menue}</span></button>
    <nav id="hauptnav" class="nav" aria-label="${l === 'en' ? 'Main' : 'Hauptnavigation'}">
      ${navLinks}
      <a class="nav__sprache" href="${alt}" hreflang="${l === 'de' ? 'en' : 'de'}" lang="${l === 'de' ? 'en' : 'de'}" aria-label="${u.sprache}">${u.spracheKurz}</a>
      <a class="nav__login" href="/anmelden${l === 'en' ? '?lang=en' : ''}"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="7" r="3.4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 17c1.2-3.2 3.6-4.6 6.5-4.6s5.3 1.4 6.5 4.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>${u.anmelden}</a>
    </nav>
  </div>
</header>
<main id="inhalt">
${inhaltHtml}
</main>
${fuss(ctx)}
<button class="nach-oben" type="button" aria-label="${u.nachOben}" hidden><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 12l5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
<script src="/assets/js/site.js?v=9" defer></script>
</body>
</html>`;
}

// Kleine Zeichen für die Fußzeile, alle aus einer Linienstärke (keine Fremd-Icons)
const ZEICHEN = {
  retreats: '<path d="M3 19l5.5-7 3.5 4.5 2.5-3 6.5 5.5"/><path d="M17.5 4.2a3.6 3.6 0 1 0 2.6 5.7 3 3 0 0 1-2.6-5.7z"/>',
  ueber: '<circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/>',
  kennen: '<path d="M12 3c2.8 3.2 4.6 5.6 4.6 8.6a4.6 4.6 0 0 1-9.2 0c0-1.7.8-3 1.9-4.2.2 1.6 1 2.6 2 2.9C11 8.6 11.3 5.6 12 3z"/><path d="M6.5 20.5h11"/>',
  kontakt: '<path d="M20 4C11 5 6 11 5 20"/><path d="M20 4c-.6 6.6-5.4 11-11.4 11.5"/><path d="M9.5 12.2l4-.4M12 9.3l3.6-.6"/>',
  warte: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/><circle cx="12" cy="12" r="3.2"/>',
  impressum: '<path d="M6 3.5h9l3 3V20.5H6z"/><path d="M9 9.5h6M9 13h6M9 16.5h4"/>',
  datenschutz: '<path d="M12 3l7 2.8v5.4c0 4.4-3 8-7 9.8-4-1.8-7-5.4-7-9.8V5.8z"/><circle cx="12" cy="11.5" r="2.3"/>',
  anmelden: '<circle cx="8" cy="12" r="3.6"/><path d="M11.6 12H21M18 12v3M15.5 12v2"/>',
  ort: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><path d="M12 7v5M10 9.5h4"/>',
  mail: '<path d="M3.5 6.5h17v11h-17z"/><path d="M3.5 6.5l8.5 7 8.5-7"/>',
};
const zeichen = k => `<svg class="zeichen" viewBox="0 0 24 24" aria-hidden="true">${ZEICHEN[k]}</svg>`;

function fuss(ctx) {
  const { l, i } = ctx; const u = UI[l]; const E = i.einstellungen; const T = k => esc(i.texte[l][k]);
  const soc = Object.entries(E.social || {}).filter(([, v]) => v).map(([k, v]) => `<a href="${esc(v)}" rel="noopener">${k[0].toUpperCase() + k.slice(1)}</a>`).join(' · ');
  const kurzWarte = l === 'en' ? 'Waiting list' : 'Vormerken';
  const wege = [...u.nav.map(([k, t]) => [k, ROUTEN[k][l], t]), ['warte', ROUTEN.warte[l], kurzWarte]];
  return `<footer class="fuss">
  <div class="fuss__band">
    <a class="fuss__marke" href="${ROUTEN.start?.[l] || (l === 'en' ? '/en/' : '/')}" aria-label="Anam Cara">${MONDE}<span class="fuss__name">Anam Cara</span><span class="fuss__unter">Soul Sisters Gatherings</span></a>
    <nav class="fuss__wege" aria-label="${l === 'en' ? 'Footer' : 'Fußzeile'}">
      ${wege.map(([k, h, t]) => `<a href="${h}" title="${esc(k === 'warte' ? i.texte[l]['warte.titel'] : t)}">${zeichen(k)}<span>${t}</span></a>`).join('')}
    </nav>
  </div>
  <div class="fuss__runen" aria-hidden="true">${ogham()}</div>
  <div class="fuss__zeile">
    <p class="fuss__satz">${T('fuss.satz').replace(/([A-ZÄÖÜ][\wäöüß]+ (?:Rueland|Walcher))/g, '<span class="nw">$1</span>')}</p>
    <address>
      ${(E.adressen || []).map(a => `<span>${zeichen('ort')}${esc(a)}</span>`).join('')}
      ${E.email ? `<a href="mailto:${esc(E.email)}">${zeichen('mail')}${esc(E.email)}</a>` : ''}
      ${E.telefon ? `<a href="tel:${esc(E.telefon.replace(/[^+\d]/g, ''))}">${esc(E.telefon)}</a>` : ''}
      ${soc ? `<span>${soc}</span>` : ''}
    </address>
  </div>
  <div class="fuss__ende"><a class="hueter" href="/anmelden?bereich=verwaltung${l === 'en' ? '&lang=en' : ''}" aria-label="${l === 'en' ? 'Management sign-in' : 'Anmeldung Verwaltung'}" title="${l === 'en' ? 'Management' : 'Verwaltung'}">${HUETER}</a>
    <p class="fuss__recht"><a href="${ROUTEN.impressum[l]}">${zeichen('impressum')}${u.impressum}</a><a href="${ROUTEN.datenschutz[l]}">${zeichen('datenschutz')}${u.datenschutz}</a><a href="/anmelden${l === 'en' ? '?lang=en' : ''}">${zeichen('anmelden')}${u.anmelden}</a></p>
    <p class="fuss__klein">${u.veranstalter}: ${esc(E.veranstalter)} · © ${new Date().getFullYear()} Anam Cara · ${u.webseite}: <a href="https://webseitefix.at" rel="noopener">webseitefix.at</a>${ctx.fotoCredit ? ` · <a class="fuss__credit" href="${STANDARD_FOTO.creditUrl}" rel="noopener">${esc(STANDARD_FOTO.credit)}</a>` : ''}</p></div>
</footer>`;
}

function organisation({ i, url }) {
  const E = i.einstellungen;
  return {
    '@context': 'https://schema.org', '@type': 'Organization', '@id': url + '/#organisation',
    name: 'Anam Cara', url: url + '/', logo: url + '/assets/logo/logo-anam-cara.png',
    description: i.texte.de['seo.start.beschreibung'],
    ...(E.email ? { email: E.email } : {}), ...(E.telefon ? { telephone: E.telefon } : {}),
    founder: E.personen.split(',').map(n => ({ '@type': 'Person', name: n.trim() })),
    address: (E.adressen || []).map(a => {
      const m = a.match(/^(.*),\s*(\d{4})\s+(.*)$/);
      return m ? { '@type': 'PostalAddress', streetAddress: m[1], postalCode: m[2], addressLocality: m[3], addressCountry: 'AT' } : { '@type': 'PostalAddress', streetAddress: a, addressCountry: 'AT' };
    }),
    sameAs: Object.values(E.social || {}).filter(Boolean),
    knowsAbout: ['Retreats für Frauen', 'Frauenreisen', 'Auszeit für Frauen', 'Irland'],
    areaServed: ['AT', 'DE', 'CH'],
  };
}

// ---------- Bausteine ----------
const sortiert = rs => rs.filter(r => r.veroeffentlicht).sort((a, b) => (a.von || '').localeCompare(b.von || ''));
export function kommende(rs) { const heute = new Date().toISOString().slice(0, 10); return sortiert(rs).filter(r => (r.bis || r.von || '9999') >= heute && r.status !== 'vorbei'); }

function retreatKarte(ctx, r, gross = false) {
  const { l } = ctx; const u = UI[l];
  const b = ctx.bildNach(r.bild);
  return `<article class="reise${gross ? ' reise--gross' : ''} auftritt">
  <a class="reise__bild bogen" href="${retreatPfad(r.slug, l)}" tabindex="-1" aria-hidden="true">${bildTag(b, l, { breite: gross ? 1200 : 800, sizes: gross ? '(min-width: 900px) 55vw, 100vw' : '(min-width: 900px) 33vw, 100vw', ersatz: kuestenZeichnung('', l) })}</a>
  <div class="reise__text">
    <p class="reise__zeit">${esc(zeitraum(r.von, r.bis, l))} <span class="punkt" aria-hidden="true">·</span> ${esc(r.ort?.[l] || '')}</p>
    <h3><a href="${retreatPfad(r.slug, l)}">${esc(r.titel?.[l] || '')}</a></h3>
    <p>${esc(r.kurz?.[l] || '')}</p>
    <p class="reise__fuss"><span class="marker marker--${esc(r.status)}">${u.status[r.status] || ''}</span><a class="pfeil" href="${retreatPfad(r.slug, l)}">${u.details}</a></p>
  </div>
</article>`;
}

function anfrageFormular(ctx, modus = 'anfrage', retreatSlug = '') {
  const { l, i, rs } = ctx; const u = UI[l];
  const opts = kommende(rs).map(r => `<option value="${esc(r.slug)}"${r.slug === retreatSlug ? ' selected' : ''}>${esc(r.titel[l])} · ${esc(zeitraum(r.von, r.bis, l))}</option>`).join('');
  return `<form class="formular" data-formular="anfrage" data-modus="${modus}" data-lang="${l}" novalidate>
  <fieldset class="modi" ${modus !== 'anfrage' && modus !== 'retreat' ? 'hidden' : ''}>
    <legend class="sr">${l === 'en' ? 'Type of enquiry' : 'Art der Anfrage'}</legend>
    ${['anfrage', 'retreat', 'kennen', 'warte'].map(m => `<label class="modus"><input type="radio" name="modusWahl" value="${m}"${m === modus ? ' checked' : ''}><span>${u.modi[m]}</span></label>`).join('')}
  </fieldset>
  <input type="hidden" name="anfrageart" value="${modus}">
  <div class="feld"><label for="f-name">${u.name}</label><input id="f-name" name="name" autocomplete="name" required maxlength="120"></div>
  <div class="feld"><label for="f-email">${u.email}</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="200"></div>
  <div class="feld" data-nur="kennen retreat warte anfrage"><label for="f-tel">${u.telefon} <span class="feld__hinweis" data-optional>${u.optional}</span></label><input id="f-tel" name="telefon" type="tel" autocomplete="tel" maxlength="40"></div>
  <div class="feld" data-nur="retreat"><label for="f-retreat">${u.retreat}</label><select id="f-retreat" name="retreat">${opts}</select></div>
  <div class="feld" data-nur="kennen"><label for="f-wann">${u.wann} <span class="feld__hinweis">${u.optional}</span></label><input id="f-wann" name="wann" maxlength="200" placeholder="${u.wannHinweis}"></div>
  <div class="feld"><label for="f-nachricht">${u.nachricht} <span class="feld__hinweis" data-optional>${u.optional}</span></label><textarea id="f-nachricht" name="nachricht" rows="5" maxlength="4000"></textarea></div>
  <div class="feld feld--falle" aria-hidden="true"><label for="f-web">Website</label><input id="f-web" name="webseite" tabindex="-1" autocomplete="off"></div>
  <label class="haken"><input type="checkbox" name="newsletter" value="ja"><span>${u.nlMit}</span></label>
  <p class="klein">${u.dsHinweis} <a href="${ROUTEN.datenschutz[l]}">${u.dsLink}</a>.</p>
  <p class="formular__fehler" role="alert" hidden></p>
  <button class="knopf" type="submit" data-text-anfrage="${u.senden}" data-text-retreat="${esc(UI[l].platz)}" data-text-kennen="${esc(i.texte[l]['kennen.knopf'])}" data-text-warte="${esc(i.texte[l]['warte.knopf'])}">${u.senden}</button>
  <div class="formular__danke" role="status" tabindex="-1" hidden><p class="danke__titel">${l === 'en' ? 'Thank you' : 'Danke'}</p><p>${esc(i.texte[l]['kontakt.danke'])}</p></div>
</form>`;
}

function newsletterBlock(ctx, quelle = 'startseite') {
  const { l, i } = ctx; const u = UI[l]; const T = k => esc(i.texte[l][k]);
  return `<section class="abschnitt nl auftritt" aria-labelledby="nl-t">
  <div class="nl__innen">
    <div><span class="siegel" aria-hidden="true">${SPIRALE}</span><h2 id="nl-t" class="h2">${T('nl.titel')}</h2><p>${T('nl.text')}</p></div>
    <form class="nl__form" data-formular="newsletter" data-lang="${l}" data-quelle="${quelle}" novalidate>
      <div class="nl__zeile">
        <label class="sr" for="nl-mail-${quelle}">${u.email}</label>
        <input id="nl-mail-${quelle}" name="email" type="email" autocomplete="email" required placeholder="${u.email}">
        <button class="knopf knopf--hell" type="submit">${u.nlEintragen}</button>
      </div>
      <label class="haken"><input type="checkbox" name="einwilligung" value="ja" required><span>${T('nl.einwilligung')} <a href="${ROUTEN.datenschutz[l]}">${u.dsLink}</a></span></label>
      <div class="feld feld--falle" aria-hidden="true"><input name="webseite" tabindex="-1" autocomplete="off"></div>
      <p class="formular__fehler" role="alert" hidden></p>
      <p class="formular__danke" role="status" tabindex="-1" hidden>${u.nlDanke}</p>
    </form>
  </div>
</section>`;
}

function faqBlock(ctx) {
  const { l, i } = ctx; const T = k => i.texte[l][k];
  const n = [1, 2, 3, 4, 5, 6].filter(k => T(`faq.${k}.f`) && T(`faq.${k}.a`));
  const html = `<section class="abschnitt faq" aria-labelledby="faq-t"><div class="schmal">
  <p class="vorzeile">${l === 'en' ? 'Questions' : 'Fragen'}</p><h2 id="faq-t" class="h2">${UI[l].faqTitel}</h2>
  ${n.map(k => `<details class="auftritt"><summary>${esc(T(`faq.${k}.f`))}</summary><div>${absaetze(T(`faq.${k}.a`))}</div></details>`).join('')}
</div></section>`;
  const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: n.map(k => ({ '@type': 'Question', name: T(`faq.${k}.f`), acceptedAnswer: { '@type': 'Answer', text: T(`faq.${k}.a`) } })) };
  return { html, schema };
}

function steinkreis() {
  // Neun stehende Steine im Kreis, perspektivisch, um eine Feuerschale
  const n = 9, cx = 300, cy = 250, rx = 220, ry = 62; let hinten = '', vorne = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.35, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    const t = 0.62 + 0.38 * ((Math.sin(a) + 1) / 2);           // vorne größer
    const h = (64 + (i % 3) * 14) * t, b = (22 + (i % 2) * 6) * t;
    const st = `<path class="stein" d="M${(x - b / 2).toFixed(1)} ${y.toFixed(1)} L${(x - b / 2 + 2).toFixed(1)} ${(y - h * .82).toFixed(1)} Q${x.toFixed(1)} ${(y - h).toFixed(1)} ${(x + b / 2 - 2).toFixed(1)} ${(y - h * .86).toFixed(1)} L${(x + b / 2).toFixed(1)} ${y.toFixed(1)} Z" opacity="${(0.55 + t * .45).toFixed(2)}"/>`;
    if (Math.sin(a) < 0) hinten += st; else vorne += st;
  }
  return { hinten, vorne };
}

const M_Q = ctx => { const M = ctx.musik || musikVon(ctx.i.einstellungen); return M.quelle === 'datei' && !M.datei ? 'harfe' : M.quelle; };
function zeremonieBlock(ctx) {
  const { l } = ctx; const de = l === 'de';
  const k = steinkreis();
  return `<section class="abschnitt zeremonie" aria-labelledby="zer-t">
  <div class="zeremonie__text">
    <p class="vorzeile vorzeile--hell">${de ? 'Ein kleines Ritual' : 'A small ritual'}</p>
    <h2 id="zer-t" class="h2">${de ? 'Ankommen. Aufatmen. <em>Verbunden sein.</em>' : 'Arrive. Breathe. <em>Be connected.</em>'}</h2>
    <p>${de ? 'Entzünde das Feuer im Steinkreis und folge dem Licht: einatmen, wenn es wächst, ausatmen, wenn es sich zurückzieht.' : 'Light the fire in the stone circle and follow the glow: breathe in as it grows, breathe out as it draws back.'}</p>
  </div>
  ${(() => { const M = musikVon(ctx.i.einstellungen); ctx.musik = M; return ''; })()}<div class="ritual" data-ritual data-lang="${l}" data-musik="${M_Q(ctx)}" data-musik-url="${ctx.musik.quelle === 'datei' && ctx.musik.datei ? '/musik/' + esc(ctx.musik.datei) : ''}" data-laut="${ctx.musik.lautstaerke}">
    <div class="ritual__atem" aria-hidden="true"><span></span><span></span><span></span></div>
    <svg class="ritual__kreis" viewBox="50 110 500 230" role="img" aria-label="${de ? 'Steinkreis mit Feuerschale' : 'Stone circle with a fire bowl'}">
      <defs><linearGradient id="schaleVerlauf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3A2E"/><stop offset=".5" stop-color="#231B15"/><stop offset="1" stop-color="#0E0B09"/></linearGradient>
      <linearGradient id="steinVerlauf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8C9486"/><stop offset=".45" stop-color="#5E6A60"/><stop offset="1" stop-color="#2F3A33"/></linearGradient>
      <filter id="steinKorn" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in" result="k"/><feBlend in="SourceGraphic" in2="k" mode="multiply"/></filter>
      <radialGradient id="bodenVerlauf" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0A120E" stop-opacity=".85"/><stop offset=".7" stop-color="#0A120E" stop-opacity=".55"/><stop offset="1" stop-color="#0A120E" stop-opacity="0"/></radialGradient>
      <radialGradient id="glutschein" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F2B072" stop-opacity=".75"/><stop offset=".5" stop-color="#D9823F" stop-opacity=".25"/><stop offset="1" stop-color="#D9823F" stop-opacity="0"/></radialGradient></defs>
      <ellipse class="ritual__boden" cx="300" cy="252" rx="270" ry="80" fill="url(#bodenVerlauf)"/>
      <ellipse class="ritual__schein" cx="300" cy="246" rx="230" ry="70" fill="url(#glutschein)"/>
      <g class="ritual__steine">${k.hinten}</g>
      <g class="ritual__feuer" transform="translate(300 240) scale(1.55) translate(-300 -240)">
        <path class="flamme flamme--aussen" d="M300 168 C 278 196, 276 220, 300 244 C 324 220, 322 196, 300 168Z"/>
        <path class="flamme flamme--mitte" d="M300 186 C 286 206, 286 222, 300 240 C 314 222, 314 206, 300 186Z"/>
        <path class="flamme flamme--kern" d="M300 206 C 293 218, 293 228, 300 238 C 307 228, 307 218, 300 206Z"/>
      </g>
      <path class="ritual__schale" d="M256 236 C 262 266, 338 266, 344 236 Z" fill="url(#schaleVerlauf)"/><path class="ritual__fuss" d="M286 258 L282 270 L318 270 L314 258Z"/>
      <ellipse class="ritual__rand" cx="300" cy="236" rx="44" ry="8"/><ellipse class="ritual__glut" cx="300" cy="236" rx="36" ry="5"/>
      <g class="ritual__steine">${k.vorne}</g>
    </svg>
    <canvas class="ritual__funken" aria-hidden="true"></canvas>
    <p class="ritual__anzeige" aria-live="polite">${de ? 'Bereit, wenn du es bist.' : 'Ready when you are.'}</p>
    <p class="ritual__aktionen"><button class="knopf knopf--glut" type="button" data-ritual-start>${de ? 'Feuer entzünden' : 'Light the fire'}</button>
      ${M_Q(ctx) === 'aus' ? '' : `<button class="ritual__klang" type="button" data-klang aria-pressed="false"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path class="welle" d="M16 8.5c1.4 1 1.4 6 0 7M18.5 6c2.8 2.2 2.8 9.8 0 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>${de ? 'Musik dazu' : 'Add music'}</span></button>`}</p>
    ${M_Q(ctx) === 'aus' ? '' : `<p class="ritual__hinweis klein">${de ? 'Die Übung beginnt in Stille. Wenn du magst, nimm leise Musik dazu und schalte sie jederzeit wieder aus.' : 'The exercise begins in silence. If you like, add soft music and switch it off at any time.'}</p>`}
    <p class="ritual__ende" hidden>${de ? 'Schön, dass du dir diesen Moment genommen hast.' : 'Thank you for taking this moment.'} <a class="textlink textlink--hell" href="${ROUTEN.kennen[l]}">${esc(ctx.i.texte[l]['kennen.titel'])}</a></p>
  </div>
</section>`;
}

function gratisBlock(ctx) {
  const { l, i } = ctx; const T = k => esc(i.texte[l][k]);
  return `<section class="abschnitt gratis" aria-labelledby="gratis-t">
  <h2 id="gratis-t" class="sr">${UI[l].gratisTitel}</h2>
  <div class="gratis__raster">
    <a class="gratis__gross auftritt" href="${ROUTEN.kennen[l]}">${fotoHintergrund(platzBild(ctx, 'hgKennen'), l, { dunkel: .72 })}
      <span class="vorzeile">${l === 'en' ? 'Free · 15 minutes' : 'Kostenlos · 15 Minuten'}</span>
      <span class="h2">${T('kennen.titel')}</span>
      <span class="gratis__text">${T('kennen.text')}</span>
      <span class="pfeil pfeil--glut">${T('kennen.knopf')}</span>
    </a>
    <a class="gratis__klein auftritt" href="${ROUTEN.warte[l]}">
      <span class="vorzeile">${l === 'en' ? 'Hear first' : 'Als Erste erfahren'}</span>
      <span class="h3">${T('warte.titel')}</span>
      <span class="gratis__text">${T('warte.text')}</span>
      <span class="pfeil pfeil--hell">${T('warte.knopf')}</span>
    </a>
  </div>
</section>`;
}

// ---------- Seiten ----------
export function startseite(ctx) {
  const { l, i, rs } = ctx; const T = k => esc(i.texte[l][k]); const u = UI[l]; const E = i.einstellungen;
  const naechste = kommende(rs);
  const erste = naechste[0];
  const bp = E.bildplaetze;
  const faq = faqBlock(ctx);
  ctx.fotoCredit = !bp.hero;
  const stimmen = (ctx.stimmen || []).filter(s => s.freigegeben && (s.lang === l || !s.lang || true)).slice(0, 4);
  const gal = (ctx.bilder || []).filter(b => b.galerie).slice(0, 8);
  const html = `
${landschaft(ctx, ctx.bildNach(bp.hero))}
<section class="held held--land">
  <div class="held__nebel held__nebel--a" aria-hidden="true"></div>
  <div class="held__nebel held__nebel--b" aria-hidden="true"></div>
  <div class="held__inhalt">
    <p class="vorzeile vorzeile--hell"><span>${T('hero.vorzeile').replace(/([A-ZÄÖÜ][\wäöüß]+ (?:Rueland|Walcher))/g, '<span class="nw">$1</span>')}</span></p>
    <h1 class="h1 h1--held">${akzent(i.texte[l]['hero.titel'])}</h1>
    <p class="held__lead">${T('hero.text')}</p>
    <p class="held__aktionen">
      <a class="knopf knopf--glut" href="${erste ? retreatPfad(erste.slug, l) : ROUTEN.retreats[l]}">${T('hero.knopf')}</a>
      <a class="textlink textlink--hell" href="${ROUTEN.kennen[l]}">${T('hero.link')}</a>
    </p>
  </div>
  ${erste ? `<a class="kartusche" href="${retreatPfad(erste.slug, l)}"><span class="vorzeile">${u.naechste}</span><span class="kartusche__ort">${esc(erste.ort[l])}</span><span class="kartusche__zeit">${esc(zeitraum(erste.von, erste.bis, l))}</span></a>` : ''}
  <span class="held__pfeil" aria-hidden="true"></span>
</section>

<section class="abschnitt name" aria-labelledby="name-t">
  <div class="name__innen">
    <h2 id="name-t" class="vorzeile">${T('name.titel')}</h2>
    <p class="name__wort auftritt" lang="ga">Anam Cara</p>
    <p class="name__laut">[ˈanəm ˈkaɾə] · ${l === 'en' ? 'Gaelic: soul friend' : 'gälisch: Seelenfreundin'}</p>
    ${zier()}
    <p class="name__zitat auftritt">${T('name.text')}</p>
  </div>
</section>

<section class="abschnitt fuerwen werte" aria-labelledby="werte-t">
  <div class="fuerwen__titel"><p class="vorzeile">${l === 'en' ? 'What we stand for' : 'Wofür wir stehen'}</p><h2 id="werte-t" class="h2">${T('werte.titel')}</h2>${i.texte[l]['werte.text'] ? `<p class="werte__text">${T('werte.text')}</p>` : ''}</div>
  <ol class="fuerwen__liste">
    ${[1, 2, 3].filter(n => i.texte[l]['werte.' + n]).map(n => `<li class="auftritt"><span class="ziffer" aria-hidden="true">${['I', 'II', 'III'][n - 1]}</span><p><strong class="werte__wort">${T('werte.' + n + '.t')}</strong>${T('werte.' + n)}</p></li>`).join('')}
  </ol>
</section>

<section class="abschnitt reisen reisen--foto" aria-labelledby="reisen-t">${fotoHintergrund(platzBild(ctx, 'hgReisen'), l, { dunkel: .7 })}
  <div class="kopfzeile"><div><p class="vorzeile">${l === 'en' ? 'Journeys' : 'Reisen'}</p><h2 id="reisen-t" class="h2">${esc(i.texte[l]['retreats.titel'])}</h2></div><a class="pfeil" href="${ROUTEN.retreats[l]}">${u.alleTermine}</a></div>
  ${naechste.length ? naechste.slice(0, 3).map((r, n) => retreatKarte(ctx, r, n === 0)).join('') : `<p>${u.keineReisen}</p>`}
</section>

<section class="abschnitt fuerwen" aria-labelledby="fw-t">
  <div class="fuerwen__titel"><p class="vorzeile">${l === 'en' ? 'For whom' : 'Für wen'}</p><h2 id="fw-t" class="h2">${T('fuerwen.titel')}</h2>${ogham()}</div>${triskele('triskele--wasser')}
  <ol class="fuerwen__liste">
    ${[1, 2, 3].map(n => `<li class="auftritt"><span class="ziffer" aria-hidden="true">${['I', 'II', 'III'][n - 1]}</span><p>${T('fuerwen.' + n)}</p></li>`).join('')}
  </ol>
</section>

<section class="abschnitt weg" aria-labelledby="weg-t">
  <p class="vorzeile">${l === 'en' ? 'From new moon to full moon' : 'Vom Neumond zum Vollmond'}</p>
  <h2 id="weg-t" class="h2">${T('ablauf.titel')}</h2>
  <ol class="weg__liste">
    ${[1, 2, 3, 4, 5].filter(n => i.texte[l]['ablauf.' + n]).map((n, k, a) => `<li class="auftritt">${logoMond(a.length > 1 ? Math.round(k / (a.length - 1) * 4) + 1 : 3)}<p>${T('ablauf.' + n)}</p></li>`).join('')}
  </ol>
</section>

<section class="abschnitt wir" aria-labelledby="wir-t">${triskele('triskele--wasser triskele--rechts')}
  <div class="wir__bilder">
    <figure class="wir__eins bogen auftritt">${bildTag(ctx.bildNach(bp.sabine), l, { breite: 600, sizes: '(min-width: 900px) 24vw, 50vw', ersatz: monogramm(i.texte[l]['ueber.sabine.name']) })}<figcaption>${T('ueber.sabine.name')}</figcaption></figure>
    <figure class="wir__zwei bogen auftritt">${bildTag(platzBild(ctx, 'nina'), l, { breite: 600, sizes: '(min-width: 900px) 24vw, 50vw', ersatz: monogramm(i.texte[l]['ueber.nina.name']) })}<figcaption>${T('ueber.nina.name')}</figcaption></figure>
  </div>
  <div class="wir__text">
    <p class="vorzeile">${l === 'en' ? 'Your hosts' : 'Eure Gastgeberinnen'}</p><h2 id="wir-t" class="h2">${T('ueber.titel')}</h2>${ogham()}
    ${absaetze(i.texte[l]['ueber.text'])}
    <a class="pfeil" href="${ROUTEN.ueber[l]}">${u.mehrUeber}</a>
  </div>
</section>

${impressionenBlock(ctx)}

${E.abschnitte.stimmen && stimmen.length ? `<section class="abschnitt stimmen" aria-labelledby="st-t">
  <h2 id="st-t" class="h2">${T('stimmen.titel')}</h2>
  <div class="stimmen__liste">${stimmen.map(s => `<figure class="stimme auftritt"><blockquote>${absaetze(s.text)}</blockquote><figcaption>${esc(s.name)}${s.retreat ? ' · ' + esc(s.retreat) : ''}</figcaption></figure>`).join('')}</div>
</section>` : ''}

${E.abschnitte.galerie && gal.length ? `<section class="abschnitt galerie-start" aria-labelledby="gal-t">
  <div class="kopfzeile"><h2 id="gal-t" class="h2">${T('galerie.titel')}</h2><a class="pfeil" href="${ROUTEN.galerie[l]}">${l === 'en' ? 'All pictures' : 'Alle Bilder'}</a></div>
  <div class="galerie">${gal.map(b => `<a href="/bild/${b.id}" class="galerie__bild auftritt" data-gross>${bildTag(b, l, { breite: 600, sizes: '(min-width: 900px) 25vw, 50vw' })}</a>`).join('')}</div>
</section>` : ''}

${gratisBlock(ctx)}
${zeremonieBlock(ctx)}
${newsletterBlock(ctx, 'startseite')}
${faq.html}`;
  return layout(ctx, { titel: i.texte[l]['seo.start.titel'], beschreibung: i.texte[l]['seo.start.beschreibung'], pfad: ROUTEN.start[l], andererPfad: ROUTEN.start[l === 'de' ? 'en' : 'de'], inhaltHtml: html, schema: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Anam Cara', url: ctx.url + '/', inLanguage: ['de-AT', 'en'] }, faq.schema], seite: 'start' });
}

export function retreatsSeite(ctx) {
  const { l, i, rs } = ctx; const u = UI[l];
  const k = kommende(rs); const heute = new Date().toISOString().slice(0, 10);
  const alt = sortiert(rs).filter(r => !k.includes(r)).filter(r => (r.bis || r.von) < heute || r.status === 'vorbei').reverse();
  const html = `<section class="seitenkopf"><h1 class="h1">${esc(i.texte[l]['retreats.titel'])}</h1><div class="seitenkopf__lead">${absaetze(i.texte[l]['retreats.text'])}</div></section>
<section class="abschnitt reisen">${k.length ? k.map((r, n) => retreatKarte(ctx, r, n === 0)).join('') : `<p>${u.keineReisen}</p>`}
<p class="hinweis">${esc(i.texte[l]['retreats.veranstalter'])}</p></section>
${alt.length ? `<section class="abschnitt"><h2 class="h3">${u.vorbei}</h2><ul class="vergangen">${alt.map(r => `<li><a href="${retreatPfad(r.slug, l)}">${esc(r.titel[l])}</a> · ${esc(zeitraum(r.von, r.bis, l))}</li>`).join('')}</ul></section>` : ''}
${gratisBlock(ctx)}`;
  const schema = k.map(r => eventSchema(ctx, r));
  return layout(ctx, { titel: i.texte[l]['seo.retreats.titel'], beschreibung: i.texte[l]['seo.retreats.beschreibung'], pfad: ROUTEN.retreats[l], andererPfad: ROUTEN.retreats[l === 'de' ? 'en' : 'de'], inhaltHtml: html, schema, seite: 'retreats' });
}

function eventSchema(ctx, r) {
  const { url } = ctx; const b = ctx.bildNach(r.bild);
  return {
    '@context': 'https://schema.org', '@type': 'Event', name: `Anam Cara – ${r.titel.de}`,
    startDate: r.von, endDate: r.bis, eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled', description: r.kurz.de, audience: { '@type': 'PeopleAudience', audienceType: 'Frauen' },
    offers: { '@type': 'Offer', url: url + ROUTEN.kontakt.de + '#retreat-' + r.slug, availability: r.status === 'ausgebucht' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', priceCurrency: 'EUR', description: r.preis.de }, url: url + retreatPfad(r.slug, 'de'),
    location: { '@type': 'Place', name: r.ort.de, address: { '@type': 'PostalAddress', addressCountry: /irland/i.test(r.ort.de) ? 'IE' : undefined, addressLocality: r.ort.de } },
    organizer: { '@id': url + '/#organisation' },
    ...(b ? { image: [url + '/bild/' + b.id] } : {}),
    inLanguage: 'de',
  };
}

export function retreatSeite(ctx, r) {
  const { l, i } = ctx; const u = UI[l];
  const b = ctx.bildNach(r.bild);
  const ab = zeilen(r.ablauf?.[l]), le = zeilen(r.leistungen?.[l]);
  const html = `<article class="detail">
<header class="detail__kopf">
  <div class="detail__text">
    <p class="vorzeile"><a href="${ROUTEN.retreats[l]}">${esc(i.texte[l]['retreats.titel'])}</a></p>
    <h1 class="h1">${esc(r.titel[l])}</h1>
    <p class="held__lead">${esc(r.kurz[l])}</p>
    <dl class="eckdaten">
      <div><dt>${u.termin}</dt><dd>${esc(zeitraum(r.von, r.bis, l))}</dd></div>
      <div><dt>${u.ort}</dt><dd>${esc(r.ort[l])}</dd></div>
      <div><dt>${u.preis}</dt><dd>${esc(r.preis?.[l] || '')}</dd></div>
      ${r.plaetze ? `<div><dt>${u.plaetze}</dt><dd>${esc(r.plaetze)}</dd></div>` : ''}
    </dl>
    <p class="held__aktionen"><span class="marker marker--${esc(r.status)}">${u.status[r.status] || ''}</span>
    ${r.status !== 'vorbei' ? `<a class="knopf" href="${ROUTEN.kontakt[l]}#retreat-${esc(r.slug)}">${r.status === 'ausgebucht' ? (l === 'en' ? 'Join the waiting list' : 'Auf die Warteliste') : u.platz}</a><a class="textlink" href="${ROUTEN.kennen[l]}">${esc(i.texte[l]['kennen.titel'])}</a>` : ''}</p>
  </div>
  <figure class="detail__bild bogen">${bildTag(b, l, { breite: 1000, sizes: '(min-width: 900px) 45vw, 100vw', lazy: false, ersatz: kuestenZeichnung('', l) })}</figure>
</header>
<div class="detail__rumpf schmal">
  ${absaetze(r.text?.[l])}
  ${ab.length ? `<h2 class="h3">${u.ablauf}</h2><ol class="tage">${ab.map(z => `<li>${esc(z)}</li>`).join('')}</ol>` : ''}
  ${le.length ? `<h2 class="h3">${u.leistungen}</h2><ul class="striche">${le.map(z => `<li>${esc(z)}</li>`).join('')}</ul>` : ''}
  <p class="hinweis">${esc(i.texte[l]['retreats.veranstalter'])}</p>
</div>
</article>
${gratisBlock(ctx)}`;
  return layout(ctx, {
    titel: `${r.titel[l]} ${l === 'en' ? 'for women' : 'für Frauen'} · ${(r.von || '').slice(0, 4)} – Anam Cara`, beschreibung: r.kurz[l].slice(0, 160),
    pfad: retreatPfad(r.slug, l), andererPfad: retreatPfad(r.slug, l === 'de' ? 'en' : 'de'), inhaltHtml: html, seite: 'retreat',
    schema: [eventSchema(ctx, r), { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Anam Cara', item: ctx.url + ROUTEN.start[l] },
      { '@type': 'ListItem', position: 2, name: i.texte[l]['retreats.titel'], item: ctx.url + ROUTEN.retreats[l] },
      { '@type': 'ListItem', position: 3, name: r.titel[l], item: ctx.url + retreatPfad(r.slug, l) }] }],
  });
}

export function ueberSeite(ctx) {
  const { l, i } = ctx; const T = k => esc(i.texte[l][k]); const bp = i.einstellungen.bildplaetze;
  const person = (k, seite) => `<section class="person person--${seite} auftritt">
    <figure class="bogen">${bildTag(platzBild(ctx, k), l, { breite: 700, sizes: '(min-width: 900px) 35vw, 100vw', ersatz: monogramm(i.texte[l][`ueber.${k}.name`]) })}</figure>
    <div><h2 class="h2">${T(`ueber.${k}.name`)}</h2>${absaetze(i.texte[l][`ueber.${k}.text`])}</div></section>`;
  const html = `<section class="seitenkopf"><h1 class="h1">${T('ueber.titel')}</h1><div class="seitenkopf__lead">${absaetze(i.texte[l]['ueber.text'])}</div></section>
${platzBild(ctx, 'ueber') ? `<figure class="breitbild breitbild--mystisch">${bildTag(platzBild(ctx, 'ueber'), l, { breite: 1600, sizes: '100vw' })}<div class="foto-hg__nebel" aria-hidden="true"></div></figure>` : ''}
<div class="abschnitt personen">${person('sabine', 'links')}${person('nina', 'rechts')}</div>
<section class="abschnitt name"><div class="name__innen"><h2 class="vorzeile">${T('name.titel')}</h2><p class="name__wort" lang="ga">Anam Cara</p>${zier()}<p class="name__zitat">${T('name.text')}</p></div></section>
${gratisBlock(ctx)}`;
  const schema = ['sabine', 'nina'].map(k => ({ '@context': 'https://schema.org', '@type': 'Person', name: i.texte.de[`ueber.${k}.name`], worksFor: { '@id': ctx.url + '/#organisation' } }));
  return layout(ctx, { titel: i.texte[l]['seo.ueber.titel'], beschreibung: i.texte[l]['seo.ueber.beschreibung'], pfad: ROUTEN.ueber[l], andererPfad: ROUTEN.ueber[l === 'de' ? 'en' : 'de'], inhaltHtml: html, schema, seite: 'ueber' });
}

export function formularSeite(ctx, art) {
  const { l, i } = ctx; const T = k => esc(i.texte[l][k]);
  const conf = {
    kontakt: { titel: T('kontakt.titel'), text: i.texte[l]['kontakt.text'], modus: 'anfrage', seo: `${l === 'en' ? 'Contact' : 'Kontakt'} – Anam Cara`, besch: i.texte[l]['seo.kontakt.beschreibung'] },
    kennen: { titel: T('kennen.titel'), text: i.texte[l]['kennen.text'], modus: 'kennen', seo: `${i.texte[l]['kennen.titel']} – Anam Cara`, besch: i.texte[l]['kennen.text'].slice(0, 158) },
    warte: { titel: T('warte.titel'), text: i.texte[l]['warte.text'], modus: 'warte', seo: `${i.texte[l]['warte.titel']} – Anam Cara`, besch: i.texte[l]['warte.text'].slice(0, 158) },
  }[art];
  const E = i.einstellungen;
  const html = `<section class="formularseite">
  <div class="formularseite__text">
    <h1 class="h1">${conf.titel}</h1>
    ${absaetze(conf.text)}
    ${art === 'kontakt' ? `<div class="kontaktdaten">${(E.adressen || []).map(a => `<p>${esc(a)}</p>`).join('')}${E.email ? `<p><a href="mailto:${esc(E.email)}">${esc(E.email)}</a></p>` : ''}${E.telefon ? `<p><a href="tel:${esc(E.telefon.replace(/[^+\d]/g, ''))}">${esc(E.telefon)}</a></p>` : ''}</div>` : ''}
    ${art === 'kennen' ? `<ul class="striche"><li>${l === 'en' ? 'By phone or video, as you prefer' : 'Am Telefon oder per Video, wie es dir lieber ist'}</li><li>${l === 'en' ? 'About 15 minutes, free of charge' : '15 Minuten, kostenlos'}</li><li>${l === 'en' ? 'No obligation to book' : 'Keine Verpflichtung zur Buchung'}</li></ul>` : ''}
  </div>
  <div class="formularseite__form">${anfrageFormular(ctx, conf.modus)}</div>
</section>`;
  const pfad = ROUTEN[art][l];
  const schema = art === 'kennen' ? [{ '@context': 'https://schema.org', '@type': 'Service', name: i.texte[l]['kennen.titel'], provider: { '@id': ctx.url + '/#organisation' }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } }] : [];
  return layout(ctx, { titel: conf.seo, beschreibung: conf.besch, pfad, andererPfad: ROUTEN[art][l === 'de' ? 'en' : 'de'], inhaltHtml: html, schema, seite: 'formular' });
}

export function galerieSeite(ctx) {
  const { l, i } = ctx;
  const gal = (ctx.bilder || []).filter(b => b.galerie);
  const html = `<section class="seitenkopf"><h1 class="h1">${esc(i.texte[l]['galerie.titel'])}</h1></section>
<section class="abschnitt"><div class="galerie galerie--voll">${gal.map(b => `<a href="/bild/${b.id}" class="galerie__bild auftritt" data-gross>${bildTag(b, l, { breite: 800, sizes: '(min-width: 900px) 33vw, 50vw' })}</a>`).join('')}</div></section>`;
  return layout(ctx, { titel: `${i.texte[l]['galerie.titel']} – Anam Cara`, beschreibung: i.texte[l]['seo.start.beschreibung'], pfad: ROUTEN.galerie[l], andererPfad: ROUTEN.galerie[l === 'de' ? 'en' : 'de'], inhaltHtml: html, seite: 'galerie' });
}

export function nlSeite(ctx, art, token) {
  const { l } = ctx; const de = l === 'de';
  const html = art === 'best' ? `<section class="seitenkopf schmal einfach">
  <h1 class="h1">${de ? 'Anmeldung bestätigen' : 'Confirm your subscription'}</h1>
  <p>${de ? 'Ein Klick noch, dann bist du dabei.' : 'One more click and you are subscribed.'}</p>
  <div data-nl-schritt="bestaetigen" data-token="${esc(token)}" data-lang="${l}">
    <button class="knopf" type="button" data-aktion="bestaetigen">${de ? 'Ja, Newsletter erhalten' : 'Yes, send me the newsletter'}</button>
    <p class="formular__danke" role="status" hidden>${de ? 'Danke, deine Anmeldung ist bestätigt.' : 'Thank you, your subscription is confirmed.'}</p>
    <p class="formular__fehler" role="alert" hidden></p>
  </div></section>` : `<section class="seitenkopf schmal einfach">
  <h1 class="h1">${de ? 'Newsletter abbestellen' : 'Unsubscribe'}</h1>
  <div data-nl-schritt="abbestellen" data-token="${esc(token)}" data-lang="${l}">
    <div data-stufe="1"><p>${de ? 'Möchtest du den Newsletter von Anam Cara abbestellen?' : 'Would you like to unsubscribe from the Anam Cara newsletter?'}</p>
      <p class="held__aktionen"><button class="knopf" type="button" data-aktion="stufe2">${de ? 'Ja, abbestellen' : 'Yes, unsubscribe'}</button><a class="textlink" href="${ROUTEN.start[l]}">${de ? 'Nein, weiter erhalten' : 'No, keep receiving it'}</a></p></div>
    <div data-stufe="2" hidden><p>${de ? 'Bist du ganz sicher? Du erfährst dann nicht mehr als Erste von neuen Reisen.' : 'Are you quite sure? You will no longer hear first about new journeys.'}</p>
      <p class="held__aktionen"><button class="knopf" type="button" data-aktion="abbestellen">${de ? 'Ja, endgültig abbestellen' : 'Yes, unsubscribe for good'}</button><a class="textlink" href="${ROUTEN.start[l]}">${de ? 'Nein' : 'No'}</a></p></div>
    <p class="formular__danke" role="status" hidden>${de ? 'Du bist abgemeldet. Danke, dass du dabei warst.' : 'You have been unsubscribed. Thank you for having been with us.'}</p>
    <p class="formular__fehler" role="alert" hidden></p>
  </div></section>`;
  return layout(ctx, { titel: 'Newsletter – Anam Cara', beschreibung: '', pfad: ROUTEN[art === 'best' ? 'nlBest' : 'nlAb'][l], inhaltHtml: html, noindex: true, seite: 'nl' });
}

export function nichtGefunden(ctx) {
  const { l } = ctx; const u = UI[l];
  const html = `<section class="seitenkopf schmal einfach"><p class="vorzeile">404</p><h1 class="h1">${u.nichtGefunden}</h1><p>${u.nichtGefundenText}</p>
<ul class="striche"><li><a href="${ROUTEN.start[l]}">${u.zurueck}</a></li><li><a href="${ROUTEN.retreats[l]}">${u.nav[0][1]}</a></li><li><a href="${ROUTEN.kontakt[l]}">${u.nav[3][1]}</a></li></ul></section>`;
  return layout(ctx, { titel: '404 – Anam Cara', beschreibung: '', pfad: '/404', inhaltHtml: html, noindex: true, seite: 'fehler' });
}

export function rechtsSeite(ctx, art, inhaltHtml) {
  const { l } = ctx;
  const titel = art === 'impressum' ? UI[l].impressum : (l === 'en' ? 'Privacy policy' : 'Datenschutzerklärung');
  return layout(ctx, { titel: `${titel} – Anam Cara`, beschreibung: titel, pfad: ROUTEN[art][l], andererPfad: ROUTEN[art][l === 'de' ? 'en' : 'de'], inhaltHtml: `<section class="seitenkopf schmal recht"><h1 class="h1">${titel}</h1>${inhaltHtml}</section>`, seite: 'recht' });
}

export { absaetze, akzent, datumLang };
