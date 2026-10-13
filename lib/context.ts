import type { Book } from "./data";
export function curatedContext(
  book: Pick<Book, "id" | "title" | "author">,
  lang: string,
) {
  const de = lang === "de";
  if (
    book.id === "sample-0" ||
    (book.title.startsWith("The Creative Act") && book.author === "Rick Rubin")
  )
    return {
      period: de
        ? "Von der kreativen Praxis zum Buch"
        : "From creative practice to a book",
      text: de
        ? "Rubin beschreibt, wie sich sein ursprünglicher Plan für ein Buch über das Schaffen großer Kunst während der Arbeit veränderte: Es wurde ein Buch über eine Art zu leben. Die Verlagsvorstellung führt es auf seine langjährige Beschäftigung mit den Bedingungen kreativer Arbeit zurück."
        : "Rubin describes his original plan for a book about making great art changing during the writing process into a book about a way of living. The publisher traces it to his sustained exploration of the conditions that allow creative work to happen.",
      message: de
        ? "Kreativität ist eine Beziehung zur Welt, nicht nur ein fertiges Werk. Aufmerksamkeit und Offenheit lassen sich im Alltag pflegen; schöpferisches Handeln steht allen offen."
        : "Creativity is a relationship with the world, not just a finished product. Attention and openness can be cultivated in everyday life; creative practice is available to everyone.",
      url: "https://sites.prh.com/thecreativeact",
      source: "Penguin Random House · The Creative Act",
    };
  if (
    book.id === "sample-1" ||
    (book.title === "The Secret History" && book.author === "Donna Tartt")
  )
    return {
      period: de
        ? "Ein Roman entsteht am Bennington College"
        : "A novel begun at Bennington College",
      text: de
        ? "Tartt begann den Roman am Bennington College und beschrieb 1992 im Gespräch mit Jill Eisenstadt acht Jahre Arbeit daran. Sie schrieb Teile außerhalb der zeitlichen Reihenfolge und vereinfachte später die Erzählstruktur. Ein erklärtes gestalterisches Ziel war es, ältere literarische Formen auf Figuren und Schauplätze der Gegenwart anzuwenden."
        : "Tartt began the novel at Bennington College and described eight years of work in her 1992 conversation with Jill Eisenstadt. She wrote sections out of sequence and later simplified the structure. One stated artistic aim was to apply older literary forms and conventions to contemporary characters and settings.",
      message: de
        ? "Eine mögliche Lesart: Die Sehnsucht nach Zugehörigkeit und Schönheit kann das moralische Urteil verdrängen. Der Roman lädt dazu ein, Selbstrechtfertigung und die Macht einer abgeschlossenen Gruppe kritisch zu betrachten."
        : "One reading: the desire for belonging and beauty can displace moral judgment. The novel invites scrutiny of self-justification and the influence of an insular group.",
      url: "https://bombmagazine.org/articles/1992/10/01/donna-tarttdonna-tarttjill-eisenstadt/",
      source:
        "BOMB · Donna Tartt in conversation with Jill Eisenstadt (source contains spoilers)",
    };
  if (
    book.id === "sample-8" ||
    (book.title === "Dune" && book.author === "Frank Herbert")
  )
    return {
      message: de
        ? "Eine mögliche Lesart: Ökologie und politische Macht hängen eng zusammen. Eingriffe in eine Umwelt verändern auch die Gesellschaft, die von ihr lebt."
        : "One reading: ecology and political power are interdependent. Changing an environment also changes the society that depends on it.",
      period: de
        ? "Umweltdebatten des 20. Jahrhunderts"
        : "Twentieth-century environmental debate",
      text: de
        ? "Herberts Recherchen über die Stabilisierung der Dünen in Oregon waren ein Ausgangspunkt für Dune. Der Roman verknüpft ökologische Veränderungen mit politischen Machtverhältnissen. Die Forschung ordnet diese Entstehung in die Nachkriegsdebatten über die technische Kontrolle und Nutzbarmachung von Landschaften ein."
        : "Herbert’s research into Oregon dune stabilization helped shape Dune. The novel links ecological change with political power. Scholarship places its development within postwar debates about engineering and reclaiming landscapes.",
      url: "https://academic.oup.com/isle/article-abstract/30/3/637/6184617",
      source:
        "Oxford Academic · Frank Herbert’s Ecology, Oregon’s Dunes, and the Postwar Science of Desert Reclamation",
    };
  if (
    book.id === "sample-3" ||
    (book.author === "Marcus Aurelius" && book.title === "Meditations")
  )
    return {
      message: de
        ? "Zentrale Gedanken: die eigenen Urteile prüfen, verantwortungsvoll handeln, Vergänglichkeit akzeptieren und zum Gemeinwohl beitragen. Stoische Übung richtet den Blick auf die eigene Haltung."
        : "Central ideas: examine your judgments, act responsibly, accept impermanence, and contribute to the common good. Stoic practice focuses on your own attitude and conduct.",
      period: de
        ? "Römisches Kaiserreich, 2. Jahrhundert"
        : "Roman Empire, second century",
      text: de
        ? "Marc Aurel schrieb auf Griechisch für sich selbst, nicht für die Veröffentlichung. Teile der Aufzeichnungen entstanden wahrscheinlich während seiner Feldzüge in den frühen 170er-Jahren. Seine Regierungszeit war von Kriegen, Seuchen und persönlichen Verlusten geprägt. Der Text lässt sich als private Übung stoischer Selbstprüfung lesen; nicht jede einzelne Reflexion kann einem bestimmten Ereignis zugeordnet werden."
        : "Marcus Aurelius wrote in Greek for himself rather than for publication. Some entries probably date from campaigns in the early 170s. War, plague, and personal loss marked his reign. These are exercises in Stoic self-examination; individual reflections cannot all be tied to a specific event.",
      url: "https://www.penguinrandomhouseretail.com/book/?isbn=9780593800003",
      source: "Penguin Random House · The Illustrated Meditations",
    };
  if (
    book.id === "sample-14" ||
    (book.title === "The Metamorphosis" && book.author === "Franz Kafka")
  )
    return {
      message: de
        ? "Eine mögliche Lesart: Das Werk hinterfragt einen menschlichen Wert, der allein an Leistung und Nützlichkeit gemessen wird. Entfremdung, familiäre Pflichten und bedingte Zuneigung stehen im Mittelpunkt. Das ist eine Interpretation, keine gesicherte Absichtserklärung Kafkas."
        : "One reading: the work questions human worth measured only by productivity and usefulness. Alienation, family obligations, and conditional affection are central concerns. This is an interpretation, not a documented statement of Kafka’s intent.",
      period: de
        ? "Prag vor dem Ersten Weltkrieg"
        : "Prague before the First World War",
      text: de
        ? "Kafka verfasste Die Verwandlung 1912; veröffentlicht wurde sie 1915. Damit liegt die Entstehung vor dem Ersten Weltkrieg, obwohl die Veröffentlichung in die Kriegszeit fällt. Die Chronologie des Kafka-Museums hilft, Werk, Berufsleben und persönliche Beziehungen zeitlich einzuordnen. Eine eindeutige persönliche Schreibmotivation lässt sich aus dieser Chronologie nicht belegen."
        : "Kafka wrote The Metamorphosis in 1912; it appeared in 1915. Its composition predates the First World War even though publication came during the war. The Kafka Museum’s timeline situates his writing alongside work and personal relationships. This chronology does not establish a single personal motivation for writing the work.",
      url: "https://kafkamuseum.cz/en/timeline",
      source: "Franz Kafka Museum · Biography",
    };
  return null;
}
