import type { Book, Status } from "./data";
const germanBooks: [string, string][] = [
  [
    "Kreativ. Die Kunst zu sein",
    "Kreativität als Lebenshaltung: Rick Rubin beschreibt, wie Aufmerksamkeit, Offenheit und tägliche Praxis helfen, eigene Ideen zu entwickeln.",
  ],
  [
    "Die geheime Geschichte",
    "An einem College in Neuengland gerät eine Gruppe von Altphilologie-Studierenden unter den Einfluss eines charismatischen Lehrers. Ihr Streben nach Schönheit überschreitet moralische Grenzen.",
  ],
  [
    "Über die Psychologie des Geldes",
    "Morgan Housel untersucht, wie Erfahrungen, Gefühle und persönliche Gewohnheiten unseren Umgang mit Geld prägen. Im Mittelpunkt stehen Verhalten und langfristige Entscheidungen.",
  ],
  [
    "Selbstbetrachtungen",
    "Die persönlichen Aufzeichnungen des römischen Kaisers Marc Aurel kreisen um Pflicht, Vergänglichkeit und Selbstbeherrschung. Sie zeigen die stoische Philosophie als tägliche Übung.",
  ],
  [
    "Naokos Lächeln",
    "Toru Watanabe erinnert sich an Liebe, Verlust und sein Erwachsenwerden im Tokio der 1960er-Jahre. Eine melancholische Geschichte über Nähe und Erinnerung.",
  ],
  [
    "Eine kurze Geschichte der Menschheit",
    "Yuval Noah Harari verfolgt die Entwicklung des Menschen von frühen Gemeinschaften bis zur modernen Gesellschaft und fragt nach der Macht gemeinsamer Vorstellungen.",
  ],
  [
    "Die Mitternachtsbibliothek",
    "Zwischen Leben und Tod entdeckt Nora Seed eine Bibliothek voller möglicher Lebenswege. Sie erkundet verpasste Chancen und die Frage, was ein lebenswertes Leben ausmacht.",
  ],
  [
    "Die 1%-Methode",
    "James Clear erklärt, wie kleine Gewohnheiten langfristig große Veränderungen bewirken. Der Fokus liegt auf alltagstauglichen Systemen und einer hilfreichen Umgebung.",
  ],
  [
    "Der Wüstenplanet",
    "Auf dem Wüstenplaneten Arrakis gerät Paul Atreides in einen Konflikt um Macht, Ressourcen und Prophezeiungen. Ökologie, Religion und Politik bestimmen das Schicksal dieser Welt.",
  ],
  [
    "Ein wenig Leben",
    "Vier Freunde versuchen, in New York ihren Platz zu finden. Ihre Freundschaft wird von Ehrgeiz, Fürsorge und den lange nachwirkenden Verletzungen der Vergangenheit geprägt.",
  ],
  [
    "Der Fremde",
    "Meursault begegnet den Erwartungen seiner Umgebung mit irritierender Distanz. Albert Camus erzählt von Entfremdung, gesellschaftlichen Urteilen und dem Absurden.",
  ],
  [
    "Normale Menschen",
    "Connell und Marianne wachsen in einer irischen Kleinstadt auf. Ihre Beziehung verändert sich mit dem Wechsel an die Universität und bleibt von Nähe, Missverständnissen und Klassenunterschieden geprägt.",
  ],
  [
    "Der Alchimist",
    "Der junge Hirte Santiago folgt einem Traum und begibt sich auf eine Reise. Die Erzählung kreist um Sehnsucht, Entscheidungen und die Suche nach dem eigenen Weg.",
  ],
  [
    "… trotzdem Ja zum Leben sagen",
    "Viktor Frankl verbindet seine Erfahrungen in nationalsozialistischen Konzentrationslagern mit Überlegungen zur menschlichen Sinnsuche. Im Mittelpunkt steht die Frage nach innerer Haltung unter extremen Bedingungen.",
  ],
  [
    "Die Verwandlung",
    "Gregor Samsa erwacht eines Morgens in einem verwandelten Körper. Seine Familie muss sich mit dieser Veränderung auseinandersetzen; Arbeit, Abhängigkeit und Ausgrenzung treten in ein neues Licht.",
  ],
  [
    "Befreit",
    "Tara Westover erzählt von ihrer Kindheit in einer abgeschotteten Familie und ihrem Weg zur Bildung. Ihre Erinnerungen handeln von Loyalität, Selbstbestimmung und dem Preis eines neuen Lebens.",
  ],
];
export function bookTitle(book: Book, lang: string) {
  return lang === "de"
    ? book.german?.title ||
        germanBooks[Number(book.id.replace("sample-", ""))]?.[0] ||
        "Deutscher Titel nicht verfügbar"
    : book.englishTitle ||
        (book.id.startsWith("sample-")
          ? book.title
          : "English title unavailable");
}
export function bookDescription(book: Book, lang: string) {
  return lang === "de"
    ? book.german?.description ||
        germanBooks[Number(book.id.replace("sample-", ""))]?.[1] ||
        book.description
    : book.description;
}
export function hasGerman(book: Book) {
  return Boolean(
    book.german?.description ||
    (book.id.startsWith("sample-") && germanBooks[Number(book.id.slice(7))]),
  );
}
export function statusLabel(status: Status, lang: string) {
  return lang === "de"
    ? {
        Read: "Abgeschlossen",
        "Currently Reading": "Wird gelesen",
        "Want to Read": "Leseliste",
      }[status]
    : status === "Read"
      ? "Completed"
      : status;
}
export const words: Record<string, string> = {
  Home: "Startseite",
  "My Library": "Bibliothek",
  "Custom Lists": "Sammlungen",
  Analytics: "Statistik",
  Ideas: "Ideen",
  Wishlist: "Leseliste",
  Read: "Abgeschlossen",
  Reading: "Wird gelesen",
  "Currently Reading": "Wird gelesen",
  "Want to Read": "Leseliste",
  "All books": "Alle Bücher",
  "All genres": "Alle Genres",
  "Recently added": "Zuletzt hinzugefügt",
  "Highest rated": "Beste Bewertung",
  "Date read": "Abschlussdatum",
  "Title A–Z": "Titel A–Z",
  "Publication year": "Erscheinungsjahr",
  Fiction: "Belletristik",
  History: "Geschichte",
  Philosophy: "Philosophie",
  Psychology: "Psychologie",
  Creativity: "Kreativität",
  "Science Fiction": "Science-Fiction",
  "Personal Growth": "Persönliche Entwicklung",
  Memoir: "Erinnerungen",
  Biography: "Biografie",
  Classics: "Klassiker",
  "Non-Fiction": "Sachbücher",
  Romance: "Liebesromane",
  Mystery: "Krimi",
  "Log a book": "Buch eintragen",
  "Explore your library": "Bibliothek entdecken",
  "Books read": "Gelesene Bücher",
  "A world on every shelf": "Eine Welt in jedem Regal",
  "Pages turned": "Gelesene Seiten",
  "One page at a time": "Eine Seite nach der anderen",
  "Average rating": "Durchschnittliche Bewertung",
  "Your kind of stories": "Geschichten nach deinem Geschmack",
  Edit: "Bearbeiten",
  "View all": "Alle ansehen",
  "Currently reading": "Gerade am Lesen",
  "IN PROGRESS": "WIRD GELESEN",
  "ONE MORE CHAPTER": "NOCH EIN KAPITEL",
  "YOUR STORIES, COLLECTED": "DEINE GESAMMELTEN GESCHICHTEN",
  "THE BOOKS THAT MAKE YOU": "BÜCHER, DIE DICH PRÄGEN",
  "Open library": "Bibliothek öffnen",
  "Every book has a place. Every reading has a story.":
    "Jedes Buch hat seinen Platz. Jede Lektüre ihre Geschichte.",
  "No books match these filters.": "Keine Bücher passen zu diesen Filtern.",
  "Reset filters": "Filter zurücksetzen",
  "A little space for your next story.": "Platz für deine nächste Geschichte.",
  "YOUR PERSONAL READING SPACE": "DEIN PERSÖNLICHER LESEPLATZ",
  "A LIFE IN BOOKS": "EIN LEBEN MIT BÜCHERN",
  "Made by you": "Von dir zusammengestellt",
  "All lists": "Alle Sammlungen",
  "Create a list": "Sammlung erstellen",
  "A SHELF OF YOUR OWN": "DEIN EIGENES REGAL",
  "A collection, a little more you.":
    "Eine Sammlung ganz nach deinem Geschmack.",
  "Bring your favorite books together.": "Versammle deine Lieblingsbücher.",
  "A little more reading. A little more you.":
    "Mehr lesen. Mehr entdecken. Mehr du.",
  "Saved on this device": "Auf diesem Gerät gespeichert",
  "Session only": "Nur für diese Sitzung",
  "Filter by genre or tag": "Nach Genre oder Schlagwort filtern",
  "Sort books": "Bücher sortieren",
  "Grid view": "Rasteransicht",
  "Diary view": "Lesetagebuch",
  "Main navigation": "Hauptnavigation",
  "Search books and authors": "Bücher und Autoren suchen",
  "Search books, authors...": "Bücher, Autoren suchen …",
  "Close dialog": "Dialog schließen",
  "View book": "Buch ansehen",
  "On your reading list": "Auf deiner Leseliste",
  "Year unknown": "Jahr unbekannt",
  "THE BIGGER PICTURE": "DAS GROSSE GANZE",
  "Your reading insights": "Deine Leseeinblicke",
  "Total books read": "Gelesene Bücher insgesamt",
  "All-time reading journey": "Deine gesamte Lesereise",
  "Total pages read": "Gelesene Seiten insgesamt",
  "Based on known page counts": "Auf Basis bekannter Seitenzahlen",
  "Across rated, finished books": "Für bewertete, abgeschlossene Bücher",
  "How you rate your reads": "So bewertest du deine Bücher",
  "Rating distribution · finished books":
    "Bewertungsverteilung · abgeschlossene Bücher",
  "STAR RATING": "STERNEBEWERTUNG",
  "A year in chapters": "Ein Jahr in Kapiteln",
  "BOOKS FINISHED PER MONTH": "ABGESCHLOSSENE BÜCHER PRO MONAT",
  "Authors on repeat": "Oft gelesene Autoren",
  "The voices you spend time with": "Die Stimmen, die dich begleiten",
  "Your literary landscape": "Deine literarische Landschaft",
  "Top genres & tags · finished books":
    "Häufigste Genres · abgeschlossene Bücher",
  "Log a finished book to start seeing your patterns.":
    "Trage ein abgeschlossenes Buch ein, um deine Lesegewohnheiten zu entdecken.",
  "List title": "Name der Sammlung",
  Description: "Beschreibung",
  "Your books. Your order.": "Deine Bücher. Deine Reihenfolge.",
  "CURATED BY YOU": "VON DIR ZUSAMMENGESTELLT",
  "Save collection": "Sammlung speichern",
  "Add from your library": "Aus deiner Bibliothek hinzufügen",
  "RANK YOUR BOOKS": "ORDNE DEINE BÜCHER",
  "Use the arrows to reorder · assign a tier":
    "Mit den Pfeilen sortieren · Stufe zuweisen",
  "No tier": "Keine Stufe",
  "Ranked list": "Rangliste",
  "Tier board": "Stufenübersicht",
  "Edit & rank": "Bearbeiten & ordnen",
  "Delete list": "Sammlung löschen",
  Unassigned: "Nicht zugeordnet",
  "YOUR VERY OWN CANON": "DEIN PERSÖNLICHER KANON",
  "Rank your favorites. Curate a feeling. Make a shelf your own.":
    "Ordne deine Favoriten. Sammle eine Stimmung. Gestalte dein Regal.",
  "Your first collection starts here.": "Hier beginnt deine erste Sammlung.",
  "Create a list and add books from your library.":
    "Erstelle eine Sammlung und füge Bücher aus deiner Bibliothek hinzu.",
};
export function tr(text: string, lang: string) {
  return lang === "de" ? words[text] || text : text;
}

