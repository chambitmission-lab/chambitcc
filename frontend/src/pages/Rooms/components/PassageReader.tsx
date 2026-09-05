import { useEffect, useMemo, useRef, useState } from 'react'
import { useBibleChapter } from '../../../hooks/useBible'
import { useToggleVerseMark } from '../../../hooks/useMeditationRoom'
import type { PlanPassage } from '../../../types/biblePlan'
import type { RoomDayDetail, RoomDetail } from '../../../types/meditationRoom'
import { CheckIcon, SmallHeartIcon } from '../RoomIcons'

// ── 본문 리더 — 절을 누르면 '마음이 머문 절' ──
export const PassageReader = ({
  room,
  day,
  passages,
  detail,
  readByMe,
  onRead,
  allowAutoRead,
  marking,
}: {
  room: RoomDetail
  day: number
  passages: PlanPassage[]
  detail?: RoomDayDetail
  readByMe: boolean
  onRead: () => void
  allowAutoRead: boolean
  marking: boolean
}) => {
  const toggleMark = useToggleVerseMark(room.id, day)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [loadedCount, setLoadedCount] = useState(0)
  const allLoaded = loadedCount >= passages.length

  // 끝까지 스크롤해 1.5초 머무르면 읽음 처리 (버튼을 눌러도 된다)
  useEffect(() => {
    if (readByMe || !allowAutoRead || !allLoaded || !sentinelRef.current) return
    let timer: number | undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = window.setTimeout(onRead, 1500)
        } else if (timer) {
          window.clearTimeout(timer)
          timer = undefined
        }
      },
      { threshold: 0.9 },
    )
    io.observe(sentinelRef.current)
    return () => {
      io.disconnect()
      if (timer) window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readByMe, allowAutoRead, allLoaded])

  const marks = new Map<string, { count: number; mine: boolean; names: string[] }>()
  detail?.verse_marks.forEach((m) => marks.set(`${m.book_number}:${m.chapter}:${m.verse}`, m))

  return (
    <div className="px-4 pt-3 pb-4">
      <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
        마음이 머문 절을 살짝 눌러 표시해요. 방 친구들이 어디에 머물렀는지도 보여요.
      </p>
      {passages.map((p, i) => (
        <PassageBlock
          key={`${p.book_number}-${p.chapter_start}-${p.verse_start ?? 0}`}
          passage={p}
          showRef={passages.length > 1 || i > 0}
          marks={marks}
          onLoaded={() => setLoadedCount((c) => Math.max(c, i + 1))}
          onToggle={(chapter, verse) =>
            toggleMark.mutate({ book_number: p.book_number, chapter, verse })
          }
        />
      ))}
      <div ref={sentinelRef} className="pt-3">
        {readByMe ? (
          <p className="text-center text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-300">
            <CheckIcon size={11} className="inline-block -mt-px mr-1 align-middle" />
            오늘 본문을 읽었어요. 아래에 마음을 남겨보세요
          </p>
        ) : (
          <button
            type="button"
            onClick={onRead}
            disabled={marking}
            className="relative w-full py-3 rounded-2xl bg-brand text-white text-[14px] font-bold seal-chip [--seal-radius:1rem] disabled:opacity-50 active:scale-[0.985] transition-transform"
          >
            {marking ? '표시하는 중...' : '다 읽었어요'}
          </button>
        )}
      </div>
    </div>
  )
}

export const PassageBlock = ({
  passage,
  showRef,
  marks,
  onLoaded,
  onToggle,
}: {
  passage: PlanPassage
  showRef: boolean
  marks: Map<string, { count: number; mine: boolean; names: string[] }>
  onLoaded: () => void
  onToggle: (chapter: number, verse: number) => void
}) => {
  // 방 본문은 장 경계로 끊어 저장되므로 chapter_start 하나만 읽으면 된다
  const { data, isLoading } = useBibleChapter(passage.book_number, passage.chapter_start)
  useEffect(() => {
    if (data) onLoaded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  const verses = useMemo(() => {
    if (!data) return []
    const s = passage.verse_start ?? 1
    const e = passage.verse_end ?? Number.MAX_SAFE_INTEGER
    return data.verses.filter((v) => v.verse >= s && v.verse <= e)
  }, [data, passage.verse_start, passage.verse_end])

  if (isLoading) {
    return <div className="h-24 rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse mb-2" />
  }
  return (
    <div className="mb-3">
      {showRef && (
        <p className="text-[12px] font-bold text-brand mb-1.5">{passage.reference ?? `${passage.book_name_ko ?? ''} ${passage.chapter_start}장`}</p>
      )}
      <div className="space-y-0.5">
        {verses.map((v) => {
          const m = marks.get(`${passage.book_number}:${passage.chapter_start}:${v.verse}`)
          return (
            <button
              key={v.verse}
              type="button"
              onClick={() => onToggle(passage.chapter_start, v.verse)}
              className={`w-full text-left flex gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                m?.mine ? 'bg-rose-500/[0.08]' : m ? 'bg-[var(--brand-soft)]/60' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="shrink-0 w-5 text-right text-[10.5px] font-bold text-gray-400 dark:text-white/35 pt-[3px] tabular-nums">
                {v.verse}
              </span>
              <span className="flex-1 text-[15px] leading-[1.75] text-gray-800 dark:text-white/85 font-serif-kr break-keep">
                {v.text}
                {m && (
                  <span
                    className={`inline-flex items-center gap-0.5 ml-1.5 align-middle px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      m.mine ? 'bg-rose-500 text-white' : 'bg-white dark:bg-white/[0.1] text-rose-500 ring-1 ring-rose-200 dark:ring-rose-400/30'
                    }`}
                    title={m.names.join(', ')}
                  >
                    <SmallHeartIcon size={9} filled /> {m.count}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
