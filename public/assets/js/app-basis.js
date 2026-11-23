/* Gemeinsame Helfer für Anmeldung, Teilnehmerinnen-Bereich und Verwaltung */
window.A = (() => {
  const d = document;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  async function api(pfad, daten, opt = {}) {
    const init = { method: daten === undefined ? 'GET' : 'POST', headers: {}, credentials: 'same-origin' };
    if (daten !== undefined) {
      if (daten instanceof Blob || daten instanceof ArrayBuffer) { init.body = daten; init.headers['content-type'] = opt.typ || daten.type || 'application/octet-stream'; }
      else { init.body = JSON.stringify(daten); init.headers['content-type'] = 'application/json'; }
    }
    Object.assign(init.headers, opt.kopf || {});
    const r = await fetch('/api' + pfad, init);
    if (r.status === 401 && !opt.still) { location.href = '/anmelden?zurueck=' + encodeURIComponent(location.pathname + location.hash); throw new Error('Bitte anmelden.'); }
    let j = {}; try { j = await r.json(); } catch {}
    if (!r.ok) throw Object.assign(new Error(j.fehler || 'Das hat nicht geklappt.'), { status: r.status });
    return j;
  }
  let mTimer;
  function meldung(text, fehler = false) {
    let m = d.querySelector('.meldung');
    if (!m) { m = d.createElement('div'); m.setAttribute('role', 'status'); d.body.append(m); }
    m.className = 'meldung' + (fehler ? ' meldung--fehler' : ''); m.textContent = text; m.hidden = false;
    clearTimeout(mTimer); mTimer = setTimeout(() => { m.hidden = true; }, fehler ? 7000 : 3500);
  }
  const datum = iso => iso ? new Date(iso).toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const zeit = iso => iso ? new Date(iso).toLocaleString('de-AT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  async function abmelden() { try { await api('/abmelden', {}); } catch {} location.href = '/'; }
  // Bild vor dem Hochladen verkleinern (max. 2400 px, JPEG) – spart Speicher und Ladezeit
  function verkleinern(datei, max = 2400) {
    return new Promise((ok, fehl) => {
      const img = new Image(); const url = URL.createObjectURL(datei);
      img.onload = () => {
        const f = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = d.createElement('canvas'); c.width = Math.round(img.naturalWidth * f); c.height = Math.round(img.naturalHeight * f);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(b => b ? ok({ blob: b, b: c.width, h: c.height }) : fehl(new Error('Bild konnte nicht gelesen werden.')), 'image/jpeg', 0.85);
      };
      img.onerror = () => fehl(new Error('Dieses Bildformat kann der Browser nicht lesen. Bitte JPG oder PNG verwenden.'));
      img.src = url;
    });
  }
  return { esc, api, meldung, datum, zeit, abmelden, verkleinern, $: (s, r = d) => r.querySelector(s), $$: (s, r = d) => [...r.querySelectorAll(s)] };
})();
