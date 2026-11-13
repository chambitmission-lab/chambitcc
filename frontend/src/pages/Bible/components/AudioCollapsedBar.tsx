import type { RefObject } from 'react'
import { formatClock } from '../../../utils/formatClock'

interface AudioCollapsedBarProps {
  isPlaying: boolean
  /** 첫 소리가 나기 전 대기 중 */
  loading: boolean
  /** 이 장의 재생을 시작했는지 */
  started: boolean
  /** 총길이를 모르는 실시간 생성 재생 */
  liveStream: boolean
  currentTime: number
  duration: number
  statusText: string
  /** 진행선 채움 요소 — useSmoothProgress 가 직접 움직인다 */
  fillRef: RefObject<HTMLSpanElement | null>
  onTogglePlay: () => void
  onExpand: () => void
}

/**
 * 오디오북 접힌 상태 — 한 줄 띠. 안 듣는 사람에겐 본문이 그만큼 위로 올라오고,
 * 들으려는 사람은 펼치지 않고도 여기서 바로 재생할 수 있다.
 * 표시 전용: 상태와 동작은 전부 BibleAudioPlayer 가 내려준다.
 */
const AudioCollapsedBar = ({
  isPlaying,
  loading,
  started,
  liveStream,
  currentTime,
  duration,
  statusText,
  fillRef: collapsedFillRef,
  onTogglePlay: togglePlay,
  onExpand: toggleCollapsed,
}: AudioCollapsedBarProps) => {
  return (
    <div className="relative flex items-center gap-2 px-2.5 py-1.5">
      <button
        type="button"
        onClick={togglePlay}
        disabled={loading}
        aria-label={isPlaying ? '일시정지' : '재생'}
        className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_4px_10px_-4px_var(--brand-glow)] transition active:scale-95 disabled:cursor-default"
      >
        <span className={`material-icons-round text-[16px] leading-none ${loading ? 'animate-pulse' : ''}`}>
          {loading ? 'auto_awesome' : isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded={false}
        aria-label="오디오북 펼치기"
        className="flex min-w-0 flex-1 items-center gap-1.5 py-0.5 text-left"
      >
        <span className="material-icons-round flex-shrink-0 text-[14px] text-brand">headphones</span>
        <span className="flex-shrink-0 whitespace-nowrap text-[12.5px] font-extrabold tracking-tight text-brand">
          오디오북
        </span>
        <span className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40">
          · {statusText}
        </span>
        <span className="ml-auto flex flex-shrink-0 items-center gap-1 pl-1">
          {started && !loading && !liveStream && duration > 0 && (
            <span className="text-[10.5px] font-medium tabular-nums text-gray-400 dark:text-white/45">
              {formatClock(currentTime)}
            </span>
          )}
          <span className="material-icons-round text-[18px] leading-none text-gray-400 dark:text-white/40">
            expand_more
          </span>
        </span>
      </button>

      {/* 접혀 있어도 어디까지 왔는지는 보이게 — 카드 아래 실선 한 줄 */}
      {started && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-black/[0.06] dark:bg-white/[0.08]">
          {liveStream ? (
            <span className="block h-full w-full animate-pulse bg-brand" />
          ) : (
            <span ref={collapsedFillRef} className="block h-full w-full rounded-r-full bg-brand will-change-transform" />
          )}
        </span>
      )}
    </div>
  )
}

export default AudioCollapsedBar
