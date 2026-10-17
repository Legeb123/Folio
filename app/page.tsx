"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookMarked,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Feather,
  Grid2X2,
  Home,
  Compass,
  BookmarkPlus,
  Library,
  List,
  ListOrdered,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  Book,
  createEmptyLibrary,
  LibraryData,
  ReadingList,
  readingStats,
  validData,
} from "@/lib/data";
import {
  BookCard,
  BookModal,
  Cover,
  ModalFrame,
  SearchBox,
  Stars,
} from "./components";
import { usePreferences } from "@/lib/preferences";
import { SettingsButton, WelcomeButton } from "./experience";
import { FavoriteBooksButton, resolveFavorites } from "./favorites";
import { BookGoals, StartReadingGoal } from "./reading-goals";
import { locationFor, type Publication } from "@/lib/geography";
import { BookMap } from "./bookmap";
import { Bookshelf, LibraryViewSwitcher } from "./bookshelf";
import { Authors } from "./authors";
import { Ideas, Wishlist } from "./discovery";
import { localizedTitles, mergeTitleMetadata } from "@/lib/localized-titles";
import { bookTitle, tr, statusLabel } from "@/lib/i18n";
import { switchStatus } from "@/lib/reading";
type Tab =
  | "Home"
  | "My Library"
  | "Custom Lists"
  | "Analytics"
  | "Ideas"
  | "Wishlist"
  | "Authors";
