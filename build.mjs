// Erzeugt dist/: statische Dateien + fertig gebündelte Functions (keine npm-Installation auf Netlify nötig)
import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
await fs.rm('dist', { recursive: true, force: true });
await fs.cp('public', 'dist/public', { recursive: true });
await fs.cp('netlify.toml', 'dist/netlify.toml');
for (const f of ['api', 'seite', 'taeglich']) {
  await build({ entryPoints: [`netlify/functions/${f}.mjs`], bundle: true, platform: 'node', format: 'esm', target: 'node20', outfile: `dist/netlify/functions/${f}.mjs`,
    banner: { js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" }, logLevel: 'warning' });
}
// statische 404-Seite für Adressen außerhalb der Functions
process.env.BILD_CDN = '0';
const S = await import('./lib/seiten.mjs'); const { STANDARD_INHALT, STANDARD_RETREATS } = await import('./lib/inhalt-standard.mjs');
await fs.writeFile('dist/public/404.html', S.nichtGefunden({ l: 'de', i: STANDARD_INHALT, rs: STANDARD_RETREATS, url: 'https://anam-cara.at', bildNach: () => null }));
console.log('dist fertig');
