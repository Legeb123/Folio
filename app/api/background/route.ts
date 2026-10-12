import type { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang") === "de" ? "de" : "en";
  const title = request.nextUrl.searchParams.get("title")?.slice(0, 180) || "";
  const author =
    request.nextUrl.searchParams.get("author")?.slice(0, 120) || "";
  if (!title || !author)
    return Response.json({ error: "Missing title or author" }, { status: 400 });
  async function lookup(query: string) {
    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    url.search = new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: query,
      gsrlimit: "1",
      gsrnamespace: "0",
      prop: "extracts|info",
      explaintext: "1",
      exchars: "4500",
      inprop: "url",
    }).toString();
    const r = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent":
          "FolioBookTracker/1.0 (personal reading context; source links displayed)",
      },
      next: { revalidate: 86400 },
    });
    if (!r.ok) throw Error("Source unavailable");
    const data = await r.json();
    const page = Object.values(data.query?.pages || {})[0] as
      { title?: string; extract?: string; fullurl?: string } | undefined;
    return page?.extract && page.fullurl
      ? { title: page.title || query, summary: page.extract, url: page.fullurl }
      : null;
  }
  try {
    const [book, bio] = await Promise.all([
      lookup(`${title} ${author}`),
      lookup(author),
    ]);
    if (!book && !bio)
      return Response.json({ error: "No reference found" }, { status: 404 });
    return Response.json({
      language: lang,
      title: book?.title || bio!.title,
      summary: book?.summary || "",
      url: book?.url || bio!.url,
      authorSummary: bio?.summary,
      authorUrl: bio?.url,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { error: "Reference service unavailable. Try again later." },
      { status: 502 },
    );
  }
}
