import { useEffect, useState } from 'react'
import { genreStyle } from '../../../components/bible/bookGenre'
import { loadBookBriefs, type LoadedBriefs } from '../data/chapterBriefs'

const COLLAPSED_KEY = 'bible-brief-collapsed'
const LAST_READ_KEY = 'bible-last-read-at'
const CATCH_UP_GAP_MS = 3 * 24 * 60 * 60 * 1000 // 3일 이상 쉬면 "지난 이야기"를 보여준다

// 오랜만 여부는 세션당 한 번만 판정한다 — 판정 직후 방문 시각을 갱신하므로,
// 같은 세션에서 장을 옮길 때마다 다시 나타나지 않는다.
let catchUpChecked = false
let catchUpNeeded = false
const checkCatchUp = (): boolean => {
  if (catchUpChecked) return catchUpNeeded
  catchUpChecked = true
  try {
    const prev = Number(localStorage.getItem(LAST_READ_KEY))
    catchUpNeeded = prev > 0 && Date.now() - prev >= CATCH_UP_GAP_MS
  } catch {
    catchUpNeeded = false
  }
  return catchUpNeeded
}

interface ChapterBriefCardProps {
  bookNumber: number
  chapter: number
}

/**
 * 오늘의 길잡이 — 장을 열자마자 보이는 세 줄짜리 지도.
 *
 * 초심자가 "무작정 읽기"에 빠지는 건 읽기 직전 30초가 비어 있어서다.
 * 권 개관(책 단위 시트)·해석(사후 장문)과 달리, 이 카드는 본문 바로 위에서
 * ① 지금까지의 흐름 ② 이 장에서 벌어지는 일 ③ 눈여겨볼 것 하나를 준다.
 *
 * 데이터가 없는 책(아직 작성 전)은 조용히 렌더하지 않는다.
 * 숙련자는 접어둘 수 있고, 접힘 상태는 기기에 기억된다.
 */
const ChapterBriefCard = ({ bookNumber, chapter }: ChapterBriefCardProps) => {
  const [loaded, setLoaded] = useState<LoadedBriefs | null>(null)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })
  // 오랜만에 돌아온 사람에게만 지난 장 줄거리를 함께 보여준다 (마운트 시 1회 판정)
  const [showCatchUp] = useState(checkCatchUp)

  useEffect(() => {
    let alive = true
    setLoaded(null)
    loadBookBriefs(bookNumber).then((data) => {
      if (alive) setLoaded(data)
    })
    return () => {
      alive = false
    }
  }, [bookNumber])

  // 읽기 화면에 온 것 자체를 방문 도장으로 기록 — 다음 방문의 공백 판정에 쓴다
  useEffect(() => {
    try {
      localStorage.setItem(LAST_READ_KEY, String(Date.now()))
    } catch {
      /* storage 불가 환경은 조용히 무시 */
    }
  }, [bookNumber, chapter])

  const brief = loaded?.briefs[chapter]
  if (!loaded || !brief) return null

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, prev ? '0' : '1')
      } catch {
        /* noop */
      }
      return !prev
    })
  }

  // 지난 이야기 — 직전 두 장의 "이 장에서" 줄을 이어붙여 짧은 리캡으로.
  // 시편처럼 장이 독립된 책(비서사)에서는 의미가 없어 건너뛴다.
  const catchUpLines =
    showCatchUp && loaded.narrative && chapter > 1
      ? [chapter - 2, chapter - 1]
          .filter((c) => c >= 1 && loaded.briefs[c])
          .map((c) => ({ chapter: c, text: loaded.briefs[c].now }))
      : []

  const rows = [
    { label: loaded.labels[0], text: brief.recap },
    { label: loaded.labels[1], text: brief.now },
    { label: loaded.labels[2], text: brief.watch },
  ]

  return (
    <div className="px-4 mb-2" style={genreStyle(bookNumber)}>
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface-container)', borderColor: 'var(--card-border)' }}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left"
        >
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--genre) 14%, transparent)',
              color: 'var(--genre)',
            }}
          >
            <span className="material-icons-round text-[17px]">explore</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-ink-strong leading-tight">
              오늘의 길잡이
            </span>
            {collapsed && (
              <span className="block mt-0.5 text-[11.5px] text-ink-muted leading-snug truncate">
                {brief.now}
              </span>
            )}
          </span>
          <span
            className={`material-icons-round text-[20px] shrink-0 text-ink-muted transition-transform ${collapsed ? '' : 'rotate-180'}`}
          >
            expand_more
          </span>
        </button>

        {!collapsed && (
          <div className="px-3.5 pb-3.5 space-y-2.5">
            {catchUpLines.length > 0 && (
              <div
                className="rounded-xl px-3 py-2.5"
                style={{ background: 'color-mix(in srgb, var(--genre) 7%, transparent)' }}
              >
                <p className="text-[10.5px] font-bold tracking-wide mb-1" style={{ color: 'var(--genre)' }}>
                  오랜만이에요 · 지난 이야기
                </p>
                {catchUpLines.map(({ chapter: c, text }) => (
                  <p key={c} className="text-[12px] text-ink leading-relaxed">
                    <span className="font-bold text-ink-muted mr-1">{c}장</span>
                    {text}
                  </p>
                ))}
              </div>
            )}
            {rows.map(({ label, text }) => (
              <div key={label} className="flex gap-2.5">
                <span
                  className="shrink-0 w-[58px] pt-px text-[10.5px] font-bold tracking-wide"
                  style={{ color: 'var(--genre)' }}
                >
                  {label}
                </span>
                <p className="min-w-0 flex-1 text-[12.5px] text-ink leading-relaxed break-keep">
                  {text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChapterBriefCard
