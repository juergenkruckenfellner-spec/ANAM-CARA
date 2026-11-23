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

  // Bewegte Landschaft: Scrollfortschritt 0…1 verwandelt Abend in Mondnacht
  const land = d.querySelector('.landschaft');
  if (land) {
    let wartet = false;
    const setzen = () => {
      wartet = false;
      const max = Math.max(1, d.documentElement.scrollHeight - innerHeight);
      const p = Math.min(1, Math.max(0, scrollY / max));
      land.style.setProperty('--p', (ruhig.matches ? Math.min(p, .5) : p).toFixed(4));
    };
    addEventListener('scroll', () => { if (!wartet) { wartet = true; requestAnimationFrame(setzen); } }, { passive: true });
    addEventListener('resize', setzen); setzen();
  }

  // ---------- Rauch: weiche Schwaden, die fortlaufend aufsteigen ----------
  // Schwaden-Sprites aus der Nebeltextur: unregelmäßig und faserig statt runder Flecken
  const nebelBild = new Image(); nebelBild.src = '/assets/bilder/nebel-2.webp';
  function rauchSprites(farbe) {
    const liste = [];
    for (let k = 0; k < 5; k++) {
      const c = d.createElement('canvas'); c.width = 256; c.height = 320; const x = c.getContext('2d');
      if (nebelBild.complete && nebelBild.naturalWidth) {
        const sx = Math.random() * (nebelBild.naturalWidth - 420), sy = 60 + Math.random() * 120;
        x.save(); x.translate(128, 160); x.rotate(Math.PI / 2 + (Math.random() - .5) * .6); x.drawImage(nebelBild, sx, sy, 420, 300, -170, -120, 340, 240); x.restore();
        x.globalCompositeOperation = 'source-in'; x.fillStyle = `rgb(${farbe})`; x.fillRect(0, 0, 256, 320);
        x.globalCompositeOperation = 'destination-in';
        const g = x.createRadialGradient(128, 160, 20, 128, 160, 150); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(0, 0, 256, 320);
      } else {
        const g = x.createRadialGradient(128, 160, 0, 128, 160, 110); g.addColorStop(0, `rgba(${farbe},.25)`); g.addColorStop(1, `rgba(${farbe},0)`); x.fillStyle = g; x.fillRect(0, 0, 256, 320);
      }
      liste.push(c);
    }
    return liste;
  }
  function rauch(canvas, { anzahl = 30, alpha = .5, farbe = '236,230,218', quelle, hoehe = .7, groesse = [60, 160], tempo = [.25, .6], skala = .5 }) {
    const x = canvas.getContext('2d'); let sprites = rauchSprites(farbe); if (!nebelBild.complete) nebelBild.addEventListener('load', () => { sprites = rauchSprites(farbe); }); let teile = [], b = 0, h = 0, lauf = true;
    const mass = () => { const r = canvas.getBoundingClientRect(); b = canvas.width = Math.max(1, Math.round(r.width * skala)); h = canvas.height = Math.max(1, Math.round(r.height * skala)); };
    mass(); addEventListener('resize', mass);
    const neu = (start) => { const q = quelle(b, h); return { x: q.x, y: start ? h - Math.random() * h * hoehe : q.y, vx: (Math.random() - .5) * .15, vy: -(tempo[0] + Math.random() * (tempo[1] - tempo[0])) * skala * 2, s: (groesse[0] + Math.random() * (groesse[1] - groesse[0])) * skala, ds: .12 * skala, r: Math.random() * 6.3, vr: (Math.random() - .5) * .004, ph: Math.random() * 6.3, k: Math.floor(Math.random() * 5), t: 0, max: (h * hoehe) / ((tempo[0] + tempo[1]) * skala) }; };
    for (let i = 0; i < anzahl; i++) teile.push(neu(true));
    const schritt = () => {
      if (!lauf) return;
      x.clearRect(0, 0, b, h);
      for (const p of teile) {
        p.t++; p.ph += .01; p.x += p.vx + Math.sin(p.ph) * .25 * skala; p.y += p.vy; p.s += p.ds; p.r += p.vr;
        const leben = p.t / p.max, a = alpha * Math.min(1, leben * 4) * Math.max(0, 1 - leben);
        if (a <= 0 && leben > 1) { Object.assign(p, neu(false)); continue; }
        x.globalAlpha = a; x.save(); x.translate(p.x, p.y); x.rotate(Math.sin(p.r) * .35); x.drawImage(sprites[p.k], -p.s / 2, -p.s * .62, p.s, p.s * 1.25); x.restore();
      }
      requestAnimationFrame(schritt);
    };
    d.addEventListener('visibilitychange', () => { const war = lauf; lauf = !d.hidden; if (lauf && !war) requestAnimationFrame(schritt); });
    requestAnimationFrame(schritt);
  }
  if (land && !ruhig.matches) {
    const hinten = d.createElement('canvas'); hinten.className = 'land__rauch'; hinten.setAttribute('aria-hidden', 'true');
    land.insertBefore(hinten, land.querySelector('.land__lichter'));
    rauch(hinten, { anzahl: 46, alpha: .75, quelle: (b, h) => ({ x: Math.random() * b, y: h + 40 }), hoehe: .75, groesse: [90, 240], tempo: [.3, .7] });
    const vorne = d.createElement('canvas'); vorne.className = 'rauch-vorne'; vorne.setAttribute('aria-hidden', 'true'); d.body.append(vorne);
    rauch(vorne, { anzahl: 18, alpha: .32, farbe: '205,198,186', quelle: (b, h) => ({ x: Math.random() < .5 ? Math.random() * b * .13 : b - Math.random() * b * .13, y: h + 30 }), hoehe: .95, groesse: [70, 170], tempo: [.35, .65] });
  }

  // ---------- Ritual: Feuer im Steinkreis, Funken und drei Atemzüge ----------
  d.querySelectorAll('[data-ritual]').forEach(r => {
    const en = r.dataset.lang === 'en';
    const T = en ? { ein: 'Breathe in', halt: 'Hold', aus: 'Breathe out', zahl: n => `Breath ${n} of 3`, neu: 'Once more' } : { ein: 'Einatmen', halt: 'Halten', aus: 'Ausatmen', zahl: n => `Atemzug ${n} von 3`, neu: 'Noch einmal' };
    const anz = r.querySelector('.ritual__anzeige'), knopf = r.querySelector('[data-ritual-start]'), ende = r.querySelector('.ritual__ende');
    const funken = r.querySelector('.ritual__funken'); let funkenAn = false;
    const warte = ms => new Promise(ok => setTimeout(ok, ms));
    function funkenStarten() {
      if (funkenAn || ruhig.matches) return; funkenAn = true;
      const x = funken.getContext('2d'); let b, h; const teile = [];
      const mass = () => { const q = funken.getBoundingClientRect(); b = funken.width = q.width; h = funken.height = q.height; }; mass(); addEventListener('resize', mass);
      const glut = d.createElement('canvas'); glut.width = glut.height = 32; const g = glut.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(255,226,170,1)'); gr.addColorStop(.35, 'rgba(240,160,80,.7)'); gr.addColorStop(1, 'rgba(232,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
      const quelle = () => { const s = r.querySelector('.ritual__kreis').getBoundingClientRect(), f = funken.getBoundingClientRect(); return { x: s.left - f.left + s.width / 2, y: s.top - f.top + s.height * .62 }; };
      const schritt = () => {
        x.clearRect(0, 0, b, h); const q = quelle();
        if (teile.length < 46 && Math.random() < .5) teile.push({ x: q.x + (Math.random() - .5) * 26, y: q.y, vx: (Math.random() - .5) * .5, vy: -(0.7 + Math.random() * 1.3), t: 0, max: 90 + Math.random() * 120, s: 3 + Math.random() * 5, ph: Math.random() * 6 });
        for (let i = teile.length - 1; i >= 0; i--) { const p = teile[i]; p.t++; p.ph += .08; p.x += p.vx + Math.sin(p.ph) * .35; p.y += p.vy; p.vy *= .995;
          const a = Math.max(0, 1 - p.t / p.max); if (a <= 0) { teile.splice(i, 1); continue; }
          x.globalAlpha = a * (.6 + .4 * Math.sin(p.ph * 2)); x.drawImage(glut, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); }
        requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
      rauch(funken.parentElement.querySelector('.ritual__dampf') || (() => { const c = d.createElement('canvas'); c.className = 'ritual__dampf'; c.setAttribute('aria-hidden', 'true'); funken.after(c); return c; })(),
        { anzahl: 16, alpha: .6, quelle: (bb, hh) => ({ x: bb / 2 + (Math.random() - .5) * 20, y: hh * .58 }), hoehe: .6, groesse: [30, 110], tempo: [.35, .6], skala: 1 });
    }
    knopf.addEventListener('click', async () => {
      knopf.disabled = true; ende.hidden = true; r.classList.add('brennt'); funkenStarten();
      await warte(1200);
      for (let n = 1; n <= 3; n++) {
        r.dataset.phase = 'ein'; anz.textContent = `${T.ein} · ${T.zahl(n)}`; await warte(4000);
        r.dataset.phase = 'halt'; anz.textContent = T.halt; await warte(2000);
        r.dataset.phase = 'aus'; anz.textContent = T.aus; await warte(6000);
      }
      r.dataset.phase = ''; anz.textContent = ''; ende.hidden = false; knopf.textContent = T.neu; knopf.disabled = false;
    });
  });

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
