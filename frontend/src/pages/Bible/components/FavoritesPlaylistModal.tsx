import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { API_V1 } from '../../../config/api'
import { useMyBookmarks } from '../../../hooks/useBibleBookmark'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { VerseBookmarkWithVerse } from '../../../api/bibleBookmark'

interface FavoritesPlaylistModalProps {
  onClose: () => void
}

const RATE_STORAGE_KEY = 'bible-tts-rate'
const RATE_OPTIONS = [0.75, 1, 1.25, 1.5]
// 음성은 장 오디오북과 동일하게 남성 고정(여성 토글은 추후 노출용으로 보존)
const VOICE = 'male'

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

const shuffled = (n: number, keepFirst: number): number[] => {
  const rest = Array.from({ length: n }, (_, i) => i).filter((i) => i !== keepFirst)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return [keepFirst, ...rest]
}

const verseUrl = (item: VerseBookmarkWithVerse) =>
  `${API_V1}/bible/tts/${item.book_number}/${item.chapter}/${item.verse}?voice=${VOICE}`

/**
 * 즐겨찾기한 절들을 하나의 묵상 플레이리스트로 묶어 연속 재생하는 슬라이드업 모달.
 *
 * 장(章) 오디오북과 달리 여러 책/장에 흩어진 절을 큐로 관리한다.
 * - 절마다 백엔드 단일 절 TTS 엔드포인트(/bible/tts/{book}/{chapter}/{verse})를 src로 건다
 * - 한 절이 끝나면(onEnded) 큐의 다음 절로 자동 이동하며 이어서 재생
 * - 다음 절은 숨은 오디오로 미리 받아둬(preload) 끊김을 줄인다
 * - 셔플/연속재생(전체 반복) 지원, 목록에서 절을 탭하면 그 절로 점프
 */
