import { buildReference, copyVerses, type VerseCopyTarget } from './verseCopy'

interface VerseSelectionBarProps {
  /** 지금 선택된 절들 (본문 순서로 정렬된 상태로 들어온다) */
  target: VerseCopyTarget
  /** 선택 구간에 빠진 절 수 — 0보다 클 때만 '구간 채우기'를 띄운다 */
  gapCount: number
  onFillGap: () => void
  onShare: (target: VerseCopyTarget) => void
  onExit: () => void
}

/**
 * 여러 절 선택 바 — 선택 중에만 하단에 떠서 개수/참조를 보여주고 복사·공유를 받는다.
 */
const VerseSelectionBar = ({
  target,
  gapCount,
  onFillGap,
  onShare,
  onExit,
}: VerseSelectionBarProps) => {
  const selectedCount = target.verses.length

  return (
    <div
      role="toolbar"
      aria-label="선택한 절 복사·공유"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '5.5rem',
        width: 'calc(100% - 1.5rem)',
        maxWidth: '32rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 0.5rem 0.5rem 0.875rem',
        borderRadius: '1rem',
        background: 'var(--ig-primary-background)',
        border: '1px solid var(--ig-border)',
        boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.45)',
        zIndex: 60,
        animation: 'versePopIn 0.16s ease-out',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ig-primary-text)' }}>
          {selectedCount ? `${selectedCount}개 절 선택` : '담을 절을 탭하세요'}
        </div>
        {selectedCount > 0 && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--ig-secondary-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {buildReference(target)}
          </div>
        )}
      </div>

      {/* 16·19처럼 띄엄띄엄 골랐을 때만 — 사이 절을 한 번에 채운다 */}
      {gapCount > 0 && (
        <button
          type="button"
          onClick={onFillGap}
          style={{
            flexShrink: 0,
            padding: '0.375rem 0.625rem',
            borderRadius: '999px',
            border: '1px solid var(--brand-soft-strong)',
            background: 'var(--brand-soft)',
            color: 'var(--brand)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          구간 채우기
        </button>
      )}

      <button
        type="button"
        onClick={() => copyVerses(target)}
        className="verse-action-btn"
        disabled={!selectedCount}
        title="선택한 절 복사"
        aria-label="선택한 절 복사"
        style={{
          background: 'var(--brand-soft)',
          border: '1px solid var(--brand-soft-strong)',
          opacity: selectedCount ? 1 : 0.4,
          cursor: selectedCount ? 'pointer' : 'not-allowed',
        }}
      >
        <span className="material-icons-round" style={{ fontSize: '1.0625rem', color: 'var(--brand)' }}>
          content_copy
        </span>
      </button>

      <button
        type="button"
        onClick={() => onShare(target)}
        className="verse-action-btn"
        disabled={!selectedCount}
        title="선택한 절 공유"
        aria-label="선택한 절 공유"
        style={{
          background: 'var(--brand)',
          border: '1px solid var(--brand)',
          opacity: selectedCount ? 1 : 0.4,
          cursor: selectedCount ? 'pointer' : 'not-allowed',
        }}
      >
        <span className="material-icons-round" style={{ fontSize: '1.0625rem', color: '#fff' }}>
          share
        </span>
      </button>

      <button
        type="button"
        onClick={onExit}
        className="verse-action-btn"
        title="선택 취소"
        aria-label="선택 취소"
        style={{
          background: 'transparent',
          border: '1px solid var(--ig-border)',
        }}
      >
        <span
          className="material-icons-round"
          style={{ fontSize: '1.0625rem', color: 'var(--ig-secondary-text)' }}
        >
          close
        </span>
      </button>
    </div>
  )
}

export default VerseSelectionBar
