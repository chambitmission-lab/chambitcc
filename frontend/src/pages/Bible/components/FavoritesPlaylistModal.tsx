import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Reorder, motion, useDragControls } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { API_V1 } from '../../../config/api'
import {
  FAVORITES_PLAYLIST_PARAMS,
  bookmarkKeys,
  useMyBookmarks,
  useReorderBookmarks,
  useUpsertBookmark,
} from '../../../hooks/useBibleBookmark'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { shuffle } from '../../../utils/random'
import { safeStorage } from '../../../utils/safeStorage'
import type { VerseBookmarkWithVerse } from '../../../api/bibleBookmark'
import { formatClock } from '../../../utils/formatClock'
// 배속 목록은 장 오디오북과 공유(같은 bible-tts-rate 키를 쓰므로 목록도 하나로)
import { RATE_OPTIONS } from '../data/audioSettings'
import { SheetGrabber } from '../../../components/common/SheetGrabber'

interface FavoritesPlaylistModalProps {
  onClose: () => void
}

const RATE_STORAGE_KEY = 'bible-tts-rate'
const COLLAPSE_STORAGE_KEY = 'bible-playlist-collapsed'
// 음성은 장 오디오북과 동일하게 남성 고정(여성 토글은 추후 노출용으로 보존)
const VOICE = 'male'

const loadRate = (): number => {
  const r = Number(safeStorage.get(RATE_STORAGE_KEY))
  return RATE_OPTIONS.includes(r) ? r : 1
}

const shuffledIds = (ids: number[], keepFirst?: number): number[] => {
  const rest = shuffle(ids.filter((id) => id !== keepFirst))
  return keepFirst !== undefined ? [keepFirst, ...rest] : rest
}

