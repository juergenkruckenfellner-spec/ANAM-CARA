// Lokaler Testserver: bildet Netlify (statische Dateien + Functions + Image-CDN-Ersatz) nach.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(wurzel, process.env.PUBLIC_DIR || 'public');
process.env.DEV_STORE_DIR ||= path.join(wurzel, '.dev-daten');
if (!process.env.OHNE_GEHEIMNIS) process.env.SITZUNG_GEHEIMNIS ||= 'lokal-nur-zum-testen-0123456789abcdefghij';
process.env.EINRICHTUNGS_CODE ||= 'einrichten-lokal-2026';
process.env.MAIL_TESTMODUS ||= '1';
process.env.BILD_CDN = '0';
const port = Number(process.env.PORT || 8787);
process.env.SEITEN_URL ||= `http://localhost:${port}`;

const api = (await import('../netlify/functions/api.mjs')).default;
const seite = (await import('../netlify/functions/seite.mjs')).default;
const TYP = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain', '.json': 'application/json', '.png': 'image/png' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'";

async function statisch(p) {
  let f = path.join(pub, decodeURIComponent(p));
  if (!f.startsWith(pub)) return null;
  try { const st = await fs.stat(f); if (st.isDirectory()) f = path.join(f, 'index.html'); return { f, buf: await fs.readFile(f) }; } catch { return null; }
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    let p = url.pathname;
    if (p === '/.netlify/images') { p = url.searchParams.get('url'); url.pathname = p; url.search = ''; }
    const st = !p.startsWith('/api/') && !p.startsWith('/bild/') && !p.startsWith('/musik/') && p !== '/' && !p.startsWith('/en') ? await statisch(p) : null;
    if (st && !/\/(sitemap\.xml|llms\.txt)$/.test(p)) {
      res.writeHead(200, { 'content-type': TYP[path.extname(st.f)] || 'application/octet-stream', 'content-security-policy': CSP, 'x-frame-options': 'DENY', 'cache-control': 'no-store' });
      return res.end(st.buf);
    }
    const chunks = []; for await (const c of req) chunks.push(c);
    const request = new Request(url.origin + p + url.search, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks), duplex: 'half' });
    const antwort = await (p.startsWith('/api/') ? api(request) : seite(request));
    const kopf = {}; antwort.headers.forEach((v, k) => { kopf[k] = v; });
    const sc = antwort.headers.getSetCookie?.(); if (sc?.length) kopf['set-cookie'] = sc;
    res.writeHead(antwort.status, kopf);
    res.end(Buffer.from(await antwort.arrayBuffer()));
  } catch (e) { console.error(e); res.writeHead(500); res.end('Fehler: ' + e.message); }
}).listen(port, () => console.log(`Anam Cara lokal: http://localhost:${port}`));
