import { authorKey } from "./authors";
// Editorial priorities, not an objective measurement of literary influence.
// Exact title aliases deliberately avoid promoting adaptations or collections.
const signatureWorks: Record<string, string[][]> = {
  georgeorwell: [
    ["1984", "Nineteen Eighty-Four"],
    ["Animal Farm"],
    ["Homage to Catalonia"],
    ["Down and Out in Paris and London"],
    ["The Road to Wigan Pier"],
    ["Burmese Days"],
  ],
  janeausten: [
    ["Pride and Prejudice"],
    ["Sense and Sensibility"],
    ["Emma"],
    ["Persuasion"],
    ["Mansfield Park"],
    ["Northanger Abbey"],
  ],
  williamshakespeare: [
    ["Hamlet"],
    ["Romeo and Juliet"],
    ["Macbeth"],
    ["King Lear"],
    ["Othello"],
    ["A Midsummer Night’s Dream"],
    ["The Tempest"],
  ],
  fyodordostoevsky: [
    ["Crime and Punishment"],
    ["The Brothers Karamazov"],
    ["Notes from Underground"],
    ["The Idiot"],
    ["Demons", "The Possessed"],
  ],
  leotolstoy: [
    ["War and Peace"],
    ["Anna Karenina"],
    ["The Death of Ivan Ilyich"],
    ["Resurrection"],
  ],
  franzkafka: [
    ["The Metamorphosis", "Metamorphosis", "Die Verwandlung"],
    ["The Trial", "Der Prozess", "Der Proceß"],
    ["The Castle", "Das Schloss"],
    ["Amerika", "The Man Who Disappeared"],
  ],

  tonimorrison: [
    ["Beloved"],
    ["The Bluest Eye"],
    ["Song of Solomon"],
    ["Sula"],
  ],
  gabrielgarciamarquez: [
    ["One Hundred Years of Solitude", "Cien años de soledad"],
    ["Love in the Time of Cholera"],
    ["Chronicle of a Death Foretold"],
  ],
  jamesjoyce: [
    ["Ulysses"],
    ["Dubliners"],
    ["A Portrait of the Artist as a Young Man"],
    ["Finnegans Wake"],
  ],
  charlesdickens: [
    ["A Christmas Carol"],
    ["Great Expectations"],
    ["A Tale of Two Cities"],
    ["Oliver Twist"],
    ["David Copperfield"],
    ["Bleak House"],
  ],
  maryshelley: [
    ["Frankenstein", "Frankenstein; or, The Modern Prometheus"],
    ["The Last Man"],
  ],
  jrrtolkien: [
    ["The Lord of the Rings"],
    ["The Hobbit"],
    ["The Fellowship of the Ring"],
    ["The Two Towers"],
    ["The Return of the King"],
    ["The Silmarillion"],
  ],
  albertcamus: [
    ["The Stranger", "The Outsider", "L’Étranger"],
    ["The Plague", "La Peste"],
    ["The Myth of Sisyphus"],
    ["The Fall"],
  ],
  hermannhesse: [
    ["Siddhartha"],
    ["Steppenwolf"],
    ["Demian"],
    ["The Glass Bead Game"],
  ],
  harukimurakami: [
    ["Norwegian Wood"],
    ["Kafka on the Shore"],
    ["The Wind-Up Bird Chronicle"],
    ["1Q84"],
  ],
  ursulakleguin: [
    ["The Left Hand of Darkness"],
    ["The Dispossessed"],
    ["A Wizard of Earthsea"],
  ],
  octaviaebutler: [
    ["Kindred"],
    ["Parable of the Sower"],
    ["Dawn"],
    ["Parable of the Talents"],
  ],
};
signatureWorks.virginiawoolf = [
  ["Mrs Dalloway", "Mrs. Dalloway"],
  ["To the Lighthouse"],
  ["A Room of One’s Own"],
  ["Orlando"],
  ["The Waves"],
];
export type RankedWork = Record<string, unknown> & {
  key?: unknown;
  title?: unknown;
  readinglog_count?: unknown;
  osp_count?: unknown;
  edition_count?: unknown;
};
const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : 0;
export function rankAuthorWorks(works: RankedWork[], author: string) {
  const titles = signatureWorks[authorKey(author)] || [];
  const position = (w: RankedWork) => {
    const i = titles.findIndex((aliases) =>
      aliases.some((t) => authorKey(t) === authorKey(String(w.title))),
    );
    return i < 0 ? Infinity : i;
  };
  const ranked = [...works].sort((a, b) => {
    const ap = position(a),
      bp = position(b);
    if (ap !== bp) return ap - bp;
    const score = (w: RankedWork) =>
      Math.log1p(count(w.readinglog_count)) * 4 +
      Math.log1p(count(w.osp_count)) * 2 +
      Math.log1p(count(w.edition_count));
    return (
      score(b) - score(a) ||
      count(b.readinglog_count) - count(a.readinglog_count) ||
      String(a.title).localeCompare(String(b.title), "en") ||
      String(a.key).localeCompare(String(b.key), "en")
    );
  });
  const seen = new Set<string>();
  return ranked.filter((work) => {
    const p = position(work);
    const key = Number.isFinite(p)
      ? "signature-" + p
      : authorKey(String(work.title));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export const AUTHOR_RANKING_WINDOW = 240;
