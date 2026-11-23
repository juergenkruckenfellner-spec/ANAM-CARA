# Anam Cara – Website mit Teilnehmerinnen-Bereich und Verwaltung

Fassung 1 · 23.11.2026 · webseitefix.at

## Was drin ist

**Öffentliche Seite (Deutsch + Englisch, `/` und `/en/`)**
Startseite, Retreats & Termine, eine eigene Seite je Reise, Über uns, zwei Gratis-Einstiege (Kennenlerngespräch, Vormerkung), Kontakt, Galerie (einschaltbar), Rückmeldungen (einschaltbar), Newsletter mit Double-Opt-in, Impressum, Datenschutz, 404-Seite.
SEO/GEO: Titel und Beschreibung je Seite im Dashboard änderbar, hreflang DE/EN, Sitemap, llms.txt, strukturierte Daten (Organisation, Veranstaltung je Reise, FAQ, Personen, Brotkrumen), Search-Console-Bestätigung über das Dashboard.

**Anmelden (rechts oben, `/anmelden`)**
Ein Login für alle. Der Server erkennt die Rolle und schickt Teilnehmerinnen in **Mein Bereich**, Sabine und Nina in die **Verwaltung**. Anmeldung mit Kennwort und Einmalcode (SMS über seven.io, sonst E-Mail).

**Mein Bereich (Teilnehmerinnen)**
Countdown bis zur Abreise, Reiseinfos, Neuigkeiten, Packliste zum Abhaken, PDF-Unterlagen, Frage an Sabine & Nina, Rückmeldung nach der Reise (mit Einwilligung zur Veröffentlichung), Konto, Datenauskunft, Konto selbst löschen.

**Verwaltung**
Übersicht · Anfragen (mit Art des Angebots, Status, Notiz) · Reisen & Termine (DE/EN, Fotos, Tagesablauf, Leistungen, Packliste, Unterlagen, Nachricht an alle Teilnehmerinnen) · Teilnehmerinnen (einladen, Reisen zuordnen, sperren, löschen) · Texte (alle Texte DE/EN, optional DeepL) · Bilder (Upload mit automatischer Verkleinerung, Bildplätze, Galerie, Alternativtexte) · Rückmeldungen (freigeben nur mit Einwilligung) · Newsletter (Hofgassl-Standard) · Besuche & Google (Statistik ohne Cookies, Seiten-Check für Google/KI) · Einstellungen (Impressum, Löschfristen, Konto, Protokoll) · Sicherung (Download, tägliche Sicherung 30 Tage, Wiederherstellen).

## Veröffentlichen auf Netlify

Die Functions sind in `netlify/functions/` bereits fertig gebündelt – auf Netlify muss nichts installiert werden.

1. Netlify-Konto auf den Namen von Anam Cara anlegen (oder in Jürgens Team als eigenes Projekt).
2. Inhalt der ZIP entpacken. Veröffentlichen mit der Netlify CLI aus diesem Ordner:
   `npx netlify-cli deploy --prod --dir=public --functions=netlify/functions`
   (Alternativ: Ordner in ein Git-Repository legen und auf Netlify verbinden.)
   Hinweis: Reines Drag-and-drop in Netlify Drop veröffentlicht keine Functions – dann fehlen Formulare, Login und Dashboard.
3. Unter *Project configuration → Environment variables* eintragen (Scope: Functions):
   | Variable | Wert |
   |---|---|
   | `SITZUNG_GEHEIMNIS` | Zufallswert, mind. 32 Zeichen (geheim) |
   | `EINRICHTUNGS_CODE` | Zufallswert, mind. 12 Zeichen, nur für die Ersteinrichtung |
   | `SEITEN_URL` | `https://anam-cara.at` (bis zur Domain: die netlify.app-Adresse) |
   | `RESEND_API_KEY` | Schlüssel aus Resend (geheim) |
   | `MAIL_ABSENDER` | `Anam Cara <post@anam-cara.at>` (Domain in Resend bestätigen) |
   | `MAIL_EMPFAENGER` | Adresse, an die Anfragen gehen |
   | `SMS_ANBIETER` / `SEVEN_API_KEY` / `SMS_ABSENDER` | optional: `seven`, Schlüssel, `AnamCara` |
   | `DEEPL_API_KEY` | optional, kostenloser DeepL-Zugang genügt |
   | `ZF_AUS` | nur im Notfall `1` (schaltet den Anmeldecode aus) |
4. Neu veröffentlichen, dann `/anmelden?einrichten` öffnen, Einrichtungscode eingeben, erstes Konto anlegen. Danach Nina über *Teilnehmerinnen → Einladen → Verwaltung* einladen. `EINRICHTUNGS_CODE` kann danach gelöscht werden.
5. Domain `anam-cara.at` registrieren (Kontoinhaber: Anam Cara), bei Netlify verbinden, DNS-Einträge für Resend (SPF/DKIM) setzen.
6. Google Search Console: Eigentum per HTML-Tag bestätigen (Code im Dashboard unter Einstellungen), Sitemap `https://anam-cara.at/sitemap.xml` einreichen.

## Lokal testen

`npm install` · `node dev/server.mjs` → http://localhost:8787 (Mailversand landet in `.dev-daten`, Einrichtungscode `einrichten-lokal-2026`). `node build.mjs` erzeugt den Ordner `dist/` für die Veröffentlichung.

## Aufbau

- `lib/store.mjs` – einzige Speicherschicht (Netlify Blobs; für einen Umzug zu einem EU-Anbieter nur diese Datei tauschen)
- `lib/daten.mjs` – fachliche Datenzugriffe · `lib/auth.mjs` – Anmeldung, Rechte · `lib/seiten.mjs` – öffentliche Seiten · `lib/nl.mjs` – Newsletter · `lib/recht.mjs` – Impressum/Datenschutz
- `netlify/functions/seite.mjs` – Seiten, Bilder, Sitemap, llms.txt · `api.mjs` – alle Schnittstellen · `taeglich.mjs` – Sicherung + Löschfristen (03:17 UTC)
