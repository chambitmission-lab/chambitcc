import type { ChangeEvent, RefObject } from 'react'
import type { BibleTTSVoice } from '../../../types/bible'
import { formatClock } from '../../../utils/formatClock'

interface AudioExpandedCardProps {
  /** 접혀 있으면 hidden 으로만 감춘다(마운트 유지 — 진행바 ref·톱니 기준점을 잃지 않게) */
  collapsed: boolean
  isPlaying: boolean
  /** 첫 소리가 나기 전 대기 중 */
  loading: boolean
  /** 총길이를 모르는 실시간 생성 재생 */
  liveStream: boolean
  currentTime: number
  duration: number
  /** 진행률(0~100) — 도착점 밝기에 쓴다 */
  pct: number
  statusText: string
  voice: BibleTTSVoice
  /** 기본값이 아닌 설정 요약(배속·타이머·연속 끔). 없으면 null */
  settingsSummary: string | null
  showSettings: boolean
  /** 수면 타이머 남은 시간 — 켜져 있으면 톱니에 점을 찍는다 */
  sleepRemainingMs: number | null
  canCinema: boolean
  /** 진행바 채움·별 래퍼 — useSmoothProgress 가 직접 움직인다 */
  fillRef: RefObject<HTMLDivElement | null>
  starRef: RefObject<HTMLDivElement | null>
  /** 톱니 버튼 — 설정 팝오버의 기준점 */
  settingsBtnRef: RefObject<HTMLButtonElement | null>
  onTogglePlay: () => void
  onToggleSettings: () => void
  onOpenCinema: () => void
  onCollapse: () => void
  onSeek: (e: ChangeEvent<HTMLInputElement>) => void
  onVoiceChange: (voice: BibleTTSVoice) => void
}

/**
 * 오디오북 펼친 카드 본문 — 재생 버튼·라벨·설정 칩·진행바(탐색)·시간.
 * 표시 전용: 상태와 동작은 전부 BibleAudioPlayer 가 내려준다.
 * <audio> 요소는 여기 두지 않는다 — 플레이어가 하나를 끝까지 쥐고 있어야 연속 재생이 된다.
 */
