// 걸어온 길 — /today '작년 오늘의 나' 탭. 1년 전 → 6개월 전 → 한 달 전 → 오늘을 한 줄 길 위의 정거장으로 놓는다.
// 정거장마다 그날 하루(읽은 장·밑줄·누군가를 위한 기도·그 주 주일 말씀)를 꼬리표로 붙이고,
// 기록이 없는 시점도 빈 정거장으로 남긴다. 길 끝 '오늘'은 내년 오늘 다시 만날 기록을 남기는 자리.
// 시안: /#/dev/today-memory?v=b. path·day 는 옛 백엔드에 없을 수 있다 — 없으면 그 조각만 빠진다.
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MemoryDay, MemoryPath as PathData, TodayChurch, TodayMemory } from '../../api/todayChurch'
import { useTheme } from '../../contexts/ThemeContext'
import { useThemeArt } from '../../hooks/useThemeArt'
import { heroSrc, pickArt, type HeroArt, type HeroArtSet, type Pt, type StationOffset } from './memoryPathArt'
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

const STATION_LABEL: Record<StationOffset, string> = { year: '1년 전', half: '6개월 전', month: '한 달 전' }
const MOTES: Pt[] = [[300, 760], [520, 830], [700, 780], [860, 900], [980, 700], [1380, 760], [1440, 860], [240, 900], [620, 940], [1300, 640]]

/** 꼭짓점을 부드러운 곡선(Catmull-Rom → 베지어)으로 */
const smoothPath = (p: Pt[]) =>
  p.slice(1).reduce((d, p2, i) => {
    const p0 = p[Math.max(i - 1, 0)]
    const p1 = p[i]
    const p3 = p[Math.min(i + 2, p.length - 1)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6].map(Math.round)
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6].map(Math.round)
    return `${d} C${c1.join(' ')} ${c2.join(' ')} ${p2.join(' ')}`
  }, `M${p[0].join(' ')}`)

const litOffsets = (memories: TodayMemory[]) =>
  new Set(memories.map((m) => m.offset).filter((o): o is StationOffset => o !== 'first'))

const chipWidth = (label: string) => 34 + label.length * 27

/** 그림 한 장 + 그 위 빛. 라이트·다크가 각자 한 벌씩 있고 테마 클래스로 하나만 보인다.
 *  숨은 쪽 <img> 도 그냥 두면 바로 내려받는다(다크 그림 220~270KB) — 안 보이는 쪽은 lazy 로 두어
 *  요청이 나가지 않게 하고, 반대 테마 파일은 useThemeArt 가 유휴 시간에 챙긴다 */
const HeroLayer = ({ art, theme, lit, active }: { art: HeroArt; theme: 'light' | 'dark'; lit: Set<StationOffset>; active: boolean }) => {
  const glow = `tmp-glow-${theme}`
  const sun = `tmp-sun-${theme}`
  return (
    <div className={theme === 'light' ? 'tmp-hero-layer dark:hidden' : 'tmp-hero-layer hidden dark:block'}>
      <img src={heroSrc(art)} alt="" decoding="async" loading={active ? 'eager' : 'lazy'} />
      <svg viewBox="0 0 1536 1024" className="tmp-fx">
        <defs>
          <radialGradient id={glow}>
            <stop offset="0" stopColor="#fffbe6" />
            <stop offset="0.28" stopColor="#ffd27a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffc35c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={sun}>
            <stop offset="0" stopColor="#fff6dc" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffe3a6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 라이트: 해가 천천히 숨 쉬고 빛가루가 올라간다 / 다크: 풀숲 반딧불 */}
        {art.sun && <circle className="tmp-fx-sun" cx={art.sun[0]} cy={art.sun[1]} r="190" fill={`url(#${sun})`} />}
        {MOTES.map(([x, y], i) => (
          <circle
            key={i}
            className="tmp-fx-mote"
            cx={x}
            cy={y}
            r={i % 3 ? 3.5 : 5}
            style={{ animationDelay: `${-i * 1.1}s`, animationDuration: `${8 + (i % 4) * 1.5}s` }}
          />
        ))}

        {(Object.keys(STATION_LABEL) as StationOffset[]).map((offset) => {
          const on = lit.has(offset)
          const [x, y] = art.stations[offset]
          const label = STATION_LABEL[offset]
          const w = chipWidth(label)
          // 1년 전 돌무더기는 지평선이라 칩을 위에 달면 히어로 글과 겹친다 — 아래로
          const [cx, cy] = (art.chipBelow ?? ['year']).includes(offset) ? [x + 24, y + 12] : [x + 32, y - 44]
          return (
            <g key={offset} className={on ? 'tmp-fx-stop is-lit' : 'tmp-fx-stop'}>
              {on && <circle className="tmp-fx-pulse" cx={x} cy={y - 8} r="46" fill={`url(#${glow})`} />}
              <g className="tmp-fx-chip" style={art.chipHidden?.includes(offset) ? { display: 'none' } : undefined}>
                <rect x={cx} y={cy} width={w} height="44" rx="22" />
                <text x={cx + w / 2} y={cy + 30} textAnchor="middle">{label}</text>
              </g>
            </g>
          )
        })}
        <g className="tmp-fx-stop is-lit">
          <circle className="tmp-fx-pulse" cx={art.today[0]} cy={art.today[1]} r="80" fill={`url(#${glow})`} />
        </g>

        <g className="tmp-fx-travel" opacity="0">
          <circle r="34" fill={`url(#${glow})`} />
          <circle r="7" fill="#fffbe6" />
          <animateMotion dur="6s" begin="indefinite" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.3 1" path={smoothPath(art.route)} />
          <animate attributeName="opacity" dur="6.8s" begin="indefinite" fill="freeze" values="0;1;1;0" keyTimes="0;0.08;0.85;1" />
        </g>
      </svg>
      {art.scrim && <div className="tmp-hero-scrim" />}
    </div>
  )
}

