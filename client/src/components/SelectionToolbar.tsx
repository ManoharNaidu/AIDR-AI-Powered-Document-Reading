import { forwardRef } from 'react';
import { MessageCircleQuestion, Highlighter, Copy, StickyNote, ChevronLeft } from 'lucide-react';
import type { SelectionToolbarState } from '../types';
import { HIGHLIGHT_COLORS } from '../theme';

interface SelectionToolbarProps {
  toolbar: SelectionToolbarState;
  onAskAi: () => void;
  onOpenHighlightPicker: () => void;
  onCopy: () => void;
  onOpenNoteInput: () => void;
  onBackToActions: () => void;
  onPickColor: (color: string) => void;
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  onCancelNote: () => void;
  onSaveNote: () => void;
}

export const SelectionToolbar = forwardRef<HTMLDivElement, SelectionToolbarProps>(function SelectionToolbar(
  {
    toolbar,
    onAskAi,
    onOpenHighlightPicker,
    onCopy,
    onOpenNoteInput,
    onBackToActions,
    onPickColor,
    noteDraft,
    onNoteDraftChange,
    onCancelNote,
    onSaveNote,
  },
  ref
) {
  return (
    <div
      ref={ref}
      className="fixed z-[50] flex items-center gap-0.5 rounded-[10px] border p-1.5"
      style={{
        left: toolbar.x,
        top: toolbar.y,
        transform: 'translate(-50%, calc(-100% - 10px))',
        background: 'var(--header-bg)',
        borderColor: 'var(--border-color)',
        boxShadow: '0 12px 24px var(--shadow-color)',
      }}
    >
      {toolbar.mode === 'actions' && (
        <>
          <button
            onClick={onAskAi}
            title="Ask AI about this"
            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MessageCircleQuestion size={16} strokeWidth={1.75} />
          </button>
          <button
            onClick={onOpenHighlightPicker}
            title="Highlight"
            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Highlighter size={16} strokeWidth={1.75} />
          </button>
          <button
            onClick={onCopy}
            title="Copy"
            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Copy size={16} strokeWidth={1.75} />
          </button>
          <button
            onClick={onOpenNoteInput}
            title="Add note"
            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <StickyNote size={16} strokeWidth={1.75} />
          </button>
        </>
      )}

      {toolbar.mode === 'highlight' && (
        <>
          <button
            onClick={onBackToActions}
            title="Back"
            className="mr-1 flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-[7px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={14} />
          </button>
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onPickColor(color)}
              title="Highlight"
              className="mx-0.5 h-5.5 w-5.5 cursor-pointer rounded-full border-2 border-transparent"
              style={{ background: color }}
            />
          ))}
        </>
      )}

      {toolbar.mode === 'note' && (
        <div className="flex w-55 flex-col gap-1.5 p-0.5">
          <textarea
            value={noteDraft}
            onChange={(e) => onNoteDraftChange(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            autoFocus
            className="resize-none rounded-[7px] border px-2.5 py-1.5 text-[12.5px]"
            style={{ borderColor: 'var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={onCancelNote}
              className="cursor-pointer rounded-[7px] border px-2.5 py-1.5 text-[11.5px] font-bold"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={onSaveNote}
              className="cursor-pointer rounded-[7px] border-0 px-2.5 py-1.5 text-[11.5px] font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
