/* Verwaltung von anam-cara.at – alles, was Sabine und Nina selbst erledigen können */
(() => {
  const { esc, api, meldung, datum, zeit, $, $$, abmelden, verkleinern } = A;
  const main = $('#inhalt'), nav = $('#vnav');
  let S = { status: null, bilder: [], retreats: [], ungespeichert: false };
  const BEREICHE = [
    ['uebersicht', 'Übersicht'], ['anfragen', 'Anfragen'], ['buchungen', 'Buchungen & Zahlungen'], ['reisen', 'Reisen & Termine'], ['teilnehmerinnen', 'Teilnehmerinnen'],
    ['texte', 'Texte'], ['laufband', 'Laufband'], ['bilder', 'Bilder'], ['stimmen', 'Rückmeldungen'], ['newsletter', 'Newsletter'],
    ['sichtbarkeit', 'Besuche & Google'], ['einstellungen', 'Einstellungen'], ['sicherung', 'Sicherung'],
  ];
  const ARTEN = { anfrage: 'Allgemein', retreat: 'Reise', kennen: 'Kennenlernen', warte: 'Vormerkung', teilnehmerin: 'Teilnehmerin' };
  const absaetze = s => String(s || '').split(/\n\s*\n/).filter(x => x.trim()).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const kopf = (titel, rechts = '') => `<header><div><p class="vorzeile">Verwaltung</p><h1 class="h2">${titel}</h1></div><div class="reihe">${rechts}</div></header>`;
  const bildUrl = id => `/bild/${id}`;
  const merken = () => { S.ungespeichert = true; };
  addEventListener('beforeunload', e => { if (S.ungespeichert) { e.preventDefault(); e.returnValue = ''; } });
  const sicher = async (fn, ok) => { try { const r = await fn(); if (ok) meldung(ok); return r; } catch (e) { meldung(e.message, true); throw e; } };

  function navZeichnen(aktiv, zaehler = {}) {
    nav.innerHTML = BEREICHE.map(([k, t]) => `<a href="#${k}"${k === aktiv ? ' aria-current="page"' : ''}>${t}${zaehler[k] ? `<span class="zaehl">${zaehler[k]}</span>` : ''}</a>`).join('');
  }
  async function route() {
    const k = (location.hash.slice(1) || 'uebersicht').split('/')[0];
    if (S.ungespeichert && !confirm('Es gibt ungespeicherte Änderungen. Trotzdem wechseln?')) { history.back(); return; }
    S.ungespeichert = false;
    navZeichnen(k, S.zaehler);
    main.innerHTML = '<p class="leer">Wird geladen …</p>';
    try { await (ANSICHT[k] || ANSICHT.uebersicht)(); main.focus?.(); scrollTo(0, 0); }
    catch (e) { main.innerHTML = `<p class="formular__fehler">${esc(e.message)}</p>`; }
  }
  addEventListener('hashchange', route);

  // ===================== Übersicht =====================
  const ANSICHT = {};
  ANSICHT.uebersicht = async () => {
    const [u, chk] = await Promise.all([api('/v/uebersicht'), api('/v/check')]);
    S.zaehler = { anfragen: u.anfragenNeu, stimmen: u.stimmenOffen, buchungen: u.zahlungen.mahnbar }; navZeichnen('uebersicht', S.zaehler);
    const max = Math.max(1, ...u.besucheTage.map(t => t.n));
    const rot = chk.befunde.filter(b => b.stufe === 'rot');
    main.innerHTML = kopf(`Guten ${new Date().getHours() < 11 ? 'Morgen' : 'Tag'}, ${esc(S.status.ich.name.split(' ')[0])}`, `<a class="knopf knopf--leise" href="/" target="_blank" rel="noopener">Website ansehen</a>`) +
      (S.status.entwurf ? `<div class="hinweisbox">Auf der Website stehen noch <strong>Entwurfstexte</strong> nach dem Fragebogen. Unter <a href="#texte">Texte</a> durch eure eigenen ersetzen.</div>` : '') +
      (rot.length ? `<div class="hinweisbox"><strong>Vor dem Start erledigen:</strong><ul>${rot.map(b => `<li>${esc(b.text)}</li>`).join('')}</ul></div>` : '') +
      `<div class="raster3">
        <a class="karte" href="#anfragen"><span class="zahl">${u.anfragenNeu}</span><br><span class="zahl-beschr">neue Anfragen</span></a>
        <a class="karte" href="#buchungen"><span class="zahl ${u.zahlungen.ueberfaellig ? 'zahl--rot' : ''}">${(u.zahlungen.offen || 0).toLocaleString('de-AT', { style: 'currency', currency: 'EUR' })}</span><br><span class="zahl-beschr">offene Zahlungen${u.zahlungen.ueberfaellig ? ` · ${u.zahlungen.ueberfaellig} überfällig` : ''}</span></a>
        <a class="karte" href="#sichtbarkeit"><span class="zahl">${u.besuche30}</span><br><span class="zahl-beschr">Besuche in 30 Tagen</span></a>
      </div>
      <div class="raster2">
        <div class="karte"><h2 class="h3">Reisen</h2>${u.reisen.map(r => `<p><a href="#reisen"><strong>${esc(r.titel)}</strong></a><br><span class="klein">${esc(r.zeitraum)} · ${r.angemeldet} Teilnehmerin${r.angemeldet === 1 ? '' : 'nen'} mit Zugang · <span class="etikett">${esc(r.status)}</span></span></p>`).join('') || '<p class="leer">Noch keine Reise angelegt.</p>'}
          <p class="reihe"><a class="knopf knopf--klein" href="#reisen/neu">Neue Reise</a><a class="knopf knopf--leise knopf--klein" href="#teilnehmerinnen/einladen">Teilnehmerin einladen</a></p></div>
        <div class="karte"><h2 class="h3">Letzte Anfragen</h2>${u.anfragen.map(a => `<p><span class="etikett ${a.status === 'neu' ? 'etikett--neu' : ''}">${ARTEN[a.art] || a.art}</span> ${esc(a.name)} <span class="klein">· ${esc(zeit(a.zeit))}</span></p>`).join('') || '<p class="leer">Noch keine Anfragen.</p>'}<a class="pfeil" href="#anfragen">Alle Anfragen</a></div>
      </div>
      <div class="karte"><h2 class="h3">Besuche der letzten 30 Tage</h2><div class="balken" aria-hidden="true">${u.besucheTage.map(t => `<span title="${t.tag}: ${t.n}" data-h="${Math.round(t.n / max * 100)}"></span>`).join('')}</div><p class="klein">Gezählt ohne Cookies und ohne IP-Adressen. Details unter <a href="#sichtbarkeit">Besuche & Google</a>.</p></div>`;
    $$('.balken span').forEach(s => s.style.height = s.dataset.h + '%');
  };

  // ===================== Mail-Dialog (gemeinsam für Anfragen und Buchungen) =====================
  const euro = n => (Number(n) || 0).toLocaleString('de-AT', { style: 'currency', currency: 'EUR' });
  const ST_RE = { entwurf: ['Noch nicht versendet', ''], offen: ['Offen', 'etikett--neu'], teilbezahlt: ['Teilweise bezahlt', 'etikett--neu'], ueberfaellig: ['Überfällig', 'etikett--rot'], bezahlt: ['Bezahlt', 'etikett--gruen'], storniert: ['Storniert', ''] };
  async function mailDialog({ art, anfrageId, rechnungId, einladung, titel }) {
    const v = await api('/v/mail/vorschau', { art, anfrageId, rechnungId, einladung });
    return new Promise(fertig => {
      const d = document.createElement('dialog');
      d.innerHTML = `<div class="dlg-kopf"><strong>${esc(titel || 'Nachricht senden')}</strong><button type="button" class="knopf knopf--leise knopf--klein" data-zu>Schließen</button></div>
        <form class="dlg-rumpf" novalidate>
          ${v.beispiel ? '<div class="hinweisbox">Das ist ein <strong>Beispiel</strong> mit erfundener Adresse. Du kannst den Text ansehen und „im eigenen Mailprogramm“ testen; verschickt wird nichts.</div>' : ''}
          ${!v.mail && !v.beispiel ? '<div class="hinweisbox">Der automatische Mailversand ist noch nicht eingerichtet. Mit <strong>Im eigenen Mailprogramm öffnen</strong> geht die Nachricht trotzdem sofort hinaus und wird hier als gesendet vermerkt.</div>' : ''}
          <div class="feld"><label for="md-an">An</label><input id="md-an" name="an" type="email" value="${esc(v.an)}"></div>
          <div class="feld"><label for="md-b">Betreff</label><input id="md-b" name="betreff" value="${esc(v.betreff)}"></div>
          <div class="feld"><label for="md-t">Text <span class="feld__hinweis">kannst du frei anpassen</span></label><textarea id="md-t" name="text" rows="14">${esc(v.text)}</textarea></div>
          <p class="reihe">${v.mail && !v.beispiel ? '<button class="knopf" data-senden>Jetzt senden</button>' : ''}<a class="knopf ${v.mail && !v.beispiel ? 'knopf--leise' : ''}" data-mailto href="#">Im eigenen Mailprogramm öffnen</a><button type="button" class="knopf knopf--leise" data-zu>Nicht senden</button></p>
        </form>`;
      document.body.append(d); d.showModal();
      const f = $('form', d);
      const zu = ok => { d.close(); d.remove(); fertig(ok); };
      $$('[data-zu]', d).forEach(x => x.onclick = () => zu(false));
      const daten = manuell => ({ art, anfrageId, rechnungId, an: f.an.value, betreff: f.betreff.value, text: f.text.value, manuell });
      const sb = $('[data-senden]', d); if (sb) sb.onclick = async e => { e.preventDefault(); sb.disabled = true; try { await api('/v/mail/senden', daten(false)); meldung('Gesendet.'); zu(true); } catch (er) { sb.disabled = false; meldung(er.message, true); } };
      $('[data-mailto]', d).onclick = async e => {
        e.preventDefault();
        location.href = `mailto:${encodeURIComponent(f.an.value)}?subject=${encodeURIComponent(f.betreff.value)}&body=${encodeURIComponent(f.text.value)}`;
        if (v.beispiel) { meldung('Beispiel: nichts vermerkt.'); return zu(false); }
        if (confirm('Hast du die Nachricht in deinem Mailprogramm abgeschickt? Dann wird sie hier als gesendet vermerkt.')) { try { await api('/v/mail/senden', daten(true)); meldung('Als gesendet vermerkt.'); zu(true); } catch (er) { meldung(er.message, true); } }
      };
    });
  }

  // ===================== Anfragen =====================
  const ST_AN = [['neu', 'Neu'], ['in-arbeit', 'In Arbeit'], ['angenommen', 'Angenommen'], ['warteliste', 'Warteliste'], ['abgelehnt', 'Abgelehnt'], ['gebucht', 'Gebucht & bezahlt'], ['erledigt', 'Erledigt']];
  const stKlasse = st => ({ neu: 'etikett--neu', angenommen: 'etikett--gruen', gebucht: 'etikett--gruen', abgelehnt: 'etikett--rot' }[st] || '');
  ANSICHT.anfragen = async () => {
    const [liste, bu] = await Promise.all([api('/v/anfragen'), api('/v/buchungen')]); let filter = 'offen';
    const zeichnen = () => {
      const l = liste.filter(a => filter === 'alle' || (filter === 'offen' ? !['erledigt', 'abgelehnt', 'gebucht'].includes(a.status) : ARTEN[filter] ? a.art === filter : a.status === filter));
      main.innerHTML = kopf('Anfragen', liste.some(a => a.beispiel) ? '<button class="knopf knopf--leise knopf--klein" id="bsp-weg">Beispieldaten entfernen</button>' : '') +
        `<div class="gruppen" role="group" aria-label="Filter">${[['offen', 'Offen'], ['alle', 'Alle'], ['angenommen', 'Angenommen'], ['warteliste', 'Warteliste'], ...Object.entries(ARTEN)].map(([k, t]) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${t}</button>`).join('')}</div>` +
        (l.length ? l.map(a => {
          const re = bu.rechnungen.filter(r => r.anfrageId === a.id);
          const st = ST_AN.find(x => x[0] === (a.status || 'neu')) || ST_AN[0];
          const entscheidbar = !['teilnehmerin', 'warte'].includes(a.art);
          return `<article class="karte" data-id="${a.id}">
          <div class="reihe"><span class="etikett ${stKlasse(a.status)}">${st[1]}</span><span class="etikett">${ARTEN[a.art] || a.art}</span>${a.beispiel ? '<span class="etikett">Beispiel</span>' : ''}<strong>${esc(a.name)}</strong><span class="klein">${esc(zeit(a.zeit))}${a.sprache === 'en' ? ' · Englisch' : ''}</span></div>
          <p class="klein"><a href="mailto:${esc(a.email)}">${esc(a.email)}</a>${a.telefon ? ` · <a href="tel:${esc(a.telefon.replace(/[^+\d]/g, ''))}">${esc(a.telefon)}</a>` : ''}${a.retreat ? ' · ' + esc(a.retreat) : ''}${a.wann ? ' · Gesprächszeit: ' + esc(a.wann) : ''}${a.newsletter ? ' · möchte Newsletter' : ''}</p>
          ${a.nachricht ? `<div>${absaetze(a.nachricht)}</div>` : ''}
          ${entscheidbar ? `<p class="reihe entscheiden">
            <button class="knopf knopf--klein" data-ent="annehmen">Annehmen</button>
            <button class="knopf knopf--leise knopf--klein" data-ent="warteliste">Warteliste</button>
            <button class="knopf knopf--leise knopf--klein" data-ent="ablehnen">Ablehnen</button>
            <button class="knopf knopf--leise knopf--klein" data-mail="eingang">Eingang bestätigen</button></p>` : `<p class="reihe"><button class="knopf knopf--leise knopf--klein" data-mail="eingang">Eingang bestätigen</button></p>`}
          ${re.length ? `<div class="unterkarte"><strong>Rechnungen</strong>${re.map(r => `<p class="reihe"><span class="etikett ${ST_RE[r.status][1]}">${ST_RE[r.status][0]}</span><a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.nr)}</a><span>${euro(r.summe)}</span>${r.offen > 0 && !r.storniert ? `<span class="klein">offen ${euro(r.offen)}</span>` : ''}</p>`).join('')}<a class="pfeil" href="#buchungen">Zu Buchungen & Zahlungen</a></div>` : ''}
          <details class="klappe"><summary>Notiz, Status, Anschrift${a.verlauf?.length ? ' und Verlauf' : ''}</summary>
          <div class="raster3"><div class="feld"><label for="n-${a.id}">Interne Notiz</label><textarea id="n-${a.id}" rows="3" data-notiz>${esc(a.notiz || '')}</textarea></div>
          <div class="feld"><label for="ad-${a.id}">Rechnungsanschrift</label><textarea id="ad-${a.id}" rows="3" data-adresse placeholder="Name&#10;Straße&#10;PLZ Ort">${esc(a.adresse || '')}</textarea></div>
          <div class="feld"><label for="s-${a.id}">Status</label><select id="s-${a.id}" data-status>${ST_AN.map(([k, t]) => `<option value="${k}"${(a.status || 'neu') === k ? ' selected' : ''}>${t}</option>`).join('')}</select></div></div>
          ${a.verlauf?.length ? `<ul class="verlauf">${a.verlauf.slice().reverse().map(v => `<li><span class="klein">${esc(zeit(v.zeit))}</span> ${esc(v.was)}${v.wer ? ` <span class="klein">· ${esc(v.wer)}</span>` : ''}</li>`).join('')}</ul>` : ''}
          <p class="reihe"><button class="knopf knopf--leise knopf--klein" data-speichern>Speichern</button>${a.art !== 'teilnehmerin' ? `<a class="knopf knopf--leise knopf--klein" href="#teilnehmerinnen/einladen?name=${encodeURIComponent(a.name)}&email=${encodeURIComponent(a.email)}">Als Teilnehmerin einladen</a>` : ''}<button class="knopf knopf--leise knopf--klein" data-loeschen>Löschen</button></p></details>
        </article>`; }).join('') : '<p class="leer">Keine Anfragen in dieser Ansicht.</p>') +
        `<p class="klein">Anfragen werden nach ${'{frist}'} Monaten automatisch gelöscht (einstellbar unter Einstellungen). Rechnungen bleiben 7 Jahre erhalten.</p>`;
      $$('.gruppen button').forEach(x => x.onclick = () => { filter = x.dataset.f; zeichnen(); });
      const weg = $('#bsp-weg'); if (weg) weg.onclick = () => confirm('Alle Beispiel-Anfragen und Beispiel-Rechnungen entfernen?') && sicher(async () => { await api('/v/beispiele/entfernen', {}); ANSICHT.anfragen(); }, 'Beispieldaten entfernt.');
      $$('article[data-id]').forEach(art => {
        const a = liste.find(x => x.id === art.dataset.id);
        const neuLaden = async () => { const [l2, b2] = await Promise.all([api('/v/anfragen'), api('/v/buchungen')]); liste.splice(0, liste.length, ...l2); bu.rechnungen = b2.rechnungen; zeichnen(); };
        $('[data-speichern]', art).onclick = () => sicher(async () => { await api('/v/anfrage', { id: a.id, status: $('[data-status]', art).value, notiz: $('[data-notiz]', art).value, adresse: $('[data-adresse]', art).value }); await neuLaden(); }, 'Gespeichert.');
        $('[data-loeschen]', art).onclick = () => confirm(`Anfrage von ${a.name} endgültig löschen?`) && sicher(async () => { await api('/v/anfrage/loeschen', { id: a.id }); liste.splice(liste.indexOf(a), 1); zeichnen(); }, 'Gelöscht.');
        $$('[data-mail]', art).forEach(x => x.onclick = async () => { if (await mailDialog({ art: x.dataset.mail, anfrageId: a.id, titel: 'Eingangsbestätigung an ' + a.name })) neuLaden(); });
        $$('[data-ent]', art).forEach(x => x.onclick = () => entscheiden(a, x.dataset.ent, bu, $('[data-adresse]', art).value).then(ok => ok && neuLaden()));
      });
      api('/v/inhalt').then(i => { const p = $$('.klein', main).pop(); if (p) p.textContent = p.textContent.replace('{frist}', i.einstellungen.fristen.anfragenMonate); });
    };
    zeichnen();
  };

  // Annehmen / Warteliste / Ablehnen – mit Zusage, Rechnung über die Anzahlung und Zugang zum Teilnehmerinnen-Bereich
  function entscheiden(a, ent, bu, adresse) {
    return new Promise(fertig => {
      const ret = bu.retreats; const E = bu.einstellungen;
      const d = document.createElement('dialog');
      const titel = { annehmen: `Anfrage von ${a.name} annehmen`, warteliste: `${a.name} auf die Warteliste setzen`, ablehnen: `Anfrage von ${a.name} ablehnen` }[ent];
      d.innerHTML = `<div class="dlg-kopf"><strong>${esc(titel)}</strong><button type="button" class="knopf knopf--leise knopf--klein" data-zu>Abbrechen</button></div>
        <form class="dlg-rumpf" novalidate>
          ${ent === 'annehmen' ? `<div class="raster2">
            <div class="feld"><label for="e-r">Reise</label><select id="e-r" name="retreatId">${ret.map(r => `<option value="${esc(r.id)}" data-preis="${r.preisBetrag}"${r.id === a.retreatId ? ' selected' : ''}>${esc(r.titel)}</option>`).join('')}</select></div>
            <div class="feld"><label for="e-p">Reisepreis in € <span class="feld__hinweis">Anzahlung ${E.anzahlungProzent} % wird berechnet</span></label><input id="e-p" name="preis" inputmode="decimal" value="${ret.find(r => r.id === a.retreatId)?.preisBetrag || ret[0]?.preisBetrag || ''}"></div></div>
            <div class="feld"><label for="e-a">Rechnungsanschrift</label><textarea id="e-a" name="adresse" rows="3" placeholder="${esc(a.name)}&#10;Straße&#10;PLZ Ort">${esc(adresse || a.adresse || '')}</textarea></div>
            <label class="haken"><input type="checkbox" name="rechnung" checked><span>Rechnung über die Anzahlung erstellen und in der Zusage verlinken</span></label>
            <label class="haken"><input type="checkbox" name="zugang" ${a.beispiel ? 'disabled' : 'checked'}><span>Zugang zum persönlichen Bereich anlegen (Reiseinfos, Packliste, Unterlagen, Rechnungen)</span></label>
            <label class="haken"><input type="checkbox" name="mail" checked><span>Danach die Zusage-Nachricht öffnen</span></label>`
          : `<p>${ent === 'ablehnen' ? 'Die Anfrage wird als abgelehnt markiert. Danach kannst du eine freundliche Absage schicken.' : 'Die Anfrage kommt auf die Warteliste. Wird ein Platz frei, findest du sie unter dem Filter „Warteliste“.'}</p>
            <label class="haken"><input type="checkbox" name="mail" checked><span>Danach die Nachricht an ${esc(a.name)} öffnen</span></label>`}
          <p class="reihe"><button class="knopf">${{ annehmen: 'Annehmen', warteliste: 'Auf Warteliste', ablehnen: 'Ablehnen' }[ent]}</button></p>
        </form>`;
      document.body.append(d); d.showModal();
      const f = $('form', d); const zu = ok => { d.close(); d.remove(); fertig(ok); };
      $('[data-zu]', d).onclick = () => zu(false);
      if (f.retreatId) f.retreatId.onchange = () => { f.preis.value = f.retreatId.selectedOptions[0].dataset.preis || ''; };
      f.onsubmit = async e => {
        e.preventDefault();
        try {
          const r = await api('/v/anfrage/entscheiden', { id: a.id, entscheidung: ent, retreatId: f.retreatId?.value, preis: f.preis?.value.replace(/\./g, '').replace(',', '.'), adresse: f.adresse?.value, rechnung: f.rechnung?.checked, zugang: f.zugang?.checked });
          const mailen = f.mail.checked; zu(true);
          meldung({ annehmen: 'Angenommen.', warteliste: 'Auf der Warteliste.', ablehnen: 'Abgelehnt.' }[ent] + (r.zugangSchonDa ? ' Sie hat bereits einen Zugang; die Reise wurde ergänzt.' : ''));
          if (mailen) await mailDialog({ art: { annehmen: 'zusage', warteliste: 'warteliste', ablehnen: 'absage' }[ent], anfrageId: a.id, rechnungId: r.rechnungId, einladung: r.einladung, titel: { annehmen: 'Zusage', warteliste: 'Wartelisten-Info', ablehnen: 'Absage' }[ent] + ' an ' + a.name });
        } catch (er) { meldung(er.message, true); }
      };
    });
  }

  // ===================== Buchungen & Zahlungen =====================
  ANSICHT.buchungen = async () => {
    const bu = await api('/v/buchungen'); const E = bu.einstellungen; let filter = 'aktiv';
    const zeichnen = () => {
      const R = bu.rechnungen;
      const aktiv = R.filter(r => !r.storniert && r.status !== 'entwurf');
      const offen = aktiv.filter(r => r.offen > 0).reduce((s, r) => s + r.offen, 0);
      const ueber = aktiv.filter(r => r.status === 'ueberfaellig');
      const bezahlt = R.filter(r => !r.storniert).reduce((s, r) => s + r.bezahlt, 0);
      const mahnbar = aktiv.filter(r => r.naechste?.jetzt);
      const l = R.filter(r => filter === 'alle' || (filter === 'aktiv' ? !r.storniert && r.status !== 'bezahlt' : r.status === filter));
      main.innerHTML = kopf('Buchungen & Zahlungen', `<button class="knopf knopf--klein" id="neu">Neue Rechnung</button>`) +
        (!E.iban ? '<div class="hinweisbox">Bitte unten unter <strong>Rechnungsangaben</strong> die Bankverbindung eintragen – sie erscheint auf jeder Rechnung und in jeder Erinnerung.</div>' : '') +
        (!bu.mail ? '<div class="hinweisbox">Der automatische Mailversand ist noch nicht eingerichtet. Rechnungen, Erinnerungen und Mahnungen kannst du trotzdem mit einem Klick in deinem eigenen Mailprogramm verschicken.</div>' : '') +
        `<div class="raster3">
          <div class="karte"><span class="zahl">${euro(offen)}</span><br><span class="zahl-beschr">offen</span></div>
          <div class="karte"><span class="zahl ${ueber.length ? 'zahl--rot' : ''}">${ueber.length}</span><br><span class="zahl-beschr">überfällig${mahnbar.length ? ` · ${mahnbar.length} zum Erinnern fällig` : ''}</span></div>
          <div class="karte"><span class="zahl">${euro(bezahlt)}</span><br><span class="zahl-beschr">eingegangen</span></div></div>
        <div class="gruppen" role="group" aria-label="Filter">${[['aktiv', 'Offen & überfällig'], ['ueberfaellig', 'Überfällig'], ['entwurf', 'Nicht versendet'], ['bezahlt', 'Bezahlt'], ['storniert', 'Storniert'], ['alle', 'Alle']].map(([k, t]) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${t}</button>`).join('')}</div>` +
        (l.length ? l.map(r => `<article class="karte" data-id="${r.id}">
          <div class="reihe"><span class="etikett ${ST_RE[r.status][1]}">${ST_RE[r.status][0]}</span>${r.beispiel ? '<span class="etikett">Beispiel</span>' : ''}<strong>${esc(r.name)}</strong><span class="klein">${esc(r.nr)} · ${esc(datum(r.datum))}${r.retreatTitel ? ' · ' + esc(r.retreatTitel) : ''}</span></div>
          <div class="raster3 zahlen-zeile"><div><span class="zahl-beschr">Betrag</span><br><strong>${euro(r.summe)}</strong>${r.gebuehren ? ` <span class="klein">+ ${euro(r.gebuehren)} Mahnspesen</span>` : ''}</div>
            <div><span class="zahl-beschr">Bezahlt</span><br><strong>${euro(r.bezahlt)}</strong></div>
            <div><span class="zahl-beschr">${r.offen > 0 ? 'Offen · fällig' : 'Offen'}</span><br><strong class="${r.status === 'ueberfaellig' ? 'text-rot' : ''}">${euro(Math.max(0, r.offen))}</strong>${r.offen > 0 ? ` <span class="klein">· ${esc(datum(r.frist))}${r.tageUeber ? ` · ${r.tageUeber} Tage drüber` : ''}</span>` : ''}</div></div>
          ${r.letzteStufe ? `<p class="klein">Zuletzt: ${esc({ erinnerung: 'Zahlungserinnerung', mahnung1: '1. Mahnung', mahnung2: '2. Mahnung' }[r.letzteStufe.stufe])} am ${esc(datum(r.letzteStufe.zeit))}</p>` : ''}
          ${r.naechste && !r.storniert ? `<p class="klein">${r.naechste.jetzt ? '<strong>Jetzt fällig:</strong>' : 'Nächster Schritt ab ' + esc(datum(r.naechste.faelligAb)) + ':'} ${esc(r.naechste.name)}</p>` : ''}
          <p class="reihe">
            <a class="knopf knopf--leise knopf--klein" href="${esc(r.link)}" target="_blank" rel="noopener">Ansehen / PDF</a>
            ${!r.storniert && r.offen > 0 ? `<button class="knopf knopf--klein" data-mail="rechnung">${r.versandt ? 'Erneut senden' : 'Rechnung senden'}</button><button class="knopf knopf--leise knopf--klein" data-zahlung>Zahlung erfassen</button>` : ''}
            ${r.naechste && !r.storniert ? `<button class="knopf ${r.naechste.jetzt ? '' : 'knopf--leise'} knopf--klein" data-mail="${r.naechste.stufe}">${esc(r.naechste.name)} senden</button>` : ''}
            ${r.bezahlt > 0 ? '<button class="knopf knopf--leise knopf--klein" data-mail="zahlung">Zahlung bestätigen</button>' : ''}
          </p>
          <details class="klappe"><summary>Bearbeiten, Zahlungen und Verlauf</summary>
            <div class="raster2"><div class="feld"><label for="ra-${r.id}">Anschrift</label><textarea id="ra-${r.id}" rows="3" data-adresse>${esc(r.adresse)}</textarea></div>
            <div><div class="feld"><label for="rf-${r.id}">Zahlbar bis</label><input id="rf-${r.id}" type="date" data-faellig value="${esc(r.faellig)}"></div><div class="feld"><label for="rm-${r.id}">E-Mail</label><input id="rm-${r.id}" type="email" data-email value="${esc(r.email)}"></div></div></div>
            ${!r.versandt ? `<div class="feld"><label>Positionen <span class="feld__hinweis">eine pro Zeile: Text | Betrag</span></label><textarea rows="3" data-pos>${esc(r.positionen.map(p => p.text + ' | ' + String(p.betrag).replace('.', ',')).join('\n'))}</textarea></div>` : '<p class="klein">Versendete Rechnungen sind im Betrag gesperrt. Für Korrekturen stornieren und neu erstellen.</p>'}
            ${r.zahlungen?.length ? `<table class="tabelle"><tr><th>Eingang</th><th>Betrag</th><th>Notiz</th><th></th></tr>${r.zahlungen.map(z => `<tr><td>${esc(datum(z.datum))}</td><td>${euro(z.betrag)}</td><td>${esc(z.notiz || '')}</td><td><button class="knopf knopf--leise knopf--klein" data-zweg="${esc(z.id)}">Entfernen</button></td></tr>`).join('')}</table>` : ''}
            ${r.verlauf?.length ? `<ul class="verlauf">${r.verlauf.slice().reverse().map(v => `<li><span class="klein">${esc(zeit(v.zeit))}</span> ${esc(v.was)}${v.wer ? ` <span class="klein">· ${esc(v.wer)}</span>` : ''}</li>`).join('')}</ul>` : ''}
            <p class="reihe"><button class="knopf knopf--leise knopf--klein" data-speichern>Speichern</button>${!r.versandt && !r.storniert ? '<button class="knopf knopf--leise knopf--klein" data-versandt>Als versendet markieren</button>' : ''}${!r.storniert ? '<button class="knopf knopf--leise knopf--klein" data-storno>Stornieren</button>' : ''}${r.beispiel ? '<button class="knopf knopf--leise knopf--klein" data-loeschen>Beispiel löschen</button>' : ''}</p>
          </details></article>`).join('') : '<p class="leer">Keine Rechnungen in dieser Ansicht.</p>') +
        `<form class="karte" id="re-eins" novalidate><h2 class="h3">Rechnungsangaben & Mahnwesen</h2>
          <div class="raster2">
            <div class="feld"><label for="ee-a">Rechnungsausstellerin</label><input id="ee-a" data-e="aussteller" value="${esc(E.aussteller)}"></div>
            <div class="feld"><label for="ee-m">E-Mail für Antworten</label><input id="ee-m" data-e="email" value="${esc(E.email)}"></div>
            <div class="feld"><label for="ee-ad">Anschrift</label><textarea id="ee-ad" rows="3" data-e="adresse">${esc(E.adresse)}</textarea></div>
            <div><div class="feld"><label for="ee-u">UID-Nummer <span class="feld__hinweis">falls vorhanden</span></label><input id="ee-u" data-e="uid" value="${esc(E.uid)}"></div><div class="feld"><label for="ee-p">Nummernkreis-Präfix</label><input id="ee-p" data-e="praefix" value="${esc(E.praefix)}"></div></div>
            <div class="feld"><label for="ee-i">IBAN</label><input id="ee-i" data-e="iban" value="${esc(E.iban)}" placeholder="AT.."></div>
            <div class="raster2"><div class="feld"><label for="ee-b">BIC</label><input id="ee-b" data-e="bic" value="${esc(E.bic)}"></div><div class="feld"><label for="ee-bk">Bank</label><input id="ee-bk" data-e="bank" value="${esc(E.bank)}"></div></div>
            <div class="feld"><label for="ee-ust">Steuerhinweis auf der Rechnung</label><textarea id="ee-ust" rows="2" data-e="ustHinweis">${esc(E.ustHinweis)}</textarea></div>
            <div class="feld"><label for="ee-f">Schlusssatz</label><textarea id="ee-f" rows="2" data-e="fuss">${esc(E.fuss)}</textarea></div>
          </div>
          <div class="raster3">
            <div class="feld"><label for="ee-z">Zahlungsziel (Tage)</label><input id="ee-z" type="number" min="0" data-n="zielTage" value="${E.zielTage}"></div>
            <div class="feld"><label for="ee-az">Anzahlung (%)</label><input id="ee-az" type="number" min="0" max="100" data-n="anzahlungProzent" value="${E.anzahlungProzent}"></div>
            <div class="feld"><label for="ee-fr">Neue Frist nach Mahnung (Tage)</label><input id="ee-fr" type="number" min="1" data-n="fristTage" value="${E.fristTage}"></div>
            <div class="feld"><label for="ee-e">Erinnerung … Tage nach Fälligkeit</label><input id="ee-e" type="number" min="0" data-n="erinnerungTage" value="${E.erinnerungTage}"></div>
            <div class="feld"><label for="ee-m1">1. Mahnung nach … Tagen</label><input id="ee-m1" type="number" min="0" data-n="mahnung1Tage" value="${E.mahnung1Tage}"></div>
            <div class="feld"><label for="ee-m2">2. Mahnung nach … Tagen</label><input id="ee-m2" type="number" min="0" data-n="mahnung2Tage" value="${E.mahnung2Tage}"></div>
            <div class="feld"><label for="ee-g1">Mahnspesen 1. Mahnung (€)</label><input id="ee-g1" type="number" min="0" data-n="gebuehr1" value="${E.gebuehr1}"></div>
            <div class="feld"><label for="ee-g2">Mahnspesen 2. Mahnung (€)</label><input id="ee-g2" type="number" min="0" data-n="gebuehr2" value="${E.gebuehr2}"></div>
          </div>
          <label class="haken"><input type="checkbox" id="ee-auto" ${E.auto ? 'checked' : ''}><span>Erinnerungen und Mahnungen automatisch per Mail senden (jede Nacht, höchstens eine Stufe pro Tag; nur wenn der Mailversand eingerichtet ist)</span></label>
          <p class="reihe"><button class="knopf">Rechnungsangaben speichern</button></p></form>`;
      $$('.gruppen button').forEach(x => x.onclick = () => { filter = x.dataset.f; zeichnen(); });
      const neuLaden = async () => { Object.assign(bu, await api('/v/buchungen')); zeichnen(); };
      $('#neu').onclick = () => neueRechnung(bu).then(ok => ok && neuLaden());
      $('#re-eins').onsubmit = async e => { e.preventDefault(); const d = { auto: $('#ee-auto').checked }; $$('[data-e]', e.target).forEach(x => d[x.dataset.e] = x.value); $$('[data-n]', e.target).forEach(x => d[x.dataset.n] = x.value); await sicher(() => api('/v/buchungen/einstellungen', d), 'Gespeichert.'); neuLaden(); };
      $$('article[data-id]').forEach(art => {
        const r = R.find(x => x.id === art.dataset.id); const id = r.id;
        $$('[data-mail]', art).forEach(x => x.onclick = async () => { if (await mailDialog({ art: x.dataset.mail, rechnungId: id, anfrageId: r.anfrageId || undefined, titel: x.textContent.trim() + ' · ' + r.name })) neuLaden(); });
        const z = $('[data-zahlung]', art); if (z) z.onclick = () => zahlungDialog(r).then(ok => ok && neuLaden());
        $('[data-speichern]', art).onclick = () => sicher(async () => {
          const pos = $('[data-pos]', art)?.value.split('\n').map(x => x.split('|')).filter(x => x[0].trim()).map(([t, b]) => ({ text: t.trim(), betrag: Number(String(b || '0').trim().replace(/\./g, '').replace(',', '.')) }));
          await api('/v/rechnung/aendern', { id, adresse: $('[data-adresse]', art).value, faellig: $('[data-faellig]', art).value, email: $('[data-email]', art).value, positionen: pos }); await neuLaden(); }, 'Gespeichert.');
        const v = $('[data-versandt]', art); if (v) v.onclick = () => sicher(async () => { await api('/v/rechnung/versandt', { id }); await neuLaden(); }, 'Vermerkt.');
        const st = $('[data-storno]', art); if (st) st.onclick = () => confirm(`Rechnung ${r.nr} stornieren? Sie bleibt zur Aufbewahrung erhalten.`) && sicher(async () => { await api('/v/rechnung/storno', { id }); await neuLaden(); }, 'Storniert.');
        const lo = $('[data-loeschen]', art); if (lo) lo.onclick = () => sicher(async () => { await api('/v/rechnung/loeschen', { id }); await neuLaden(); }, 'Gelöscht.');
        $$('[data-zweg]', art).forEach(x => x.onclick = () => confirm('Diese Zahlung entfernen?') && sicher(async () => { await api('/v/rechnung/zahlung/loeschen', { id, zid: x.dataset.zweg }); await neuLaden(); }, 'Entfernt.'));
      });
    };
    zeichnen();
  };
  function zahlungDialog(r) {
    return new Promise(fertig => {
      const d = document.createElement('dialog');
      d.innerHTML = `<div class="dlg-kopf"><strong>Zahlung erfassen · ${esc(r.nr)} · ${esc(r.name)}</strong><button type="button" class="knopf knopf--leise knopf--klein" data-zu>Abbrechen</button></div>
        <form class="dlg-rumpf" novalidate><div class="raster3">
          <div class="feld"><label for="z-b">Betrag in €</label><input id="z-b" name="betrag" inputmode="decimal" value="${String(r.offen).replace('.', ',')}"></div>
          <div class="feld"><label for="z-d">Eingegangen am</label><input id="z-d" name="datum" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
          <div class="feld"><label for="z-n">Notiz</label><input id="z-n" name="notiz" placeholder="z. B. Überweisung"></div></div>
          <label class="haken"><input type="checkbox" name="mail" checked><span>Danach eine Zahlungsbestätigung öffnen</span></label>
          <p class="reihe"><button class="knopf">Zahlung speichern</button></p></form>`;
      document.body.append(d); d.showModal();
      const f = $('form', d); const zu = ok => { d.close(); d.remove(); fertig(ok); };
      $('[data-zu]', d).onclick = () => zu(false);
      f.onsubmit = async e => { e.preventDefault(); try { await api('/v/rechnung/zahlung', { id: r.id, betrag: f.betrag.value.replace(/\.(?=\d{3})/g, ''), datum: f.datum.value, notiz: f.notiz.value }); const m = f.mail.checked; zu(true); meldung('Zahlung erfasst.'); if (m) await mailDialog({ art: 'zahlung', rechnungId: r.id, titel: 'Zahlungsbestätigung an ' + r.name }); } catch (er) { meldung(er.message, true); } };
    });
  }
  function neueRechnung(bu) {
    return new Promise(fertig => {
      const d = document.createElement('dialog');
      d.innerHTML = `<div class="dlg-kopf"><strong>Neue Rechnung</strong><button type="button" class="knopf knopf--leise knopf--klein" data-zu>Abbrechen</button></div>
        <form class="dlg-rumpf" novalidate><div class="raster2">
          <div class="feld"><label for="nr-n">Name</label><input id="nr-n" name="name" required></div>
          <div class="feld"><label for="nr-m">E-Mail</label><input id="nr-m" name="email" type="email"></div>
          <div class="feld"><label for="nr-a">Anschrift</label><textarea id="nr-a" name="adresse" rows="3"></textarea></div>
          <div><div class="feld"><label for="nr-r">Reise</label><select id="nr-r" name="retreatId">${bu.retreats.map(r => `<option value="${esc(r.id)}" data-preis="${r.preisBetrag}">${esc(r.titel)}</option>`).join('')}<option value="">– keine –</option></select></div>
          <div class="feld"><label for="nr-art">Art</label><select id="nr-art" name="art"><option value="anzahlung">Anzahlung (${bu.einstellungen.anzahlungProzent} %)</option><option value="rest">Restzahlung</option><option value="gesamt">Gesamtbetrag</option></select></div>
          <div class="feld"><label for="nr-p">Reisepreis in €</label><input id="nr-p" name="preis" inputmode="decimal" value="${bu.retreats[0]?.preisBetrag || ''}"></div></div></div>
          <p class="reihe"><button class="knopf">Rechnung erstellen</button></p></form>`;
      document.body.append(d); d.showModal();
      const f = $('form', d); const zu = ok => { d.close(); d.remove(); fertig(ok); };
      $('[data-zu]', d).onclick = () => zu(false);
      f.retreatId.onchange = () => { f.preis.value = f.retreatId.selectedOptions[0].dataset.preis || ''; };
      f.onsubmit = async e => { e.preventDefault(); if (!f.name.value.trim()) return f.name.focus(); try { await api('/v/rechnung/neu', { name: f.name.value, email: f.email.value, adresse: f.adresse.value, retreatId: f.retreatId.value, art: f.art.value, preis: f.preis.value.replace(/\./g, '').replace(',', '.') }); zu(true); meldung('Rechnung erstellt. Sie ist noch nicht versendet.'); } catch (er) { meldung(er.message, true); } };
    });
  }

  // ===================== Reisen =====================
  const leer = () => ({ id: '', slug: '', veroeffentlicht: false, status: 'geplant', von: '', bis: '', plaetze: '', bild: '', titel: { de: '', en: '' }, ort: { de: '', en: '' }, kurz: { de: '', en: '' }, text: { de: '', en: '' }, ablauf: { de: '', en: '' }, leistungen: { de: '', en: '' }, preis: { de: 'auf Anfrage', en: 'on request' }, infos: '', packliste: [], dokumente: [], nachrichten: [] });
  const zwei = (r, f, label, typ = 'zeile', hilfe = '') => `<div class="textfeld"><label>${label}</label>${hilfe ? `<p class="klein">${hilfe}</p>` : ''}<div class="zwei-sprachen">${['de', 'en'].map(l => `<div><span class="sprache">${l === 'de' ? 'DEUTSCH' : 'ENGLISCH'}</span>${typ === 'zeile' ? `<input data-f="${f}" data-l="${l}" value="${esc(r[f]?.[l] || '')}">` : `<textarea data-f="${f}" data-l="${l}" rows="${typ === 'lang' ? 7 : 3}">${esc(r[f]?.[l] || '')}</textarea>`}</div>`).join('')}</div></div>`;
  const bildWahl = (id, name) => `<div class="bildwahl" data-bildwahl="${name}">${id ? `<img src="${bildUrl(id)}" alt="">` : '<span class="platz"></span>'}<select data-bild="${name}"><option value="">Kein Foto</option>${S.bilder.map(b => `<option value="${b.id}"${b.id === id ? ' selected' : ''}>${esc(b.titel || b.name)}${!b.titel && b.alt?.de ? ' – ' + esc(b.alt.de.slice(0, 40)) : ''}</option>`).join('')}</select></div>`;

  ANSICHT.reisen = async () => {
    [S.retreats, S.bilder] = await Promise.all([api('/v/retreats'), api('/v/bilder')]);
    let offen = location.hash === '#reisen/neu' ? (S.retreats.push(leer()), S.retreats.length - 1) : 0;
    const zeichnen = () => {
      const r = S.retreats[offen];
      main.innerHTML = kopf('Reisen & Termine', '<button class="knopf knopf--leise" id="neu">Neue Reise</button>') +
        `<div class="gruppen">${S.retreats.map((x, i) => `<button type="button" data-i="${i}" aria-pressed="${i === offen}">${esc(x.titel.de || 'Neue Reise')}${x.von ? ' · ' + x.von.slice(0, 4) : ''}</button>`).join('')}</div>` +
        (r ? `<form class="karte" id="reise" novalidate>
          <div class="raster3">
            <div class="feld"><label for="r-von">Beginn</label><input id="r-von" type="date" data-k="von" value="${esc(r.von)}"></div>
            <div class="feld"><label for="r-bis">Ende</label><input id="r-bis" type="date" data-k="bis" value="${esc(r.bis)}"></div>
            <div class="feld"><label for="r-st">Status</label><select id="r-st" data-k="status">${[['geplant', 'In Planung'], ['buchbar', 'Plätze frei'], ['ausgebucht', 'Ausgebucht'], ['vorbei', 'Vergangen']].map(([k, t]) => `<option value="${k}"${r.status === k ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
            <div class="feld"><label for="r-pl">Plätze <span class="feld__hinweis">freiwillig, z. B. „12" oder „noch 3"</span></label><input id="r-pl" data-k="plaetze" value="${esc(r.plaetze)}"></div>
            <div class="feld"><label for="r-sl">Adresse der Seite</label><input id="r-sl" data-k="slug" value="${esc(r.slug)}" placeholder="wird aus dem Titel gebildet"></div>
            <label class="haken"><input type="checkbox" data-k="veroeffentlicht" ${r.veroeffentlicht ? 'checked' : ''}><span>Auf der Website zeigen</span></label>
          </div>
          <div class="feld"><label>Foto der Reise <span class="feld__hinweis">erstes Bild im Bogen</span></label>${bildWahl(r.bild, 'reise')}</div>
          <div class="feld"><label>Weitere Fotos im Bildbogen <span class="feld__hinweis">wechseln wie die Impressionen; Tempo unter „Bilder"</span></label>
            <div class="bogenwahl">${S.bilder.length ? S.bilder.map(b => `<label class="bogenwahl__bild"><input type="checkbox" data-bogen value="${b.id}" ${(r.bilder || []).includes(b.id) ? 'checked' : ''}><img src="${bildUrl(b.id)}" alt="" loading="lazy"><span>${esc(b.alt?.de || b.name)}</span></label>`).join('') : '<p class="klein">Zuerst unter „Bilder" Fotos hochladen.</p>'}</div></div>
          ${zwei(r, 'titel', 'Titel')}${zwei(r, 'ort', 'Ort')}${zwei(r, 'preis', 'Preis', 'zeile', 'zum Beispiel „ab 2.890 € im Doppelzimmer" oder „auf Anfrage"')}
          ${zwei(r, 'kurz', 'Kurzbeschreibung (erscheint auf Karten und bei Google)', 'kurz')}
          ${zwei(r, 'text', 'Ausführliche Beschreibung', 'lang', 'Leerzeile = neuer Absatz. Ort, Unterkunft, Stimmung und was die Woche besonders macht.')}
          ${zwei(r, 'ablauf', 'Tagesablauf', 'lang', 'Eine Zeile pro Tag, z. B. „Tag 1 – Ankunft in Shannon, gemeinsames Abendessen"')}
          ${zwei(r, 'leistungen', 'Enthaltene Leistungen', 'lang', 'Eine Zeile pro Leistung')}
          <h2 class="h3">Nur für Teilnehmerinnen</h2>
          <div class="feld"><label for="r-in">Reiseinfos (Treffpunkt, Anreise, Ablauf)</label><textarea id="r-in" rows="6" data-k="infos">${esc(r.infos)}</textarea></div>
          <div class="feld"><label for="r-pk">Packliste <span class="feld__hinweis">eine Zeile pro Gegenstand</span></label><textarea id="r-pk" rows="6" data-k="packliste">${esc((r.packliste || []).join('\n'))}</textarea></div>
          <div class="leiste">${r.id ? '<button type="button" class="knopf knopf--leise" id="loe">Reise löschen</button>' : ''}<button class="knopf" type="submit">Reise speichern</button></div>
        </form>
        ${r.id ? `<div class="raster2"><div class="karte"><h2 class="h3">Unterlagen (PDF)</h2><div id="doks">${dokListe(r)}</div><label class="knopf knopf--leise knopf--klein">PDF hochladen<input type="file" accept="application/pdf" id="pdf" hidden></label><p class="klein">Höchstens 4 MB. Sichtbar nur für Teilnehmerinnen dieser Reise.</p></div>
          <div class="karte"><h2 class="h3">Nachricht an die Teilnehmerinnen</h2><form id="nachr" novalidate><div class="feld"><label for="nt" class="sr">Nachricht</label><textarea id="nt" rows="4" placeholder="z. B. Der Treffpunkt am Flughafen hat sich geändert …"></textarea></div><label class="haken"><input type="checkbox" id="nm" checked><span>Zusätzlich per E-Mail verschicken</span></label><button class="knopf knopf--hell knopf--klein">Veröffentlichen</button></form>
          ${(r.nachrichten || []).slice().reverse().map(n => `<div class="nachricht"><small>${esc(zeit(n.zeit))} · ${esc(n.von)} · <a href="#" data-nl="${n.id}">entfernen</a></small>${absaetze(n.text)}</div>`).join('')}</div></div>` : '<p class="klein">Unterlagen und Nachrichten sind nach dem ersten Speichern möglich.</p>'}` : '<p class="leer">Noch keine Reise.</p>');
      $$('.gruppen button').forEach(b => b.onclick = () => { if (S.ungespeichert && !confirm('Ungespeicherte Änderungen verwerfen?')) return; S.ungespeichert = false; offen = +b.dataset.i; zeichnen(); });
      $('#neu').onclick = () => { S.retreats.push(leer()); offen = S.retreats.length - 1; zeichnen(); };
      if (!r) return;
      const f = $('#reise'); f.oninput = merken;
      $('[data-bild="reise"]', f).onchange = e => { const w = e.target.closest('.bildwahl'); w.firstElementChild.outerHTML = e.target.value ? `<img src="${bildUrl(e.target.value)}" alt="">` : '<span class="platz"></span>'; merken(); };
      f.onsubmit = async e => {
        e.preventDefault(); lesen(f, r);
        if (!r.titel.de || !r.von) return meldung('Bitte mindestens deutschen Titel und Beginn angeben.', true);
        const res = await sicher(() => api('/v/retreats', { liste: S.retreats }), 'Reise gespeichert. Die Website ist aktualisiert.');
        S.retreats = res.liste; S.ungespeichert = false; zeichnen();
      };
      $('#loe') && ($('#loe').onclick = async () => {
        if (!confirm(`„${r.titel.de}" wirklich löschen? Die Seite verschwindet von der Website.`)) return;
        S.retreats.splice(offen, 1); const res = await sicher(() => api('/v/retreats', { liste: S.retreats }), 'Gelöscht.'); S.retreats = res.liste; offen = 0; zeichnen();
      });
      $('#pdf') && ($('#pdf').onchange = async e => {
        const d = e.target.files[0]; if (!d) return;
        const res = await sicher(() => api('/v/dokument?rid=' + r.id, d, { typ: 'application/pdf', kopf: { 'x-name': encodeURIComponent(d.name) } }), 'Unterlage hochgeladen.');
        r.dokumente = res.dokumente; $('#doks').innerHTML = dokListe(r); dokBinden(r);
      });
      dokBinden(r);
      $('#nachr') && ($('#nachr').onsubmit = async e => {
        e.preventDefault(); const t = $('#nt').value.trim(); if (!t) return;
        const res = await sicher(() => api('/v/nachricht', { rid: r.id, text: t, mailen: $('#nm').checked }));
        meldung(`Veröffentlicht${$('#nm').checked ? `, an ${res.gemailt} Teilnehmerin(nen) gemailt` : ''}.`);
        S.retreats = await api('/v/retreats'); zeichnen();
      });
      $$('[data-nl]').forEach(a => a.onclick = async e => { e.preventDefault(); if (!confirm('Nachricht entfernen?')) return; await sicher(() => api('/v/nachricht/loeschen', { rid: r.id, id: a.dataset.nl })); S.retreats = await api('/v/retreats'); zeichnen(); });
    };
    const dokListe = r => (r.dokumente || []).map(d => `<p class="reihe"><a href="/api/dokument/${r.id}/${d.id}" target="_blank" rel="noopener">${esc(d.name)}</a><button class="knopf knopf--leise knopf--klein" data-dl="${d.id}">Entfernen</button></p>`).join('') || '<p class="leer">Noch keine Unterlagen.</p>';
    const dokBinden = r => $$('[data-dl]').forEach(b => b.onclick = async () => { if (!confirm('Unterlage entfernen?')) return; const res = await sicher(() => api('/v/dokument/loeschen', { rid: r.id, id: b.dataset.dl })); r.dokumente = res.dokumente; $('#doks').innerHTML = dokListe(r); dokBinden(r); });
    const lesen = (f, r) => {
      $$('[data-k]', f).forEach(el => { const k = el.dataset.k; r[k] = el.type === 'checkbox' ? el.checked : k === 'packliste' ? el.value.split('\n').map(x => x.trim()).filter(Boolean) : el.value; });
      $$('[data-f]', f).forEach(el => { r[el.dataset.f] = r[el.dataset.f] || {}; r[el.dataset.f][el.dataset.l] = el.value; });
      r.bild = $('[data-bild="reise"]', f).value;
      r.bilder = $$('[data-bogen]', f).filter(x => x.checked).map(x => x.value);
    };
    zeichnen();
  };

  // ===================== Teilnehmerinnen =====================
  ANSICHT.teilnehmerinnen = async () => {
    const [konten, rs] = await Promise.all([api('/v/konten'), api('/v/retreats')]);
    const vorbelegt = new URLSearchParams(location.hash.split('?')[1] || '');
    const reiseChips = (gewaehlt, name) => rs.map(r => `<label class="haken"><input type="checkbox" name="${name}" value="${r.id}" ${gewaehlt.includes(r.id) ? 'checked' : ''}><span>${esc(r.titel.de)} ${r.von ? '(' + r.von.slice(0, 4) + ')' : ''}</span></label>`).join('');
    const status = k => k.aktiv === false ? '<span class="etikett etikett--rot">gesperrt</span>' : k.eingeladen ? '<span class="etikett etikett--neu">eingeladen</span>' : '<span class="etikett etikett--gruen">aktiv</span>';
    main.innerHTML = kopf('Teilnehmerinnen & Zugänge') +
      `<details class="karte" id="einl" ${location.hash.includes('einladen') ? 'open' : ''}><summary class="h3">Jemanden einladen</summary>
        <form id="einladen" novalidate><div class="raster3">
          <div class="feld"><label for="e-n">Name</label><input id="e-n" name="name" required value="${esc(vorbelegt.get('name') || '')}"></div>
          <div class="feld"><label for="e-m">E-Mail</label><input id="e-m" name="email" type="email" required value="${esc(vorbelegt.get('email') || '')}"></div>
          <div class="feld"><label for="e-r">Zugang</label><select id="e-r" name="rolle"><option value="teilnehmerin">Teilnehmerin (eigener Bereich)</option><option value="admin">Verwaltung (wie Sabine & Nina)</option></select></div></div>
          <fieldset class="modi"><legend class="klein">Zu welchen Reisen?</legend>${reiseChips([], 'reisen')}</fieldset>
          <button class="knopf">Einladung verschicken</button><p class="klein">Die Person bekommt eine E-Mail mit einem Link (14 Tage gültig) und legt ihr Kennwort selbst fest.</p></form><div id="einl-erg"></div></details>
      <div class="karte tabelle-huelle"><table class="tabelle"><thead><tr><th>Name</th><th>Zugang</th><th>Reisen</th><th>Status</th><th>Zuletzt da</th><th></th></tr></thead><tbody>
      ${konten.sort((a, b) => (a.rolle + a.name).localeCompare(b.rolle + b.name)).map(k => `<tr data-id="${k.id}"><td><strong>${esc(k.name)}</strong><br><span class="klein">${esc(k.email)}</span></td><td>${k.rolle === 'admin' ? 'Verwaltung' : 'Teilnehmerin'}</td>
        <td>${k.rolle === 'admin' ? '–' : `<details class="klappe"><summary>${(k.retreats || []).map(id => esc(rs.find(r => r.id === id)?.titel.de || '?')).join(', ') || 'keine'}</summary>${reiseChips(k.retreats || [], 'r-' + k.id)}<button class="knopf knopf--leise knopf--klein" data-reisen>Übernehmen</button></details>`}</td>
        <td>${status(k)}</td><td class="klein">${k.letzteAnmeldung ? esc(zeit(k.letzteAnmeldung)) : '–'}</td>
        <td class="reihe">${k.eingeladen || !k.kennwortGesetzt ? '<button class="knopf knopf--leise knopf--klein" data-erneut>Einladung erneut</button>' : ''}${k.id !== S.status.ich.id ? `<button class="knopf knopf--leise knopf--klein" data-sperre>${k.aktiv === false ? 'Entsperren' : 'Sperren'}</button><button class="knopf knopf--leise knopf--klein" data-loeschen>Löschen</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div><p class="klein">Konten von Teilnehmerinnen werden automatisch gelöscht, wenn die letzte Reise länger als die eingestellte Frist zurückliegt.</p>`;
    $('#einladen').onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      const d = { name: f.name.value, email: f.email.value, rolle: f.rolle.value, retreats: $$('[name="reisen"]:checked', f).map(c => c.value) };
      const r = await sicher(() => api('/v/konto/einladen', d));
      $('#einl-erg').innerHTML = `<div class="hinweisbox hinweisbox--gruen">${r.gemailt ? 'Einladung ist per E-Mail unterwegs.' : 'E-Mail konnte nicht verschickt werden (' + esc(r.mailFehler) + '). Bitte den Link selbst weitergeben:'}<br><input readonly value="${esc(r.link)}" id="lnk"><button class="knopf knopf--leise knopf--klein" id="kop">Link kopieren</button></div>`;
      $('#kop').onclick = () => navigator.clipboard.writeText(r.link).then(() => meldung('Link kopiert.'));
      setTimeout(() => ANSICHT.teilnehmerinnen(), 6000);
    };
    $$('tr[data-id]').forEach(tr => {
      const k = konten.find(x => x.id === tr.dataset.id);
      $('[data-reisen]', tr) && ($('[data-reisen]', tr).onclick = () => sicher(async () => { await api('/v/konto/aendern', { id: k.id, retreats: $$(`[name="r-${k.id}"]:checked`, tr).map(c => c.value) }); ANSICHT.teilnehmerinnen(); }, 'Gespeichert.'));
      $('[data-erneut]', tr) && ($('[data-erneut]', tr).onclick = () => sicher(async () => { const r = await api('/v/konto/einladen', { name: k.name, email: k.email, rolle: k.rolle, retreats: k.retreats, erneut: true }); meldung(r.gemailt ? 'Neue Einladung verschickt.' : 'Mail ging nicht raus – Link: ' + r.link, !r.gemailt); }));
      $('[data-sperre]', tr) && ($('[data-sperre]', tr).onclick = () => sicher(async () => { await api('/v/konto/aendern', { id: k.id, aktiv: k.aktiv === false }); ANSICHT.teilnehmerinnen(); }, 'Gespeichert.'));
      $('[data-loeschen]', tr) && ($('[data-loeschen]', tr).onclick = () => confirm(`Konto von ${k.name} endgültig löschen?`) && sicher(async () => { await api('/v/konto/loeschen', { id: k.id }); ANSICHT.teilnehmerinnen(); }, 'Gelöscht.'));
    });
  };

  // ===================== Texte =====================
  ANSICHT.texte = async () => {
    const i = await api('/v/inhalt'); const F = S.status.felder;
    const gruppen = [...new Set(F.map(f => f[3]))]; let g = gruppen[1];
    const zeichnen = () => {
      main.innerHTML = kopf('Texte der Website', `<a class="knopf knopf--leise" href="/" target="_blank" rel="noopener">Website ansehen</a>`) +
        `<label class="haken hinweisbox"><input type="checkbox" id="entw" ${i.entwurf ? 'checked' : ''}><span>Entwurfstexte sind noch aktiv (Erinnerung in der Übersicht). Haken entfernen, sobald alle Texte von euch stammen.</span></label>
        <div class="gruppen">${gruppen.map(x => `<button type="button" data-g="${esc(x)}" aria-pressed="${x === g}">${esc(x)}</button>`).join('')}</div>
        <form id="texte" class="karte" novalidate>${F.filter(f => f[3] === g).map(([k, label, typ]) => `<div class="textfeld"><label>${esc(label)}</label><div class="zwei-sprachen">${['de', 'en'].map(l => `<div><span class="sprache">${l === 'de' ? 'DEUTSCH' : 'ENGLISCH'}</span>
          ${typ === 'zeile' ? `<input data-k="${k}" data-l="${l}" value="${esc(i.texte[l][k] || '')}">` : `<textarea data-k="${k}" data-l="${l}" rows="4">${esc(i.texte[l][k] || '')}</textarea>`}
          <div class="mini"><span data-zahl></span>${S.status.deepl ? `<button type="button" class="textlink" data-ueb="${k}" data-nach="${l}">aus ${l === 'de' ? 'Englisch' : 'Deutsch'} übersetzen</button>` : ''}</div></div>`).join('')}</div></div>`).join('')}
          <div class="leiste"><button class="knopf">Texte speichern</button></div></form>`;
      $$('.gruppen button').forEach(b => b.onclick = () => { if (S.ungespeichert && !confirm('Ungespeicherte Änderungen verwerfen?')) return; lesen(); S.ungespeichert = false; g = b.dataset.g; zeichnen(); });
      const zahl = el => { const z = el.parentElement.querySelector('[data-zahl]'); if (z) z.textContent = el.value.length + ' Zeichen'; };
      $$('[data-k]').forEach(el => { zahl(el); el.oninput = () => { zahl(el); merken(); }; });
      $$('[data-ueb]').forEach(b => b.onclick = async () => {
        const von = b.dataset.nach === 'de' ? 'en' : 'de'; const q = $(`[data-k="${b.dataset.ueb}"][data-l="${von}"]`).value;
        const r = await sicher(() => api('/v/uebersetzen', { text: q, nach: b.dataset.nach })); const z = $(`[data-k="${b.dataset.ueb}"][data-l="${b.dataset.nach}"]`); z.value = r.text; zahl(z); merken();
      });
      $('#entw').onchange = e => sicher(() => api('/v/inhalt', { entwurf: e.target.checked }).then(() => { S.status.entwurf = e.target.checked; }), 'Gespeichert.');
      $('#texte').onsubmit = async e => { e.preventDefault(); lesen(); await sicher(() => api('/v/inhalt', { texte: i.texte }), 'Texte gespeichert. Die Website ist aktualisiert.'); S.ungespeichert = false; };
    };
    const lesen = () => $$('[data-k]').forEach(el => { i.texte[el.dataset.l][el.dataset.k] = el.value; });
    zeichnen();
  };

  // ===================== Bilder =====================
  ANSICHT.bilder = async () => {
    const [bl, i, rs] = await Promise.all([api('/v/bilder'), api('/v/inhalt'), api('/v/retreats')]); S.bilder = bl;
    const RUBRIKEN = [
      ['Startseite', [['hero', 'Großes Titelbild ganz oben'], ['hgReisen', 'Hintergrund hinter „Reisen“'], ['hgKennen', 'Hintergrund im Feld „Kennenlernen“']]],
      ['Über uns', [['ueber', 'Breites Stimmungsbild'], ['sabine', 'Porträt Sabine'], ['nina', 'Porträt Nina']]],
      ['Unterseiten', [['bildRetreats', 'Seite „Retreats“'], ['bildKontakt', 'Seite „Kontakt“'], ['bildKennen', 'Seite „Kennenlernen“'], ['bildWarte', 'Seite „Vormerken“']]],
    ];
    const PLATZNAME = Object.fromEntries(RUBRIKEN.flatMap(([r, l]) => l.map(([k, t]) => [k, `${r}: ${t}`])));
    const BP = i.einstellungen.bildplaetze || {};
    const verwendung = b => {
      const v = [];
      for (const [k, id] of Object.entries(BP)) if (id === b.id && PLATZNAME[k]) v.push(['platz', PLATZNAME[k]]);
      for (const r of rs) if (r.bild === b.id || (r.bilder || []).includes(b.id)) v.push(['reise', `Reise: ${r.titel?.de || 'Reise'}`]);
      if (b.impression) v.push(['impression', 'Impressionen']);
      if (b.galerie) v.push(['galerie', 'Galerie']);
      return v;
    };
    const FILTER = [['alle', 'Alle'], ['impression', 'Impressionen'], ['platz', 'Hintergründe & Seitenbilder'], ['reise', 'Reisen'], ['galerie', 'Galerie'], ['frei', 'Nicht verwendet']];
    main.innerHTML = kopf('Bilder', `<label class="knopf">Fotos hochladen<input type="file" id="up" accept="image/jpeg,image/png,image/webp" multiple hidden></label>`) +
      `<div class="hinweisbox">Bitte nur eigene Fotos oder Fotos mit Erlaubnis der Fotografin verwenden. Keine KI-Bilder. Große Fotos werden beim Hochladen automatisch verkleinert.</div>
      <div class="hinweisbox hinweisbox--gruen"><strong>So funktioniert es:</strong> Unten in den Rubriken wählt ihr für jeden Platz auf der Website ein Foto aus. Alle Fotos mit Haken „Impressionen“ laufen auf der Startseite und unter <a href="/impressionen" target="_blank" rel="noopener">/impressionen</a> als Bildfolge (Reihenfolge mit ◀ ▶). Die Fotos im Bildbogen einer Reise wählt ihr unter „Reisen & Termine“. An jedem Foto steht, wo es gerade verwendet wird.</div>
      <form class="rubriken" id="plaetze-form" novalidate>${RUBRIKEN.map(([r, liste]) => `<section class="karte rubrik"><h2 class="h3">Rubrik ${r}</h2><div class="raster2">${liste.map(([k, t]) => `<div class="feld"><label>${t}</label>${bildWahl(BP[k], k)}</div>`).join('')}</div></section>`).join('')}
      <div class="karte"><label class="haken"><input type="checkbox" id="gal" ${i.einstellungen.abschnitte.galerie ? 'checked' : ''}><span>Galerie auf der Website zeigen (alle Bilder mit Haken „Galerie“)</span></label>
      <button class="knopf knopf--klein" id="plaetze" type="button">Zuordnung speichern</button></div></form>
      <form class="karte" id="tempo" novalidate><h2 class="h3">Bildwechsel</h2><div class="raster2">
        <div class="feld"><label for="t-imp">Impressionen: Sekunden pro Bild <span class="feld__hinweis" id="t-imp-w">${(i.einstellungen.tempo || {}).impressionen ?? 7.5} s</span></label><input id="t-imp" type="range" min="3" max="30" step="0.5" value="${(i.einstellungen.tempo || {}).impressionen ?? 7.5}"></div>
        <div class="feld"><label for="t-bog">Bildbogen der Reise: Sekunden pro Bild <span class="feld__hinweis" id="t-bog-w">${(i.einstellungen.tempo || {}).bogen ?? 6} s</span></label><input id="t-bog" type="range" min="3" max="30" step="0.5" value="${(i.einstellungen.tempo || {}).bogen ?? 6}"></div></div>
        <button class="knopf knopf--klein">Tempo speichern</button></form>
      <h2 class="h3">Alle Fotos</h2>
      <p class="bildfilter" role="group" aria-label="Fotos filtern">${FILTER.map(([k, t], n) => `<button type="button" class="knopf knopf--leise knopf--klein${n ? '' : ' ist-aktiv'}" data-filter="${k}" aria-pressed="${n ? 'false' : 'true'}">${t}</button>`).join('')}</p>
      <div class="bildraster">${bl.map(b => { const v = verwendung(b); return `<div class="bildkachel" data-id="${b.id}" data-arten="${[...new Set(v.map(x => x[0]))].join(' ') || 'frei'}"><img src="${bildUrl(b.id)}" alt="" loading="lazy">
        <input class="bildkachel__titel" data-titel value="${esc(b.titel || '')}" placeholder="Name des Fotos" aria-label="Name des Fotos">
        <p class="bildkachel__marken">${v.length ? v.map(([a, t]) => `<span class="marke marke--${a}">${esc(t)}</span>`).join('') : '<span class="marke marke--frei">Nicht verwendet</span>'}</p>
        <label class="klein" for="a-${b.id}">Beschreibung (für Blinde und Google)</label><input id="a-${b.id}" data-alt="de" value="${esc(b.alt?.de || '')}" placeholder="Was ist zu sehen?">
        <input data-alt="en" value="${esc(b.alt?.en || '')}" placeholder="English description" aria-label="Beschreibung Englisch">
        <input data-credit value="${esc(b.credit || '')}" placeholder="Foto von (z. B. Fotografin)" aria-label="Fotonachweis">
        <label class="haken"><input type="checkbox" data-impression ${b.impression ? 'checked' : ''}><span>Impressionen</span></label>
        <label class="haken"><input type="checkbox" data-galerie ${b.galerie ? 'checked' : ''}><span>Galerie</span></label>
        <p class="reihe"><button class="knopf knopf--leise knopf--klein" data-vor title="Weiter nach vorne" aria-label="Weiter nach vorne">◀</button><button class="knopf knopf--leise knopf--klein" data-nach title="Weiter nach hinten" aria-label="Weiter nach hinten">▶</button><button class="knopf knopf--leise knopf--klein" data-sp>Speichern</button><button class="knopf knopf--leise knopf--klein" data-lo>Löschen</button></p></div>`; }).join('') || '<p class="leer">Noch keine Fotos.</p>'}</div>`;
    $$('[data-filter]').forEach(f => f.onclick = () => {
      $$('[data-filter]').forEach(x => { x.classList.toggle('ist-aktiv', x === f); x.setAttribute('aria-pressed', x === f ? 'true' : 'false'); });
      $$('.bildkachel').forEach(k => { k.hidden = f.dataset.filter !== 'alle' && !k.dataset.arten.split(' ').includes(f.dataset.filter); });
    });
    $$('[data-bild]').forEach(s => s.onchange = () => { const w = s.closest('.bildwahl'); w.firstElementChild.outerHTML = s.value ? `<img src="${bildUrl(s.value)}" alt="">` : '<span class="platz"></span>'; });
    ['imp', 'bog'].forEach(k => { const el = $('#t-' + k); el.oninput = () => { $('#t-' + k + '-w').textContent = el.value + ' s'; }; });
    $('#tempo').onsubmit = e => { e.preventDefault(); sicher(() => api('/v/inhalt', { einstellungen: { tempo: { impressionen: Number($('#t-imp').value), bogen: Number($('#t-bog').value) } } }), 'Gespeichert. Die Website ist aktualisiert.'); };
    $('#plaetze').onclick = () => sicher(async () => { await api('/v/inhalt', { einstellungen: { bildplaetze: Object.fromEntries($$('[data-bild]').map(s => [s.dataset.bild, s.value])), abschnitte: { galerie: $('#gal').checked } } }); ANSICHT.bilder(); }, 'Gespeichert. Die Website ist aktualisiert.');
    $('#up').onchange = async e => {
      for (const d of e.target.files) {
        const alt = prompt(`Kurze Beschreibung für „${d.name}" (was ist zu sehen?)`, '') || '';
        try {
          meldung(`„${d.name}" wird hochgeladen …`);
          const k = await verkleinern(d);
          await api('/v/bild', k.blob, { typ: 'image/jpeg', kopf: { 'x-name': encodeURIComponent(d.name), 'x-alt': encodeURIComponent(alt), 'x-b': k.b, 'x-h': k.h } });
        } catch (er) { meldung(er.message, true); }
      }
      meldung('Fertig hochgeladen.'); ANSICHT.bilder();
    };
    $$('.bildkachel').forEach(k => {
      const id = k.dataset.id;
      $('[data-sp]', k).onclick = () => sicher(() => api('/v/bild/aendern', { id, titel: $('[data-titel]', k).value, alt: { de: $('[data-alt="de"]', k).value, en: $('[data-alt="en"]', k).value }, galerie: $('[data-galerie]', k).checked, impression: $('[data-impression]', k).checked, credit: $('[data-credit]', k).value }), 'Gespeichert. Die Website ist aktualisiert.');
      $('[data-galerie]', k).onchange = $('[data-impression]', k).onchange = $('[data-sp]', k).onclick;
      $('[data-vor]', k).onclick = () => sicher(async () => { await api('/v/bild/verschieben', { id, richtung: 'vor' }); ANSICHT.bilder(); });
      $('[data-nach]', k).onclick = () => sicher(async () => { await api('/v/bild/verschieben', { id, richtung: 'nach' }); ANSICHT.bilder(); });
      $('[data-lo]', k).onclick = () => confirm('Foto endgültig löschen? Es verschwindet überall auf der Website.') && sicher(async () => { await api('/v/bild/loeschen', { id }); ANSICHT.bilder(); }, 'Gelöscht.');
    });
  };

  // ===================== Rückmeldungen =====================
  ANSICHT.stimmen = async () => {
    const [st, i] = await Promise.all([api('/v/stimmen'), api('/v/inhalt')]);
    main.innerHTML = kopf('Rückmeldungen von Teilnehmerinnen') +
      `<label class="haken hinweisbox hinweisbox--gruen"><input type="checkbox" id="zeig" ${i.einstellungen.abschnitte.stimmen ? 'checked' : ''}><span>Freigegebene Rückmeldungen auf der Startseite zeigen</span></label>
      <p class="klein">Teilnehmerinnen schreiben ihre Rückmeldung nach der Reise in ihrem Bereich. Veröffentlicht wird nur, wenn sie zugestimmt haben.</p>` +
      (st.map(s => `<article class="karte" data-id="${s.id}"><div class="reihe"><strong>${esc(s.name)}</strong><span class="klein">${esc(s.retreat || '')} · ${esc(datum(s.zeit))}</span>${s.einwilligung ? '<span class="etikett etikett--gruen">Zustimmung liegt vor</span>' : '<span class="etikett">nur intern</span>'}${s.freigegeben ? '<span class="etikett etikett--neu">auf der Website</span>' : ''}</div>
        <div class="feld"><label class="sr" for="t-${s.id}">Text</label><textarea id="t-${s.id}" rows="4">${esc(s.text)}</textarea></div>
        <p class="reihe">${s.einwilligung ? `<button class="knopf knopf--klein" data-frei="${!s.freigegeben}">${s.freigegeben ? 'Von der Website nehmen' : 'Auf der Website zeigen'}</button>` : ''}<button class="knopf knopf--leise knopf--klein" data-sp>Text speichern</button><button class="knopf knopf--leise knopf--klein" data-lo>Löschen</button></p></article>`).join('') || '<p class="leer">Noch keine Rückmeldungen. Nach der ersten Reise können Teilnehmerinnen in ihrem Bereich schreiben.</p>');
    $('#zeig').onchange = e => sicher(() => api('/v/inhalt', { einstellungen: { abschnitte: { stimmen: e.target.checked } } }), 'Gespeichert.');
    $$('article[data-id]').forEach(a => {
      const id = a.dataset.id;
      $('[data-frei]', a) && ($('[data-frei]', a).onclick = e => sicher(async () => { await api('/v/stimme', { id, freigegeben: e.target.dataset.frei === 'true' }); ANSICHT.stimmen(); }, 'Gespeichert.'));
      $('[data-sp]', a).onclick = () => sicher(() => api('/v/stimme', { id, text: $('textarea', a).value }), 'Gespeichert.');
      $('[data-lo]', a).onclick = () => confirm('Rückmeldung löschen?') && sicher(async () => { await api('/v/stimme/loeschen', { id }); ANSICHT.stimmen(); }, 'Gelöscht.');
    });
  };

  // ===================== Newsletter (Hofgassl-Standard) =====================
  ANSICHT.newsletter = async () => {
    const [nl, rs, bl] = await Promise.all([api('/v/nl'), api('/v/retreats'), api('/v/bilder')]);
    let e = nl.entwurf || { betreff: '', anrede: 'liebe', anredeFrei: '', bloecke: [{ typ: 'text', text: '' }], ok: false };
    let listeSichtbar = false; try { listeSichtbar = localStorage.getItem('ac-nl-liste') === '1'; } catch {}
    const n = nl.zaehler.aktiv;
    const laufZeile = l => {
      const unv = l.gesendet + (l.uebergangen || 0) < l.gesamt && !l.fertig;
      const pz = l.gesamt ? Math.round((l.gesendet + (l.uebergangen || 0)) / l.gesamt * 100) : 100;
      return `<div class="textfeld" data-lauf="${l.id}"><div class="reihe"><strong>${esc(l.betreff)}</strong><span class="klein">${esc(zeit(l.start))}</span>${l.fertig ? '<span class="etikett etikett--gruen">fertig</span>' : '<span class="etikett etikett--neu">unvollständig</span>'}<span class="klein">${l.gesendet} gesendet${l.uebergangen ? ', ' + l.uebergangen + ' übergangen' : ''} von ${l.gesamt}</span>${l.fertig ? `<button class="textlink" data-weg="${l.id}" aria-label="Zeile ausblenden">×</button>` : ''}</div>
        <div class="fortschritt"><span data-w="${pz}"></span></div>${unv && e.laufId === l.id ? '<button class="knopf knopf--klein" data-rest>Die restlichen jetzt senden</button>' : ''}${(l.fehler || []).length ? `<details class="klappe"><summary>${l.fehler.length} Fehlermeldung(en)</summary>${l.fehler.map(f => `<p class="klein">${esc(f.an)}: ${esc(f.status)} ${esc(f.text)}</p>`).join('')}</details>` : ''}</div>`;
    };
    const blockHtml = (b, i) => `<div class="block" data-i="${i}"><div class="block__kopf"><span>${{ text: 'Text', bild: 'Bild', reise: 'Reise', knopf: 'Knopf' }[b.typ]}</span><span class="reihe">${i ? `<button type="button" class="textlink" data-hoch>nach oben</button>` : ''}<button type="button" class="textlink" data-raus>entfernen</button></span></div>
      ${b.typ === 'text' ? `<textarea rows="6" data-t="text" aria-label="Text">${esc(b.text)}</textarea><p class="klein">Leerzeile = neuer Absatz · **fett** · [Linktext](https://…)</p>` : ''}
      ${b.typ === 'bild' ? `<select data-t="id" aria-label="Bild"><option value="">Bild wählen …</option>${bl.map(x => `<option value="${x.id}"${x.id === b.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}
      ${b.typ === 'reise' ? `<select data-t="rid" aria-label="Reise"><option value="">Reise wählen …</option>${rs.map(x => `<option value="${x.id}"${x.id === b.rid ? ' selected' : ''}>${esc(x.titel.de)}</option>`).join('')}</select>` : ''}
      ${b.typ === 'knopf' ? `<div class="raster2"><input data-t="text" value="${esc(b.text)}" placeholder="Knopftext" aria-label="Knopftext"><input data-t="url" value="${esc(b.url)}" placeholder="https://anam-cara.at/…" aria-label="Adresse"></div>` : ''}</div>`;
    const zeichnen = () => {
      const laeufe = nl.laeufe.filter(l => !l.ausgeblendet);
      main.innerHTML = kopf('Newsletter') +
        (S.status.mail ? '' : '<div class="hinweisbox"><strong>Versand noch nicht eingerichtet.</strong> Solange kein Resend-Schlüssel hinterlegt ist, können Briefe geschrieben, aber nicht versendet werden.</div>') +
        `<div class="karte"><h2 class="h3">Aussendungen</h2>${laeufe.length ? laeufe.map(laufZeile).join('') : '<p class="leer">Noch nichts versendet.</p>'}<div id="lauf-live"></div></div>
        <div class="karte"><div class="reihe"><h2 class="h3">Empfängerinnen</h2><span class="etikett etikett--gruen">${n} aktiv</span><span class="etikett">${nl.zaehler.unbestaetigt} unbestätigt</span><span class="etikett">${nl.zaehler.abgemeldet} abgemeldet</span>
          <button class="knopf knopf--leise knopf--klein" id="liste">${listeSichtbar ? 'Adressliste verbergen' : 'Adressliste anzeigen'}</button><button class="knopf knopf--leise knopf--klein" id="hand">Adresse eintragen</button></div>
          <div id="adressen" ${listeSichtbar ? '' : 'hidden'}><div class="feld"><label for="such" class="sr">Suchen</label><input id="such" placeholder="Suchen …"></div><div class="tabelle-huelle"><table class="tabelle"><thead><tr><th>E-Mail</th><th>Status</th><th>Seit</th><th>Quelle</th><th></th></tr></thead><tbody id="kt"></tbody></table></div></div></div>
        <form class="karte" id="brief" novalidate>
          <div class="reihe reihe--ende"><button type="button" class="knopf knopf--leise knopf--klein" id="neuBrief">Neuen Newsletter anlegen</button><button type="button" class="knopf knopf--leise knopf--klein" id="leeren">Inhalt des Newsletters löschen</button></div>
          <div class="feld"><label for="bt">Betreff</label><input id="bt" value="${esc(e.betreff)}" list="betreffe" placeholder="z. B. Irland 2027: Die Reise steht fest"><datalist id="betreffe"><option value="Neues von Anam Cara"><option value="Ein neues Retreat steht fest"><option value="Noch wenige Plätze frei"></datalist></div>
          <div class="raster2"><div class="feld"><label for="an">Anrede</label><select id="an">${[['liebe', 'Liebe Vorname, (sonst: Liebe Leserin,)'], ['hallo', 'Hallo Vorname,'], ['frei', 'Eigene Anrede'], ['keine', 'Keine Anrede']].map(([k, t]) => `<option value="${k}"${e.anrede === k ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
          <div class="feld" ${e.anrede === 'frei' ? '' : 'hidden'} id="anfrei-f"><label for="anfrei">Eigene Anrede ({vorname} wird ersetzt)</label><input id="anfrei" value="${esc(e.anredeFrei)}"></div></div>
          <div id="bloecke">${e.bloecke.map(blockHtml).join('')}</div>
          <p class="reihe"><span class="klein">Hinzufügen:</span>${['text', 'bild', 'reise', 'knopf'].map(t => `<button type="button" class="knopf knopf--leise knopf--klein" data-neu="${t}">${{ text: 'Text', bild: 'Bild', reise: 'Reise', knopf: 'Knopf' }[t]}</button>`).join('')}</p>
          <div class="leiste"><span class="klein" id="okstatus">${e.ok ? '✓ Vorschau geprüft' : 'Vorschau noch nicht geprüft'}</span><button type="button" class="knopf knopf--leise" id="vors">Vorschau</button><button type="button" class="knopf" id="send" ${e.ok && S.status.mail && n ? '' : 'disabled'}>An alle ${n} senden</button></div>
        </form>
        <dialog id="dlg"><div class="dlg-kopf"><strong>Vorschau</strong><button class="knopf knopf--leise knopf--klein" id="zu">Schließen</button></div><div class="dlg-rumpf"><iframe class="vorschau-rahmen" title="Vorschau des Newsletters" sandbox=""></iframe><p class="reihe reihe--ende"><button class="knopf" id="okbtn">Vorschau ist in Ordnung</button></p></div></dialog>`;
      $$('.fortschritt span').forEach(s => s.style.width = s.dataset.w + '%');
      kontakteZeichnen();
      $('#liste').onclick = () => { listeSichtbar = !listeSichtbar; try { localStorage.setItem('ac-nl-liste', listeSichtbar ? '1' : '0'); } catch {} $('#adressen').hidden = !listeSichtbar; $('#liste').textContent = listeSichtbar ? 'Adressliste verbergen' : 'Adressliste anzeigen'; };
      $('#such').oninput = kontakteZeichnen;
      $('#hand').onclick = handEintragen;
      $$('[data-weg]').forEach(b => b.onclick = () => sicher(async () => { await api('/v/nl/lauf/ausblenden', { id: b.dataset.weg }); nl.laeufe.find(l => l.id === b.dataset.weg).ausgeblendet = true; zeichnen(); }));
      $('[data-rest]') && ($('[data-rest]').onclick = () => senden(true));
      const f = $('#brief');
      f.oninput = () => { e.ok = false; $('#okstatus').textContent = 'Geändert – bitte Vorschau erneut prüfen'; $('#send').disabled = true; merken(); };
      $('#an').onchange = () => { $('#anfrei-f').hidden = $('#an').value !== 'frei'; f.oninput(); };
      $$('[data-neu]').forEach(b => b.onclick = () => { lesen(); e.bloecke.push({ typ: b.dataset.neu, text: '', id: '', rid: '', url: '' }); e.ok = false; zeichnen(); });
      $$('.block').forEach(bk => {
        const i = +bk.dataset.i;
        $('[data-raus]', bk).onclick = () => { lesen(); e.bloecke.splice(i, 1); e.ok = false; zeichnen(); };
        $('[data-hoch]', bk) && ($('[data-hoch]', bk).onclick = () => { lesen(); [e.bloecke[i - 1], e.bloecke[i]] = [e.bloecke[i], e.bloecke[i - 1]]; e.ok = false; zeichnen(); });
      });
      $('#neuBrief').onclick = () => confirm('Neuen Newsletter anlegen? Text, Bilder, Betreff und Anrede werden zurückgesetzt.') && sicher(async () => { const r = await api('/v/nl/entwurf', { neu: true, betreff: '', anrede: 'liebe', bloecke: [{ typ: 'text', text: '' }] }); e = r.entwurf; S.ungespeichert = false; zeichnen(); }, 'Neuer Newsletter angelegt.');
      $('#leeren').onclick = () => confirm('Inhalt des Newsletters löschen? Betreff und Anrede bleiben.') && sicher(async () => { lesen(); const r = await api('/v/nl/entwurf', { ...e, bloecke: [{ typ: 'text', text: '' }] }); e = r.entwurf; zeichnen(); }, 'Inhalt gelöscht.');
      $('#vors').onclick = async () => {
        lesen(); const r = await sicher(() => api('/v/nl/entwurf', e)); e = r.entwurf; S.ungespeichert = false;
        const d = $('#dlg'); $('iframe', d).src = '/api/v/nl/vorschau?' + Date.now(); d.showModal();
      };
      $('#zu').onclick = () => $('#dlg').close();
      $('#okbtn').onclick = async () => { const r = await sicher(() => api('/v/nl/entwurf', { ...e, ok: true })); e = r.entwurf; $('#dlg').close(); zeichnen(); meldung('Vorschau bestätigt. Der Brief kann jetzt versendet werden.'); };
      $('#send').onclick = () => senden(false);
    };
    const lesen = () => {
      e.betreff = $('#bt').value; e.anrede = $('#an').value; e.anredeFrei = $('#anfrei').value;
      $$('.block').forEach(bk => { const b = e.bloecke[+bk.dataset.i]; $$('[data-t]', bk).forEach(x => b[x.dataset.t] = x.value); });
    };
    const kontakteZeichnen = () => {
      const q = ($('#such')?.value || '').toLowerCase();
      $('#kt').innerHTML = nl.kontakte.filter(k => !q || k.email.includes(q) || (k.name || '').toLowerCase().includes(q)).slice(0, 200).map(k => `<tr><td>${esc(k.email)}${k.name ? '<br><span class="klein">' + esc(k.name) + '</span>' : ''}</td><td>${k.status === 'aktiv' ? '<span class="etikett etikett--gruen">aktiv</span>' : k.status === 'abgemeldet' ? '<span class="etikett etikett--rot">abgemeldet</span>' : '<span class="etikett">unbestätigt</span>'}</td><td class="klein">${esc(datum(k.angelegt))}</td><td class="klein">${esc(k.quelle || '')}</td>
        <td class="reihe">${k.status === 'abgemeldet' ? `<button class="knopf knopf--leise knopf--klein" data-wieder="${esc(k.email)}">Wieder aufnehmen</button>` : ''}<details class="klappe"><summary class="klein">Nachweis</summary>${(k.nachweise || []).map(x => `<p class="klein">${esc(zeit(x.zeit))}: ${esc(x.weg)}${x.wortlaut ? ' – „' + esc(x.wortlaut) + '"' : ''}</p>`).join('')}</details><button class="knopf knopf--leise knopf--klein" data-del="${esc(k.email)}">Löschen</button></td></tr>`).join('') || '<tr><td colspan="5" class="leer">Keine Einträge.</td></tr>';
      $$('[data-wieder]').forEach(b => b.onclick = () => confirm('Zustimmung liegt vor? Nur aufnehmen, wenn die Person ausdrücklich wieder Post möchte.') && sicher(async () => { await api('/v/nl/kontakt', { email: b.dataset.wieder, wiederaufnehmen: true, zustimmung: true }); ANSICHT.newsletter(); }, 'Wieder aufgenommen.'));
      $$('[data-del]').forEach(b => b.onclick = () => confirm('Adresse vollständig löschen (auch von der Sperrliste)?') && sicher(async () => { await api('/v/nl/kontakt/loeschen', { email: b.dataset.del }); ANSICHT.newsletter(); }, 'Gelöscht.'));
    };
    const handEintragen = async () => {
      const mail = prompt('E-Mail-Adresse:'); if (!mail) return;
      const name = prompt('Name (freiwillig):') || '';
      if (!confirm('Liegt die Zustimmung dieser Person zum Newsletter vor (z. B. schriftlich oder bei einer Veranstaltung)? Nur dann eintragen.')) return;
      const wortlaut = prompt('Wie und wann wurde zugestimmt? (wird als Nachweis gespeichert)', 'Mündlich beim Kennenlerngespräch am ' + new Date().toLocaleDateString('de-AT')) || '';
      await sicher(() => api('/v/nl/kontakt', { email: mail, name, zustimmung: true, wortlaut }), 'Eingetragen.'); ANSICHT.newsletter();
    };
    const senden = async (fortsetzen) => {
      if (!fortsetzen && !confirm(`Jetzt an alle ${n} Adressen versenden?`)) return;
      const geraet = (() => { try { let g = sessionStorage.getItem('ac-geraet'); if (!g) { g = Math.random().toString(36).slice(2); sessionStorage.setItem('ac-geraet', g); } return g; } catch { return 'x'; } })();
      let wake = null; try { wake = await navigator.wakeLock?.request('screen'); } catch {}
      const live = $('#lauf-live'); $('#send').disabled = true;
      live.innerHTML = `<div class="hinweisbox"><strong>Versand läuft – bitte dieses Fenster offen lassen.</strong><div class="fortschritt"><span id="pz"></span></div><p class="klein" id="pt"></p></div>`;
      let neu = 0, schon = null;
      try {
        for (let runde = 0; runde < 400; runde++) {
          const r = await api('/v/nl/senden', { laufId: e.laufId, geraet, n: 15 });
          neu += r.gesendet; if (schon === null) schon = r.hattenSchon;
          const ges = n || 1; $('#pz').style.width = Math.round((ges - r.offen) / ges * 100) + '%';
          $('#pt').textContent = `${neu} jetzt neu gesendet${schon ? ` · ${schon} hatten den Brief schon` : ''} · ${r.offen} offen`;
          if (r.stopp) { meldung('Versand angehalten: ' + r.stopp + '. Der Rest bleibt offen und kann später fortgesetzt werden.', true); break; }
          if (r.fertig) { meldung(`Fertig: ${neu} Briefe versendet.`); break; }
          if (r.gesendet === 0 && r.fehler.length) { meldung('Fehler beim Versand: ' + r.fehler[0].text, true); break; }
        }
      } catch (er) { meldung(er.message, true); }
      finally { try { await wake?.release(); } catch {} }
      setTimeout(() => ANSICHT.newsletter(), 1500);
    };
    zeichnen();
  };

  // ===================== Besuche & Google =====================
  ANSICHT.sichtbarkeit = async () => {
    const [st, chk] = await Promise.all([api('/v/statistik?tage=30'), api('/v/check')]);
    const max = Math.max(1, ...st.tage.map(t => t.n)); const summe = st.tage.reduce((s, t) => s + t.n, 0);
    const url = location.origin;
    main.innerHTML = kopf('Besuche & Google') +
      `<div class="raster2"><div class="karte"><h2 class="h3">${summe} Seitenaufrufe in 30 Tagen</h2><div class="balken" aria-hidden="true">${st.tage.map(t => `<span title="${t.tag}: ${t.n}" data-h="${Math.round(t.n / max * 100)}"></span>`).join('')}</div>
        <h3 class="h3">Meistbesuchte Seiten</h3><table class="tabelle">${st.seiten.map(([p, n]) => `<tr><td>${esc(p)}</td><td>${n}</td></tr>`).join('') || '<tr><td class="leer">Noch keine Daten.</td></tr>'}</table></div>
      <div class="karte"><h3 class="h3">Woher Besucherinnen kommen</h3><table class="tabelle">${st.quellen.map(([p, n]) => `<tr><td>${esc(p)}</td><td>${n}</td></tr>`).join('') || '<tr><td class="leer">Direkt oder noch keine Daten.</td></tr>'}</table>
        <h3 class="h3">Anfragen nach Angebot (30 Tage)</h3><table class="tabelle">${Object.entries(st.anfragenNachArt).map(([k, n]) => `<tr><td>${ARTEN[k] || k}</td><td>${n}</td></tr>`).join('') || '<tr><td class="leer">Noch keine Anfragen.</td></tr>'}</table>
        <p class="klein">Gezählt ohne Cookies und IP-Adressen – darum ist kein Cookie-Banner nötig.</p></div></div>
      <div class="karte"><h2 class="h3">Seiten-Check: Google und KI-Assistenten</h2><p class="klein">Stand ${esc(zeit(chk.stand))}. Je weniger gelbe Punkte, desto besser verstehen Google, ChatGPT & Co. die Seite.</p>
        ${chk.befunde.map(b => `<div class="befund"><span class="etikett ${b.stufe === 'rot' ? 'etikett--rot' : b.stufe === 'gelb' ? 'etikett--neu' : ''}">${b.stufe}</span><span class="klein">${esc(b.bereich)}</span><span>${esc(b.text)}</span></div>`).join('') || '<p>Alles in Ordnung.</p>'}</div>
      <div class="karte"><h2 class="h3">Für Google hinterlegt</h2><ul class="striche">
        <li><a href="${url}/sitemap.xml" target="_blank" rel="noopener">Sitemap</a> – bei der Google Search Console einreichen</li>
        <li><a href="${url}/llms.txt" target="_blank" rel="noopener">llms.txt</a> – Kurzfassung für KI-Assistenten, aktualisiert sich selbst</li>
        <li>Strukturierte Daten: Organisation, Reisen als Veranstaltung, häufige Fragen, Personen</li>
        <li><a href="https://search.google.com/test/rich-results?url=${encodeURIComponent(url + '/')}" target="_blank" rel="noopener">Google-Test für Rich Results öffnen</a></li>
        <li><a href="https://search.google.com/search-console" target="_blank" rel="noopener">Google Search Console</a> – Bestätigungscode unter Einstellungen eintragen</li></ul></div>`;
    $$('.balken span').forEach(s => s.style.height = s.dataset.h + '%');
  };

  // ===================== Laufband (Newsticker) =====================
  ANSICHT.laufband = async () => {
    const i = await api('/v/inhalt');
    const L = { sichtbar: true, richtung: 'links', tempo: 4, link: '', text: { de: '', en: '' }, ...(i.einstellungen.laufband || {}) };
    const ZIELE = [['', 'Kein Link'], ['/vormerken', 'Vormerkung'], ['/kennenlernen', 'Kennenlerngespräch'], ['/kontakt', 'Kontakt'], ['/retreats', 'Retreats & Termine'], ['/impressionen', 'Impressionen']];
    const eigen = L.link && !ZIELE.some(([v]) => v === L.link);
    main.innerHTML = kopf('Laufband') +
      `<form class="karte" id="lb" novalidate>
        <p class="klein">Das Laufband zieht unter dem Seitenkopf über jede Seite der Website, zum Beispiel für den Info-Zoom-Call. Fährt man mit der Maus darüber, bleibt es stehen.</p>
        <label class="haken hinweisbox hinweisbox--gruen"><input type="checkbox" id="lb-an" ${L.sichtbar ? 'checked' : ''}><span><strong>Laufband auf der Website zeigen</strong></span></label>
        <div class="raster2">
          <div class="feld"><label for="lb-de">Meldungen Deutsch <span class="feld__hinweis">eine Meldung pro Zeile</span></label><textarea id="lb-de" rows="5">${esc(L.text.de || '')}</textarea></div>
          <div class="feld"><label for="lb-en">Meldungen Englisch <span class="feld__hinweis">eine pro Zeile; leer = Deutsch</span></label><textarea id="lb-en" rows="5">${esc(L.text.en || '')}</textarea></div>
        </div>
        <div class="raster3">
          <fieldset class="musikwahl"><legend>Laufrichtung</legend>
            <label class="haken"><input type="radio" name="ri" value="links" ${L.richtung !== 'rechts' ? 'checked' : ''}><span>← nach links (üblich)</span></label>
            <label class="haken"><input type="radio" name="ri" value="rechts" ${L.richtung === 'rechts' ? 'checked' : ''}><span>→ nach rechts</span></label></fieldset>
          <div class="feld"><label for="lb-t">Geschwindigkeit <span class="feld__hinweis" id="lb-tw"></span></label><input id="lb-t" type="range" min="1" max="10" step="1" value="${L.tempo}"></div>
          <div class="feld"><label for="lb-z">Klick führt zu</label><select id="lb-z">${ZIELE.map(([v, t]) => `<option value="${v}"${(!eigen && L.link === v) ? ' selected' : ''}>${t}</option>`).join('')}<option value="eigen"${eigen ? ' selected' : ''}>Eigene Adresse (z. B. Zoom-Link) …</option></select>
            <input id="lb-u" placeholder="https://…" value="${eigen ? esc(L.link) : ''}" ${eigen ? '' : 'hidden'} aria-label="Eigene Adresse"></div>
        </div>
        <div class="feld"><label>Vorschau</label><div class="lb-vorschau" id="lb-vor"></div></div>
        <div class="leiste"><button class="knopf">Laufband speichern</button></div></form>`;
    const tw = () => { const v = Number($('#lb-t').value); $('#lb-tw').textContent = ['', 'sehr langsam', 'langsam', 'ruhig', 'ruhig', 'mittel', 'mittel', 'zügig', 'zügig', 'schnell', 'sehr schnell'][v]; };
    const vorschau = () => {
      const zeilen = $('#lb-de').value.split('\n').map(x => x.trim()).filter(Boolean);
      const v = $('#lb-vor'); const px = 10 + Number($('#lb-t').value) * 7; const rechts = $('#lb-z') && $$('[name=ri]').find(x => x.checked)?.value === 'rechts';
      const reihe = zeilen.map(z => `<span>${esc(z)}</span><img src="/assets/logo/mond-3.webp" width="14" height="14" alt="">`).join('');
      v.innerHTML = $('#lb-an').checked && zeilen.length ? `<div class="lb-bahn"><div>${reihe}</div><div>${reihe}</div></div>` : '<p class="klein">Ausgeblendet.</p>';
      const bahn = $('.lb-bahn', v); if (bahn) { bahn.style.animationDuration = Math.max(6, bahn.firstElementChild.scrollWidth / px) + 's'; bahn.style.animationDirection = rechts ? 'reverse' : 'normal'; }
    };
    $('#lb-z').onchange = () => { $('#lb-u').hidden = $('#lb-z').value !== 'eigen'; };
    $('#lb').oninput = () => { tw(); vorschau(); merken(); }; tw(); vorschau();
    $('#lb').onsubmit = async e => {
      e.preventDefault();
      const z = $('#lb-z').value; const link = z === 'eigen' ? $('#lb-u').value.trim() : z;
      if (z === 'eigen' && !/^https:\/\//.test(link)) { meldung('Bitte eine vollständige Adresse mit https:// eingeben.', true); return; }
      await sicher(() => api('/v/inhalt', { einstellungen: { laufband: { sichtbar: $('#lb-an').checked, richtung: $$('[name=ri]').find(x => x.checked).value, tempo: Number($('#lb-t').value), link, text: { de: $('#lb-de').value, en: $('#lb-en').value } } } }), 'Gespeichert. Die Website ist aktualisiert.');
      S.ungespeichert = false;
    };
  };

  // ===================== Einstellungen =====================
  ANSICHT.einstellungen = async () => {
    const [i, prot] = await Promise.all([api('/v/inhalt'), api('/v/protokoll')]); const E = i.einstellungen;
    const M = { quelle: 'harfe', lautstaerke: 30, datei: '', name: '', groesse: 0, ...(E.musik || {}) };
    const feld = (k, label, wert, hilfe = '') => `<div class="feld"><label for="s-${k}">${label}${hilfe ? ` <span class="feld__hinweis">${hilfe}</span>` : ''}</label><input id="s-${k}" data-e="${k}" value="${esc(wert || '')}"></div>`;
    main.innerHTML = kopf('Einstellungen') +
      `<form class="karte" id="eins" novalidate><h2 class="h3">Angaben für Impressum, Fußzeile und Google</h2><div class="raster2">
        ${feld('wortlaut', 'Name laut Impressum', E.wortlaut)}${feld('rechtsform', 'Rechtsform', E.rechtsform, 'z. B. Gesellschaft bürgerlichen Rechts')}
        ${feld('personen', 'Vertreten durch', E.personen)}${feld('email', 'E-Mail-Adresse (öffentlich)', E.email, 'Pflicht im Impressum')}
        ${feld('telefon', 'Telefon (öffentlich)', E.telefon, 'freiwillig')}${feld('uid', 'UID-Nummer oder „Kleinunternehmerin"', E.uid)}
        ${feld('firmenbuch', 'Firmenbuch / ZVR', E.firmenbuch)}${feld('kammer', 'Kammer, Gewerbe', E.kammer)}
        ${feld('veranstalter', 'Reiseveranstalter', E.veranstalter)}${feld('gscToken', 'Google Search Console Code', E.gscToken, 'nur der Wert aus content="…"')}
        <div class="feld"><label for="s-adr">Adressen <span class="feld__hinweis">eine pro Zeile</span></label><textarea id="s-adr" rows="3">${esc(E.adressen.join('\n'))}</textarea></div>
        <div><div class="feld"><label for="s-ig">Instagram-Adresse</label><input id="s-ig" data-soc="instagram" value="${esc(E.social.instagram)}" placeholder="https://instagram.com/…"></div><div class="feld"><label for="s-fb">Facebook-Adresse</label><input id="s-fb" data-soc="facebook" value="${esc(E.social.facebook)}" placeholder="https://facebook.com/…"></div></div>
        </div><h2 class="h3">Löschfristen</h2><div class="raster3">
        <div class="feld"><label for="f1">Anfragen löschen nach (Monaten)</label><input id="f1" type="number" min="1" max="120" data-fr="anfragenMonate" value="${E.fristen.anfragenMonate}"></div>
        <div class="feld"><label for="f2">Unbestätigte Newsletter-Anmeldungen (Tage)</label><input id="f2" type="number" min="1" max="120" data-fr="unbestaetigtTage" value="${E.fristen.unbestaetigtTage}"></div>
        <div class="feld"><label for="f3">Teilnehmerinnen-Konten nach der Reise (Monate)</label><input id="f3" type="number" min="1" max="120" data-fr="teilnehmerinnenMonateNachReise" value="${E.fristen.teilnehmerinnenMonateNachReise}"></div></div>
        <div class="leiste"><button class="knopf">Einstellungen speichern</button></div></form>
      <form class="karte" id="musik" novalidate><h2 class="h3">Musik beim Atem-Ritual</h2>
        <p class="klein">Die Atemübung auf der Startseite beginnt immer in Stille. Besucherinnen können mit dem Knopf „Musik dazu" die hier gewählte Musik einschalten. Sie wird sanft eingeblendet.</p>
        <fieldset class="musikwahl"><legend>Welche Musik?</legend>
          <label class="haken"><input type="radio" name="mq" value="harfe" ${M.quelle === 'harfe' ? 'checked' : ''}><span>Eingebaute irische Musik (Harfe, Low Whistle, Bordun)</span></label>
          <label class="haken"><input type="radio" name="mq" value="datei" ${M.quelle === 'datei' ? 'checked' : ''} ${M.datei ? '' : 'disabled'}><span>Eigene Musik${M.datei ? `: <strong>${esc(M.name)}</strong> (${(M.groesse / 1048576).toFixed(1)} MB)` : ' (zuerst unten eine Datei hochladen)'}</span></label>
          <label class="haken"><input type="radio" name="mq" value="aus" ${M.quelle === 'aus' ? 'checked' : ''}><span>Keine Musik anbieten</span></label></fieldset>
        <div class="feld"><label for="m-laut">Lautstärke <span class="feld__hinweis" id="m-wert">${M.lautstaerke} %</span></label>
          <input id="m-laut" type="range" min="5" max="100" step="5" value="${M.lautstaerke}"><p class="klein">Empfehlung: 25–40 %. Die Musik soll begleiten, nicht übertönen.</p></div>
        ${M.datei ? `<div class="feld"><label>Probehören (mit der eingestellten Lautstärke)</label><audio id="m-probe" controls preload="none" src="/musik/${esc(M.datei)}"></audio></div>` : ''}
        <div class="reihe"><label class="knopf knopf--leise knopf--klein">${M.datei ? 'Andere Musikdatei hochladen' : 'Musikdatei hochladen'}<input type="file" id="m-datei" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav" hidden></label>
          ${M.datei ? '<button type="button" class="knopf knopf--leise knopf--klein" id="m-weg">Eigene Musik entfernen</button>' : ''}</div>
        <p class="klein">MP3, M4A, OGG oder WAV, höchstens 30 MB (MP3 ist am sparsamsten). Die Musik läuft in Schleife. Bitte nur Musik verwenden, für die ihr die Rechte für eine Website habt: eigene Aufnahmen oder lizenzfreie Musik mit Erlaubnis zur Nutzung im Internet.</p>
        <div class="leiste"><button class="knopf">Musik-Einstellung speichern</button></div></form>
      <div class="raster2"><form class="karte" id="ich" novalidate><h2 class="h3">Mein Konto</h2>
        <div class="feld"><label for="i-n">Name</label><input id="i-n" name="name" value="${esc(S.status.ich.name)}"></div>
        ${S.status.ich.benutzer ? `<p class="klein">Benutzername: <strong>${esc(S.status.ich.benutzer)}</strong></p>` : ''}
        <div class="feld"><label for="i-m">E-Mail-Adresse <span class="feld__hinweis">für den Anmeldecode und „Kennwort vergessen“</span></label><input id="i-m" name="email" type="email" value="${esc(S.status.ich.email)}"></div>
        <div class="feld"><label for="i-t">Mobilnummer für den Anmeldecode per SMS</label><input id="i-t" name="telefon" value="${esc(S.status.ich.telefon)}" placeholder="+43 …"></div>
        <button class="knopf knopf--leise">Speichern</button></form>
        <form class="karte" id="kw" novalidate><h2 class="h3">Kennwort ändern</h2>
        <div class="feld"><label for="k-a">Bisheriges Kennwort</label><input id="k-a" name="alt" type="password" autocomplete="current-password"></div>
        <div class="feld"><label for="k-n">Neues Kennwort (mind. 10 Zeichen)</label><input id="k-n" name="neu" type="password" autocomplete="new-password"></div>
        <button class="knopf knopf--leise">Ändern</button></form></div>
      <div class="karte"><h2 class="h3">Dienste</h2><ul class="striche">
        <li>Mailversand (Resend): ${S.status.mail ? '<span class="etikett etikett--gruen">eingerichtet</span>' : '<span class="etikett etikett--rot">fehlt</span>'}</li>
        <li>Anmeldecode per SMS (seven.io): ${S.status.sms ? '<span class="etikett etikett--gruen">eingerichtet</span>' : '<span class="etikett">nicht eingerichtet – Code kommt per E-Mail</span>'}</li>
        <li>Übersetzung (DeepL): ${S.status.deepl ? '<span class="etikett etikett--gruen">eingerichtet</span>' : '<span class="etikett">nicht eingerichtet – Englisch von Hand</span>'}</li>
        ${S.status.zfAus ? '<li><span class="etikett etikett--rot">Anmeldecode ist ausgeschaltet (Notausgang aktiv)</span></li>' : ''}</ul></div>
      <details class="karte"><summary class="h3">Protokoll (letzte Aktionen)</summary><table class="tabelle">${prot.slice(0, 120).map(p => `<tr><td class="klein">${esc(zeit(p.zeit))}</td><td class="klein">${esc(p.wer)}</td><td>${esc(p.was)}</td></tr>`).join('')}</table></details>`;
    $('#eins').oninput = merken;
    $('#eins').onsubmit = async e => {
      e.preventDefault();
      const ein = { social: {}, fristen: {}, adressen: $('#s-adr').value.split('\n') };
      $$('[data-e]').forEach(x => ein[x.dataset.e] = x.value); $$('[data-soc]').forEach(x => ein.social[x.dataset.soc] = x.value); $$('[data-fr]').forEach(x => ein.fristen[x.dataset.fr] = x.value);
      await sicher(() => api('/v/inhalt', { einstellungen: ein }), 'Gespeichert. Impressum und Datenschutz sind aktualisiert.'); S.ungespeichert = false;
    };
    const laut = $('#m-laut'), probe = $('#m-probe');
    const lautZeigen = () => { $('#m-wert').textContent = laut.value + ' %'; if (probe) probe.volume = laut.value / 100; };
    laut.oninput = lautZeigen; lautZeigen();
    $('#musik').onsubmit = async e => {
      e.preventDefault();
      await sicher(() => api('/v/inhalt', { einstellungen: { musik: { quelle: (e.target.mq.value || 'harfe'), lautstaerke: Number(laut.value) } } }), 'Gespeichert. Die Website ist aktualisiert.');
    };
    $('#m-datei').onchange = async e => {
      const d = e.target.files[0]; if (!d) return;
      if (d.size > 30 * 1048576) { meldung('Die Datei ist größer als 30 MB. Bitte eine MP3 verwenden.', true); return; }
      const typ = d.type || ({ mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', wav: 'audio/wav' })[d.name.split('.').pop().toLowerCase()] || '';
      const GROESSE = 3.5 * 1048576, teile = Math.max(1, Math.ceil(d.size / GROESSE)); let mid = '';
      try {
        for (let n = 0; n < teile; n++) {
          meldung(`„${d.name}" wird hochgeladen … ${Math.round(n / teile * 100)} %`);
          const r = await api('/v/musik', d.slice(n * GROESSE, (n + 1) * GROESSE), { typ: 'application/octet-stream', kopf: { 'x-typ': typ, 'x-teil': n, 'x-teile': teile, 'x-mid': mid, 'x-name': encodeURIComponent(d.name) } });
          mid = r.mid;
        }
        await api('/v/inhalt', { einstellungen: { musik: { quelle: 'datei', lautstaerke: Number(laut.value) } } });
        meldung('Musik hochgeladen und ausgewählt.'); ANSICHT.einstellungen();
      } catch (err) { meldung(err.message, true); }
    };
    if ($('#m-weg')) $('#m-weg').onclick = async () => { if (!confirm('Eigene Musik entfernen? Danach wird wieder die eingebaute irische Musik angeboten.')) return; await sicher(() => api('/v/musik/loeschen', {}), 'Entfernt.'); ANSICHT.einstellungen(); };
    $('#ich').onsubmit = async e => { e.preventDefault(); await sicher(() => api('/v/ich', { name: e.target.name.value, email: e.target.email.value, telefon: e.target.telefon.value }), 'Gespeichert.'); S.status.ich.telefon = e.target.telefon.value; S.status.ich.email = e.target.email.value; };
    $('#kw').onsubmit = async e => { e.preventDefault(); await sicher(() => api('/konto/kennwort', { alt: e.target.alt.value, neu: e.target.neu.value }), 'Kennwort geändert.'); e.target.reset(); };
  };

  // ===================== Sicherung =====================
  ANSICHT.sicherung = async () => {
    const liste = await api('/v/sicherungen');
    main.innerHTML = kopf('Sicherung & Wiederherstellung') +
      `<div class="hinweisbox hinweisbox--gruen">Jede Nacht wird automatisch eine Sicherung aller Inhalte, Reisen, Konten, Anfragen und Newsletter-Kontakte angelegt und 30 Tage aufbewahrt. Fotos und PDFs liegen getrennt im Speicher und bleiben beim Einspielen unberührt.</div>
      <div class="raster2"><div class="karte"><h2 class="h3">Jetzt sichern</h2><p>Lade eine Sicherung auf deinen Computer, z. B. vor größeren Änderungen. Die Datei enthält Personendaten: bitte sicher aufbewahren.</p>
        <p class="reihe"><a class="knopf" href="/api/v/sicherung">Sicherung herunterladen</a><button class="knopf knopf--leise" id="jetzt">Sicherung im Speicher anlegen</button></p></div>
      <div class="karte"><h2 class="h3">Aus Datei wiederherstellen</h2><p>Vor dem Einspielen wird der aktuelle Stand automatisch gesichert.</p><label class="knopf knopf--leise">Sicherungsdatei wählen<input type="file" id="datei" accept="application/json" hidden></label></div></div>
      <div class="karte"><h2 class="h3">Automatische Sicherungen</h2>${liste.map(k => `<p class="reihe"><span>${esc(k.replace('sicherung/', ''))}</span><button class="knopf knopf--leise knopf--klein" data-tag="${esc(k.replace('sicherung/', ''))}">Diesen Stand einspielen</button></p>`).join('') || '<p class="leer">Die erste automatische Sicherung entsteht heute Nacht.</p>'}</div>
      <div class="karte"><h2 class="h3">Löschfristen jetzt anwenden</h2><p>Passiert jede Nacht automatisch. Hier sofort auslösen.</p><button class="knopf knopf--leise" id="aufr">Jetzt aufräumen</button></div>`;
    $('#jetzt').onclick = () => sicher(async () => { await api('/v/sicherung/jetzt', {}); ANSICHT.sicherung(); }, 'Sicherung angelegt.');
    $('#aufr').onclick = () => sicher(async () => { const r = await api('/v/aufraeumen', {}); meldung(`${r.geloescht} Einträge nach Frist gelöscht.`); });
    const einspielen = async daten => {
      if (!confirm('Diesen Stand wirklich einspielen? Aktuelle Inhalte werden überschrieben.')) return;
      if (!confirm('Ganz sicher? Der jetzige Stand wird vorher automatisch gesichert.')) return;
      await sicher(() => api('/v/sicherung/einspielen', { ...daten, bestaetigt: true }), 'Sicherung eingespielt.');
    };
    $$('[data-tag]').forEach(b => b.onclick = () => einspielen({ tag: b.dataset.tag }));
    $('#datei').onchange = async e => { const d = e.target.files[0]; if (!d) return; try { einspielen({ sicherung: JSON.parse(await d.text()) }); } catch { meldung('Die Datei ist keine gültige Sicherung.', true); } };
  };

  // ===================== Start =====================
  (async () => {
    try {
      const ich = await api('/ich');
      if (!ich.angemeldet) return location.href = '/anmelden?zurueck=/verwaltung';
      if (ich.rolle !== 'admin') return location.href = '/mein-bereich';
      S.status = await api('/v/status');
      $('#wer').textContent = ich.name;
      $('#kopf-aktionen').innerHTML = '<a class="knopf knopf--leise knopf--klein" href="/mein-bereich">Ansicht Teilnehmerin</a><button class="knopf knopf--leise knopf--klein" id="ab">Abmelden</button>';
      $('#ab').onclick = abmelden;
      main.tabIndex = -1;
      route();
    } catch (e) { main.innerHTML = `<p class="formular__fehler">${esc(e.message)}</p>`; }
  })();
})();
