import type { NextRequest } from "next/server";
import { countryFromPublication } from "@/lib/publication-catalog";
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("work") || "";
  if (!/^\/works\/OL\d+W$/.test(id))
    return Response.json({ error: "Invalid work ID" }, { status: 400 });
  try {
    const response = await fetch(
      `https://openlibrary.org${id}/editions.json?limit=100`,
      {
        signal: AbortSignal.timeout(12000),
        headers: {
          "User-Agent": "FolioBookTracker/1.0 (publication location)",
        },
        next: { revalidate: 86400 },
      },
    );
    if (!response.ok) throw Error();
    const data = await response.json();
    type Entry = {
      key?: string;
      publish_date?: string;
      publish_country?: string;
      publish_places?: string[];
    };
    const entries: Entry[] = Array.isArray(data.entries) ? data.entries : [];
    const year = (entry: Entry) =>
      Number(entry.publish_date?.match(/\b(1\d{3}|20\d{2})\b/)?.[0] || 9999);
    for (const entry of entries.sort((a, b) => year(a) - year(b))) {
      const country = countryFromPublication(entry);
      if (country && /^\/books\/OL\d+M$/.test(entry.key || ""))
        return Response.json({
          country,
          kind: "catalog",
          source: `https://openlibrary.org${entry.key}`,
        });
    }
    return Response.json(
      { error: "Publication country unavailable" },
      { status: 404 },
    );
  } catch {
    return Response.json(
      { error: "Publication catalog unavailable" },
      { status: 502 },
    );
  }
}
