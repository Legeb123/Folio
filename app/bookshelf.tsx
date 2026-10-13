"use client";
import { Grid2X2, Library } from "lucide-react";
import type { Book } from "@/lib/data";
import { usePreferences, type ShelfStyle } from "@/lib/preferences";
import { bookTitle, statusLabel } from "@/lib/i18n";
import { BookCard } from "./components";
export function LibraryViewSwitcher({ onChange }: { onChange?: () => void }) {
  const { prefs, update, t } = usePreferences();
  const options: [ShelfStyle, string, string][] = [
    ["simple", "Simple View", "Einfache Ansicht"],
    ["rustic", "Rustic Wooden Bookshelf", "Rustikales Holzregal"],
    ["white", "Modern White Bookshelf", "Modernes weißes Regal"],
  ];
  return (
    <div
      className="shelf-switcher"
      role="group"
      aria-label={t("Library appearance", "Bibliotheksansicht")}
    >
      {options.map(([style, en, de]) => (
        <button
          type="button"
          key={style}
          className={prefs.shelfStyle === style ? "active" : ""}
          aria-pressed={prefs.shelfStyle === style}
          onClick={() => {
            update({ shelfStyle: style, libraryView: "grid" });
            onChange?.();
          }}
        >
          <span className={`shelf-swatch swatch-${style}`} aria-hidden="true">
            {style === "simple" ? <Grid2X2 size={16} /> : <Library size={16} />}
          </span>
          {t(en, de)}
        </button>
      ))}
    </div>
  );
}
export function Bookshelf({
  books,
  onOpen,
  onStatus,
  wishlist = false,
}: {
  books: Book[];
  onOpen: (book: Book) => void;
  onStatus: (book: Book, status: Book["status"]) => void;
  wishlist?: boolean;
}) {
  const { prefs, t } = usePreferences();
  return (
    <div
      className={`bookshelf bookshelf-${prefs.shelfStyle}`}
      role="list"
      aria-label={t("Books on your shelf", "Bücher in deinem Regal")}
    >
      {books.map((book) => (
        <div key={book.id} className="shelf-slot" role="listitem">
          <BookCard book={book} onOpen={onOpen} />
          <select
            className="quick-status"
            aria-label={t(
              `Status for ${bookTitle(book, prefs.language)}`,
              `Status für ${bookTitle(book, prefs.language)}`,
            )}
            value={book.status}
            onChange={(e) => onStatus(book, e.target.value as Book["status"])}
          >
            {(["Want to Read", "Currently Reading", "Read"] as const).map(
              (status) => (
                <option key={status} value={status}>
                  {statusLabel(status, prefs.language)}
                </option>
              ),
            )}
          </select>
          {wishlist && (
            <div className="shelf-queue-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => onOpen(book)}
              >
                {book.goalDays
                  ? t(
                      `Goal: ${book.goalDays} days`,
                      `Ziel: ${book.goalDays} Tage`,
                    )
                  : t("Set reading goal", "Leseziel setzen")}
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => onStatus(book, "Currently Reading")}
              >
                {t("Start reading", "Lesen beginnen")}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
