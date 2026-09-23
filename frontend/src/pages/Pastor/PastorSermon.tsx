import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { checkPassage, fetchSermonPrep, type PassageCheck, type SermonPrep } from '../../api/pastor'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import EmotionFlowCard from './components/EmotionFlowCard'
import { agoLabel, daysSince, formatDay, inputCls, usePastorGate } from './components/pastorUtils'

// 설교 준비 도우미 — 좌: 본문 중복 확인 · 66권 커버리지 · 오래 설교하지 않은 권
//                    우: 이번 주 성도의 마음 · 성도들이 머문 말씀 · 최근 설교
// 모두 규칙·집계(AI 미사용). 본문은 설교 등록 때 적은 '본문' 칸을 읽어 권·장으로 센다.

const PERIODS = [
  { years: 1, label: '최근 1년' },
  { years: 3, label: '최근 3년' },
  { years: 0, label: '전체' },
] as const

// 타일에 넣기엔 긴 이름 — 네 글자로 자르면 서로 같아지는 권(예레미야/예레미야애가, 데살로니가전·후서)부터
const TILE_NAME: Record<string, string> = {
  예레미야애가: '애가',
  데살로니가전서: '살전',
  데살로니가후서: '살후',
  요한계시록: '계시록',
  고린도전서: '고전',
  고린도후서: '고후',
  디모데전서: '딤전',
  디모데후서: '딤후',
  베드로전서: '벧전',
  베드로후서: '벧후',
  갈라디아서: '갈라디아',
}
const tileName = (name: string) => TILE_NAME[name] ?? name.slice(0, 4)

const PastorSermon = () => {
  const pastor = usePastorGate()
  const [years, setYears] = useState<number>(3)
  const [openBook, setOpenBook] = useState<number | null>(null)

  const { data, isPending } = useQuery<SermonPrep>({
    queryKey: ['pastor-sermon-prep', years],
    queryFn: () => fetchSermonPrep(years),
    enabled: pastor,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  })

  return (
    <PastorShell>
      {isPending && !data ? (
        <StatSpinner label="설교 준비 자료를 모으는 중..." />
      ) : !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-600">설교 준비 자료를 불러오지 못했습니다</p>
      ) : (
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="contents lg:block lg:min-w-0">
            <PassageCheckCard />
            <CoverageCard data={data} years={years} onYears={setYears} openBook={openBook} onOpenBook={setOpenBook} />
          </div>
          <div className="contents lg:block">
            <EmotionFlowCard emotions={data.heart} title="이번 주 성도의 마음" />
            <EngagementCard data={data} />
            <RecentCard data={data} />
          </div>
        </div>
      )}
    </PastorShell>
  )
}

