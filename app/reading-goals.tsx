"use client";
import { useState } from "react";
import type { Book } from "@/lib/data";
import { today } from "@/lib/reading";
import { bookTitle, statusLabel } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import { ModalFrame } from "./components";
export function goalDeadline(book: Book) {
  if (!book.goalDays || !book.startDate) return "";
  const date = new Date(book.startDate + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + book.goalDays - 1);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
export function ReadingGoalField({
  book,
  onChange,
}: {
  book: Book;
  onChange: (days: number | undefined) => void;
}) {
  const { prefs, t } = usePreferences();
  const deadline = goalDeadline(book);
  return (
    <div className="book-goal-field">
      <label>
        {t("Reading goal (days)", "Leseziel (Tage)")}
        <input
          type="number"
          min="1"
          max="3650"
          step="1"
          value={book.goalDays ?? ""}
          placeholder={t("Optional, e.g. 14", "Optional, z. B. 14")}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : undefined)
          }
        />
      </label>
      <small>
        {deadline
          ? t("Finish by", "Fertig bis") +
            " " +
            new Date(deadline + "T12:00:00").toLocaleDateString(
              prefs.language === "de" ? "de-DE" : "en-GB",
            )
          : t(
              "Your estimate starts on the first reading day. Leave blank for no goal.",
              "Deine Schätzung beginnt am ersten Lesetag. Ohne Ziel einfach leer lassen.",
            )}
      </small>
      {book.goalDays !== undefined && (
        <button
          type="button"
          className="text-button"
          onClick={() => onChange(undefined)}
        >
          {t("Remove book goal", "Buchziel entfernen")}
        </button>
      )}
    </div>
  );
}
export function StartReadingGoal({
  book,
  onClose,
  onSave,
}: {
  book: Book;
  onClose: () => void;
  onSave: (book: Book) => void;
}) {
  const { prefs, t } = usePreferences();
  const [draft, setDraft] = useState(book);
  return (
    <ModalFrame
      title={t("Your next chapter", "Dein nächstes Kapitel")}
      onClose={onClose}
    >
      <form
        className="simple-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
      >
        <h2>{bookTitle(book, prefs.language)}</h2>
        <p>
          {t(
            "How long would you like to take? Set an optional reading goal before you begin.",
            "Wie viel Zeit möchtest du dir nehmen? Setze vor dem Start ein optionales Leseziel.",
          )}
        </p>
        <ReadingGoalField
          book={draft}
          onChange={(goalDays) => setDraft({ ...draft, goalDays })}
        />
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => onSave({ ...draft, goalDays: undefined })}
          >
            {t("Start without a goal", "Ohne Ziel starten")}
          </button>
          <button className="button primary" type="submit">
            {t("Start reading", "Lesen beginnen")}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}
export function BookGoals({
  books,
  onOpen,
}: {
  books: Book[];
  onOpen: (book: Book) => void;
}) {
  const { prefs, t } = usePreferences();
  const goals = books
    .filter((b) => b.goalDays)
    .sort((a, b) =>
      (goalDeadline(a) || "9999").localeCompare(goalDeadline(b) || "9999"),
    );
  return (
    <section className="individual-goals">
      <h3>{t("Individual book goals", "Individuelle Buchziele")}</h3>
      <p>
        {t(
          "All books with a reading estimate, including planned and completed goals.",
          "Alle Bücher mit einer Leseschätzung, auch geplante und abgeschlossene Ziele.",
        )}
      </p>
      {!goals.length && (
        <p>
          {t(
            "No book goals yet. Add one in your wishlist or book details.",
            "Noch keine Buchziele. Ergänze eines in der Leseliste oder den Buchdetails.",
          )}
        </p>
      )}
      {goals.map((book) => {
        const deadline = goalDeadline(book);
        const state =
          book.status === "Read"
            ? deadline && book.date
              ? book.date <= deadline
                ? t("Completed on time", "Rechtzeitig abgeschlossen")
                : t("Completed after target", "Nach dem Ziel abgeschlossen")
              : statusLabel(book.status, prefs.language)
            : !deadline || book.status === "Want to Read"
              ? t("Planned", "Geplant")
              : deadline < today()
                ? t("Past target", "Zieldatum überschritten")
                : t("In progress", "In Arbeit");
        return (
          <button
            className="individual-goal"
            key={book.id}
            onClick={() => onOpen(book)}
            type="button"
          >
            <span>
              <strong>{bookTitle(book, prefs.language)}</strong>
              <small>
                {book.goalDays} {t("days", "Tage")}
                {deadline &&
                  ` · ${t("Target", "Ziel")}: ${new Date(deadline + "T12:00:00").toLocaleDateString(prefs.language === "de" ? "de-DE" : "en-GB")}`}
              </small>
            </span>
            <span>{state} →</span>
          </button>
        );
      })}
    </section>
  );
}
