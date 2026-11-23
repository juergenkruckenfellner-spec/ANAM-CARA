// Tägliche Sicherung (30 Tage aufbewahrt) und Löschautomatik nach den eingestellten Fristen
import { sicherungAblegen, aufraeumen, protokoll } from '../../lib/daten.mjs';
export default async () => {
  const tag = await sicherungAblegen();
  const n = await aufraeumen();
  await protokoll('System', `Tägliche Sicherung ${tag}, ${n} Einträge nach Frist gelöscht`);
};
export const config = { schedule: '17 3 * * *' };
