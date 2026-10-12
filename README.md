# Folio

A personal reading companion built with Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide icons.

## Run

Use Node.js 20.9+ and pnpm:

```sh
pnpm install
pnpm dev
```

Open http://127.0.0.1:3000. For a production build, run `pnpm build` then `pnpm start`.

## Included

- Debounced, keyboard-accessible Open Library search with cover thumbnails and work descriptions.
- Book logging with three reading statuses, half-star ratings, read dates, page counts, progress, tags, spoiler controls, and reviews.
- Filterable and sortable poster grid plus a chronological diary.
- Custom collections with descriptions, numbered ranking, reorder arrows, and S–D tiers.
- Reading goals and analytics calculated from finished books, including monthly volume, rating distribution, authors, and tags.
- Responsive desktop and mobile layouts, accessible dialogs, reduced-motion support, and cover fallbacks.
- Sixteen sample books, two collections, and bundled Open Library covers on first use.

## Data

Everything is saved under `folio-library-v1` in browser localStorage. Data stays in the current browser and origin; there is no account or cloud sync. Clearing browser data removes the library. Invalid saved data is preserved rather than overwritten, and unavailable storage is reported in the UI. Sample data is created only when no saved library exists.

Search and descriptions use the public Open Library API. Search falls back to existing library matches when the API is unavailable. Newly searched covers require an internet connection. Sample summaries are original editorial descriptions; book covers are provided by Open Library and retain their respective rights.

Pages read totals use the entered or known total page count of finished books; missing page counts contribute zero. Average ratings exclude unrated and unfinished books. Monthly totals use the current calendar year and logged read dates. Genres are user-editable tags.

## Verification

```sh
pnpm typecheck
pnpm build
pnpm test
```

Browser tests use installed Microsoft Edge by default. To use Chromium, install it with `pnpm exec playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`. The test runner starts a dev server if one is not already serving port 3000. Tests use isolated browser contexts and do not change your personal library.

Tests cover logging, reload persistence, half-stars, spoiler reviews, filters, list ordering and tiers, remote search and descriptions, offline fallback, malformed storage, analytics, and mobile overflow. Remote API responses are mocked for deterministic tests.

## Phase 1: onboarding and settings

First visits open a four-step BookTracker introduction within Folio: welcome, language, favorite genres, and a feature overview. Progress and completion persist under `booktracker-preferences-v1`, independently from the existing library. Guests can complete onboarding without signing in. Settings in the header let you change these choices or replay the introduction.

German and English now cover the reading editor, navigation, library controls, lists, analytics, discovery, and settings. All sixteen sample books have German display titles and original German summaries. Original metadata, personal notes, and reviews are preserved. Search prefers the selected language. For other books, unavailable German descriptions clearly fall back to the source language; German title/description overrides can be saved in book details. Favorite genres personalize Ideas without hiding books from the library.

Cover settings are available inside Settings: Normal uses the book cover, Simple uses a typographic jacket, and Leather-bound uses a textured brown cover with gold details and a cursive title. Edition and translation browsing have been removed. Saved First Edition preferences migrate to Normal without changing your library.

Use the sparkle button beside Settings to reopen the welcome flow. Use Edit favorites beside the three homepage books to choose and order three books from your library. Favorites persist with your preferences. If a favorite is removed from the library, another available book fills its place; libraries with fewer than three books show the available books.

### Google OAuth / Vercel

OAuth is prepared using Auth.js (NextAuth v5 beta), the standard Google provider, and signed JWT session cookies. It does not provide cloud library synchronization. Login is disabled with an explanatory message until all required environment values are configured; local guest mode remains fully usable.

