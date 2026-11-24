// Standardinhalte und Feldverzeichnis. Das Dashboard baut seinen Text-Editor aus FELDER.
// Alle Texte sind ENTWÜRFE nach dem Fragebogen und werden von Sabine & Nina ersetzt.
// Markierung: *kursiv* wird in Überschriften als Akzent gesetzt.

export const FELDER = [
  // [schlüssel, beschriftung, typ, gruppe]
  ['seo.start.titel', 'Seitentitel Startseite (Google, max. 60 Zeichen)', 'zeile', 'Suchmaschinen'],
  ['seo.start.beschreibung', 'Beschreibung Startseite (Google, 120–160 Zeichen)', 'absatz', 'Suchmaschinen'],
  ['seo.retreats.titel', 'Seitentitel Retreats', 'zeile', 'Suchmaschinen'],
  ['seo.retreats.beschreibung', 'Beschreibung Retreats', 'absatz', 'Suchmaschinen'],
  ['seo.ueber.titel', 'Seitentitel Über uns', 'zeile', 'Suchmaschinen'],
  ['seo.ueber.beschreibung', 'Beschreibung Über uns', 'absatz', 'Suchmaschinen'],
  ['seo.kontakt.beschreibung', 'Beschreibung Kontakt', 'absatz', 'Suchmaschinen'],

  ['hero.vorzeile', 'Kleine Zeile über der Überschrift', 'zeile', 'Startseite'],
  ['hero.titel', 'Große Überschrift (*Wort* = kursiv)', 'zeile', 'Startseite'],
  ['hero.text', 'Einleitung', 'absatz', 'Startseite'],
  ['hero.knopf', 'Knopf', 'zeile', 'Startseite'],
  ['hero.link', 'Zweiter Verweis', 'zeile', 'Startseite'],
  ['name.titel', 'Abschnitt Name – Überschrift', 'zeile', 'Startseite'],
  ['name.text', 'Abschnitt Name – Text', 'absatz', 'Startseite'],
  ['werte.titel', 'Werte – Überschrift', 'zeile', 'Startseite'],
  ['werte.text', 'Werte – Einleitung', 'absatz', 'Startseite'],
  ['werte.1.t', 'Wert 1 – Stichwort', 'zeile', 'Startseite'], ['werte.1', 'Wert 1 – Text', 'absatz', 'Startseite'],
  ['werte.2.t', 'Wert 2 – Stichwort', 'zeile', 'Startseite'], ['werte.2', 'Wert 2 – Text', 'absatz', 'Startseite'],
  ['werte.3.t', 'Wert 3 – Stichwort', 'zeile', 'Startseite'], ['werte.3', 'Wert 3 – Text', 'absatz', 'Startseite'],
  ['fuerwen.titel', 'Für wen – Überschrift', 'zeile', 'Startseite'],
  ['fuerwen.1', 'Für wen – 1', 'absatz', 'Startseite'],
  ['fuerwen.2', 'Für wen – 2', 'absatz', 'Startseite'],
  ['fuerwen.3', 'Für wen – 3', 'absatz', 'Startseite'],
  ['ablauf.titel', 'Weg zur Buchung – Überschrift', 'zeile', 'Startseite'],
  ['ablauf.1', 'Schritt 1', 'absatz', 'Startseite'],
  ['ablauf.2', 'Schritt 2', 'absatz', 'Startseite'],
  ['ablauf.3', 'Schritt 3', 'absatz', 'Startseite'],
  ['ablauf.4', 'Schritt 4', 'absatz', 'Startseite'],
  ['ablauf.5', 'Schritt 5', 'absatz', 'Startseite'],
  ['stimmen.titel', 'Stimmen – Überschrift', 'zeile', 'Startseite'],
  ['galerie.titel', 'Galerie – Überschrift', 'zeile', 'Startseite'],

  ['ueber.titel', 'Überschrift', 'zeile', 'Über uns'],
  ['ueber.text', 'Gemeinsamer Text', 'absatz', 'Über uns'],
  ['ueber.sabine.name', 'Sabine – Name', 'zeile', 'Über uns'],
  ['ueber.sabine.text', 'Sabine – Text', 'absatz', 'Über uns'],
  ['ueber.nina.name', 'Nina – Name', 'zeile', 'Über uns'],
  ['ueber.nina.text', 'Nina – Text', 'absatz', 'Über uns'],

  ['retreats.titel', 'Überschrift Retreat-Seite', 'zeile', 'Retreats'],
  ['retreats.text', 'Einleitung Retreat-Seite', 'absatz', 'Retreats'],
  ['retreats.veranstalter', 'Hinweis Veranstalter / Buchung', 'absatz', 'Retreats'],

  ['kennen.titel', 'Überschrift', 'zeile', 'Gratis: Kennenlerngespräch'],
  ['kennen.text', 'Text', 'absatz', 'Gratis: Kennenlerngespräch'],
  ['kennen.knopf', 'Knopf', 'zeile', 'Gratis: Kennenlerngespräch'],
  ['warte.titel', 'Überschrift', 'zeile', 'Gratis: Vormerkung'],
  ['warte.text', 'Text', 'absatz', 'Gratis: Vormerkung'],
  ['warte.knopf', 'Knopf', 'zeile', 'Gratis: Vormerkung'],

  ['kontakt.titel', 'Überschrift', 'zeile', 'Kontakt'],
  ['kontakt.text', 'Text', 'absatz', 'Kontakt'],
  ['kontakt.danke', 'Text nach dem Absenden', 'absatz', 'Kontakt'],

  ['nl.titel', 'Überschrift', 'zeile', 'Newsletter'],
  ['nl.text', 'Text', 'absatz', 'Newsletter'],
  ['nl.einwilligung', 'Wortlaut der Einwilligung (wird als Nachweis gespeichert)', 'absatz', 'Newsletter'],

  ['faq.1.f', 'Frage 1', 'zeile', 'Häufige Fragen'], ['faq.1.a', 'Antwort 1', 'absatz', 'Häufige Fragen'],
  ['faq.2.f', 'Frage 2', 'zeile', 'Häufige Fragen'], ['faq.2.a', 'Antwort 2', 'absatz', 'Häufige Fragen'],
  ['faq.3.f', 'Frage 3', 'zeile', 'Häufige Fragen'], ['faq.3.a', 'Antwort 3', 'absatz', 'Häufige Fragen'],
  ['faq.4.f', 'Frage 4', 'zeile', 'Häufige Fragen'], ['faq.4.a', 'Antwort 4', 'absatz', 'Häufige Fragen'],
  ['faq.5.f', 'Frage 5', 'zeile', 'Häufige Fragen'], ['faq.5.a', 'Antwort 5', 'absatz', 'Häufige Fragen'],

  ['faq.6.f', 'Frage 6', 'zeile', 'Häufige Fragen'], ['faq.6.a', 'Antwort 6', 'absatz', 'Häufige Fragen'],

  ['fuss.satz', 'Satz in der Fußzeile', 'absatz', 'Fußzeile'],
];

