import type { Book } from "./data";
export function curatedContext(book: Book, lang: string) {
  const de = lang === "de";
  if (
    book.id === "sample-8" ||
    (book.title === "Dune" && book.author === "Frank Herbert")
  )
    return {
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
      period: de
        ? "Prag vor dem Ersten Weltkrieg"
        : "Prague before the First World War",
      text: de
        ? "Kafka verfasste Die Verwandlung 1912; veröffentlicht wurde sie 1915. Damit liegt die Entstehung vor dem Ersten Weltkrieg, obwohl die Veröffentlichung in die Kriegszeit fällt. Die Chronologie des Kafka-Museums hilft, Werk, Berufsleben und persönliche Beziehungen zeitlich einzuordnen. Daraus allein folgt keine gesicherte Erklärung für die Verwandlung Gregor Samsas."
        : "Kafka wrote The Metamorphosis in 1912; it appeared in 1915. Its composition predates the First World War even though publication came during the war. The Kafka Museum’s timeline situates his writing alongside work and personal relationships. Those dates alone do not establish a single cause for Gregor Samsa’s transformation.",
      url: "https://kafkamuseum.cz/en/timeline",
      source: "Franz Kafka Museum · Biography",
    };
  return null;
}
