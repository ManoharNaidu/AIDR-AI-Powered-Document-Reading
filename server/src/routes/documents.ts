import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';
import { timeAgo } from '../helpers.js';
import { docTypeFromExt, extractPages } from '../parsing/extract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const type = docTypeFromExt(path.extname(file.originalname));
    if (!type) return cb(new Error('Unsupported file type. Please upload a PDF, DOCX, or EPUB.'));
    cb(null, true);
  },
});

interface DocRow {
  id: string;
  title: string;
  type: string;
  file_path: string | null;
  pages_json: string;
  total_pages: number;
  current_page: number;
  progress: number;
  last_opened_at: string;
  created_at: string;
}

function toSummary(row: DocRow) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    pages: row.total_pages,
    currentPage: row.current_page,
    progress: row.progress,
    lastOpened: timeAgo(row.last_opened_at),
  };
}

export const documentsRouter = Router();

documentsRouter.get('/documents', (_req, res) => {
  const rows = db.prepare('SELECT * FROM documents ORDER BY last_opened_at DESC').all() as DocRow[];
  res.json(rows.map(toSummary));
});

documentsRouter.get('/documents/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocRow | undefined;
  if (!row) return res.status(404).json({ error: 'Document not found' });
  res.json(toSummary(row));
});

documentsRouter.post('/documents/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const type = docTypeFromExt(path.extname(file.originalname));
  if (!type) {
    fs.unlink(file.path, () => {});
    return res.status(400).json({ error: 'Unsupported file type' });
  }

  try {
    const pages = await extractPages(file.path, type);
    const title = path.basename(file.originalname, path.extname(file.originalname));
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    db.prepare(
      `INSERT INTO documents (id, title, type, file_path, pages_json, total_pages, current_page, progress, last_opened_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`
    ).run(id, title, type, file.path, JSON.stringify(pages), pages.length, now, now);

    const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocRow;
    res.status(201).json(toSummary(row));
  } catch (err) {
    fs.unlink(file.path, () => {});
    console.error('Failed to parse upload:', err);
    res.status(422).json({ error: 'Could not parse this document.' });
  }
});

documentsRouter.patch('/documents/:id', (req, res) => {
  const { title } = req.body as { title?: string };
  const trimmed = (title ?? '').trim();
  if (!trimmed) return res.status(400).json({ error: 'title is required' });
  const result = db.prepare('UPDATE documents SET title = ? WHERE id = ?').run(trimmed, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Document not found' });
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocRow;
  res.json(toSummary(row));
});

documentsRouter.post('/documents/:id/duplicate', (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocRow | undefined;
  if (!row) return res.status(404).json({ error: 'Document not found' });
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO documents (id, title, type, file_path, pages_json, total_pages, current_page, progress, last_opened_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`
  ).run(id, `${row.title} (Copy)`, row.type, row.file_path, row.pages_json, row.total_pages, now, now);
  const created = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocRow;
  res.status(201).json(toSummary(created));
});

documentsRouter.delete('/documents/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocRow | undefined;
  if (!row) return res.status(404).json({ error: 'Document not found' });
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  if (row.file_path) fs.unlink(row.file_path, () => {});
  res.status(204).end();
});

documentsRouter.get('/documents/:id/pages/:page', (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocRow | undefined;
  if (!row) return res.status(404).json({ error: 'Document not found' });
  const pages: string[][] = JSON.parse(row.pages_json);
  const pageNum = Math.min(Math.max(1, parseInt(req.params.page, 10) || 1), pages.length);
  res.json({ page: pageNum, totalPages: pages.length, paragraphs: pages[pageNum - 1] });
});

documentsRouter.patch('/documents/:id/progress', (req, res) => {
  const { page } = req.body as { page?: number };
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocRow | undefined;
  if (!row) return res.status(404).json({ error: 'Document not found' });
  const clamped = Math.min(Math.max(1, Number(page) || row.current_page), row.total_pages);
  const progress = Math.max(row.progress, Math.min(1, clamped / row.total_pages));
  const now = new Date().toISOString();
  db.prepare('UPDATE documents SET current_page = ?, progress = ?, last_opened_at = ? WHERE id = ?').run(
    clamped,
    progress,
    now,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocRow;
  res.json(toSummary(updated));
});
