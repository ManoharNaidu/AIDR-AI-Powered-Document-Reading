import { Paperclip, Send, Trash2 } from 'lucide-react';
import type { ChatMessage, DocumentSummary, Highlight } from '../types';

type RightTab = 'chat' | 'notes';

interface AssistantPanelProps {
  open: boolean;
  currentDoc: DocumentSummary | null;
  rightTab: RightTab;
  onSetTab: (tab: RightTab) => void;
  chatMessages: ChatMessage[];
  isAiTyping: boolean;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onChatKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onInsertPageRef: () => void;
  onCiteClick: (citation: string) => void;
  highlights: Highlight[];
  highlightFocusId: string | null;
  onJumpToPage: (page: number) => void;
  onDeleteHighlight: (id: string) => void;
}

export function AssistantPanel({
  open,
  currentDoc,
  rightTab,
  onSetTab,
  chatMessages,
  isAiTyping,
  chatInput,
  onChatInputChange,
  onChatKeyDown,
  onSendMessage,
  onInsertPageRef,
  onCiteClick,
  highlights,
  highlightFocusId,
  onJumpToPage,
  onDeleteHighlight,
}: AssistantPanelProps) {
  const sendDisabled = !chatInput.trim();

  return (
    <aside
      className="shrink-0 overflow-hidden border-l transition-[width] duration-200 ease-in-out"
      style={{ width: open ? 380 : 0, background: 'var(--right-panel-bg)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex h-full w-[380px] flex-col">
        <div className="shrink-0 px-4.5 pt-4">
          <div className="text-[14.5px] font-bold">Document Assistant</div>
          <div
            className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[12px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Ask about {currentDoc?.title ?? 'this document'}
          </div>
          <div className="mt-3.5 flex gap-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => onSetTab('chat')}
              className="cursor-pointer border-0 border-b-2 bg-transparent pb-2.5 text-[12.5px] font-bold"
              style={{
                borderBottomColor: rightTab === 'chat' ? 'var(--accent)' : 'transparent',
                color: rightTab === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              Chat
            </button>
            <button
              onClick={() => onSetTab('notes')}
              className="flex cursor-pointer items-center gap-1.5 border-0 border-b-2 bg-transparent pb-2.5 text-[12.5px] font-bold"
              style={{
                borderBottomColor: rightTab === 'notes' ? 'var(--accent)' : 'transparent',
                color: rightTab === 'notes' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              Notes
              {highlights.length > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {highlights.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {rightTab === 'chat' && (
          <>
            <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4.5 py-4">
              {chatMessages.map((msg) =>
                msg.role === 'user' ? (
                  <div
                    key={msg.id}
                    className="max-w-[82%] self-end rounded-tl-[14px] rounded-tr-[14px] rounded-br-[3px] rounded-bl-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                    style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div key={msg.id} className="flex max-w-[88%] flex-col gap-1.5 self-start">
                    <div
                      className="rounded-tl-[14px] rounded-tr-[14px] rounded-br-[14px] rounded-bl-[3px] border px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                      style={{ background: 'var(--bubble-assistant-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {msg.text}
                    </div>
                    {msg.citation && (
                      <button
                        onClick={() => onCiteClick(msg.citation!)}
                        title="Jump to this page"
                        className="cursor-pointer self-start rounded-full border-0 px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {msg.citation}
                      </button>
                    )}
                  </div>
                )
              )}
              {isAiTyping && (
                <div
                  className="flex gap-1 self-start rounded-tl-[14px] rounded-tr-[14px] rounded-br-[14px] rounded-bl-[3px] border px-3.5 py-3"
                  style={{ background: 'var(--bubble-assistant-bg)', borderColor: 'var(--border-color)' }}
                >
                  <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} />
                  <span
                    className="typing-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--text-muted)', animationDelay: '0.15s' }}
                  />
                  <span
                    className="typing-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--text-muted)', animationDelay: '0.3s' }}
                  />
                </div>
              )}
              {chatMessages.length === 0 && !isAiTyping && (
                <div className="px-1 py-6 text-center text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Ask a question about the current page to get started.
                </div>
              )}
            </div>

            <div
              className="flex shrink-0 items-end gap-2 border-t px-3.5 py-3"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <button
                onClick={onInsertPageRef}
                title="Reference this page"
                className="flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-lg border"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <Paperclip size={16} strokeWidth={1.75} />
              </button>
              <textarea
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyDown={onChatKeyDown}
                placeholder="Ask about this document..."
                rows={1}
                className="max-h-22.5 flex-1 resize-none rounded-[10px] border px-3 py-2.5 text-[13.5px] leading-snug"
                style={{ borderColor: 'var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={onSendMessage}
                disabled={sendDisabled}
                className="flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0"
                style={{ background: 'var(--accent)', color: 'var(--accent-contrast)', opacity: sendDisabled ? 0.45 : 1 }}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}

        {rightTab === 'notes' && (
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4.5 py-3.5">
            {highlights.length === 0 && (
              <div className="px-2.5 py-7.5 text-center text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                No notes yet. Select text in the reader and choose "Add note" or "Highlight".
              </div>
            )}
            {highlights.map((note) => (
              <div
                key={note.id}
                className="rounded-[10px] border p-2.5"
                style={{
                  borderColor: note.id === highlightFocusId ? 'var(--accent)' : 'var(--border-color)',
                  background: 'var(--bubble-assistant-bg)',
                }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onJumpToPage(note.page)}
                    className="cursor-pointer rounded-full border-0 px-2 py-0.5 text-[10.5px] font-bold"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    Page {note.page}
                  </button>
                  <button
                    onClick={() => onDeleteHighlight(note.id)}
                    title="Delete"
                    className="flex cursor-pointer border-0 bg-transparent p-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </div>
                <div
                  className="mb-1.5 border-l-3 pl-2 text-[12.5px] leading-snug italic"
                  style={{ borderColor: note.color, color: 'var(--text-secondary)' }}
                >
                  "{note.text}"
                </div>
                {note.note && (
                  <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {note.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