const de = {
  'seo.start.titel': 'Retreat für Frauen in Irland 2027 – Anam Cara',
  'seo.start.beschreibung': 'Anam Cara – Retreats zwischen wilder Natur, alten Geschichten und neuen Begegnungen in Irland. Rooted & Wild zu Samhain, 28. Oktober bis 3. November 2027.',
  'seo.retreats.titel': 'Retreats für Frauen: Termine 2027 – Anam Cara',
  'seo.retreats.beschreibung': 'Retreats für Frauen in Irland: Rooted & Wild zu Samhain, 28. Oktober bis 3. November 2027 in Co. Sligo. Weitere Reisen sind in Planung.',
  'seo.ueber.titel': 'Sabine Rueland & Nina Walcher – Anam Cara',
  'seo.ueber.beschreibung': 'Wer hinter Anam Cara steht: Sabine Rueland und Nina Walcher aus der Steiermark, Gastgeberinnen der Retreats für Frauen.',
  'seo.kontakt.beschreibung': 'Anfrage zu den Anam-Cara-Retreats, kostenloses Kennenlerngespräch oder Vormerkung für kommende Reisen.',

  'hero.vorzeile': 'Besondere Retreats im wilden Herzen Irlands · mit Sabine Rueland & Nina Walcher',
  'hero.titel': 'Besondere Orte. Tiefe Begegnungen. *Zeit für dich.*',
  'hero.text': 'Anam Cara ist Gälisch und heißt Seelenfreundin. Wir begleiten dich zu den kraftvollen und ursprünglichen Landschaften Irlands – mit liebevoll gestalteten Retreats, besonderen Erfahrungen und Raum für das Wesentliche.',
  'hero.knopf': 'Das Retreat in Irland',
  'hero.link': 'Kennenlerngespräch anfragen',
  'name.titel': 'Woher der Name kommt',
  'name.text': 'Im alten Irland war die Anam Cara jener Mensch, dem man sich anvertrauen konnte, ohne sich zu verstellen. Deshalb führen unsere Retreats nach Irland, in das Land, aus dem das Wort stammt. Irland wertet nicht, es nimmt dich so an, wie du bist.',
  'fuerwen.titel': 'Für wen wir diese Reisen machen',
  'fuerwen.1': 'Für Frauen, die beruflich viel tragen, selbstständig oder mit Verantwortung im Unternehmen, und sich eine Woche gönnen, in der niemand etwas von ihnen braucht.',
  'fuerwen.2': 'Für Frauen in einer Umbruchsphase, die spüren, dass sich etwas verändert, und dem bewusst Raum geben wollen.',
  'fuerwen.3': 'Für Frauen, die sich nach Natur sehnen und danach, wieder Wurzeln zu spüren: zur Erde und zu sich selbst.',
  'ablauf.titel': 'Vom ersten Gespräch bis zur Abreise',
  'ablauf.1': 'Du schreibst uns oder fragst ein kostenloses Kennenlerngespräch an.',
  'ablauf.2': 'Wir telefonieren eine Viertelstunde und klären gemeinsam, ob die Reise gerade zu dir passt.',
  'ablauf.3': 'Gebucht wird über unseren Reisepartner, die JB Travel GmbH.',
  'ablauf.4': 'Danach bekommst du einen Zugang zu deinem eigenen Bereich auf dieser Seite: Reiseinfos, Packliste und Unterlagen an einem Ort.',
  'ablauf.5': 'Nach der Reise bleiben wir in Verbindung, wenn du das möchtest.',
  'stimmen.titel': 'Was Teilnehmerinnen erzählen',
  'galerie.titel': 'Bilder unserer Reisen',

  'ueber.titel': 'Sabine & Nina',
  'ueber.text': 'Wir kommen beide aus der Steiermark, aus Schladming und aus Neumarkt an der Raab. Anam Cara ist unser gemeinsames Vorhaben: Reisen für Frauen, die Tiefe suchen, ohne dass es schwer wird.',
  'ueber.sabine.name': 'Sabine Rueland',
  'ueber.sabine.text': 'Sabine öffnet Räume für Entschleunigung und echte, tiefe Begegnung. Seit 2015 führt sie den Yogastadl in Neumarkt an der Raab, einen Rückzugsort für innere Ruhe. Sie begleitet Frauen mit Herzlichkeit, Achtsamkeit und gelebter Erfahrung und verbindet sie wieder mit ihrer eigenen Kraft und der Natur.',
  'ueber.nina.name': 'Nina Walcher',
  'ueber.nina.text': 'Nina war 19, als sie das erste Mal irischen Boden betrat – und fühlte sich sofort verwurzelt und angenommen. Seit über 20 Jahren reist sie nach Irland und hat dort ein Netz aus Freundinnen und Freunden. Mit Ursprung Events und ihrem Projekt vondaoim bietet sie naturnahe Erlebnisse an und zeigt dir ihre liebsten Kraftplätze.',

  'retreats.titel': 'Retreats & Termine',
  'retreats.text': 'Im Herbst 2027 führt uns Rooted & Wild zu Samhain nach Irland. Weitere Reisen sind in Planung; wer vorgemerkt ist, erfährt die Termine zuerst.',
  'retreats.veranstalter': 'Reiseveranstalter ist die JB Travel GmbH. Über sie läuft die Buchung, sie stellt die Reiseunterlagen aus.',

  'kennen.titel': 'Kostenloses Kennenlerngespräch',
  'kennen.text': 'Eine Viertelstunde am Telefon oder per Video mit Sabine oder Nina. Du erzählst, wo du gerade stehst, wir erzählen, wie eine Woche mit uns aussieht. Danach entscheidest du in Ruhe, ohne Verpflichtung.',
  'kennen.knopf': 'Gespräch anfragen',
  'warte.titel': 'Vormerkung für die nächsten Reisen',
  'warte.text': 'Nach Rooted & Wild in Irland folgen weitere Reisen. Trag dich ein, dann melden wir uns persönlich, sobald Ort und Datum der nächsten Reise feststehen, noch bevor wir sie öffentlich ankündigen.',
  'warte.knopf': 'Vormerken lassen',

  'kontakt.titel': 'Schreib uns',
  'kontakt.text': 'Wir antworten persönlich, meistens innerhalb von zwei Tagen.',
  'kontakt.danke': 'Danke für deine Nachricht. Sabine oder Nina melden sich bei dir.',

  'nl.titel': 'Post von uns, zwei- bis dreimal im Jahr',
  'nl.text': 'Wenn ein neues Retreat feststeht, erfährst du es hier zuerst. Mehr schicken wir nicht.',
  'nl.einwilligung': 'Ich möchte den Newsletter von Anam Cara (Sabine Rueland & Nina Walcher) per E-Mail erhalten, etwa zwei- bis dreimal im Jahr. Ich kann ihn jederzeit über den Link in jeder Ausgabe abbestellen.',

  'faq.1.f': 'Wann findet das nächste Retreat statt?',
  'faq.1.a': 'Rooted & Wild findet vom 28. Oktober bis 3. November 2027 in Co. Sligo in Irland statt, zu Samhain, dem keltischen Jahresbeginn. Sechs Nächte, nur für Frauen, mit begrenzter Teilnehmerinnenzahl.',
  'faq.2.f': 'Wie buche ich einen Platz?',
  'faq.2.a': 'Schick uns eine Anfrage oder frag ein kostenloses Kennenlerngespräch an. Gebucht wird anschließend über unseren Reisepartner, die JB Travel GmbH.',
  'faq.3.f': 'Für wen ist das Retreat gedacht?',
  'faq.3.a': 'Für Frauen, die eine Woche Abstand vom Alltag suchen: aus der Selbstständigkeit, aus verantwortungsvollen Positionen, in einer Umbruchsphase oder mit dem Wunsch nach mehr Naturverbundenheit.',
  'faq.4.f': 'Gibt es weitere Termine?',
  'faq.4.a': 'Ja, weitere Retreats sind in Planung. Wer sich vormerken lässt oder den Newsletter bezieht, erfährt die Termine zuerst.',
  'faq.5.f': 'Was kostet die Reise?',
  'faq.5.a': 'Frühbucherpreis 2.948 € bis 21. März 2027 (Ostara), danach 3.333 €. Bei der Buchung über die JB Travel GmbH werden 20 % angezahlt. Alle enthaltenen Leistungen nennen wir dir gerne im Kennenlerngespräch.',

  'faq.6.f': 'Ist das eher ein Retreat oder eine Frauenreise?',
  'faq.6.a': 'Beides: eine Reise nur für Frauen in kleiner Runde, mit viel Zeit in der Natur, Stille und Gesprächen. Eine Auszeit vom Alltag, organisiert von Sabine und Nina, gebucht über die JB Travel GmbH.',

  'werte.titel': 'Folge dem Ruf deiner Seele',
  'werte.text': 'Wo die Seele Wurzeln schlägt: Retreats in Irland für mehr Naturverbundenheit, innere Ruhe und echte Begegnung.',
  'werte.1.t': 'Die Magie',
  'werte.1': 'Irland, Samhain, die ursprüngliche Natur und die besondere Atmosphäre.',
  'werte.2.t': 'Die Menschlichkeit',
  'werte.2': 'Zwei Gastgeberinnen, die Frauen willkommen heißen, begleiten und echte Begegnung ermöglichen.',
  'werte.3.t': 'Der Wert',
  'werte.3': 'Eine sorgfältig gestaltete Reise, die konkrete Erlebnisse mit Zeit für dich selbst verbindet.',
  'fuss.satz': 'Anam Cara: Retreats für Frauen von Sabine Rueland und Nina Walcher, Steiermark.',
};