const FavoritesPlaylistModal = ({ onClose }: FavoritesPlaylistModalProps) => {
  useModalBackButton(onClose)

  const { data, isLoading } = useMyBookmarks({ favorites_only: true, page_size: 100 })
  const items = useMemo<VerseBookmarkWithVerse[]>(() => data?.items ?? [], [data])

  const audioRef = useRef<HTMLAudioElement>(null)
  const preloadRef = useRef<HTMLAudioElement>(null)
  const wantPlayRef = useRef(false)

  const [rate, setRate] = useState<number>(loadRate)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(true) // 기본: 마지막 절 후 처음으로 돌아 계속
  const [order, setOrder] = useState<number[]>([])
  const [pos, setPos] = useState(0) // order 내 현재 위치
  const [started, setStarted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [isError, setIsError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // 즐겨찾기 목록이 로드되면 자연 순서로 큐 초기화
  useEffect(() => {
    if (items.length > 0 && order.length !== items.length) {
      setOrder(Array.from({ length: items.length }, (_, i) => i))
      setPos(0)
    }
  }, [items.length, order.length])

  const currentIndex = order[pos] ?? 0
  const current = items[currentIndex]
  const nextIndex = order[pos + 1] ?? (isRepeat ? order[0] : undefined)

  const audioUrl = started && current ? verseUrl(current) : undefined

  // src(=현재 절)가 바뀌면 배속 적용 + 대기 중이던 재생 실행
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    audio.playbackRate = rate
    setCurrentTime(0)
    setDuration(0)
    if (wantPlayRef.current) {
      wantPlayRef.current = false
      audio.play().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  // 다음 절 미리 받기 — 재생 중이고 캐시되지 않았을 때 끊김 완화
  useEffect(() => {
    const pre = preloadRef.current
    if (!pre || !isPlaying || nextIndex === undefined) return
    const nextItem = items[nextIndex]
    if (!nextItem) return
    pre.src = verseUrl(nextItem)
    pre.load()
  }, [isPlaying, nextIndex, items])

  // 언마운트 시 재생 정지
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
    }
  }, [])

  const playAt = (newPos: number) => {
    setIsError(false)
    setPreparing(true)
    wantPlayRef.current = true
    // 첫 재생: src가 걸리면 effect가 자동 재생한다(여기서 직접 play 금지 — 아직 src 없음)
    if (!started) {
      setStarted(true)
      setPos(newPos)
      return
    }
    // 이미 듣던 중 같은 위치를 다시 누르면 audioUrl이 안 바뀌어 effect가 안 돈다 → 직접 재생
    if (newPos === pos) {
      const audio = audioRef.current
      if (audio) {
        if (audio.ended || audio.error) audio.load()
        else {
          audio.currentTime = 0
          audio.play().catch(() => {})
        }
      }
      return
    }
    setPos(newPos)
  }

  const requestPlay = () => {
    const audio = audioRef.current
    if (started && audio) {
      if (audio.ended || audio.error) {
        setIsError(false)
        setPreparing(true)
        wantPlayRef.current = true
        audio.load()
        return
      }
      if (audio.readyState < 2) setPreparing(true)
      audio.play().catch(() => {})
      return
    }
    playAt(pos)
  }

  const togglePlay = () => {
    if (isPlaying) audioRef.current?.pause()
    else requestPlay()
  }

  const goNext = () => {
    if (pos + 1 < order.length) playAt(pos + 1)
    else if (isRepeat && order.length > 0) playAt(0)
  }

  const goPrev = () => {
    // 3초 이상 재생됐으면 현재 절을 처음부터, 아니면 이전 절로
    if (currentTime > 3) {
      const audio = audioRef.current
      if (audio) audio.currentTime = 0
      return
    }
    if (pos - 1 >= 0) playAt(pos - 1)
    else if (isRepeat && order.length > 0) playAt(order.length - 1)
  }

  const handleEnded = () => {
    setCurrentTime(0)
    if (pos + 1 < order.length) {
      wantPlayRef.current = true
      setPos(pos + 1)
    } else if (isRepeat && order.length > 1) {
      wantPlayRef.current = true
      setPos(0)
    } else {
      setIsPlaying(false)
    }
  }

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev
      if (next) {
        setOrder(shuffled(items.length, currentIndex))
        setPos(0)
      } else {
        setOrder(Array.from({ length: items.length }, (_, i) => i))
        setPos(currentIndex)
      }
      return next
    })
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
  const liveStream = started && !loading && !isError && duration <= 0
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const statusText = isError
    ? '오디오를 불러오지 못했어요'
    : loading
      ? '말씀을 준비하고 있어요…'
      : isPlaying
        ? `재생 중 · ${pos + 1}/${items.length}`
        : items.length > 0
          ? `${items.length}개 구절`
          : '즐겨찾기 없음'

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500/15 to-pink-500/10 text-purple-600 dark:text-purple-300 shrink-0">
            <span className="material-icons-round text-[22px]">headphones</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.1em]">
              나의 묵상 플레이리스트
            </p>
            <h3 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em] truncate">
              즐겨찾기 구절 듣기
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 플레이어 카드 */}
        {items.length > 0 && (
          <div className="relative z-10 px-5 pt-4">
            <div className="relative overflow-hidden rounded-3xl border border-black/[0.05] dark:border-white/[0.08] bg-surface-light dark:bg-background-dark p-4 shadow-[0_10px_30px_-16px_rgba(217,70,239,0.5)]">
              <div className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/25 to-pink-400/15 blur-3xl" />

              {/* 현재 절 */}
              <div className="relative mb-3 min-h-[3.5rem]">
                <p className="text-[12px] font-bold text-purple-600 dark:text-purple-300 mb-1">
                  {current ? `${current.book_name_ko} ${current.chapter}:${current.verse}` : ''}
                </p>
                <p className="text-[14px] leading-[1.6] text-gray-800 dark:text-white/85 line-clamp-2">
                  {current?.text}
                </p>
              </div>

              {/* 진행바 — 오디오북과 동일한 별빛 동행 */}
              <div className="group relative h-2 mb-1">
                <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/12" />
                {loading && (
                  <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-500/0 via-pink-500/70 to-purple-500/0 [animation-duration:1.8s]" />
                )}

                {liveStream ? (
                  /* 실시간 생성 중 — 별이 천천히 길을 가로지른다 */
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 animate-bible-star-travel">
                      <span className="absolute right-1/2 top-1/2 h-[2px] w-8 -translate-y-1/2 rounded-full bg-gradient-to-l from-pink-400/90 via-pink-400/40 to-transparent blur-[0.5px]" />
                      <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-pink-400/35 blur-[3px] [animation-duration:1.6s]" />
                      <svg
                        viewBox="0 0 24 24"
                        className="relative block h-[16px] w-[16px] text-white drop-shadow-[0_0_6px_rgba(236,72,153,0.9)]"
                        fill="currentColor"
                      >
                        <path d="M12 1.5 L14 9.5 L22 12 L14 14.5 L12 22.5 L10 14.5 L2 12 L10 9.5 Z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-[width] duration-300 ease-linear"
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
                      className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-300 ease-linear"
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

              <div className="flex items-center justify-between text-[10.5px] font-medium tabular-nums text-gray-400 dark:text-white/45 mb-2">
                <span>{formatTime(currentTime)}</span>
                <span className="text-purple-500 dark:text-purple-300 font-semibold">{statusText}</span>
                {liveStream ? (
                  <span className="flex items-center gap-1 font-semibold text-purple-500 dark:text-purple-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" />
                    생성 중
                  </span>
                ) : (
                  <span>{formatTime(duration)}</span>
                )}
              </div>

              {/* 컨트롤 */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  aria-label="셔플"
                  className={`grid h-9 w-9 place-items-center rounded-full transition active:scale-95 ${
                    isShuffle
                      ? 'text-pink-500 bg-pink-500/10'
                      : 'text-gray-400 dark:text-white/45'
                  }`}
                >
                  <span className="material-icons-round text-[20px]">shuffle</span>
                </button>

                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="이전 절"
                  className="grid h-10 w-10 place-items-center rounded-full text-gray-600 dark:text-white/70 transition active:scale-95"
                >
                  <span className="material-icons-round text-[28px]">skip_previous</span>
                </button>

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
                    <span className="material-icons-round relative animate-pulse text-[24px] leading-none">
                      auto_awesome
                    </span>
                  ) : (
                    <span className="material-icons-round relative text-[30px] leading-none">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  aria-label="다음 절"
                  className="grid h-10 w-10 place-items-center rounded-full text-gray-600 dark:text-white/70 transition active:scale-95"
                >
                  <span className="material-icons-round text-[28px]">skip_next</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRepeat((v) => !v)}
                  aria-label="전체 반복"
                  className={`relative grid h-9 w-9 place-items-center rounded-full transition active:scale-95 ${
                    isRepeat ? 'text-pink-500 bg-pink-500/10' : 'text-gray-400 dark:text-white/45'
                  }`}
                >
                  <span className="material-icons-round text-[20px]">repeat</span>
                </button>
              </div>

              {/* 배속 */}
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={cycleRate}
                  className="rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-0.5 text-[11px] font-bold text-gray-600 transition active:scale-95 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/70"
                >
                  {rate}×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 목록 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {isLoading ? (
            <div className="text-center text-[13px] text-gray-500 dark:text-white/55 py-8">
              불러오는 중…
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons-outlined text-4xl text-gray-300 dark:text-white/25 block mb-2">
                favorite_border
              </span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">
                즐겨찾기한 구절이 아직 없어요
              </p>
              <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                성경을 읽다가 마음에 닿는 절을 즐겨찾기 해보세요
              </p>
            </div>
          ) : (
            items.map((item, i) => {
              const active = i === currentIndex
              return (
                <button
                  key={item.id}
                  onClick={() => playAt(order.indexOf(i))}
                  className={`w-full text-left rounded-2xl px-3.5 py-2.5 transition-colors flex items-center gap-3 ${
                    active
                      ? 'bg-purple-50 dark:bg-purple-500/15'
                      : 'hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      active
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'bg-black/[0.04] dark:bg-white/[0.07] text-gray-400 dark:text-white/45'
                    }`}
                  >
                    <span className="material-icons-round text-[18px]">
                      {active && isPlaying ? 'graphic_eq' : 'play_arrow'}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[12px] font-bold ${
                        active
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-gray-500 dark:text-white/55'
                      }`}
                    >
                      {item.book_name_ko} {item.chapter}:{item.verse}
                    </span>
                    <span className="block text-[13px] text-gray-700 dark:text-white/75 truncate">
                      {item.text}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onCanPlay={(e) => {
          if (wantPlayRef.current) {
            wantPlayRef.current = false
            e.currentTarget.playbackRate = rate
            e.currentTarget.play().catch(() => {})
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => {
          setIsPlaying(true)
          setPreparing(false)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onError={() => {
          setPreparing(false)
          setIsPlaying(false)
          if (started) setIsError(true)
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration
          setDuration(Number.isFinite(d) ? d : 0)
          e.currentTarget.playbackRate = rate
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d)) setDuration(d)
        }}
      />
      {/* 다음 절 미리 받기용(소리 없음) */}
      <audio ref={preloadRef} preload="auto" muted className="hidden" />
    </div>,
    document.body
  )
}

export default FavoritesPlaylistModal
