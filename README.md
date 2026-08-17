# Folio — AI-Powered Document Reader

A full-stack implementation of the Folio document reader design (see `design/` for the
original Claude Design handoff bundle: README, chat transcripts, and the `.dc.html`
prototype this app is built from).

- **Client**: React + Vite + TypeScript + Tailwind CSS (`client/`)
- **Server**: Node.js + Express + TypeScript + SQLite (`server/`)
- **AI**: Anthropic Claude API, grounded in the actual parsed text of the current page
- **Document parsing**: real PDF/DOCX/EPUB text extraction and pagination (no mock content)

## Features

- Upload PDF, DOCX, or EPUB files; text is extracted and paginated into a two-page book
  spread, with per-document reading progress persisted in SQLite.
- Library sidebar with right-click rename / duplicate / delete.
- Reader toolbar: page navigation, zoom, and read-aloud (browser `SpeechSynthesis`) with
  speed control.
- Text-selection popup: Ask AI, Highlight (4 colors), Copy, Add note.
- Document Assistant chat panel, grounded in the current page (± 1) of the real document
  text via the Claude API, with tool-use enforced citations that jump to the cited page.
  Minimizes to a floating button.
- Notes tab listing all highlights/notes with jump-to-page and delete.
- Light/dark theme matching the original design tokens exactly.

## Setup

Requires Node.js 20+.

```bash
npm install --prefix server
npm install --prefix client
cp server/.env.example server/.env
# then edit server/.env and set ANTHROPIC_API_KEY
```

## Run

From the repo root:

```bash
npm install   # installs the root `concurrently` dev dependency
npm run dev
```

This starts the API server on `http://localhost:4000` and the Vite dev server on
`http://localhost:5173` (which proxies `/api` to the server). Open
`http://localhost:5173`.

Without `ANTHROPIC_API_KEY` set, everything works except the chat panel, which responds
with a graceful fallback message instead of calling the model.

## Architecture

```
server/
  src/
    db.ts              SQLite schema (documents, highlights, chat_messages)
    parsing/
      extract.ts        PDF (pdf-parse) / DOCX (mammoth) / EPUB (epub2) text extraction
      paginate.ts        Packs paragraphs into reader "pages" by target length
    routes/
      documents.ts       Upload, list, rename, duplicate, delete, page content, progress
      highlights.ts       Highlights/notes CRUD
      chat.ts             Chat, grounded in nearby page text, via anthropic.ts
    anthropic.ts          Claude API wrapper (tool-use enforced {answer, citationPage})

client/
  src/
    App.tsx              Top-level state + data flow
    api.ts                Typed fetch client for the server API
    theme.ts              Light/dark theme tokens (ported 1:1 from the design)
    components/           Header, Sidebar, Reader, SelectionToolbar, AssistantPanel, ContextMenu
```

## Build

```bash
npm run build
```
