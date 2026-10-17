"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Search,
  Star,
  X,
  Check,
  LoaderCircle,
  BookmarkPlus,
  Plus,
} from "lucide-react";
import { germanFromSearch, type GermanSearchMetadata } from "@/lib/openlibrary";
import { usePreferences } from "@/lib/preferences";
import { bookTitle, tr, statusLabel } from "@/lib/i18n";
import { Book, ReadingList, Status } from "@/lib/data";

export function Cover({
  book,
  className = "",
}: {
  book: Book;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const { prefs } = usePreferences();
  useEffect(() => setFailed(false), [book.cover]);
  return (
    <div className={`cover ${className}`}>
      {!failed && book.cover && prefs.cover === "modern" ? (
        <img
          src={book.cover}
          alt={`${bookTitle(book, prefs.language)} cover`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={`cover-fallback ${prefs.cover === "minimalist" ? "minimalist-cover" : prefs.cover === "leather" ? "leather-cover" : ""}`}
        >
          <BookOpen />
          <strong>{bookTitle(book, prefs.language)}</strong>
          <span>{book.author}</span>
        </div>
      )}
    </div>
  );
}
export function Stars({ value }: { value: number }) {
  const { prefs } = usePreferences();
  return (
    <span
      className="stars"
      aria-label={
        prefs.language === "de"
          ? `${value} von 5 Sternen`
          : `${value} out of 5 stars`
      }
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span className="star" key={n}>
          <Star size={13} />
          <span
            style={{
              width: `${Math.min(1, Math.max(0, value - n + 1)) * 100}%`,
            }}
          >
            <Star size={13} fill="currentColor" />
          </span>
        </span>
      ))}
    </span>
  );
}
export function BookCard({
  book,
  onOpen,
}: {
  book: Book;
  onOpen: (b: Book) => void;
}) {
  const { prefs } = usePreferences();
  return (
    <button className="book-card" onClick={() => onOpen(book)}>
      <div className="poster">
        <Cover book={book} />
        {book.status === "Currently Reading" && (
          <span
            className="reading-dot"
            title={tr("Currently reading", prefs.language)}
          />
        )}
        <div className="poster-overlay">
          <BookOpen size={21} />
          <span>{tr("View book", prefs.language)}</span>
          <small>{statusLabel(book.status, prefs.language)}</small>
        </div>
      </div>
      <strong title={bookTitle(book, prefs.language)}>
        {bookTitle(book, prefs.language)}
      </strong>
      <span className="book-author">{book.author}</span>
      <div className="book-rating">
        {book.rating > 0 ? (
          <>
            <Stars value={book.rating} />
            <span>{book.rating.toFixed(1)}</span>
          </>
        ) : (
          <span className="muted">
            <BookmarkPlus size={12} />{" "}
            {tr("On your reading list", prefs.language)}
          </span>
        )}
      </div>
    </button>
  );
}
export function SearchBox({
  onSelect,
  books,
  inputRef,
}: {
  onSelect: (b: Book) => void;
  books: Book[];
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { prefs } = usePreferences();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);
  useEffect(() => {
    setActive(-1);
    if (query.trim().length < 2) {
      setResults([]);
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(`(${query}) language:${prefs.language === "de" ? "ger" : "eng"}`)}&limit=8&lang=${prefs.language}&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median,editions,editions.key,editions.title,editions.language`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(10000),
            ]),
          },
        );
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        setResults(
          (data.docs || []).map(
            (d: {
              key: string;
              title: string;
              author_name?: string[];
              first_publish_year?: number;
              cover_i?: number;
              number_of_pages_median?: number;
              editions?: GermanSearchMetadata["editions"];
            }) =>
              books.find((b) => b.id === d.key) || {
                id: d.key,
                title: d.title,
                author: d.author_name?.[0] || "Unknown author",
                year: d.first_publish_year || 0,
                cover: d.cover_i
                  ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
                  : "",
                pages: d.number_of_pages_median || 0,
                status: "Want to Read",
                rating: 0,
                date: "",
                tags: [],
                review: "",
                spoiler: false,
                description: "",
                progress: 0,
                ...germanFromSearch(d),
              },
          ),
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setResults(
            books.filter((b) =>
              `${bookTitle(b, prefs.language)} ${b.author}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ),
          );
          setError(
            prefs.language === "de"
              ? "Open Library ist gerade nicht verfügbar. Angezeigt werden Treffer aus deiner Bibliothek."
              : "Open Library is unavailable. Showing matches from your library.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, books, prefs.language]);
  function select(b: Book) {
    onSelect(b);
    setOpen(false);
    setQuery("");
  }
  return (
    <div className="search-container" ref={container}>
      <Search size={17} />
      <input
        ref={inputRef}
        aria-label={tr("Search books and authors", prefs.language)}
        role="combobox"
        aria-expanded={open && query.length >= 2}
        aria-controls="search-results"
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `result-${active}` : undefined}
        placeholder={tr("Search books, authors...", prefs.language)}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((n) => Math.min(n + 1, results.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((n) => Math.max(0, n - 1));
          }
          if (e.key === "Enter" && results[active]) select(results[active]);
        }}
      />
      <kbd>/</kbd>
      {open && query.length >= 2 && (
        <div className="search-results" id="search-results" role="listbox">
          {busy ? (
            <p>
              <LoaderCircle className="spin" size={16} />{" "}
              {prefs.language === "de"
                ? "Bücher werden gesucht …"
                : "Searching the shelves…"}
            </p>
          ) : (
            <>
              {error && <p className="search-error">{error}</p>}
              {results.map((b, i) => (
                <button
                  role="option"
                  aria-selected={active === i}
                  id={`result-${i}`}
                  className={active === i ? "selected" : ""}
                  key={b.id}
                  onClick={() => select(b)}
                >
                  <Cover book={b} />
                  <span>
                    <strong>{bookTitle(b, prefs.language)}</strong>
                    <small>
                      {b.author} · {b.year || "Year unknown"}
                    </small>
                  </span>
                  <Plus size={16} />
                </button>
              ))}
              {results.length === 0 && (
                <p>
                  {prefs.language === "de"
                    ? "Keine Bücher gefunden. Suche nach Titel oder Autor."
                    : "No books found. Try a title or author."}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
export function ModalFrame({
  children,
  title,
  onClose,
  wide = false,
  dismissible = true,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
  dismissible?: boolean;
}) {
  const { prefs } = usePreferences();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
      if (e.key === "Tab") {
        const elements = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [onClose, dismissible]);
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        {dismissible && (
          <button
            className="icon-button modal-close"
            aria-label={tr("Close dialog", prefs.language)}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
export { BookDetail as BookModal } from "./book-detail";
