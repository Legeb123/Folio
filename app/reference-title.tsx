"use client";
import { useEffect, useState } from "react";
import { usePreferences } from "@/lib/preferences";
import { germanFromSearch } from "@/lib/openlibrary";

export function ReferenceTitle({
  title,
  author,
  english = false,
}: {
  title: string;
  author: string;
  english?: boolean;
}) {
  const { prefs, t } = usePreferences();
  const key = `${prefs.language}:${author}:${title}`;
  const [resolved, setResolved] = useState<{
    key: string;
    title: string;
  } | null>(null);
  useEffect(() => {
    if (english && prefs.language === "en") return;
    const controller = new AbortController();
    const quote = (value: string) => `"${value.replace(/["\\]/g, " ")}"`;
    const q = `title:${quote(title)} author:${quote(author)} language:${prefs.language === "de" ? "ger" : "eng"}`;
    const params = new URLSearchParams({
      q,
      lang: prefs.language,
      limit: "1",
      fields: "editions,editions.title,editions.language",
    });
    fetch(`https://openlibrary.org/search.json?${params}`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        const metadata = germanFromSearch(data.docs?.[0] || {});
        const translated =
          prefs.language === "de"
            ? metadata.german?.title
            : metadata.englishTitle;
        if (translated && !controller.signal.aborted)
          setResolved({ key, title: translated });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [key, title, author, english, prefs.language]);
  return (
    <>
      {english && prefs.language === "en"
        ? title
        : resolved?.key === key
          ? resolved.title
          : t("English title unavailable", "Deutscher Titel nicht verfügbar")}
    </>
  );
}
