/* Anmeldung (Kennwort + Einmalcode), Ersteinrichtung, Kennwort vergessen/neu, Einladung annehmen */
(() => {
  const { esc, api, $ } = A;
  const q = new URLSearchParams(location.search);
  const en = q.get('lang') === 'en';
  const box = $('#ansicht');
  const T = en ? {
    titel: 'Sign in', mail: 'Email', pw: 'Password', los: 'Continue', vergessen: 'Forgot your password?',
    code: 'We have sent you a one-time code', codeText: w => w === 'sms' ? 'Please enter the 6-digit code from the text message.' : 'Please enter the 6-digit code from the email we have just sent you.',
    codeFeld: 'Code', bestaetigen: 'Sign in', zurueck: 'Back', neuTitel: 'Set a new password', neuPw: 'New password (at least 10 characters)', speichern: 'Save',
    vergTitel: 'Reset password', vergText: 'Enter your email address. If an account exists, you will receive a link.', senden: 'Send link',
    vergOk: 'If an account exists for this address, a link is on its way.', einlTitel: 'Welcome', einlText: n => `Hello ${n}, please choose a password for your personal area.`,
    ds: 'I have read the privacy policy.', fehlerPw: 'At least 10 characters, please.',
  } : {
    titel: 'Anmelden', mail: 'E-Mail-Adresse', pw: 'Kennwort', los: 'Weiter', vergessen: 'Kennwort vergessen?',
    code: 'Wir haben dir einen Anmeldecode geschickt', codeText: w => w === 'sms' ? 'Bitte gib den sechsstelligen Code aus der SMS ein.' : 'Bitte gib den sechsstelligen Code aus der E-Mail ein, die wir dir gerade geschickt haben.',
    codeFeld: 'Code', bestaetigen: 'Anmelden', zurueck: 'Zurück', neuTitel: 'Neues Kennwort festlegen', neuPw: 'Neues Kennwort (mindestens 10 Zeichen)', speichern: 'Speichern',
    vergTitel: 'Kennwort zurücksetzen', vergText: 'Gib deine E-Mail-Adresse ein. Wenn es ein Konto dazu gibt, bekommst du einen Link.', senden: 'Link schicken',
    vergOk: 'Wenn es zu dieser Adresse ein Konto gibt, ist der Link unterwegs.', einlTitel: 'Willkommen', einlText: n => `Hallo ${n}, bitte lege ein Kennwort für deinen persönlichen Bereich fest.`,
    ds: 'Ich habe die Datenschutzerklärung gelesen.', fehlerPw: 'Bitte mindestens 10 Zeichen.',
  };
  if (en) { document.documentElement.lang = 'en'; $('#a-titel').textContent = 'Welcome back'; $('#a-zitat').textContent = 'Participants find travel information, packing list and documents here. Sabine and Nina manage the whole website from here.'; }
  const ziel = rolle => { const z = q.get('zurueck'); location.href = z && z.startsWith('/') && !z.startsWith('//') ? z : (rolle === 'admin' ? '/verwaltung' : '/mein-bereich'); };

  function formular(html, beiSenden) {
    box.innerHTML = html + '<p class="formular__fehler" role="alert" hidden></p>';
    const f = box.querySelector('form'); const fe = box.querySelector('.formular__fehler');
    f.addEventListener('submit', async e => {
      e.preventDefault(); fe.hidden = true; const b = f.querySelector('button[type=submit]'); b.disabled = true;
      try { await beiSenden(Object.fromEntries(new FormData(f)), f); } catch (err) { fe.textContent = err.message; fe.hidden = false; }
      finally { b.disabled = false; }
    });
    f.querySelector('input')?.focus();
    return f;
  }

  function login() {
    formular(`<h2 class="h2">${T.titel}</h2><form novalidate>
      <div class="feld"><label for="m">${T.mail}</label><input id="m" name="email" type="email" autocomplete="username" required></div>
      <div class="feld"><label for="p">${T.pw}</label><input id="p" name="kennwort" type="password" autocomplete="current-password" required></div>
      <button class="knopf" type="submit">${T.los}</button></form>
      <p><a class="textlink" href="#" id="verg">${T.vergessen}</a></p>`, async d => {
      const r = await api('/anmelden', d, { still: true });
      if (r.ok) return ziel(r.rolle);
      code(r.ticket, r.weg);
    });
    $('#verg').onclick = e => { e.preventDefault(); vergessen(); };
  }
  function code(ticket, weg) {
    formular(`<h2 class="h2">${T.code}</h2><p>${T.codeText(weg)}</p><form novalidate>
      <div class="feld"><label for="c">${T.codeFeld}</label><input id="c" class="code-eingabe" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>
      <button class="knopf" type="submit">${T.bestaetigen}</button></form><p><a class="textlink" href="#" id="zur">${T.zurueck}</a></p>`, async d => {
      const r = await api('/anmelden/code', { ticket, code: d.code }, { still: true });
      ziel(r.rolle);
    });
    $('#zur').onclick = e => { e.preventDefault(); login(); };
  }
  function vergessen() {
    formular(`<h2 class="h2">${T.vergTitel}</h2><p>${T.vergText}</p><form novalidate>
      <div class="feld"><label for="m">${T.mail}</label><input id="m" name="email" type="email" required></div>
      <button class="knopf" type="submit">${T.senden}</button></form><p><a class="textlink" href="#" id="zur">${T.zurueck}</a></p>`, async (d, f) => {
      await api('/kennwort/vergessen', d, { still: true });
      f.outerHTML = `<p class="formular__danke">${T.vergOk}</p>`;
    });
    $('#zur').onclick = e => { e.preventDefault(); login(); };
  }
  function neu(t) {
    formular(`<h2 class="h2">${T.neuTitel}</h2><form novalidate>
      <div class="feld"><label for="p">${T.neuPw}</label><input id="p" name="kennwort" type="password" autocomplete="new-password" minlength="10" required></div>
      <button class="knopf" type="submit">${T.speichern}</button></form>`, async d => {
      if ((d.kennwort || '').length < 10) throw new Error(T.fehlerPw);
      await api('/kennwort/neu', { t, kennwort: d.kennwort }, { still: true });
      history.replaceState(null, '', '/anmelden'); login();
    });
  }
  function einrichten() {
    $('#a-titel').textContent = 'Ersteinrichtung';
    $('#a-zitat').textContent = 'Hier wird das erste Verwaltungskonto angelegt. Den Einrichtungscode hat Jürgen (webseitefix.at) im Hosting hinterlegt.';
    formular(`<h2 class="h2">Verwaltung einrichten</h2><form novalidate>
      <div class="feld"><label for="c">Einrichtungscode</label><input id="c" name="code" required autocomplete="off"></div>
      <div class="feld"><label for="n">Dein Name</label><input id="n" name="name" required autocomplete="name"></div>
      <div class="feld"><label for="m">E-Mail-Adresse</label><input id="m" name="email" type="email" required autocomplete="username"></div>
      <div class="feld"><label for="t">Mobilnummer für den Anmeldecode per SMS <span class="feld__hinweis">freiwillig</span></label><input id="t" name="telefon" type="tel" placeholder="+43 …"></div>
      <div class="feld"><label for="p">Kennwort (mindestens 10 Zeichen)</label><input id="p" name="kennwort" type="password" autocomplete="new-password" minlength="10" required></div>
      <button class="knopf" type="submit">Konto anlegen</button></form>`, async d => {
      const r = await api('/einrichten', d, { still: true }); ziel(r.rolle);
    });
  }
  async function einladung() {
    const t = q.get('t') || '';
    try {
      const info = await api('/einladung', { t }, { still: true });
      $('#a-titel').textContent = T.einlTitel;
      formular(`<h2 class="h2">${T.einlTitel}</h2><p>${esc(T.einlText(info.name.split(' ')[0]))}</p><form novalidate>
        <div class="feld"><label for="m">${T.mail}</label><input id="m" type="email" value="${esc(info.email)}" readonly autocomplete="username"></div>
        <div class="feld"><label for="p">${T.neuPw}</label><input id="p" name="kennwort" type="password" autocomplete="new-password" minlength="10" required></div>
        <label class="haken"><input type="checkbox" name="datenschutz" value="ja" required><span>${T.ds} <a href="${en ? '/en/privacy' : '/datenschutz'}" target="_blank" rel="noopener">${en ? 'Privacy policy' : 'Datenschutzerklärung'}</a></span></label>
        <button class="knopf" type="submit">${T.speichern}</button></form>`, async d => {
        if ((d.kennwort || '').length < 10) throw new Error(T.fehlerPw);
        if (!d.datenschutz) throw new Error(en ? 'Please confirm the privacy notice.' : 'Bitte bestätige den Datenschutzhinweis.');
        const r = await api('/einladung', { t, kennwort: d.kennwort, datenschutz: true }, { still: true });
        ziel(r.rolle);
      });
    } catch (err) { box.innerHTML = `<h2 class="h2">${en ? 'Invitation' : 'Einladung'}</h2><p class="formular__fehler">${esc(err.message)}</p><p><a class="knopf" href="/anmelden">${T.titel}</a></p>`; }
  }

  (async () => {
    if (location.pathname.startsWith('/einladung')) return einladung();
    if (q.get('neu')) return neu(q.get('neu'));
    try {
      const ich = await api('/ich', undefined, { still: true });
      if (ich.angemeldet) return ziel(ich.rolle);
      if (ich.einrichtungOffen && q.has('einrichten')) return einrichten();
      if (ich.einrichtungOffen) { login(); box.insertAdjacentHTML('beforeend', '<p class="klein">Noch kein Verwaltungskonto? <a href="/anmelden?einrichten">Ersteinrichtung</a></p>'); return; }
    } catch {}
    login();
  })();
})();
