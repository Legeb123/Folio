"use client";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import type { Book } from "@/lib/data";
import { curatedContext } from "@/lib/context";
import { usePreferences } from "@/lib/preferences";
export function ContextPanel({
  book,
  busy,
  error,
  onRetry,
  revealed,
  onReveal,
  onNotes,
}: {
  book: Book;
  busy: boolean;
  error: boolean;
  onRetry: () => void;
  revealed: boolean;
  onReveal: () => void;
  onNotes: (text: string) => void;
}) {
  const { prefs, t } = usePreferences();
  const curated = curatedContext(book, prefs.language);
  const reference =
    book.background?.version === 2 &&
    book.background.language === prefs.language
      ? book.background
      : undefined;
  const message = curated?.message || reference?.message;
  return (
    <div className="detail-panel context-panel">
      <h3>
        {t("History of origin & motivation", "Entstehung & Schreibmotivation")}
      </h3>
      <p>
        {t(
          "How this book came to be. This overview avoids plot details; interpretations are kept behind the spoiler reveal below.",
          "Wie dieses Buch entstand. Dieser Überblick vermeidet Handlungsdetails; Interpretationen bleiben unten hinter dem Spoilerschutz.",
        )}
      </p>
      {curated ? (
        <article>
          <span className="eyebrow">
            {t("SPOILER-FREE BACKGROUND", "SPOILERFREIER HINTERGRUND")}
          </span>
          <h4>{curated.period}</h4>
          <p>{curated.text}</p>
          <a href={curated.url} target="_blank" rel="noreferrer">
            {curated.source} ↗
          </a>
        </article>
      ) : (
        <p className="metadata-notice">
          {t(
            "A verified, spoiler-free account of this book’s origin and writing motivation is not available yet. We leave this open rather than infer the author’s intent from a biography.",
            "Ein geprüfter, spoilerfreier Text zur Entstehung und Schreibmotivation dieses Buchs ist noch nicht verfügbar. Wir leiten keine Schreibabsicht aus einer Biografie ab.",
          )}
        </p>
      )}
      <label>
        {t(
          "Your historical / literary notes",
          "Deine historischen / literarischen Notizen",
        )}
        <textarea
          aria-label={t(
            "Your historical / literary notes",
            "Deine historischen / literarischen Notizen",
          )}
          rows={4}
          value={book.contextNotes || ""}
          onChange={(e) => onNotes(e.target.value)}
          placeholder={t(
            "Add your own research and sources…",
            "Eigene Recherche und Quellen ergänzen …",
          )}
        />
      </label>
      <article className="message-panel">
        <h3>
          {t("Main message & key points", "Kernaussage & zentrale Gedanken")}
        </h3>
        <p>
          {t(
            "Interpretations may reveal themes and story developments.",
            "Interpretationen können Themen und Entwicklungen der Handlung verraten.",
          )}
        </p>
        <div className="spoiler-content" data-revealed={revealed}>
          {revealed ? (
            <div id="book-message">
              {busy && !message && (
                <p role="status">
                  <LoaderCircle size={14} className="spin" />{" "}
                  {t("Loading key points…", "Kerngedanken werden geladen …")}
                </p>
              )}
              {message ? (
                <>
                  <p>{message}</p>
                  <small>
                    {t(
                      "A reading of the work, not the only possible interpretation.",
                      "Eine Lesart des Werks, nicht die einzig mögliche Interpretation.",
                    )}
                  </small>
                  {!curated && reference && (
                    <>
                      <a href={reference.url} target="_blank" rel="noreferrer">
                        Wikipedia · {reference.title} ↗
                      </a>
                      <small>
                        {t(
                          "Excerpt: CC BY-SA. Check the source matches this book.",
                          "Auszug: CC BY-SA. Prüfe, ob die Quelle zu diesem Buch gehört.",
                        )}
                      </small>
                    </>
                  )}
                </>
              ) : (
                !busy && (
                  <p>
                    {t(
                      "No sourced interpretation is available yet. You can keep your own key takeaways in Notes & quotes.",
                      "Noch keine belegte Interpretation verfügbar. Eigene Erkenntnisse kannst du unter Notizen & Zitate festhalten.",
                    )}
                  </p>
                )
              )}
              {error && !message && (
                <button type="button" className="text-button" onClick={onRetry}>
                  {t("Retry", "Erneut versuchen")}
                </button>
              )}
            </div>
          ) : (
            <div className="blurred-message" aria-hidden="true">
              <p>
                {t(
                  "Themes, meaning and the ideas that stay with you. Reveal the interpretation when you are ready to explore the book more deeply.",
                  "Themen, Bedeutung und die Gedanken, die bleiben. Zeige die Interpretation, wenn du das Buch näher betrachten möchtest.",
                )}
              </p>
              <p>••••• •••••••• •••••• •••••••</p>
            </div>
          )}
          <button
            type="button"
            className="button secondary spoiler-reveal"
            aria-expanded={revealed}
            onClick={onReveal}
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
            {revealed
              ? t("Hide spoilers", "Spoiler verbergen")
              : t("Reveal spoilers", "Spoiler anzeigen")}
          </button>
        </div>
      </article>
    </div>
  );
}
