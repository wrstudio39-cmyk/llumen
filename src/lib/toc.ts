export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugifyHeading(text: string, seen: Map<string, number>): string {
  const base = text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base || "section" : `${base}-${count}`;
}

/**
 * Walks rendered post HTML, injects a stable `id` on every h2/h3, and
 * returns both the patched HTML and a flat list for the table of contents.
 * Pure string processing (no DOM) so it runs identically on the server.
 */
export function buildTableOfContents(html: string | null): { html: string; headings: TocHeading[] } {
  if (!html) return { html: "", headings: [] };

  const headings: TocHeading[] = [];
  const seen = new Map<string, number>();

  const patched = html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (_match, level, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const id = slugifyHeading(text, seen);
    headings.push({ id, text, level: Number(level) as 2 | 3 });
    // Strip any pre-existing id attribute before adding ours.
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/i, "");
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: patched, headings };
}