1. Configure `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in Vercel (see `.env.example`). Generate a strong random secret, for example with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.
2. Set `AUTH_URL` to the deployed HTTPS origin. Use a stable domain for OAuth; Vercel preview URLs each need a matching authorized callback if used directly.
3. In Google Cloud, create a Web application OAuth client and register the exact redirect URI `https://YOUR-DOMAIN/api/auth/callback/google`. For local development register `http://127.0.0.1:3000/api/auth/callback/google` separately.
4. Configure the consent screen and test users as required by your Google project, then redeploy. The Google button activates when the server reports a complete configuration.

No credentials are committed. `.env.local` is ignored. `/api/account` returns only configuration availability and the current signed-in user's name/email. An actual Google sign-in requires your OAuth credentials and has not been exercised here.

Reference: [Auth.js Next.js integration](https://authjs.dev/getting-started/installation?framework=Next.js).

Settings open in a centered viewport-level popup with a scrollable body and fixed heading/footer. Additional preferences include default grid/diary view, comfortable/compact shelves, and reduced motion. Existing saved preferences receive defaults for these options without resetting onboarding or the library.

## Reading workspace and discovery

- **Ideas:** fetches Open Library suggestions for up to two favorite/high-affinity authors and two genres. Author affinity uses homepage favorites, ratings of 4+ stars, and completed books. Suggestions show their reason, deduplicate works/titles, and exclude books already owned. Results are not an AI prediction or paid placement. If network results fail, the saved queue remains available with an explicit fallback notice.
- **Wishlist:** a dedicated Want to Read queue with one-click Start reading and status selectors. Library cards also support quick status changes. Starting sets a missing start date; completing sets a missing completion date. Leaving Completed clears its completion date. These are per-book records rather than separate reread sessions.
- **Ratings:** five 0–5 sliders in 0.5 increments for prose, plot/pacing, characters, worldbuilding, and emotional impact. Zero means unrated and is excluded. The exact mean of rated dimensions becomes the overall score; the older manual star control remains available when there are no rated dimensions. Clearing removes both. Analytics bins means to the nearest half-star so every rated book is counted.
- **Dates:** the legacy `date` field remains the completion date, preserving existing finished-book history. Start dates are optional; duration includes both calendar dates (same-day reads = one day), uses UTC date arithmetic, and shows ongoing duration when no completion exists. The form rejects reversed dates and future dates.
- **Notes & quotes:** structured personal thoughts, takeaways, quote text and page/location, clipboard copying, and quote deletion. Copy failure has a manual-copy message. Save to library commits all tabs together; changing tabs retains the draft.
- **Context:** the description stays in the book header. A separate background tab provides sourced historical context for Dune, Meditations, and The Metamorphosis plus a Wikipedia reference overview and author biography in the chosen language when available. Automatically found articles show their titles and source links for identity verification. They are research starting points, not claims of a documented causal influence. Source excerpts, attribution URLs, language, and retrieval time persist when the book is saved. Personal historical/literary notes are separate. Fetch errors allow retry and never block local note-taking. No personal notes or reviews are sent to external services.

Historical references: [Oxford Academic: Herbert and dune ecology](https://academic.oup.com/isle/article-abstract/30/3/637/6184617), [Penguin Random House: The Illustrated Meditations](https://www.penguinrandomhouseretail.com/book/?isbn=9780593800003), and [Franz Kafka Museum: biography](https://kafkamuseum.cz/en/timeline). Wikipedia excerpts retain linked attribution and are labeled CC BY-SA.

All new book fields are optional for backward compatibility. Existing valid library data loads without losing ratings, reviews, dates, or lists. Invalid extended records are preserved rather than overwritten. Browser tests cover the migration path, multi-criterion averages, date validation, notes and clipboard, context persistence, German display, recommendation filtering, and queue actions.

For newly searched or recommended works, Folio requests the catalog's language-specific title metadata and uses it only when marked German. A German catalog description is fetched when available on opening the book and saved alongside the original metadata. There is no automatic machine translation service, and unavailable descriptions remain clearly labeled source-language fallbacks. This does not reintroduce edition/version browsing. See the [Open Library Search API](https://openlibrary.org/dev/docs/api/search).
