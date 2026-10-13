import type { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang") === "de" ? "de" : "en";
  const names = request.nextUrl.searchParams.getAll("name");
  if (
    !names.length ||
    names.length > 20 ||
    names.some((n) => !n.trim() || n.length > 120 || /[|\x00-\x1f]/.test(n))
  )
    return Response.json({ error: "Invalid author names" }, { status: 400 });
  const titles = names.map((n) =>
    lang === "de" && n === "Marcus Aurelius"
      ? "Mark Aurel"
      : n === "Viktor E. Frankl"
        ? "Viktor Frankl"
        : n,
  );
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: titles.join("|"),
    redirects: "1",
    prop: "extracts|pageimages|info|pageprops",
    exintro: "1",
    explaintext: "1",
    pithumbsize: "500",
    inprop: "url",
  }).toString();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent":
          "FolioBookTracker/1.0 (author profiles; Wikipedia attribution displayed)",
      },
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw Error("Upstream failed");
    const data = await response.json();
    const mappings: { from: string; to: string }[] = [
      ...(data.query?.normalized || []),
      ...(data.query?.redirects || []),
    ];
    const authors = names.map((name, i) => {
      let title = titles[i];
      for (let j = 0; j < 5; j++) {
        const match = mappings.find((m) => m.from === title);
        if (!match) break;
        title = match.to;
      }
      const page = data.query?.pages?.find(
        (p: { title: string }) => p.title === title,
      );
      if (
        !page ||
        page.missing ||
        page.pageprops?.disambiguation !== undefined ||
        !page.extract
      )
        return { name, biography: "", source: "" };
      return {
        name,
        biography: page.extract.slice(0, 5000),
        portrait: page.thumbnail?.source,
        source: page.fullurl,
        imageSource: page.pageimage
          ? `https://${lang}.wikipedia.org/wiki/File:${encodeURIComponent(page.pageimage)}`
          : undefined,
      };
    });
    return Response.json({ authors });
  } catch {
    return Response.json(
      { error: "Author references unavailable" },
      { status: 502 },
    );
  }
}
