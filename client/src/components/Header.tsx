import { PanelLeft, Sun, Moon, BookOpen } from 'lucide-react';
import type { DocumentSummary } from '../types';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentDoc: DocumentSummary | null;
}

export function Header({ sidebarOpen, onToggleSidebar, darkMode, onToggleDarkMode, currentDoc }: HeaderProps) {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-5"
      style={{ background: 'var(--header-bg)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          title="Toggle library"
          aria-pressed={sidebarOpen}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <PanelLeft size={18} strokeWidth={1.75} />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <BookOpen size={22} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
          <span className="text-[17px] font-extrabold tracking-tight">Folio</span>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2.5">
        {currentDoc && (
          <>
            <span className="max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] font-semibold">
              {currentDoc.title}
            </span>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {currentDoc.type}
            </span>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onToggleDarkMode}
          title="Toggle theme"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          {darkMode ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
        </button>
        <div
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[12.5px] font-bold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          JD
        </div>
      </div>
    </header>
  );
}
