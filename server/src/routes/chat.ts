import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { askDocumentAssistant, type PageExcerpt } from '../anthropic.js';

interface ChatRow {
  id: string;
  document_id: string;
  role: string;
  text: string;
  citation_page: number | null;
  created_at: string;
}

interface DocRow {
  id: string;
  title: string;
  pages_json: string;
  total_pages: number;
}

function toJson(row: ChatRow) {
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    citation: row.citation_page != null ? `Page ${row.citation_page}` : undefined,
  };
}

function insertMessage(documentId: string, role: string, text: string, citationPage: number | null) {
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO chat_messages (id, document_id, role, text, citation_page, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, documentId, role, text, citationPage, new Date().toISOString());
  return db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id) as ChatRow;
}

export const chatRouter = Router();

chatRouter.get('/documents/:id/chat', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM chat_messages WHERE document_id = ? ORDER BY created_at ASC')
    .all(req.params.id) as ChatRow[];
  res.json(rows.map(toJson));
});

chatRouter.post('/documents/:id/chat', async (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocRow | undefined;
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const { text, page } = req.body as { text?: string; page?: number };
  const question = (text ?? '').trim();
  if (!question) return res.status(400).json({ error: 'text is required' });

  const userRow = insertMessage(req.params.id, 'user', question, null);

  try {
    const pages: string[][] = JSON.parse(doc.pages_json);
    const centerPage = Math.min(Math.max(1, Number(page) || 1), doc.total_pages);
    const excerpts: PageExcerpt[] = [];
    for (let p = Math.max(1, centerPage - 1); p <= Math.min(doc.total_pages, centerPage + 1); p++) {
      excerpts.push({ page: p, text: pages[p - 1].join(' ') });
    }

    const result = await askDocumentAssistant(question, excerpts, doc.title);
    const assistantRow = insertMessage(req.params.id, 'assistant', result.answer, result.citationPage);
    res.status(201).json({ userMessage: toJson(userRow), assistantMessage: toJson(assistantRow) });
  } catch (err) {
    console.error('Chat request failed:', err);
    const assistantRow = insertMessage(
      req.params.id,
      'assistant',
      "Sorry, I couldn't reach the assistant just now. Please try again.",
      null
    );
    res.status(200).json({ userMessage: toJson(userRow), assistantMessage: toJson(assistantRow) });
  }
});
