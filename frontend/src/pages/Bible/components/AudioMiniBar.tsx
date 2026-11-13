import type { RefObject } from 'react'
import { formatClock } from '../../../utils/formatClock'

interface AudioMiniBarProps {
  /** 보일지 여부 — 항상 렌더하고 transform/opacity 로만 전환한다 */
  showMini: boolean
  isPlaying: boolean
  /** 첫 소리가 나기 전 대기 중 */
  loading: boolean
  /** 총길이를 모르는 실시간 생성 재생 */
  liveStream: boolean
  currentTime: number
  duration: number
  statusText: string
  /** 기본값이 아닌 설정 요약. 없으면 null */
  settingsSummary: string | null
  showSettings: boolean
  sleepRemainingMs: number | null
  /** 진행바 채움 요소 — useSmoothProgress 가 직접 움직인다 */
  fillRef: RefObject<HTMLDivElement | null>
  /** 톱니 버튼 — 설정 팝오버의 기준점 */
  settingsBtnRef: RefObject<HTMLButtonElement | null>
  onTogglePlay: () => void
  onToggleSettings: () => void
}

/**
 * 오디오북 미니 플레이어 — 본문을 읽으러 스크롤하면 카드 대신 앱바 아래 한 줄로.
 * 표시 전용: 상태와 동작은 전부 BibleAudioPlayer 가 내려준다.
 */
const AudioMiniBar = ({
  showMini,
  isPlaying,
  loading,
  liveStream,
  currentTime,
  duration,
  statusText,
  settingsSummary,
  showSettings,
  sleepRemainingMs,
  fillRef: miniFillRef,
  settingsBtnRef: miniSettingsBtnRef,
  onTogglePlay: togglePlay,
  onToggleSettings,
}: AudioMiniBarProps) => {
  return (
    <div
      className={`fixed inset-x-0 top-14 z-40 transition-all duration-300 ${
        showMini ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'
      }`}
    >
      <div className="mx-auto max-w-md px-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-white/[0.1] dark:bg-[#1c1c26]/95">
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            aria-label={isPlaying ? '일시정지' : '재생'}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)] transition active:scale-95 disabled:cursor-default"
          >
            <span className={`material-icons-round text-[20px] leading-none ${loading ? 'animate-pulse' : ''}`}>
              {loading ? 'auto_awesome' : isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[12px] font-bold text-gray-700 dark:text-white/85">
                오디오북 <span className="font-medium text-gray-400 dark:text-white/45">· {statusText}</span>
              </span>
              <span className="flex-shrink-0 text-[10.5px] font-medium tabular-nums text-gray-400 dark:text-white/45">
                {liveStream ? '실시간 생성 중' : `${formatClock(currentTime)} / ${formatClock(duration)}`}
              </span>
            </div>
            {/* 얇은 진행바 (미니에서는 seek 없이 상태 표시만) */}
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/[0.12]">
              {liveStream ? (
                <div className="h-full w-full animate-pulse bg-brand" />
              ) : (
                <div ref={miniFillRef} className="h-full w-full rounded-full bg-brand will-change-transform" />
              )}
            </div>
          </div>

          {/* 미니 플레이어도 설정은 톱니 하나로 — 본 카드와 같은 메뉴를 연다 */}
          <button
            type="button"
            ref={miniSettingsBtnRef}
            onClick={onToggleSettings}
            aria-haspopup="dialog"
            aria-expanded={showSettings}
            aria-label={settingsSummary ? `오디오 설정 (${settingsSummary})` : '오디오 설정'}
            title="오디오 설정"
            className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums transition active:scale-95 ${
              settingsSummary || showSettings
                ? 'border-transparent bg-[var(--brand-soft)] text-brand'
                : 'border-black/10 bg-black/[0.03] text-gray-400 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/40'
            }`}
          >
            {sleepRemainingMs != null && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            )}
            {settingsSummary}
            <span className="material-icons-round text-[13px] leading-none">tune</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AudioMiniBar
