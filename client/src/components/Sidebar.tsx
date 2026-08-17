import { Upload } from 'lucide-react';
import type { RefObject } from 'react';
import type { DocumentSummary } from '../types';

interface SidebarProps {
  open: boolean;
  documents: DocumentSummary[];
  currentDocId: string | null;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  renamingId: string | null;
  renameDraft: string;
  onRenameChange: (value: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRenameBlur: () => void;
  onUploadClick: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export function Sidebar({
  open,
  documents,
  currentDocId,
  onSelect,
  onContextMenu,
  renamingId,
  renameDraft,
  onRenameChange,
  onRenameKeyDown,
  onRenameBlur,
  onUploadClick,
  fileInputRef,
  onFileChange,
  uploading,
}: SidebarProps) {
  return (
    <aside
      className="shrink-0 overflow-hidden border-r transition-[width] duration-200 ease-in-out"
      style={{ width: open ? 288 : 0, background: 'var(--left-panel-bg)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex h-full w-[288px] flex-col p-4">
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.epub" onChange={onFileChange} className="hidden" />
        <button
          onClick={onUploadClick}
          disabled={uploading}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed px-3.5 py-5.5 font-[inherit] disabled:opacity-60"
          style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <Upload size={22} strokeWidth={1.75} />
          <span className="text-[13px] font-bold">{uploading ? 'Uploading…' : 'Upload new document'}</span>
          <span className="text-[11.5px] font-medium opacity-75">Drag & drop or click to browse</span>
        </button>

        <div
          className="mt-5.5 mb-2.5 text-[11px] font-bold tracking-wider uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Recent
        </div>

        <div className="-mx-2 flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2">
          {documents.map((doc) => {
            const isActive = doc.id === currentDocId;
            const progressPercent = Math.round(doc.progress * 100);
            return (
              <div
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                onContextMenu={(e) => onContextMenu(e, doc.id)}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border p-2.5"
                style={{
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  borderColor: isActive ? 'var(--accent)' : 'transparent',
                }}
              >
                <div
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg text-[9px] font-extrabold tracking-wide"
                  style={{
                    background: isActive ? 'var(--accent)' : 'var(--border-color)',
                    color: isActive ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                  }}
                >
                  {doc.type}
                </div>
                <div className="min-w-0 flex-1">
                  {renamingId === doc.id ? (
                    <input
                      value={renameDraft}
                      onChange={(e) => onRenameChange(e.target.value)}
                      onKeyDown={onRenameKeyDown}
                      onBlur={onRenameBlur}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full rounded-[5px] border px-1 py-0.5 text-[13px] font-semibold"
                      style={{ borderColor: 'var(--accent)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  ) : (
                    <div
                      className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {doc.title}
                    </div>
                  )}
                  <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {doc.lastOpened}
                  </div>
                  <div
                    className="mt-1.5 h-1 overflow-hidden rounded-full"
                    style={{ background: 'var(--border-color)' }}
                  >
                    <div className="h-full rounded-full" style={{ background: 'var(--accent)', width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {documents.length === 0 && (
            <div className="px-1 py-6 text-center text-[12.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              No documents yet. Upload a PDF, DOCX, or EPUB to get started.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
