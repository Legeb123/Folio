"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Globe,
  Layers,
  Settings2,
  Sparkles,
  Target,
  Library,
  LogOut,
} from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { genres, usePreferences } from "@/lib/preferences";
import { ModalFrame } from "./components";
const genreDE: Record<string, string> = {
  "Sci-Fi": "Science-Fiction",
  History: "Geschichte",
  Classics: "Klassiker",
  Fantasy: "Fantasy",
  "Non-Fiction": "Sachbücher",
  Fiction: "Belletristik",
  Philosophy: "Philosophie",
  Mystery: "Krimi",
  Biography: "Biografie",
  Romance: "Liebesromane",
};
function Languages() {
  const { prefs, update, t } = usePreferences();
  return (
    <div className="language-options">
      {(["en", "de"] as const).map((lang, i) => (
        <button
          key={lang}
          type="button"
          aria-pressed={prefs.language === lang}
          className={prefs.language === lang ? "chosen" : ""}
          onClick={() => update({ language: lang })}
        >
          <span className="language-symbol">{lang.toUpperCase()}</span>
          <span>
            <strong>{i ? "Deutsch" : "English"}</strong>
            <small>{i ? "German" : "Englisch"}</small>
          </span>
          {prefs.language === lang && <Check size={18} />}
        </button>
      ))}
      <p>
        {t(
          "You can change your language anytime in settings.",
          "Du kannst deine Sprache jederzeit in den Einstellungen ändern.",
        )}
      </p>
    </div>
  );
}
function Genres() {
  const { prefs, update, t } = usePreferences();
  return (
    <div className="genre-options">
      {genres.map((g) => (
        <button
          type="button"
          key={g}
          aria-pressed={prefs.genres.includes(g)}
          className={prefs.genres.includes(g) ? "chosen" : ""}
          onClick={() =>
            update({
              genres: prefs.genres.includes(g)
                ? prefs.genres.filter((x) => x !== g)
                : [...prefs.genres, g],
            })
          }
        >
          {prefs.genres.includes(g) ? (
            <Check size={14} />
          ) : (
            <span aria-hidden="true">+</span>
          )}
          {t(g, genreDE[g])}
        </button>
      ))}
    </div>
  );
}
function GoogleButton() {
  const { t } = usePreferences();
  const [account, setAccount] = useState<{
    configured: boolean;
    user: { name?: string; email?: string } | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/account", { signal: AbortSignal.timeout(10000) })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setAccount)
      .catch(() =>
        setError(
          t(
            "Sign-in is temporarily unavailable. You can continue without an account.",
            "Die Anmeldung ist gerade nicht verfügbar. Du kannst ohne Konto fortfahren.",
          ),
        ),
      );
    if (new URLSearchParams(location.search).has("error"))
      setError(
        t(
          "Sign-in was not completed. Try again or continue without an account.",
          "Die Anmeldung wurde nicht abgeschlossen. Versuche es erneut oder fahre ohne Konto fort.",
        ),
      );
  }, [t]);
  return (
    <div className="account-section">
      {account?.user ? (
        <>
          <p className="signed-in">
            <Check size={16} />
            {account.user.name || account.user.email}
          </p>
          <button
            className="text-button"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut size={14} />
            {t("Sign out", "Abmelden")}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="google-button"
          disabled={!account?.configured || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signIn("google", { callbackUrl: "/" });
            } catch {
              setError(
                t(
                  "Sign-in failed. Please try again.",
                  "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
                ),
              );
              setBusy(false);
            }
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285f4"
              d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c2-1.8 2.9-4.3 2.9-7.5Z"
            />
            <path
              fill="#34a853"
              d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.6A10 10 0 0 0 12 22Z"
            />
            <path
              fill="#fbbc05"
              d="M6.4 14a6 6 0 0 1 0-4V7.4H3a10 10 0 0 0 0 9.2L6.4 14Z"
            />
            <path
              fill="#ea4335"
              d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4L6.4 10c.8-2.4 3-4.2 5.6-4.2Z"
            />
          </svg>
          {busy
            ? t("Connecting…", "Verbinden…")
            : t("Continue with Google", "Mit Google fortfahren")}
        </button>
      )}
      {!account?.user && (
        <p className="account-note">
          {error ||
            (!account
              ? t("Checking sign-in availability…", "Anmeldung wird geprüft…")
              : !account.configured
                ? t(
                    "Google sign-in is not set up yet. Continue without an account.",
                    "Google-Anmeldung ist noch nicht eingerichtet. Fahre ohne Konto fort.",
                  )
                : t(
                    "Optional. Your reading data stays on this device.",
                    "Optional. Deine Lesedaten bleiben auf diesem Gerät.",
                  ))}
        </p>
      )}
    </div>
  );
}
export function Experience({ children }: { children: React.ReactNode }) {
  const { prefs, update, t, warning } = usePreferences();
  const noop = useCallback(() => {}, []);
  const step = prefs.step;
  const titles = [
    t("Your next chapter starts here.", "Dein nächstes Kapitel beginnt hier."),
    t("Make yourself at home.", "Fühl dich wie zu Hause."),
    t("What draws you in?", "Welche Geschichten begeistern dich?"),
    t(
      "A little more reading. A little more you.",
      "Mehr lesen. Mehr entdecken. Mehr du.",
    ),
  ];
  return (
    <>
      <div inert={!prefs.completed}>{children}</div>
      {!prefs.completed && (
        <ModalFrame
          title={t("Welcome to BookTracker", "Willkommen bei BookTracker")}
          onClose={noop}
          wide
          dismissible={false}
        >
          <div className="onboarding">
            <aside className="onboarding-art">
              <span className="eyebrow">FOLIO / BOOKTRACKER</span>
              <div className="onboarding-books">
                <div>
                  ONE
                  <br />
                  MORE
                  <br />
                  <em>chapter.</em>
                </div>
                <div>
                  <BookOpen size={45} />
                  <span>
                    A LIFE
                    <br />
                    IN BOOKS
                  </span>
                </div>
                <div>
                  THE
                  <br />
                  STORIES
                  <br />
                  WE KEEP
                </div>
              </div>
              <h2>
                {t(
                  "A home for your reading life.",
                  "Ein Zuhause für dein Leseleben.",
                )}
              </h2>
              <p>
                {t(
                  "Collect the stories. Keep the feeling.",
                  "Sammle Geschichten. Bewahre das Gefühl.",
                )}
              </p>
              <span className="onboarding-caption">
                READ · REFLECT · REMEMBER
              </span>
            </aside>
            <section className="onboarding-content">
              <div
                className="step-progress"
                aria-label={t(
                  `Step ${step + 1} of 4`,
                  `Schritt ${step + 1} von 4`,
                )}
              >
                {[0, 1, 2, 3].map((n) => (
                  <span key={n} className={n <= step ? "active" : ""} />
                ))}
              </div>
              <span className="eyebrow">
                {t(
                  ["WELCOME", "YOUR LANGUAGE", "YOUR FAVORITES", "ALL SET"][
                    step
                  ],
                  [
                    "WILLKOMMEN",
                    "DEINE SPRACHE",
                    "DEINE FAVORITEN",
                    "ALLES BEREIT",
                  ][step],
                )}{" "}
                <span>0{step + 1} / 04</span>
              </span>
              <h2 key={step} tabIndex={-1}>
                {titles[step]}
              </h2>
              {step === 0 && (
                <>
                  <p className="setup-description">
                    {t(
                      "Meet BookTracker: your personal space to track books, remember what moved you, and discover your next favorite.",
                      "Das ist BookTracker: dein persönlicher Ort für Bücher, bleibende Gedanken und neue Lieblingsgeschichten.",
                    )}
                  </p>
                  <div className="welcome-features">
                    <span>
                      <BookOpen size={16} />
                      {t("Every book, together", "Alle Bücher an einem Ort")}
                    </span>
                    <span>
                      <Sparkles size={16} />
                      {t("Entirely your own", "Ganz nach deinem Geschmack")}
                    </span>
                  </div>
                  <GoogleButton />
                  <div className="setup-divider">
                    <span>
                      {t(
                        "or start without an account",
                        "oder ohne Konto starten",
                      )}
                    </span>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="setup-description">
                    {t(
                      "Choose the language that feels right for you.",
                      "Wähle die Sprache, in der du dich wohlfühlst.",
                    )}
                  </p>
                  <Languages />
                </>
              )}
              {step === 2 && (
                <>
                  <p className="setup-description">
                    {t(
                      "Pick the shelves you love to explore. Choose as many as you like, or leave this for later.",
                      "Wähle deine liebsten Genres. Du kannst mehrere auswählen oder später entscheiden.",
                    )}
                  </p>
                  <Genres />
                  <p className="selection-count">
                    {prefs.genres.length}{" "}
                    {t("genres selected", "Genres ausgewählt")}
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <p className="setup-description">
                    {t(
                      "Your reading space is ready. Here’s what you can do next.",
                      "Dein Leseplatz ist bereit. Das erwartet dich.",
                    )}
                  </p>
                  <div className="overview-features">
                    {[
                      [
                        Target,
                        t(
                          "Track your chapters",
                          "Behalte deinen Fortschritt im Blick",
                        ),
                        t(
                          "Log books, progress, ratings, and reflections.",
                          "Bücher, Fortschritt, Bewertungen und Gedanken festhalten.",
                        ),
                      ],
                      [
                        Layers,
                        t("Make your books your own", "Gestalte deine Bücher"),
                        t(
                          "Choose a cover style and showcase your three favorites.",
                          "Wähle deinen Cover-Stil und zeige deine drei Favoriten.",
                        ),
                      ],
                      [
                        Library,
                        t(
                          "Build your own shelves",
                          "Gestalte deine Bibliothek",
                        ),
                        t(
                          "Create ranked lists, tiers, and a personal reading diary.",
                          "Ranglisten, Lesetagebuch und eigene Sammlungen erstellen.",
                        ),
                      ],
                    ].map(([Icon, title, desc]) => {
                      const I = Icon as typeof Target;
                      return (
                        <div key={String(title)}>
                          <I size={20} />
                          <span>
                            <strong>{String(title)}</strong>
                            <p>{String(desc)}</p>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="setup-summary">
                    <Globe size={14} />
                    {prefs.language === "de" ? "Deutsch" : "English"}
                    <span>·</span>
                    {prefs.genres.length}{" "}
                    {t("favorite genres", "Lieblingsgenres")}
                  </div>
                </>
              )}
              {warning && (
                <p className="preferences-warning" role="status">
                  {warning}
                </p>
              )}
              <div className="onboarding-actions">
                {step > 0 ? (
                  <button
                    className="text-button"
                    onClick={() => update({ step: step - 1 })}
                  >
                    <ArrowLeft size={15} />
                    {t("Back", "Zurück")}
                  </button>
                ) : (
                  <span className="setup-small">
                    {t(
                      "Make it yours in a minute.",
                      "In einer Minute eingerichtet.",
                    )}
                  </span>
                )}
                <button
                  className="button primary"
                  onClick={() =>
                    update(step < 3 ? { step: step + 1 } : { completed: true })
                  }
                >
                  {step === 3
                    ? t("Get Started", "Los geht’s")
                    : t("Continue", "Weiter")}
                  <ArrowRight size={15} />
                </button>
              </div>
            </section>
          </div>
        </ModalFrame>
      )}
    </>
  );
}
export function SettingsButton() {
  const { prefs, update, t, warning } = usePreferences();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        className="icon-button settings-button"
        aria-label={t("Settings", "Einstellungen")}
        onClick={() => setOpen(true)}
      >
        <Settings2 size={19} />
      </button>
      {open && (
        <ModalFrame
          title={t("Reading preferences", "Leseeinstellungen")}
          onClose={close}
        >
          <div className="settings-content">
            <div className="settings-heading">
              <span className="eyebrow">
                {t("MAKE IT YOURS", "GANZ NACH DEINEM GESCHMACK")}
              </span>
              <h2>{t("Reading preferences", "Leseeinstellungen")}</h2>
              <p className="setup-description">
                {t(
                  "Small details. Your kind of reading space. Changes save automatically.",
                  "Kleine Details für deinen persönlichen Leseplatz. Änderungen werden automatisch gespeichert.",
                )}
              </p>
            </div>
            <div className="settings-scroll">
              <h3>
                <Globe size={16} />
                {t("Language", "Sprache")}
              </h3>
              <Languages />
              <h3>
                <Sparkles size={16} />
                {t("Favorite genres", "Lieblingsgenres")}
              </h3>
              <Genres />
              <h3>
                <BookOpen size={16} />
                {t("Cover preference", "Cover-Auswahl")}
              </h3>
              <div className="cover-choices">
                {(["modern", "minimalist", "leather"] as const).map(
                  (value, i) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={prefs.cover === value}
                      className={prefs.cover === value ? "chosen" : ""}
                      onClick={() => update({ cover: value })}
                    >
                      <span
                        aria-hidden="true"
                        className={`cover-swatch swatch-${value}`}
                      >
                        <BookOpen size={24} />
                        <small>FOLIO</small>
                      </span>
                      {t(
                        ["Normal", "Simple", "Leather-bound"][i],
                        ["Normal", "Einfach", "Ledereinband"][i],
                      )}
                      {prefs.cover === value && <Check size={12} />}
                    </button>
                  ),
                )}
              </div>
              <h3>
                <Settings2 size={16} />
                {t("Library & accessibility", "Bibliothek & Bedienung")}
              </h3>
              <label className="preference-row">
                <span>
                  <strong>
                    {t("Default library view", "Standardansicht")}
                  </strong>
                  <small>
                    {t(
                      "Choose how your bookshelf opens.",
                      "So wird deine Bibliothek geöffnet.",
                    )}
                  </small>
                </span>
                <select
                  aria-label={t("Default library view", "Standardansicht")}
                  value={prefs.libraryView}
                  onChange={(event) =>
                    update({
                      libraryView: event.target.value as "grid" | "diary",
                      ...(event.target.value === "diary"
                        ? { shelfStyle: "simple" as const }
                        : {}),
                    })
                  }
                >
                  <option value="grid">
                    {t("Cover grid", "Cover-Raster")}
                  </option>
                  <option value="diary">
                    {t("Reading diary", "Lesetagebuch")}
                  </option>
                </select>
              </label>
              <label className="preference-row">
                <span>
                  <strong>{t("Shelf density", "Regaldichte")}</strong>
                  <small>
                    {t(
                      "Fit more books on the same shelf.",
                      "Mehr Bücher auf demselben Regal.",
                    )}
                  </small>
                </span>
                <select
                  aria-label={t("Shelf density", "Regaldichte")}
                  value={prefs.density}
                  onChange={(event) =>
                    update({
                      density: event.target.value as "comfortable" | "compact",
                    })
                  }
                >
                  <option value="comfortable">
                    {t("Comfortable", "Großzügig")}
                  </option>
                  <option value="compact">{t("Compact", "Kompakt")}</option>
                </select>
              </label>
              <label className="preference-row">
                <span>
                  <strong>{t("Reduce motion", "Bewegung reduzieren")}</strong>
                  <small>
                    {t(
                      "Turn off animated transitions and hover movement.",
                      "Animationen und Hover-Bewegungen ausschalten.",
                    )}
                  </small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={t("Reduce motion", "Bewegung reduzieren")}
                  checked={prefs.reduceMotion}
                  onChange={(event) =>
                    update({ reduceMotion: event.target.checked })
                  }
                />
              </label>
              <h3>{t("Account", "Konto")}</h3>
              <GoogleButton />
              {warning && <p className="preferences-warning">{warning}</p>}
            </div>
            <div className="settings-bottom">
              <button
                className="text-button"
                onClick={() => {
                  setOpen(false);
                  update({ completed: false, step: 0 });
                }}
              >
                {t("Show introduction again", "Einführung erneut anzeigen")}
              </button>
              <button className="button primary" onClick={close}>
                {t("Done", "Fertig")}
                <Check size={15} />
              </button>
            </div>
          </div>
        </ModalFrame>
      )}
    </>
  );
}

export function WelcomeButton() {
  const { update, t } = usePreferences();
  return (
    <button
      className="icon-button welcome-button"
      aria-label={t("Open welcome flow", "Einführung öffnen")}
      title={t("Open welcome flow", "Einführung öffnen")}
      onClick={() => update({ completed: false, step: 0 })}
    >
      <Sparkles size={19} />
    </button>
  );
}
