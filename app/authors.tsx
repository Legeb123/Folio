"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Search,
  Feather,
  RefreshCw,
} from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import {
  authorKey,
  featuredAuthors,
  influences,
  type AuthorReference,
} from "@/lib/authors";
import type { Book } from "@/lib/data";
import { BookCard } from "./components";
function Portrait({
  author,
  reference,
}: {
  author: string;
  reference?: AuthorReference;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [reference?.portrait]);
  return (
    <div className="author-portrait">
      {reference?.portrait && !failed ? (
        <img
          src={reference.portrait}
          alt={author}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={author}>
          {author
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </span>
      )}
    </div>
  );
}
export function Authors({
  books,
  onOpen,
}: {
  books: Book[];
  onOpen: (book: Book) => void;
}) {
  const { t, prefs } = usePreferences();
  const [query, setQuery] = useState("");
  const [onlyLibrary, setOnlyLibrary] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [references, setReferences] = useState<Record<string, AuthorReference>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const authors = useMemo(
    () =>
      Array.from(
        new Map(
          [...featuredAuthors, ...books.map((b) => b.author)]
            .filter((n) => n.trim())
            .map((n) => [authorKey(n), n]),
        ).values(),
      ),
    [books],
  );
  const matchingBooks = (name: string) =>
    books.filter((b) => authorKey(b.author) === authorKey(name));
  const visible = authors.filter(
    (n) =>
      authorKey(n).includes(authorKey(query)) &&
      (!onlyLibrary || matchingBooks(n).length),
  );
  const signature = JSON.stringify(authors);
  useEffect(() => {
    const controller = new AbortController();
    setReferences({});
    setLoading(true);
    setError(false);
    const names: string[] = JSON.parse(signature);
    (async () => {
      try {
        for (let i = 0; i < names.length; i += 20) {
          const params = new URLSearchParams({ lang: prefs.language });
          names.slice(i, i + 20).forEach((n) => params.append("name", n));
          const res = await fetch(`/api/authors?${params}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw Error();
          const data = await res.json();
          if (!controller.signal.aborted)
            setReferences((prev) => ({
              ...prev,
              ...Object.fromEntries(
                data.authors.map((a: AuthorReference) => [
                  authorKey(a.name),
                  a,
                ]),
              ),
            }));
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [signature, prefs.language, retry]);
  useEffect(() => {
    if (selected) heading.current?.focus();
  }, [selected]);
  const reference = selected ? references[authorKey(selected)] : undefined;
  const reading = selected ? influences[authorKey(selected)] || [] : [];
  return (
    <section className="authors-section">
      {selected ? (
        <>
          <button
            className="author-back"
            onClick={() => {
              setSelected(null);
              requestAnimationFrame(() =>
                document
                  .getElementById(`author-${authorKey(selected)}`)
                  ?.focus(),
              );
            }}
          >
            <ArrowLeft size={16} />
            {t("All authors", "Alle Autor:innen")}
          </button>
          <div className="author-profile-head">
            <Portrait author={selected} reference={reference} />
            <div>
              <span className="author-eyebrow">
                {t(
                  "THE PEOPLE BEHIND THE PAGES",
                  "DIE MENSCHEN HINTER DEN SEITEN",
                )}
              </span>
              <h1 ref={heading} tabIndex={-1}>
                {selected}
              </h1>
              <p>
                <BookOpen size={16} />
                {matchingBooks(selected).length}{" "}
                {t("books in your library", "Bücher in deiner Bibliothek")}
              </p>
              {reference?.imageSource && (
                <a
                  href={reference.imageSource}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("Portrait credits & license", "Bildnachweis & Lizenz")} ↗
                </a>
              )}
            </div>
          </div>
          <div className="author-profile-columns">
            <div>
              <article className="author-panel">
                <h2>{t("Biography", "Biografie")}</h2>
                {loading && !reference ? (
                  <p role="status">
                    {t("Loading biography…", "Biografie wird geladen…")}
                  </p>
                ) : reference?.biography ? (
                  <>
                    <p className="author-biography">{reference.biography}</p>
                    <a href={reference.source} target="_blank" rel="noreferrer">
                      Wikipedia · CC BY-SA <ArrowUpRight size={14} />
                    </a>
                  </>
                ) : (
                  <p>
                    {t(
                      "No verified biography is available in this language yet.",
                      "In dieser Sprache ist noch keine verifizierte Biografie verfügbar.",
                    )}
                  </p>
                )}
              </article>
              <article className="author-panel">
                <h2>{t("Bibliography", "Bibliografie")}</h2>
                <p>
                  {t(
                    "Books you track in Folio, across every reading status.",
                    "Deine in Folio erfassten Bücher – unabhängig vom Lesestatus.",
                  )}
                </p>
                {matchingBooks(selected).length ? (
                  <div className="author-books">
                    {matchingBooks(selected).map((book) => (
                      <BookCard key={book.id} book={book} onOpen={onOpen} />
                    ))}
                  </div>
                ) : (
                  <p className="author-empty">
                    {t(
                      "No books by this author in your library yet. Use the book search above to add one.",
                      "Noch keine Bücher dieser Person in deiner Bibliothek. Füge eines über die Buchsuche oben hinzu.",
                    )}
                  </p>
                )}
              </article>
            </div>
            <aside className="author-panel author-influences">
              <Feather size={24} />
              <h2>{t("On their bookshelf", "In ihrem Bücherregal")}</h2>
              <p>
                {t(
                  "Literary influences & reading recommendations",
                  "Literarische Einflüsse & Leseempfehlungen",
                )}
              </p>
              {reading.length ? (
                reading.map((item) => (
                  <div className="author-influence" key={item.title}>
                    <span className="author-eyebrow">
                      {item.kind === "influence"
                        ? t("DOCUMENTED INFLUENCE", "BELEGTER EINFLUSS")
                        : t("READING RECOMMENDATION", "LESEEMPFEHLUNG")}
                    </span>
                    <h3>{item.title}</h3>
                    <small>{item.author}</small>
                    <p>{item[prefs.language]}</p>
                    <a href={item.source} target="_blank" rel="noreferrer">
                      {t("Read source", "Quelle lesen")}{" "}
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))
              ) : (
                <p className="author-empty">
                  {t(
                    "No sourced influences or favorite books have been added for this author yet.",
                    "Für diese Person sind noch keine belegten Einflüsse oder Lieblingsbücher hinterlegt.",
                  )}
                </p>
              )}
            </aside>
          </div>
        </>
      ) : (
        <>
          <div className="author-title">
            <span className="author-eyebrow">
              {t("BEHIND EVERY GREAT BOOK", "HINTER JEDEM GROSSEN BUCH")}
            </span>
            <h1>{t("Meet the authors.", "Lerne die Autor:innen kennen.")}</h1>
            <p>
              {t(
                "Explore the lives, stories and bookshelves behind your favorite reads.",
                "Entdecke die Menschen, Geschichten und Bücherregale hinter deinen Lieblingsbüchern.",
              )}
            </p>
          </div>
          <div className="author-toolbar">
            <label className="author-search">
              <Search size={18} />
              <input
                aria-label={t("Search authors", "Autor:innen suchen")}
                placeholder={t("Search authors…", "Autor:innen suchen…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              className={onlyLibrary ? "active" : ""}
              aria-pressed={onlyLibrary}
              onClick={() => setOnlyLibrary(!onlyLibrary)}
            >
              {t("In my library", "In meiner Bibliothek")}
            </button>
            <span aria-live="polite">
              {visible.length} {t("authors", "Autor:innen")}
            </span>
          </div>
          {visible.length ? (
            <div className="author-gallery">
              {visible.map((name) => (
                <button
                  id={`author-${authorKey(name)}`}
                  className="author-card"
                  key={name}
                  onClick={() => setSelected(name)}
                >
                  <Portrait
                    author={name}
                    reference={references[authorKey(name)]}
                  />
                  <div>
                    <h2>{name}</h2>
                    <p>
                      {matchingBooks(name).length
                        ? `${matchingBooks(name).length} ${t("in your library", "in deiner Bibliothek")}`
                        : t("Discover author", "Profil entdecken")}
                      <ArrowUpRight size={17} />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="author-empty">
              <Search />
              <h2>{t("No authors found", "Keine Autor:innen gefunden")}</h2>
              <p>
                {t(
                  "Try another name or show all authors.",
                  "Versuche einen anderen Namen oder zeige alle Autor:innen.",
                )}
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setOnlyLibrary(false);
                }}
              >
                {t("Clear filters", "Filter zurücksetzen")}
              </button>
            </div>
          )}
        </>
      )}
      {error && (
        <div className="author-notice" role="status">
          {t(
            "Author references could not be loaded. Your library is still available.",
            "Die Quellen konnten nicht geladen werden. Deine Bibliothek ist weiterhin verfügbar.",
          )}
          <button onClick={() => setRetry((r) => r + 1)}>
            <RefreshCw size={14} />
            {t("Retry", "Erneut versuchen")}
          </button>
        </div>
      )}
      {!selected && (
        <p className="author-attribution">
          {t(
            "Portraits and biographies: Wikipedia. Image credits and licenses are linked in each profile.",
            "Porträts und Biografien: Wikipedia. Bildnachweise und Lizenzen sind im jeweiligen Profil verlinkt.",
          )}
        </p>
      )}
    </section>
  );
}
