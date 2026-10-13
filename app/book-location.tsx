"use client";
import type { Book } from "@/lib/data";
import {
  countries,
  countryName,
  locationFor,
  publicationLabel,
  type Publication,
} from "@/lib/geography";
import { usePreferences } from "@/lib/preferences";
export function BookLocationField({
  book,
  onChange,
}: {
  book: Book;
  onChange: (publication: Publication | null | undefined) => void;
}) {
  const { prefs, t } = usePreferences();
  const publication = locationFor(book);
  return (
    <fieldset className="book-location-field">
      <legend>BookMap</legend>
      <p>
        {t(
          "Pins show where a book was published. Correct the publication country here if needed.",
          "Die Karte zeigt, wo ein Buch veröffentlicht wurde. Hier kannst du das Veröffentlichungsland korrigieren.",
        )}
      </p>
      <label>
        {t("Publication country / region", "Veröffentlichungsland / Region")}
        <select
          value={publication?.country || ""}
          onChange={(e) =>
            onChange(
              e.target.value
                ? { country: e.target.value, kind: "manual" }
                : null,
            )
          }
        >
          <option value="">
            {t(
              "Publication country unknown",
              "Veröffentlichungsland unbekannt",
            )}
          </option>
          {[...countries]
            .sort((a, b) =>
              countryName(a.id, prefs.language).localeCompare(
                countryName(b.id, prefs.language),
                prefs.language,
              ),
            )
            .map((c) => (
              <option key={c.id} value={c.id}>
                {countryName(c.id, prefs.language)}
              </option>
            ))}
        </select>
      </label>
      {publication && <p>{publicationLabel(publication, prefs.language)}</p>}
      {publication?.source && (
        <a href={publication.source} target="_blank" rel="noreferrer">
          {t("Publication source", "Veröffentlichungsquelle")} ↗
        </a>
      )}
      {book.publication !== undefined && (
        <button
          type="button"
          className="text-button"
          onClick={() => onChange(undefined)}
        >
          {t("Use catalog suggestion", "Katalogvorschlag verwenden")}
        </button>
      )}
    </fieldset>
  );
}
