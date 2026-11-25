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

  // ---------- Oberer Bereich + Himmel: viele Schwaden, ziehende Wolken, Reaktion auf Maus/Finger ----------
  // Bei „Bewegung reduzieren“ läuft alles stark verlangsamt statt gar nicht.
  const tempoF = ruhig.matches ? .35 : 1;
  const schmal = () => innerWidth < 700;
  function wolkenSprites(farbe, n = 6) {
    const liste = [];
    for (let k = 0; k < n; k++) {
      const c = d.createElement('canvas'); c.width = 512; c.height = 220; const x = c.getContext('2d');
      if (nebelBild.complete && nebelBild.naturalWidth) {
        const sx = Math.random() * (nebelBild.naturalWidth - 700), sy = 40 + Math.random() * 140;
        x.drawImage(nebelBild, sx, sy, 700, 260, 0, 0, 512, 220);
        x.globalCompositeOperation = 'source-in'; x.fillStyle = `rgb(${farbe})`; x.fillRect(0, 0, 512, 220);
        x.globalCompositeOperation = 'destination-in';
        const g = x.createRadialGradient(256, 110, 30, 256, 110, 250); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.setTransform(1, 0, 0, .44, 0, 61.6); x.fillStyle = g; x.fillRect(0, 0, 512, 500);
      }
      liste.push(c);
    }
    return liste;
  }
  // Allgemeine Partikel-Ebene: art 'steigt' (Rauch nach oben) oder 'zieht' (Nebelbank/Wolke seitwärts)
  function ebene(canvas, cfg) {
    const x = canvas.getContext('2d'); const skala = cfg.skala || .5;
    let sprites = cfg.sprites(); if (!nebelBild.complete) nebelBild.addEventListener('load', () => { sprites = cfg.sprites(); });
    let b = 0, h = 0, teile = [], lauf = true, sichtbar = true, zeiger = null;
    const mass = () => { const r = canvas.getBoundingClientRect(); b = canvas.width = Math.max(1, Math.round(r.width * skala)); h = canvas.height = Math.max(1, Math.round(r.height * skala)); };
    const anzahl = () => Math.round(cfg.anzahl * (schmal() ? cfg.mobil ?? .6 : 1));
    const neu = start => {
      const s = (cfg.groesse[0] + Math.random() * (cfg.groesse[1] - cfg.groesse[0])) * skala * (schmal() ? 1.25 : 1);
      const v = (cfg.tempo[0] + Math.random() * (cfg.tempo[1] - cfg.tempo[0])) * skala * 2 * tempoF;
      if (cfg.art === 'zieht') {
        const rechts = Math.random() < (cfg.rechtsAnteil ?? .7), y = h * (cfg.band[0] + Math.random() * (cfg.band[1] - cfg.band[0]));
        const x0 = start ? Math.random() * b : (rechts ? -s : b + s);
        return { x: x0, y, vx: rechts ? v : -v, vy: (Math.random() - .5) * .04 * skala, s, k: Math.floor(Math.random() * sprites.length), ph: Math.random() * 6.3, a: cfg.alpha * (.55 + Math.random() * .45), dehn: 1.6 + Math.random() * 1.4 };
      }
      const q = cfg.quelle(b, h);
      return { x: q.x, y: start ? h - Math.random() * h * cfg.hoehe : q.y, vx: (Math.random() - .5) * .2 * skala, vy: -v, s, ds: .16 * skala, r: Math.random() * 6.3, vr: (Math.random() - .5) * .005, ph: Math.random() * 6.3, k: Math.floor(Math.random() * sprites.length), t: 0, max: (h * cfg.hoehe) / v, a: cfg.alpha * (.6 + Math.random() * .4) };
    };
    const fuellen = () => { mass(); teile = Array.from({ length: anzahl() }, () => neu(true)); };
    fuellen(); let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fuellen, 200); });
    if (cfg.zeiger) {
      const ziel = cfg.zeiger;
      const setz = e => { const r = canvas.getBoundingClientRect(); const pt = e.touches ? e.touches[0] : e; zeiger = { x: (pt.clientX - r.left) * skala, y: (pt.clientY - r.top) * skala, t: 90 }; };
      ziel.addEventListener('pointermove', setz, { passive: true }); ziel.addEventListener('touchmove', setz, { passive: true });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { const war = sichtbar; sichtbar = es[0].isIntersecting; if (sichtbar && !war && lauf) requestAnimationFrame(schritt); }).observe(cfg.beobachte || canvas);
    function schritt() {
      if (!lauf || !sichtbar) return;
      x.clearRect(0, 0, b, h);
      if (zeiger && zeiger.t > 0) zeiger.t--;
      for (const p of teile) {
        p.ph += .008 * tempoF;
        if (zeiger && zeiger.t > 0) { // Schwaden weichen der Hand sanft aus und verwirbeln
          const dx = p.x - zeiger.x, dy = p.y - zeiger.y, dist = Math.hypot(dx, dy), rad = 160 * skala * 2;
          if (dist < rad && dist > 1) { const k = (1 - dist / rad) * .9 * skala * (zeiger.t / 90); p.x += dx / dist * k * 2 - dy / dist * k; p.y += dy / dist * k * 2 + dx / dist * k; }
        }
        let a;
        if (cfg.art === 'zieht') {
          p.x += p.vx; p.y += p.vy + Math.sin(p.ph) * .12 * skala;
          const rand = Math.min(p.x + p.s * p.dehn / 2, b - p.x + p.s * p.dehn / 2) / (p.s * p.dehn);
          a = p.a * Math.max(0, Math.min(1, rand * 1.5)) * (.75 + Math.sin(p.ph * 1.7) * .25);
          if (p.x < -p.s * p.dehn || p.x > b + p.s * p.dehn) { Object.assign(p, neu(false)); continue; }
          x.globalAlpha = a; x.drawImage(sprites[p.k], p.x - p.s * p.dehn / 2, p.y - p.s * .4, p.s * p.dehn, p.s * .8);
        } else {
          p.t += tempoF; p.x += p.vx + Math.sin(p.ph) * .35 * skala; p.y += p.vy; p.s += p.ds * tempoF; p.r += p.vr;
          const leben = p.t / p.max; a = p.a * Math.min(1, leben * 3.5) * Math.max(0, 1 - leben);
          if (leben > 1) { Object.assign(p, neu(false)); continue; }
          x.globalAlpha = a; x.save(); x.translate(p.x, p.y); x.rotate(Math.sin(p.r) * .45); x.drawImage(sprites[p.k], -p.s / 2, -p.s * .62, p.s, p.s * 1.25); x.restore();
        }
      }
      requestAnimationFrame(schritt);
    }
    d.addEventListener('visibilitychange', () => { const war = lauf; lauf = !d.hidden; if (lauf && !war) requestAnimationFrame(schritt); });
    requestAnimationFrame(schritt);
  }
  const himmel = d.querySelector('.land__himmel');
  if (himmel) {
    // dunkle Regenwolken und helle, vom Abendlicht gestreifte Wolkenränder ziehen über den Himmel
    const dunkel = d.createElement('canvas'); dunkel.className = 'land__wolken'; himmel.prepend(dunkel);
    ebene(dunkel, { art: 'zieht', sprites: () => wolkenSprites('34,38,44'), anzahl: 16, mobil: .7, alpha: .62, groesse: [220, 420], tempo: [.06, .16], band: [.02, .5], rechtsAnteil: .85, skala: .4 });
    const hell = d.createElement('canvas'); hell.className = 'land__wolken land__wolken--hell'; himmel.append(hell);
    ebene(hell, { art: 'zieht', sprites: () => wolkenSprites('214,176,140', 4), anzahl: 9, mobil: .7, alpha: .28, groesse: [160, 320], tempo: [.08, .2], band: [.18, .5], rechtsAnteil: .85, skala: .4 });
  }
  const held = d.querySelector('.held--land');
  if (held) {
    const c = d.createElement('canvas'); c.className = 'held__rauch'; c.setAttribute('aria-hidden', 'true'); held.prepend(c);
    // 1) aufsteigende Rauchsäulen aus dem Tal
    ebene(c, { art: 'steigt', sprites: () => rauchSprites('236,230,218'), anzahl: 54, mobil: .55, alpha: .62, groesse: [120, 320], tempo: [.35, .85], hoehe: .95, quelle: (b, h) => ({ x: Math.random() * b, y: h + 60 }), zeiger: held, beobachte: held });
    // 2) Nebelbänke, die übers Tal kriechen, und 3) feine Fäden quer durchs Bild
    const c2 = d.createElement('canvas'); c2.className = 'held__rauch'; c2.setAttribute('aria-hidden', 'true'); held.prepend(c2);
    ebene(c2, { art: 'zieht', sprites: () => rauchSprites('226,220,208'), anzahl: 22, mobil: .6, alpha: .42, groesse: [180, 380], tempo: [.18, .45], band: [.55, 1], rechtsAnteil: .6, zeiger: held, beobachte: held });
    const c3 = d.createElement('canvas'); c3.className = 'held__rauch'; c3.setAttribute('aria-hidden', 'true'); held.prepend(c3);
    ebene(c3, { art: 'zieht', sprites: () => rauchSprites('240,232,220'), anzahl: 10, mobil: .6, alpha: .16, groesse: [200, 360], tempo: [.25, .5], band: [.15, .6], rechtsAnteil: .5, zeiger: held, beobachte: held });
  }

  // ---------- Fotohintergründe: Parallaxe beim Scrollen + ziehender Rauch ----------
  const hgs = [...d.querySelectorAll('.foto-hg')];
  if (hgs.length) {
    let anst = false;
    const hgRechnen = () => { anst = false; const vh = innerHeight; for (const h of hgs) { const r = h.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) continue; const p = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2); h.style.setProperty('--sp', Math.max(-1, Math.min(1, p)).toFixed(3)); } };
    addEventListener('scroll', () => { if (!anst) { anst = true; requestAnimationFrame(hgRechnen); } }, { passive: true }); hgRechnen();
    for (const h of hgs) { // feine Rauchschwaden über dem Foto
      const c = d.createElement('canvas'); c.className = 'foto-hg__rauch'; h.append(c);
      ebene(c, { art: 'zieht', sprites: () => rauchSprites('230,224,212'), anzahl: 12, mobil: .6, alpha: .3, groesse: [180, 360], tempo: [.15, .35], band: [.35, 1], rechtsAnteil: .6, beobachte: h });
    }
  }

  // ---------- Impressionen: Bildfolge mit Nebelübergang, keltische Pfeile, Wischen, Tastatur ----------
  d.querySelectorAll('[data-schau]').forEach(schau => {
    const bilder = [...schau.querySelectorAll('.schau__bild')]; if (bilder.length < 2) return;
    const nr = schau.querySelector('[data-nr]'); const DAUER = Math.max(3000, (Number(schau.dataset.tempo) || 7.5) * 1000) * (ruhig.matches ? 1.5 : 1);
    schau.style.setProperty('--dauer', DAUER + 'ms');
    let jetzt = 0, timer = 0, pause = false, sichtbar = false;
    const zeige = (n, nutzer) => {
      n = (n + bilder.length) % bilder.length; if (n === jetzt) return;
      const alt = bilder[jetzt], neu = bilder[n];
      schau.classList.remove('wechselt'); void schau.offsetWidth; schau.classList.add('wechselt');
      alt.classList.remove('ist-aktiv'); alt.classList.add('geht'); alt.setAttribute('aria-hidden', 'true');
      setTimeout(() => alt.classList.remove('geht'), 2700);
      neu.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager');
      neu.classList.add('ist-aktiv'); neu.removeAttribute('aria-hidden');
      bilder[(n + 1) % bilder.length].querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'); // nächstes vorladen
      jetzt = n; nr.textContent = n + 1; setTimeout(() => schau.classList.remove('wechselt'), 2900);
      planen(nutzer);
    };
    const fort = schau.querySelector('.schau__fortschritt');
    const planen = () => {
      clearTimeout(timer); schau.classList.remove('laeuft');
      if (pause || !sichtbar || d.hidden) return;
      void fort.offsetWidth; schau.classList.add('laeuft');
      timer = setTimeout(() => zeige(jetzt + 1), DAUER);
    };
    schau.querySelector('[data-weiter]').onclick = () => zeige(jetzt + 1, true);
    schau.querySelector('[data-zurueck]').onclick = () => zeige(jetzt - 1, true);
    schau.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); zeige(jetzt + 1, true); } if (e.key === 'ArrowLeft') { e.preventDefault(); zeige(jetzt - 1, true); } });
    const buehne = schau.querySelector('.schau__buehne'); let x0 = null, y0 = 0;
    buehne.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    buehne.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) zeige(jetzt + (dx < 0 ? 1 : -1), true); }, { passive: true });
    const halt = an => { pause = an; planen(); };
    buehne.addEventListener('mouseenter', () => halt(true)); buehne.addEventListener('mouseleave', () => halt(false));
    schau.addEventListener('focusin', () => halt(true)); schau.addEventListener('focusout', () => halt(false));
    d.addEventListener('visibilitychange', planen);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { sichtbar = es[0].isIntersecting; planen(); }, { threshold: .35 }).observe(schau);
    else { sichtbar = true; planen(); }
  });

  // ---------- Bildbogen der Reise: Fotos verschwimmen ineinander, Tempo aus dem Dashboard ----------
  d.querySelectorAll('[data-bogenschau]').forEach(bs => {
    const bilder = [...bs.querySelectorAll('.bogenschau__bild')]; if (bilder.length < 2) return;
    const DAUER = Math.max(3000, (Number(bs.dataset.tempo) || 6) * 1000) * (ruhig.matches ? 1.5 : 1);
    let jetzt = 0, timer = 0, sichtbar = false;
    const weiter = () => {
      const alt = bilder[jetzt]; jetzt = (jetzt + 1) % bilder.length; const neu = bilder[jetzt];
      neu.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager');
      bs.classList.remove('wechselt'); void bs.offsetWidth; bs.classList.add('wechselt');
      alt.classList.remove('ist-aktiv'); alt.classList.add('geht'); setTimeout(() => alt.classList.remove('geht'), 2700);
      neu.classList.add('ist-aktiv'); setTimeout(() => bs.classList.remove('wechselt'), 2900); planen();
    };
    const planen = () => { clearTimeout(timer); if (sichtbar && !d.hidden) timer = setTimeout(weiter, DAUER); };
    d.addEventListener('visibilitychange', planen);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { sichtbar = es[0].isIntersecting; planen(); }, { threshold: .2 }).observe(bs); else { sichtbar = true; planen(); }
  });

  // ---------- Laufband: gleichmäßiges Tempo, egal wie lang die Meldungen sind ----------
  d.querySelectorAll('.laufband__bahn').forEach(bahn => {
    const setz = () => { const px = 10 + (Number(bahn.dataset.tempo) || 4) * 7; const w = bahn.firstElementChild.scrollWidth; bahn.style.animationDuration = Math.max(8, w / px) + 's'; };
    setz(); addEventListener('resize', setz); d.fonts?.ready.then(setz);
  });

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
    // Realistisches Feuer: viele kleine Glutteilchen, additiv gemischt (heller Kern, orange Mitte, rote Spitzen)
    let feuerAn = false;
    function feuerStarten() {
      if (feuerAn || ruhig.matches) return; feuerAn = true; r.classList.add('echtes-feuer');
      const svg = r.querySelector('.ritual__kreis');
      const c = d.createElement('canvas'); c.className = 'ritual__flammen'; c.setAttribute('aria-hidden', 'true'); svg.after(c);
      const x = c.getContext('2d'); let b, h, dpr = Math.min(2, devicePixelRatio || 1);
      const mass = () => { const q = c.getBoundingClientRect(); b = c.width = q.width * dpr; h = c.height = q.height * dpr; }; mass(); addEventListener('resize', mass);
      const farbe = (r1, g1, b1) => { const k = d.createElement('canvas'); k.width = k.height = 64; const g = k.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, `rgba(${r1},${g1},${b1},.9)`); gr.addColorStop(.4, `rgba(${r1},${g1},${b1},.35)`); gr.addColorStop(1, `rgba(${r1},${g1},${b1},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return k; };
      const stufen = [farbe(255, 236, 190), farbe(255, 180, 80), farbe(245, 128, 40), farbe(205, 72, 22), farbe(120, 36, 14)];
      const teile = []; let t = 0;
      const ort = () => { const sv = svg.getBoundingClientRect(), cv = c.getBoundingClientRect(); return { x: (sv.left - cv.left + sv.width * .5) * dpr, y: (sv.top - cv.top + sv.height * .545) * dpr, w: sv.width * dpr }; };
      const schritt = () => {
        t++; const o = ort(); const breite = o.w * .04, gr0 = o.w * .02;
        x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, b, h);
        for (let i = 0; i < 7; i++) teile.push({ x: o.x + (Math.random() - .5) * breite * 2, y: o.y - Math.random() * 4, vx: (Math.random() - .5) * .5, vy: -(1.6 + Math.random() * 2.2) * dpr, t: 0, max: 30 + Math.random() * 34, s: gr0 * (.6 + Math.random() * .7) });
        x.globalCompositeOperation = 'lighter';
        const wind = Math.sin(t * .021) * .25 + Math.sin(t * .067) * .15;
        for (let i = teile.length - 1; i >= 0; i--) {
          const p = teile[i]; p.t++;
          const lf = p.t / p.max; if (lf >= 1) { teile.splice(i, 1); continue; }
          p.vx += (o.x - p.x) * .006 * (1 + lf * 2) + wind * .06; p.x += p.vx; p.y += p.vy; p.vy *= .985;
          const s = p.s * (1 - lf * .75);
          const st = stufen[lf < .08 ? 0 : lf < .3 ? 1 : lf < .55 ? 2 : lf < .8 ? 3 : 4];
          x.globalAlpha = (1 - lf) * (lf < .08 ? .3 : .42);
          x.drawImage(st, p.x - s * .8, p.y - s * 1.9, s * 1.6, s * 3.2);
        }
        // Glut in der Schale
        x.globalCompositeOperation = 'lighter'; x.globalAlpha = .35 + Math.random() * .12;
        x.drawImage(stufen[2], o.x - breite * 1.6, o.y - breite * .4, breite * 3.2, breite * .9);
        r.style.setProperty('--flacker', (.75 + Math.random() * .25).toFixed(2));
        requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
    }
    // Irische Klänge, im Browser erzeugt (keine Datei, kein fremder Server):
    // gezupfte keltische Harfe (physikalisches Saitenmodell), Low Whistle mit Atemgeräusch und Verzierungen,
    // leiser Dudelsack-Bordun in D und Wind. Die Weise ist eine eigene, langsame Air im irischen Stil.
    // Einstellungen aus dem Dashboard: Quelle (harfe | datei | aus) und Lautstärke 5–100 %.
    // Die Übung beginnt immer in Stille; Musik kommt nur dazu, wenn die Besucherin sie einschaltet.
    const MQ = r.dataset.musik || 'harfe', MURL = r.dataset.musikUrl || '';
    const PEGEL = Math.min(1, Math.max(.05, (Number(r.dataset.laut) || 30) / 100));
    const klang = (() => {
      let ac = null, master = null, hall = null, laufend = false, stumm = true, quellen = [], timer = [], audio = null, quelleEl = null;
      const ziel = () => MQ === 'datei' ? PEGEL : PEGEL * .55; // erzeugte Musik ist von Natur aus dichter, daher etwas leiser
      const blenden = (an, dauer) => { if (!master) return; const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(Math.max(.0001, master.gain.value), t); master.gain.exponentialRampToValueAtTime(an ? ziel() : .0001, t + dauer); };
      const hz = n => 440 * Math.pow(2, (n - 69) / 12), saiten = {};
      function saite(n) { // Karplus-Strong: Rauschimpuls läuft gedämpft durch eine Verzögerung = gezupfte Saite
        if (saiten[n]) return saiten[n];
        const sr = ac.sampleRate, len = Math.floor(sr * 4.5), buf = ac.createBuffer(1, len, sr), d = buf.getChannelData(0);
        const N = Math.max(2, Math.round(sr / hz(n))), daempf = n < 55 ? .9965 : n < 70 ? .9975 : .998;
        let vor = 0; for (let i = 0; i < N; i++) { const x = Math.random() * 2 - 1; vor = vor * .55 + x * .45; d[i] = vor; }
        for (let i = N; i < len; i++) d[i] = daempf * .5 * (d[i - N] + d[i - N - 1 < 0 ? 0 : i - N - 1]);
        let m = 0; for (let i = 0; i < len; i++) m = Math.max(m, Math.abs(d[i])); for (let i = 0; i < len; i++) d[i] /= m || 1;
        return (saiten[n] = buf);
      }
      function zupfen(n, t, laut) {
        const q = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
        q.buffer = saite(n); f.type = 'lowpass'; f.frequency.value = 2600; g.gain.value = laut;
        q.connect(f); f.connect(g); g.connect(hall); g.connect(master); q.start(t); quellen.push(q);
      }
      function hallBauen() {
        const sr = ac.sampleRate, len = sr * 3.8, buf = ac.createBuffer(2, len, sr);
        for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let lp = 0;
          for (let i = 0; i < len; i++) { lp = lp * .6 + (Math.random() * 2 - 1) * .4; d[i] = lp * Math.pow(1 - i / len, 3) * (i < sr * .02 ? i / (sr * .02) : 1); } }
        const c = ac.createConvolver(); c.buffer = buf; return c;
      }
      // Weise in D, 3/4, [Ton, Schläge, Verzierung]
      const WEISE = [[74,2,1],[76,1],[78,2,1],[76,1],[74,1],[71,1],[69,1],[71,3,1],
        [74,2],[76,1],[78,1],[81,1],[78,1],[76,2,1],[74,1],[76,3],
        [81,2,1],[83,1],[81,1],[78,1],[76,1],[74,2],[76,1],[78,3,1],
        [76,1],[74,1],[71,1],[69,2],[71,1],[74,3,1],[74,3]];
      const AKKORDE = [[50,57,62,66],[50,57,62,66],[47,54,59,62],[43,50,55,59],[50,57,62,66],[50,57,62,66],[45,52,57,61],[45,52,57,61],
        [50,57,62,66],[50,57,62,66],[43,50,55,59],[50,57,62,66],[52,59,64,67],[45,52,57,61],[50,57,62,66],[38,50,57,62]];
      function whistle(start, schlag) {
        const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
        const re = new Float32Array([0, 1, .18, .06, .025, .01]), im = new Float32Array(6);
        o.setPeriodicWave(ac.createPeriodicWave(re, im)); f.type = 'lowpass'; f.frequency.value = 3200;
        const vib = ac.createOscillator(), vibG = ac.createGain(); vib.frequency.value = 5.2; vibG.gain.value = 0; vib.connect(vibG); vibG.connect(o.detune);
        // Atem: Rauschen, um den Ton herum gefiltert
        const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        const atem = ac.createBufferSource(); atem.buffer = nb; atem.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
        const ag = ac.createGain(); atem.connect(bp); bp.connect(ag); ag.connect(f);
        o.connect(g); g.connect(f); f.connect(hall); f.connect(master);
        let t = start; g.gain.setValueAtTime(0, t); ag.gain.setValueAtTime(0, t);
        WEISE.forEach(([n, b, verz], i) => {
          const dauer = b * schlag, fr = hz(n);
          if (verz && i > 0) { o.frequency.setValueAtTime(hz(n + (n % 12 === 11 || n % 12 === 4 ? 1 : 2)) , t); t += .045; } // Schnitt (cut) wie bei irischen Flöten
          o.frequency.setTargetAtTime(fr, t, .012); bp.frequency.setValueAtTime(fr * 2, t);
          g.gain.setTargetAtTime(.075, t, i === 0 ? .08 : .02); ag.gain.setTargetAtTime(.012, t, .05);
          if (b >= 2) { vibG.gain.setValueAtTime(0, t + .35); vibG.gain.linearRampToValueAtTime(14, t + dauer * .9); }
          vibG.gain.setValueAtTime(0, t + dauer - .02);
          if (WEISE[i + 1] && WEISE[i + 1][0] === n) { g.gain.setTargetAtTime(.03, t + dauer - .08, .015); } // kurzes Absetzen bei Tonwiederholung
          t += dauer - (verz && i > 0 ? .045 : 0);
        });
        g.gain.setTargetAtTime(0, t - .4, .5); ag.gain.setTargetAtTime(0, t - .4, .4);
        [o, vib, atem].forEach(x => { x.start(start); x.stop(t + 3); quellen.push(x); });
        return t;
      }
      function start() {
        if (laufend || MQ === 'aus') return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ac = ac || new AC(); ac.resume?.(); laufend = true; quellen = [];
        master = ac.createGain(); master.gain.value = .0001; master.connect(ac.destination);
        if (!stumm) blenden(true, 3.5); // sanft einblenden statt schlagartig laut
        if (MQ === 'datei' && MURL) { // eigene Aufnahme aus dem Dashboard, über denselben Lautstärkeregler (auch am iPhone)
          if (!audio) { audio = new Audio(MURL); audio.loop = true; audio.preload = 'auto'; quelleEl = ac.createMediaElementSource(audio); }
          quelleEl.disconnect(); quelleEl.connect(master); audio.play().catch(() => {});
          return;
        }
        const conv = hallBauen(), hg = ac.createGain(); hg.gain.value = .55; hall = ac.createGain(); hall.connect(conv); conv.connect(hg); hg.connect(master);
        // Bordun wie bei der Uilleann Pipe: D3 und D2, weich gefiltert, langsam einschwellend
        const tp = ac.createBiquadFilter(); tp.type = 'lowpass'; tp.frequency.value = 520; const bg = ac.createGain();
        bg.gain.setValueAtTime(0, ac.currentTime); bg.gain.linearRampToValueAtTime(.022, ac.currentTime + 5);
        tp.connect(bg); bg.connect(master); bg.connect(hall);
        [[50, 0, .6], [38, 3, 1], [57, -2, .25]].forEach(([n, c, l]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = c; g.gain.value = l; o.connect(g); g.connect(tp); o.start(); quellen.push(o); });
        // leiser Wind
        const nb = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        const nq = ac.createBufferSource(); nq.buffer = nb; nq.loop = true; const wf = ac.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 500;
        const ng = ac.createGain(); ng.gain.value = .012; nq.connect(wf); wf.connect(ng); ng.connect(master); nq.start(); quellen.push(nq);
        // Harfe: Akkorde werden wie auf der Harfe von unten nach oben gerollt, dazu ruhige Achtel
        const schlag = 60 / 76, t0 = ac.currentTime + .15;
        AKKORDE.forEach((ak, takt) => {
          const tt = t0 + 1.2 + takt * 3 * schlag;
          ak.forEach((n, k) => zupfen(n, tt + k * .055 + Math.random() * .01, k === 0 ? .32 : .2));
          zupfen(ak[2] + 12, tt + schlag * 1.5, .1); zupfen(ak[3], tt + schlag * 2, .12);
        });
        zupfen(38, t0, .35); zupfen(50, t0 + .06, .25); zupfen(57, t0 + .12, .2); zupfen(62, t0 + .18, .2);
        whistle(t0 + 1.2, schlag);
      }
      function stopp(sanft = 4) {
        if (!laufend) return; laufend = false; timer.forEach(clearTimeout);
        blenden(false, sanft);
        const q = quellen.splice(0), a = audio; setTimeout(() => { q.forEach(o => { try { o.stop(); } catch {} }); if (a && !laufend) a.pause(); }, sanft * 1000 + 200);
      }
      function stummSchalten(an) {
        stumm = an; if (!an && !laufend) { start(); return; } if (!ac || !laufend) return; blenden(!an, an ? 1.5 : 3);
      }
      return { start, stopp, schale() {}, stummSchalten, get stumm() { return stumm; } };
    })();
    const tonKnopf = r.querySelector('[data-klang]');
    const tonText = () => { if (!tonKnopf) return; tonKnopf.setAttribute('aria-pressed', String(!klang.stumm)); tonKnopf.querySelector('span').textContent = klang.stumm ? (en ? 'Add music' : 'Musik dazu') : (en ? 'Music off' : 'Musik aus'); };
    tonKnopf?.addEventListener('click', () => { klang.stummSchalten(!klang.stumm); tonText(); });

    let laeuft = false;
    const ritualStarten = async () => {
      if (laeuft) return; laeuft = true;
      knopf.disabled = true; ende.hidden = true; r.classList.add('brennt'); feuerStarten(); funkenStarten();
      if (!klang.stumm) klang.start(); tonText(); // Start in Stille, außer die Besucherin hat Musik gewählt
      anz.textContent = en ? 'The fire is lit …' : 'Das Feuer brennt …';
      await warte(2200);
      for (let n = 1; n <= 3; n++) {
        r.dataset.phase = 'ein'; anz.textContent = `${T.ein} · ${T.zahl(n)}`; klang.schale(); await warte(4000);
        r.dataset.phase = 'halt'; anz.textContent = T.halt; await warte(2000);
        r.dataset.phase = 'aus'; anz.textContent = T.aus; await warte(6000);
      }
      r.dataset.phase = ''; anz.textContent = ''; ende.hidden = false; knopf.textContent = T.neu; knopf.disabled = false;
      klang.stopp(6);
      laeuft = false;
    };
    // Ein einziger Tipp genügt: pointerup reagiert sofort, click als Rückfall (Tastatur)
    knopf.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse' || e.button === 0) ritualStarten(); });
    knopf.addEventListener('click', ritualStarten);
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
