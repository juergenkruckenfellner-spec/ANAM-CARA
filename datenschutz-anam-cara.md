# Datenschutz-Dokumentation Anam Cara (Stand 23.11.2026)

Verantwortliche: Anam Cara, Sabine Rueland & Nina Walcher. Auftragsverarbeiter: Jürgen Kruckenfellner (webseitefix.at) für Bau und Betreuung → **AVV Anam Cara ↔ Jürgen bei Übergabe unterzeichnen.**
Orientierung, keine Rechtsberatung.

## Verarbeitungsverzeichnis (Art. 30)
| Tätigkeit | Daten | Zweck | Rechtsgrundlage | Speicherdauer |
|---|---|---|---|---|
| Anfrageformular | Name, E-Mail, Telefon (freiw.), Nachricht, Reise, Wunschzeit | Anfrage beantworten, Buchung vorbereiten | Art. 6 (1) b | 24 Monate, automatische Löschung |
| Newsletter | E-Mail, Name (freiw.), Einwilligungsnachweis (Zeit, Wortlaut, Quelle) | Information über neue Reisen | Art. 6 (1) a, Double-Opt-in | bis Abmeldung; danach nur Sperrliste. Unbestätigt: 30 Tage |
| Teilnehmerinnen-Bereich | Name, E-Mail, Telefon (freiw.), Kennwort-Hash, Reisen, Packliste, Fragen | Reiseorganisation | Art. 6 (1) b | 12 Monate nach letzter Reise, Selbstlöschung jederzeit |
| Rückmeldungen | Text, gewählter Name, Einwilligung | Veröffentlichung auf der Website | Art. 6 (1) a | bis Widerruf/Löschung |
| Besuchsstatistik | Seite, Tag, verweisende Domain (keine IP, keine Kennung) | Verbesserung | Art. 6 (1) f | ca. 13 Monate |
| Verwaltungskonten | Name, E-Mail, Telefon, Kennwort-Hash, Protokoll | Zugriffsschutz | Art. 6 (1) f | Dauer der Zusammenarbeit |

## Dienste-Register
| Dienst | Zweck | Daten | AVV | Standort / Transfer | Tarif |
|---|---|---|---|---|---|
| Netlify, Inc. | Hosting, Functions, Blobs (Datenspeicher) | alle oben | Netlify DPA (online annehmen, ablegen) | USA, DPF + SCC | Free/Pro – Konto auf Anam Cara |
| Resend, Inc. | Mailversand | E-Mail, Name, Mailinhalt | Resend DPA | USA, SCC (DPF-Status vor Start prüfen) | Free bis 3.000/Monat, 100/Tag |
| seven.io (optional) | SMS-Anmeldecode | Mobilnummer | AVV seven | Deutschland | Prepaid |
| DeepL (optional) | Übersetzung von Website-Texten | nur Website-Texte, keine Personendaten | DeepL AVV (Pro) | Deutschland | Free/Pro |
| JB Travel GmbH | Reiseveranstalter, Buchung | eigene Verantwortung | – (eigener Verantwortlicher) | Österreich | – |

## TOM (Art. 32)
HTTPS + HSTS · CSP ohne fremde Quellen, Schriften lokal · Kennwörter scrypt · Anmeldecode (SMS/E-Mail) · Sperre nach 5 Fehlversuchen (15 Min.) · signierte, HttpOnly/Secure/SameSite=Strict-Sitzungen (12 h Verwaltung, 14 Tage Teilnehmerinnen), Entwertung bei Kennwortwechsel · Herkunftsprüfung gegen CSRF · Rechte ausschließlich serverseitig, Negativtests automatisiert · keine Personendaten in öffentlichen Schnittstellen oder Logs · Protokoll wichtiger Aktionen · tägliche Sicherung 30 Tage + Download · Einladungs-Token nur als Hash gespeichert.

## Löschkonzept
Automatisch täglich 03:17 UTC nach den Fristen oben (im Dashboard einstellbar, *Sicherung → Jetzt aufräumen* löst sofort aus). Teilnehmerinnen löschen selbst; Auskunft per Download im eigenen Bereich. Sicherungen enthalten Personendaten und laufen nach 30 Tagen aus.

## Datenpannen-Ablauf
1. Kenntnis → sofort intern dokumentieren (auch nicht meldepflichtige Fälle). 2. Risiko bewerten (welche Daten, wie viele, wer). 3. Binnen **72 Stunden** (Kalenderstunden) Meldung an die Datenschutzbehörde (dsb.gv.at). 4. Bei hohem Risiko Betroffene informieren. 5. Jürgen und Dienstleister melden der Verantwortlichen unverzüglich.

## Prüfergebnis 23.11.2026
Automatischer Test: 49/49 bestanden (u. a. Standardschlüssel → 403, anonym → 401, Teilnehmerin → Verwaltung 403, fremde Reise → 403, manipuliertes Cookie → 401, keine Personendaten öffentlich, keine fremden Server, XSS entschärft, Abmeldung erst nach zwei Bestätigungen, kein Doppelversand). **0 rot im Code.**

## Offene Anordnungen
```
[GELB] Speicherort der Personendaten außerhalb der EU
Befund: Netlify Blobs liegt bei einem US-Anbieter (DPF + SCC). hosting-sicherheitsstandard verlangt für Echtdaten EU-Hosting.
Risiko: Drittlandtransfer (Art. 44 ff.); bei Namen/E-Mail geringes, aber vorhandenes Risiko.
Anordnung: vor Echtbetrieb entscheiden: (a) Netlify mit DPA + Transfer-Prüfung dokumentieren, oder (b) lib/store.mjs auf EU-Speicher (z. B. Supabase Frankfurt mit RLS) umstellen.
Verantwortlich: Jürgen   Frist: vor Veröffentlichung unter anam-cara.at
Nachweis: DPA abgelegt bzw. Speicherschicht getauscht und Tests grün.

[ROT] Impressum unvollständig
Befund: E-Mail-Adresse, Rechtsform, UID/Kleinunternehmer-Hinweis fehlen (Fragebogen offen).
Risiko: § 5 ECG / § 25 MedienG.
Anordnung: Angaben im Dashboard unter Einstellungen eintragen.
Verantwortlich: Sabine & Nina   Frist: vor Veröffentlichung
Nachweis: Seiten-Check ohne roten Punkt.

[GELB] AVV-Kette
Anordnung: DPA Netlify + Resend annehmen und ablegen; AVV Anam Cara ↔ Jürgen unterschreiben.
Verantwortlich: Jürgen   Frist: 30 Tage / vor Start
```
