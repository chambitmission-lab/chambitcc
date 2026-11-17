// 걸어온 길 — /today '작년 오늘의 나' 탭. 1년 전 → 6개월 전 → 한 달 전 → 오늘을 한 줄 길 위의 정거장으로 놓는다.
// 정거장마다 그날 하루(읽은 장·밑줄·누군가를 위한 기도·그 주 주일 말씀)를 꼬리표로 붙이고,
// 기록이 없는 시점도 빈 정거장으로 남긴다. 길 끝 '오늘'은 내년 오늘 다시 만날 기록을 남기는 자리.
// 시안: /#/dev/today-memory?v=b. path·day 는 옛 백엔드에 없을 수 있다 — 없으면 그 조각만 빠진다.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MemoryDay, MemoryPath as PathData, TodayChurch, TodayMemory } from '../../api/todayChurch'
import { AnswerAsk, MemoryQuote } from './MemoryLetter'
import { formatClock, formatKoreanDate, memoryKind, memoryWhen, offsetWhen, weekdayOf } from './memoryCopy'
import './memoryPath.css'

const ICON = {
  book: 'M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5zM12 6v13',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  church: 'M12 3v5M10 5h4M6 21v-9l6-4 6 4v9M3 21h18M10 21v-4a2 2 0 0 1 4 0v4',
} as const

const Tag = ({ icon, children }: { icon: keyof typeof ICON; children: ReactNode }) => (
  <span className="tmp-tag">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICON[icon]} />
    </svg>
    {children}
  </span>
)

const dots = (ymd: string) => ymd.replaceAll('-', '.')

/** "창세기 1·2·3장" — 많으면 "창세기 1장 외 5장". 시편은 '편' */
const readLabel = ({ book_number, book_name, chapters }: MemoryDay['read'][number]) => {
  const unit = book_number === 19 ? '편' : '장'
  return chapters.length <= 4
    ? `${book_name} ${chapters.join('·')}${unit}`
    : `${book_name} ${chapters[0]}${unit} 외 ${chapters.length - 1}${unit}`
}

const DayTags = ({ day }: { day: MemoryDay }) => {
  const hasTags = day.read.length > 0 || day.prayed_for > 0 || !!day.sermon
  return (
    <>
      {day.underline && (
        <p className="tmp-underline font-serif-kr">
          {day.underline.text}
          <small>그날 밑줄 그은 말씀 · {day.underline.reference}</small>
        </p>
      )}
      {hasTags && (
        <div className="tmp-tags">
          {day.read.map((r) => (
            <Tag key={r.book_number} icon="book">{readLabel(r)} 읽음</Tag>
          ))}
          {day.prayed_for > 0 && <Tag icon="heart">성도 {day.prayed_for}명의 기도에 함께함</Tag>}
          {day.sermon && <Tag icon="church">주일 말씀 「{day.sermon.title}」</Tag>}
        </div>
      )}
    </>
  )
}

const MemoryStop = ({ memory }: { memory: TodayMemory }) => {
  const navigate = useNavigate()
  const kind = memoryKind(memory)
  const when = [weekdayOf(memory.date), memory.time && formatClock(memory.time), dots(memory.date)].filter(Boolean)
  const canOpenChapter = memory.kind === 'typing' && memory.book_number && memory.chapter
  return (
    <li className="tmp-stop">
      <div className="tmp-stop-head">
        <b>{memoryWhen(memory)}</b>
        <span>{when.join(' · ')}</span>
      </div>
      <article className="tmp-card tmp-stop-card">
        <p className="tmp-kind">
          <b>{kind.name}</b>
          {kind.detail && ` · ${kind.detail}`}
        </p>
        <MemoryQuote memory={memory} className="mt-2" />
        {memory.day && <DayTags day={memory.day} />}
        <AnswerAsk memory={memory} />
        {canOpenChapter && (
          <button
            type="button"
            onClick={() => navigate(`/bible/${memory.book_number}/${memory.chapter}`)}
            className="tmp-link block"
          >
            그 장 다시 읽기
          </button>
        )}
      </article>
    </li>
  )
}

type Stop =
  | { type: 'memory'; date: string; memory: TodayMemory }
  | { type: 'quiet'; date: string; label: string; note: string }

