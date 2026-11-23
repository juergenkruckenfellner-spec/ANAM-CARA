/* Persönlicher Bereich der Teilnehmerinnen */
(() => {
  const { esc, api, meldung, zeit, $, $$, abmelden } = A;
  const main = $('#inhalt');
  const absaetze = s => String(s || '').split(/\n\s*\n/).filter(x => x.trim()).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const tageBis = iso => Math.ceil((new Date(iso + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5);

  async function laden() {
    const d = await api('/bereich');
    $('#wer').textContent = d.konto.name;
    $('#kopf-aktionen').innerHTML = `${d.konto.rolle === 'admin' ? '<a class="knopf knopf--leise knopf--klein" href="/verwaltung">Verwaltung</a>' : ''}<button class="knopf knopf--leise knopf--klein" id="ab">Abmelden</button>`;
    $('#ab').onclick = abmelden;
    const vor = d.konto.name.split(' ')[0];
    main.innerHTML = `<p class="vorzeile">Dein Bereich</p><h1 class="h1">Hallo ${esc(vor)}</h1>
      ${d.reisen.length ? '' : '<div class="karte"><p>Hier erscheinen deine Reiseinfos, sobald Sabine oder Nina dich einer Reise zugeordnet haben.</p></div>'}
      ${d.reisen.map(reise).join('')}
      ${profil(d.konto)}`;
    binden(d);
  }

  function reise(r) {
    const t = tageBis(r.von);
    const zaehler = t > 1 ? `<span class="zahl">${t}</span><span class="zahl-beschr">Tage bis zur Abreise</span>` : t >= -7 && !r.vorbei ? `<span class="zahl">✦</span><span class="zahl-beschr">Gute Reise</span>` : `<span class="zahl-beschr">Danke, dass du dabei warst</span>`;
    return `<section class="reise-block" data-rid="${esc(r.id)}">
    <div class="reisekopf"><div><p class="vorzeile vorzeile--hell">${esc(r.zeitraum)} · ${esc(r.ort)}</p><h2 class="h2">${esc(r.titel)}</h2><p><a class="pfeil pfeil--hell" href="${esc(r.pfad)}">Zur Reiseseite</a></p></div><div class="reisekopf__zaehler">${zaehler}</div></div>
    <div class="raster2">
      <div>
        <div class="karte"><h3 class="h3">Reiseinfos</h3>${r.infos ? absaetze(r.infos) : '<p class="leer">Treffpunkt, Anreise und Ablauf tragen Sabine und Nina hier ein.</p>'}</div>
        <div class="karte"><h3 class="h3">Neuigkeiten</h3>${r.nachrichten.length ? r.nachrichten.map(n => `<div class="nachricht"><small>${esc(zeit(n.zeit))} · ${esc(n.von)}</small>${absaetze(n.text)}</div>`).join('') : '<p class="leer">Noch keine Neuigkeiten.</p>'}</div>
        <div class="karte"><h3 class="h3">Frage an Sabine & Nina</h3><form class="frage" novalidate><div class="feld"><label for="fr-${esc(r.id)}" class="sr">Deine Frage</label><textarea id="fr-${esc(r.id)}" name="text" rows="4" placeholder="Was möchtest du wissen?" required></textarea></div><button class="knopf knopf--hell" type="submit">Frage senden</button></form></div>
      </div>
      <div>
        <div class="karte"><h3 class="h3">Packliste</h3>${r.packliste.length ? `<ul class="packliste">${r.packliste.map((p, i) => `<li><label><input type="checkbox" data-i="${i}" ${r.abgehakt.includes(i) ? 'checked' : ''}><span>${esc(p)}</span></label></li>`).join('')}</ul><p class="klein">${r.abgehakt.length} von ${r.packliste.length} eingepackt</p>` : '<p class="leer">Die Packliste folgt.</p>'}</div>
        <div class="karte dokumente"><h3 class="h3">Unterlagen</h3>${r.dokumente.length ? r.dokumente.map(d => `<a href="/api/dokument/${esc(r.id)}/${esc(d.id)}" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2h7l4 4v12H5z M12 2v4h4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>${esc(d.name)}</a>`).join('') : '<p class="leer">Reiseunterlagen erscheinen hier, sobald sie bereitstehen.</p>'}</div>
        ${r.vorbei ? (r.rueckmeldung ? '<div class="karte"><h3 class="h3">Rückmeldung</h3><p>Danke für deine Zeilen!</p></div>' : `<div class="karte"><h3 class="h3">Wie war es für dich?</h3><form class="rueck" novalidate>
          <div class="feld"><label for="rt-${esc(r.id)}">Deine Rückmeldung</label><textarea id="rt-${esc(r.id)}" name="text" rows="5" required></textarea></div>
          <div class="feld"><label for="rn-${esc(r.id)}">Name, falls wir sie zeigen dürfen</label><input id="rn-${esc(r.id)}" name="name" placeholder="zum Beispiel: Andrea aus Graz"></div>
          <label class="haken"><input type="checkbox" name="veroeffentlichen" value="ja"><span>Ja, Anam Cara darf meine Rückmeldung mit diesem Namen auf der Website zeigen. Ich kann das jederzeit widerrufen.</span></label>
          <button class="knopf knopf--hell" type="submit">Absenden</button></form></div>`) : ''}
      </div>
    </div></section>`;
  }

  function profil(k) {
    return `<section class="karte" id="profil"><h2 class="h3">Dein Konto</h2>
    <form class="profil raster2" novalidate>
      <div class="feld"><label for="pn">Name</label><input id="pn" name="name" value="${esc(k.name)}" autocomplete="name"></div>
      <div class="feld"><label for="pt">Mobilnummer <span class="feld__hinweis">freiwillig, für den Anmeldecode per SMS</span></label><input id="pt" name="telefon" type="tel" value="${esc(k.telefon)}" placeholder="+43 …"></div>
      <div><button class="knopf knopf--leise" type="submit">Speichern</button></div>
    </form>
    <details class="klappe"><summary>Kennwort ändern</summary><form class="kennwort raster2" novalidate>
      <div class="feld"><label for="ka">Bisheriges Kennwort</label><input id="ka" name="alt" type="password" autocomplete="current-password"></div>
      <div class="feld"><label for="kn">Neues Kennwort (mind. 10 Zeichen)</label><input id="kn" name="neu" type="password" autocomplete="new-password"></div>
      <div><button class="knopf knopf--leise" type="submit">Kennwort ändern</button></div></form></details>
    <details class="klappe"><summary>Deine Daten</summary>
      <p>Du kannst jederzeit alle Daten herunterladen, die wir über dich gespeichert haben, oder dein Konto löschen. Buchungsdaten liegen zusätzlich beim Reiseveranstalter.</p>
      <p class="reihe"><a class="knopf knopf--leise" href="/api/bereich/daten">Meine Daten herunterladen</a><button class="knopf knopf--gefahr" type="button" id="loeschen">Konto löschen</button></p>
    </details></section>`;
  }

  function binden(d) {
    $$('.reise-block').forEach(b => {
      const rid = b.dataset.rid;
      $$('.packliste input', b).forEach(c => c.onchange = async () => {
        try { await api('/bereich/packliste', { rid, index: Number(c.dataset.i), an: c.checked });
          const n = $$('.packliste input:checked', b).length; $('.packliste + .klein', b).textContent = `${n} von ${$$('.packliste input', b).length} eingepackt`;
        } catch (e) { c.checked = !c.checked; meldung(e.message, true); }
      });
      const fr = $('.frage', b); fr && (fr.onsubmit = async e => { e.preventDefault(); if (!fr.text.value.trim()) return fr.text.focus();
        try { await api('/bereich/frage', { rid, text: fr.text.value }); fr.reset(); meldung('Danke, deine Frage ist bei Sabine und Nina angekommen.'); } catch (er) { meldung(er.message, true); } });
      const rk = $('.rueck', b); rk && (rk.onsubmit = async e => { e.preventDefault(); if (!rk.text.value.trim()) return rk.text.focus();
        try { await api('/bereich/rueckmeldung', { rid, text: rk.text.value, name: rk.name.value, veroeffentlichen: rk.veroeffentlichen.checked }); meldung('Danke für deine Rückmeldung!'); laden(); } catch (er) { meldung(er.message, true); } });
    });
    const pf = $('.profil'); pf.onsubmit = async e => { e.preventDefault(); try { await api('/bereich/profil', { name: pf.name.value, telefon: pf.telefon.value }); meldung('Gespeichert.'); } catch (er) { meldung(er.message, true); } };
    const kw = $('.kennwort'); kw.onsubmit = async e => { e.preventDefault(); try { await api('/konto/kennwort', { alt: kw.alt.value, neu: kw.neu.value }); kw.reset(); meldung('Kennwort geändert.'); } catch (er) { meldung(er.message, true); } };
    $('#loeschen').onclick = async () => {
      if (!confirm('Möchtest du dein Konto wirklich löschen? Packliste, Nachrichten und Rückmeldungen gehen verloren.')) return;
      if (!confirm('Bist du ganz sicher? Das lässt sich nicht rückgängig machen.')) return;
      try { await api('/bereich/loeschen', { bestaetigt: true }); location.href = '/'; } catch (er) { meldung(er.message, true); }
    };
  }

  laden().catch(e => { main.innerHTML = `<p class="formular__fehler">${esc(e.message)}</p>`; });
})();
