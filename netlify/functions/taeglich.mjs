// Tägliche Sicherung (30 Tage aufbewahrt) und Löschautomatik nach den eingestellten Fristen
import { sicherungAblegen, aufraeumen, protokoll } from '../../lib/daten.mjs';
import { automatischMahnen } from '../../lib/buchhaltung.mjs';
import { geheimnisBereit, env } from '../../lib/util.mjs';
import { mailPruefen } from '../../lib/mailwache.mjs';
export default async () => {
  await geheimnisBereit();
  const tag = await sicherungAblegen();
  const n = await aufraeumen();
  await protokoll('System', `Tägliche Sicherung ${tag}, ${n} Einträge nach Frist gelöscht`);
  try { await mailPruefen(env('SEITEN_URL') || env('URL') || 'https://anam-cara.at'); } catch (e) { console.error('Mail-Wache', e.message); }
  try { await automatischMahnen(env('URL') || 'https://anam-cara.at'); } catch (e) { console.error('Mahnlauf', e.message); }
};
export const config = { schedule: '17 3 * * *' };
