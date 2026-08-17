export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

function splitLongParagraph(text: string, target: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && cur.length + s.length > target) {
      chunks.push(cur.trim());
      cur = '';
    }
    cur += (cur ? ' ' : '') + s;
  }
  if (cur) chunks.push(cur.trim());
  return chunks.length ? chunks : [text];
}

/** Packs paragraphs into reader "pages" targeting a comfortable reading length per page. */
export function paginateParagraphs(
  paragraphs: string[],
  targetCharsPerPage = 900,
  maxParasPerPage = 6
): string[][] {
  const pages: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;

  for (const para of paragraphs) {
    const pieces = para.length > targetCharsPerPage * 1.5 ? splitLongParagraph(para, targetCharsPerPage) : [para];
    for (const piece of pieces) {
      if (current.length && (currentChars + piece.length > targetCharsPerPage || current.length >= maxParasPerPage)) {
        pages.push(current);
        current = [];
        currentChars = 0;
      }
      current.push(piece);
      currentChars += piece.length;
    }
  }
  if (current.length) pages.push(current);
  return pages.length ? pages : [['(No extractable text found in this document.)']];
}
