import type { NextRequest } from "next/server";
import { authorKey } from "@/lib/authors";
import { rankAuthorWorks, AUTHOR_RANKING_WINDOW } from "@/lib/author-ranking";
async function get(url: string) {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    next: { revalidate: 86400 },
  });
  if (!r.ok) throw Error();
  return r.json();
}
export async function GET(request: NextRequest) {
  const name =
    request.nextUrl.searchParams.get("name")?.trim().slice(0, 120) || "";
  let id = request.nextUrl.searchParams.get("id") || "";
  const page = Number(request.nextUrl.searchParams.get("page") || 1);
  const lang = request.nextUrl.searchParams.get("lang") === "de" ? "de" : "en";
  if (
    (id && !/^OL\d+A$/.test(id)) ||
    !name ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 1000
  )
    return Response.json({ error: "Invalid author" }, { status: 400 });
  try {
    if (!id) {
      const search = await get(
        `https://openlibrary.org/search/authors.json?${new URLSearchParams({ q: name, limit: "20" })}`,
      );
      const exact = (search.docs || []).filter(
        (a: { name: string; alternate_names?: string[] }) =>
          [a.name, ...(a.alternate_names || [])].some(
            (n) => authorKey(n) === authorKey(name),
          ),
      );
      exact.sort(
        (a: { work_count: number }, b: { work_count: number }) =>
          b.work_count - a.work_count,
      );
      id = exact[0]?.key;
      if (!id)
        return Response.json(
          { error: "No exact author record found" },
          { status: 404 },
        );
    }
    const author = await get(`https://openlibrary.org/authors/${id}.json`);
    let worksError = false;
    let results: { docs: Record<string, unknown>[]; numFound: number } = {
      docs: [],
      numFound: 0,
    };
    try {
      const fields =
        "key,title,author_name,cover_i,first_publish_year,number_of_pages_median,readinglog_count,osp_count,edition_count";
      const url = (offset: number, limit: number) =>
        "https://openlibrary.org/search.json?" +
        new URLSearchParams({
          q: `author_key:${id}`,
          sort: "readinglog",
          limit: String(limit),
          offset: String(offset),
          lang,
          fields,
        });
      const popular = await get(url(0, AUTHOR_RANKING_WINDOW));
      const ranked = rankAuthorWorks(popular.docs || [], author.name || name);
      const offset = (page - 1) * 24;
      results.numFound = Math.max(
        0,
        (popular.numFound || 0) - ((popular.docs || []).length - ranked.length),
      );
      results.docs = ranked.slice(offset, offset + 24);
      if (
        offset + 24 > ranked.length &&
        popular.numFound > AUTHOR_RANKING_WINDOW
      ) {
        const tail = await get(
          url(
            AUTHOR_RANKING_WINDOW + Math.max(0, offset - ranked.length),
            24 - results.docs.length,
          ),
        );
        results.docs.push(...(tail.docs || []));
      }
    } catch {
      worksError = true;
    }
    return Response.json({
      id,
      name: author.name,
      birth: author.birth_date,
      death: author.death_date,
      biography:
        typeof author.bio === "string" ? author.bio : author.bio?.value || "",
      source: `https://openlibrary.org/authors/${id}`,
      total: results.numFound || 0,
      worksError,
      books: results.docs
        .filter((d) => /^\/?(?:works\/)?OL\d+W$/.test(String(d.key)))
        .map((d) => ({
          id: String(d.key).startsWith("/works/") ? d.key : `/works/${d.key}`,
          title: d.title,
          author: ((d.author_name as string[]) || [name]).join(", "),
          year: d.first_publish_year || 0,
          cover: d.cover_i
            ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
            : "",
          pages: d.number_of_pages_median || 0,
          status: "Want to Read",
          rating: 0,
          date: "",
          tags: [],
          review: "",
          spoiler: false,
          description: "",
          progress: 0,
        })),
    });
  } catch {
    return Response.json(
      { error: "Author profile unavailable" },
      { status: 502 },
    );
  }
}