const en = {
  'seo.start.titel': 'Women’s Retreat in Ireland 2027 – Anam Cara',
  'seo.start.beschreibung': 'Anam Cara – retreats between wild nature, old stories and new encounters in Ireland. Rooted & Wild at Samhain, 28 October to 3 November 2027.',
  'seo.retreats.titel': 'Retreats & Dates – Anam Cara',
  'seo.retreats.beschreibung': 'Retreats for women in Ireland: Rooted & Wild at Samhain, 28 October to 3 November 2027 in Co. Sligo. More journeys in planning.',
  'seo.ueber.titel': 'Sabine Rueland & Nina Walcher – Anam Cara',
  'seo.ueber.beschreibung': 'Who is behind Anam Cara: Sabine Rueland and Nina Walcher from Styria, Austria, hosts of retreats for women.',
  'seo.kontakt.beschreibung': 'Ask about the Anam Cara retreats, book a free introductory call or join the list for upcoming journeys.',

  'hero.vorzeile': 'Special retreats in the wild heart of Ireland · with Sabine Rueland & Nina Walcher',
  'hero.titel': 'Special places. Deep encounters. *Time for you.*',
  'hero.text': 'Anam Cara is Gaelic for soul friend. We take you to the powerful, untouched landscapes of Ireland – with lovingly designed retreats, special experiences and room for what really matters.',
  'hero.knopf': 'The retreat in Ireland',
  'hero.link': 'Request an introductory call',
  'name.titel': 'Where the name comes from',
  'name.text': 'In old Ireland, your anam cara was the person you could confide in without pretending. That is why our retreats go to Ireland, the country the word comes from. Ireland does not judge; it accepts you just as you are.',
  'fuerwen.titel': 'Who these journeys are for',
  'fuerwen.1': 'Women who carry a lot at work, self-employed or in a leading role, and want one week in which nobody needs anything from them.',
  'fuerwen.2': 'Women in a time of transition who sense that something is changing and want to give it room.',
  'fuerwen.3': 'Women who long for nature and to feel rooted again: in the earth and in themselves.',
  'ablauf.titel': 'From the first call to departure',
  'ablauf.1': 'You write to us or request a free introductory call.',
  'ablauf.2': 'We talk for a quarter of an hour and find out together whether the journey suits you right now.',
  'ablauf.3': 'Bookings are handled by our travel partner, JB Travel GmbH.',
  'ablauf.4': 'You then get access to your own area on this website: travel information, packing list and documents in one place.',
  'ablauf.5': 'After the journey we stay in touch, if you would like that.',
  'stimmen.titel': 'What participants say',
  'galerie.titel': 'Pictures from our journeys',

  'ueber.titel': 'Sabine & Nina',
  'ueber.text': 'We both come from Styria in Austria, from Schladming and from Neumarkt an der Raab. Anam Cara is our shared project: journeys for women who are looking for depth without heaviness.',
  'ueber.sabine.name': 'Sabine Rueland',
  'ueber.sabine.text': 'Sabine opens spaces for slowing down and for real, deep encounters. Since 2015 she has run the Yogastadl in Neumarkt an der Raab, a retreat for inner calm. She accompanies women with warmth, mindfulness and lived experience and reconnects them with their own strength and with nature.',
  'ueber.nina.name': 'Nina Walcher',
  'ueber.nina.text': 'Nina was 19 when she first set foot in Ireland – and immediately felt rooted and accepted. She has travelled there for more than 20 years and has a circle of friends on the island. With Ursprung Events and her project vondaoim she offers nature-based experiences and shows you her favourite places of power.',

  'retreats.titel': 'Retreats & dates',
  'retreats.text': 'In autumn 2027 Rooted & Wild takes us to Ireland for Samhain. More journeys are being planned; if you join the list you will hear about the dates first.',
  'retreats.veranstalter': 'The tour operator is JB Travel GmbH. Bookings and travel documents are handled by them.',

  'kennen.titel': 'Free introductory call',
  'kennen.text': 'A quarter of an hour by phone or video with Sabine or Nina. You tell us where you are right now, we tell you what a week with us looks like. Then you decide in your own time, with no obligation.',
  'kennen.knopf': 'Request a call',
  'warte.titel': 'Join the list for upcoming journeys',
  'warte.text': 'More journeys will follow Rooted & Wild in Ireland. Leave your details and we will contact you personally as soon as the place and date of the next journey are set, before we announce it publicly.',
  'warte.knopf': 'Put me on the list',

  'kontakt.titel': 'Write to us',
  'kontakt.text': 'We reply personally, usually within two days.',
  'kontakt.danke': 'Thank you for your message. Sabine or Nina will get back to you.',

  'nl.titel': 'A letter from us, two or three times a year',
  'nl.text': 'When a new retreat is confirmed, you will hear it here first. That is all we send.',
  'nl.einwilligung': 'I would like to receive the Anam Cara newsletter (Sabine Rueland & Nina Walcher) by email, about two or three times a year. I can unsubscribe at any time via the link in every issue.',

  'faq.1.f': 'When is the next retreat?',
  'faq.1.a': 'Rooted & Wild takes place from 28 October to 3 November 2027 in Co. Sligo, Ireland, at Samhain, the Celtic new year. Six nights, women only, limited places.',
  'faq.2.f': 'How do I book a place?',
  'faq.2.a': 'Send us an enquiry or request a free introductory call. The booking itself is made through our travel partner, JB Travel GmbH.',
  'faq.3.f': 'Who is the retreat for?',
  'faq.3.a': 'For women looking for a week away from everyday life: self-employed, in responsible positions, in a time of transition, or wishing to feel closer to nature.',
  'faq.4.f': 'Will there be more dates?',
  'faq.4.a': 'Yes, more retreats are being planned. Join the list or subscribe to the newsletter to hear about them first.',
  'faq.5.f': 'How much does the journey cost?',
  'faq.5.a': 'Early-bird price €2,948 until 21 March 2027 (Ostara), then €3,333. A 20% deposit is paid when booking through JB Travel GmbH. We are happy to tell you everything that is included during the introductory call.',

  'faq.6.f': 'Is it a retreat or a women’s trip?',
  'faq.6.a': 'Both: a journey for women only in a small group, with plenty of time in nature, quiet and conversation. A break from everyday life, hosted by Sabine and Nina and booked through JB Travel GmbH.',

  'werte.titel': 'Follow the call of your soul',
  'werte.text': 'Where the soul puts down roots: retreats in Ireland for a deeper bond with nature, inner calm and real encounter.',
  'werte.1.t': 'The magic',
  'werte.1': 'Ireland, Samhain, untouched nature and a very special atmosphere.',
  'werte.2.t': 'The humanity',
  'werte.2': 'Two hosts who welcome women, accompany them and make real encounter possible.',
  'werte.3.t': 'The value',
  'werte.3': 'A carefully designed journey that combines real experiences with time for yourself.',
  'fuss.satz': 'Anam Cara: retreats for women by Sabine Rueland and Nina Walcher, Styria, Austria.',
};

