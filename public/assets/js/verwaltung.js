/* Verwaltung von anam-cara.at – alles, was Sabine und Nina selbst erledigen können */
(() => {
  const { esc, api, meldung, datum, zeit, $, $$, abmelden, verkleinern } = A;
  const main = $('#inhalt'), nav = $('#vnav');
  let S = { status: null, bilder: [], retreats: [], ungespeichert: false };
  const BEREICHE = [
    ['uebersicht', 'Übersicht'], ['anfragen', 'Anfragen'], ['reisen', 'Reisen & Termine'], ['teilnehmerinnen', 'Teilnehmerinnen'],
    ['texte', 'Texte'], ['bilder', 'Bilder'], ['stimmen', 'Rückmeldungen'], ['newsletter', 'Newsletter'],
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
    S.zaehler = { anfragen: u.anfragenNeu, stimmen: u.stimmenOffen }; navZeichnen('uebersicht', S.zaehler);
    const max = Math.max(1, ...u.besucheTage.map(t => t.n));
    const rot = chk.befunde.filter(b => b.stufe === 'rot');
    main.innerHTML = kopf(`Guten ${new Date().getHours() < 11 ? 'Morgen' : 'Tag'}, ${esc(S.status.ich.name.split(' ')[0])}`, `<a class="knopf knopf--leise" href="/" target="_blank" rel="noopener">Website ansehen</a>`) +
      (S.status.entwurf ? `<div class="hinweisbox">Auf der Website stehen noch <strong>Entwurfstexte</strong> nach dem Fragebogen. Unter <a href="#texte">Texte</a> durch eure eigenen ersetzen.</div>` : '') +
      (rot.length ? `<div class="hinweisbox"><strong>Vor dem Start erledigen:</strong><ul>${rot.map(b => `<li>${esc(b.text)}</li>`).join('')}</ul></div>` : '') +
      `<div class="raster3">
        <a class="karte" href="#anfragen"><span class="zahl">${u.anfragenNeu}</span><br><span class="zahl-beschr">neue Anfragen</span></a>
        <a class="karte" href="#newsletter"><span class="zahl">${u.kontakteAktiv}</span><br><span class="zahl-beschr">Newsletter-Empfängerinnen</span></a>
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

  // ===================== Anfragen =====================
  ANSICHT.anfragen = async () => {
    const liste = await api('/v/anfragen'); let filter = 'offen';
    const zeichnen = () => {
      const l = liste.filter(a => filter === 'alle' || (filter === 'offen' ? a.status !== 'erledigt' : a.art === filter));
      main.innerHTML = kopf('Anfragen') + `<div class="gruppen" role="group" aria-label="Filter">${[['offen', 'Offen'], ['alle', 'Alle'], ...Object.entries(ARTEN)].map(([k, t]) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${t}</button>`).join('')}</div>` +
        (l.length ? l.map(a => `<article class="karte" data-id="${a.id}">
          <div class="reihe"><span class="etikett ${a.status === 'neu' ? 'etikett--neu' : a.status === 'erledigt' ? 'etikett--gruen' : ''}">${ARTEN[a.art] || a.art}</span><strong>${esc(a.name)}</strong><span class="klein">${esc(zeit(a.zeit))}${a.sprache === 'en' ? ' · Englisch' : ''}</span></div>
          <p class="klein"><a href="mailto:${esc(a.email)}?subject=${encodeURIComponent('Deine Anfrage bei Anam Cara')}">${esc(a.email)}</a>${a.telefon ? ` · <a href="tel:${esc(a.telefon.replace(/[^+\d]/g, ''))}">${esc(a.telefon)}</a>` : ''}${a.retreat ? ' · ' + esc(a.retreat) : ''}${a.wann ? ' · Gesprächszeit: ' + esc(a.wann) : ''}${a.newsletter ? ' · möchte Newsletter' : ''}</p>
          ${a.nachricht ? `<div>${absaetze(a.nachricht)}</div>` : ''}
          <div class="raster2"><div class="feld"><label for="n-${a.id}">Interne Notiz</label><textarea id="n-${a.id}" rows="2" data-notiz>${esc(a.notiz || '')}</textarea></div>
          <div class="feld"><label for="s-${a.id}">Status</label><select id="s-${a.id}" data-status>${[['neu', 'Neu'], ['in-arbeit', 'In Arbeit'], ['erledigt', 'Erledigt']].map(([k, t]) => `<option value="${k}"${a.status === k ? ' selected' : ''}>${t}</option>`).join('')}</select></div></div>
          <p class="reihe"><a class="knopf knopf--klein" href="mailto:${esc(a.email)}?subject=${encodeURIComponent('Deine Anfrage bei Anam Cara')}">Antworten</a>${a.art !== 'teilnehmerin' ? `<a class="knopf knopf--leise knopf--klein" href="#teilnehmerinnen/einladen?name=${encodeURIComponent(a.name)}&email=${encodeURIComponent(a.email)}">Als Teilnehmerin einladen</a>` : ''}<button class="knopf knopf--leise knopf--klein" data-speichern>Speichern</button><button class="knopf knopf--leise knopf--klein" data-loeschen>Löschen</button></p>
        </article>`).join('') : '<p class="leer">Keine Anfragen in dieser Ansicht.</p>') +
        `<p class="klein">Anfragen werden nach ${'{frist}'} Monaten automatisch gelöscht (einstellbar unter Einstellungen).</p>`;
      $$('.gruppen button').forEach(b => b.onclick = () => { filter = b.dataset.f; zeichnen(); });
      $$('article[data-id]').forEach(art => {
        const a = liste.find(x => x.id === art.dataset.id);
        $('[data-speichern]', art).onclick = () => sicher(async () => { a.notiz = $('[data-notiz]', art).value; a.status = $('[data-status]', art).value; await api('/v/anfrage', { id: a.id, status: a.status, notiz: a.notiz }); zeichnen(); }, 'Gespeichert.');
        $('[data-status]', art).onchange = $('[data-speichern]', art).onclick;
        $('[data-loeschen]', art).onclick = () => confirm(`Anfrage von ${a.name} endgültig löschen?`) && sicher(async () => { await api('/v/anfrage/loeschen', { id: a.id }); liste.splice(liste.indexOf(a), 1); zeichnen(); }, 'Gelöscht.');
      });
      api('/v/inhalt').then(i => { const p = $$('.klein', main).pop(); if (p) p.textContent = p.textContent.replace('{frist}', i.einstellungen.fristen.anfragenMonate); });
    };
    zeichnen();
  };

  // ===================== Reisen =====================
  const leer = () => ({ id: '', slug: '', veroeffentlicht: false, status: 'geplant', von: '', bis: '', plaetze: '', bild: '', titel: { de: '', en: '' }, ort: { de: '', en: '' }, kurz: { de: '', en: '' }, text: { de: '', en: '' }, ablauf: { de: '', en: '' }, leistungen: { de: '', en: '' }, preis: { de: 'auf Anfrage', en: 'on request' }, infos: '', packliste: [], dokumente: [], nachrichten: [] });
  const zwei = (r, f, label, typ = 'zeile', hilfe = '') => `<div class="textfeld"><label>${label}</label>${hilfe ? `<p class="klein">${hilfe}</p>` : ''}<div class="zwei-sprachen">${['de', 'en'].map(l => `<div><span class="sprache">${l === 'de' ? 'DEUTSCH' : 'ENGLISCH'}</span>${typ === 'zeile' ? `<input data-f="${f}" data-l="${l}" value="${esc(r[f]?.[l] || '')}">` : `<textarea data-f="${f}" data-l="${l}" rows="${typ === 'lang' ? 7 : 3}">${esc(r[f]?.[l] || '')}</textarea>`}</div>`).join('')}</div></div>`;
  const bildWahl = (id, name) => `<div class="bildwahl" data-bildwahl="${name}">${id ? `<img src="${bildUrl(id)}" alt="">` : '<span class="platz"></span>'}<select data-bild="${name}"><option value="">Kein Foto (Zeichnung)</option>${S.bilder.map(b => `<option value="${b.id}"${b.id === id ? ' selected' : ''}>${esc(b.name)}${b.alt?.de ? ' – ' + esc(b.alt.de.slice(0, 40)) : ''}</option>`).join('')}</select></div>`;

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
          <div class="feld"><label>Foto der Reise</label>${bildWahl(r.bild, 'reise')}</div>
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
    const [bl, i] = await Promise.all([api('/v/bilder'), api('/v/inhalt')]); S.bilder = bl;
    const PL = { hero: 'Großes Bild auf der Startseite', sabine: 'Porträt Sabine', nina: 'Porträt Nina', ueber: 'Breites Bild auf „Über uns"' };
    main.innerHTML = kopf('Bilder', `<label class="knopf">Fotos hochladen<input type="file" id="up" accept="image/jpeg,image/png,image/webp" multiple hidden></label>`) +
      `<div class="hinweisbox">Bitte nur eigene Fotos oder Fotos mit Erlaubnis der Fotografin verwenden. Keine KI-Bilder. Große Fotos werden beim Hochladen automatisch verkleinert.</div>
      <div class="karte"><h2 class="h3">Wo welches Foto erscheint</h2><div class="raster2">${Object.entries(PL).map(([k, t]) => `<div class="feld"><label>${t}</label>${bildWahl(i.einstellungen.bildplaetze[k], k)}</div>`).join('')}</div>
      <label class="haken"><input type="checkbox" id="gal" ${i.einstellungen.abschnitte.galerie ? 'checked' : ''}><span>Galerie auf der Website zeigen (alle Bilder mit Haken „Galerie")</span></label>
      <button class="knopf knopf--klein" id="plaetze">Zuordnung speichern</button></div>
      <div class="bildraster">${bl.map(b => `<div class="bildkachel" data-id="${b.id}"><img src="${bildUrl(b.id)}" alt="" loading="lazy">
        <label class="klein" for="a-${b.id}">Beschreibung (für Blinde und Google)</label><input id="a-${b.id}" data-alt="de" value="${esc(b.alt?.de || '')}" placeholder="Was ist zu sehen?">
        <input data-alt="en" value="${esc(b.alt?.en || '')}" placeholder="English description" aria-label="Beschreibung Englisch">
        <label class="haken"><input type="checkbox" data-galerie ${b.galerie ? 'checked' : ''}><span>Galerie</span></label>
        <p class="reihe"><button class="knopf knopf--leise knopf--klein" data-sp>Speichern</button><button class="knopf knopf--leise knopf--klein" data-lo>Löschen</button></p></div>`).join('') || '<p class="leer">Noch keine Fotos.</p>'}</div>`;
    $$('[data-bild]').forEach(s => s.onchange = () => { const w = s.closest('.bildwahl'); w.firstElementChild.outerHTML = s.value ? `<img src="${bildUrl(s.value)}" alt="">` : '<span class="platz"></span>'; });
    $('#plaetze').onclick = () => sicher(() => api('/v/inhalt', { einstellungen: { bildplaetze: Object.fromEntries($$('[data-bild]').map(s => [s.dataset.bild, s.value])), abschnitte: { galerie: $('#gal').checked } } }), 'Gespeichert. Die Website ist aktualisiert.');
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
      $('[data-sp]', k).onclick = () => sicher(() => api('/v/bild/aendern', { id, alt: { de: $('[data-alt="de"]', k).value, en: $('[data-alt="en"]', k).value }, galerie: $('[data-galerie]', k).checked }), 'Gespeichert.');
      $('[data-galerie]', k).onchange = $('[data-sp]', k).onclick;
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

  // ===================== Einstellungen =====================
  ANSICHT.einstellungen = async () => {
    const [i, prot] = await Promise.all([api('/v/inhalt'), api('/v/protokoll')]); const E = i.einstellungen;
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
      <div class="raster2"><form class="karte" id="ich" novalidate><h2 class="h3">Mein Konto</h2>
        <div class="feld"><label for="i-n">Name</label><input id="i-n" name="name" value="${esc(S.status.ich.name)}"></div>
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
    $('#ich').onsubmit = async e => { e.preventDefault(); await sicher(() => api('/v/ich', { name: e.target.name.value, telefon: e.target.telefon.value }), 'Gespeichert.'); S.status.ich.telefon = e.target.telefon.value; };
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
      const konten = await api('/v/konten'); S.status.ich.id = konten.find(k => k.email === ich.email)?.id;
      $('#wer').textContent = ich.name;
      $('#kopf-aktionen').innerHTML = '<a class="knopf knopf--leise knopf--klein" href="/mein-bereich">Ansicht Teilnehmerin</a><button class="knopf knopf--leise knopf--klein" id="ab">Abmelden</button>';
      $('#ab').onclick = abmelden;
      main.tabIndex = -1;
      route();
    } catch (e) { main.innerHTML = `<p class="formular__fehler">${esc(e.message)}</p>`; }
  })();
})();
