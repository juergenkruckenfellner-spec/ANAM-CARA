// Einzige Speicherschicht der Anwendung (datenzugriff-standard).
// Alle Funktionen lesen und schreiben ausschließlich über dieses Modul.
// Produktion: Netlify Blobs (EU-Region der Site, consistency "strong").
// Lokal/Test: Dateiablage in DEV_STORE_DIR.
import { promises as fs } from 'node:fs';
import path from 'node:path';

let _store = null;

async function netlifyStore() {
  const { getStore } = await import('@netlify/blobs');
  const s = getStore({ name: 'anamcara', consistency: 'strong' });
  return {
    async get(key) { const v = await s.get(key, { type: 'arrayBuffer' }); return v ? Buffer.from(v) : null; },
    async getMeta(key) { const r = await s.getMetadata(key); return r ? r.metadata : null; },
    async set(key, buf, meta = {}) { await s.set(key, buf, { metadata: meta }); },
    async getJSON(key) { return (await s.get(key, { type: 'json' })) ?? null; },
    async setJSON(key, val) { await s.setJSON(key, val); },
    async del(key) { await s.delete(key); },
    async list(prefix) {
      const { blobs } = await s.list({ prefix });
      return blobs.map(b => b.key);
    },
  };
}

function fileStore(dir) {
  const enc = k => path.join(dir, encodeURIComponent(k));
  return {
    async get(key) { try { return await fs.readFile(enc(key)); } catch { return null; } },
    async getMeta(key) { try { return JSON.parse(await fs.readFile(enc(key) + '.meta', 'utf8')); } catch { return null; } },
    async set(key, buf, meta = {}) { await fs.mkdir(dir, { recursive: true }); await fs.writeFile(enc(key), buf); await fs.writeFile(enc(key) + '.meta', JSON.stringify(meta)); },
    async getJSON(key) { try { return JSON.parse(await fs.readFile(enc(key), 'utf8')); } catch { return null; } },
    async setJSON(key, val) { await fs.mkdir(dir, { recursive: true }); await fs.writeFile(enc(key), JSON.stringify(val)); },
    async del(key) { await fs.rm(enc(key), { force: true }); await fs.rm(enc(key) + '.meta', { force: true }); },
    async list(prefix) {
      try {
        return (await fs.readdir(dir)).filter(f => !f.endsWith('.meta')).map(decodeURIComponent).filter(k => k.startsWith(prefix));
      } catch { return []; }
    },
  };
}

export async function store() {
  if (_store) return _store;
  _store = process.env.DEV_STORE_DIR ? fileStore(process.env.DEV_STORE_DIR) : await netlifyStore();
  return _store;
}

// Bequeme Helfer für Sammlungen mit Präfix (anfrage/, konto/, kontakt/, stimme/)
export async function alle(prefix) {
  const s = await store();
  const keys = await s.list(prefix);
  const out = [];
  for (const k of keys) { const v = await s.getJSON(k); if (v) out.push(v); }
  return out;
}