// ── 본문 중복 확인 ─────────────────────────────────────
const PassageCheckCard = () => {
  const [ref, setRef] = useState('')
  const check = useMutation<PassageCheck, Error, string>({ mutationFn: checkPassage })
  const result = check.data

  return (
    <SectionCard title="본문 확인">
      <p className="text-[12px] text-gray-600 dark:text-white/60">
        준비 중인 본문을 넣으면, 같은 장을 다룬 지난 설교를 찾아 드립니다.
      </p>
      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault()
          if (ref.trim()) check.mutate(ref.trim())
        }}
      >
        <input
          className={inputCls}
          value={ref}
          onChange={e => setRef(e.target.value)}
          placeholder="예: 요 3:16-21, 창세기 12장, 시 23"
          maxLength={100}
        />
        <button
          type="submit"
          disabled={!ref.trim() || check.isPending}
          className="shrink-0 px-4 rounded-xl bg-brand text-white text-[13.5px] font-bold disabled:opacity-40"
        >
          확인
        </button>
      </form>
      {result &&
        (result.parsed.length === 0 ? (
          <p className="text-[12.5px] font-semibold text-[var(--amber)]">본문을 읽지 못했어요. "요 3:16"이나 "요한복음 3장"처럼 적어 주세요.</p>
        ) : result.matches.length === 0 ? (
          <p className="text-[12.5px] text-ink-strong">
            <b>{result.parsed.join(', ')}</b> — 이 장을 다룬 지난 설교가 없습니다.
          </p>
        ) : (
          <div>
            <p className="text-[12.5px] text-ink-strong">
              <b>{result.parsed.join(', ')}</b> — 지난 설교 {result.matches.length}편
            </p>
            <ul className="mt-2 space-y-1.5">
              {result.matches.map(m => (
                <li key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-ink-strong truncate">{m.title}</span>
                    <span className="block text-[12px] text-gray-600 dark:text-white/60 truncate">
                      {[m.bible_verse, m.pastor].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-gray-600 dark:text-white/60">
                    {formatDay(m.date, false)} · {agoLabel(daysSince(m.date))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </SectionCard>
  )
}

// ── 66권 커버리지 ──────────────────────────────────────
const CoverageCard = ({
  data,
  years,
  onYears,
  openBook,
  onOpenBook,
}: {
  data: SermonPrep
  years: number
  onYears: (y: number) => void
  openBook: number | null
  onOpenBook: (n: number | null) => void
}) => {
  const max = Math.max(1, ...data.books.map(b => b.count))
  const ot = data.books.filter(b => b.testament === 'OT')
  const nt = data.books.filter(b => b.testament === 'NT')
  const total = data.testament.ot + data.testament.nt
  const otRate = total ? Math.round((data.testament.ot / total) * 100) : 0
  const selected = data.books.find(b => b.book_number === openBook)

  // 설교가 많을수록 진하게 — 0편은 빈칸처럼 옅게
  const tone = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-white/50'
    const r = count / max
    // brand 는 CSS 변수 색이라 bg-brand/60 같은 투명도 수식자가 안 먹는다 — 테마 tint 토큰으로 3단
    if (r > 0.66) return 'bg-brand text-white'
    if (r > 0.33) return 'bg-[var(--brand-glow)] text-brand'
    return 'bg-[var(--brand-soft-strong)] text-brand'
  }

  const grid = (list: typeof data.books) => (
    <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-1">
      {list.map(b => (
        <button
          key={b.book_number}
          type="button"
          onClick={() => onOpenBook(openBook === b.book_number ? null : b.book_number)}
          title={`${b.name} · ${b.count}편${b.last_date ? ` · 마지막 ${b.last_date}` : ''}`}
          className={`h-11 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105 ${tone(b.count)} ${
            openBook === b.book_number ? 'ring-2 ring-offset-1 ring-brand dark:ring-offset-background-dark' : ''
          }`}
        >
          <span className="text-[12px] font-bold leading-tight truncate max-w-full px-0.5">{tileName(b.name)}</span>
          <span className="text-[12px] leading-tight opacity-80">{b.count || ''}</span>
        </button>
      ))}
    </div>
  )

  return (
    <SectionCard
      title="성경 권별 설교"
      action={
        <span className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.years}
              type="button"
              onClick={() => onYears(p.years)}
              className={`px-2 py-1 rounded-md text-[12px] font-semibold ${
                years === p.years ? 'text-brand bg-[var(--brand-soft)]' : 'text-gray-600 dark:text-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </span>
      }
    >
      <p className="text-[12px] text-gray-600 dark:text-white/60 leading-relaxed">
        이 기간 설교 {data.in_period}편 · 구약 {otRate}% / 신약 {total ? 100 - otRate : 0}%.
        진할수록 자주 다룬 권이고, 누르면 그 권의 설교가 나옵니다.
        {data.unparsed > 0 && (
          <span className="text-[var(--amber)] font-semibold"> 본문을 읽지 못한 설교 {data.unparsed}편은 세지 않았어요.</span>
        )}
      </p>
      <div>
        <p className="text-[12px] font-bold text-gray-600 dark:text-white/65 mb-1.5">구약</p>
        {grid(ot)}
      </div>
      <div>
        <p className="text-[12px] font-bold text-gray-600 dark:text-white/65 mb-1.5">신약</p>
        {grid(nt)}
      </div>

      {selected && (
        <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] px-3.5 py-3">
          <p className="text-[13px] font-bold text-ink-strong">
            {selected.name} · 이 기간 {selected.count}편
            {selected.last_date && (
              <span className="ml-1.5 text-[12px] font-semibold text-gray-600">
                마지막 {formatDay(selected.last_date, false)} ({agoLabel(daysSince(selected.last_date))})
              </span>
            )}
          </p>
          {selected.sermons.length === 0 ? (
            <p className="mt-1 text-[12px] text-gray-600">이 권을 본문으로 한 설교가 아직 없습니다.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {selected.sermons.map(s => (
                <li key={s.id} className="flex items-center gap-2 text-[12.5px]">
                  <span className="shrink-0 w-20 text-gray-600 dark:text-white/60">{s.date.replace(/-/g, '.')}</span>
                  <span className="flex-1 min-w-0 truncate text-ink-strong font-semibold">{s.title}</span>
                  <span className="shrink-0 text-[12px] text-gray-600 dark:text-white/60">{s.bible_verse}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[12px] font-bold text-gray-600 dark:text-white/65">오래 설교하지 않은 권</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.stale.map(b => (
            <button
              key={b.book_number}
              type="button"
              onClick={() => onOpenBook(b.book_number)}
              className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12px] font-semibold text-gray-600 dark:text-white/70 hover:text-brand"
            >
              {b.name}
              <span className="ml-1 font-normal text-gray-500">{b.last_date ? agoLabel(daysSince(b.last_date)) : '없음'}</span>
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

// ── 성도들이 머문 말씀 ─────────────────────────────────
const EngagementCard = ({ data }: { data: SermonPrep }) => {
  const e = data.engagement
  const verses = [...e.favorites, ...e.underlines]
    .filter((v, i, arr) => arr.findIndex(x => x.verse_id === v.verse_id) === i)
    .slice(0, 6)
  return (
    <SectionCard
      title="성도들이 머문 말씀"
      action={<span className="text-[12px] text-gray-500 dark:text-white/50">최근 {e.days}일 · 익명</span>}
    >
      {verses.length === 0 ? (
        <EmptyHint text="최근 즐겨찾기·밑줄이 아직 없습니다" />
      ) : (
        <ul className="space-y-2">
          {verses.map(v => (
            <li key={v.verse_id}>
              <Link
                to={`/bible/${v.book_number}/${v.chapter}?verse=${v.verse}`}
                className="block rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-2.5 hover:border-brand"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-brand">
                    {v.book_name} {v.chapter}:{v.verse}
                  </span>
                  <span className="text-[12px] text-gray-500">{v.users}명</span>
                </span>
                <span className="block mt-0.5 text-[12.5px] text-[#4b5563] dark:text-white/70 leading-relaxed line-clamp-2">{v.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {e.words.length > 0 && (
        <div>
          <p className="text-[12px] font-bold text-gray-600 dark:text-white/65">많이 밑줄 그은 단어</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {e.words.map(w => (
              <span key={w} className="px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] font-semibold">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ── 최근 설교 ─────────────────────────────────────────
const RecentCard = ({ data }: { data: SermonPrep }) => (
  <SectionCard
    title="최근 설교"
    action={
      <Link to="/sermon" className="text-[12px] font-semibold text-brand hover:underline">
        설교 전체
      </Link>
    }
  >
    {data.recent.length === 0 ? (
      <EmptyHint text="등록된 설교가 없습니다" />
    ) : (
      <ul className="space-y-1.5">
        {data.recent.map(s => (
          <li key={s.id} className="flex items-center gap-2">
            <span className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-semibold text-ink-strong truncate">{s.title}</span>
              <span className={`block text-[12px] truncate ${s.parsed ? 'text-gray-600 dark:text-white/60' : 'text-[var(--amber)]'}`}>
                {s.bible_verse || '본문 없음'}
                {!s.parsed && ' · 본문을 읽지 못함'}
              </span>
            </span>
            <span className="shrink-0 text-right text-[12px] text-gray-600 dark:text-white/60">
              {formatDay(s.date, false)}
              <br />
              조회 {s.views}
            </span>
          </li>
        ))}
      </ul>
    )}
  </SectionCard>
)

export default PastorSermon
