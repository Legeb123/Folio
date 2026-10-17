import type { Book } from "./data";
import { authorKey } from "./authors";
export type CatalogAuthor = {
  name: string;
  id?: string;
  birth?: string;
  death?: string;
  topWork?: string;
  count?: number;
  themes?: string[];
};
export const literaryAuthors: CatalogAuthor[] = [
  ["William Shakespeare", "Classics,Drama,Poetry"],
  ["Jane Austen", "Classics,Fiction,Romance"],
  ["Leo Tolstoy", "Classics,Fiction,History"],
  ["Fyodor Dostoevsky", "Classics,Philosophy,Fiction"],
  ["Virginia Woolf", "Classics,Fiction"],
  ["Franz Kafka", "Classics,Philosophy,Fiction"],
  ["George Orwell", "Classics,Politics,Fiction"],
  ["Toni Morrison", "Fiction,History"],
  ["Gabriel García Márquez", "Fiction,Fantasy"],
  ["Jorge Luis Borges", "Fiction,Philosophy,Fantasy"],
  ["James Joyce", "Classics,Fiction"],
  ["Charles Dickens", "Classics,Fiction,History"],
  ["Mary Shelley", "Classics,Sci-Fi"],
  ["Chinua Achebe", "Fiction,History"],
  ["Ursula K. Le Guin", "Sci-Fi,Fantasy,Philosophy"],
  ["Homer", "Classics,Poetry"],
  ["Dante Alighieri", "Classics,Poetry,Philosophy"],
  ["Miguel de Cervantes", "Classics,Fiction"],
  ["Johann Wolfgang von Goethe", "Classics,Poetry,Philosophy"],
  ["Murasaki Shikibu", "Classics,Fiction"],
  ["Rabindranath Tagore", "Poetry,Philosophy"],
  ["Albert Camus", "Philosophy,Classics,Fiction"],
  ["James Baldwin", "Fiction,History"],
  ["Simone de Beauvoir", "Philosophy,Non-Fiction"],
  ["Octavia E. Butler", "Sci-Fi,Fantasy"],
  ["Marcel Proust", "Classics,Fiction"],
  ["Emily Dickinson", "Poetry,Classics"],
  ["Naguib Mahfouz", "Fiction,History"],
  ["Lu Xun", "Fiction,History"],
  ["Hermann Hesse", "Classics,Philosophy,Fiction"],
  ["Agatha Christie", "Mystery,Crime,Fiction"],
  ["J. K. Rowling", "Fantasy,Fiction"],
  ["Danielle Steel", "Romance,Fiction"],
  ["Stephen King", "Horror,Thriller,Fantasy,Fiction"],
  ["J. R. R. Tolkien", "Fantasy,Classics"],
  ["George R. R. Martin", "Fantasy,Fiction"],
  ["Ernest Hemingway", "Classics,Fiction"],
  ["Arthur Conan Doyle", "Mystery,Crime,Classics"],
  ["Aldous Huxley", "Sci-Fi,Philosophy,Classics"],
  ["Isaac Asimov", "Sci-Fi,Non-Fiction"],
  ["Frank Herbert", "Sci-Fi,Philosophy"],
  ["H. G. Wells", "Sci-Fi,Classics"],
  ["Alexandre Dumas", "Classics,Adventure,History"],
  ["Victor Hugo", "Classics,Fiction,Poetry,History"],
  ["Umberto Eco", "History,Mystery,Philosophy"],
  ["Mark Twain", "Classics,Adventure,Fiction"],
  ["Astrid Lindgren", "Children,Adventure,Fantasy"],
  ["Virgil", "Classics,Poetry"],
  ["Ovid", "Classics,Poetry,Mythology"],
  ["Geoffrey Chaucer", "Classics,Poetry"],
  ["Voltaire", "Classics,Philosophy,Fiction"],
  ["Walt Whitman", "Poetry,Classics"],
  ["Herman Melville", "Classics,Adventure,Fiction"],
  ["Friedrich Schiller", "Classics,Drama,Poetry,History"],
  ["Thomas Mann", "Classics,Fiction,Philosophy"],
  ["Charlotte Brontë", "Classics,Fiction,Romance"],
  ["Emily Brontë", "Classics,Fiction,Romance"],
  ["George Eliot", "Classics,Fiction"],
  ["Oscar Wilde", "Classics,Drama,Fiction"],
  ["Edgar Allan Poe", "Classics,Horror,Mystery,Poetry"],
  ["Jules Verne", "Sci-Fi,Adventure,Classics"],
  ["Ray Bradbury", "Sci-Fi,Fantasy,Classics"],
  ["Philip K. Dick", "Sci-Fi,Philosophy"],
  ["Arthur C. Clarke", "Sci-Fi,Non-Fiction"],
  ["Terry Pratchett", "Fantasy,Fiction"],
  ["C. S. Lewis", "Fantasy,Philosophy,Classics"],
  ["Haruki Murakami", "Fiction,Fantasy"],
  ["Isabel Allende", "Fiction,History,Fantasy"],
  ["Margaret Atwood", "Fiction,Sci-Fi,Poetry"],
  ["Alice Walker", "Fiction,Poetry,History"],
  ["Maya Angelou", "Poetry,Memoir,Non-Fiction"],
  ["Sylvia Plath", "Poetry,Classics,Fiction"],
  ["Rainer Maria Rilke", "Poetry,Classics"],
  ["Bertolt Brecht", "Drama,Poetry,Politics"],
  ["Günter Grass", "Fiction,History"],
  ["Stefan Zweig", "Classics,Fiction,History"],
  ["Anton Chekhov", "Classics,Drama,Fiction"],
  ["Alexander Pushkin", "Classics,Poetry,Fiction"],
  ["Nikolai Gogol", "Classics,Fiction"],
  ["Mikhail Bulgakov", "Classics,Fantasy,Fiction"],
].map(([name, themes]) => ({ name, themes: themes.split(",") }));
export function rotateAuthors(previous: string[] = []): CatalogAuthor[] {
  const shuffled = [...literaryAuthors];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const fresh = shuffled.filter((a) => !previous.includes(a.name));
  return [...fresh, ...shuffled.filter((a) => previous.includes(a.name))].slice(
    0,
    8,
  );
}
export function authorRecommendations(books: Book[], genres: string[]) {
  const read = books.filter((b) => b.status === "Read");
  const familiar = Array.from(
    new Map(
      read.map((b) => [
        authorKey(b.author),
        { name: b.author, themes: b.tags },
      ]),
    ).values(),
  );
  const weights = new Map<string, number>();
  for (const g of genres) weights.set(g.toLowerCase(), 2);
  for (const b of read)
    for (const tag of b.tags)
      weights.set(tag.toLowerCase(), (weights.get(tag.toLowerCase()) || 0) + 1);
  const similar = literaryAuthors
    .filter(
      (a) => !familiar.some((f) => authorKey(f.name) === authorKey(a.name)),
    )
    .map((a) => ({
      ...a,
      matches: (a.themes || []).filter((t) => weights.has(t.toLowerCase())),
    }))
    .filter((a) => a.matches.length)
    .sort(
      (a, b) =>
        b.matches.reduce((n, t) => n + (weights.get(t.toLowerCase()) || 0), 0) -
        a.matches.reduce((n, t) => n + (weights.get(t.toLowerCase()) || 0), 0),
    )
    .slice(0, 8);
  return { familiar, similar };
}
