import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';

interface HighlightRow {
  id: string;
  document_id: string;
  page: number;
  text: string;
  color: string;
  note: string | null;
  created_at: string;
}

function toJson(row: HighlightRow) {
  return { id: row.id, page: row.page, text: row.text, color: row.color, note: row.note };
}

export const highlightsRouter = Router();

highlightsRouter.get('/documents/:id/highlights', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM highlights WHERE document_id = ? ORDER BY created_at ASC')
    .all(req.params.id) as HighlightRow[];
  res.json(rows.map(toJson));
});

highlightsRouter.post('/documents/:id/highlights', (req, res) => {
  const doc = db.prepare('SELECT id FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const { page, text, color, note } = req.body as { page?: number; text?: string; color?: string; note?: string | null };
  if (!page || !text || !color) return res.status(400).json({ error: 'page, text, and color are required' });

  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO highlights (id, document_id, page, text, color, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, page, text, color, note ?? null, new Date().toISOString());

  const row = db.prepare('SELECT * FROM highlights WHERE id = ?').get(id) as HighlightRow;
  res.status(201).json(toJson(row));
});

highlightsRouter.delete('/highlights/:id', (req, res) => {
  const result = db.prepare('DELETE FROM highlights WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Highlight not found' });
  res.status(204).end();
});