/** 기억과 빈 정거장을 날짜순으로 — '함께하기 전' 정거장이 여럿이면 한 줄로 묶는다 */
const buildStops = (memories: TodayMemory[], path?: PathData): Stop[] => {
  const before = (path?.stops ?? []).filter((s) => s.state === 'before')
  const quiet = (path?.stops ?? []).filter((s) => s.state === 'quiet')
  const stops: Stop[] = [
    ...memories.map((memory): Stop => ({ type: 'memory', date: memory.date, memory })),
    ...quiet.map((s): Stop => ({
      type: 'quiet',
      date: s.date,
      label: offsetWhen(s.offset),
      note: '이날은 기록 없이 조용히 지나갔어요.',
    })),
  ]
  if (before.length) {
    const joined = path?.joined_date
    stops.push({
      type: 'quiet',
      date: before[0].date,
      label: before.map((s) => offsetWhen(s.offset).replace(' 오늘', '')).join(' · ') + ' 오늘',
      note: joined
        ? `아직 이 길을 걷기 전이에요. 참빛과 함께한 첫날은 ${formatKoreanDate(joined)}이에요.`
        : '아직 이 길을 걷기 전이에요.',
    })
  }
  return stops.sort((a, b) => a.date.localeCompare(b.date))
}

const heroTitle = (since: PathData['since'] | undefined) => {
  if (!since || since.days <= 0) return ['걸어온 길 위에서', '그날의 나를 만나요']
  if (since.chapters <= 0) return [`${since.days.toLocaleString()}일을`, '걸어오셨어요']
  return [`${since.days.toLocaleString()}일 동안`, `${since.chapters.toLocaleString()}장을 걸어오셨어요`]
}

interface MemoryPathProps {
  data: TodayChurch
  /** 작년 이맘때 응답된 기도 카드 — PC 는 히어로 아래, 모바일은 길 아래 */
  echo?: ReactNode
}

export const MemoryPath = ({ data, echo }: MemoryPathProps) => {
  const navigate = useNavigate()
  const { memories, path } = data
  const stops = buildStops(memories, path)
  const [line1, line2] = heroTitle(path?.since)
  const reading = path?.now_reading

  return (
    <div className="tmp">
      <section className="tmp-card tmp-hero">
        <img src="/images/bible/reading-walk-light.webp" alt="" className="dark:hidden" />
        <img src="/images/bible/reading-walk-dark.webp" alt="" className="hidden dark:block" />
        <div className="tmp-hero-text">
          <p className="eyebrow">걸어온 길</p>
          <h2>
            {line1}
            <br />
            {line2}
          </h2>
          <p>오늘과 같은 날짜에 서 있던 나를 길 위에서 다시 만나요.</p>
        </div>
      </section>

      <ol className="tmp-path">
        {stops.map((s) =>
          s.type === 'memory' ? (
            <MemoryStop key={`${s.memory.kind}-${s.memory.id}`} memory={s.memory} />
          ) : (
            <li key={s.label} className="tmp-stop is-quiet">
              <div className="tmp-stop-head">
                <b>{s.label}</b>
                <span>{dots(s.date)}</span>
              </div>
              <p className="tmp-stop-quiet">{s.note}</p>
            </li>
          ),
        )}

        <li className="tmp-stop is-today">
          <div className="tmp-stop-head">
            <b>오늘</b>
            <span>
              {dots(data.date)}
              {reading && ` · ${reading.book_name} ${reading.chapter}${reading.book_number === 19 ? '편' : '장'} 읽는 중`}
            </span>
          </div>
          <div className="tmp-today">
            <p className="tmp-today-line">오늘 남긴 한 줄은 내년 오늘, 이 길 위에서 다시 만나요.</p>
            <div className="tmp-today-actions">
              <button type="button" className="tmp-btn" onClick={() => navigate('/thanks')}>감사 한 줄 남기기</button>
              <button type="button" className="tmp-btn-ghost" onClick={() => navigate('/bible/typing')}>말씀 필사</button>
              {reading && (
                <button
                  type="button"
                  className="tmp-btn-ghost"
                  onClick={() => navigate(`/bible/${reading.book_number}/${reading.chapter}`)}
                >
                  이어 읽기
                </button>
              )}
            </div>
          </div>
        </li>
      </ol>

      {echo && <div className="tmp-echo">{echo}</div>}
    </div>
  )
}
