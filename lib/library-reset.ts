import { createEmptyLibrary } from "./data";

export const LIBRARY_RESET_KEY = "folio-library-reset-2026-10-17-v2";
export function resetLegacyLibrary(storage: Storage) {
  if (storage.getItem(LIBRARY_RESET_KEY) === "done") return;
  const raw = storage.getItem("booktracker-preferences-v1");
  if (raw) {
    let preferences;
    try {
      preferences = JSON.parse(raw);
    } catch {}
    if (
      preferences &&
      typeof preferences === "object" &&
      !Array.isArray(preferences)
    ) {
      storage.setItem(
        "booktracker-preferences-v1",
        JSON.stringify({ ...preferences, favoriteBookIds: [] }),
      );
    } else {
      storage.removeItem("booktracker-preferences-v1");
    }
  }
  storage.setItem("folio-library-v1", JSON.stringify(createEmptyLibrary()));
  // Mark complete only after both library and favorites have been cleared.
  storage.setItem(LIBRARY_RESET_KEY, "done");
}
