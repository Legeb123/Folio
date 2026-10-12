"use client";
import { useCallback, useState } from "react";
import { Check, Heart, SlidersHorizontal } from "lucide-react";
import { bookTitle } from "@/lib/i18n";
import { Book } from "@/lib/data";
import { usePreferences } from "@/lib/preferences";
import { Cover, ModalFrame } from "./components";
export function resolveFavorites(books: Book[], ids: string[]) {
  const chosen = ids
    .map((id) => books.find((b) => b.id === id))
    .filter((b): b is Book => Boolean(b));
  return [
    ...chosen,
    ...books.filter((b) => !chosen.some((c) => c.id === b.id)),
  ].slice(0, 3);
}
export function FavoriteBooksButton({ books }: { books: Book[] }) {
  const { prefs, update, t } = usePreferences();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        className="favorite-books-button"
        aria-label={t("Edit favorite books", "Lieblingsbücher bearbeiten")}
        title={t("Edit favorite books", "Lieblingsbücher bearbeiten")}
        onClick={() => {
          setSelected(
            resolveFavorites(books, prefs.favoriteBookIds).map((b) => b.id),
          );
          setOpen(true);
        }}
      >
        <SlidersHorizontal size={15} />
        <span>{t("Edit favorites", "Favoriten wählen")}</span>
      </button>
      {open && (
        <ModalFrame
          title={t("Your three favorite books", "Deine drei Lieblingsbücher")}
          onClose={close}
        >
          <form
            className="favorite-editor"
            onSubmit={(e) => {
              e.preventDefault();
              update({ favoriteBookIds: selected });
              setOpen(false);
            }}
          >
            <span className="eyebrow">
              <Heart size={14} />
              {t("YOUR PERSONAL TOP THREE", "DEINE PERSÖNLICHEN TOP DREI")}
            </span>
            <h2>
              {t(
                "Give your favorites a place.",
                "Ein Platz für deine Lieblingsbücher.",
              )}
            </h2>
            <p>
              {t(
                "Choose the books you want to show beside your homepage headline. Their order is left to right.",
                "Wähle die Bücher neben deiner Startseiten-Überschrift. Die Reihenfolge ist von links nach rechts.",
              )}
            </p>
            <div className="favorite-slots">
              {Array.from({ length: Math.min(3, books.length) }, (_, i) => {
                const book = books.find((b) => b.id === selected[i]);
                return (
                  <div className="favorite-slot" key={i}>
                    {book && <Cover book={book} />}
                    <label>
                      {t(`Favorite ${i + 1}`, `Lieblingsbuch ${i + 1}`)}
                      <select
                        required
                        aria-label={t(
                          `Favorite ${i + 1}`,
                          `Lieblingsbuch ${i + 1}`,
                        )}
                        value={selected[i] || ""}
                        onChange={(e) =>
                          setSelected((old) =>
                            old.map((id, index) =>
                              index === i ? e.target.value : id,
                            ),
                          )
                        }
                      >
                        {books
                          .filter(
                            (b) =>
                              b.id === selected[i] || !selected.includes(b.id),
                          )
                          .map((b) => (
                            <option value={b.id} key={b.id}>
                              {bookTitle(b, prefs.language)} — {b.author}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                );
              })}
            </div>
            <p className="account-note">
              {books.length
                ? t(
                    "Missing a book? Add it to your library using the search bar first.",
                    "Ein Buch fehlt? Füge es zuerst über die Suche deiner Bibliothek hinzu.",
                  )
                : t(
                    "Add books to your library to choose your favorites.",
                    "Füge Bücher zur Bibliothek hinzu, um Favoriten zu wählen.",
                  )}
            </p>
            <div className="favorite-actions">
              <button
                type="button"
                className="button secondary"
                onClick={close}
              >
                {t("Cancel", "Abbrechen")}
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={!books.length}
              >
                <Check size={15} />
                {t("Save favorites", "Favoriten speichern")}
              </button>
            </div>
          </form>
        </ModalFrame>
      )}
    </>
  );
}
