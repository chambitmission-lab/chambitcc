import { useEffect, useRef, useState } from 'react'
import { API_V1 } from '../../../config/api'
import type { BibleTTSVoice } from '../../../types/bible'

interface BibleAudioPlayerProps {
  bookNumber: number
  chapter: number
}

const VOICE_STORAGE_KEY = 'bible-tts-voice'
const RATE_STORAGE_KEY = 'bible-tts-rate'
const RATE_OPTIONS = [0.75, 1, 1.25, 1.5]

// 첫 생성(몇 초) 동안 번갈아 보여줄 잔잔한 대기 문구
const LOADING_MESSAGES = [
  '말씀을 준비하고 있어요…',
  '잠시 마음을 고요히…',
  '은혜의 음성을 빚는 중…',
  '곧 들려드릴게요…',
]

// 현재는 음성 선택 UI를 숨기고 남성으로 고정한다(여성/남성 토글은 코드만 보존).
// 나중에 다시 노출하려면 아래 한 줄을 예전 로직으로 되돌리면 된다.
//   const v = localStorage.getItem(VOICE_STORAGE_KEY); return v === 'male' ? 'male' : 'female'
const loadVoice = (): BibleTTSVoice => 'male'

const loadRate = (): number => {
  const r = Number(localStorage.getItem(RATE_STORAGE_KEY))
  return RATE_OPTIONS.includes(r) ? r : 1
}

const formatTime = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * 성경 한 장을 오디오북처럼 들려주는 플레이어.
 * - 재생 버튼을 누른 시점에만 백엔드 TTS 엔드포인트를 src로 걸어 지연 로딩
 * - 캐시가 없으면 백엔드가 mp3를 "생성되는 즉시" 스트리밍하므로, 장 전체 생성을
 *   기다리지 않고 첫 절(+머리말)만 준비되면 바로 재생이 시작된다.
 * - 한 번 들으면 백엔드가 Supabase에 캐시 → 다음 재생은 캐시 파일로 리다이렉트되어
 *   즉시 재생 + 탐색바/총 길이까지 정상.
 * - 음성(여성/남성)·배속은 localStorage에 기억
 *
 * 부모에서 key={`${bookNumber}-${chapter}`} 로 렌더하므로, 장이 바뀌면
 * 컴포넌트가 새로 마운트되어 상태가 초기화되고 이전 재생은 정리된다.
 */
