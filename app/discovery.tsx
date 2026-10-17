"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  Compass,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Book } from "@/lib/data";
import { germanFromSearch, type GermanSearchMetadata } from "@/lib/openlibrary";
import { usePreferences } from "@/lib/preferences";
import { bookTitle, tr, statusLabel } from "@/lib/i18n";
import { Cover } from "./components";

type Idea = {
  book: Book;
  kind: "author" | "genre" | "queue";
  reason: string;
  rank: number;
};
export function Ideas({
  books,
  onOpen,
  onAdd,
}: {
  books: Book[];
  onOpen: (b: Book) => void;
  onAdd: (b: Book) => void;
}) {
  const { prefs, t } = usePreferences();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const activeGenre =
    selectedGenre && prefs.genres.includes(selectedGenre)
      ? selectedGenre
      : null;
  const profile = useMemo(
    () => ({
      genres: activeGenre ? [activeGenre] : [...new Set(prefs.genres)],
    }),
    [prefs.genres, activeGenre],
  );
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setFailed(false);
    setIdeas([]);
    const historyKey = `folio-ideas:${prefs.language}:${[...profile.genres].sort().join("|")}`;
    let previous: string[] = [];
    try {
      previous = JSON.parse(sessionStorage.getItem(historyKey) || "[]");
    } catch {}
    if (!Array.isArray(previous)) previous = [];
    const queries = profile.genres.map((g) => ({
      q: `subject:"${g === "Sci-Fi" ? "Science Fiction" : g}"`,
      kind: "genre" as const,
      reason: g,
    }));
    Promise.allSettled(
      queries.map(async (q) => {
        const r = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q.q)}&limit=60&lang=${prefs.language}&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median,subject,editions,editions.key,editions.title,editions.language`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(10000),
            ]),
          },
        );
        if (!r.ok) throw Error();
        const d = await r.json();
        return (d.docs || []).map(
          (doc: {
            key: string;
            title: string;
            author_name?: string[];
            first_publish_year?: number;
            cover_i?: number;
            number_of_pages_median?: number;
            editions?: GermanSearchMetadata["editions"];
            subject?: string[];
          }) =>
            ({
              book: {
                id: doc.key,
                title: doc.title,
                author: doc.author_name?.[0] || "Unknown author",
                year: doc.first_publish_year || 0,
                cover: doc.cover_i
                  ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
                  : "",
                pages: doc.number_of_pages_median || 0,
                status: "Want to Read",
                rating: 0,
                date: "",
                tags:
                  q.kind === "genre"
                    ? [q.reason]
                    : (doc.subject || []).slice(0, 3),
                review: "",
                spoiler: false,
                description: "",
                progress: 0,
                ...germanFromSearch(doc),
              } as Book,
              kind: q.kind,
              reason: q.reason,
              rank: 0,
            }) as Idea,
        );
      }),
    ).then((results) => {
      if (controller.signal.aborted) return;
      setFailed(results.some((r) => r.status === "rejected"));
      const seen = new Set<string>();
      const found = results
        .flatMap((r) => {
          if (r.status !== "fulfilled") return [];
          const pool: Idea[] = [...r.value];
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
          }
          pool.sort(
            (a, b) =>
              Number(previous.includes(a.book.id)) -
              Number(previous.includes(b.book.id)),
          );
          return pool.map((item, index) => ({ ...item, rank: -index }));
        })
        .filter((item) => {
          const key = `${item.book.title.toLowerCase()}|${item.book.author.toLowerCase()}`;
          if (
            seen.has(item.book.id) ||
            seen.has(key) ||
            books.some(
              (b) =>
                b.id === item.book.id ||
                (b.author.toLowerCase() === item.book.author.toLowerCase() &&
                  [b.title, bookTitle(b, "de")].some(
                    (s) => s.toLowerCase() === item.book.title.toLowerCase(),
                  )),
            )
          )
            return false;
          seen.add(item.book.id);
          seen.add(key);
          return true;
        })
        .sort(
          (a, b) =>
            Number(previous.includes(a.book.id)) -
              Number(previous.includes(b.book.id)) || b.rank - a.rank,
        )
        .slice(0, 16);
      if (found.length) {
        try {
          sessionStorage.setItem(
            historyKey,
            JSON.stringify(found.map((item) => item.book.id)),
          );
        } catch {}
      }
      setIdeas(found);
      setBusy(false);
    });
    return () => controller.abort();
  }, [profile, books, prefs.language, retry]);
  const display = ideas;
  return (
    <section className="page-section ideas-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t("FOLLOW YOUR CURIOSITY", "FOLGE DEINER NEUGIER")}
          </span>
          <h1>
            {t("A few ideas for", "Ein paar Ideen für")}
            <br />
            <em>{t("your next chapter.", "dein nächstes Kapitel.")}</em>
          </h1>
          <p className="page-description">
            {t(
              "Fresh reading suggestions based only on your selected genre interests.",
              "Neue Leseideen passend zu deinen ausgewählten Genre-Interessen.",
            )}
          </p>
        </div>
        <Compass className="ideas-compass" size={70} />
      </div>
      <div className="taste-profile">
        <span>{t("Show", "Anzeigen")}</span>
        <div
          className="ideas-genre-filters"
          role="group"
          aria-label={t("Filter ideas by genre", "Ideen nach Genre filtern")}
        >
          <button
            type="button"
            aria-pressed={activeGenre === null}
            onClick={() => setSelectedGenre(null)}
          >
            {t("All interests", "Alle Interessen")}
          </button>
          {prefs.genres.map((g) => (
            <button
              type="button"
              key={g}
              aria-pressed={activeGenre === g}
              onClick={() => setSelectedGenre(g)}
            >
              {tr(g, prefs.language)}
            </button>
          ))}
        </div>
        <button
          className="text-button"
          onClick={() => setRetry((n) => n + 1)}
          disabled={busy || !profile.genres.length}
        >
          <RefreshCw size={13} />
          {t("Refresh", "Aktualisieren")}
        </button>
      </div>
      {busy && (
        <div className="empty-state" role="status">
          <LoaderCircle className="spin" />
          {t("Finding your next read…", "Deine nächste Lektüre wird gesucht …")}
        </div>
      )}
      {failed && (
        <p className="metadata-notice">
          {t(
            "Some recommendations could not be loaded. Please refresh to try again.",
            "Einige Empfehlungen konnten nicht geladen werden. Bitte aktualisiere, um es erneut zu versuchen.",
          )}
        </p>
      )}
      {!busy && display.length === 0 && (
        <div className="empty-state">
          <BookEmpty />
          <p>
            {t(
              "No new matches yet. Choose your genre interests in Settings, or refresh for more ideas.",
              "Noch keine neuen Treffer. Wähle deine Genre-Interessen in den Einstellungen oder aktualisiere für neue Ideen.",
            )}
          </p>
        </div>
      )}
      <div className="ideas-grid">
        {display.map(({ book, kind, reason }) => (
          <article className="idea-card" key={book.id}>
            <button className="idea-open" onClick={() => onOpen(book)}>
              <Cover book={book} />
              <h3>{bookTitle(book, prefs.language)}</h3>
              <p>{book.author}</p>
            </button>
            <div className="idea-reason">
              {kind === "author"
                ? t(`More by ${reason}`, `Weitere Bücher von ${reason}`)
                : kind === "genre"
                  ? t(
                      `Because you like ${reason}`,
                      `Weil du ${tr(reason, prefs.language)} magst`,
                    )
                  : t(
                      "From your saved reading queue",
                      "Aus deiner gespeicherten Leseliste",
                    )}
            </div>
            {kind === "queue" ? (
              <button className="button secondary" onClick={() => onOpen(book)}>
                <Check size={14} />
                {t("In your wishlist", "Auf deiner Leseliste")}
              </button>
            ) : (
              <button className="button secondary" onClick={() => onAdd(book)}>
                <BookmarkPlus size={14} />
                {t("Want to Read", "Auf die Leseliste")}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
function BookEmpty() {
  return <Compass size={28} />;
}
export function Wishlist({
  books,
  onOpen,
  onStatus,
}: {
  books: Book[];
  onOpen: (b: Book) => void;
  onStatus: (b: Book, status: Book["status"]) => void;
}) {
  const { prefs, t } = usePreferences();
  const queue = books.filter((b) => b.status === "Want to Read");
  return (
    <section className="page-section wishlist-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t(
              "THE STORIES STILL TO COME",
              "GESCHICHTEN, DIE NOCH AUF DICH WARTEN",
            )}
          </span>
          <h1>
            {t("Your reading", "Deine nächste")}{" "}
            <em>{t("queue.", "Lektüre.")}</em>
          </h1>
          <p className="page-description">
            {queue.length}{" "}
            {t(
              "books waiting for their moment. Start one whenever you’re ready.",
              "Bücher warten auf ihren Moment. Beginne, wann immer du möchtest.",
            )}
          </p>
        </div>
        <BookmarkPlus size={55} className="ideas-compass" />
      </div>
      {queue.length ? (
        <div className="queue-list">
          {queue.map((b) => (
            <article key={b.id}>
              <button className="queue-book" onClick={() => onOpen(b)}>
                <Cover book={b} />
                <span>
                  <strong>{bookTitle(b, prefs.language)}</strong>
                  <small>{b.author}</small>
                  <span>
                    {b.tags.map((g) => tr(g, prefs.language)).join(" · ")}
                  </span>
                </span>
              </button>
              <div>
                <button className="text-button" onClick={() => onOpen(b)}>
                  {t(
                    b.goalDays
                      ? `Goal: ${b.goalDays} days`
                      : "Set reading goal",
                    b.goalDays ? `Ziel: ${b.goalDays} Tage` : "Leseziel setzen",
                  )}
                </button>
                <button
                  className="button primary"
                  onClick={() => onStatus(b, "Currently Reading")}
                >
                  {t("Start reading", "Lesen beginnen")}
                  <ArrowRight size={14} />
                </button>
                <select
                  aria-label={t(
                    `Status for ${bookTitle(b, prefs.language)}`,
                    `Status für ${bookTitle(b, prefs.language)}`,
                  )}
                  value={b.status}
                  onChange={(e) =>
                    onStatus(b, e.target.value as Book["status"])
                  }
                >
                  {(["Want to Read", "Currently Reading", "Read"] as const).map(
                    (s) => (
                      <option value={s} key={s}>
                        {statusLabel(s, prefs.language)}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <BookmarkPlus />
          <h3>
            {t("Room for a new story.", "Platz für eine neue Geschichte.")}
          </h3>
          <p>
            {t(
              "Add books from Search or Ideas with the Want to Read status.",
              "Füge Bücher über die Suche oder Ideen mit dem Status Leseliste hinzu.",
            )}
          </p>
        </div>
      )}
    </section>
  );
}
