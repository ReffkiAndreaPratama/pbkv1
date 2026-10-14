import type { MaterialLink } from "@/lib/types";

export function embedVideoUrl(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function linksToText(links?: MaterialLink[] | null): string {
  return (links ?? []).map((l) => (l.title ? `${l.title} | ${l.url}` : l.url)).join("\n");
}

export function textToLinks(text: string): MaterialLink[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const sep = line.indexOf("|");
      if (sep > 0) {
        const title = line.slice(0, sep).trim();
        const url = line.slice(sep + 1).trim();
        return { title, url };
      }
      return { title: line, url: line };
    })
    .filter((l) => /^https?:\/\//i.test(l.url));
}