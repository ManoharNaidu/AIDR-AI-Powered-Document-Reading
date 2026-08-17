import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { documentsRouter } from './routes/documents.js';
import { highlightsRouter } from './routes/highlights.js';
import { chatRouter } from './routes/chat.js';
import './db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', documentsRouter);
app.use('/api', highlightsRouter);
app.use('/api', chatRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Folio server listening on http://localhost:${PORT}`);
});
