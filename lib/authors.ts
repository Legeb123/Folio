export type AuthorReference = {
  name: string;
  biography: string;
  portrait?: string;
  source: string;
  imageSource?: string;
};
export const featuredAuthors = [
  "Sally Rooney",
  "George Orwell",
  "Virginia Woolf",
  "Jane Austen",
  "Franz Kafka",
  "Haruki Murakami",
];
export const authorKey = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
type Influence = {
  title: string;
  author: string;
  kind: "influence" | "recommendation";
  en: string;
  de: string;
  source: string;
};
const orwell =
  "https://www.orwellfoundation.com/the-orwell-foundation/orwell/articles/gordon-bowker-orwells-library/";
const rooney =
  "https://www.britishcouncil.org/voices-magazine/novelist-sally-rooney-contemporary-irish-writing";
export const influences: Record<string, Influence[]> = {
  georgeorwell: [
    {
      title: "Ashenden",
      author: "W. Somerset Maugham",
      kind: "influence",
      en: "Biographer Gordon Bowker identifies this as a model for Orwell’s clear prose.",
      de: "Der Biograf Gordon Bowker nennt dieses Werk als Vorbild für Orwells klare Prosa.",
      source: orwell,
    },
    {
      title: "A Modest Proposal",
      author: "Jonathan Swift",
      kind: "influence",
      en: "Bowker describes Swift’s essay as another model for Orwell’s prose style.",
      de: "Bowker beschreibt Swifts Essay als weiteres Vorbild für Orwells Schreibstil.",
      source: orwell,
    },
  ],
  sallyrooney: [
    {
      title: "The Glorious Heresies",
      author: "Lisa McInerney",
      kind: "recommendation",
      en: "Recommended by Rooney in her 2017 British Council interview.",
      de: "Von Rooney 2017 in ihrem Interview mit dem British Council empfohlen.",
      source: rooney,
    },
    {
      title: "Young Skins",
      author: "Colin Barrett",
      kind: "recommendation",
      en: "A short-story collection Rooney recommends in the same interview.",
      de: "Eine Kurzgeschichtensammlung, die Rooney im selben Interview empfiehlt.",
      source: rooney,
    },
  ],
};
