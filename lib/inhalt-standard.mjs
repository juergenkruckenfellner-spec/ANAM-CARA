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
  'seo.start.beschreibung': 'Frauenreise und Auszeit für Frauen: Retreat mit Sabine Rueland und Nina Walcher, 28. Oktober bis 3. November 2027 in Irland. Kleine Runde, Natur, Stille.',
  'seo.retreats.titel': 'Retreats für Frauen: Termine 2027 – Anam Cara',
  'seo.retreats.beschreibung': 'Alle Termine der Anam-Cara-Retreats und Frauenreisen. Erstes Retreat: Irland, 28. Oktober bis 3. November 2027. Weitere Reisen sind in Planung.',
  'seo.ueber.titel': 'Sabine Rueland & Nina Walcher – Anam Cara',
  'seo.ueber.beschreibung': 'Wer hinter Anam Cara steht: Sabine Rueland und Nina Walcher aus der Steiermark, Gastgeberinnen der Retreats für Frauen.',
  'seo.kontakt.beschreibung': 'Anfrage zu den Anam-Cara-Retreats, kostenloses Kennenlerngespräch oder Vormerkung für kommende Reisen.',

  'hero.vorzeile': 'Retreat für Frauen · Irland 2027 · mit Sabine Rueland & Nina Walcher',
  'hero.titel': 'Eine Woche an der irischen Küste, um wieder *bei dir* anzukommen',
  'hero.text': 'Anam Cara ist Gälisch und heißt Seelenfreundin. So verstehen wir unsere Reisen: eine kleine Runde Frauen, viel Natur, Zeit zum Nachdenken und zwei Gastgeberinnen, die zuhören.',
  'hero.knopf': 'Das Retreat in Irland',
  'hero.link': 'Kennenlerngespräch anfragen',
  'name.titel': 'Woher der Name kommt',
  'name.text': 'Im alten Irland war die Anam Cara jener Mensch, dem man sich anvertrauen konnte, ohne sich zu verstellen. Für unsere erste Reise haben wir deshalb Irland gewählt: das Land, aus dem das Wort stammt.',
  'fuerwen.titel': 'Für wen wir diese Reisen machen',
  'fuerwen.1': 'Für Frauen, die beruflich viel tragen, selbstständig oder mit Verantwortung im Unternehmen, und sich eine Woche gönnen, in der niemand etwas von ihnen braucht.',
  'fuerwen.2': 'Für Frauen in einer Umbruchsphase, die spüren, dass sich etwas verändert, und dem bewusst Raum geben wollen.',
  'fuerwen.3': 'Für Frauen, die sich nach Natur sehnen und danach, wieder Wurzeln zu spüren: zur Erde und zu sich selbst.',
  'ablauf.titel': 'Vom ersten Gespräch bis zur Abreise',
  'ablauf.1': 'Du schreibst uns oder fragst ein kostenloses Kennenlerngespräch an.',
  'ablauf.2': 'Wir telefonieren eine halbe Stunde und klären gemeinsam, ob die Reise gerade zu dir passt.',
  'ablauf.3': 'Gebucht wird über unseren Reisepartner, die JB Travel GmbH.',
  'ablauf.4': 'Danach bekommst du einen Zugang zu deinem eigenen Bereich auf dieser Seite: Reiseinfos, Packliste und Unterlagen an einem Ort.',
  'ablauf.5': 'Nach der Reise bleiben wir in Verbindung, wenn du das möchtest.',
  'stimmen.titel': 'Was Teilnehmerinnen erzählen',
  'galerie.titel': 'Bilder unserer Reisen',

  'ueber.titel': 'Sabine & Nina',
  'ueber.text': 'Wir kommen beide aus der Steiermark, aus Schladming und aus Neumarkt an der Raab. Anam Cara ist unser gemeinsames Vorhaben: Reisen für Frauen, die Tiefe suchen, ohne dass es schwer wird.',
  'ueber.sabine.name': 'Sabine Rueland',
  'ueber.sabine.text': 'Sabine führt den Jogastadl. [Kurzbiografie folgt: bitte im Dashboard ergänzen.]',
  'ueber.nina.name': 'Nina Walcher',
  'ueber.nina.text': 'Nina steht hinter Ursprung Events. [Kurzbiografie folgt: bitte im Dashboard ergänzen.]',

  'retreats.titel': 'Retreats & Termine',
  'retreats.text': 'Unsere Premiere führt im Herbst 2027 nach Irland. Weitere Reisen sind in Planung; wer vorgemerkt ist, erfährt die Termine zuerst.',
  'retreats.veranstalter': 'Reiseveranstalter ist die JB Travel GmbH. Über sie läuft die Buchung, sie stellt die Reiseunterlagen aus.',

  'kennen.titel': 'Kostenloses Kennenlerngespräch',
  'kennen.text': 'Eine halbe Stunde am Telefon oder per Video mit Sabine oder Nina. Du erzählst, wo du gerade stehst, wir erzählen, wie eine Woche mit uns aussieht. Danach entscheidest du in Ruhe, ohne Verpflichtung.',
  'kennen.knopf': 'Gespräch anfragen',
  'warte.titel': 'Vormerkung für die nächsten Reisen',
  'warte.text': 'Irland im Herbst 2027 ist unser Anfang. Trag dich ein, dann melden wir uns persönlich, sobald Ort und Datum der nächsten Reise feststehen, noch bevor wir sie öffentlich ankündigen.',
  'warte.knopf': 'Vormerken lassen',

  'kontakt.titel': 'Schreib uns',
  'kontakt.text': 'Wir antworten persönlich, meistens innerhalb von zwei Tagen.',
  'kontakt.danke': 'Danke für deine Nachricht. Sabine oder Nina melden sich bei dir.',

  'nl.titel': 'Post von uns, zwei- bis dreimal im Jahr',
  'nl.text': 'Wenn ein neues Retreat feststeht, erfährst du es hier zuerst. Mehr schicken wir nicht.',
  'nl.einwilligung': 'Ich möchte den Newsletter von Anam Cara (Sabine Rueland & Nina Walcher) per E-Mail erhalten, etwa zwei- bis dreimal im Jahr. Ich kann ihn jederzeit über den Link in jeder Ausgabe abbestellen.',

  'faq.1.f': 'Wann findet das erste Retreat statt?',
  'faq.1.a': 'Vom 28. Oktober bis 3. November 2027 in Irland. Es ist unsere Premiere.',
  'faq.2.f': 'Wie buche ich einen Platz?',
  'faq.2.a': 'Schick uns eine Anfrage oder frag ein kostenloses Kennenlerngespräch an. Gebucht wird anschließend über unseren Reisepartner, die JB Travel GmbH.',
  'faq.3.f': 'Für wen ist das Retreat gedacht?',
  'faq.3.a': 'Für Frauen, die eine Woche Abstand vom Alltag suchen: aus der Selbstständigkeit, aus verantwortungsvollen Positionen, in einer Umbruchsphase oder mit dem Wunsch nach mehr Naturverbundenheit.',
  'faq.4.f': 'Gibt es weitere Termine?',
  'faq.4.a': 'Ja, weitere Retreats sind in Planung. Wer sich vormerken lässt oder den Newsletter bezieht, erfährt die Termine zuerst.',
  'faq.5.f': 'Was kostet die Reise?',
  'faq.5.a': 'Den Preis und alle enthaltenen Leistungen nennen wir dir auf Anfrage oder im Kennenlerngespräch.',

  'faq.6.f': 'Ist das eher ein Retreat oder eine Frauenreise?',
  'faq.6.a': 'Beides: eine Reise nur für Frauen in kleiner Runde, mit viel Zeit in der Natur, Stille und Gesprächen. Eine Auszeit vom Alltag, organisiert von Sabine und Nina, gebucht über die JB Travel GmbH.',

  'fuss.satz': 'Anam Cara: Retreats für Frauen von Sabine Rueland und Nina Walcher, Steiermark.',
};

