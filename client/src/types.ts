export interface DocumentSummary {
  id: string;
  title: string;
  type: string;
  pages: number;
  currentPage: number;
  progress: number;
  lastOpened: string;
}

export interface PageContent {
  page: number;
  totalPages: number;
  paragraphs: string[];
}

export interface Highlight {
  id: string;
  page: number;
  text: string;
  color: string;
  note: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citation?: string;
}

export type SelectionToolbarMode = 'actions' | 'highlight' | 'note';

export interface SelectionToolbarState {
  text: string;
  x: number;
  y: number;
  page: number;
  mode: SelectionToolbarMode;
}

export interface ContextMenuState {
  x: number;
  y: number;
  docId: string;
}
