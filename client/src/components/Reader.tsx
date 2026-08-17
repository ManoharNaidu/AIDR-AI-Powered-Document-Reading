import { ChevronLeft, ChevronRight, Minus, Plus, Play, Pause, Square } from 'lucide-react';
import type { Highlight } from '../types';
import { buildSegments } from '../segments';

interface ReaderProps {
  currentPage: number;
  totalPages: number;
  rightPageNum: number;
  leftParagraphs: string[];
  rightParagraphs: string[];
  highlights: Highlight[];
  zoom: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageInput: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  ttsEnabled: boolean;
  isPlaying: boolean;
  speedLabel: string;
  onTogglePlay: () => void;
  onStopReading: () => void;
  onCycleSpeed: () => void;
  onScroll: () => void;
  onNoteIconClick: (highlightId: string) => void;
}

function ParagraphColumn({
  paragraphs,
  page,
  pageHighlights,
  bodyFontSize,
  onNoteIconClick,
}: {
  paragraphs: string[];
  page: number;
  pageHighlights: Highlight[];
  bodyFontSize: number;
  onNoteIconClick: (highlightId: string) => void;
}) {
  return (
    <div
      data-page-num={page}
      className="relative z-[2] flex h-full flex-col rounded-l-[5px] px-11 pt-13 pb-10"
      style={{ background: 'var(--page-bg)', boxShadow: '0 20px 40px var(--shadow-color)' }}
    >
      <div
        className="font-serif-reader flex-1"
        style={{ fontSize: bodyFontSize, lineHeight: 1.75, color: 'var(--text-primary)' }}
      >
        {paragraphs.map((text, i) => (
          <p key={`${page}-${i}`} className="mb-4 mt-0">
            {buildSegments(text, pageHighlights).map((seg, si) =>
              seg.highlight ? (
                <span
                  key={si}
                  className="rounded-[2px] px-px"
                  style={{ background: seg.highlight.color, color: '#1A1A1A' }}
                >
                  {seg.text}
                  {seg.highlight.note && (
                    <button
                      onClick={() => onNoteIconClick(seg.highlight!.id)}
                      title="View note"
                      className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border-0 p-0 align-text-top"
                      style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M4 4h16v12H8l-4 4z" />
                      </svg>
                    </button>
                  )}
                </span>
              ) : (
                <span key={si}>{seg.text}</span>
              )
            )}
          </p>
        ))}
      </div>
      <div className="text-center text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
        {page}
      </div>
    </div>
  );
}

function PageStack({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  const radius = isLeft ? '5px 0 0 5px' : '0 5px 5px 0';
  const shadowDir = isLeft ? '-2px 3px 8px' : '2px 3px 8px';
  return (
    <>
      <div
        className="absolute top-1.5 bottom-1.5 z-0 border opacity-45"
        style={{
          left: isLeft ? -8 : 10,
          right: isLeft ? 10 : -8,
          background: 'var(--page-bg)',
          borderColor: 'var(--border-color)',
          borderRadius: radius,
          boxShadow: `${shadowDir} var(--shadow-color)`,
        }}
      />
      <div
        className="absolute top-1 bottom-1 z-[1] border opacity-70"
        style={{
          left: isLeft ? -4 : 5,
          right: isLeft ? 5 : -4,
          background: 'var(--page-bg)',
          borderColor: 'var(--border-color)',
          borderRadius: radius,
          boxShadow: `${shadowDir} var(--shadow-color)`,
        }}
      />
    </>
  );
}

export function Reader({
  currentPage,
  totalPages,
  rightPageNum,
  leftParagraphs,
  rightParagraphs,
  highlights,
  zoom,
  onPrevPage,
  onNextPage,
  onPageInput,
  onZoomIn,
  onZoomOut,
  ttsEnabled,
  isPlaying,
  speedLabel,
  onTogglePlay,
  onStopReading,
  onCycleSpeed,
  onScroll,
  onNoteIconClick,
}: ReaderProps) {
  const bodyFontSize = Math.round((16.5 * zoom) / 100);
  const leftHighlights = highlights.filter((h) => h.page === currentPage);
  const rightHighlights = highlights.filter((h) => h.page === rightPageNum);

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ background: 'var(--center-surround-bg)' }}>
      <div
        className="flex shrink-0 flex-wrap items-center justify-center gap-6.5 border-b px-5 py-2.5"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrevPage}
            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Page
          </span>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) onPageInput(val);
            }}
            className="w-13 rounded-md border px-1 py-1 text-center text-[13px]"
            style={{ borderColor: 'var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            of {totalPages}
          </span>
          <button
            onClick={onNextPage}
            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="h-5.5 w-px" style={{ background: 'var(--border-color)' }} />

        <div className="flex items-center gap-1.5">
          <button
            onClick={onZoomOut}
            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Minus size={16} />
          </button>
          <span className="w-10.5 text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {zoom}%
          </span>
          <button
            onClick={onZoomIn}
            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Plus size={16} />
          </button>
        </div>

        {ttsEnabled && (
          <div className="flex items-center gap-1.5">
            <div className="mr-1.5 h-5.5 w-px" style={{ background: 'var(--border-color)' }} />
            <button
              onClick={onCycleSpeed}
              className="h-7.5 cursor-pointer rounded-[7px] border px-2.5 text-[12px] font-bold"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              {speedLabel}
            </button>
            <button
              onClick={onTogglePlay}
              title="Read out loud"
              className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] border"
              style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <button
              onClick={onStopReading}
              title="Stop"
              className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-[7px] border"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <Square size={14} fill="currentColor" />
            </button>
          </div>
        )}
      </div>

      <div onScroll={onScroll} className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-10">
        <div className="flex w-full max-w-[920px]" style={{ minHeight: 600 }}>
          <div className="relative min-w-0 flex-1">
            <PageStack side="left" />
            <ParagraphColumn
              page={currentPage}
              paragraphs={leftParagraphs}
              pageHighlights={leftHighlights}
              bodyFontSize={bodyFontSize}
              onNoteIconClick={onNoteIconClick}
            />
          </div>

          <div
            className="relative z-[3] w-6.5 shrink-0"
            style={{
              background:
                'linear-gradient(to right, rgba(0,0,0,0.16), rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.02) 80%, rgba(0,0,0,0.16))',
            }}
          />

          <div className="relative min-w-0 flex-1">
            <PageStack side="right" />
            <ParagraphColumn
              page={rightPageNum}
              paragraphs={rightParagraphs}
              pageHighlights={rightHighlights}
              bodyFontSize={bodyFontSize}
              onNoteIconClick={onNoteIconClick}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