/** 절 본문을 읽는 호흡 단위(쉼표·마침표, 길면 세 어절)로 나눈다 — 어절 표시용 */
const splitPhrases = (text: string): string[] => {
  const out: string[] = []
  let buf: string[] = []
  for (const w of text.trim().split(/\s+/).filter(Boolean)) {
    buf.push(w)
    if (/[,.;:!?]$/.test(w) || buf.length >= 3) {
      out.push(buf.join(' '))
      buf = []
    }
  }
  if (buf.length) out.push(buf.join(' '))
  return out
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
 * - 우측 핸들 드래그로 순서 변경 → 서버(sort_order)에 저장되어 모든 기기에서 유지
 *
 * 재생 큐는 목록 인덱스가 아니라 북마크 id로 관리한다 — 드래그로 목록 순서가
 * 바뀌어도 재생 중인 절이 다른 절로 튀지 않게 하기 위함.
 */
const FavoritesPlaylistModal = ({ onClose }: FavoritesPlaylistModalProps) => {
  useModalBackButton(onClose)

  // 인자는 허브 선요청(prefetchFavoritesPlaylist)과 공유 — 타일을 누르기 전에 받아 둔 캐시를 그대로 이어받는다
  const { data, isLoading } = useMyBookmarks(FAVORITES_PLAYLIST_PARAMS)
  const serverItems = useMemo<VerseBookmarkWithVerse[]>(() => data?.items ?? [], [data])
  const reorderMutation = useReorderBookmarks()

  const audioRef = useRef<HTMLAudioElement>(null)
  const preloadRef = useRef<HTMLAudioElement>(null)
  const wantPlayRef = useRef(false)

  const [rate, setRate] = useState<number>(loadRate)
  // 목록 시트 올림 여부 — 평소엔 다음 두 구절만 걸쳐 있다. 상태는 기기에 유지
  // (예전 "플레이어 접기"와 같은 뜻이라 저장 키를 그대로 쓴다).
  const [listOpen, setListOpen] = useState(
    () => safeStorage.get(COLLAPSE_STORAGE_KEY) === '1'
  )
  // 구절이 하나뿐일 때만 쓰는 한 절 반복(암송용) — 기본은 꺼짐
  const [repeatOne, setRepeatOne] = useState(false)
  const listDragY = useRef<number | null>(null)
  const listDraggedRef = useRef(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(true) // 기본: 마지막 절 후 처음으로 돌아 계속
  // 드래그 순서를 즉시 반영하기 위한 로컬 목록 (서버 데이터와 동기화)
  const [items, setItems] = useState<VerseBookmarkWithVerse[]>([])
  const [queue, setQueue] = useState<number[]>([]) // 재생 순서 (북마크 id 배열)
  const [pos, setPos] = useState(0) // queue 내 현재 위치
  const [started, setStarted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [isError, setIsError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const itemsRef = useRef(items)
  itemsRef.current = items
  const dirtyRef = useRef(false) // 드래그로 순서가 실제로 바뀌었는지

  useEffect(() => {
    setItems(serverItems)
  }, [serverItems])

  // 목록 구성이 바뀌면(최초 로드·추가·삭제) 큐 재구성.
  // 순서만 바뀐 경우(드래그)는 handleReorder가 큐를 직접 관리하므로 건드리지 않는다(셔플 큐 보존).
  useEffect(() => {
    const ids = items.map((it) => it.id)
    const sameSet = queue.length === ids.length && queue.every((id) => ids.includes(id))
    if (!sameSet) {
      setQueue(ids)
      setPos(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const currentId = queue[pos]
  const current = items.find((it) => it.id === currentId) ?? items[0]
  const nextId = queue[pos + 1] ?? (isRepeat ? queue[0] : undefined)
  const nextItem = nextId !== undefined ? items.find((it) => it.id === nextId) : undefined

  const audioUrl = started && current ? verseUrl(current) : undefined

  // 읽는 어절 표시 — 음성에 낱말 시각 정보가 없어, 글자 수 비율로 지금 읽는 덩어리를 어림한다
  const phrases = useMemo(() => splitPhrases(current?.text ?? ''), [current?.text])
  const phraseIdx = useMemo(() => {
    if (!started || duration <= 0 || phrases.length === 0) return -1
    const total = phrases.reduce((s, p) => s + p.length, 0) || 1
    const target = Math.min(0.999, currentTime / duration) * total
    let acc = 0
    for (let i = 0; i < phrases.length; i++) {
      acc += phrases[i].length
      if (target < acc) return i
    }
    return phrases.length - 1
  }, [started, duration, currentTime, phrases])

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
    if (!pre || !isPlaying || !nextItem) return
    pre.src = verseUrl(nextItem)
    pre.load()
  }, [isPlaying, nextItem])

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
    if (pos + 1 < queue.length) playAt(pos + 1)
    else if (isRepeat && queue.length > 0) playAt(0)
  }

  const goPrev = () => {
    // 3초 이상 재생됐으면 현재 절을 처음부터, 아니면 이전 절로
    if (currentTime > 3) {
      const audio = audioRef.current
      if (audio) audio.currentTime = 0
      return
    }
    if (pos - 1 >= 0) playAt(pos - 1)
    else if (isRepeat && queue.length > 0) playAt(queue.length - 1)
  }

  const handleEnded = () => {
    setCurrentTime(0)
    if (pos + 1 < queue.length) {
      wantPlayRef.current = true
      setPos(pos + 1)
    } else if (isRepeat && queue.length > 1) {
      wantPlayRef.current = true
      setPos(0)
    } else if (queue.length === 1 && repeatOne && audioRef.current) {
      // 한 절 반복 — src가 그대로라 effect가 안 돈다. 다시 불러 canplay에서 재생
      wantPlayRef.current = true
      audioRef.current.load()
    } else {
      setIsPlaying(false)
    }
  }

  const toggleShuffle = () => {
    const next = !isShuffle
    const ids = items.map((it) => it.id)
    if (next) {
      setQueue(shuffledIds(ids, currentId))
      setPos(0)
    } else {
      setQueue(ids)
      setPos(currentId !== undefined ? Math.max(0, ids.indexOf(currentId)) : 0)
    }
    setIsShuffle(next)
  }

  // 드래그 중 순서 변경 — 목록을 즉시 갱신하고, 셔플이 아니면 재생 큐도 새 순서를 따른다
  const handleReorder = (newItems: VerseBookmarkWithVerse[]) => {
    dirtyRef.current = true
    setItems(newItems)
    if (!isShuffle) {
      const ids = newItems.map((it) => it.id)
      setQueue(ids)
      setPos(currentId !== undefined ? Math.max(0, ids.indexOf(currentId)) : 0)
    }
  }

  // 드래그를 놓으면 서버에 순서 저장
  const handleDragEnd = () => {
    if (!dirtyRef.current) return
    dirtyRef.current = false
    reorderMutation.mutate(itemsRef.current.map((it) => it.id))
  }

  // 행의 즐겨찾기 해제 — 서버 반영(행 컴포넌트)과 별개로 목록·큐에서 즉시 제거.
  // 듣던 절이 남아 있으면 재생 위치를 따라가 pos가 다른 절로 튀지 않게 한다.
  const removeFromPlaylist = (target: VerseBookmarkWithVerse) => {
    // 듣던 절을 지우면 일시정지 — src만 갈아끼우면 pause 이벤트 없이 멎어 버튼 상태가 어긋난다
    if (target.id === currentId) audioRef.current?.pause()
    const nextQueue = queue.filter((id) => id !== target.id)
    const keepId = currentId !== target.id ? currentId : undefined
    const keepIdx = keepId !== undefined ? nextQueue.indexOf(keepId) : -1
    setPos(keepIdx >= 0 ? keepIdx : Math.min(pos, Math.max(0, nextQueue.length - 1)))
    setQueue(nextQueue)
    setItems((prev) => prev.filter((it) => it.id !== target.id))
  }

  const openList = (next: boolean) => {
    setListOpen(next)
    safeStorage.set(COLLAPSE_STORAGE_KEY, next ? '1' : '0')
  }

  // 목록 머리 — 누르면 올리고 내리기, 위·아래로 끌어도 같은 동작(끈 뒤 따라오는 click은 무시)
  const handleListHeadDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    listDragY.current = e.clientY
    listDraggedRef.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const handleListHeadUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (listDragY.current === null) return
    const dy = e.clientY - listDragY.current
    listDragY.current = null
    if (Math.abs(dy) > 24) {
      listDraggedRef.current = true
      openList(dy < 0)
    }
  }
  const handleListHeadClick = () => {
    if (listDraggedRef.current) {
      listDraggedRef.current = false
      return
    }
    openList(!listOpen)
  }

  const cycleRate = () => {
    const idx = RATE_OPTIONS.indexOf(rate)
    const next = RATE_OPTIONS[(idx + 1) % RATE_OPTIONS.length]
    setRate(next)
    safeStorage.set(RATE_STORAGE_KEY, String(next))
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value)
    setCurrentTime(t)
    if (audioRef.current) audioRef.current.currentTime = t
  }

  const loading = preparing && !isError
  const liveStream = started && !loading && !isError && duration <= 0
  // 절을 넘길 때마다 준비 표시가 번쩍이지 않게 — 0.45초 넘게 걸릴 때만 "준비 중"을 드러낸다
  // (다음 절은 미리 받아 두므로 보통은 그 안에 재생이 시작된다)
  const [slowLoading, setSlowLoading] = useState(false)
  useEffect(() => {
    if (!loading) {
      setSlowLoading(false)
      return
    }
    const t = window.setTimeout(() => setSlowLoading(true), 450)
    return () => window.clearTimeout(t)
  }, [loading])
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const single = items.length === 1
  const refLabel = current ? `${current.book_name_ko} ${current.chapter}:${current.verse}` : ''
  const remaining = Math.max(0, queue.length - pos - 1)
  const counterText = isError
    ? '오디오를 불러오지 못했어요'
    : slowLoading
      ? '말씀을 준비하고 있어요…'
      : single
        ? ''
        : `${pos + 1} / ${items.length}`

  // 걸쳐 있는 목록에 보여 줄 "이어서" 두 구절 — 전체 반복이면 끝에서 처음으로 이어진다
  const upcoming: VerseBookmarkWithVerse[] = []
  for (let k = 1; k <= 2 && k < queue.length; k++) {
    let idx = pos + k
    if (idx >= queue.length) {
      if (!isRepeat) break
      idx %= queue.length
    }
    const it = items.find((i) => i.id === queue[idx])
    if (it) upcoming.push(it)
  }
  const peekPx = 56 + (upcoming.length > 0 ? upcoming.length * 58 : 76) + 10

  const textLen = current?.text.length ?? 0
  const verseSize = textLen <= 60 ? 'text-[21px]' : textLen <= 110 ? 'text-[18.5px]' : 'text-[16.5px]'

  const hasItems = items.length > 0

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className={`relative w-full sm:max-w-md bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col ${
          hasItems ? 'h-[88dvh] sm:h-[min(720px,88dvh)]' : 'max-h-[90dvh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 머리말 — 한 줄. 목록을 올리면 지금 듣는 절 이름이 여기로 올라온다 */}
        <div className="relative z-10 flex shrink-0 items-center gap-2 pl-6 pr-3 pt-5 sm:pt-3 pb-1">
          <SheetGrabber onClose={onClose} className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <h3 className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
            {hasItems && listOpen ? (
              <>
                <span className="font-bold text-brand">{refLabel}</span>
                {!single && <span className="tabular-nums"> · {pos + 1} / {items.length}</span>}
              </>
            ) : (
              '즐겨찾기 듣기'
            )}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {isLoading ? (
          <div className="relative z-10 px-5 py-4">
            <div className="text-center text-[13px] text-gray-500 dark:text-white/55 py-8">
              불러오는 중…
            </div>
          </div>
        ) : !hasItems ? (
          <div className="relative z-10 px-5 py-4">
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
          </div>
        ) : (
          <>
            {/* 낭독 화면 — 본문이 주인공. 읽는 어절에 형광 표시가 따라간다(목록을 올리면 접힌다) */}
            <div className="relative z-10 min-h-0 flex-1 basis-0 overflow-hidden" aria-hidden={listOpen}>
              <div className="flex h-full flex-col overflow-y-auto overscroll-contain px-7">
                <motion.div
                  key={current?.id ?? 'none'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="my-auto py-4 text-center"
                >
                  <p className="mb-3 text-[13px] font-bold text-brand">{refLabel}</p>
                  <p
                    className={`${verseSize} leading-[1.8] tracking-[-0.01em] text-gray-800 dark:text-white/85 [word-break:keep-all]`}
                    style={{ fontFamily: 'var(--font-serif-kr)' }}
                  >
                    {phrases.map((p, i) => (
                      <span key={i}>
                        <span
                          className={`rounded-[4px] transition-colors duration-200 ${
                            phraseIdx < 0 || i < phraseIdx
                              ? ''
                              : i === phraseIdx
                                ? 'bg-[var(--brand-soft-strong)] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]'
                                : 'text-gray-400 dark:text-white/35'
                          }`}
                        >
                          {p}
                        </span>{' '}
                      </span>
                    ))}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* 진행 — 절 안 위치(시간)와 전체 위치(몇 번째)를 좌·가운데·우로 갈라 적는다 */}
            <div className="relative z-10 shrink-0 px-6 pt-1">
              <div className="relative h-4">
                <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/12" />
                {(slowLoading || liveStream) && (
                  <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 animate-pulse rounded-full bg-brand [animation-duration:1.8s]" />
                )}
                {!liveStream && (
                  <>
                    <div
                      className={`absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-brand ${
                        currentTime > 0.4 ? 'transition-[width] duration-300 ease-linear' : ''
                      }`}
                      style={{ width: `${pct}%` }}
                    />
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
              <div className="flex items-center justify-between text-[11px] font-medium tabular-nums text-gray-400 dark:text-white/45">
                <span>{formatClock(currentTime)}</span>
                <span className={isError ? 'font-semibold text-red-500' : 'font-semibold text-gray-500 dark:text-white/55'}>
                  {counterText}
                </span>
                {liveStream ? (
                  <span className="flex items-center gap-1 font-semibold text-brand">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                    생성 중
                  </span>
                ) : (
                  <span>{formatClock(duration)}</span>
                )}
              </div>
            </div>

            {/* 조작 — 목록을 올려도 이 줄은 그대로 남는다 */}
            <div className="relative z-10 flex shrink-0 items-center justify-between px-5 pt-1 pb-3">
              <button
                type="button"
                onClick={cycleRate}
                aria-label={`재생 속도 ${rate}배`}
                className="min-w-[52px] rounded-full bg-black/[0.05] px-3 py-1.5 text-[12px] font-bold tabular-nums text-gray-600 transition active:scale-95 dark:bg-white/[0.08] dark:text-white/70"
              >
                {rate}×
              </button>

              {!single && (
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="이전 절"
                  className="grid h-11 w-11 place-items-center rounded-full text-gray-600 dark:text-white/70 transition active:scale-95"
                >
                  <span className="material-icons-round text-[28px]">skip_previous</span>
                </button>
              )}

              <button
                type="button"
                onClick={togglePlay}
                disabled={loading}
                aria-label={isPlaying ? '일시정지' : '재생'}
                className={`relative grid flex-shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_8px_22px_-6px_var(--brand-glow)] transition-[width,height,transform] duration-300 active:scale-95 disabled:cursor-default ${
                  listOpen ? 'h-12 w-12' : 'h-[60px] w-[60px]'
                }`}
              >
                {slowLoading ? (
                  <span className="material-icons-round relative animate-pulse text-[24px] leading-none">
                    auto_awesome
                  </span>
                ) : (
                  <span className={`material-icons-round relative leading-none ${listOpen ? 'text-[26px]' : 'text-[32px]'}`}>
                    {isPlaying || loading ? 'pause' : 'play_arrow'}
                  </span>
                )}
              </button>

              {!single && (
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="다음 절"
                  className="grid h-11 w-11 place-items-center rounded-full text-gray-600 dark:text-white/70 transition active:scale-95"
                >
                  <span className="material-icons-round text-[28px]">skip_next</span>
                </button>
              )}

              {single ? (
                <button
                  type="button"
                  onClick={() => setRepeatOne((v) => !v)}
                  aria-pressed={repeatOne}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                    repeatOne
                      ? 'bg-[var(--brand-soft)] text-brand'
                      : 'bg-black/[0.05] text-gray-500 dark:bg-white/[0.08] dark:text-white/55'
                  }`}
                >
                  <span className="material-icons-round text-[15px]">repeat</span>
                  한 절 반복
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRepeat((v) => !v)}
                  aria-label="전체 반복"
                  aria-pressed={isRepeat}
                  className={`flex min-w-[52px] items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                    isRepeat
                      ? 'bg-[var(--brand-soft)] text-brand'
                      : 'bg-black/[0.05] text-gray-500 dark:bg-white/[0.08] dark:text-white/55'
                  }`}
                >
                  <span className="material-icons-round text-[15px]">repeat</span>
                  반복
                </button>
              )}
            </div>

            {/* 목록 시트 — 평소엔 다음 두 구절만 걸쳐 있고, 머리를 누르거나 끌어올리면 전체 목록 */}
            <div
              className="relative z-10 flex min-h-0 shrink flex-col overflow-hidden rounded-t-3xl border-t border-black/[0.05] dark:border-white/[0.08] bg-surface-light dark:bg-background-dark shadow-[0_-8px_24px_rgba(0,0,0,0.07)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)] transition-[height] duration-300 ease-out motion-reduce:transition-none"
              style={{
                height: listOpen ? '100%' : `calc(${peekPx}px + env(safe-area-inset-bottom, 0px))`,
              }}
            >
              <div className="relative flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={handleListHeadClick}
                  onPointerDown={handleListHeadDown}
                  onPointerUp={handleListHeadUp}
                  onPointerCancel={() => {
                    listDragY.current = null
                  }}
                  aria-expanded={listOpen}
                  aria-label={listOpen ? '목록 내리기' : '목록 올리기'}
                  className="flex min-w-0 flex-1 touch-none flex-col items-stretch pl-5 pr-3 pb-2 pt-2 text-left"
                >
                  <span className="mx-auto mb-2 h-1 w-9 rounded-full bg-black/10 dark:bg-white/15" />
                  <span className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold text-ink-strong">
                      {listOpen ? '목록' : '이어서'}
                    </span>
                    <span className="text-[11.5px] text-gray-400 dark:text-white/45">
                      {listOpen
                        ? `${items.length}구절`
                        : remaining > 0
                          ? `${remaining}구절 남음`
                          : !single && isRepeat
                            ? '처음부터 다시'
                            : ''}
                    </span>
                    <span className="material-icons-round text-[18px] text-gray-400 dark:text-white/40">
                      {listOpen ? 'expand_more' : 'expand_less'}
                    </span>
                  </span>
                </button>
                {!single && (
                  <button
                    type="button"
                    onClick={toggleShuffle}
                    aria-label="셔플"
                    aria-pressed={isShuffle}
                    className={`mr-4 mt-3 flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                      isShuffle
                        ? 'bg-[var(--brand-soft)] text-brand'
                        : 'bg-black/[0.05] text-gray-500 dark:bg-white/[0.08] dark:text-white/55'
                    }`}
                  >
                    <span className="material-icons-round text-[15px]">shuffle</span>
                    셔플
                  </button>
                )}
              </div>

              {listOpen ? (
                /* 전체 목록 — 우측 핸들 드래그로 순서 변경 */
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={items}
                  onReorder={handleReorder}
                  layoutScroll
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 space-y-1"
                >
                  {items.map((item) => (
                    <PlaylistRow
                      key={item.id}
                      item={item}
                      active={current?.id === item.id}
                      playing={isPlaying}
                      onPlay={() => {
                        const qp = queue.indexOf(item.id)
                        if (qp >= 0) playAt(qp)
                      }}
                      onRemove={() => removeFromPlaylist(item)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </Reorder.Group>
              ) : upcoming.length > 0 ? (
                <div className="px-3">
                  {upcoming.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const qp = queue.indexOf(item.id)
                        if (qp >= 0) playAt(qp)
                      }}
                      className="flex h-[58px] w-full flex-col justify-center rounded-2xl px-3 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    >
                      <span className="text-[12.5px] font-bold text-gray-600 dark:text-white/65">
                        {item.book_name_ko} {item.chapter}:{item.verse}
                      </span>
                      <span className="truncate text-[13px] text-gray-500 dark:text-white/50">
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mx-4 grid h-[64px] place-items-center rounded-2xl border border-dashed border-black/10 px-4 text-center text-[12.5px] leading-[1.5] text-gray-400 dark:border-white/15 dark:text-white/40">
                  {single
                    ? '성경을 읽다가 ♥ 를 누르면 여기에 담겨 이어서 들려요'
                    : '마지막 구절이에요'}
                </div>
              )}
            </div>
          </>
        )}
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

interface PlaylistRowProps {
  item: VerseBookmarkWithVerse
  active: boolean
  playing: boolean
  onPlay: () => void
  onRemove: () => void
  onDragEnd: () => void
}

/**
 * 플레이리스트 한 줄 — 본문 탭은 재생, 우측 핸들만 드래그 시작점.
 * dragListener={false} + dragControls로 핸들 외 영역에서는 리스트 스크롤이 그대로 동작한다.
 * 하트 탭 = 즐겨찾기 해제(목록에서 제거). 북마크 삭제가 아니라 is_favorite만 끄므로
 * 절에 남긴 형광펜·노트는 보존된다.
 */
const PlaylistRow = ({ item, active, playing, onPlay, onRemove, onDragEnd }: PlaylistRowProps) => {
  const dragControls = useDragControls()
  const queryClient = useQueryClient()
  const unfavorite = useUpsertBookmark(item.verse_id)

  const handleRemove = () => {
    if (unfavorite.isPending) return
    onRemove() // 목록·큐에서 즉시 제거 (optimistic)
    unfavorite.mutate(
      { highlight_color: item.highlight_color, note: item.note, is_favorite: false },
      {
        // 실패하면 서버 목록을 다시 받아 되살린다
        onError: () =>
          queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() }),
      }
    )
  }

  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.02,
        zIndex: 20,
        boxShadow: '0 10px 26px rgba(0,0,0,0.35)',
      }}
      className={`relative flex items-center rounded-2xl transition-colors ${
        active
          ? 'bg-[var(--brand-soft)]'
          : 'bg-surface-light dark:bg-background-dark hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
      }`}
    >
      <button
        type="button"
        onClick={onPlay}
        className="min-w-0 flex-1 text-left rounded-2xl pl-3.5 py-2.5 flex items-center gap-3"
      >
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
            active
              ? 'bg-brand text-white'
              : 'bg-black/[0.04] dark:bg-white/[0.07] text-gray-400 dark:text-white/45'
          }`}
        >
          <span className="material-icons-round text-[18px]">
            {active && playing ? 'graphic_eq' : 'play_arrow'}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-[12px] font-bold ${
              active
                ? 'text-brand'
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

      <button
        type="button"
        onClick={handleRemove}
        aria-label="즐겨찾기 해제"
        className="shrink-0 self-stretch px-1.5 grid place-items-center text-brand hover:text-[var(--brand-dim)] transition-colors active:scale-90"
      >
        <span className="material-icons-round text-[18px]">favorite</span>
      </button>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          dragControls.start(e)
        }}
        aria-label="순서 변경 (드래그)"
        className="shrink-0 self-stretch pl-1 pr-2.5 grid place-items-center cursor-grab active:cursor-grabbing text-gray-300 dark:text-white/25 hover:text-gray-500 dark:hover:text-white/50 transition-colors touch-none"
      >
        <span className="material-icons-round text-[20px]">drag_indicator</span>
      </button>
    </Reorder.Item>
  )
}

export default FavoritesPlaylistModal
