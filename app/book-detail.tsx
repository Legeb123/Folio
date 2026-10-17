"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  BookmarkPlus,
  Check,
  Copy,
  Plus,
  Trash2,
  Star,
  NotebookPen,
  History,
  SlidersHorizontal,
} from "lucide-react";
import type { Book, ReadingList, Status } from "@/lib/data";
import {
  dimensions,
  overall,
  today,
  duration,
  type Dimension,
  type Background,
} from "@/lib/reading";
import { localizedTitles, mergeTitleMetadata } from "@/lib/localized-titles";
import { bookTitle, bookDescription, hasGerman, statusLabel } from "@/lib/i18n";
import { ContextPanel } from "./context-panel";
import { usePreferences } from "@/lib/preferences";
import { BookLocationField } from "./book-location";
import { ReadingGoalField } from "./reading-goals";
import { Cover, Stars, ModalFrame } from "./components";
export function BookDetail({
  book,
  lists,
  onClose,
  onSave,
  onRemove,
  onAddList,
}: {
  book: Book;
  lists: ReadingList[];
  onClose: () => void;
  onSave: (b: Book) => void;
  onRemove: () => void;
  onAddList: (b: Book, id: string) => void;
}) {
  const { prefs, t } = usePreferences();
  const [draft, setDraft] = useState<Book>({
    ...book,
    criteriaInitialized:
      book.criteriaInitialized ??
      Object.values(book.scores || {}).some((v) => (v || 0) > 0),
    startDate: book.startDate || "",
    quotes: book.quotes || [],
  });
  useEffect(() => {
    const controller = new AbortController();
    localizedTitles([book], prefs.language, controller.signal)
      .then((updates) => {
        const update = updates.get(book.id);
        if (update && !controller.signal.aborted)
          setDraft((current) => mergeTitleMetadata(current, update));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [book.id, prefs.language]);
  const [tags, setTags] = useState(book.tags.join(", "));
  const [tab, setTab] = useState<"log" | "notes" | "context">("log");
  const [preview, setPreview] = useState(0);
  const [description, setDescription] = useState(book.description);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [contextBusy, setContextBusy] = useState(false);
  const [contextError, setContextError] = useState(false);
  const [retry, setRetry] = useState(0);
  const score = draft.rating;
  const average = overall(draft.scores);
  const [revealed, setRevealed] = useState(false);
  const detailed = Object.values(draft.scores || {}).some((v) => (v || 0) > 0);
  const end = draft.date || today();
  const days = duration(draft.startDate || "", end);
  const goalInvalid =
    draft.goalDays !== undefined &&
    (!Number.isInteger(draft.goalDays) ||
      draft.goalDays < 1 ||
      draft.goalDays > 3650);
  const dateInvalid = Boolean(
    (draft.startDate && draft.date && draft.date < draft.startDate) ||
    (draft.startDate && draft.startDate > today()) ||
    draft.date > today(),
  );
  const dateError =
    (draft.startDate || "") > today() || draft.date > today()
      ? t(
          "Reading dates cannot be in the future.",
          "Lesedaten dürfen nicht in der Zukunft liegen.",
        )
      : t(
          "Completion date must be on or after the start date.",
          "Das Abschlussdatum darf nicht vor dem Startdatum liegen.",
        );
  useEffect(() => {
    if (!book.id.startsWith("/works/")) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`https://openlibrary.org${book.id}.json`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (!controller.signal.aborted)
          setDescription(
            typeof d.description === "string"
              ? d.description
              : d.description?.value || book.description,
          );
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [book.id, book.description]);
  useEffect(() => {
    if (
      tab !== "context" ||
      (draft.background?.language === prefs.language &&
        draft.background.version === 2)
    )
      return;
    const controller = new AbortController();
    setContextBusy(true);
    setContextError(false);
    fetch(
      `/api/background?title=${encodeURIComponent(bookTitle(draft, prefs.language))}&author=${encodeURIComponent(book.author)}&lang=${prefs.language}`,
      {
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(18000),
        ]),
      },
    )
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((background: Background) => {
        if (!controller.signal.aborted) setDraft((d) => ({ ...d, background }));
      })
      .catch(() => {
        if (!controller.signal.aborted) setContextError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setContextBusy(false);
      });
    return () => controller.abort();
  }, [tab, prefs.language, retry, book.id, book.author]);
  useEffect(() => {
    if (prefs.language !== "de" || !book.germanMetadataKey || hasGerman(book))
      return;
    const controller = new AbortController();
    fetch("https://openlibrary.org" + book.germanMetadataKey + ".json", {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((metadata) => {
        const text =
          typeof metadata.description === "string"
            ? metadata.description
            : metadata.description?.value;
        if (
          !controller.signal.aborted &&
          typeof text === "string" &&
          metadata.languages?.some((l: { key: string }) =>
            ["/languages/ger", "/languages/deu"].includes(l.key),
          )
        )
          setDraft((d) => ({
            ...d,
            german: {
              title: d.german?.title || metadata.title || book.title,
              description: d.german?.description || text,
            },
          }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [book.id, book.germanMetadataKey, prefs.language]);
  const prepare = (): Book => ({
    ...draft,
    rating: score,
    criteriaInitialized: draft.criteriaInitialized || detailed,
    description,
    tags: [
      ...new Set(
        tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ],
  });
  function save() {
    if (goalInvalid) return;
    if (dateInvalid) {
      setTab("log");
      setError(dateError);
      return;
    }
    onSave(prepare());
  }
  function setDimension(key: Dimension, value: number) {
    setDraft((d) => {
      const scores = { ...d.scores, [key]: value };
      return {
        ...d,
        scores,
        rating: d.criteriaInitialized ? d.rating : overall(scores, d.rating),
      };
    });
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(t("Quote copied.", "Zitat kopiert."));
    } catch {
      setCopyStatus(
        t(
          "Copy unavailable. Select the quote text and copy it manually.",
          "Kopieren nicht verfügbar. Markiere den Zitattext und kopiere ihn manuell.",
        ),
      );
    }
  }
  return (
    <ModalFrame title={bookTitle(draft, prefs.language)} onClose={onClose} wide>
      <div className="book-modal-layout enriched-book">
        <aside>
          <Cover book={draft} />
          <span className="eyebrow">
            {t("YOUR NEXT CHAPTER", "DEIN NÄCHSTES KAPITEL")}
          </span>
          <p>
            {t(
              "Make a little room for a good book.",
              "Ein bisschen Platz für ein gutes Buch.",
            )}
          </p>
          {score > 0 && (
            <div className="overall-aside">
              <strong>{score.toFixed(2)}</strong>
              <Stars value={score} />
              <small>{t("Your rating", "Deine Bewertung")}</small>
            </div>
          )}
        </aside>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <span className="eyebrow">{t("BOOK DETAILS", "BUCHDETAILS")}</span>
          <h2>{bookTitle(draft, prefs.language)}</h2>
          <p className="book-byline">
            {book.author} · {book.year || t("Year unknown", "Jahr unbekannt")}
          </p>
          <p className="description">
            {loading && !hasGerman(draft)
              ? t("Loading work description…", "Beschreibung wird geladen …")
              : bookDescription({ ...draft, description }, prefs.language) ||
                t("No description available.", "Keine Beschreibung verfügbar.")}
          </p>
          {prefs.language === "de" && !hasGerman(draft) && (
            <p className="metadata-notice">
              Keine deutsche Beschreibung vorhanden. Der Originaltext wird
              angezeigt; du kannst unten eine deutsche Fassung ergänzen.
            </p>
          )}
          <div
            className="detail-tabs"
            role="tablist"
            aria-label={t("Book sections", "Buchbereiche")}
          >
            {[
              [
                "log",
                SlidersHorizontal,
                t("Reading & rating", "Lesen & Bewerten"),
              ],
              ["notes", NotebookPen, t("Notes & quotes", "Notizen & Zitate")],
              [
                "context",
                History,
                t("Background & context", "Hintergrund & Kontext"),
              ],
            ].map(([key, Icon, label]) => {
              const I = Icon as typeof History;
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  key={String(key)}
                  onClick={() => setTab(key as typeof tab)}
                >
                  <I size={14} />
                  {String(label)}
                </button>
              );
            })}
          </div>
          {tab === "log" && (
            <div className="detail-panel">
              <label className="field-label">
                {t("Reading status", "Lesestatus")}
              </label>
              <div className="status-switch">
                {(
                  ["Read", "Currently Reading", "Want to Read"] as Status[]
                ).map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={draft.status === s ? "active" : ""}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        status: s,
                        startDate:
                          s === "Currently Reading" && !d.startDate
                            ? today()
                            : d.startDate,
                        date: s === "Read" ? d.date || today() : "",
                      }))
                    }
                  >
                    {draft.status === s && <Check size={13} />}{" "}
                    {statusLabel(s, prefs.language)}
                  </button>
                ))}
              </div>
              <div className="rating-label">
                <label className="field-label">
                  {t("Overall rating", "Gesamtbewertung")}
                </label>
                <span>{(preview || score).toFixed(2)} / 5</span>
              </div>
              <div
                className="rating-control"
                onMouseLeave={() => setPreview(0)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <div className="rating-star" key={n}>
                    <Star className="outline-star" size={30} />
                    <span
                      className="filled-star"
                      style={{
                        width: `${Math.min(1, Math.max(0, (preview || score) - n + 1)) * 100}%`,
                      }}
                    >
                      <Star size={30} fill="currentColor" />
                    </span>
                    {[n - 0.5, n].map((v) => (
                      <button
                        type="button"
                        key={v}
                        aria-label={t(
                          `Rate ${v} stars`,
                          `${v} Sterne vergeben`,
                        )}
                        aria-pressed={score === v}
                        onMouseEnter={() => setPreview(v)}
                        onFocus={() => !detailed && setPreview(v)}
                        onBlur={() => setPreview(0)}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            rating: v,
                            criteriaInitialized: true,
                          })
                        }
                      />
                    ))}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setDraft({
                      ...draft,
                      rating: 0,
                      criteriaInitialized: true,
                    });
                    setPreview(0);
                  }}
                >
                  {t("Clear", "Zurücksetzen")}
                </button>
              </div>
              <p className="account-note">
                {t(
                  "The sliders set your initial stars until you save or choose stars yourself. After that, both ratings stay independent. Zero excludes a dimension.",
                  "Die Regler setzen anfangs die Sterne, bis du speicherst oder selbst Sterne vergibst. Danach bleiben beide Bewertungen unabhängig. 0 lässt ein Kriterium unbewertet.",
                )}
              </p>
              <p className="criteria-average">
                {t("Criteria average", "Kriterien-Durchschnitt")}:{" "}
                <strong>{average.toFixed(2)} / 5</strong>
              </p>
              <div className="dimension-ratings">
                {dimensions.map(([key, en, de]) => (
                  <label key={key}>
                    <span>
                      {t(en, de)}
                      <output>
                        {draft.scores?.[key]
                          ? draft.scores[key]!.toFixed(1)
                          : t("Not rated", "Unbewertet")}
                      </output>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      aria-label={t(en, de)}
                      value={draft.scores?.[key] || 0}
                      onChange={(e) =>
                        setDimension(key, Number(e.target.value))
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="form-row">
                <label>
                  {t("Start Date", "Startdatum")}
                  <input
                    type="date"
                    value={draft.startDate || ""}
                    max={draft.date || today()}
                    onChange={(e) => {
                      setError("");
                      setDraft({ ...draft, startDate: e.target.value });
                    }}
                  />
                </label>
                <label>
                  {t("Completion Date", "Abschlussdatum")}
                  <input
                    type="date"
                    value={draft.date}
                    min={draft.startDate || undefined}
                    max={today()}
                    onChange={(e) => {
                      setError("");
                      setDraft({
                        ...draft,
                        date: e.target.value,
                        status: e.target.value ? "Read" : draft.status,
                      });
                    }}
                  />
                </label>
              </div>
              {dateInvalid && (
                <p className="field-error" role="alert">
                  {dateError}
                </p>
              )}
              {days !== null && !dateInvalid && (
                <div className="reading-duration">
                  {t("Reading duration", "Lesedauer")}:{" "}
                  <strong>
                    {days}{" "}
                    {t(
                      days === 1 ? "day" : "days",
                      days === 1 ? "Tag" : "Tage",
                    )}
                  </strong>{" "}
                  ·{" "}
                  {draft.date
                    ? t(
                        "including start and completion dates",
                        "inklusive Start- und Abschlusstag",
                      )
                    : t("so far", "bisher")}
                </div>
              )}
              <BookLocationField
                book={draft}
                onChange={(publication) => setDraft({ ...draft, publication })}
              />
              <ReadingGoalField
                book={draft}
                onChange={(goalDays) => setDraft({ ...draft, goalDays })}
              />
              <div className="form-row">
                <label>
                  {t("Total pages", "Seiten insgesamt")}
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={draft.pages || ""}
                    placeholder={t("Unknown", "Unbekannt")}
                    onChange={(e) =>
                      setDraft({ ...draft, pages: Number(e.target.value) })
                    }
                  />
                </label>
                {draft.status === "Currently Reading" && (
                  <label>
                    {t("Pages read", "Gelesene Seiten")}
                    <input
                      type="number"
                      min="0"
                      max={draft.pages || 100000}
                      value={draft.progress}
                      onChange={(e) =>
                        setDraft({ ...draft, progress: Number(e.target.value) })
                      }
                    />
                  </label>
                )}
              </div>
              <label>
                {t("Tags", "Schlagwörter")}
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t(
                    "Fiction, Philosophy, Favorite…",
                    "Belletristik, Philosophie, Favorit …",
                  )}
                />
              </label>
              <label>
                {t("Your review", "Deine Rezension")}
                <textarea
                  aria-label={t("Your review", "Deine Rezension")}
                  rows={3}
                  value={draft.review}
                  onChange={(e) =>
                    setDraft({ ...draft, review: e.target.value })
                  }
                  placeholder={t(
                    "What stayed with you?",
                    "Was bleibt dir in Erinnerung?",
                  )}
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={draft.spoiler}
                  onChange={(e) =>
                    setDraft({ ...draft, spoiler: e.target.checked })
                  }
                />
                {t(
                  "This review contains spoilers",
                  "Diese Rezension enthält Spoiler",
                )}
              </label>
              {prefs.language === "de" && (
                <details className="german-metadata">
                  <summary>Deutschen Titel und Beschreibung bearbeiten</summary>
                  <p>
                    Originaltitel, eigene Notizen und Rezensionen bleiben
                    unverändert.
                  </p>
                  <label>
                    Deutscher Titel
                    <input
                      value={draft.german?.title ?? bookTitle(book, "de")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          german: {
                            title: e.target.value,
                            description:
                              draft.german?.description ??
                              (hasGerman(book)
                                ? bookDescription(book, "de")
                                : ""),
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    Deutsche Beschreibung
                    <textarea
                      value={
                        draft.german?.description ??
                        (hasGerman(book) ? bookDescription(book, "de") : "")
                      }
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          german: {
                            title: draft.german?.title ?? bookTitle(book, "de"),
                            description: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                </details>
              )}
            </div>
          )}
          {tab === "notes" && (
            <div className="detail-panel notes-panel">
              <h3>{t("Your reading notebook", "Dein Lesenotizbuch")}</h3>
              <p>
                {t(
                  "A space for your own words. Notes and quotes stay in the language you write them.",
                  "Platz für deine eigenen Worte. Notizen und Zitate bleiben in der Sprache, in der du sie schreibst.",
                )}
              </p>
              <label>
                {t("Personal thoughts", "Persönliche Gedanken")}
                <textarea
                  aria-label={t("Personal thoughts", "Persönliche Gedanken")}
                  rows={4}
                  value={draft.thoughts || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, thoughts: e.target.value })
                  }
                />
              </label>
              <label>
                {t("Key takeaways", "Wichtigste Erkenntnisse")}
                <textarea
                  aria-label={t("Key takeaways", "Wichtigste Erkenntnisse")}
                  rows={4}
                  placeholder={t(
                    "One idea per line…",
                    "Ein Gedanke pro Zeile …",
                  )}
                  value={draft.takeaways || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, takeaways: e.target.value })
                  }
                />
              </label>
              <div className="quotes-heading">
                <h3>{t("Quotes", "Zitate")}</h3>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      quotes: [
                        ...(draft.quotes || []),
                        { id: crypto.randomUUID(), text: "", page: "" },
                      ],
                    })
                  }
                >
                  <Plus size={14} />
                  {t("Add quote", "Zitat hinzufügen")}
                </button>
              </div>
              {!draft.quotes?.length && (
                <p className="account-note">
                  {t(
                    "Keep the passages you want to return to.",
                    "Bewahre Stellen auf, zu denen du zurückkehren möchtest.",
                  )}
                </p>
              )}
              {draft.quotes?.map((q, i) => (
                <div className="quote-entry" key={q.id}>
                  <label>
                    {t(`Quote ${i + 1}`, `Zitat ${i + 1}`)}
                    <textarea
                      aria-label={t(`Quote ${i + 1}`, `Zitat ${i + 1}`)}
                      value={q.text}
                      rows={3}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          quotes: draft.quotes!.map((x) =>
                            x.id === q.id ? { ...x, text: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <div>
                    <label>
                      {t("Page / location", "Seite / Position")}
                      <input
                        value={q.page}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            quotes: draft.quotes!.map((x) =>
                              x.id === q.id
                                ? { ...x, page: e.target.value }
                                : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      className="icon-button"
                      type="button"
                      disabled={!q.text}
                      aria-label={t(
                        `Copy quote ${i + 1}`,
                        `Zitat ${i + 1} kopieren`,
                      )}
                      onClick={() => copy(q.text)}
                    >
                      <Copy size={17} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={t(
                        `Delete quote ${i + 1}`,
                        `Zitat ${i + 1} löschen`,
                      )}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          quotes: draft.quotes!.filter((x) => x.id !== q.id),
                        })
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
              {copyStatus && (
                <p role="status" className="account-note">
                  {copyStatus}
                </p>
              )}
            </div>
          )}
          {tab === "context" && (
            <ContextPanel
              book={draft}
              busy={contextBusy}
              error={contextError}
              onRetry={() => setRetry((n) => n + 1)}
              revealed={revealed}
              onReveal={() => setRevealed((v) => !v)}
              onNotes={(contextNotes) => setDraft({ ...draft, contextNotes })}
            />
          )}
          {goalInvalid && (
            <p className="field-error" role="alert">
              {t(
                "Choose a whole number of days between 1 and 3650, or remove the goal.",
                "Wähle eine ganze Zahl zwischen 1 und 3650 Tagen oder entferne das Ziel.",
              )}
            </p>
          )}
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              type="button"
              disabled={dateInvalid || goalInvalid}
              onClick={() => setPicker(!picker)}
            >
              <BookmarkPlus size={16} />
              {t("Add to list", "Zu Sammlung hinzufügen")}
            </button>
            <button
              className="button primary"
              type="submit"
              disabled={dateInvalid || goalInvalid}
            >
              <Check size={16} />
              {t("Save to library", "In Bibliothek speichern")}
            </button>
          </div>
          {picker && (
            <div className="list-picker">
              {lists.length ? (
                lists.map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => {
                      if (!dateInvalid && !goalInvalid)
                        onAddList(prepare(), l.id);
                      setPicker(false);
                    }}
                  >
                    {l.title}
                    {l.books.includes(book.id) ? (
                      <Check size={15} />
                    ) : (
                      <Plus size={15} />
                    )}
                  </button>
                ))
              ) : (
                <p>
                  {t(
                    "Create a list in Custom Lists first.",
                    "Erstelle zuerst eine Sammlung.",
                  )}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            className="text-button danger"
            onClick={onRemove}
          >
            {t("Remove from library", "Aus Bibliothek entfernen")}
          </button>
        </form>
      </div>
    </ModalFrame>
  );
}
