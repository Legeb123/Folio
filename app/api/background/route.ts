import type { NextRequest } from "next/server";
// Only book interpretation sections are returned. No biography or plot extract
// is used as evidence of an author's motivation; these excerpts are spoiler-gated.
export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang") === "de" ? "de" : "en";
  const title = request.nextUrl.searchParams.get("title")?.slice(0, 180) || "";
  const author =
    request.nextUrl.searchParams.get("author")?.slice(0, 120) || "";
  if (!title || !author)
    return Response.json({ error: "Missing title or author" }, { status: 400 });
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${title} ${author}`,
    gsrlimit: "1",
    gsrnamespace: "0",
    prop: "extracts|info",
    explaintext: "1",
    inprop: "url",
  }).toString();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent":
          "FolioBookTracker/1.0 (book interpretation; source links displayed)",
      },
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw Error();
    const data = await response.json();
    const page = Object.values(data.query?.pages || {})[0] as
      { title?: string; extract?: string; fullurl?: string } | undefined;
    if (!page?.fullurl)
      return Response.json({ error: "No reference found" }, { status: 404 });
    const sections = (page.extract || "").split(/\n(?=={2,}\s)/);
    const themes = sections
      .filter((section) =>
        /^={2,}\s*(Themes?(?: and (?:style|motifs))?|Interpretations?|Analysis|Themen(?: und Motive)?|Deutungen?|Interpretation(?:en)?|Analyse)\s*={2,}/i.test(
          section,
        ),
      )
      .map((section) => section.replace(/^=+[^\n]+\n/, "").trim())
      .join("\n\n")
      .slice(0, 4500);
    return Response.json({
      version: 2,
      language: lang,
      title: page.title || title,
      summary: "",
      message: themes,
      url: page.fullurl,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { error: "Reference service unavailable" },
      { status: 502 },
    );
  }
}