const en = {
  'seo.start.titel': 'Women’s Retreat in Ireland 2027 – Anam Cara',
  'seo.start.beschreibung': 'Retreats for women with Sabine Rueland and Nina Walcher. Our first retreat: 28 October to 3 November 2027 in Ireland. Nature, quiet and time for yourself.',
  'seo.retreats.titel': 'Retreats & Dates – Anam Cara',
  'seo.retreats.beschreibung': 'All dates of the Anam Cara retreats for women. First retreat: Ireland, 28 October to 3 November 2027. More journeys in planning.',
  'seo.ueber.titel': 'Sabine Rueland & Nina Walcher – Anam Cara',
  'seo.ueber.beschreibung': 'Who is behind Anam Cara: Sabine Rueland and Nina Walcher from Styria, Austria, hosts of retreats for women.',
  'seo.kontakt.beschreibung': 'Ask about the Anam Cara retreats, book a free introductory call or join the list for upcoming journeys.',

  'hero.vorzeile': 'Retreats for women · with Sabine Rueland & Nina Walcher',
  'hero.titel': 'A week on the Irish coast to come back *to yourself*',
  'hero.text': 'Anam Cara is Gaelic for soul friend. That is how we think of our journeys: a small circle of women, plenty of nature, time to reflect and two hosts who listen.',
  'hero.knopf': 'The retreat in Ireland',
  'hero.link': 'Request an introductory call',
  'name.titel': 'Where the name comes from',
  'name.text': 'In old Ireland, your anam cara was the person you could confide in without pretending. That is why our first journey goes to Ireland, the country the word comes from.',
  'fuerwen.titel': 'Who these journeys are for',
  'fuerwen.1': 'Women who carry a lot at work, self-employed or in a leading role, and want one week in which nobody needs anything from them.',
  'fuerwen.2': 'Women in a time of transition who sense that something is changing and want to give it room.',
  'fuerwen.3': 'Women who long for nature and to feel rooted again: in the earth and in themselves.',
  'ablauf.titel': 'From the first call to departure',
  'ablauf.1': 'You write to us or request a free introductory call.',
  'ablauf.2': 'We talk for half an hour and find out together whether the journey suits you right now.',
  'ablauf.3': 'Bookings are handled by our travel partner, JB Travel GmbH.',
  'ablauf.4': 'You then get access to your own area on this website: travel information, packing list and documents in one place.',
  'ablauf.5': 'After the journey we stay in touch, if you would like that.',
  'stimmen.titel': 'What participants say',
  'galerie.titel': 'Pictures from our journeys',

  'ueber.titel': 'Sabine & Nina',
  'ueber.text': 'We both come from Styria in Austria, from Schladming and from Neumarkt an der Raab. Anam Cara is our shared project: journeys for women who are looking for depth without heaviness.',
  'ueber.sabine.name': 'Sabine Rueland',
  'ueber.sabine.text': 'Sabine runs the Jogastadl. [Short biography to follow.]',
  'ueber.nina.name': 'Nina Walcher',
  'ueber.nina.text': 'Nina is behind Ursprung Events. [Short biography to follow.]',

  'retreats.titel': 'Retreats & dates',
  'retreats.text': 'Our first journey takes us to Ireland in autumn 2027. More are being planned; if you join the list you will hear about the dates first.',
  'retreats.veranstalter': 'The tour operator is JB Travel GmbH. Bookings and travel documents are handled by them.',

  'kennen.titel': 'Free introductory call',
  'kennen.text': 'Half an hour by phone or video with Sabine or Nina. You tell us where you are right now, we tell you what a week with us looks like. Then you decide in your own time, with no obligation.',
  'kennen.knopf': 'Request a call',
  'warte.titel': 'Join the list for upcoming journeys',
  'warte.text': 'Ireland in autumn 2027 is our beginning. Leave your details and we will contact you personally as soon as the place and date of the next journey are set, before we announce it publicly.',
  'warte.knopf': 'Put me on the list',

  'kontakt.titel': 'Write to us',
  'kontakt.text': 'We reply personally, usually within two days.',
  'kontakt.danke': 'Thank you for your message. Sabine or Nina will get back to you.',

  'nl.titel': 'A letter from us, two or three times a year',
  'nl.text': 'When a new retreat is confirmed, you will hear it here first. That is all we send.',
  'nl.einwilligung': 'I would like to receive the Anam Cara newsletter (Sabine Rueland & Nina Walcher) by email, about two or three times a year. I can unsubscribe at any time via the link in every issue.',

  'faq.1.f': 'When is the first retreat?',
  'faq.1.a': 'From 28 October to 3 November 2027 in Ireland. It is our first journey.',
  'faq.2.f': 'How do I book a place?',
  'faq.2.a': 'Send us an enquiry or request a free introductory call. The booking itself is made through our travel partner, JB Travel GmbH.',
  'faq.3.f': 'Who is the retreat for?',
  'faq.3.a': 'For women looking for a week away from everyday life: self-employed, in responsible positions, in a time of transition, or wishing to feel closer to nature.',
  'faq.4.f': 'Will there be more dates?',
  'faq.4.a': 'Yes, more retreats are being planned. Join the list or subscribe to the newsletter to hear about them first.',
  'faq.5.f': 'How much does the journey cost?',
  'faq.5.a': 'We will tell you the price and everything included on request or during the introductory call.',

  'faq.6.f': 'Is it a retreat or a women’s trip?',
  'faq.6.a': 'Both: a journey for women only in a small group, with plenty of time in nature, quiet and conversation. A break from everyday life, hosted by Sabine and Nina and booked through JB Travel GmbH.',

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
    plaetze: '',
    bild: '',
    titel: { de: 'Retreat Irland', en: 'Retreat Ireland' },
    ort: { de: 'Irland', en: 'Ireland' },
    kurz: {
      de: 'Sieben Tage an der Küste Irlands: Natur, Stille, gute Gespräche und Zeit, die nur dir gehört. Unsere Premiere.',
      en: 'Seven days on the coast of Ireland: nature, quiet, good conversations and time that belongs to you alone. Our first journey.',
    },
    text: {
      de: 'Das genaue Programm, die Unterkunft und die enthaltenen Leistungen tragen Sabine und Nina hier ein.\n\nBis dahin beantworten wir alle Fragen gerne persönlich im Kennenlerngespräch.',
      en: 'Sabine and Nina will add the full programme, accommodation and what is included here.\n\nUntil then we are happy to answer all questions personally during an introductory call.',
    },
    ablauf: { de: '', en: '' },
    leistungen: { de: '', en: '' },
    preis: { de: 'auf Anfrage', en: 'on request' },
    // nur für Teilnehmerinnen sichtbar:
    infos: '',
    packliste: ['Wetterfeste Jacke', 'Feste Wanderschuhe', 'Warme Schichten zum Übereinanderziehen', 'Reisepass oder Personalausweis', 'Notizbuch'],
    dokumente: [],
    nachrichten: [],
  },
];
