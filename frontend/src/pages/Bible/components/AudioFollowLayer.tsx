// 오디오북 듣기-보기 동기화 — 낭독 절을 하단 앵커로 따라가고, 직접 스크롤하면 잠시 멈추며,
// 6초 뒤 자동 복귀한다(useAudioFollow). 멈춰 있는 동안만 "N절 낭독 중" 복귀 버튼을 띄운다.
// 본문 목록과는 형제다: 절 DOM 은 id(bible-verse-N)로 찾고, 스크롤 엔진은 목록이 쓰는
// 인스턴스를 그대로 받는다 — 같은 엔진이어야 '멈춤'이 목록의 절 이동 스크롤까지 끊는다.
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse } from '../../../types/bible'
import { useAudioFollow } from '../hooks/useAudioFollow'
import type { VerseScrollBlock } from '../hooks/useVerseScroll'

interface AudioFollowLayerProps {
  /** 오디오북이 지금 낭독 중인 절 */
  audioActiveVerse: number | null | undefined
  /** 실제 재생 중인지. 일시정지하면 하이라이트는 남기되 따라가기는 멈춘다 */
  audioPlaying: boolean
  chapterData: InfiniteData<BibleChapterPaginatedResponse> | undefined
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  scrollVerseIntoView: (el: HTMLElement, block?: VerseScrollBlock) => void
  cancelVerseScroll: () => void
  /** 여러 절 선택 중엔 하단 바와 겹치므로 복귀 버튼을 감춘다 */
  hidden?: boolean
}

const AudioFollowLayer = ({
  audioActiveVerse,
  audioPlaying,
  chapterData,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  scrollVerseIntoView,
  cancelVerseScroll,
  hidden = false,
}: AudioFollowLayerProps) => {
  const { audioFollow, audioSyncActive, resumeAudioFollow } = useAudioFollow({
    audioActiveVerse,
    audioPlaying,
    chapterData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollVerseIntoView,
    cancelVerseScroll,
  })

  // 듣던 중 직접 스크롤해 따라가기가 꺼졌을 때만
  if (!audioSyncActive || audioFollow || hidden) return null

  return (
    <button
      onClick={resumeAudioFollow}
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '5.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 0.875rem',
        borderRadius: '999px',
        border: 'none',
        background: 'var(--brand)',
        color: 'white',
        fontSize: '0.8125rem',
        fontWeight: 700,
        boxShadow: '0 6px 18px var(--brand-glow)',
        cursor: 'pointer',
        zIndex: 50,
        whiteSpace: 'nowrap',
      }}
    >
      <span className="material-icons-round" style={{ fontSize: '1rem' }}>
        my_location
      </span>
      {audioActiveVerse}절 낭독 중
    </button>
  )
}

export default AudioFollowLayer