/** 걸어온 길 그림 + 기록 있는 정거장만 불 켜기 + 들어올 때 빛 한 점이 길을 되짚어 내려온다(1회) */
const HeroScene = ({ art, lit }: { art: { light: HeroArt; dark: HeroArt }; lit: Set<StationOffset> }) => {
  const stage = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  // 지금 테마 그림 먼저, 반대 테마는 유휴 시간에 — 테마 토글 직전 선요청(ThemeContext)에도 이 쌍이 잡힌다
  const pair = useMemo(() => ({ light: heroSrc(art.light), dark: heroSrc(art.dark) }), [art])
  useThemeArt(pair)

  // 3:2 무대를 cover 로 맞추고 --hx/--hy 비율로 크롭 위치를 잡는다 (img·SVG 가 같은 좌표를 쓰도록).
  // 컨테이너 단위(cqh)는 이 그리드에서 0 으로 잡혀 JS 로 잰다.
  useLayoutEffect(() => {
    const el = stage.current
    const host = el?.parentElement
    if (!el || !host) return
    const fit = () => {
      const W = host.clientWidth
      const H = host.clientHeight
      const cs = getComputedStyle(host)
      const hx = parseFloat(cs.getPropertyValue('--hx')) || 1
      const hy = parseFloat(cs.getPropertyValue('--hy')) || 0.5
      const sw = Math.max(W, H * 1.5)
      const sh = sw / 1.5
      Object.assign(el.style, { width: `${sw}px`, height: `${sh}px`, left: `${(W - sw) * hx}px`, top: `${(H - sh) * hy}px` })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(() => {
      stage.current?.querySelectorAll('.tmp-fx-travel animate, .tmp-fx-travel animateMotion').forEach((a) => {
        try {
          ;(a as SVGAnimationElement).beginElement()
        } catch {
          /* SMIL 미지원 — 빛 없이 정지 화면 */
        }
      })
    }, 700)
    return () => window.clearTimeout(t)
  }, [art])

  return (
    <div ref={stage} className="tmp-hero-stage" aria-hidden>
      <HeroLayer art={art.light} theme="light" lit={lit} active={theme === 'light'} />
      <HeroLayer art={art.dark} theme="dark" lit={lit} active={theme === 'dark'} />
    </div>
  )
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
  /** 히어로 그림 묶음 — 기본 v2(2026-11-17 채택), 시안 화면에서 v1 비교 */
  artSet?: HeroArtSet
}

export const MemoryPath = ({ data, echo, artSet = 'v2' }: MemoryPathProps) => {
  const navigate = useNavigate()
  const { memories, path } = data
  const stops = buildStops(memories, path)
  const [line1, line2] = heroTitle(path?.since)
  const reading = path?.now_reading

  return (
    <div className="tmp">
      <section className="tmp-card tmp-hero">
        <HeroScene art={pickArt(path?.since, data.date, artSet)} lit={litOffsets(memories)} />
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
