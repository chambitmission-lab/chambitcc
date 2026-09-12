// 그날의 목소리 = 카세트 테이프 플레이어.

import { useRef, useState } from 'react'

/** 카세트 카운터 표기: 83초 → 1:23 */
const fmtClock = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/* ── 그날의 목소리 = 카세트 테이프 ────────────────────────────────
   네이티브 <audio> 컨트롤은 편지지 위에 놓인 순간 "앱 UI"로 돌아가 버린다.
   음성이 봉인되던 시절의 물성 — 릴이 돌고 테이프가 왼쪽에서 오른쪽으로
   감겨 가는 카세트 — 로 그려서 소리에도 세월의 질감을 입힌다. */

/** 릴 하나 — 가운데 톱니 허브가 돌고, 감긴 테이프(어두운 원)는 재생에 따라 두께가 변한다 */
const TapeReel = ({ spinning, tapeR }: { spinning: boolean; tapeR: number }) => (
  <svg viewBox="0 0 36 36" className="capsule-tape__reel" aria-hidden>
    <circle cx="18" cy="18" r={tapeR} fill="#171310" />
    <circle
      className={`capsule-tape__hub ${spinning ? 'capsule-tape__hub--spin' : ''}`}
      cx="18"
      cy="18"
      r="6.5"
      fill="none"
      stroke="#f4ecdb"
      strokeWidth="2.6"
      strokeDasharray="3.1 3.7"
    />
    <circle cx="18" cy="18" r="2.1" fill="#f4ecdb" opacity="0.9" />
  </svg>
)

const VoiceTape = ({ src, duration }: { src: string; duration: number | null }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [now, setNow] = useState(0)
  const [total, setTotal] = useState(duration ?? 0)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }

  const seekBy = (delta: number) => {
    const el = audioRef.current
    if (!el || !total) return
    el.currentTime = Math.min(total, Math.max(0, el.currentTime + delta))
    setNow(el.currentTime)
  }

  const seekTo = (clientX: number) => {
    const el = audioRef.current
    const bar = barRef.current
    if (!el || !bar || !total) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    el.currentTime = ratio * total
    setNow(el.currentTime)
  }

  const progress = total > 0 ? Math.min(1, now / total) : 0

  return (
    <div className="capsule-tape">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setNow(0)}
        onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d) && d > 0) setTotal(d)
        }}
      />
      <button
        type="button"
        className="capsule-tape__hit"
        onClick={toggle}
        aria-label={playing ? '음성 편지 일시정지' : '음성 편지 재생'}
      >
        <span className="capsule-tape__strip">
          <b>그날의 목소리</b>
          <i>
            {fmtClock(now)} / {total > 0 ? fmtClock(total) : '--:--'}
          </i>
        </span>
        <span className="capsule-tape__window">
          {/* 테이프는 왼쪽 릴에서 풀려 오른쪽 릴로 감긴다 */}
          <TapeReel spinning={playing} tapeR={8 + 7 * (1 - progress)} />
          <span className="capsule-tape__toggle" aria-hidden>
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
                <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.2 5.4c0-1 1.1-1.6 2-1.1l9.4 6.1c.8.5.8 1.7 0 2.2l-9.4 6.1c-.9.5-2-.1-2-1.1V5.4Z" />
              </svg>
            )}
          </span>
          <TapeReel spinning={playing} tapeR={8 + 7 * progress} />
        </span>
      </button>
      <div
        ref={barRef}
        className="capsule-tape__track"
        role="slider"
        tabIndex={0}
        aria-label="재생 위치"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(now)}
        aria-valuetext={fmtClock(now)}
        onPointerDown={(e) => seekTo(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            seekBy(-5)
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            seekBy(5)
          }
        }}
      >
        <i style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { VoiceTape }