const STORAGE = "folio-library-v1";
const tabs: { label: Tab; icon: typeof Home }[] = [
  { label: "Home", icon: Home },
  { label: "My Library", icon: Library },
  { label: "Custom Lists", icon: ListOrdered },
  { label: "Analytics", icon: BarChart3 },
  { label: "Ideas", icon: Compass },
  { label: "Wishlist", icon: BookmarkPlus },
  { label: "Authors", icon: Feather },
];
export default function Folio() {
  const { t, prefs, update } = usePreferences();
  const [data, setData] = useState<LibraryData>(() => createEmptyLibrary());
  const [ready, setReady] = useState(false);
  const titleLookupKey = data.books.map((b) => b.id).join("|");
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    localizedTitles(data.books, prefs.language, controller.signal)
      .then((updates) => {
        if (controller.signal.aborted || !updates.size) return;
        setData((current) => ({
          ...current,
          books: current.books.map((b) =>
            updates.has(b.id) ? mergeTitleMetadata(b, updates.get(b.id)!) : b,
          ),
        }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [ready, titleLookupKey, prefs.language]);
  const [storageSafe, setStorageSafe] = useState(true);
  const [tab, setTab] = useState<Tab>("Home");
  const [modal, setModal] = useState<Book | null>(null);
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState("All books");
  const [genre, setGenre] = useState("All genres");
  const [sort, setSort] = useState("Recently added");
  const [view, setView] = useState<"grid" | "diary">(prefs.libraryView);
  const [listEditor, setListEditor] = useState<ReadingList | null>(null);
  const [listView, setListView] = useState<ReadingList | null>(null);
  const [listMode, setListMode] = useState<"ranked" | "tiers">("ranked");
  const [startingBook, setStartingBook] = useState<Book | null>(null);
  const [goalEditor, setGoalEditor] = useState(false);
  const [goalDraft, setGoalDraft] = useState(24);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setView(prefs.libraryView), [prefs.libraryView]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (validData(parsed)) setData(parsed);
        else {
          setStorageSafe(false);
          setToast(
            "Saved data could not be read. Your original data has been preserved.",
          );
        }
      }
    } catch {
      setStorageSafe(false);
      setToast(
        "Browser storage is unavailable. Changes will only last for this session.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !storageSafe) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
    } catch {
      setStorageSafe(false);
      setToast(
        "Storage is full or unavailable. Changes will only last for this session.",
      );
    }
  }, [data, ready, storageSafe]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !document.querySelector("[role=dialog]") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const closeBook = useCallback(() => setModal(null), []);
  const closeList = useCallback(() => setListEditor(null), []);
  const closeListView = useCallback(() => setListView(null), []);
  const closeGoal = useCallback(() => setGoalEditor(false), []);
  const stats = readingStats(data.books);
  const year = new Date().getFullYear();
  const yearly = stats.read.filter((b) =>
    b.date.startsWith(String(year)),
  ).length;
  const reading = data.books.filter((b) => b.status === "Currently Reading");
  const tags = [...new Set(data.books.flatMap((b) => b.tags))].sort();
  const filtered = useMemo(
    () =>
      data.books
        .filter(
          (b) =>
            (status === "All books" || b.status === status) &&
            (genre === "All genres" || b.tags.includes(genre)),
        )
        .sort((a, b) =>
          sort === "Highest rated"
            ? b.rating - a.rating
            : sort === "Title A–Z"
              ? bookTitle(a, prefs.language).localeCompare(
                  bookTitle(b, prefs.language),
                  prefs.language,
                )
              : sort === "Publication year"
                ? b.year - a.year
                : sort === "Date read"
                  ? b.date.localeCompare(a.date)
                  : 0,
        ),
    [data.books, status, genre, sort, prefs.language],
  );
  const resolvePublication = useCallback(
    (id: string, publication: Publication) => {
      setData((d) => ({
        ...d,
        books: d.books.map((b) =>
          b.id === id && b.publication === undefined && !locationFor(b)
            ? { ...b, publication }
            : b,
        ),
      }));
    },
    [],
  );
  function changeStatus(book: Book, status: Book["status"]) {
    const changed = switchStatus(book, status);
    if (book.status === "Want to Read" && status === "Currently Reading")
      setStartingBook(changed);
    else saveBook(changed);
  }
  function saveBook(book: Book) {
    setData((d) => ({
      ...d,
      books: d.books.some((b) => b.id === book.id)
        ? d.books.map((b) => (b.id === book.id ? book : b))
        : [book, ...d.books],
    }));
    setModal(null);
    setToast(
      t(
        "Book saved. Another chapter in your story.",
        "Buch gespeichert. Ein weiteres Kapitel deiner Geschichte.",
      ),
    );
  }
  function addToList(book: Book, id: string) {
    setData((d) => ({
      ...d,
      books: d.books.some((b) => b.id === book.id)
        ? d.books.map((b) => (b.id === book.id ? book : b))
        : [book, ...d.books],
      lists: d.lists.map((l) =>
        l.id === id ? { ...l, books: [...new Set([...l.books, book.id])] } : l,
      ),
    }));
    setToast(t("Book saved to your list.", "Buch zur Sammlung hinzugefügt."));
  }
  function browse() {
    inputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setToast("Search for a title or author to add a book.");
  }
  function navigate(t: Tab) {
    setTab(t);
    setStatus("All books");
    setGenre("All genres");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function saveList(l: ReadingList) {
    setData((d) => ({
      ...d,
      lists: d.lists.some((x) => x.id === l.id)
        ? d.lists.map((x) => (x.id === l.id ? l : x))
        : [l, ...d.lists],
    }));
    setListEditor(null);
    setToast(t("Your list is saved.", "Deine Sammlung wurde gespeichert."));
  }
  const currentList = listView
    ? data.lists.find((l) => l.id === listView.id)
    : undefined;
  if (!ready)
    return (
      <div className="loading-screen">
        <BookOpen size={30} />
        <strong>folio.</strong>
        <p>{t("Opening your library…", "Deine Bibliothek wird geöffnet …")}</p>
      </div>
    );
  return (
    <div className="app-shell min-h-screen" data-density={prefs.density}>
      <header className="header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate("Home")}
            aria-label="Folio home"
          >
            <span className="brand-icon">
              <BookOpen size={25} />
            </span>
            folio<span className="brand-period">.</span>
          </button>
          <nav aria-label={tr("Main navigation", prefs.language)}>
            {tabs.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={tab === label ? "active" : ""}
                onClick={() => navigate(label)}
              >
                <Icon size={16} />
                <span>
                  {t(
                    label,
                    {
                      Home: "Startseite",
                      "My Library": "Bibliothek",
                      "Custom Lists": "Sammlungen",
                      Analytics: "Statistik",
                      Ideas: "Ideen",
                      Wishlist: "Leseliste",
                      Authors: "Autor:innen",
                    }[label],
                  )}
                </span>
              </button>
            ))}
          </nav>
          <SearchBox
            books={data.books}
            onSelect={setModal}
            inputRef={inputRef}
          />
          <SettingsButton />
          <WelcomeButton />
          <div className="avatar" aria-label="Personal library">
            N
          </div>
        </div>
      </header>
      <main>
        <div className="topline">
          <span>
            <span className="live-dot" />
            {tr("YOUR PERSONAL READING SPACE", prefs.language)}
          </span>
          <span className="date-label">
            {new Date().toLocaleDateString(
              prefs.language === "de" ? "de-DE" : "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            )}
          </span>
        </div>
        {tab === "Home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  {tr("A LIFE IN BOOKS", prefs.language)}
                </div>
                <h1>
                  {t("Between the covers,", "Zwischen den Seiten,")}
                  <br />
                  <em>{t("find yourself.", "findest du dich.")}</em>
                </h1>
                <p>
                  {tr(
                    "A home for the books you love, the thoughts they leave,",
                    prefs.language,
                  )}
                  <br className="desktop-break" />
                  {tr(
                    "and the stories still waiting to be discovered.",
                    prefs.language,
                  )}
                </p>
                <div className="hero-actions">
                  <button className="button primary" onClick={browse}>
                    <Plus size={17} />
                    {tr("Log a book", prefs.language)}
                  </button>
                  <button
                    className="hero-link"
                    onClick={() => navigate("My Library")}
                  >
                    {tr("Explore your library", prefs.language)}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <div className="hero-art" aria-label="Books from your collection">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="art-label">
                  <Sparkles size={12} />{" "}
                  {t(
                    "THREE BOOKS, A LITTLE MORE YOU",
                    "DREI BÜCHER, EIN STÜCK VON DIR",
                  )}
                </span>
                <FavoriteBooksButton books={data.books} />
                {resolveFavorites(data.books, prefs.favoriteBookIds).map(
                  (b, i) => (
                    <button
                      className={`hero-book hero-book-${i}`}
                      key={`${b.id}-${i}`}
                      onClick={() => setModal(b)}
                      aria-label={`Open ${bookTitle(b, prefs.language)}`}
                    >
                      <Cover book={b} />
                    </button>
                  ),
                )}
                <span className="art-caption">
                  {t(
                    "The stories that stay with you.",
                    "Geschichten, die bei dir bleiben.",
                  )}{" "}
                  <span>↗</span>
                </span>
              </div>
            </section>
            <section className="stats-strip" aria-label="Reading overview">
              <Stat
                icon={BookOpen}
                value={String(stats.read.length)}
                label={tr("Books read", prefs.language)}
                detail={tr("A world on every shelf", prefs.language)}
              />
              <Stat
                icon={Feather}
                value={stats.pages.toLocaleString(
                  prefs.language === "de" ? "de-DE" : "en-US",
                )}
                label={tr("Pages turned", prefs.language)}
                detail={tr("One page at a time", prefs.language)}
              />
              <Stat
                icon={Star}
                value={stats.average.toFixed(1)}
                label={tr("Average rating", prefs.language)}
                detail={tr("Your kind of stories", prefs.language)}
              />
              <div
                className="goal-stat"
                role="button"
                tabIndex={0}
                aria-label={t("View reading goals", "Leseziele ansehen")}
                onClick={() => {
                  setGoalDraft(data.goal);
                  setGoalEditor(true);
                }}
                onKeyDown={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    setGoalDraft(data.goal);
                    setGoalEditor(true);
                  }
                }}
              >
                <div className="goal-top">
                  <span className="stat-icon">
                    <Target size={19} />
                  </span>
                  <span className="goal-label">
                    {year} {t("reading goal", "Leseziel")}
                  </span>
                  <span className="text-button">
                    {t("View goals", "Ziele ansehen")}
                    <ChevronRight size={12} />
                  </span>
                </div>
                <div className="goal-numbers">
                  <strong>
                    {yearly}
                    <span> / {data.goal}</span>
                  </strong>
                  <small>{Math.round((yearly / data.goal) * 100)}%</small>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${Math.min(100, (yearly / data.goal) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </section>
            <section className="reading-section">
              <SectionTitle
                eyebrow={tr("ONE MORE CHAPTER", prefs.language)}
                title={t("Currently reading", "Gerade am Lesen")}
                count={reading.length}
                action={tr("View all", prefs.language)}
                onAction={() => {
                  navigate("My Library");
                  setStatus("Currently Reading");
                }}
              />
              <div className="reading-layout">
                <div className="currently-books">
                  {reading.length ? (
                    reading.slice(0, 2).map((b) => (
                      <button
                        className="reading-card"
                        key={b.id}
                        onClick={() => setModal(b)}
                      >
                        <Cover book={b} />
                        <div>
                          <span className="reading-badge">
                            <span />
                            {tr("IN PROGRESS", prefs.language)}
                          </span>
                          <h3>{bookTitle(b, prefs.language)}</h3>
                          <p>{b.author}</p>
                          <div className="progress-track">
                            <span
                              style={{
                                width: `${b.pages ? Math.min(100, (b.progress / b.pages) * 100) : 0}%`,
                              }}
                            />
                          </div>
                          <div className="reading-progress">
                            <span>
                              {t("Page", "Seite")} {b.progress} {t("of", "von")}{" "}
                              {b.pages || "?"}
                            </span>
                            <strong>
                              {b.pages
                                ? Math.round((b.progress / b.pages) * 100)
                                : 0}
                              %
                            </strong>
                          </div>
                        </div>
                        <ChevronRight className="reading-arrow" size={16} />
                      </button>
                    ))
                  ) : (
                    <button className="empty-reading" onClick={browse}>
                      <Plus />{" "}
                      {t(
                        "Start your next chapter",
                        "Beginne dein nächstes Kapitel",
                      )}
                    </button>
                  )}
                </div>
                <div className="quote-card">
                  <span className="quote-mark">“</span>
                  <blockquote>
                    {tr("A reader lives a thousand lives", prefs.language)}
                    <br />
                    {tr("before he dies.", prefs.language)}
                  </blockquote>
                  <cite>GEORGE R. R. MARTIN</cite>
                  <BookOpen className="quote-icon" size={48} />
                </div>
              </div>
            </section>
          </>
        )}
        {(tab === "Home" || tab === "My Library") && (
          <section className="library-section">
            <SectionTitle
              eyebrow={
                tab === "Home"
                  ? "YOUR STORIES, COLLECTED"
                  : "THE BOOKS THAT MAKE YOU"
              }
              title={
                tab === "Home"
                  ? t("Your bookshelf", "Dein Bücherregal")
                  : t("My library & diary", "Bibliothek & Lesetagebuch")
              }
              count={data.books.length}
              action={tab === "Home" ? "Open library" : undefined}
              onAction={() => navigate("My Library")}
            />
            {tab === "My Library" && (
              <p className="page-description">
                {tr(
                  "Every book has a place. Every reading has a story.",
                  prefs.language,
                )}
              </p>
            )}
            {tab === "My Library" && (
              <div className="library-display-options">
                <LibraryViewSwitcher onChange={() => setView("grid")} />
                <BookMap
                  books={data.books}
                  onOpen={setModal}
                  onResolve={resolvePublication}
                />
              </div>
            )}
            <div className="library-toolbar">
              <div className="filter-tabs">
                {["All books", "Read", "Currently Reading", "Want to Read"].map(
                  (s) => (
                    <button
                      className={status === s ? "active" : ""}
                      key={s}
                      onClick={() => setStatus(s)}
                    >
                      {tr(
                        s === "Currently Reading" ? "Reading" : s,
                        prefs.language,
                      )}
                      <span>
                        {s === "All books"
                          ? data.books.length
                          : data.books.filter((b) => b.status === s).length}
                      </span>
                    </button>
                  ),
                )}
              </div>
              <div className="toolbar-actions">
                <label className="select-wrap">
                  <SlidersHorizontal size={14} />
                  <select
                    aria-label={tr("Filter by genre or tag", prefs.language)}
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  >
                    <option value="All genres">
                      {tr("All genres", prefs.language)}
                    </option>
                    {tags.map((t) => (
                      <option key={t} value={t}>
                        {tr(t, prefs.language)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} />
                </label>
                <label className="select-wrap">
                  <select
                    aria-label={tr("Sort books", prefs.language)}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    {[
                      "Recently added",
                      "Highest rated",
                      "Date read",
                      "Title A–Z",
                      "Publication year",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {tr(s, prefs.language)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} />
                </label>
                {tab === "My Library" && (
                  <div className="view-switch">
                    <button
                      className={view === "grid" ? "active" : ""}
                      aria-label={tr("Grid view", prefs.language)}
                      aria-pressed={view === "grid"}
                      onClick={() => {
                        setView("grid");
                        update({ libraryView: "grid" });
                      }}
                    >
                      <Grid2X2 size={15} />
                    </button>
                    <button
                      className={view === "diary" ? "active" : ""}
                      aria-label={tr("Diary view", prefs.language)}
                      aria-pressed={view === "diary"}
                      onClick={() => {
                        setView("diary");
                        update({ shelfStyle: "simple", libraryView: "diary" });
                      }}
                    >
                      <List size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            {filtered.length ? (
              tab === "My Library" &&
              view === "grid" &&
              prefs.shelfStyle !== "simple" ? (
                <Bookshelf
                  books={filtered}
                  onOpen={setModal}
                  onStatus={changeStatus}
                />
              ) : tab === "Home" || view === "grid" ? (
                <div className="book-grid">
                  {(tab === "Home" ? filtered.slice(0, 8) : filtered).map(
                    (b) => (
                      <div className="book-tile" key={b.id}>
                        <BookCard book={b} onOpen={setModal} />
                        <select
                          className="quick-status"
                          aria-label={t(
                            `Status for ${bookTitle(b, prefs.language)}`,
                            `Status für ${bookTitle(b, prefs.language)}`,
                          )}
                          value={b.status}
                          onChange={(e) =>
                            changeStatus(b, e.target.value as Book["status"])
                          }
                        >
                          {(
                            [
                              "Want to Read",
                              "Currently Reading",
                              "Read",
                            ] as const
                          ).map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s, prefs.language)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <Diary books={filtered} onOpen={setModal} />
              )
            ) : (
              <div className="empty-state">
                <BookOpen />
                <h3>
                  {tr("A little space for your next story.", prefs.language)}
                </h3>
                <p>{tr("No books match these filters.", prefs.language)}</p>
                <button
                  className="button secondary"
                  onClick={() => {
                    setStatus("All books");
                    setGenre("All genres");
                  }}
                >
                  {tr("Reset filters", prefs.language)}
                </button>
              </div>
            )}
            {tab === "Home" && filtered.length > 8 && (
              <button
                className="shelf-more"
                onClick={() => setTab("My Library")}
              >
                {t("Explore all", "Alle")} {filtered.length}{" "}
                {t("books", "Bücher entdecken")} <ArrowRight size={14} />
              </button>
            )}
          </section>
        )}
        {tab === "Home" && (
          <section className="home-lists">
            <SectionTitle
              eyebrow={tr("A SHELF OF YOUR OWN", prefs.language)}
              title={tr("Made by you", prefs.language)}
              action={tr("All lists", prefs.language)}
              onAction={() => navigate("Custom Lists")}
            />
            <div className="list-grid">
              {data.lists.slice(0, 2).map((l) => (
                <ListCard
                  key={l.id}
                  list={l}
                  books={data.books}
                  onClick={() => setListView(l)}
                />
              ))}
              <button
                className="new-list-card"
                onClick={() =>
                  setListEditor({
                    id: crypto.randomUUID(),
                    title: "",
                    description: "",
                    books: [],
                    tiers: {},
                  })
                }
              >
                <span>
                  <Plus size={22} />
                </span>
                <h3>
                  {tr("A collection, a little more you.", prefs.language)}
                </h3>
                <p>
                  {tr("Bring your favorite books together.", prefs.language)}
                </p>
                <strong>
                  {tr("Create a list", prefs.language)}
                  <ArrowRight size={14} />
                </strong>
              </button>
            </div>
          </section>
        )}
        {tab === "Custom Lists" && (
          <section className="page-section">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  {tr("YOUR VERY OWN CANON", prefs.language)}
                </span>
                <h1>
                  {tr("Custom", prefs.language)}
                  <em>{tr("collections.", prefs.language)}</em>
                </h1>
                <p className="page-description">
                  {tr(
                    "Rank your favorites. Curate a feeling. Make a shelf your own.",
                    prefs.language,
                  )}
                </p>
              </div>
              <button
                className="button primary"
                onClick={() =>
                  setListEditor({
                    id: crypto.randomUUID(),
                    title: "",
                    description: "",
                    books: [],
                    tiers: {},
                  })
                }
              >
                <Plus size={16} />
                {tr("Create a list", prefs.language)}
              </button>
            </div>
            <div className="list-grid">
              {data.lists.map((l) => (
                <ListCard
                  key={l.id}
                  list={l}
                  books={data.books}
                  onClick={() => setListView(l)}
                />
              ))}
            </div>
            {data.lists.length === 0 && (
              <div className="empty-state">
                <ListOrdered />
                <h3>
                  {tr("Your first collection starts here.", prefs.language)}
                </h3>
                <p>
                  {tr(
                    "Create a list and add books from your library.",
                    prefs.language,
                  )}
                </p>
              </div>
            )}
          </section>
        )}
        {tab === "Ideas" && (
          <Ideas books={data.books} onOpen={setModal} onAdd={saveBook} />
        )}
        {tab === "Wishlist" && (
          <Wishlist
            books={data.books}
            onOpen={setModal}
            onStatus={changeStatus}
          />
        )}
        {tab === "Authors" && <Authors books={data.books} onOpen={setModal} />}
        {tab === "Analytics" && <Analytics books={data.books} />}
        <footer>
          <span className="footer-brand">folio.</span>
          <p>
            {tr("A little more reading. A little more you.", prefs.language)}
          </p>
          <span>
            <span className="live-dot" />
            {tr(
              storageSafe ? "Saved on this device" : "Session only",
              prefs.language,
            )}
          </span>
        </footer>
      </main>
      {modal && (
        <BookModal
          key={modal.id}
          book={modal}
          lists={data.lists}
          onClose={closeBook}
          onSave={saveBook}
          onAddList={addToList}
          onRemove={() => {
            setData((d) => ({
              ...d,
              books: d.books.filter((b) => b.id !== modal.id),
              lists: d.lists.map((l) => ({
                ...l,
                books: l.books.filter((id) => id !== modal.id),
              })),
            }));
            setModal(null);
            setToast("Book removed from your library.");
          }}
        />
      )}
      {listEditor && (
        <ListEditor
          list={listEditor}
          books={data.books}
          onClose={closeList}
          onSave={saveList}
        />
      )}
      {currentList && (
        <ModalFrame title={currentList.title} onClose={closeListView} wide>
          <div className="list-detail">
            <span className="eyebrow">
              {t("A PERSONAL COLLECTION", "DEINE SAMMLUNG")} ·{" "}
              {currentList.books.length} {t("BOOKS", "BÜCHER")}
            </span>
            <h2>{currentList.title}</h2>
            <p>{currentList.description}</p>
            <div className="list-detail-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setListEditor(currentList);
                  setListView(null);
                }}
              >
                <ListOrdered size={15} />
                {tr("Edit & rank", prefs.language)}
              </button>
              <button
                className="text-button danger"
                onClick={() => {
                  setData((d) => ({
                    ...d,
                    lists: d.lists.filter((l) => l.id !== currentList.id),
                  }));
                  setListView(null);
                  setToast(
                    "List deleted. Your books are still in your library.",
                  );
                }}
              >
                <Trash2 size={14} />
                {tr("Delete list", prefs.language)}
              </button>
            </div>
            <div className="collection-view">
              <button
                className={listMode === "ranked" ? "active" : ""}
                onClick={() => setListMode("ranked")}
              >
                <ListOrdered size={14} />
                {tr("Ranked list", prefs.language)}
              </button>
              <button
                className={listMode === "tiers" ? "active" : ""}
                onClick={() => setListMode("tiers")}
              >
                <Grid2X2 size={14} />
                {tr("Tier board", prefs.language)}
              </button>
            </div>
            {listMode === "tiers" ? (
              <div className="tier-board">
                {["S", "A", "B", "C", "D", "Unassigned"].map((t) => (
                  <div className="tier-row" key={t}>
                    <span className={`tier-label tier-${t}`}>{t}</span>
                    <div>
                      {currentList.books
                        .filter(
                          (id) => (currentList.tiers[id] || "Unassigned") === t,
                        )
                        .map((id) => {
                          const book = data.books.find((b) => b.id === id);
                          return book ? (
                            <button
                              key={id}
                              onClick={() => {
                                setListView(null);
                                setModal(book);
                              }}
                              aria-label={`Open ${bookTitle(book, prefs.language)}`}
                            >
                              <Cover book={book} />
                              <span>{bookTitle(book, prefs.language)}</span>
                            </button>
                          ) : null;
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              currentList.books.map((id, i) => {
                const b = data.books.find((b) => b.id === id);
                return b ? (
                  <button
                    className="ranked-book"
                    key={id}
                    onClick={() => {
                      setListView(null);
                      setModal(b);
                    }}
                  >
                    <span className="rank">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Cover book={b} />
                    <div>
                      <h3>{bookTitle(b, prefs.language)}</h3>
                      <p>{b.author}</p>
                      <Stars value={b.rating} />
                    </div>
                    {currentList.tiers[id] && (
                      <span className={`tier tier-${currentList.tiers[id]}`}>
                        {currentList.tiers[id]}
                      </span>
                    )}
                    <ChevronRight size={18} />
                  </button>
                ) : null;
              })
            )}
            {!currentList.books.length && (
              <div className="empty-state">
                {tr("Edit this list to add your first book.", prefs.language)}
              </div>
            )}
          </div>
        </ModalFrame>
      )}
      {startingBook && (
        <StartReadingGoal
          book={startingBook}
          onClose={() => setStartingBook(null)}
          onSave={(book) => {
            saveBook(book);
            setStartingBook(null);
          }}
        />
      )}
      {goalEditor && (
        <ModalFrame
          title={t("Set your reading goal", "Leseziel festlegen")}
          onClose={closeGoal}
        >
          <form
            className="simple-form"
            onSubmit={(e) => {
              e.preventDefault();
              setData((d) => ({ ...d, goal: goalDraft }));
              setGoalEditor(false);
              setToast("Reading goal updated. One book at a time.");
            }}
          >
            <Target size={30} />
            <h2>{tr("A year of good books.", prefs.language)}</h2>
            <p>
              {t(
                `Set a reading goal for ${year}. Make it yours.`,
                `Setze dir ein Leseziel für ${year}. Ganz nach deinem Geschmack.`,
              )}
            </p>
            <label>
              {tr("Books to read", prefs.language)}
              <input
                type="number"
                min="1"
                max="10000"
                required
                value={goalDraft}
                onChange={(e) => setGoalDraft(Number(e.target.value))}
              />
            </label>
            <button className="button primary">
              {tr("Save goal", prefs.language)}
            </button>
          </form>
          <BookGoals
            books={data.books}
            onOpen={(book) => {
              setGoalEditor(false);
              setModal(book);
            }}
          />
        </ModalFrame>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
function Stat({
  icon: Icon,
  value,
  label,
  detail,
}: {
  icon: typeof Home;
  value: string;
  label: string;
  detail: string;
}) {
  const { prefs } = usePreferences();
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={19} />
        </span>
        <span>{tr(label, prefs.language)}</span>
      </div>
      <strong>{value}</strong>
      <small>{tr(detail, prefs.language)}</small>
    </div>
  );
}
function SectionTitle({
  eyebrow,
  title,
  count,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  count?: number;
  action?: string;
  onAction?: () => void;
}) {
  const { prefs } = usePreferences();
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{tr(eyebrow, prefs.language)}</span>
        <h2>
          {tr(title, prefs.language)}{" "}
          {count !== undefined && <span className="count">{count}</span>}
        </h2>
      </div>
      {action && (
        <button onClick={onAction}>
          {tr(action, prefs.language)}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
function Diary({
  books,
  onOpen,
}: {
  books: Book[];
  onOpen: (b: Book) => void;
}) {
  const { prefs } = usePreferences();
  const [revealed, setRevealed] = useState<string[]>([]);
  return (
    <div className="diary">
      {[...books]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((b) => (
          <article className="diary-row" key={b.id}>
            <div className="diary-date">
              {b.date ? (
                <>
                  <strong>{new Date(b.date + "T12:00:00").getDate()}</strong>
                  <span>
                    {new Date(b.date + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" },
                    )}
                  </span>
                </>
              ) : (
                <span>{tr("Not dated", prefs.language)}</span>
              )}
            </div>
            <button
              onClick={() => onOpen(b)}
              aria-label={`Open ${bookTitle(b, prefs.language)}`}
            >
              <Cover book={b} />
            </button>
            <div className="diary-content">
              <button className="diary-title" onClick={() => onOpen(b)}>
                {bookTitle(b, prefs.language)}
              </button>
              <span className="muted">
                {b.author} · {b.year}
              </span>
              <Stars value={b.rating} />
              {b.review &&
                (b.spoiler && !revealed.includes(b.id) ? (
                  <button
                    className="spoiler-button"
                    onClick={() => setRevealed([...revealed, b.id])}
                  >
                    {tr("Contains spoilers · Reveal review", prefs.language)}
                  </button>
                ) : (
                  <p>{b.review}</p>
                ))}
            </div>
            <span
              className={`status-pill ${b.status === "Read" ? "read" : b.status === "Currently Reading" ? "reading" : ""}`}
            >
              {b.status}
            </span>
          </article>
        ))}
    </div>
  );
}
function ListCard({
  list,
  books,
  onClick,
}: {
  list: ReadingList;
  books: Book[];
  onClick: () => void;
}) {
  const { prefs } = usePreferences();
  return (
    <button className="list-card" onClick={onClick}>
      <div className="list-covers">
        {list.books.slice(0, 4).map((id) => {
          const b = books.find((b) => b.id === id);
          return b ? <Cover key={id} book={b} /> : null;
        })}
        {!list.books.length && <BookMarked size={45} />}
        <span className="list-size">
          <ListOrdered size={12} />
          {list.books.length} books
        </span>
      </div>
      <h3>
        {list.title}
        <ArrowRight size={15} />
      </h3>
      <p>{list.description}</p>
    </button>
  );
}
function ListEditor({
  list,
  books,
  onClose,
  onSave,
}: {
  list: ReadingList;
  books: Book[];
  onClose: () => void;
  onSave: (l: ReadingList) => void;
}) {
  const { prefs } = usePreferences();
  const [draft, setDraft] = useState(list);
  const [query, setQuery] = useState("");
  function move(i: number, delta: number) {
    const ids = [...draft.books];
    [ids[i], ids[i + delta]] = [ids[i + delta], ids[i]];
    setDraft({ ...draft, books: ids });
  }
  return (
    <ModalFrame title="Create and rank a list" onClose={onClose} wide>
      <form
        className="list-editor"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...draft, title: draft.title.trim() });
        }}
      >
        <span className="eyebrow">{tr("CURATED BY YOU", prefs.language)}</span>
        <h2>{tr("Your books. Your order.", prefs.language)}</h2>
        <div className="form-row">
          <label>
            {tr("List title", prefs.language)}
            <input
              required
              value={draft.title}
              maxLength={120}
              pattern=".*\S.*"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder={tr(
                "The books I keep coming back to",
                prefs.language,
              )}
            />
          </label>
        </div>
        <label>
          {tr("Description", prefs.language)}
          <textarea
            aria-label={tr("Description", prefs.language)}
            rows={2}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder={tr(
              "What brings these books together?",
              prefs.language,
            )}
          />
        </label>
        <div className="editor-label">
          <span>{tr("RANK YOUR BOOKS", prefs.language)}</span>
          <small>
            {tr("Use the arrows to reorder · assign a tier", prefs.language)}
          </small>
        </div>
        <div className="rank-editor">
          {draft.books.map((id, i) => {
            const b = books.find((b) => b.id === id);
            return b ? (
              <div className="rank-editor-row" key={id}>
                <span className="rank">{i + 1}</span>
                <Cover book={b} />
                <strong>{bookTitle(b, prefs.language)}</strong>
                <select
                  aria-label={`Tier for ${bookTitle(b, prefs.language)}`}
                  value={draft.tiers[id] || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tiers: { ...draft.tiers, [id]: e.target.value },
                    })
                  }
                >
                  <option value="">{tr("No tier", prefs.language)}</option>
                  {["S", "A", "B", "C", "D"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Move ${bookTitle(b, prefs.language)} up`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Move ${bookTitle(b, prefs.language)} down`}
                  disabled={i === draft.books.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${bookTitle(b, prefs.language)} from list`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      books: draft.books.filter((x) => x !== id),
                    })
                  }
                >
                  <X size={15} />
                </button>
              </div>
            ) : null;
          })}
        </div>
        <label>
          {tr("Add from your library", prefs.language)}
          <input
            placeholder={tr("Find a book in your library…", prefs.language)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="add-books">
          {books
            .filter(
              (b) =>
                !draft.books.includes(b.id) &&
                `${bookTitle(b, prefs.language)} ${b.author}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
            )
            .map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() =>
                  setDraft({ ...draft, books: [...draft.books, b.id] })
                }
              >
                <Plus size={14} />
                {bookTitle(b, prefs.language)}
              </button>
            ))}
        </div>
        <button className="button primary" type="submit">
          <Check size={16} />
          {tr("Save collection", prefs.language)}
        </button>
      </form>
    </ModalFrame>
  );
}
function Analytics({ books }: { books: Book[] }) {
  const { prefs } = usePreferences();
  const { read, pages, average } = readingStats(books);
  const year = new Date().getFullYear();
  const ratingCounts = Array.from(
    { length: 10 },
    (_, i) =>
      read.filter(
        (b) => b.rating > 0 && Math.round(b.rating * 2) / 2 === (i + 1) / 2,
      ).length,
  );
  const monthly = Array.from(
    { length: 12 },
    (_, i) =>
      read.filter((b) =>
        b.date.startsWith(`${year}-${String(i + 1).padStart(2, "0")}`),
      ).length,
  );
  function counts(values: string[]) {
    return Object.entries(
      values.reduce<Record<string, number>>(
        (a, v) => ({ ...a, [v]: (a[v] || 0) + 1 }),
        {},
      ),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }
  return (
    <section className="page-section analytics">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {tr("THE BIGGER PICTURE", prefs.language)}
          </span>
          <h1>
            {tr("Your reading,", prefs.language)}
            <br />
            <em>{tr("between the lines.", prefs.language)}</em>
          </h1>
          <p className="page-description">
            {tr(
              "A closer look at the stories that shape your world.",
              prefs.language,
            )}
          </p>
        </div>
        <span className="analytics-badge">
          <BarChart3 size={16} />
          {tr("Your reading insights", prefs.language)}
        </span>
      </div>
      <div className="analytics-metrics">
        <Stat
          icon={BookOpen}
          label={tr("Total books read", prefs.language)}
          value={String(read.length)}
          detail={tr("All-time reading journey", prefs.language)}
        />
        <Stat
          icon={Feather}
          label={tr("Total pages read", prefs.language)}
          value={pages.toLocaleString(
            prefs.language === "de" ? "de-DE" : "en-US",
          )}
          detail={tr("Based on known page counts", prefs.language)}
        />
        <Stat
          icon={Star}
          label={tr("Average rating", prefs.language)}
          value={average.toFixed(2)}
          detail={tr("Across rated, finished books", prefs.language)}
        />
      </div>
      <div className="chart-grid">
        <div className="chart-card">
          <h3>
            {tr("How you rate your reads", prefs.language)}
            <Star size={17} />
          </h3>
          <p>{tr("Rating distribution · finished books", prefs.language)}</p>
          <div className="bars">
            {ratingCounts.map((n, i) => (
              <div className="bar-column" key={i}>
                <span>{n}</span>
                <div
                  className="bar"
                  style={{
                    height: `${n ? Math.max(4, (n / Math.max(...ratingCounts, 1)) * 150) : 2}px`,
                  }}
                />
                <small>{(i + 1) / 2}</small>
              </div>
            ))}
          </div>
          <div className="chart-caption">
            {tr("STAR RATING", prefs.language)}
          </div>
        </div>
        <div className="chart-card">
          <h3>
            {tr("A year in chapters", prefs.language)}
            <BookOpen size={17} />
          </h3>
          <p>
            {tr("Monthly reading volume", prefs.language)} · {year}
          </p>
          <div className="bars green-bars">
            {monthly.map((n, i) => (
              <div className="bar-column" key={i}>
                <span>{n}</span>
                <div
                  className="bar"
                  style={{
                    height: `${n ? Math.max(4, (n / Math.max(...monthly, 1)) * 150) : 2}px`,
                  }}
                />
                <small>
                  {new Date(year, i).toLocaleDateString(
                    prefs.language === "de" ? "de-DE" : "en-US",
                    {
                      month: "short",
                    },
                  )}
                </small>
              </div>
            ))}
          </div>
          <div className="chart-caption">
            {tr("BOOKS FINISHED PER MONTH", prefs.language)}
          </div>
        </div>
        <div className="chart-card">
          <h3>
            {tr("Authors on repeat", prefs.language)}
            <Feather size={17} />
          </h3>
          <p>{tr("The voices you spend time with", prefs.language)}</p>
          <Breakdown values={counts(read.map((b) => b.author))} />
        </div>
        <div className="chart-card">
          <h3>
            {tr("Your literary landscape", prefs.language)}
            <Library size={17} />
          </h3>
          <p>{tr("Top genres & tags · finished books", prefs.language)}</p>
          <Breakdown values={counts(read.flatMap((b) => b.tags))} />
        </div>
      </div>
    </section>
  );
}
function Breakdown({ values }: { values: [string, number][] }) {
  const { prefs } = usePreferences();
  return (
    <div className="breakdown">
      {values.length ? (
        values.map(([label, n], i) => (
          <div key={label}>
            <span className="breakdown-rank">0{i + 1}</span>
            <div>
              <div className="breakdown-label">
                <span>{tr(label, prefs.language)}</span>
                <small>
                  {n}{" "}
                  {prefs.language === "de"
                    ? n === 1
                      ? "Buch"
                      : "Bücher"
                    : n === 1
                      ? "book"
                      : "books"}
                </small>
              </div>
              <div className="progress-track">
                <span style={{ width: `${(n / values[0][1]) * 100}%` }} />
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>
          {tr(
            "Log a finished book to start seeing your patterns.",
            prefs.language,
          )}
        </p>
      )}
    </div>
  );
}
