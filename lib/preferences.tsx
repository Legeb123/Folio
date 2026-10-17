"use client";
import { resetLegacyLibrary } from "./library-reset";
import { createContext, useContext, useEffect, useState } from "react";
export const PREF_KEY = "booktracker-preferences-v1";
export const genres = [
  "Sci-Fi",
  "History",
  "Classics",
  "Fantasy",
  "Non-Fiction",
  "Fiction",
  "Philosophy",
  "Mystery",
  "Biography",
  "Romance",
] as const;
export type ShelfStyle = "simple" | "rustic" | "white";
export type Preferences = {
  version: 1;
  completed: boolean;
  step: number;
  language: "en" | "de";
  genres: string[];
  cover: "leather" | "modern" | "minimalist";
  favoriteBookIds: string[];
  libraryView: "grid" | "diary";
  shelfStyle: ShelfStyle;
  density: "comfortable" | "compact";
  reduceMotion: boolean;
};
export const defaults: Preferences = {
  version: 1,
  completed: false,
  step: 0,
  language: "en",
  genres: [],
  cover: "modern",
  favoriteBookIds: [],
  libraryView: "grid",
  shelfStyle: "simple",
  density: "comfortable",
  reduceMotion: false,
};
function valid(v: unknown): v is Preferences {
  if (!v || typeof v !== "object") return false;
  const p = v as Preferences;
  return (
    p.version === 1 &&
    typeof p.completed === "boolean" &&
    Number.isInteger(p.step) &&
    p.step >= 0 &&
    p.step <= 3 &&
    ["en", "de"].includes(p.language) &&
    ["first", "leather", "modern", "minimalist"].includes(p.cover) &&
    (p.favoriteBookIds === undefined ||
      (Array.isArray(p.favoriteBookIds) &&
        p.favoriteBookIds.length <= 3 &&
        p.favoriteBookIds.every((id) => typeof id === "string") &&
        new Set(p.favoriteBookIds).size === p.favoriteBookIds.length)) &&
    (p.shelfStyle === undefined ||
      ["simple", "rustic", "white"].includes(p.shelfStyle)) &&
    (p.libraryView === undefined ||
      ["grid", "diary"].includes(p.libraryView)) &&
    (p.density === undefined ||
      ["comfortable", "compact"].includes(p.density)) &&
    (p.reduceMotion === undefined || typeof p.reduceMotion === "boolean") &&
    Array.isArray(p.genres) &&
    p.genres.every((g) => genres.includes(g as (typeof genres)[number]))
  );
}
const Context = createContext<{
  prefs: Preferences;
  update: (p: Partial<Preferences>) => void;
  warning: string;
  t: (en: string, de: string) => string;
}>({ prefs: defaults, update: () => {}, warning: "", t: (en) => en });
export const usePreferences = () => useContext(Context);
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState("");
  const [writable, setWritable] = useState(true);
  useEffect(() => {
    try {
      resetLegacyLibrary(localStorage);
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (valid(parsed)) {
          const { editions: _removed, ...retained } = parsed as Preferences & {
            editions?: string;
          };
          setPrefs({
            ...defaults,
            ...retained,
            cover:
              String(retained.cover) === "first" ? "modern" : retained.cover,
          });
        } else {
          setWritable(false);
          setWarning(
            "Saved preferences could not be read. They have been preserved; changes apply to this session.",
          );
        }
      }
    } catch {
      setWritable(false);
      setWarning(
        "Preferences cannot be saved in this browser. Changes apply to this session.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = prefs.language;
    document.documentElement.dataset.reduceMotion = String(prefs.reduceMotion);
    if (writable)
      try {
        localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      } catch {
        setWritable(false);
        setWarning(
          "Preferences cannot be saved in this browser. Changes apply to this session.",
        );
      }
  }, [prefs, ready, writable]);
  if (!ready)
    return (
      <div className="loading-screen">
        <strong>folio.</strong>
        <p>Opening BookTracker…</p>
      </div>
    );
  return (
    <Context.Provider
      value={{
        prefs,
        update: (p) => setPrefs((old) => ({ ...old, ...p })),
        warning,
        t: (en, de) => (prefs.language === "de" ? de : en),
      }}
    >
      {children}
    </Context.Provider>
  );
}
