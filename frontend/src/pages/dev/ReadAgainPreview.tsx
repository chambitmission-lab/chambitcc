/**
 * /dev/read-again — 2독부터 장 머리에 놓이는 '다시 읽는 길' 카드(ReadAgainCard) 확인용.
 * 로그인·백엔드 없이 회차 요약과 지난 회차 흔적을 캐시에 심어 렌더한다.
 * 위 버튼으로 회차(2·3·4독)와 흔적 유무를 바꿔 본다. 렌즈 바꾸기는 서버가 없어 실패 토스트가 정상.
 */
import { useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { ReadingCycleSummary, ReadingEcho } from '../../api/bibleReading'
import { bibleReadingKeys } from '../../hooks/useBibleReading'
import ReadAgainCard from '../Bible/components/ReadAgainCard'
import '../Bible/BibleStudy.css'

const SAMPLES = [
  { book: 1, chapter: 22, title: '창세기 22장' },
  { book: 19, chapter: 23, title: '시편 23편' },
  { book: 45, chapter: 8, title: '로마서 8장' },
]

const cyclesFor = (n: number): ReadingCycleSummary => ({
  current_cycle: n,
  completed_count: n - 1,
  current_completed: false,
  cycles: Array.from({ length: n }, (_, i) => ({
    cycle_no: i + 1,
    started_at: i === 0 ? '2025-01-01T00:00:00+00:00' : `2026-0${i + 2}-01T00:00:00+00:00`,
    completed_at: i < n - 1 ? `2026-0${i + 2}-01T00:00:00+00:00` : null,
    lens: null,
  })),
})

const echoFor = (book: number, chapter: number, n: number, withTraces: boolean): ReadingEcho => ({
  current_cycle: n,
  book_number: book,
  chapter,
  past_reads: Array.from({ length: n - 1 }, (_, i) => ({
    cycle_no: i + 1,
    read_at: i === 0 ? '2025-03-14T11:20:00+00:00' : `2026-0${i + 3}-02T22:05:00+00:00`,
  })),
  traces: withTraces
    ? [
        {
          kind: 'note',
          verse: 2,
          cycle_no: 1,
          at: '2025-03-14T20:31:00+09:00',
          text: '독자를 바치라는 말씀이 너무 어려웠다. 그래도 아브라함은 순종했다.\n나는 무엇을 붙들고 있나.',
        },
        {
          kind: 'reflection',
          verse: 8,
          cycle_no: 1,
          at: '2025-03-14T20:40:00+09:00',
          text: '"하나님이 자기를 위하여 친히 준비하시리라" — 오늘 하루를 맡겨 드립니다.',
        },
        { kind: 'word', verse: 14, cycle_no: 1, at: '2025-03-14T20:44:00+09:00', word: '여호와 이레', text: '여호와께서 준비하신다' },
        { kind: 'highlight', verse: 12, cycle_no: 1, at: '2025-03-14T20:35:00+09:00', color: 'yellow' },
        { kind: 'favorite', verse: 18, cycle_no: 1, at: '2025-03-14T20:50:00+09:00' },
      ]
    : [],
})

const seedCache = (qc: QueryClient, cycle: number, withTraces: boolean) => {
  const updatedAt = Date.now()
  qc.setQueryData(bibleReadingKeys.cycles(), cyclesFor(cycle), { updatedAt })
  SAMPLES.forEach((s, i) =>
    qc.setQueryData(
      bibleReadingKeys.echo(s.book, s.chapter),
      echoFor(s.book, s.chapter, cycle, withTraces && i === 0),
      { updatedAt },
    ),
  )
}

export default function ReadAgainPreview() {
  const qc = useQueryClient()
  // 첫 렌더 전에 캐시를 심는다(초기화 함수는 한 번만 돈다)
  const [cycle, setCycle] = useState(() => {
    seedCache(qc, 2, true)
    return 2
  })
  const [withTraces, setWithTraces] = useState(true)
  const [seed, setSeed] = useState(0)

  const apply = (n: number, traces: boolean) => {
    seedCache(qc, n, traces)
    setCycle(n)
    setWithTraces(traces)
    setSeed((v) => v + 1)
  }
  const pick = (n: number) => apply(n, withTraces)

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-6">
      <div className="max-w-md mx-auto">
        <div className="px-4 mb-4 flex flex-wrap gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => pick(n)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold ${cycle === n ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10 text-ink'}`}
            >
              {n}독
            </button>
          ))}
          <button
            type="button"
            onClick={() => apply(cycle, !withTraces)}
            className="px-3 py-1.5 rounded-full text-sm font-bold bg-black/5 dark:bg-white/10 text-ink"
          >
            흔적 {withTraces ? '있음' : '없음'}
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.documentElement
              el.setAttribute('data-theme', el.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
            }}
            className="px-3 py-1.5 rounded-full text-sm font-bold bg-black/5 dark:bg-white/10 text-ink"
          >
            다크 토글
          </button>
        </div>
        {SAMPLES.map((s) => (
          <div key={`${s.book}-${seed}`} className="mb-6">
            <p className="px-4 mb-1 text-xs font-bold text-ink-muted">{s.title}</p>
            <ReadAgainCard bookNumber={s.book} chapter={s.chapter} enabled />
          </div>
        ))}
      </div>
    </div>
  )
}
