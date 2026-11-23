/* Anam Cara – öffentliche Seite. Ohne Fremdbibliotheken. */
(() => {
  const d = document, html = d.documentElement;
  html.classList.add('js');
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)');

  // Menü (mobil)
  const mk = d.querySelector('.menue-knopf'), nav = d.getElementById('hauptnav');
  mk?.addEventListener('click', () => {
    const offen = nav.classList.toggle('ist-offen');
    mk.setAttribute('aria-expanded', offen);
  });
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && nav?.classList.contains('ist-offen')) { nav.classList.remove('ist-offen'); mk.setAttribute('aria-expanded', 'false'); mk.focus(); } });

  // Kopf-Linie und „Nach oben"
  const kopf = d.querySelector('.kopf'), oben = d.querySelector('.nach-oben');
  if (oben) oben.hidden = false;
  const beimScrollen = () => {
    const y = scrollY;
    kopf?.classList.toggle('ist-gescrollt', y > 8);
    oben?.classList.toggle('ist-sichtbar', y > innerHeight * 0.6);
  };
  addEventListener('scroll', beimScrollen, { passive: true }); beimScrollen();
  oben?.addEventListener('click', () => {
    if (ruhig.matches) {
      const vorher = html.style.scrollBehavior; html.style.scrollBehavior = 'auto';
      void html.offsetHeight; scrollTo(0, 0); html.style.scrollBehavior = vorher;
    } else scrollTo({ top: 0, behavior: 'smooth' });
    d.querySelector('.logo')?.focus({ preventScroll: true });
  });

  // Einblenden beim Hereinscrollen: nur was unter der Falz liegt, einmalig, gestaffelt
  function auftritteSetzen() {
    const els = [...d.querySelectorAll('.auftritt:not(.ist-da):not(.wartet)')];
    if (ruhig.matches || !('IntersectionObserver' in window)) return;
    const falz = innerHeight;
    const io = new IntersectionObserver((eintraege) => {
      let n = 0;
      eintraege.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target; io.unobserve(el);
        setTimeout(() => { el.classList.add('ist-da'); el.classList.remove('wartet'); }, 70 * n++);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => { if (el.getBoundingClientRect().top > falz) { el.classList.add('wartet'); io.observe(el); } });
  }
  auftritteSetzen();

  // Anonyme Besuchszählung: ohne Cookie, ohne Kennung, ohne IP-Speicherung
  try {
    const r = d.referrer ? new URL(d.referrer).host : '';
    const q = r && r !== location.host ? r : '';
    navigator.sendBeacon?.('/api/z', new Blob([JSON.stringify({ p: location.pathname, r: q })], { type: 'application/json' }));
  } catch {}

  const post = async (url, daten) => {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(daten) });
    let j = {}; try { j = await r.json(); } catch {}
    if (!r.ok) throw new Error(j.fehler || 'Fehler');
    return j;
  };
  const geladen = Date.now();
  const en = html.lang === 'en';
  const T = {
    pflicht: en ? 'Please fill in this field.' : 'Bitte fülle dieses Feld aus.',
    mail: en ? 'Please check the email address.' : 'Bitte prüfe die E-Mail-Adresse.',
    einw: en ? 'Please tick the consent box.' : 'Bitte bestätige die Einwilligung.',
    allg: en ? 'Sorry, that did not work. Please try again.' : 'Das hat leider nicht geklappt. Bitte versuch es noch einmal.',
    sende: en ? 'Sending…' : 'Wird gesendet…',
  };
  const mailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  // Anfrageformular mit Modus je Angebot (marketing-funnel-baustein)
  d.querySelectorAll('form[data-formular="anfrage"]').forEach(f => {
    const pflichtJe = { anfrage: ['name', 'email', 'nachricht'], retreat: ['name', 'email', 'retreat'], kennen: ['name', 'email', 'telefon'], warte: ['name', 'email'] };
    const knopf = f.querySelector('button[type="submit"]');
    const setzeModus = m => {
      if (!pflichtJe[m]) return;
      f.dataset.modus = m; f.anfrageart.value = m;
      f.querySelectorAll('[name="modusWahl"]').forEach(r => r.checked = r.value === m);
      f.querySelectorAll('[data-nur]').forEach(el => { el.hidden = !el.dataset.nur.split(' ').includes(m); });
      f.querySelectorAll('.feld').forEach(el => {
        const inp = el.querySelector('input,textarea,select'); if (!inp) return;
        const pf = pflichtJe[m].includes(inp.name);
        inp.required = pf;
        const opt = el.querySelector('[data-optional]'); if (opt) opt.hidden = pf;
      });
      knopf.textContent = knopf.dataset['text' + m[0].toUpperCase() + m.slice(1)] || knopf.textContent;
    };
    f.querySelectorAll('[name="modusWahl"]').forEach(r => r.addEventListener('change', () => setzeModus(r.value)));
    const ausHash = () => {
      const h = location.hash.slice(1);
      if (h.startsWith('retreat-')) { setzeModus('retreat'); const s = f.querySelector('[name="retreat"]'); if (s) s.value = h.slice(8); }
      else if (['anfrage', 'kennen', 'warte', 'retreat'].includes(h)) setzeModus(h);
    };
    setzeModus(f.dataset.modus); ausHash(); addEventListener('hashchange', ausHash);

    f.addEventListener('submit', async e => {
      e.preventDefault();
      const fehler = f.querySelector('.formular__fehler'); fehler.hidden = true;
      let erstes = null;
      f.querySelectorAll('input,textarea,select').forEach(inp => {
        if (inp.closest('[hidden]') || inp.type === 'hidden' || inp.type === 'radio') return;
        let bad = inp.required && !inp.value.trim();
        if (!bad && inp.type === 'email' && inp.value && !mailOk(inp.value.trim())) bad = true;
        inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && !erstes) erstes = inp;
      });
      if (erstes) { fehler.textContent = erstes.type === 'email' && erstes.value ? T.mail : T.pflicht; fehler.hidden = false; erstes.focus(); return; }
      const daten = Object.fromEntries(new FormData(f)); delete daten.modusWahl;
      daten.lang = f.dataset.lang; daten.dauer = Date.now() - geladen;
      knopf.disabled = true; const alt = knopf.textContent; knopf.textContent = T.sende;
      try {
        await post('/api/anfrage', daten);
        [...f.children].forEach(c => { if (!c.classList.contains('formular__danke')) c.hidden = true; });
        const dk = f.querySelector('.formular__danke'); dk.hidden = false; dk.focus();
      } catch (err) { fehler.textContent = err.message && err.message !== 'Fehler' ? err.message : T.allg; fehler.hidden = false; }
      finally { knopf.disabled = false; knopf.textContent = alt; }
    });
  });

  // Newsletter-Anmeldung (Double-Opt-in)
  d.querySelectorAll('form[data-formular="newsletter"]').forEach(f => {
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const fehler = f.querySelector('.formular__fehler'); fehler.hidden = true;
      const mail = f.email.value.trim();
      if (!mailOk(mail)) { fehler.textContent = T.mail; fehler.hidden = false; f.email.setAttribute('aria-invalid', 'true'); f.email.focus(); return; }
      if (!f.einwilligung.checked) { fehler.textContent = T.einw; fehler.hidden = false; f.einwilligung.focus(); return; }
      const b = f.querySelector('button'); b.disabled = true;
      try {
        await post('/api/newsletter/anmelden', { email: mail, einwilligung: true, lang: f.dataset.lang, quelle: f.dataset.quelle, webseite: f.webseite.value, dauer: Date.now() - geladen });
        f.querySelector('.nl__zeile').hidden = true; f.querySelector('.haken').hidden = true;
        const dk = f.querySelector('.formular__danke'); dk.hidden = false; dk.focus();
      } catch (err) { fehler.textContent = err.message !== 'Fehler' ? err.message : T.allg; fehler.hidden = false; }
      finally { b.disabled = false; }
    });
  });

  // Newsletter bestätigen / abbestellen (Abmelden erst nach zwei Bestätigungen)
  d.querySelectorAll('[data-nl-schritt]').forEach(box => {
    const t = box.dataset.token, fehler = box.querySelector('.formular__fehler'), danke = box.querySelector('.formular__danke');
    const fertig = () => { box.querySelectorAll('[data-stufe], button').forEach(x => x.hidden = true); danke.hidden = false; };
    box.addEventListener('click', async e => {
      const a = e.target.closest('[data-aktion]')?.dataset.aktion; if (!a) return;
      fehler.hidden = true;
      if (a === 'stufe2') { box.querySelector('[data-stufe="1"]').hidden = true; box.querySelector('[data-stufe="2"]').hidden = false; box.querySelector('[data-stufe="2"] button').focus(); return; }
      try { await post(a === 'bestaetigen' ? '/api/newsletter/bestaetigen' : '/api/newsletter/abmelden', { t }); fertig(); }
      catch (err) { fehler.textContent = err.message !== 'Fehler' ? err.message : T.allg; fehler.hidden = false; }
    });
  });

  // Galerie: einfacher Leuchtkasten
  d.addEventListener('click', e => {
    const a = e.target.closest('a[data-gross]'); if (!a) return;
    e.preventDefault();
    const box = d.createElement('div'); box.className = 'leuchtkasten'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    const img = d.createElement('img'); img.src = a.getAttribute('href'); img.alt = a.querySelector('img')?.alt || '';
    const zu = d.createElement('button'); zu.type = 'button'; zu.setAttribute('aria-label', en ? 'Close' : 'Schließen'); zu.textContent = '×';
    box.append(img, zu); d.body.append(box); zu.focus();
    const weg = () => { box.remove(); a.focus(); d.removeEventListener('keydown', esc); };
    const esc = ev => { if (ev.key === 'Escape') weg(); };
    zu.onclick = weg; box.onclick = ev => { if (ev.target === box) weg(); }; d.addEventListener('keydown', esc);
  });
})();
