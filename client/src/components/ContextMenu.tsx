import { Pencil, Copy, Trash2 } from 'lucide-react';
import type { ContextMenuState } from '../types';

interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ContextMenu({ menu, onClose, onRename, onDuplicate, onDelete }: ContextMenuProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        className="fixed z-[41] flex min-w-[150px] flex-col gap-0.5 rounded-[10px] border p-1.5"
        style={{
          left: menu.x,
          top: menu.y,
          background: 'var(--header-bg)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 12px 28px var(--shadow-color)',
        }}
      >
        <button
          onClick={onRename}
          className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[13px] hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
        >
          <Pencil size={14} strokeWidth={1.75} />
          Rename
        </button>
        <button
          onClick={onDuplicate}
          className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[13px] hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
        >
          <Copy size={14} strokeWidth={1.75} />
          Duplicate
        </button>
        <button
          onClick={onDelete}
          className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-left text-[13px] text-red-600 hover:bg-red-500/10"
        >
          <Trash2 size={14} strokeWidth={1.75} />
          Delete
        </button>
      </div>
    </>
  );
}
