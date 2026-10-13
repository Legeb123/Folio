"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Globe2, Minus, Plus, RotateCcw, MapPin } from "lucide-react";
import type { Book } from "@/lib/data";
import {
  countries,
  countryName,
  mappedBooks,
  locationFor,
  publicationLabel,
  validPublication,
  type Publication,
} from "@/lib/geography";
import { bookTitle, statusLabel, tr } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import { Cover, ModalFrame } from "./components";
function Land() {
  return (
    <g className="bookmap-land" aria-hidden="true">
      {countries.map((c) => (
        <path key={c.id} d={c.path} />
      ))}
    </g>
  );
}
export function BookMap({
  books,
  onOpen,
  onResolve,
}: {
  books: Book[];
  onOpen: (book: Book) => void;
  onResolve: (id: string, publication: Publication) => void;
}) {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        className="bookmap-icon"
        aria-label={t("Open BookMap", "BookMap öffnen")}
        title={t("Publication map", "Veröffentlichungskarte")}
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 1000 500" aria-hidden="true" focusable="false">
          <Land />
        </svg>
      </button>
      {open && (
        <ModalFrame title="BookMap" onClose={close} wide>
          <MapExplorer
            allBooks={books}
            onResolve={onResolve}
            onOpen={(book) => {
              close();
              onOpen(book);
            }}
          />
        </ModalFrame>
      )}
    </>
  );
}
function MapExplorer({
  allBooks,
  onOpen,
  onResolve,
}: {
  allBooks: Book[];
  onOpen: (book: Book) => void;
  onResolve: (id: string, publication: Publication) => void;
}) {
  const { prefs, t } = usePreferences();
  const [status, setStatus] = useState("All books");
  const books = useMemo(
    () => allBooks.filter((b) => status === "All books" || b.status === status),
    [allBooks, status],
  );
  const attempted = useRef(new Set<string>());
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const unresolved = allBooks
    .filter(
      (b) =>
        b.publication === undefined &&
        !locationFor(b) &&
        /^\/works\/OL\d+W$/.test(b.id),
    )
    .map((b) => b.id)
    .join("|");
  useEffect(() => {
    const ids = unresolved
      .split("|")
      .filter((id) => id && !attempted.current.has(id));
    if (!ids.length) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      for (const id of ids) {
        if (controller.signal.aborted) break;
        try {
          const response = await fetch(
            "/api/publication?work=" + encodeURIComponent(id),
            { signal: controller.signal },
          );
          if (!response.ok) {
            if (!controller.signal.aborted) attempted.current.add(id);
            continue;
          }
          const result = await response.json();
          if (!controller.signal.aborted) {
            attempted.current.add(id);
            if (validPublication(result)) onResolve(id, result);
          }
        } catch {
          if (!controller.signal.aborted) attempted.current.add(id);
        }
      }
      if (!controller.signal.aborted) setLoading(false);
    })();
    return () => controller.abort();
  }, [unresolved, retry, onResolve]);
  const mapped = useMemo(() => mappedBooks(books), [books]);
  const unmapped = books.filter((b) => !mapped.some((m) => m.book.id === b.id));
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const [markerScale, setMarkerScale] = useState(1);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() =>
      setMarkerScale(1000 / Math.max(1, svg.getBoundingClientRect().width)),
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  const [center, setCenter] = useState({ x: 500, y: 250 });
  const [selected, setSelected] = useState<string[]>([]);
  const drag = useRef<{
    x: number;
    y: number;
    cx: number;
    cy: number;
    unit: number;
  } | null>(null);
  const width = 1000 / zoom,
    height = 500 / zoom;
  const cx = Math.max(width / 2, Math.min(1000 - width / 2, center.x));
  const cy = Math.max(height / 2, Math.min(500 - height / 2, center.y));
  const clusters = useMemo(() => {
    const groups: { x: number; y: number; items: typeof mapped }[] = [];
    for (const item of mapped) {
      const group = groups.find(
        (g) =>
          Math.hypot(g.x - item.x, g.y - item.y) < (46 * markerScale) / zoom,
      );
      if (group) {
        group.items.push(item);
      } else groups.push({ x: item.x, y: item.y, items: [item] });
    }
    return groups;
  }, [mapped, zoom, markerScale]);
  const listed = selected.length
    ? mapped.filter((m) => selected.includes(m.book.id))
    : mapped;
  const move = (dx: number, dy: number) =>
    setCenter({
      x: Math.max(width / 2, Math.min(1000 - width / 2, cx + dx)),
      y: Math.max(height / 2, Math.min(500 - height / 2, cy + dy)),
    });
  return (
    <div className="bookmap-modal">
      <div className="bookmap-heading">
        <span className="eyebrow">
          {t("YOUR LITERARY ATLAS", "DEIN LITERARISCHER ATLAS")}
        </span>
        <h2>
          <Globe2 size={28} /> BookMap
        </h2>
        <p>
          {t(
            "Explore where your books were published.",
            "Entdecke, wo deine Bücher veröffentlicht wurden.",
          )}
        </p>
      </div>
      <div
        className="bookmap-status"
        role="group"
        aria-label={t("Map reading status", "Lesestatus auf der Karte")}
      >
        {["All books", "Read", "Currently Reading", "Want to Read"].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            className={status === s ? "active" : ""}
            onClick={() => {
              setSelected([]);
              setStatus(s);
            }}
          >
            {s === "All books"
              ? tr(s, prefs.language)
              : statusLabel(s as Book["status"], prefs.language)}
          </button>
        ))}
      </div>
      <div className="bookmap-controls">
        <p aria-live="polite">
          {mapped.length} {t("mapped", "zugeordnet")} ·{" "}
          {new Set(mapped.map((m) => m.country.id)).size}{" "}
          {t("countries / regions", "Länder / Regionen")} · {unmapped.length}{" "}
          {t("without a location", "ohne Ort")}
        </p>
        <div>
          <button
            type="button"
            className="icon-button"
            aria-label={t("Zoom out", "Verkleinern")}
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z / 1.5))}
          >
            <Minus size={17} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="icon-button"
            aria-label={t("Zoom in", "Vergrößern")}
            disabled={zoom >= 6}
            onClick={() => setZoom((z) => Math.min(6, z * 1.5))}
          >
            <Plus size={17} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={t("Reset map", "Karte zurücksetzen")}
            onClick={() => {
              setZoom(1);
              setCenter({ x: 500, y: 250 });
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <svg
        ref={svgRef}
        className="bookmap-canvas"
        viewBox={`${cx - width / 2} ${cy - height / 2} ${width} ${height}`}
        tabIndex={0}
        role="group"
        aria-label={t(
          "World map. Zoom with the buttons, drag to pan, or use arrow keys.",
          "Weltkarte. Mit den Tasten zoomen, zum Verschieben ziehen oder Pfeiltasten nutzen.",
        )}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          const delta = 50 / zoom;
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
          ) {
            e.preventDefault();
            move(
              e.key === "ArrowLeft"
                ? -delta
                : e.key === "ArrowRight"
                  ? delta
                  : 0,
              e.key === "ArrowUp" ? -delta : e.key === "ArrowDown" ? delta : 0,
            );
          }
        }}
        onPointerDown={(e) => {
          if ((e.target as Element).closest("[data-marker]")) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            cx,
            cy,
            unit: width / e.currentTarget.getBoundingClientRect().width,
          };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d)
            setCenter({
              x: Math.max(
                width / 2,
                Math.min(1000 - width / 2, d.cx - (e.clientX - d.x) * d.unit),
              ),
              y: Math.max(
                height / 2,
                Math.min(500 - height / 2, d.cy - (e.clientY - d.y) * d.unit),
              ),
            });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <g className="bookmap-graticule" aria-hidden="true">
          {[125, 250, 375, 500, 625, 750, 875].map((x) => (
            <path key={x} d={`M${x},0 V500`} />
          ))}
          {[83.33, 166.67, 250, 333.33, 416.67].map((y) => (
            <path key={y} d={`M0,${y} H1000`} />
          ))}
        </g>
        <Land />
        {clusters
          .filter(
            (g) =>
              g.x >= cx - width / 2 &&
              g.x <= cx + width / 2 &&
              g.y >= cy - height / 2 &&
              g.y <= cy + height / 2,
          )
          .map((g) => {
            const first = g.items[0];
            const many = g.items.length > 1;
            const label = many
              ? `${g.items.length} ${t("books", "Bücher")} · ${[...new Set(g.items.map((m) => countryName(m.country.id, prefs.language)))].join(", ")}`
              : `${bookTitle(first.book, prefs.language)} · ${countryName(first.country.id, prefs.language)} · ${publicationLabel(first.location, prefs.language)}`;
            const activate = () =>
              many
                ? setSelected(g.items.map((m) => m.book.id))
                : onOpen(first.book);
            return (
              <g
                data-marker="true"
                className={`bookmap-marker marker-${many ? "cluster" : first.book.status === "Read" ? "read" : first.book.status === "Currently Reading" ? "reading" : "want"}`}
                key={g.items.map((m) => m.book.id).join("|")}
                role="button"
                tabIndex={0}
                aria-label={label}
                transform={`translate(${g.x} ${g.y}) scale(${markerScale / zoom})`}
                onClick={activate}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate();
                  }
                }}
              >
                <title>{label}</title>
                <circle r="23" fill="transparent" className="marker-hit" />
                <circle r={many ? 14 : 10} className="marker-dot" />
                {many ? (
                  <text textAnchor="middle" dy="4">
                    {g.items.length}
                  </text>
                ) : (
                  <circle r="3" className="marker-center" />
                )}
              </g>
            );
          })}
      </svg>
      <div className="bookmap-legend">
        <span>
          <i className="legend-read" />
          {statusLabel("Read", prefs.language)}
        </span>
        <span>
          <i className="legend-reading" />
          {statusLabel("Currently Reading", prefs.language)}
        </span>
        <span>
          <i className="legend-want" />
          {statusLabel("Want to Read", prefs.language)}
        </span>
        <span>
          <i className="legend-cluster" />
          {t("Grouped books", "Gruppierte Bücher")}
        </span>
      </div>
      <p className="bookmap-note">
        {t(
          "Pins show publication countries: verified first publications, or a sourced catalog publication when the original is unknown. All library books are included, independently of shelf filters.",
          "Die Punkte zeigen Veröffentlichungsländer: belegte Erstveröffentlichungen oder eine Katalogveröffentlichung, wenn das Original unbekannt ist. Alle Bibliotheksbücher sind enthalten, unabhängig von Regalfiltern.",
        )}
      </p>
      {!books.length && (
        <p className="metadata-notice">
          {t(
            "No books match these filters.",
            "Keine Bücher passen zu diesen Filtern.",
          )}
        </p>
      )}
      <div className="bookmap-list-heading">
        <h3>
          {selected.length
            ? t("Books at this marker", "Bücher an diesem Punkt")
            : t("Mapped books", "Zugeordnete Bücher")}
        </h3>
        {selected.length > 0 && (
          <button
            type="button"
            className="text-button"
            onClick={() => setSelected([])}
          >
            {t("Show all mapped books", "Alle zugeordneten Bücher")}
          </button>
        )}
      </div>
      <div className="bookmap-book-list">
        {listed.map(({ book, location, country }) => (
          <button
            className="bookmap-book"
            type="button"
            key={book.id}
            onClick={() => onOpen(book)}
          >
            <Cover book={book} />
            <span>
              <strong>{bookTitle(book, prefs.language)}</strong>
              <small>
                {countryName(country.id, prefs.language)} ·{" "}
                {publicationLabel(location, prefs.language)}
              </small>
              <small>{statusLabel(book.status, prefs.language)}</small>
            </span>
            <MapPin size={16} />
          </button>
        ))}
      </div>
      {loading && (
        <p role="status">
          {t(
            "Looking up publication countries…",
            "Veröffentlichungsländer werden gesucht …",
          )}
        </p>
      )}
      {unmapped.length > 0 && (
        <details className="bookmap-unmapped" open>
          <summary>
            {unmapped.length}{" "}
            {t(
              "books awaiting a publication country",
              "Bücher ohne Veröffentlichungsland",
            )}
          </summary>
          <p>
            {t(
              "These books are included here, but the catalog has no confirmed publication country yet. Open a book to add one.",
              "Diese Bücher sind hier enthalten, aber das Veröffentlichungsland ist noch nicht bestätigt. Öffne ein Buch, um es zu ergänzen.",
            )}
          </p>
          {!loading && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                attempted.current.clear();
                setRetry((n) => n + 1);
              }}
            >
              {t(
                "Retry publication lookup",
                "Veröffentlichungsorte erneut suchen",
              )}
            </button>
          )}
          {unmapped.map((book) => (
            <button
              type="button"
              className="text-button"
              key={book.id}
              onClick={() => onOpen(book)}
            >
              {bookTitle(book, prefs.language)} →
            </button>
          ))}
        </details>
      )}
      <a
        className="bookmap-attribution"
        href="https://www.naturalearthdata.com/about/"
        target="_blank"
        rel="noreferrer"
      >
        {t(
          "Map data: Natural Earth · public domain",
          "Kartendaten: Natural Earth · gemeinfrei",
        )}{" "}
        ↗
      </a>
    </div>
  );
}