Object.assign(words, {
  "A home for the books you love, the thoughts they leave,":
    "Ein Zuhause für geliebte Bücher, bleibende Gedanken",
  "and the stories still waiting to be discovered.":
    "und Geschichten, die noch entdeckt werden wollen.",
  "A reader lives a thousand lives": "Ein Leser lebt tausend Leben,",
  "before he dies.": "bevor er stirbt.",
  "Your reading,": "Dein Lesen,",
  "between the lines.": "zwischen den Zeilen.",
  "A closer look at the stories that shape your world.":
    "Ein näherer Blick auf die Geschichten, die deine Welt prägen.",
  Custom: "Deine",
  "collections.": "Sammlungen.",
  "Find a book in your library…": "Ein Buch in deiner Bibliothek suchen …",
  "The books I keep coming back to": "Bücher, zu denen ich immer zurückkehre",
  "What brings these books together?": "Was verbindet diese Bücher?",
  "Reading goal": "Leseziel",
  "A year of good books.": "Ein Jahr voller guter Bücher.",
  "Books to read": "Geplante Bücher",
  "Save goal": "Leseziel speichern",
  "Contains spoilers · Reveal review": "Enthält Spoiler · Rezension anzeigen",
  "Not dated": "Ohne Datum",
  "Edit this list to add your first book.":
    "Bearbeite diese Sammlung, um dein erstes Buch hinzuzufügen.",
});

words["Monthly reading volume"] = "Monatliche Lesemenge";
