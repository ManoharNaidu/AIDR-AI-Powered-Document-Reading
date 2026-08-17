import type { ChatMessage, DocumentSummary, Highlight, PageContent } from './types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listDocuments: () => request<DocumentSummary[]>('/documents'),

  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<DocumentSummary>('/documents/upload', { method: 'POST', body: form });
  },

  renameDocument: (id: string, title: string) =>
    request<DocumentSummary>(`/documents/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),

  duplicateDocument: (id: string) => request<DocumentSummary>(`/documents/${id}/duplicate`, { method: 'POST' }),

  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),

  getPage: (id: string, page: number) => request<PageContent>(`/documents/${id}/pages/${page}`),

  updateProgress: (id: string, page: number) =>
    request<DocumentSummary>(`/documents/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ page }) }),

  listHighlights: (id: string) => request<Highlight[]>(`/documents/${id}/highlights`),

  createHighlight: (id: string, payload: { page: number; text: string; color: string; note?: string | null }) =>
    request<Highlight>(`/documents/${id}/highlights`, { method: 'POST', body: JSON.stringify(payload) }),

  deleteHighlight: (id: string) => request<void>(`/highlights/${id}`, { method: 'DELETE' }),

  listChat: (id: string) => request<ChatMessage[]>(`/documents/${id}/chat`),

  sendChat: (id: string, text: string, page: number) =>
    request<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(`/documents/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ text, page }),
    }),
};