const BibleAudioPlayer = ({ bookNumber, chapter }: BibleAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const wantPlayRef = useRef(false) // src 로드 시 자동 재생할지

  const [voice, setVoice] = useState<BibleTTSVoice>(loadVoice)
  const [rate, setRate] = useState<number>(loadRate)
  const [started, setStarted] = useState(false) // 첫 재생 이후에만 src 설정
  const [isPlaying, setIsPlaying] = useState(false)
  const [preparing, setPreparing] = useState(false) // 첫 소리가 나기 전 대기 상태
  const [isError, setIsError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)

  // 재생을 누른 시점에만 백엔드 스트리밍 엔드포인트를 src로 건다.
  // 음성이 바뀌면 URL이 바뀌어 audio 요소가 새 음성으로 다시 로드된다.
  const audioUrl = started
    ? `${API_V1}/bible/tts/${bookNumber}/${chapter}?voice=${voice}`
    : undefined

  // src가 준비되면 배속을 적용하고, 대기 중이던 재생 요청을 실행
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    audio.playbackRate = rate
    if (wantPlayRef.current) {
      wantPlayRef.current = false
      audio.play().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  // 언마운트 시(장 이동 등) 재생 정지
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
    }
  }, [])

  const requestPlay = () => {
    const audio = audioRef.current
    if (started && audio) {
      // 이미 src가 걸려 있음 → 즉시(또는 버퍼되면) 재생
      if (audio.readyState < 2) setPreparing(true)
      audio.play().catch(() => {})
      return
    }
    // 첫 재생 → src를 걸고, 로드되면 자동 재생
    setIsError(false)
    setPreparing(true)
    wantPlayRef.current = true
    setStarted(true)
  }

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      requestPlay()
    }
  }

  const handleVoiceChange = (v: BibleTTSVoice) => {
    if (v === voice) return
    const wasPlaying = isPlaying
    audioRef.current?.pause()
    setVoice(v)
    localStorage.setItem(VOICE_STORAGE_KEY, v)
    setIsError(false)
    // 이미 듣고 있었다면 새 음성으로 이어서 재생
    if (started) {
      wantPlayRef.current = wasPlaying
      if (wasPlaying) setPreparing(true)
    }
  }

  const cycleRate = () => {
    const idx = RATE_OPTIONS.indexOf(rate)
    const next = RATE_OPTIONS[(idx + 1) % RATE_OPTIONS.length]
    setRate(next)
    localStorage.setItem(RATE_STORAGE_KEY, String(next))
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value)
    setCurrentTime(t)
    if (audioRef.current) audioRef.current.currentTime = t
  }

  const loading = preparing && !isError
  // 미캐시 첫 재생은 스트리밍이라 총길이를 알 수 없다(duration<=0).
  // 이 경우 멈춘 듯한 0:00·고정 진행바 대신 "실시간 생성 중" 불확정 표시로 보여준다.
  const liveStream = started && !loading && !isError && duration <= 0
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  // 로딩 중에는 잔잔한 문구를 천천히 교체
  useEffect(() => {
    if (!loading) return
    setLoadingMsgIdx(0)
    const id = setInterval(
      () => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      2400
    )
    return () => clearInterval(id)
  }, [loading])

  const statusText = isError
    ? '오디오를 불러오지 못했어요'
    : loading
      ? LOADING_MESSAGES[loadingMsgIdx]
      : isPlaying
        ? '재생 중'
        : '듣기'

  return (
    <div className="relative mx-3 my-2.5 overflow-hidden rounded-3xl border border-black/[0.05] dark:border-white/[0.08] bg-surface-light dark:bg-card-dark shadow-[0_10px_30px_-16px_rgba(217,70,239,0.5)]">
      {/* 장식용 그라데이션 오브 */}
      <div className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/25 to-pink-400/15 dark:from-purple-500/25 dark:to-pink-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr from-pink-400/15 to-purple-400/10 blur-3xl" />

      <div className="relative p-3.5">
        <div className="flex items-center gap-3.5">
          {/* 재생 / 일시정지 — 그라데이션 + 글로우 + 재생 중 펄스 링 */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            aria-label={isPlaying ? '일시정지' : '재생'}
            className="relative grid h-14 w-14 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_8px_22px_-6px_rgba(217,70,239,0.75)] transition active:scale-95 disabled:cursor-default"
          >
            {isPlaying && !loading && (
              <span className="absolute inset-0 rounded-full bg-pink-500/40 animate-ping [animation-duration:1.6s]" />
            )}
            {loading ? (
              <>
                {/* 퍼져나가는 빛의 파동 */}
                <span className="absolute inset-0 rounded-full bg-white/25 animate-ping [animation-duration:2s]" />
                <span className="absolute inset-0 rounded-full bg-white/20 animate-ping [animation-duration:2s] [animation-delay:0.7s]" />
                {/* 회전하는 빛무리(후광) */}
                <span className="absolute -inset-2 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.65),transparent_55%)] blur-[1px] [animation-duration:2.6s]" />
                {/* 은은히 빛나는 코어 */}
                <span className="material-icons-round relative animate-pulse text-[24px] leading-none text-white [animation-duration:1.6s]">
                  auto_awesome
                </span>
              </>
            ) : (
              <span className="material-icons-round relative text-[30px] leading-none">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            )}
          </button>

          {/* 중앙: 라벨 + 진행바 + 시간 */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-icons-round text-[15px] text-purple-500 dark:text-purple-300">
                  headphones
                </span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-[13px] font-extrabold tracking-tight text-transparent">
                  오디오북
                </span>
                <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                  · {statusText}
                </span>
              </span>
              <button
                type="button"
                onClick={cycleRate}
                className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[11px] font-bold text-gray-600 transition active:scale-95 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/70"
              >
                {rate}×
              </button>
            </div>

            {/* 커스텀 그라데이션 진행바 (seek 가능) */}
            <div className="group relative h-2">
              <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/12" />
              {loading && (
                <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-500/0 via-pink-500/70 to-purple-500/0 [animation-duration:1.8s]" />
              )}

              {liveStream ? (
                /* 실시간 생성 중 — 총길이를 모르므로 좌→우로 흐르는 불확정 바
                   (멈춘 듯 보이지 않게 "라이브 생성"임을 표현) */
                <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full">
                  <span className="absolute left-0 top-0 h-full w-1/3 animate-bible-stream-sweep rounded-full bg-gradient-to-r from-purple-500/0 via-pink-500 to-purple-500/0" />
                </span>
              ) : (
                <>
                  <div
                    className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${pct}%` }}
                  />

                  {/* 시작점 — 함께 출발한 자리 */}
                  <span className="pointer-events-none absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-purple-400/70 dark:bg-purple-300/60" />

                  {/* 도착점 — 빛이 향해 가는 목적지(가까워질수록 환해진다) */}
                  <span
                    className="pointer-events-none absolute left-full top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity"
                    style={{ opacity: 0.3 + (pct / 100) * 0.7 }}
                  >
                    <span className="material-icons-round block text-[14px] leading-none text-pink-400 dark:text-pink-300">
                      auto_awesome
                    </span>
                  </span>

                  {/* 인도하는 빛 — 처음부터 끝까지 길을 함께 걷는 별빛 동행 */}
                  <div
                    className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pct}%` }}
                  >
                    {isPlaying && (
                      <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-pink-400/35 blur-[3px] [animation-duration:1.6s]" />
                    )}
                    <svg
                      viewBox="0 0 24 24"
                      className="relative block h-[18px] w-[18px] text-white drop-shadow-[0_0_6px_rgba(236,72,153,0.9)] transition-transform group-active:scale-110"
                      fill="currentColor"
                    >
                      <path d="M12 1.5 L14 9.5 L22 12 L14 14.5 L12 22.5 L10 14.5 L2 12 L10 9.5 Z" />
                    </svg>
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
              <span>{formatTime(currentTime)}</span>
              {liveStream ? (
                <span className="flex items-center gap-1 font-semibold text-purple-500 dark:text-purple-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" />
                  실시간 생성 중
                </span>
              ) : (
                <span>{formatTime(duration)}</span>
              )}
            </div>
          </div>
        </div>

        {/* 음성 선택 — 슬라이딩 인디케이터 세그먼트
            (현재는 숨기고 남성 고정. 다시 노출하려면 아래 첫 div의 `!hidden` 제거) */}
        <div className="mt-3 flex items-center justify-between">
          <div className="relative !hidden inline-flex rounded-full bg-black/[0.05] p-0.5 dark:bg-white/[0.07]">
            <span
              className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_4px_12px_-4px_rgba(217,70,239,0.6)] transition-transform duration-300 ease-out"
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

          {loading && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-white/40">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" />
              처음 재생은 조금 걸려요
            </span>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => {
          // 첫 소리가 실제로 나기 시작 → 대기 상태 해제
          setIsPlaying(true)
          setPreparing(false)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onError={() => {
          setPreparing(false)
          setIsPlaying(false)
          // started 후에만 실제 오류로 간주(초기 src 없는 상태 제외)
          if (started) setIsError(true)
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          // 스트리밍(미캐시) 최초 재생 땐 길이를 모를 수 있다(Infinity/NaN) → 0 처리
          const d = e.currentTarget.duration
          setDuration(Number.isFinite(d) ? d : 0)
          e.currentTarget.playbackRate = rate
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d)) setDuration(d)
        }}
      />
    </div>
  )
}

export default BibleAudioPlayer
