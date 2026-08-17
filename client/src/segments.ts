import type { Highlight } from './types';

export interface Segment {
  text: string;
  highlight: Highlight | null;
}

export function buildSegments(text: string, highlightsOnPage: Highlight[]): Segment[] {
  const matches = highlightsOnPage.filter((h) => text.includes(h.text));
  if (!matches.length) return [{ text, highlight: null }];

  const ranges = matches
    .map((h) => ({ start: text.indexOf(h.text), end: text.indexOf(h.text) + h.text.length, h }))
    .sort((a, b) => a.start - b.start);

  const clean: typeof ranges = [];
  let lastEnd = 0;
  for (const r of ranges) {
    if (r.start >= lastEnd) {
      clean.push(r);
      lastEnd = r.end;
    }
  }

  const segments: Segment[] = [];
  let cursor = 0;
  for (const r of clean) {
    if (r.start > cursor) segments.push({ text: text.slice(cursor, r.start), highlight: null });
    segments.push({ text: text.slice(r.start, r.end), highlight: r.h });
    cursor = r.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlight: null });
  return segments;
}