const AudioExpandedCard = ({
  collapsed,
  isPlaying,
  loading,
  liveStream,
  currentTime,
  duration,
  pct,
  statusText,
  voice,
  settingsSummary,
  showSettings,
  sleepRemainingMs,
  canCinema,
  fillRef,
  starRef,
  settingsBtnRef,
  onTogglePlay: togglePlay,
  onToggleSettings,
  onOpenCinema: openCinema,
  onCollapse: toggleCollapsed,
  onSeek: handleSeek,
  onVoiceChange: handleVoiceChange,
}: AudioExpandedCardProps) => {
  return (
    <div className={`relative px-3 py-2.5 ${collapsed ? 'hidden' : ''}`}>
      <div className="flex items-center gap-3">
        {/* 재생 / 일시정지 — 그라데이션 + 글로우 + 재생 중 펄스 링 */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={loading}
          aria-label={isPlaying ? '일시정지' : '재생'}
          className="relative grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_6px_16px_-5px_var(--brand-glow)] transition active:scale-95 disabled:cursor-default"
        >
          {isPlaying && !loading && (
            <span className="absolute inset-0 rounded-full bg-[var(--brand-glow)] animate-ping [animation-duration:1.6s]" />
          )}
          {loading ? (
            <>
              {/* 퍼져나가는 빛의 파동 */}
              <span className="absolute inset-0 rounded-full bg-white/25 animate-ping [animation-duration:2s]" />
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping [animation-duration:2s] [animation-delay:0.7s]" />
              {/* 회전하는 빛무리(후광) */}
              <span className="absolute -inset-2 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.65),transparent_55%)] blur-[1px] [animation-duration:2.6s]" />
              {/* 은은히 빛나는 코어 */}
              <span className="material-icons-round relative animate-pulse text-[20px] leading-none text-white [animation-duration:1.6s]">
                auto_awesome
              </span>
            </>
          ) : (
            <span className="material-icons-round relative text-[24px] leading-none">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          )}
        </button>

        {/* 중앙: 라벨 + 진행바 + 시간 */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            {/* 배속(1.25× 등)으로 오른쪽 버튼이 넓어져도 줄바꿈 없이 말줄임 —
                카드 높이가 변해 본문이 아래로 밀리는 것을 막는다 */}
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="material-icons-round flex-shrink-0 text-[15px] text-brand">
                headphones
              </span>
              <span className="flex-shrink-0 whitespace-nowrap text-[13px] font-extrabold tracking-tight text-brand">
                오디오북
              </span>
              <span className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40">
                · {statusText}
              </span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap">
              {/* 오디오 설정 — 배속·연속 재생·잠들기 전 듣기를 톱니 하나에.
                  기본값이 아닌 설정(배속≠1×·타이머·연속 끔)은 톱니 옆에 요약해 보여줘
                  "왜 빨리 읽지?", "왜 멈췄지?"의 원인을 바로 찾을 수 있게 한다. */}
              <button
                type="button"
                ref={settingsBtnRef}
                onClick={onToggleSettings}
                aria-haspopup="dialog"
                aria-expanded={showSettings}
                aria-label={settingsSummary ? `오디오 설정 (${settingsSummary})` : '오디오 설정 (배속·연속 재생·잠들기 전 듣기)'}
                title="오디오 설정"
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums transition active:scale-95 ${
                  settingsSummary || showSettings
                    ? 'border-transparent bg-[var(--brand-soft)] text-brand'
                    : 'audio-chip-glow border-black/10 bg-black/[0.03] text-gray-400 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/40'
                }`}
              >
                {sleepRemainingMs != null && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                )}
                {settingsSummary}
                <span className="material-icons-round text-[13px] leading-none">tune</span>
              </button>
              {/* 낭독 영화관 — 설정이 아니라 "모드 진입"이라 메뉴에 넣지 않고 밖에 남긴다 */}
              {canCinema && (
                <button
                  type="button"
                  onClick={openCinema}
                  aria-label="낭독 영화관 (전체화면 몰입 낭독)"
                  title="낭독 영화관"
                  className="audio-chip-glow flex items-center gap-0.5 rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[11px] font-bold text-gray-400 transition active:scale-95 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/40"
                >
                  <span className="material-icons-round text-[13px] leading-none">
                    theaters
                  </span>
                </button>
              )}
              {/* 접기 — 듣지 않을 땐 한 줄로 접어 본문에 자리를 내준다 */}
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-expanded={true}
                aria-label="오디오북 접기"
                title="접기"
                className="flex items-center rounded-full border border-black/10 bg-black/[0.03] px-1.5 py-0.5 text-gray-400 transition active:scale-95 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/40"
              >
                <span className="material-icons-round text-[14px] leading-none">
                  expand_less
                </span>
              </button>
            </span>
          </div>

          {/* 커스텀 그라데이션 진행바 (seek 가능) */}
          <div className="group relative h-2">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/12" />
            {loading && (
              <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 animate-pulse rounded-full bg-brand [animation-duration:1.8s]" />
            )}

            {liveStream ? (
              /* 실시간 생성 중 — 동방박사가 별을 따라가듯, 별이 천천히 길을 가로지른다.
                 총길이를 모르므로 진행률 대신 "별의 동행"으로 라이브 상태를 표현. */
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
                <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 animate-bible-star-travel">
                  {/* 별똥별 꼬리 — 지나온 길에 남는 빛의 자취 */}
                  <span className="absolute right-1/2 top-1/2 h-[2px] w-8 -translate-y-1/2 rounded-full bg-gradient-to-l from-[var(--brand)] via-[var(--brand-glow)] to-transparent blur-[0.5px]" />
                  {/* 은은한 빛무리(후광) */}
                  <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[var(--brand-glow)] blur-[3px] [animation-duration:1.6s]" />
                  {/* 별 — 정상 재생 때와 같은 네 갈래 별. 밝은 테마에선 흰 카드 위라 브랜드색.
                      카드 배경색 아웃라인(paint-order:stroke)이 같은 색 진행 트랙에서 형태를 분리한다 */}
                  <svg
                    viewBox="0 0 24 24"
                    className="relative block h-[14px] w-[14px] text-brand dark:text-white stroke-[#fafafa] dark:stroke-[#201f1f] [paint-order:stroke] drop-shadow-[0_0_6px_var(--brand-glow)]"
                    fill="currentColor"
                    strokeWidth={4}
                    strokeLinejoin="round"
                  >
                    <path d="M12 1.5 L14 9.5 L22 12 L14 14.5 L12 22.5 L10 14.5 L2 12 L10 9.5 Z" />
                  </svg>
                </div>
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full">
                  <div ref={fillRef} className="h-full w-full rounded-full bg-brand will-change-transform" />
                </div>

                {/* 시작점 — 함께 출발한 자리 */}
                <span className="pointer-events-none absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-brand" />

                {/* 도착점 — 빛이 향해 가는 목적지(가까워질수록 환해진다) */}
                <span
                  className="pointer-events-none absolute left-full top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity"
                  style={{ opacity: 0.3 + (pct / 100) * 0.7 }}
                >
                  <span className="material-icons-round block text-[12px] leading-none text-brand">
                    auto_awesome
                  </span>
                </span>

                {/* 인도하는 빛 — 처음부터 끝까지 길을 함께 걷는 별빛 동행 */}
                {/* 트랙 폭 래퍼를 translateX(진행률%)로 밀어 별을 서브픽셀로 이동(카드가 overflow-hidden) */}
                <div ref={starRef} className="pointer-events-none absolute inset-0 will-change-transform">
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  {isPlaying && (
                    <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[var(--brand-glow)] blur-[3px] [animation-duration:1.6s]" />
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    className="relative block h-[14px] w-[14px] text-brand dark:text-white stroke-[#fafafa] dark:stroke-[#201f1f] [paint-order:stroke] drop-shadow-[0_0_6px_var(--brand-glow)] transition-transform group-active:scale-110"
                    fill="currentColor"
                    strokeWidth={4}
                    strokeLinejoin="round"
                  >
                    <path d="M12 1.5 L14 9.5 L22 12 L14 14.5 L12 22.5 L10 14.5 L2 12 L10 9.5 Z" />
                  </svg>
                </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!duration}
                  aria-label="재생 위치"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
                />
              </>
            )}
          </div>

          <div className="mt-1 flex items-center justify-between text-[10.5px] font-medium tabular-nums text-gray-400 dark:text-white/45">
            <span>{formatClock(currentTime)}</span>
            {loading ? (
              /* 힌트를 별도 줄이 아닌 이 자리(총길이 자리)에 보여 카드 높이가 변하지 않는다 */
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 animate-pulse rounded-full bg-brand" />
                처음 재생은 조금 걸려요
              </span>
            ) : liveStream ? (
              <span className="flex items-center gap-1 font-semibold text-brand">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                실시간 생성 중
              </span>
            ) : (
              <span>{formatClock(duration)}</span>
            )}
          </div>
        </div>
      </div>

      {/* 음성 선택(여성/남성) 세그먼트 — 현재는 숨기고 남성 고정.
          다시 노출하려면 바깥 div의 `hidden`과 안쪽 div의 `!hidden`을 제거하고
          `mt-2 flex items-center` 등 배치 클래스를 되살린다. */}
      <div className="hidden">
        <div className="relative !hidden inline-flex rounded-full bg-black/[0.05] p-0.5 dark:bg-white/[0.07]">
          <span
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-brand shadow-[0_4px_12px_-4px_var(--brand-glow)] transition-transform duration-300 ease-out"
            style={{ transform: voice === 'male' ? 'translateX(100%)' : 'translateX(0)' }}
          />
          {(['female', 'male'] as BibleTTSVoice[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleVoiceChange(v)}
              className={`relative z-10 w-[58px] rounded-full py-1 text-xs font-bold transition-colors ${
                voice === v ? 'text-white' : 'text-gray-500 dark:text-white/55'
              }`}
            >
              {v === 'female' ? '여성' : '남성'}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}

export default AudioExpandedCard
