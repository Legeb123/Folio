"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowUpRight, RefreshCw, Feather } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { authorKey, influences, type AuthorReference } from "@/lib/authors";
import {
  rotateAuthors,
  authorRecommendations,
  literaryAuthors,
  type CatalogAuthor,
} from "@/lib/author-discovery";
import type { Book } from "@/lib/data";
import { tr } from "@/lib/i18n";
import { BookCard, ModalFrame } from "./components";
function Portrait({
  author,
  reference,
}: {
  author: CatalogAuthor;
  reference?: AuthorReference;
}) {
  const [failed, setFailed] = useState(false);
  const src =
    reference?.portrait ||
    (author.id
      ? `https://covers.openlibrary.org/a/olid/${author.id}-L.jpg?default=false`
      : "");
  useEffect(() => setFailed(false), [src]);
  return (
    <div className="author-portrait">
      {src && !failed ? (
        <img
          src={src}
          alt={author.name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>
          {author.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </span>
      )}
    </div>
  );
}
type Profile = {
  id: string;
  name: string;
  birth?: string;
  death?: string;
  biography: string;
  source: string;
  total: number;
  books: Book[];
  worksError?: boolean;
};
function AuthorProfile({
  author,
  reference,
  books,
  onClose,
  onOpen,
}: {
  author: CatalogAuthor;
  reference?: AuthorReference;
  books: Book[];
  onClose: () => void;
  onOpen: (book: Book) => void;
}) {
  const { t, prefs } = usePreferences();
  const [data, setData] = useState<Profile | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(false);
    const q = new URLSearchParams({
      name: author.name,
      lang: prefs.language,
      page: String(page),
    });
    if (author.id) q.set("id", author.id);
    fetch(`/api/author-profile?${q}`, { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((result: Profile) => {
        if (!c.signal.aborted)
          setData((prev) => ({
            ...result,
            books:
              page === 1
                ? result.books
                : Array.from(
                    new Map(
                      [...(prev?.books || []), ...result.books].map((b) => [
                        b.id,
                        b,
                      ]),
                    ).values(),
                  ),
          }));
      })
      .catch(() => {
        if (!c.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [author.name, author.id, page, prefs.language, retry]);
  const curated =
    literaryAuthors.some((a) => a.name === author.name) || !author.id;
  const bio =
    curated && reference?.biography ? reference.biography : data?.biography;
  const source =
    curated && reference?.biography ? reference.source : data?.source;
  const reading = influences[authorKey(author.name)] || [];
  const tracked = books.filter(
    (b) => authorKey(b.author) === authorKey(author.name),
  );
  const open = (book: Book) => {
    const existing = books.find(
      (b) =>
        b.id === book.id ||
        (authorKey(b.title) === authorKey(book.title) &&
          authorKey(b.author) === authorKey(book.author)),
    );
    onClose();
    onOpen(existing || book);
  };
  return (
    <ModalFrame title={author.name} onClose={onClose} wide>
      <div className="author-profile-modal">
        <header className="author-profile-head">
          <Portrait
            author={author}
            reference={curated ? reference : undefined}
          />
          <div>
            <span className="author-eyebrow">
              {t("AUTHOR PROFILE", "AUTORENPORTRÄT")}
            </span>
            <h1>{author.name}</h1>
            {(data?.birth || author.birth) && (
              <p>
                {data?.birth || author.birth}
                {data?.death || author.death
                  ? ` — ${data?.death || author.death}`
                  : ""}
              </p>
            )}
            <p>
              {tracked.length}{" "}
              {t("books in your library", "Bücher in deiner Bibliothek")}
            </p>
            {reference?.imageSource && curated && (
              <a href={reference.imageSource} target="_blank" rel="noreferrer">
                {t("Portrait credits & license", "Bildnachweis & Lizenz")} ↗
              </a>
            )}
          </div>
        </header>
        <section className="author-panel">
          <h2>{t("Life & background", "Leben & Hintergrund")}</h2>
          {bio ? (
            <>
              <p className="author-biography">{bio}</p>
              <a href={source} target="_blank" rel="noreferrer">
                {source?.includes("wikipedia")
                  ? "Wikipedia · CC BY-SA"
                  : "Open Library"}{" "}
                ↗
              </a>
              {prefs.language === "de" && source?.includes("openlibrary") && (
                <p className="account-note">
                  {t(
                    "",
                    "Originaltext aus dem Katalog; möglicherweise nicht auf Deutsch.",
                  )}
                </p>
              )}
            </>
          ) : (
            <p role="status">
              {loading
                ? t("Loading life details…", "Lebensdaten werden geladen…")
                : t(
                    "No biography is available from the catalog yet.",
                    "Im Katalog ist noch keine Biografie verfügbar.",
                  )}
            </p>
          )}
        </section>
        <section className="author-panel">
          <div className="author-section-heading">
            <div>
              <h2>{t("Works & bibliography", "Werke & Bibliografie")}</h2>
              <p>
                {t(
                  "Best-known works first. Editorial priorities, then readership, teaching use and publication reach; less-read catalog entries follow.",
                  "Bekannte Werke zuerst. Redaktionelle Auswahl, danach Leserschaft, Lehre und Verbreitung; weniger gelesene Katalogeinträge folgen.",
                )}
              </p>
            </div>
            {data && (
              <span>
                {data.total} {t("catalog works", "Katalogwerke")}
              </span>
            )}
          </div>
          {data?.books.length ? (
            <div className="author-works-grid">
              {data.books.map((b) => (
                <BookCard
                  book={books.find((existing) => existing.id === b.id) || b}
                  key={b.id}
                  onOpen={open}
                />
              ))}
            </div>
          ) : !loading && !error && !data?.worksError ? (
            <p>
              {t(
                "No works listed in this catalog record yet.",
                "In diesem Katalogeintrag sind noch keine Werke verzeichnet.",
              )}
            </p>
          ) : null}
          {loading && (
            <p role="status">
              {t("Loading bibliography…", "Bibliografie wird geladen…")}
            </p>
          )}
          {(error || data?.worksError) && (
            <div className="author-notice" role="status">
              <p>
                {t(
                  "The catalog could not be loaded. Try again.",
                  "Der Katalog konnte nicht geladen werden. Bitte erneut versuchen.",
                )}
              </p>
              <button onClick={() => setRetry((n) => n + 1)}>
                <RefreshCw size={14} />
                {t("Retry profile", "Profil erneut laden")}
              </button>
            </div>
          )}
          {data && !data.worksError && page * 24 < data.total && (
            <button
              disabled={loading || error}
              className="button secondary"
              onClick={() => setPage((n) => n + 1)}
            >
              {t("More works", "Weitere Werke")}
            </button>
          )}
        </section>
        {tracked.length > 0 && (
          <section className="author-panel">
            <h2>{t("On your shelves", "In deinem Regal")}</h2>
            <div className="author-books">
              {tracked.map((b) => (
                <BookCard book={b} onOpen={open} key={b.id} />
              ))}
            </div>
          </section>
        )}
        <section className="author-panel author-influences">
          <Feather size={24} />
          <h2>
            {t("Influences & favorite books", "Einflüsse & Lieblingsbücher")}
          </h2>
          <p>
            {t(
              "Documented influences and personal reading recommendations, with sources.",
              "Belegte Einflüsse und persönliche Leseempfehlungen mit Quellen.",
            )}
          </p>
          {reading.length ? (
            reading.map((item) => (
              <article className="author-influence" key={item.title}>
                <span className="author-eyebrow">
                  {item.kind === "influence"
                    ? t("DOCUMENTED INFLUENCE", "BELEGTER EINFLUSS")
                    : t("PERSONAL RECOMMENDATION", "PERSÖNLICHE EMPFEHLUNG")}
                </span>
                <h3>{item.title}</h3>
                <small>{item.author}</small>
                <p>{item[prefs.language]}</p>
                <a href={item.source} target="_blank" rel="noreferrer">
                  {t("Read source", "Quelle lesen")}
                  <ArrowUpRight size={14} />
                </a>
              </article>
            ))
          ) : (
            <p className="author-empty">
              {t(
                "No verified book-level influences or favorites are available for this author yet.",
                "Für diese Person sind noch keine belegten Einflüsse oder Lieblingsbücher verfügbar.",
              )}
            </p>
          )}
        </section>
      </div>
    </ModalFrame>
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
  const rotationStarted = useRef(false);
  const [featured, setFeatured] = useState<CatalogAuthor[]>([]);
  const [selected, setSelected] = useState<CatalogAuthor | null>(null);
  const close = useCallback(() => setSelected(null), []);
  const [references, setReferences] = useState<Record<string, AuthorReference>>(
    {},
  );
  const [referenceError, setReferenceError] = useState(false);
  const [refRetry, setRefRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogAuthor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const recommendations = useMemo(
    () => authorRecommendations(books, prefs.genres),
    [books, prefs.genres],
  );
  useEffect(() => {
    if (rotationStarted.current) return;
    rotationStarted.current = true;
    let previous: string[] = [];
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("folio-author-spotlight") || "[]",
      );
      if (Array.isArray(stored))
        previous = stored.filter((v) => typeof v === "string");
    } catch {}
    const next = rotateAuthors(previous);
    setFeatured(next);
    try {
      sessionStorage.setItem(
        "folio-author-spotlight",
        JSON.stringify(next.map((a) => a.name)),
      );
    } catch {}
  }, []);
  const names = JSON.stringify(
    Array.from(
      new Set(
        [
          ...featured,
          ...recommendations.familiar,
          ...recommendations.similar,
          ...(selected ? [selected] : []),
        ].map((a) => a.name),
      ),
    ),
  );
  useEffect(() => {
    const c = new AbortController();
    setReferences({});
    setReferenceError(false);
    (async () => {
      try {
        const list: string[] = JSON.parse(names);
        for (let i = 0; i < list.length; i += 20) {
          const q = new URLSearchParams({ lang: prefs.language });
          list.slice(i, i + 20).forEach((n) => q.append("name", n));
          const r = await fetch(`/api/authors?${q}`, { signal: c.signal });
          if (!r.ok) throw Error();
          const data = await r.json();
          if (!c.signal.aborted)
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
        if (!c.signal.aborted) setReferenceError(true);
      }
    })();
    return () => c.abort();
  }, [names, prefs.language, refRetry]);
  useEffect(() => {
    const c = new AbortController();
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      setError(false);
      return () => c.abort();
    }
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      fetch(
        `/api/author-catalog?${new URLSearchParams({ q, page: String(page) })}`,
        { signal: c.signal },
      )
        .then((r) => {
          if (!r.ok) throw Error();
          return r.json();
        })
        .then((data) => {
          if (!c.signal.aborted) {
            setResults((prev) =>
              page === 1
                ? data.authors
                : Array.from(
                    new Map(
                      [...prev, ...data.authors].map((a: CatalogAuthor) => [
                        a.id,
                        a,
                      ]),
                    ).values(),
                  ),
            );
            setTotal(data.total);
          }
        })
        .catch(() => {
          if (!c.signal.aborted) setError(true);
        })
        .finally(() => {
          if (!c.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [query, page, retry]);
  const card = (a: CatalogAuthor, reason?: string) => (
    <button
      className="author-card"
      key={a.id || a.name}
      onClick={() => setSelected(a)}
    >
      <Portrait
        author={a}
        reference={!a.id ? references[authorKey(a.name)] : undefined}
      />
      <div>
        <h2>{a.name}</h2>
        <p>
          {reason ||
            [a.birth, a.death].filter(Boolean).join(" — ") ||
            t("Explore profile", "Profil entdecken")}
          <ArrowUpRight size={16} />
        </p>
        {a.topWork && <small>{a.topWork}</small>}
      </div>
    </button>
  );
  return (
    <section className="authors-section">
      <div className="author-title">
        <span className="author-eyebrow">
          {t(
            "LITERARY VOICES, PAST & PRESENT",
            "LITERARISCHE STIMMEN, DAMALS & HEUTE",
          )}
        </span>
        <h1>
          {t(
            "The people who changed the page.",
            "Menschen, die Literatur prägten.",
          )}
        </h1>
        <p>
          {t(
            "Discover great writers, follow your interests, or search the worldwide author catalog.",
            "Entdecke große Stimmen, folge deinen Interessen oder suche im weltweiten Autorenkatalog.",
          )}
        </p>
      </div>
      <div className="author-toolbar">
        <label className="author-search">
          <Search size={18} />
          <input
            aria-label={t("Search all authors", "Alle Autor:innen suchen")}
            placeholder={t(
              "Search any author…",
              "Beliebige Autor:innen suchen…",
            )}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
              setResults([]);
              setTotal(0);
            }}
          />
        </label>
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
          >
            {t("Clear search", "Suche löschen")}
          </button>
        )}
        <span>
          {t(
            "Worldwide catalog · Open Library",
            "Weltweiter Katalog · Open Library",
          )}
        </span>
      </div>
      {query.trim() ? (
        <section
          className="author-search-results"
          aria-label={t("Author search results", "Suchergebnisse")}
        >
          <h2>{t("Search results", "Suchergebnisse")}</h2>
          {query.trim().length < 2 ? (
            <p>
              {t(
                "Enter at least two characters.",
                "Gib mindestens zwei Zeichen ein.",
              )}
            </p>
          ) : (
            <>
              {loading && (
                <p role="status">
                  {t("Searching the catalog…", "Katalog wird durchsucht…")}
                </p>
              )}
              {error && (
                <div role="status" className="author-notice">
                  {t(
                    "Search is unavailable. Please try again.",
                    "Die Suche ist nicht verfügbar. Bitte erneut versuchen.",
                  )}
                  <button onClick={() => setRetry((n) => n + 1)}>
                    {t("Retry search", "Suche wiederholen")}
                  </button>
                </div>
              )}
              {!loading && !error && !results.length && (
                <p>
                  {t(
                    "No authors found. Try a different spelling.",
                    "Keine Treffer. Versuche eine andere Schreibweise.",
                  )}
                </p>
              )}
              <div className="author-gallery">
                {results.map((a) => card(a))}
              </div>
              {page * 20 < total && (
                <button
                  className="button secondary"
                  disabled={loading || error}
                  onClick={() => setPage((n) => n + 1)}
                >
                  {t("More authors", "Weitere Autor:innen")}
                </button>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          <section className="author-spotlight">
            <div className="author-section-heading">
              <div>
                <span className="author-eyebrow">
                  {t("EIGHT VOICES TO DISCOVER", "ACHT STIMMEN ENTDECKEN")}
                </span>
                <h2>
                  {t(
                    "Influential across generations",
                    "Einflussreich über Generationen",
                  )}
                </h2>
                <p>
                  {t(
                    "A rotating editorial selection from world literature — a new set on every visit.",
                    "Eine wechselnde redaktionelle Auswahl aus der Weltliteratur – bei jedem Besuch neu.",
                  )}
                </p>
              </div>
              <span>08</span>
            </div>
            <div className="author-gallery">{featured.map((a) => card(a))}</div>
          </section>
          <section className="author-personal">
            <div className="author-section-heading">
              <div>
                <span className="author-eyebrow">
                  {t("YOUR READING CONNECTIONS", "DEINE LESEVERBINDUNGEN")}
                </span>
                <h2>
                  {t("Authors you have read", "Bereits gelesene Autor:innen")}
                </h2>
                <p>
                  {t(
                    "From your completed books.",
                    "Aus deinen abgeschlossenen Büchern.",
                  )}
                </p>
              </div>
            </div>
            {recommendations.familiar.length ? (
              <div className="author-gallery">
                {recommendations.familiar.map((a) =>
                  card(a, t("Read by you", "Von dir gelesen")),
                )}
              </div>
            ) : (
              <p>
                {t(
                  "Complete a book to start building your reading connections.",
                  "Schließe ein Buch ab, um deine Leseverbindungen aufzubauen.",
                )}
              </p>
            )}
          </section>
          <section className="author-similar">
            <div className="author-section-heading">
              <div>
                <h2>
                  {t(
                    "Similar themes, new voices",
                    "Ähnliche Themen, neue Stimmen",
                  )}
                </h2>
                <p>
                  {t(
                    "Based on the genres of completed books and your favorite genres.",
                    "Basierend auf den Genres gelesener Bücher und deinen Lieblingsgenres.",
                  )}
                </p>
              </div>
            </div>
            {recommendations.similar.length ? (
              <div className="author-gallery">
                {recommendations.similar.map((a) =>
                  card(
                    a,
                    a.matches.map((g) => tr(g, prefs.language)).join(" · "),
                  ),
                )}
              </div>
            ) : (
              <p>
                {t(
                  "Choose favorite genres in Settings or finish a book to see suggestions.",
                  "Wähle Lieblingsgenres in den Einstellungen oder schließe ein Buch ab, um Vorschläge zu erhalten.",
                )}
              </p>
            )}
          </section>
        </>
      )}
      {referenceError && (
        <div className="author-notice" role="status">
          {t(
            "Some portraits and biographies could not be loaded.",
            "Einige Porträts und Biografien konnten nicht geladen werden.",
          )}
          <button onClick={() => setRefRetry((n) => n + 1)}>
            {t("Retry portraits", "Porträts erneut laden")}
          </button>
        </div>
      )}
      <p className="author-attribution">
        {t(
          "Portraits and biographies: Wikipedia and Open Library. References and image credits are linked in profiles.",
          "Porträts und Biografien: Wikipedia und Open Library. Quellen und Bildnachweise findest du in den Profilen.",
        )}
      </p>
      {selected && (
        <AuthorProfile
          key={`${selected.id || selected.name}-${prefs.language}`}
          author={selected}
          reference={references[authorKey(selected.name)]}
          books={books}
          onClose={close}
          onOpen={onOpen}
        />
      )}
    </section>
  );
}
