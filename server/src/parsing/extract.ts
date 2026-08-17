import fs from 'node:fs';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { EPub } from 'epub2';
import { paginateParagraphs, splitIntoParagraphs } from './paginate.js';

export type DocType = 'PDF' | 'DOCX' | 'EPUB';

export function docTypeFromExt(ext: string): DocType | null {
  const e = ext.toLowerCase().replace(/^\./, '');
  if (e === 'pdf') return 'PDF';
  if (e === 'docx') return 'DOCX';
  if (e === 'epub') return 'EPUB';
  return null;
}

async function extractPdfPages(filePath: string): Promise<string[][]> {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.pages.map((p) => {
      const paras = splitIntoParagraphs(p.text);
      return paras.length ? paras : ['(No extractable text on this page.)'];
    });
  } finally {
    await parser.destroy();
  }
}

async function extractDocxPages(filePath: string): Promise<string[][]> {
  const { value } = await mammoth.extractRawText({ path: filePath });
  const paragraphs = splitIntoParagraphs(value);
  return paginateParagraphs(paragraphs);
}

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|br|section|article)>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function getChapterText(epub: EPub, id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    epub.getChapter(id, (err, text) => {
      if (err) reject(err);
      else resolve(text || '');
    });
  });
}

async function extractEpubPages(filePath: string): Promise<string[][]> {
  const epub: EPub = await new Promise((resolve, reject) => {
    const e = new EPub(filePath);
    e.on('end', () => resolve(e));
    e.on('error', reject);
    e.parse();
  });

  const chapterTexts = await Promise.all(epub.flow.map((item) => getChapterText(epub, item.id!)));
  const fullText = chapterTexts.map(stripHtml).join('\n\n');
  const paragraphs = splitIntoParagraphs(fullText);
  return paginateParagraphs(paragraphs);
}

export async function extractPages(filePath: string, type: DocType): Promise<string[][]> {
  if (type === 'PDF') return extractPdfPages(filePath);
  if (type === 'DOCX') return extractDocxPages(filePath);
  return extractEpubPages(filePath);
}
