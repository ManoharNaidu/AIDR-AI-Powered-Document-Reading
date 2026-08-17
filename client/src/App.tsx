import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, MessageSquare } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ContextMenu } from './components/ContextMenu';
import { Reader } from './components/Reader';
import { SelectionToolbar } from './components/SelectionToolbar';
import { AssistantPanel } from './components/AssistantPanel';
import { api } from './api';
import { buildTheme, themeToCssVars } from './theme';
import type {
  ChatMessage,
  ContextMenuState,
  DocumentSummary,
  Highlight,
  SelectionToolbarMode,
  SelectionToolbarState,
} from './types';

const SPEEDS = [1, 1.5, 2];

export default function App() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [leftParagraphs, setLeftParagraphs] = useState<string[]>([]);
  const [rightParagraphs, setRightParagraphs] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [rightTab, setRightTab] = useState<'chat' | 'notes'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightFocusId, setHighlightFocusId] = useState<string | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbarState | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readSpeed, setReadSpeed] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const theme = buildTheme(darkMode);
  const currentDoc = documents.find((d) => d.id === currentDocId) ?? null;
  const totalPages = currentDoc?.pages ?? 1;
  const rightPageNum = Math.min(currentPage + 1, totalPages);

  const updateDocInList = useCallback((updated: DocumentSummary) => {
    setDocuments((docs) => docs.map((d) => (d.id === updated.id ? updated : d)));
  }, []);

  // Initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
    api
      .listDocuments()
      .then((docs) => {
        setDocuments(docs);
        if (docs.length) {
          setCurrentDocId(docs[0].id);
          setCurrentPage(docs[0].currentPage);
        }
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  // Load highlights + chat when the active document changes
  useEffect(() => {
    if (!currentDocId) {
      setHighlights([]);
      setChatMessages([]);
      return;
    }
    setSelectionToolbar(null);
    api.listHighlights(currentDocId).then(setHighlights).catch(() => setHighlights([]));
    api.listChat(currentDocId).then(setChatMessages).catch(() => setChatMessages([]));
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
  }, [currentDocId]);

  // Load the two-page spread whenever the page or document changes
  useEffect(() => {
    if (!currentDocId) {
      setLeftParagraphs([]);
      setRightParagraphs([]);
      return;
    }
    let cancelled = false;
    Promise.all([api.getPage(currentDocId, currentPage), api.getPage(currentDocId, rightPageNum)])
      .then(([left, right]) => {
        if (cancelled) return;
        setLeftParagraphs(left.paragraphs);
        setRightParagraphs(right.paragraphs);
      })
      .catch(() => {});
    api
      .updateProgress(currentDocId, currentPage)
      .then(updateDocInList)
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDocId, currentPage]);

  // Text selection -> floating toolbar
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) return;
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (!text || !sel || !sel.anchorNode) {
        setSelectionToolbar((cur) => (cur ? null : cur));
        return;
      }
      const node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : (sel.anchorNode as Element);
      const pageEl = node && node.closest ? node.closest('[data-page-num]') : null;
      if (!pageEl) {
        setSelectionToolbar((cur) => (cur ? null : cur));
        return;
      }
      const page = parseInt(pageEl.getAttribute('data-page-num')!, 10);
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionToolbar({ text, x: rect.left + rect.width / 2, y: rect.top, page, mode: 'actions' });
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const getSpreadText = useCallback(
    () => leftParagraphs.concat(rightParagraphs).join(' '),
    [leftParagraphs, rightParagraphs]
  );

  const selectDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    setCurrentDocId(id);
    setCurrentPage(doc?.currentPage ?? 1);
    setContextMenu(null);
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      setDocuments((docs) => [doc, ...docs]);
      setCurrentDocId(doc.id);
      setCurrentPage(1);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 2));
  const goNextPage = () => setCurrentPage((p) => Math.min(Math.max(1, totalPages - 1), p + 2));
  const onPageInput = (page: number) => setCurrentPage(Math.min(Math.max(1, page), Math.max(1, totalPages - 1)));

  const zoomIn = () => setZoom((z) => Math.min(180, z + 10));
  const zoomOut = () => setZoom((z) => Math.max(60, z - 10));

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(readSpeed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setReadSpeed(next);
    if (isReading && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(getSpreadText());
      utter.rate = next;
      utter.onend = () => {
        setIsReading(false);
        setIsPaused(false);
      };
      window.speechSynthesis.speak(utter);
    }
  };

  const togglePlay = () => {
    if (!window.speechSynthesis) return;
    if (isReading && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(getSpreadText());
    utter.rate = readSpeed;
    utter.onend = () => {
      setIsReading(false);
      setIsPaused(false);
    };
    window.speechSynthesis.speak(utter);
    setIsReading(true);
    setIsPaused(false);
  };

  const stopReading = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
  };

  const insertPageRef = () => setChatInput((v) => `${v ? v + ' ' : ''}[Page ${currentPage}] `);

  const jumpToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, Math.max(1, totalPages - 1))));

  const onCiteClick = (citation: string) => jumpToPage(parseInt(citation.replace(/\D/g, ''), 10));

  const sendMessage = async () => {
    if (!currentDocId) return;
    const text = chatInput.trim();
    if (!text) return;
    const tempUser: ChatMessage = { id: `temp-${Date.now()}`, role: 'user', text };
    setChatMessages((msgs) => [...msgs, tempUser]);
    setChatInput('');
    setIsAiTyping(true);
    try {
      const { userMessage, assistantMessage } = await api.sendChat(currentDocId, text, currentPage);
      setChatMessages((msgs) => [...msgs.filter((m) => m.id !== tempUser.id), userMessage, assistantMessage]);
    } catch {
      setChatMessages((msgs) => [
        ...msgs,
        { id: `err-${Date.now()}`, role: 'assistant', text: "Sorry, I couldn't reach the assistant just now." },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const onChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Library context menu / rename
  const openContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, docId });
  };
  const closeContextMenu = () => setContextMenu(null);

  const startRename = () => {
    if (!contextMenu) return;
    const doc = documents.find((d) => d.id === contextMenu.docId);
    setRenamingId(contextMenu.docId);
    setRenameDraft(doc?.title ?? '');
    setContextMenu(null);
  };
  const commitRename = async () => {
    if (!renamingId) return;
    const val = renameDraft.trim();
    const id = renamingId;
    setRenamingId(null);
    if (!val) return;
    try {
      const updated = await api.renameDocument(id, val);
      updateDocInList(updated);
    } catch {
      /* ignore */
    }
  };
  const onRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    else if (e.key === 'Escape') setRenamingId(null);
  };

  const duplicateDoc = async () => {
    if (!contextMenu) return;
    const id = contextMenu.docId;
    setContextMenu(null);
    try {
      const copy = await api.duplicateDocument(id);
      setDocuments((docs) => {
        const idx = docs.findIndex((d) => d.id === id);
        const next = [...docs];
        next.splice(idx + 1, 0, copy);
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  const deleteDoc = async () => {
    if (!contextMenu) return;
    const id = contextMenu.docId;
    setContextMenu(null);
    try {
      await api.deleteDocument(id);
      setDocuments((docs) => {
        const next = docs.filter((d) => d.id !== id);
        if (id === currentDocId) {
          setCurrentDocId(next[0]?.id ?? null);
          setCurrentPage(next[0]?.currentPage ?? 1);
        }
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  // Selection toolbar actions
  const patchToolbar = (patch: Partial<SelectionToolbarState>) =>
    setSelectionToolbar((t) => (t ? { ...t, ...patch } : t));
  const setToolbarMode = (mode: SelectionToolbarMode) => patchToolbar({ mode });

  const askAi = () => {
    if (!selectionToolbar) return;
    setChatInput((v) => `${v ? v + ' ' : ''}"${selectionToolbar.text}" `);
    setRightTab('chat');
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
  };

  const copySelection = () => {
    if (selectionToolbar && navigator.clipboard) navigator.clipboard.writeText(selectionToolbar.text).catch(() => {});
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
  };

  const applyHighlight = async (color: string) => {
    if (!selectionToolbar || !currentDocId) return;
    const { text, page } = selectionToolbar;
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
    try {
      const highlight = await api.createHighlight(currentDocId, { page, text, color });
      setHighlights((hs) => [...hs, highlight]);
    } catch {
      /* ignore */
    }
  };

  const saveNote = async () => {
    if (!selectionToolbar || !currentDocId) return;
    const note = noteDraft.trim();
    const { text, page } = selectionToolbar;
    setSelectionToolbar(null);
    setNoteDraft('');
    if (!note) return;
    try {
      const highlight = await api.createHighlight(currentDocId, { page, text, color: '#FDE68A', note });
      setHighlights((hs) => [...hs, highlight]);
      setRightTab('notes');
    } catch {
      /* ignore */
    }
  };

  const focusNote = (id: string) => {
    setRightTab('notes');
    setHighlightFocusId(id);
    setTimeout(() => setHighlightFocusId((cur) => (cur === id ? null : cur)), 2500);
  };

  const removeHighlight = async (id: string) => {
    setHighlights((hs) => hs.filter((h) => h.id !== id));
    try {
      await api.deleteHighlight(id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden"
      style={{ ...themeToCssVars(theme), background: 'var(--bg-app)', color: 'var(--text-primary)' } as React.CSSProperties}
    >
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((v) => !v)}
        currentDoc={currentDoc}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          documents={documents}
          currentDocId={currentDocId}
          onSelect={selectDocument}
          onContextMenu={openContextMenu}
          renamingId={renamingId}
          renameDraft={renameDraft}
          onRenameChange={setRenameDraft}
          onRenameKeyDown={onRenameKeyDown}
          onRenameBlur={commitRename}
          onUploadClick={triggerUpload}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          uploading={uploading}
        />

        {currentDoc ? (
          <Reader
            currentPage={currentPage}
            totalPages={totalPages}
            rightPageNum={rightPageNum}
            leftParagraphs={leftParagraphs}
            rightParagraphs={rightParagraphs}
            highlights={highlights}
            zoom={zoom}
            onPrevPage={goPrevPage}
            onNextPage={goNextPage}
            onPageInput={onPageInput}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            ttsEnabled
            isPlaying={isReading && !isPaused}
            speedLabel={`${readSpeed}x`}
            onTogglePlay={togglePlay}
            onStopReading={stopReading}
            onCycleSpeed={cycleSpeed}
            onScroll={() => selectionToolbar && setSelectionToolbar(null)}
            onNoteIconClick={focusNote}
          />
        ) : (
          <main
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden text-center"
            style={{ background: 'var(--center-surround-bg)' }}
          >
            <BookOpen size={40} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            <div className="text-[15px] font-semibold">No document open</div>
            <div className="max-w-[280px] text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {loadError ?? 'Upload a PDF, DOCX, or EPUB from the library panel to start reading.'}
            </div>
          </main>
        )}

        <AssistantPanel
          open={assistantOpen}
          currentDoc={currentDoc}
          rightTab={rightTab}
          onSetTab={setRightTab}
          chatMessages={chatMessages}
          isAiTyping={isAiTyping}
          chatInput={chatInput}
          onChatInputChange={setChatInput}
          onChatKeyDown={onChatKeyDown}
          onSendMessage={sendMessage}
          onInsertPageRef={insertPageRef}
          onCiteClick={onCiteClick}
          highlights={highlights}
          highlightFocusId={highlightFocusId}
          onJumpToPage={jumpToPage}
          onDeleteHighlight={removeHighlight}
        />
      </div>

      <button
        onClick={() => setAssistantOpen((v) => !v)}
        title="Toggle Document Assistant"
        className="fixed right-6 bottom-6 z-[55] flex h-13 w-13 cursor-pointer items-center justify-center rounded-full border-0"
        style={{ background: 'var(--accent)', color: 'var(--accent-contrast)', boxShadow: '0 8px 20px var(--shadow-color)' }}
      >
        {assistantOpen ? <ChevronDown size={20} /> : <MessageSquare size={20} strokeWidth={1.75} />}
      </button>

      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onClose={closeContextMenu}
          onRename={startRename}
          onDuplicate={duplicateDoc}
          onDelete={deleteDoc}
        />
      )}

      {selectionToolbar && (
        <SelectionToolbar
          ref={toolbarRef}
          toolbar={selectionToolbar}
          onAskAi={askAi}
          onOpenHighlightPicker={() => setToolbarMode('highlight')}
          onCopy={copySelection}
          onOpenNoteInput={() => {
            setNoteDraft('');
            setToolbarMode('note');
          }}
          onBackToActions={() => setToolbarMode('actions')}
          onPickColor={applyHighlight}
          noteDraft={noteDraft}
          onNoteDraftChange={setNoteDraft}
          onCancelNote={() => {
            setSelectionToolbar(null);
            setNoteDraft('');
          }}
          onSaveNote={saveNote}
        />
      )}
    </div>
  );
}
