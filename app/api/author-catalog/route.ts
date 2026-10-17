import type { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 160) || "";
  const page = Number(request.nextUrl.searchParams.get("page") || 1);
  if (q.length < 2 || !Number.isInteger(page) || page < 1 || page > 1000)
    return Response.json({ error: "Invalid search" }, { status: 400 });
  try {
    const url = new URL("https://openlibrary.org/search/authors.json");
    url.search = new URLSearchParams({
      q,
      limit: "20",
      offset: String((page - 1) * 20),
    }).toString();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw Error();
    const data = await response.json();
    return Response.json({
      total: data.numFound ?? data.num_found ?? 0,
      authors: (data.docs || [])
        .filter((a: { key: string }) => /^OL\d+A$/.test(a.key))
        .map(
          (a: {
            key: string;
            name: string;
            birth_date?: string;
            death_date?: string;
            top_work?: string;
            work_count?: number;
          }) => ({
            id: a.key,
            name: a.name,
            birth: a.birth_date,
            death: a.death_date,
            topWork: a.top_work,
            count: a.work_count,
          }),
        ),
    });
  } catch {
    return Response.json({ error: "Search unavailable" }, { status: 502 });
  }
}
