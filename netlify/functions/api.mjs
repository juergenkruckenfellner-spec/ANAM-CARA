// Alle Schnittstellen unter /api/*. Rechte werden hier serverseitig geprüft (siehe lib/auth.mjs).
import * as D from '../../lib/daten.mjs';
import { SICHERHEIT, json, esc, id, sha, jetzt, emailOk, kurz, herkunftOk, seitenUrl, signieren, pruefen, hashKennwort, kennwortOk, kennwortRegel, env, zeitraum } from '../../lib/util.mjs';
import { brauche, anmelden, codeBestaetigen, sitzungsCookie, abmeldeCookie, neueEinladung, wer } from '../../lib/auth.mjs';
import { sende, rahmen, absatz, knopf, mailBereit } from '../../lib/mail.mjs';
import { portion, briefHtml, abmeldeLink, signatur } from '../../lib/nl.mjs';
import { FELDER } from '../../lib/inhalt-standard.mjs';
import { ROUTEN, retreatPfad } from '../../lib/seiten.mjs';
import crypto from 'node:crypto';

const ip = req => req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'lokal';
const body = async req => { try { return await req.json(); } catch { return {}; } };
const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless/i;

async function seitenNeu() {
  if (env('DEV_STORE_DIR')) return;
  try { const { purgeCache } = await import('@netlify/cache'); await purgeCache({ tags: ['seiten'] }); } catch (e) { console.error('Cache leeren fehlgeschlagen', e.message); }
}
export default async (req) => {
  const u = new URL(req.url);
  const p = u.pathname.replace(/^\/api/, '').replace(/\/+$/, '');
  const m = req.method;
  const seite = seitenUrl(req);
  if (m !== 'GET' && !herkunftOk(req) && p !== '/newsletter/abmelden-direkt') return json({ fehler: 'Ungültige Herkunft.' }, 403);

  try {
    // ================= öffentlich =================
    if (p === '/z' && m === 'POST') {
      if (BOT.test(req.headers.get('user-agent') || '')) return new Response(null, { status: 204 });
      const b = await body(req);
      const pfad = String(b.p || '/').slice(0, 120).replace(/[^\w\-/.]/g, '');
      const quelle = String(b.r || '').slice(0, 80).replace(/[^\w.-]/g, '');
      await D.zaehlen(new Date().toISOString().slice(0, 10), pfad, quelle);
      return new Response(null, { status: 204 });
    }

    if (p === '/anfrage' && m === 'POST') {
      const b = await body(req);
      if (b.webseite || (b.dauer && b.dauer < 2500)) return json({ ok: true }); // Spamfalle: freundlich ignorieren
      const art = ['anfrage', 'retreat', 'kennen', 'warte'].includes(b.anfrageart) ? b.anfrageart : 'anfrage';
      const en = b.lang === 'en';
      if (!kurz(b.name, 120) || !emailOk(b.email)) return json({ fehler: en ? 'Please enter your name and a valid email address.' : 'Bitte Name und eine gültige E-Mail-Adresse angeben.' }, 400);
      if (art === 'anfrage' && !kurz(b.nachricht)) return json({ fehler: en ? 'Please write a short message.' : 'Bitte schreib uns eine kurze Nachricht.' }, 400);
      if (art === 'kennen' && !kurz(b.telefon, 40)) return json({ fehler: en ? 'Please give a phone number for the call.' : 'Bitte gib eine Telefonnummer für das Gespräch an.' }, 400);
      if (await D.gesperrt('form:' + ip(req))) return json({ fehler: en ? 'Too many messages. Please try again later.' : 'Zu viele Nachrichten. Bitte später erneut versuchen.' }, 429);
      await D.fehlversuch('form:' + ip(req)); // max. 5 Anfragen je 15 Minuten und Adresse
      const rs = await D.retreats();
      const r = art === 'retreat' ? rs.find(x => x.slug === b.retreat) : null;
      const a = await D.anfrageSpeichern({ art, name: kurz(b.name, 120), email: b.email.trim().toLowerCase(), telefon: kurz(b.telefon, 40), retreat: r ? r.titel.de + ' · ' + zeitraum(r.von, r.bis) : '', wann: kurz(b.wann, 200), nachricht: kurz(b.nachricht, 4000), sprache: en ? 'en' : 'de', newsletter: b.newsletter === 'ja' });
      const i = await D.inhalt();
      const ARTEN = { anfrage: 'Allgemeine Anfrage', retreat: 'Anfrage zu einer Reise', kennen: 'Kennenlerngespräch', warte: 'Vormerkung' };
      const an = env('MAIL_EMPFAENGER') || i.einstellungen.email;
      if (an) await sende({ an, antwortAn: a.email, betreff: `${ARTEN[art]}: ${a.name}`, html: rahmen(
        `<p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#A9521B;margin:0 0 10px">${ARTEN[art]}</p>` +
        [['Name', a.name], ['E-Mail', a.email], ['Telefon', a.telefon], ['Reise', a.retreat], ['Gesprächszeit', a.wann], ['Nachricht', a.nachricht], ['Newsletter gewünscht', a.newsletter ? 'ja (Bestätigungsmail ist unterwegs)' : '']]
          .filter(x => x[1]).map(([k, v]) => `<p style="margin:0 0 10px"><strong>${k}</strong><br>${esc(v).replace(/\n/g, '<br>')}</p>`).join('') +
        knopf(seite + '/verwaltung#anfragen', 'Im Dashboard öffnen'), seite), text: `${ARTEN[art]} von ${a.name} <${a.email}>\n\n${a.nachricht}` });
      await sende({ an: a.email, betreff: en ? 'Your message to Anam Cara' : 'Deine Nachricht an Anam Cara', html: rahmen(
        absatz(en ? `Dear ${a.name},` : `Liebe/r ${a.name},`) + absatz(i.texte[en ? 'en' : 'de']['kontakt.danke']) + absatz(en ? 'Warm regards, Sabine & Nina' : 'Herzlich, Sabine & Nina'), seite),
        text: i.texte[en ? 'en' : 'de']['kontakt.danke'] });
      if (a.newsletter) await doiStarten(a.email, a.name, en ? 'en' : 'de', 'formular-' + art, i, seite);
      return json({ ok: true });
    }

    if (p === '/newsletter/anmelden' && m === 'POST') {
      const b = await body(req);
      if (b.webseite || (b.dauer && b.dauer < 1500)) return json({ ok: true });
      if (!emailOk(b.email) || b.einwilligung !== true) return json({ fehler: 'Bitte E-Mail-Adresse und Einwilligung prüfen.' }, 400);
      if (await D.gesperrt('nl:' + ip(req))) return json({ fehler: 'Zu viele Versuche. Bitte später erneut.' }, 429);
      await D.fehlversuch('nl:' + ip(req));
      const i = await D.inhalt();
      await doiStarten(b.email, kurz(b.name, 80), b.lang === 'en' ? 'en' : 'de', kurz(b.quelle, 40) || 'webseite', i, seite);
      return json({ ok: true });
    }
    if (p === '/newsletter/bestaetigen' && m === 'POST') {
      const t = pruefen((await body(req)).t);
      if (!t || t.z !== 'doi') return json({ fehler: 'Der Bestätigungslink ist ungültig oder abgelaufen. Bitte melde dich erneut an.' }, 400);
      const k = await D.kontakt(t.m);
      if (!k) return json({ fehler: 'Diese Anmeldung gibt es nicht mehr. Bitte melde dich erneut an.' }, 404);
      if (k.status !== 'aktiv') {
        k.status = 'aktiv'; k.bestaetigt = jetzt();
        k.nachweise = [...(k.nachweise || []), { zeit: jetzt(), weg: 'Double-Opt-in bestätigt', wortlaut: k.wortlaut, quelle: k.quelle }];
        await D.kontaktSpeichern(k);
      }
      return json({ ok: true });
    }
    if ((p === '/newsletter/abmelden' || p === '/newsletter/abmelden-direkt') && m === 'POST') {
      const tok = p.endsWith('direkt') ? u.searchParams.get('t') : (await body(req)).t;
      const t = pruefen(tok);
      if (!t || t.z !== 'ab') return json({ fehler: 'Der Link ist ungültig.' }, 400);
      const k = (await D.kontakt(t.m)) || { email: t.m, angelegt: jetzt() };
      k.status = 'abgemeldet'; k.abgemeldet = jetzt();
      k.nachweise = [...(k.nachweise || []), { zeit: jetzt(), weg: p.endsWith('direkt') ? 'Abmeldung über Mailprogramm (One-Click)' : 'Abmeldung über Abbestellseite (zwei Bestätigungen)' }];
      await D.kontaktSpeichern(k);
      return json({ ok: true });
    }

    // ================= Anmeldung =================
    if (p === '/anmelden' && m === 'POST') { const b = await body(req); return anmelden(b.email, b.kennwort, ip(req), seite); }
    if (p === '/anmelden/code' && m === 'POST') { const b = await body(req); return codeBestaetigen(b.ticket, b.code, ip(req)); }
    if (p === '/abmelden' && m === 'POST') return json({ ok: true }, 200, { 'set-cookie': abmeldeCookie() });
    if (p === '/ich' && m === 'GET') {
      const k = await wer(req);
      const einrichtungOffen = !(await D.konten()).some(x => x.rolle === 'admin');
      return json(k ? { angemeldet: true, rolle: k.rolle, name: k.name, email: k.email, benutzer: k.benutzer || '' } : { angemeldet: false, einrichtungOffen });
    }
    if (p === '/einrichten' && m === 'POST') {
      const b = await body(req);
      if ((await D.konten()).some(x => x.rolle === 'admin')) return json({ fehler: 'Die Einrichtung ist bereits abgeschlossen.' }, 403);
      const soll = env('EINRICHTUNGS_CODE');
      if (!soll || soll.length < 12) return json({ fehler: 'Im Hosting ist noch kein Einrichtungscode hinterlegt. In Netlify die Umgebungsvariable EINRICHTUNGS_CODE anlegen und danach neu veröffentlichen (Deploys → Trigger deploy).' }, 503);
      if (!env('SITZUNG_GEHEIMNIS') || env('SITZUNG_GEHEIMNIS').length < 32) return json({ fehler: 'Im Hosting fehlt noch die Umgebungsvariable SITZUNG_GEHEIMNIS (mind. 32 Zeichen). Bitte anlegen und neu veröffentlichen.' }, 503);
      const ok = soll && soll.length >= 12 && b.code && crypto.timingSafeEqual(Buffer.from(sha(String(b.code).trim())), Buffer.from(sha(soll.trim())));
      if (!ok) { await D.fehlversuch('i:' + ip(req)); return json({ fehler: 'Der Einrichtungscode stimmt nicht. Bitte ohne Leerzeichen davor oder danach eingeben.' }, 403); }
      const fehl = kennwortRegel(b.kennwort); if (fehl) return json({ fehler: fehl }, 400);
      const benutzer = String(b.benutzer || '').toLowerCase().trim();
      if (!/^[a-z0-9äöüß._-]{3,40}$/.test(benutzer) && !emailOk(b.email)) return json({ fehler: 'Bitte einen Benutzernamen (mind. 3 Zeichen) oder eine E-Mail-Adresse angeben.' }, 400);
      if (b.email && !emailOk(b.email)) return json({ fehler: 'Die E-Mail-Adresse ist ungültig.' }, 400);
      const k = { id: id(9), rolle: 'admin', name: kurz(b.name, 80) || b.benutzer || 'Verwaltung', benutzer: benutzer || undefined, email: b.email ? b.email.toLowerCase().trim() : '', telefon: kurz(b.telefon, 40), hash: hashKennwort(b.kennwort), sitzungVersion: 1, aktiv: true, angelegt: jetzt() };
      await D.kontoSpeichern(k); await D.protokoll(k.benutzer || k.email, 'Erstes Verwaltungskonto angelegt');
      return json({ ok: true, rolle: 'admin' }, 200, { 'set-cookie': sitzungsCookie(k) });
    }
    if (p === '/einladung' && m === 'POST') {
      const b = await body(req);
      const k = (await D.konten()).find(x => x.einladung && x.einladung === sha(b.t || ''));
      if (!k || k.einladungBis < Date.now()) return json({ fehler: 'Diese Einladung ist ungültig oder abgelaufen. Bitte Sabine oder Nina um eine neue.' }, 404);
      if (!b.kennwort) return json({ name: k.name, email: k.email, rolle: k.rolle });
      const fehl = kennwortRegel(b.kennwort); if (fehl) return json({ fehler: fehl }, 400);
      k.hash = hashKennwort(b.kennwort); delete k.einladung; delete k.einladungBis; k.aktiv = true;
      k.sitzungVersion = (k.sitzungVersion || 1) + 1; k.datenschutzGelesen = b.datenschutz === true ? jetzt() : k.datenschutzGelesen;
      await D.kontoSpeichern(k); await D.protokoll(k.email, 'Einladung angenommen');
      return json({ ok: true, rolle: k.rolle }, 200, { 'set-cookie': sitzungsCookie(k) });
    }
    if (p === '/kennwort/vergessen' && m === 'POST') {
      const b = await body(req);
      if (await D.gesperrt('pw:' + ip(req))) return json({ ok: true });
      await D.fehlversuch('pw:' + ip(req));
      const k = await D.kontoNachKennung(b.email || '');
      if (k && k.hash && k.email) {
        const t = signieren({ k: k.id, v: k.sitzungVersion || 1, z: 'neu', exp: Date.now() + 3600e3 });
        await sende({ an: k.email, betreff: 'Neues Kennwort für Anam Cara', html: rahmen(absatz(`Hallo ${k.name},`) + absatz('über den folgenden Knopf kannst du ein neues Kennwort festlegen. Der Link gilt eine Stunde.') + knopf(`${seite}/anmelden?neu=${encodeURIComponent(t)}`, 'Neues Kennwort festlegen') + absatz('Wenn du das nicht angefordert hast, ignoriere diese Nachricht einfach.'), seite), text: `${seite}/anmelden?neu=${t}` });
      }
      return json({ ok: true }); // gleiche Antwort, ob es die Adresse gibt oder nicht
    }
    if (p === '/kennwort/neu' && m === 'POST') {
      const b = await body(req); const t = pruefen(b.t);
      const k = t?.z === 'neu' ? await D.konto(t.k) : null;
      if (!k || (k.sitzungVersion || 1) !== t.v) return json({ fehler: 'Der Link ist ungültig oder bereits verwendet.' }, 400);
      const fehl = kennwortRegel(b.kennwort); if (fehl) return json({ fehler: fehl }, 400);
      k.hash = hashKennwort(b.kennwort); k.sitzungVersion = (k.sitzungVersion || 1) + 1;
      await D.kontoSpeichern(k); await D.protokoll(k.email, 'Kennwort über Link erneuert');
      return json({ ok: true });
    }
    if (p === '/konto/kennwort' && m === 'POST') {
      const { k, fehler } = await brauche(req); if (fehler) return fehler;
      const b = await body(req);
      if (!kennwortOk(b.alt || '', k.hash)) return json({ fehler: 'Das bisherige Kennwort stimmt nicht.' }, 403);
      const fehl = kennwortRegel(b.neu); if (fehl) return json({ fehler: fehl }, 400);
      k.hash = hashKennwort(b.neu); k.sitzungVersion = (k.sitzungVersion || 1) + 1;
      await D.kontoSpeichern(k); await D.protokoll(k.email, 'Kennwort geändert');
      return json({ ok: true }, 200, { 'set-cookie': sitzungsCookie(k) });
    }

    // ================= Teilnehmerinnen-Bereich =================
    if (p.startsWith('/bereich')) {
      const { k, fehler } = await brauche(req); if (fehler) return fehler;
      const rs = await D.retreats();
      const meine = k.rolle === 'admin' ? rs : rs.filter(r => (k.retreats || []).includes(r.id));
      if (p === '/bereich' && m === 'GET') {
        const heute = new Date().toISOString().slice(0, 10);
        const st = await D.stimmen();
        return json({
          konto: { name: k.name, email: k.email, telefon: k.telefon || '', rolle: k.rolle },
          reisen: meine.map(r => ({
            id: r.id, titel: r.titel.de, ort: r.ort.de, von: r.von, bis: r.bis, zeitraum: zeitraum(r.von, r.bis), pfad: retreatPfad(r.slug, 'de'),
            bild: r.bild, infos: r.infos || '', packliste: r.packliste || [], abgehakt: (k.packliste || {})[r.id] || [],
            dokumente: (r.dokumente || []).map(d => ({ id: d.id, name: d.name })),
            nachrichten: (r.nachrichten || []).slice().reverse(),
            vorbei: (r.bis || r.von) < heute,
            rueckmeldung: !!st.find(s => s.konto === k.id && s.rid === r.id),
          })),
        });
      }
      if (p === '/bereich/packliste' && m === 'POST') {
        const b = await body(req); if (!meine.find(r => r.id === b.rid)) return json({ fehler: 'Kein Zugriff.' }, 403);
        k.packliste = k.packliste || {}; const set = new Set(k.packliste[b.rid] || []);
        b.an ? set.add(Number(b.index)) : set.delete(Number(b.index)); k.packliste[b.rid] = [...set];
        await D.kontoSpeichern(k); return json({ ok: true });
      }
      if (p === '/bereich/profil' && m === 'POST') {
        const b = await body(req); k.name = kurz(b.name, 80) || k.name; k.telefon = kurz(b.telefon, 40);
        await D.kontoSpeichern(k); return json({ ok: true });
      }
      if (p === '/bereich/frage' && m === 'POST') {
        const b = await body(req); if (!kurz(b.text)) return json({ fehler: 'Bitte schreib deine Frage.' }, 400);
        const r = meine.find(x => x.id === b.rid);
        await D.anfrageSpeichern({ art: 'teilnehmerin', name: k.name, email: k.email, telefon: k.telefon || '', retreat: r ? r.titel.de : '', nachricht: kurz(b.text, 4000), sprache: 'de' });
        const i = await D.inhalt(); const an = env('MAIL_EMPFAENGER') || i.einstellungen.email;
        if (an) await sende({ an, antwortAn: k.email, betreff: `Frage von ${k.name} (Teilnehmerin)`, html: rahmen(absatz(kurz(b.text, 4000)) + knopf(seite + '/verwaltung#anfragen', 'Im Dashboard öffnen'), seite), text: kurz(b.text, 4000) });
        return json({ ok: true });
      }
      if (p === '/bereich/rueckmeldung' && m === 'POST') {
        const b = await body(req); const r = meine.find(x => x.id === b.rid);
        if (!r || !kurz(b.text)) return json({ fehler: 'Bitte schreib ein paar Zeilen.' }, 400);
        await D.stimmeSpeichern({ konto: k.id, rid: r.id, retreat: r.titel.de + ' ' + (r.von || '').slice(0, 4), text: kurz(b.text, 2000), name: kurz(b.name, 60) || k.name.split(' ')[0], einwilligung: b.veroeffentlichen === true ? jetzt() : null, freigegeben: false });
        return json({ ok: true });
      }
      if (p === '/bereich/daten' && m === 'GET') {
        const st = (await D.stimmen()).filter(s => s.konto === k.id);
        const { hash, einladung, ...ohne } = k;
        return new Response(JSON.stringify({ konto: ohne, rueckmeldungen: st }, null, 2), { headers: { ...SICHERHEIT, 'content-type': 'application/json', 'content-disposition': 'attachment; filename="meine-daten-anam-cara.json"', 'cache-control': 'no-store' } });
      }
      if (p === '/bereich/loeschen' && m === 'POST') {
        if (k.rolle === 'admin') return json({ fehler: 'Verwaltungskonten werden im Dashboard verwaltet.' }, 400);
        const b = await body(req); if (b.bestaetigt !== true) return json({ fehler: 'Bitte bestätigen.' }, 400);
        for (const s of (await D.stimmen()).filter(s => s.konto === k.id)) await D.stimmeLoeschen(s.id);
        await D.kontoLoeschen(k.id); await D.protokoll('System', 'Teilnehmerinnenkonto selbst gelöscht');
        return json({ ok: true }, 200, { 'set-cookie': abmeldeCookie() });
      }
    }
    const dok = p.match(/^\/dokument\/([\w-]+)\/([\w-]+)$/);
    if (dok && m === 'GET') {
      const { k, fehler } = await brauche(req); if (fehler) return fehler;
      if (k.rolle !== 'admin' && !(k.retreats || []).includes(dok[1])) return json({ fehler: 'Kein Zugriff.' }, 403);
      const r = (await D.retreats()).find(x => x.id === dok[1]); const d = r?.dokumente?.find(x => x.id === dok[2]);
      if (!d) return json({ fehler: 'Nicht gefunden.' }, 404);
      const { buf } = await D.datei('dok', d.id);
      return new Response(buf, { headers: { ...SICHERHEIT, 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${d.name.replace(/[^\w.\- äöüÄÖÜß]/g, '')}"`, 'cache-control': 'private, no-store' } });
    }

    // ================= Verwaltung (nur admin) =================
    if (p.startsWith('/v/')) {
      const { k: admin, fehler } = await brauche(req, 'admin'); if (fehler) return fehler;
      return await verwaltung(req, p.slice(2), m, admin, seite, u);
    }
    return json({ fehler: 'Nicht gefunden.' }, 404);
  } catch (err) {
    console.error('API-Fehler', p, err.message); // keine Personendaten im Log
    return json({ fehler: 'Interner Fehler. Bitte später erneut versuchen.' }, 500);
  }
};

async function doiStarten(email, name, lang, quelle, i, seite) {
  const mail = email.toLowerCase().trim();
  let k = await D.kontakt(mail);
  if (k?.status === 'aktiv') return; // schon dabei – keine erneute Mail
  const wortlaut = i.texte[lang]['nl.einwilligung'];
  k = { ...(k || {}), email: mail, name: name || k?.name || '', sprache: lang, status: 'unbestaetigt', angelegt: k?.angelegt || jetzt(), quelle, wortlaut,
    nachweise: [...(k?.nachweise || []), { zeit: jetzt(), weg: 'Anmeldung, Bestätigung ausständig', wortlaut, quelle }] };
  await D.kontaktSpeichern(k);
  const t = signieren({ m: mail, z: 'doi', exp: Date.now() + 7 * 864e5 });
  const link = `${seite}${ROUTEN.nlBest[lang]}?t=${encodeURIComponent(t)}`;
  const en = lang === 'en';
  await sende({ an: mail, betreff: en ? 'Please confirm: Anam Cara newsletter' : 'Bitte bestätigen: Newsletter von Anam Cara',
    html: rahmen(absatz(en ? 'Thank you for your interest.' : 'Danke für dein Interesse.') + absatz(en ? 'Please confirm with the button below that you would like to receive our newsletter.' : 'Bitte bestätige mit dem Knopf, dass du unseren Newsletter erhalten möchtest.') + knopf(link, en ? 'Confirm subscription' : 'Anmeldung bestätigen') + absatz(en ? 'If you did not sign up, simply ignore this email. Nothing will happen.' : 'Wenn du dich nicht angemeldet hast, ignoriere diese Nachricht. Dann passiert nichts.'), seite),
    text: link });
}

async function verwaltung(req, p, m, admin, seite, u) {
  const b = m === 'GET' ? {} : (req.headers.get('content-type') || '').startsWith('application/json') ? await body(req) : null;

  if (p === '/status' && m === 'GET') {
    const i = await D.inhalt();
    return json({ mail: mailBereit(), sms: !!(env('SEVEN_API_KEY') && env('SMS_ANBIETER') === 'seven'), deepl: !!env('DEEPL_API_KEY'), zfAus: env('ZF_AUS') === '1', entwurf: i.entwurf, ich: { id: admin.id, name: admin.name, email: admin.email, benutzer: admin.benutzer || '', telefon: admin.telefon || '' }, felder: FELDER });
  }
  if (p === '/uebersicht' && m === 'GET') {
    const [an, ko, kt, st, rs, stat] = await Promise.all([D.anfragen(), D.konten(), D.kontakte(), D.stimmen(), D.retreats(), D.statistik(30)]);
    return json({
      anfragenNeu: an.filter(a => a.status === 'neu').length, anfragen: an.slice(0, 5).map(a => ({ id: a.id, art: a.art, name: a.name, zeit: a.zeit, status: a.status })),
      teilnehmerinnen: ko.filter(x => x.rolle === 'teilnehmerin').length,
      kontakteAktiv: kt.filter(x => x.status === 'aktiv').length, stimmenOffen: st.filter(s => !s.freigegeben).length,
      reisen: rs.map(r => ({ id: r.id, titel: r.titel.de, zeitraum: zeitraum(r.von, r.bis), status: r.status, von: r.von, angemeldet: ko.filter(x => (x.retreats || []).includes(r.id)).length })),
      besuche30: stat.reduce((s, t) => s + t.summe, 0), besucheTage: stat.map(t => ({ tag: t.tag, n: t.summe })),
    });
  }

  // ---- Inhalte ----
  if (p === '/inhalt' && m === 'GET') return json(await D.inhalt());
  if (p === '/inhalt' && m === 'POST') {
    const i = await D.inhalt();
    if (b.texte) for (const l of ['de', 'en']) for (const [key] of FELDER) if (typeof b.texte[l]?.[key] === 'string') i.texte[l][key] = b.texte[l][key].slice(0, 4000);
    if (b.einstellungen) {
      const e = b.einstellungen, E = i.einstellungen;
      for (const f of ['wortlaut', 'rechtsform', 'personen', 'email', 'telefon', 'uid', 'firmenbuch', 'kammer', 'veranstalter', 'gscToken']) if (typeof e[f] === 'string') E[f] = e[f].trim().slice(0, 300);
      if (Array.isArray(e.adressen)) E.adressen = e.adressen.map(x => String(x).trim().slice(0, 200)).filter(Boolean).slice(0, 4);
      if (e.social) for (const s of ['instagram', 'facebook']) if (typeof e.social[s] === 'string') E.social[s] = /^https:\/\//.test(e.social[s]) ? e.social[s].slice(0, 300) : '';
      if (e.abschnitte) for (const s of ['stimmen', 'galerie']) if (typeof e.abschnitte[s] === 'boolean') E.abschnitte[s] = e.abschnitte[s];
      if (e.bildplaetze) for (const s of Object.keys(E.bildplaetze)) if (typeof e.bildplaetze[s] === 'string') E.bildplaetze[s] = e.bildplaetze[s];
      if (e.fristen) for (const s of Object.keys(E.fristen)) { const n = Number(e.fristen[s]); if (n >= 1 && n <= 120) E.fristen[s] = n; }
    }
    if (typeof b.entwurf === 'boolean') i.entwurf = b.entwurf;
    await D.inhaltSpeichern(i); await D.protokoll(admin.email, 'Inhalte gespeichert'); await seitenNeu();
    return json({ ok: true });
  }
  if (p === '/uebersetzen' && m === 'POST') {
    if (!env('DEEPL_API_KEY')) return json({ fehler: 'Kein Übersetzungsdienst eingerichtet.' }, 400);
    const key = env('DEEPL_API_KEY');
    const r = await fetch(key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate', { method: 'POST', headers: { Authorization: 'DeepL-Auth-Key ' + key, 'content-type': 'application/json' }, body: JSON.stringify({ text: [String(b.text || '').slice(0, 4000)], target_lang: b.nach === 'de' ? 'DE' : 'EN-GB', source_lang: b.nach === 'de' ? 'EN' : 'DE' }) });
    const j = await r.json().catch(() => ({}));
    return r.ok ? json({ text: j.translations?.[0]?.text || '' }) : json({ fehler: 'Übersetzung fehlgeschlagen.' }, 502);
  }

  // ---- Retreats ----
  if (p === '/retreats' && m === 'GET') return json(await D.retreats());
  if (p === '/retreats' && m === 'POST') {
    const alt = await D.retreats();
    const neu = (Array.isArray(b.liste) ? b.liste : []).slice(0, 50).map(r => {
      const vorher = alt.find(x => x.id === r.id) || {};
      const zw = o => ({ de: kurz(o?.de, 6000), en: kurz(o?.en, 6000) });
      const slug = String(r.slug || r.titel?.de || 'reise').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || id(4);
      return {
        id: vorher.id || r.id || id(6), slug, veroeffentlicht: !!r.veroeffentlicht, status: ['geplant', 'buchbar', 'ausgebucht', 'vorbei'].includes(r.status) ? r.status : 'geplant',
        von: /^\d{4}-\d{2}-\d{2}$/.test(r.von) ? r.von : '', bis: /^\d{4}-\d{2}-\d{2}$/.test(r.bis) ? r.bis : '', plaetze: kurz(r.plaetze, 40), bild: kurz(r.bild, 40),
        titel: zw(r.titel), ort: zw(r.ort), kurz: zw(r.kurz), text: zw(r.text), ablauf: zw(r.ablauf), leistungen: zw(r.leistungen), preis: zw(r.preis),
        infos: kurz(r.infos, 8000), packliste: (r.packliste || []).map(x => kurz(x, 200)).filter(Boolean).slice(0, 80),
        dokumente: vorher.dokumente || [], nachrichten: vorher.nachrichten || [],
      };
    });
    const slugs = new Set(); for (const r of neu) { while (slugs.has(r.slug)) r.slug += '-2'; slugs.add(r.slug); }
    await D.retreatsSpeichern(neu); await D.protokoll(admin.email, 'Reisen gespeichert'); await seitenNeu();
    return json({ ok: true, liste: neu });
  }
  if (p === '/nachricht' && m === 'POST') {
    const rs = await D.retreats(); const r = rs.find(x => x.id === b.rid);
    if (!r || !kurz(b.text)) return json({ fehler: 'Reise und Text angeben.' }, 400);
    const n = { id: id(6), zeit: jetzt(), von: admin.name, text: kurz(b.text, 4000) };
    r.nachrichten = [...(r.nachrichten || []), n]; await D.retreatsSpeichern(rs);
    let gemailt = 0;
    if (b.mailen) for (const t of (await D.konten()).filter(x => x.rolle === 'teilnehmerin' && (x.retreats || []).includes(r.id) && x.hash)) {
      const rr = await sende({ an: t.email, betreff: `Neuigkeit zu ${r.titel.de}`, html: rahmen(absatz(`Liebe ${t.name.split(' ')[0]},`) + absatz(n.text) + knopf(seite + '/mein-bereich', 'Zu deinem Bereich') + absatz('Herzlich, Sabine & Nina'), seite), text: n.text });
      if (rr.ok) gemailt++;
    }
    await D.protokoll(admin.email, 'Nachricht an Reise ' + r.titel.de);
    return json({ ok: true, gemailt });
  }
  if (p === '/nachricht/loeschen' && m === 'POST') {
    const rs = await D.retreats(); const r = rs.find(x => x.id === b.rid); if (!r) return json({ fehler: 'Nicht gefunden.' }, 404);
    r.nachrichten = (r.nachrichten || []).filter(n => n.id !== b.id); await D.retreatsSpeichern(rs); return json({ ok: true });
  }

  // ---- Bilder & Dokumente (Rohdaten-Upload) ----
  if (p === '/bild' && m === 'POST') {
    const typ = req.headers.get('content-type') || '';
    if (!/^image\/(jpeg|png|webp)$/.test(typ)) return json({ fehler: 'Bitte JPG, PNG oder WebP hochladen.' }, 400);
    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return json({ fehler: 'Das Bild ist größer als 5 MB.' }, 400);
    const bid = id(8);
    await D.dateiSpeichern('bild', bid, buf, { typ });
    const l = await D.bilder();
    const eintrag = { id: bid, name: kurz(decodeURIComponent(req.headers.get('x-name') || 'bild'), 120), b: Number(req.headers.get('x-b')) || 0, h: Number(req.headers.get('x-h')) || 0, alt: { de: kurz(decodeURIComponent(req.headers.get('x-alt') || ''), 200), en: '' }, galerie: false, zeit: jetzt(), groesse: buf.length };
    l.unshift(eintrag); await D.bilderSpeichern(l); await D.protokoll(admin.email, 'Bild hochgeladen');
    return json({ ok: true, bild: eintrag });
  }
  if (p === '/bilder' && m === 'GET') return json(await D.bilder());
  if (p === '/bild/aendern' && m === 'POST') {
    const l = await D.bilder(); const x = l.find(y => y.id === b.id); if (!x) return json({ fehler: 'Nicht gefunden.' }, 404);
    if (b.alt) x.alt = { de: kurz(b.alt.de, 200), en: kurz(b.alt.en, 200) };
    if (typeof b.galerie === 'boolean') x.galerie = b.galerie;
    await D.bilderSpeichern(l); await seitenNeu(); return json({ ok: true });
  }
  if (p === '/bild/loeschen' && m === 'POST') {
    const l = await D.bilder(); await D.bilderSpeichern(l.filter(y => y.id !== b.id)); await D.dateiLoeschen('bild', b.id);
    const i = await D.inhalt(); for (const s in i.einstellungen.bildplaetze) if (i.einstellungen.bildplaetze[s] === b.id) i.einstellungen.bildplaetze[s] = '';
    await D.inhaltSpeichern(i);
    const rs = await D.retreats(); rs.forEach(r => { if (r.bild === b.id) r.bild = ''; }); await D.retreatsSpeichern(rs);
    await D.protokoll(admin.email, 'Bild gelöscht'); await seitenNeu(); return json({ ok: true });
  }
  if (p === '/dokument' && m === 'POST') {
    const rid = u.searchParams.get('rid'); const rs = await D.retreats(); const r = rs.find(x => x.id === rid);
    if (!r) return json({ fehler: 'Reise nicht gefunden.' }, 404);
    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length > 4 * 1024 * 1024) return json({ fehler: 'Das PDF ist größer als 4 MB.' }, 400);
    if (buf.subarray(0, 5).toString() !== '%PDF-') return json({ fehler: 'Das ist keine PDF-Datei.' }, 400);
    const did = id(8); await D.dateiSpeichern('dok', did, buf, { typ: 'application/pdf' });
    r.dokumente = [...(r.dokumente || []), { id: did, name: kurz(decodeURIComponent(req.headers.get('x-name') || 'Unterlage.pdf'), 120), zeit: jetzt() }];
    await D.retreatsSpeichern(rs); await D.protokoll(admin.email, 'Unterlage hochgeladen'); return json({ ok: true, dokumente: r.dokumente });
  }
  if (p === '/dokument/loeschen' && m === 'POST') {
    const rs = await D.retreats(); const r = rs.find(x => x.id === b.rid); if (!r) return json({ fehler: 'Nicht gefunden.' }, 404);
    r.dokumente = (r.dokumente || []).filter(d => d.id !== b.id); await D.dateiLoeschen('dok', b.id); await D.retreatsSpeichern(rs);
    return json({ ok: true, dokumente: r.dokumente });
  }

  // ---- Anfragen ----
  if (p === '/anfragen' && m === 'GET') return json(await D.anfragen());
  if (p === '/anfrage' && m === 'POST') {
    const a = await D.anfrage(b.id); if (!a) return json({ fehler: 'Nicht gefunden.' }, 404);
    if (['neu', 'in-arbeit', 'erledigt'].includes(b.status)) a.status = b.status;
    if (typeof b.notiz === 'string') a.notiz = b.notiz.slice(0, 2000);
    await D.anfrageSpeichern(a); return json({ ok: true });
  }
  if (p === '/anfrage/loeschen' && m === 'POST') { await D.anfrageLoeschen(b.id); await D.protokoll(admin.email, 'Anfrage gelöscht'); return json({ ok: true }); }

  // ---- Konten ----
  if (p === '/konten' && m === 'GET') return json((await D.konten()).map(({ hash, einladung, ...k }) => ({ ...k, eingeladen: !!einladung && !hash, kennwortGesetzt: !!hash })));
  if (p === '/konto/einladen' && m === 'POST') {
    if (!emailOk(b.email) || !kurz(b.name, 80)) return json({ fehler: 'Bitte Name und gültige E-Mail angeben.' }, 400);
    const mail = b.email.toLowerCase().trim();
    let k = await D.kontoNachMail(mail);
    if (k && k.hash && !b.erneut) return json({ fehler: 'Für diese Adresse gibt es schon ein Konto.' }, 409);
    k = k || { id: id(9), email: mail, angelegt: jetzt(), sitzungVersion: 1, aktiv: true };
    k.name = kurz(b.name, 80); k.rolle = b.rolle === 'admin' ? 'admin' : 'teilnehmerin';
    k.retreats = Array.isArray(b.retreats) ? b.retreats.slice(0, 20) : (k.retreats || []);
    const tok = neueEinladung(k); await D.kontoSpeichern(k);
    const link = `${seite}/einladung?t=${tok}`;
    const rs = await D.retreats(); const reise = rs.filter(r => k.retreats.includes(r.id)).map(r => r.titel.de).join(', ');
    const r = await sende({ an: k.email, betreff: k.rolle === 'admin' ? 'Dein Zugang zur Verwaltung von Anam Cara' : 'Dein persönlicher Bereich bei Anam Cara',
      html: rahmen(absatz(`Liebe ${k.name.split(' ')[0]},`) + absatz(k.rolle === 'admin' ? 'für dich wurde ein Zugang zum Dashboard von anam-cara.at angelegt.' : `schön, dass du dabei bist${reise ? ' – ' + reise : ''}. In deinem persönlichen Bereich findest du ab jetzt Reiseinfos, Packliste und Unterlagen.`) + knopf(link, 'Kennwort festlegen') + absatz('Der Link gilt 14 Tage.') + absatz('Herzlich, Sabine & Nina'), seite), text: link });
    await D.protokoll(admin.email, `Einladung (${k.rolle}) erstellt`);
    return json({ ok: true, link, gemailt: r.ok, mailFehler: r.ok ? '' : r.fehler });
  }
  if (p === '/konto/aendern' && m === 'POST') {
    const k = await D.konto(b.id); if (!k) return json({ fehler: 'Nicht gefunden.' }, 404);
    if (Array.isArray(b.retreats)) k.retreats = b.retreats.slice(0, 20);
    if (typeof b.name === 'string' && b.name.trim()) k.name = kurz(b.name, 80);
    if (typeof b.telefon === 'string') k.telefon = kurz(b.telefon, 40);
    if (typeof b.aktiv === 'boolean' && k.id !== admin.id) { k.aktiv = b.aktiv; if (!b.aktiv) k.sitzungVersion = (k.sitzungVersion || 1) + 1; }
    await D.kontoSpeichern(k); await D.protokoll(admin.email, 'Konto geändert'); return json({ ok: true });
  }
  if (p === '/konto/loeschen' && m === 'POST') {
    if (b.id === admin.id) return json({ fehler: 'Das eigene Konto kann hier nicht gelöscht werden.' }, 400);
    const admins = (await D.konten()).filter(x => x.rolle === 'admin');
    const k = await D.konto(b.id); if (!k) return json({ fehler: 'Nicht gefunden.' }, 404);
    if (k.rolle === 'admin' && admins.length <= 1) return json({ fehler: 'Das letzte Verwaltungskonto bleibt bestehen.' }, 400);
    await D.kontoLoeschen(b.id); await D.protokoll(admin.email, 'Konto gelöscht'); return json({ ok: true });
  }
  if (p === '/ich' && m === 'POST') {
    admin.name = kurz(b.name, 80) || admin.name; admin.telefon = kurz(b.telefon, 40);
    if (typeof b.email === 'string') { if (b.email && !emailOk(b.email)) return json({ fehler: 'Die E-Mail-Adresse ist ungültig.' }, 400); const andere = b.email && (await D.kontoNachMail(b.email)); if (andere && andere.id !== admin.id) return json({ fehler: 'Diese E-Mail-Adresse gehört schon zu einem anderen Konto.' }, 409); admin.email = b.email.toLowerCase().trim(); }
    await D.kontoSpeichern(admin); return json({ ok: true });
  }

  // ---- Stimmen ----
  if (p === '/stimmen' && m === 'GET') return json(await D.stimmen());
  if (p === '/stimme' && m === 'POST') {
    const s = (await D.stimmen()).find(x => x.id === b.id); if (!s) return json({ fehler: 'Nicht gefunden.' }, 404);
    if (typeof b.freigegeben === 'boolean') { if (b.freigegeben && !s.einwilligung) return json({ fehler: 'Ohne Einwilligung der Teilnehmerin darf diese Rückmeldung nicht veröffentlicht werden.' }, 400); s.freigegeben = b.freigegeben; }
    if (typeof b.text === 'string' && b.text.trim()) s.text = kurz(b.text, 2000);
    if (typeof b.name === 'string' && b.name.trim()) s.name = kurz(b.name, 60);
    await D.stimmeSpeichern(s); await seitenNeu(); return json({ ok: true });
  }
  if (p === '/stimme/loeschen' && m === 'POST') { await D.stimmeLoeschen(b.id); await seitenNeu(); return json({ ok: true }); }

  // ---- Newsletter ----
  if (p === '/nl' && m === 'GET') {
    const kt = await D.kontakte();
    return json({
      zaehler: { aktiv: kt.filter(k => k.status === 'aktiv').length, unbestaetigt: kt.filter(k => k.status === 'unbestaetigt').length, abgemeldet: kt.filter(k => k.status === 'abgemeldet').length },
      kontakte: kt.map(k => ({ email: k.email, name: k.name, status: k.status, angelegt: k.angelegt, quelle: k.quelle, nachweise: k.nachweise })).sort((a, b) => (b.angelegt || '').localeCompare(a.angelegt || '')),
      entwurf: (await D.nlEntwurf()) || null,
      laeufe: (await D.nlLaeufe()).slice(0, 20),
    });
  }
  if (p === '/nl/entwurf' && m === 'POST') {
    const alt = await D.nlEntwurf();
    const e = {
      laufId: b.neu || !alt?.laufId ? 'l' + Date.now().toString(36) + id(3) : alt.laufId,
      betreff: kurz(b.betreff, 200), anrede: ['liebe', 'hallo', 'keine', 'frei'].includes(b.anrede) ? b.anrede : 'liebe', anredeFrei: kurz(b.anredeFrei, 120),
      bloecke: (Array.isArray(b.bloecke) ? b.bloecke : []).slice(0, 30).map(x => ({ typ: x.typ, text: kurz(x.text, 6000), id: kurz(x.id, 40), rid: kurz(x.rid, 40), url: /^https?:\/\//.test(x.url || '') ? kurz(x.url, 500) : '' })).filter(x => ['text', 'bild', 'reise', 'knopf'].includes(x.typ)),
      geaendert: jetzt(),
    };
    const gleich = alt && signatur(alt) === signatur(e) && alt.laufId === e.laufId;
    e.ok = gleich ? !!alt.ok : false;               // jede Änderung nimmt das OK zurück
    if (b.ok === true) e.ok = true;
    await D.nlEntwurfSpeichern(e);
    return json({ ok: true, entwurf: e });
  }
  if (p === '/nl/vorschau' && m === 'GET') {
    const e = await D.nlEntwurf(); if (!e) return new Response('Noch kein Entwurf.', { status: 404 });
    const html = await briefHtml(e, { name: admin.name }, seite, '#abbestellen-vorschau');
    return new Response(html, { headers: { ...SICHERHEIT, 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; font-src 'self'; frame-ancestors 'self'" , 'x-frame-options': 'SAMEORIGIN' } });
  }
  if (p === '/nl/senden' && m === 'POST') {
    const r = await portion({ laufId: b.laufId, geraet: kurz(b.geraet, 40), n: Number(b.n) || 15, seite });
    if (r.status !== 200) return json({ fehler: r.fehler }, r.status);
    if (r.fertig) await D.protokoll(admin.email, 'Newsletter versendet');
    return json(r);
  }
  if (p === '/nl/lauf/ausblenden' && m === 'POST') {
    const l = await D.nlLauf(b.id); if (!l) return json({ fehler: 'Nicht gefunden.' }, 404);
    l.ausgeblendet = true; await D.nlLaufSpeichern(l); return json({ ok: true });
  }
  if (p === '/nl/kontakt' && m === 'POST') {
    // Wiederaufnahme oder händische Aufnahme – nur mit nachweisbarer Zustimmung der Person
    if (!emailOk(b.email)) return json({ fehler: 'Bitte gültige E-Mail angeben.' }, 400);
    if (b.zustimmung !== true) return json({ fehler: 'Nur mit Zustimmung der Person möglich.' }, 400);
    const k = (await D.kontakt(b.email)) || { email: b.email.toLowerCase().trim(), angelegt: jetzt() };
    k.status = 'aktiv'; k.name = kurz(b.name, 80) || k.name || '';
    k.nachweise = [...(k.nachweise || []), { zeit: jetzt(), weg: b.wiederaufnehmen ? 'Wiederaufnahme im Dashboard' : 'Händisch im Dashboard eingetragen', wortlaut: kurz(b.wortlaut, 500) || 'Zustimmung liegt laut Verwaltung vor', durch: admin.name }];
    delete k.abgemeldet; await D.kontaktSpeichern(k); await D.protokoll(admin.email, b.wiederaufnehmen ? 'Newsletter-Kontakt wieder aufgenommen' : 'Newsletter-Kontakt eingetragen');
    return json({ ok: true });
  }
  if (p === '/nl/kontakt/loeschen' && m === 'POST') { await D.kontaktLoeschen(b.email); await D.protokoll(admin.email, 'Newsletter-Kontakt gelöscht'); return json({ ok: true }); }

  // ---- Statistik & Sichtbarkeit ----
  if (p === '/statistik' && m === 'GET') {
    const tage = await D.statistik(Math.min(90, Number(u.searchParams.get('tage')) || 30));
    const seiten = {}, quellen = {};
    tage.forEach(t => { for (const [k, v] of Object.entries(t.seiten)) seiten[k] = (seiten[k] || 0) + v; for (const [k, v] of Object.entries(t.quellen)) quellen[k] = (quellen[k] || 0) + v; });
    const an = await D.anfragen(); const seit = Date.now() - tage.length * 864e5;
    const arten = {}; an.filter(a => Date.parse(a.zeit) > seit).forEach(a => arten[a.art] = (arten[a.art] || 0) + 1);
    return json({ tage: tage.map(t => ({ tag: t.tag, n: t.summe })), seiten: Object.entries(seiten).sort((a, b) => b[1] - a[1]).slice(0, 15), quellen: Object.entries(quellen).sort((a, b) => b[1] - a[1]).slice(0, 10), anfragenNachArt: arten });
  }
  if (p === '/check' && m === 'GET') return json(await sichtbarkeitsCheck());

  // ---- Sicherung ----
  if (p === '/sicherung' && m === 'GET') {
    const s = await D.sicherungErstellen(); await D.protokoll(admin.email, 'Sicherung heruntergeladen');
    return new Response(JSON.stringify(s), { headers: { ...SICHERHEIT, 'content-type': 'application/json', 'content-disposition': `attachment; filename="anam-cara-sicherung-${s.erstellt.slice(0, 10)}.json"`, 'cache-control': 'no-store' } });
  }
  if (p === '/sicherungen' && m === 'GET') return json(await D.sicherungenListe());
  if (p === '/sicherung/jetzt' && m === 'POST') { const t = await D.sicherungAblegen(); return json({ ok: true, tag: t }); }
  if (p === '/sicherung/einspielen' && m === 'POST') {
    let s = b.sicherung;
    if (b.tag) s = await D.sicherungLaden(b.tag);
    if (b.bestaetigt !== true) return json({ fehler: 'Bitte bestätigen.' }, 400);
    await D.sicherungAblegen(); // vorher den aktuellen Stand sichern
    await D.sicherungEinspielen(s); await D.protokoll(admin.email, 'Sicherung eingespielt'); await seitenNeu();
    return json({ ok: true });
  }
  if (p === '/protokoll' && m === 'GET') return json(await D.protokollLesen());
  if (p === '/aufraeumen' && m === 'POST') { const n = await D.aufraeumen(); return json({ ok: true, geloescht: n }); }

  return json({ fehler: 'Nicht gefunden.' }, 404);
}

// Prüft Inhalte auf SEO-/GEO-Lücken und Pflichtangaben – Grundlage für die laufende Optimierung
async function sichtbarkeitsCheck() {
  const [i, rs, bl] = await Promise.all([D.inhalt(), D.retreats(), D.bilder()]);
  const E = i.einstellungen; const befunde = [];
  const add = (stufe, bereich, text, wo) => befunde.push({ stufe, bereich, text, wo });
  if (!E.email) add('rot', 'Recht', 'Im Impressum fehlt eine E-Mail-Adresse (Pflicht nach § 5 ECG).', 'einstellungen');
  if (!E.rechtsform) add('gelb', 'Recht', 'Rechtsform ist nicht angegeben (Einzelunternehmen, GesbR, GmbH …).', 'einstellungen');
  if (!E.uid) add('gelb', 'Recht', 'UID-Nummer oder Hinweis „Kleinunternehmerin" fehlt im Impressum.', 'einstellungen');
  if (i.entwurf) add('gelb', 'Texte', 'Es sind noch Entwurfstexte aktiv. Bitte durch eigene Texte ersetzen und den Entwurfs-Hinweis ausschalten.', 'texte');
  for (const l of ['de', 'en']) for (const [k, , , g] of FELDER) {
    const v = i.texte[l][k] || '';
    if (!v.trim()) add('gelb', 'Texte', `${l.toUpperCase()}: Feld „${k}" (${g}) ist leer.`, 'texte');
    if (/\[.*folgt.*\]/i.test(v)) add('gelb', 'Texte', `${l.toUpperCase()}: Platzhalter in „${k}" ersetzen.`, 'texte');
    if (k.endsWith('.titel') && k.startsWith('seo.') && v.length > 62) add('gelb', 'Google', `${l.toUpperCase()}: Seitentitel „${k}" ist ${v.length} Zeichen lang (Google kürzt ab ca. 60).`, 'texte');
    if (k.endsWith('.beschreibung') && (v.length < 110 || v.length > 165)) add('gelb', 'Google', `${l.toUpperCase()}: Beschreibung „${k}" hat ${v.length} Zeichen (ideal 120–160).`, 'texte');
  }
  for (const [s, v] of Object.entries(E.bildplaetze)) if (!v) add('gelb', 'Bilder', `Bildplatz „${s}" zeigt noch die Zeichnung statt eines eigenen Fotos.`, 'bilder');
  for (const b of bl) { if (!b.alt?.de) add('gelb', 'Barrierefreiheit', `Bild „${b.name}" hat keinen Alternativtext (DE).`, 'bilder'); if (!b.alt?.en) add('hinweis', 'Barrierefreiheit', `Bild „${b.name}" hat keinen englischen Alternativtext.`, 'bilder'); }
  for (const r of rs.filter(x => x.veroeffentlicht)) {
    if (!r.bild) add('gelb', 'Reisen', `„${r.titel.de}" hat kein Foto.`, 'reisen');
    if ((r.text?.de || '').length < 400) add('gelb', 'Google/KI', `„${r.titel.de}": Beschreibung ist kurz (${(r.text?.de || '').length} Zeichen). Ab ca. 600 Zeichen mit Ort, Unterkunft und Tagesablauf wird die Seite von Google und KI-Assistenten besser verstanden.`, 'reisen');
    if (!r.ablauf?.de) add('gelb', 'Google/KI', `„${r.titel.de}": Tagesablauf fehlt.`, 'reisen');
    if (!r.leistungen?.de) add('gelb', 'Google/KI', `„${r.titel.de}": Enthaltene Leistungen fehlen.`, 'reisen');
    if (!r.text?.en || r.text.en === r.text.de) add('hinweis', 'Englisch', `„${r.titel.de}": englischer Text fehlt oder ist gleich wie der deutsche.`, 'reisen');
  }
  if (!E.gscToken) add('gelb', 'Google', 'Google Search Console ist noch nicht verbunden (Bestätigungscode unter Einstellungen eintragen).', 'einstellungen');
  if (!E.abschnitte.stimmen) add('hinweis', 'Vertrauen', 'Stimmen von Teilnehmerinnen sind ausgeblendet. Nach der ersten Reise Rückmeldungen freigeben und einschalten.', 'stimmen');
  if (!env('RESEND_API_KEY') && env('MAIL_TESTMODUS') !== '1') add('rot', 'Technik', 'Kein Mailversand eingerichtet (RESEND_API_KEY). Formulare werden gespeichert, aber nicht per Mail gemeldet; Anmeldecodes können nicht zugestellt werden.', 'technik');
  return { befunde, stand: jetzt() };
}

export const config = { path: '/api/*' };