export const STANDARD_INHALT = {
  fassung: 1,
  entwurf: true, // Dashboard zeigt Hinweis, solange Entwurfstexte aktiv sind
  texte: { de, en },
  einstellungen: {
    name: 'Anam Cara',
    wortlaut: 'Anam Cara',         // Firmenwortlaut / Vereinsname laut Impressum
    rechtsform: '',                // offen laut Fragebogen
    personen: 'Sabine Rueland, Nina Walcher',
    adressen: ['Maistatt 368/2, 8970 Schladming', 'Hauptstraße 9, 8380 Neumarkt an der Raab'],
    email: '',                     // eigene Adresse folgt (Domain noch nicht registriert)
    telefon: '',
    uid: '',
    firmenbuch: '',
    kammer: '',
    veranstalter: 'JB Travel GmbH',
    social: { instagram: '', facebook: '' },
    gscToken: '',                  // Google Search Console Bestätigung
    bildplaetze: { hero: '', ueber: '', sabine: '', nina: '' },
    abschnitte: { stimmen: false, galerie: false }, // erst sichtbar, wenn Inhalte da sind
    fristen: { anfragenMonate: 24, unbestaetigtTage: 30, teilnehmerinnenMonateNachReise: 12 },
  },
};

export const STANDARD_RETREATS = [
  {
    id: 'irland-2027',
    slug: 'irland-2027',
    veroeffentlicht: true,
    status: 'buchbar', // geplant | buchbar | ausgebucht | vorbei
    von: '2027-10-28',
    bis: '2027-11-03',
    plaetze: 'begrenzt, nur für Frauen',
    bild: '',
    titel: { de: 'Rooted & Wild – Samhain in Irland', en: 'Rooted & Wild – Samhain in Ireland' },
    ort: { de: 'Co. Sligo, Irland', en: 'Co. Sligo, Ireland' },
    kurz: {
      de: 'Komm zurück zu deinen Wurzeln. Entdecke deine Wildheit. Sechs Nächte zu Samhain an einem Kraftort, den wir nur für unsere Frauengruppe gebucht haben.',
      en: 'Come back to your roots. Discover your wildness. Six nights at Samhain in a place of power booked exclusively for our group of women.',
    },
    text: {
      de: 'Wenn die Schleier zwischen den Welten am dünnsten sind, reisen wir gemeinsam nach Irland. Zu Samhain, dem keltischen Jahresbeginn, verbinden wir uns mit der Kraft unserer Ahninnen, lassen Altes im Feuer zurück und verwurzeln uns neu.\n\nUnser Zuhause für diese Woche ist ein geschütztes Anwesen in unberührter Natur, exklusiv für unsere Frauengruppe. Hier kommen wir in Frauenkreisen zusammen, feiern Rituale, genießen nährende Mahlzeiten, lachen, ruhen und lassen uns berühren.\n\nDas genaue Programm folgt. Fragen beantworten wir gerne persönlich im Kennenlerngespräch.',
      en: 'When the veil between the worlds is thinnest, we travel to Ireland together. At Samhain, the Celtic new year, we connect with the strength of our ancestors, leave the old behind in the fire and put down new roots.\n\nOur home for the week is a sheltered estate surrounded by untouched nature, booked exclusively for our group of women. Here we gather in women’s circles, celebrate rituals, share nourishing meals, laugh, rest and allow ourselves to be moved.\n\nThe detailed programme will follow. We are happy to answer your questions personally during the introductory call.',
    },
    ablauf: { de: 'Trommelreise, Rituale am Feuer, Yin Yoga, Ecstatic Dance, Kakao-Zeremonie, Stille, barfuß in der Natur und ein Ausflug zu Kultur und Sehenswürdigkeiten. Mehr verraten wir noch nicht.', en: 'Drum journey, fire rituals, yin yoga, ecstatic dance, cacao ceremony, silence, barefoot time in nature and an excursion for culture and sightseeing. We are not giving away more yet.' },
    leistungen: { de: '6 Nächte auf einem exklusiv gebuchten Anwesen, gemeinsame Mahlzeiten, Begleitung durch Sabine und Nina. Mitbringen: UK-Adapter, bequeme, warme und wetterfeste Kleidung.', en: '6 nights at an exclusively booked estate, shared meals, guidance by Sabine and Nina. Bring: UK adapter, comfortable, warm and weatherproof clothing.' },
    preis: { de: 'Frühbucher 2.948 € bis 21. März 2027, danach 3.333 € · 20 % Anzahlung', en: 'Early bird €2,948 until 21 March 2027, then €3,333 · 20% deposit' },
    // nur für Teilnehmerinnen sichtbar:
    infos: '',
    packliste: ['Wetterfeste Jacke', 'Feste Wanderschuhe', 'Warme Schichten zum Übereinanderziehen', 'Reisepass oder Personalausweis', 'Notizbuch'],
    dokumente: [],
    nachrichten: [],
  },
];
