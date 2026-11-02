/**
 * 성경 지도 — 66권을 10개 장르 "메달"로 묶어 보여준다 (2026-11 E4 개편).
 *
 * 66칸 농도 격자는 진행률이 낮을 때 화면이 통째로 회색이라 초라해 보였다.
 * 장르 단위(율법서·시가서…)로 묶으면 "소선지서 12권 완주" 같은 중간 목표가 생기고,
 * 다 읽은 장르는 금메달이 된다 — 칭호 메달 도감(/garden)과 같은 말투.
 *
 * 구성: 다음 목표 카드(가장 적게 남은 장르) → 메달 5×2 → 고른 장르의 책 칩.
 * 칩을 누르면 기존처럼 그 책으로 바로 이동한다.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'
import { bookAbbrev } from './bibleBookAbbrev'
import { aggregateRange, pctLabel, progressLevel, type BookInfoMap, type RangeAggregate } from './readingProgressInfo'

interface BibleProgressMapProps {
  books: BibleBook[] | undefined
  infoMap: BookInfoMap
  onBookSelect: (book: BibleBook) => void
  /** 가장 최근에 펼친 책 — 칩에 금빛 점, 처음 펼쳐 둘 장르를 정한다 */
  currentBookNumber?: number
}

type Testament = 'ot' | 'nt'
type GenreId =
  | 'law' | 'history' | 'poetry' | 'major' | 'minor'
  | 'gospel' | 'acts' | 'pauline' | 'general' | 'prophecy'

interface Genre {
  id: GenreId
  testament: Testament
  min: number
  max: number
  ko: string
  en: string
}

const GENRES: Genre[] = [
  { id: 'law', testament: 'ot', min: 1, max: 5, ko: '율법서', en: 'Law' },
  { id: 'history', testament: 'ot', min: 6, max: 17, ko: '역사서', en: 'History' },
  { id: 'poetry', testament: 'ot', min: 18, max: 22, ko: '시가서', en: 'Poetry' },
  { id: 'major', testament: 'ot', min: 23, max: 27, ko: '대선지서', en: 'Major Prophets' },
  { id: 'minor', testament: 'ot', min: 28, max: 39, ko: '소선지서', en: 'Minor Prophets' },
  { id: 'gospel', testament: 'nt', min: 40, max: 43, ko: '복음서', en: 'Gospels' },
  { id: 'acts', testament: 'nt', min: 44, max: 44, ko: '교회 역사', en: 'Acts' },
  { id: 'pauline', testament: 'nt', min: 45, max: 57, ko: '바울서신', en: 'Pauline Letters' },
  { id: 'general', testament: 'nt', min: 58, max: 65, ko: '공동서신', en: 'General Letters' },
  { id: 'prophecy', testament: 'nt', min: 66, max: 66, ko: '예언서', en: 'Revelation' },
]

const genreOf = (bookNumber: number): Genre | undefined =>
  GENRES.find(g => bookNumber >= g.min && bookNumber <= g.max)

/** 장르 아이콘 — 선화 1.8 스트로크, 메달 색을 currentColor로 받는다 */
const GENRE_ICON: Record<GenreId, string> = {
  law: 'M6 4h5v16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5zM7 9h2M7 13h2M16 9h1M16 13h1', // 돌판
  history: 'M4 17l-1-9 5 4 4-7 4 7 5-4-1 9zM4 20h16', // 왕관
  poetry: 'M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', // 음표
  major: 'M7 4h10v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1h10M7 4a2 2 0 0 0-2 2v11M17 4a2 2 0 0 1 2 2v1h-2', // 두루마리
  minor: 'M12 3c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-4 0-7zM9 20h6', // 불꽃
  gospel: 'M12 3v18M7 8h10', // 십자가
  acts: 'M4 21V11l8-6 8 6v10M10 21v-5h4v5M12 2v4M10 4h4', // 교회
  pauline: 'M3 6h18v12H3zM3 7l9 6 9-6', // 편지
  general: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 11a2.5 2.5 0 1 0 0-5M21 20a5 5 0 0 0-4-5', // 사람들
  prophecy: 'M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z', // 빛나는 별
}

const GenreIcon = ({ id }: { id: GenreId }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={GENRE_ICON[id]} />
  </svg>
)

/** 메달 링 — 0%는 점선 트랙만, 진행 중은 구약/신약 색 호, 완주는 금빛 */
const MedalRing = ({ rate }: { rate: number }) => {
  const size = 64
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  // 0.4% 같은 값도 점 하나는 보이게
  const len = rate > 0 ? Math.max((c * rate) / 100, 3) : 0
  return (
    <svg className="bible-map__ring" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        className="bible-map__ring-track"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        strokeDasharray={rate > 0 ? undefined : '3 4'}
      />
      {rate > 0 && (
        <circle
          className="bible-map__ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={`${len} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  )
}

interface GenreView {
  genre: Genre
  agg: RangeAggregate
  books: BibleBook[]
  done: boolean
  started: boolean
}

const BibleProgressMap = ({ books, infoMap, onBookSelect, currentBookNumber }: BibleProgressMapProps) => {
  const { language } = useLanguage()
  const en = language === 'en'

  const t = en
    ? {
        ot: 'Old Testament',
        nt: 'New Testament',
        chapterUnit: 'ch',
        bookUnit: (n: number) => `${n} book${n === 1 ? '' : 's'}`,
        medals: (n: number) => `${n} / 10 medals`,
        goalLabel: 'Next goal',
        goal: (what: string, genre: string): ReactNode => (
          <>
            {what} to complete <b>{genre}</b>
          </>
        ),
        goalWhat: (n: number, ch: number, single?: string) => (single ? `${single} · ${ch} ch` : `${n} books · ${ch} ch`),
        go: 'Read',
        complete: 'Completed',
        left: (name: string, n: number) => `${name} · ${n} ch left`,
        nextUp: (name: string) => `Next: ${name}`,
        startWith: (name: string) => `Start with ${name}`,
        hint: 'Tap a book to open it',
        none: 'Not read',
        done: 'Complete',
      }
    : {
        ot: '구약',
        nt: '신약',
        chapterUnit: '장',
        bookUnit: (n: number) => `${n}권`,
        medals: (n: number) => `모은 메달 ${n} / 10`,
        goalLabel: '다음 목표',
        goal: (what: string, genre: string): ReactNode => (
          <>
            {what}만 읽으면 <b>{genre} 완주</b>
          </>
        ),
        goalWhat: (n: number, ch: number, single?: string) => (single ? `${single} ${ch}장` : `${n}권 ${ch}장`),
        go: '읽기',
        complete: '완주했어요',
        left: (name: string, n: number) => `${name} ${n}장 남음`,
        nextUp: (name: string) => `다음은 ${name}`,
        startWith: (name: string) => `${name}부터 시작해요`,
        hint: '책을 누르면 바로 이동해요',
        none: '안 읽음',
        done: '완독',
      }

  const nameOf = (book: BibleBook) => (en && book.book_name_en ? book.book_name_en : book.book_name_ko)
  const rateOf = (book: BibleBook) => infoMap.get(book.book_number)?.rate ?? 0
  const leftOf = (book: BibleBook) => {
    const info = infoMap.get(book.book_number)
    if (!info || info.readChapters === null) return null
    return Math.max(0, info.totalChapters - info.readChapters)
  }

  const views = useMemo<GenreView[]>(
    () =>
      GENRES.map(genre => {
        const agg = aggregateRange(books, infoMap, genre.min, genre.max)
        const genreBooks = (books ?? []).filter(b => b.book_number >= genre.min && b.book_number <= genre.max)
        return { genre, agg, books: genreBooks, done: agg.rate >= 100, started: agg.rate > 0 }
      }),
    [books, infoMap]
  )

  // 처음 펼칠 장르 — 지금 읽는 책의 장르, 없으면 읽기 시작한 첫 장르, 그것도 없으면 율법서
  const defaultGenre: GenreId =
    (currentBookNumber !== undefined && genreOf(currentBookNumber)?.id) ||
    views.find(v => v.started && !v.done)?.genre.id ||
    'law'
  const [picked, setPicked] = useState<GenreId | null>(null)
  const activeId = picked ?? defaultGenre
  const active = views.find(v => v.genre.id === activeId) ?? views[0]

  // 장르 안에서 갈 곳 — 읽는 중인 책 > 첫 미완독 책
  const nextBookIn = (v: GenreView) =>
    v.books.find(b => rateOf(b) > 0 && rateOf(b) < 100) ?? v.books.find(b => rateOf(b) < 100)

  const statusLine = (v: GenreView): string => {
    if (v.done) return t.complete
    const reading = v.books.find(b => rateOf(b) > 0 && rateOf(b) < 100)
    const left = reading ? leftOf(reading) : null
    if (reading && left !== null) return t.left(nameOf(reading), left)
    const next = nextBookIn(v)
    if (!next) return t.complete
    return v.started ? t.nextUp(nameOf(next)) : t.startWith(nameOf(next))
  }

  // 다음 목표 — 남은 장이 가장 적은 미완주 장르. 장 집계가 없는 구버전 응답이면 숨긴다
  const goal = useMemo(() => {
    const candidates = views
      .filter(v => !v.done && v.agg.hasChapterData && v.books.length > 0)
      .map(v => ({ v, left: v.agg.totalChapters - v.agg.readChapters }))
      .sort((a, b) => a.left - b.left)
    return candidates[0]
  }, [views])

  const medalCount = views.filter(v => v.done).length

  const renderGoal = () => {
    if (!goal) return null
    const { v, left } = goal
    const remaining = v.books.filter(b => rateOf(b) < 100)
    const target = nextBookIn(v)
    if (!target) return null
    const genreName = en ? v.genre.en : v.genre.ko
    const what = t.goalWhat(remaining.length, left, remaining.length === 1 ? nameOf(remaining[0]) : undefined)
    return (
      <div className="bible-map__goal" data-testament={v.genre.testament}>
        <span className="bible-map__goal-icon">
          <GenreIcon id={v.genre.id} />
        </span>
        <span className="bible-map__goal-text">
          <small>{t.goalLabel}</small>
          <span>{t.goal(what, genreName)}</span>
        </span>
        <button type="button" className="bible-map__goal-btn" onClick={() => onBookSelect(target)}>
          {t.go}
        </button>
      </div>
    )
  }

  const renderSection = (testament: Testament) => {
    const agg = aggregateRange(books, infoMap, testament === 'ot' ? 1 : 40, testament === 'ot' ? 39 : 66)
    return (
      <div className="bible-map__section" data-testament={testament}>
        <div className="bible-map__section-head">
          <i aria-hidden="true" />
          <span>{testament === 'ot' ? t.ot : t.nt}</span>
          <em>
            {agg.hasChapterData
              ? `${agg.readChapters.toLocaleString()} / ${agg.totalChapters.toLocaleString()}${t.chapterUnit}`
              : `${pctLabel(agg.rate)}%`}
          </em>
        </div>
        <div className="bible-map__medals" role="group" aria-label={testament === 'ot' ? t.ot : t.nt}>
          {views
            .filter(v => v.genre.testament === testament)
            .map((v, index) => {
              const name = en ? v.genre.en : v.genre.ko
              const state = v.done ? 'done' : v.started ? 'started' : 'idle'
              return (
                <button
                  key={v.genre.id}
                  type="button"
                  className="bible-map__medal"
                  data-state={state}
                  data-testament={v.genre.testament}
                  aria-pressed={v.genre.id === activeId}
                  aria-label={`${name} ${pctLabel(v.agg.rate)}%`}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => setPicked(v.genre.id)}
                >
                  <span className="bible-map__medal-face">
                    <MedalRing rate={v.agg.rate} />
                    <span className="bible-map__medal-core">
                      <GenreIcon id={v.genre.id} />
                    </span>
                  </span>
                  <span className="bible-map__medal-name">{name}</span>
                  <span className="bible-map__medal-meta">
                    {pctLabel(v.agg.rate)}% · {t.bookUnit(v.books.length)}
                  </span>
                </button>
              )
            })}
        </div>
      </div>
    )
  }

  const activeName = en ? active.genre.en : active.genre.ko

  return (
    <div className="bible-map">
      <div className="bible-map__summary">{t.medals(medalCount)}</div>

      {renderGoal()}

      {renderSection('ot')}
      {renderSection('nt')}

      {/* 고른 장르의 책 — 칩을 누르면 그 책으로 이동 */}
      <section className="bible-map__sheet" data-testament={active.genre.testament}>
        <div className="bible-map__sheet-head">
          <strong>{activeName}</strong>
          <span>
            {active.agg.hasChapterData &&
              `${active.agg.readChapters}/${active.agg.totalChapters}${t.chapterUnit} · `}
            {statusLine(active)}
          </span>
        </div>
        <div className="bible-map__chips" key={active.genre.id}>
          {active.books.map((book, index) => {
            const rate = rateOf(book)
            const name = nameOf(book)
            const isCurrent = book.book_number === currentBookNumber
            return (
              <button
                key={book.id}
                type="button"
                className="bible-map__chip"
                data-level={progressLevel(rate)}
                data-current={isCurrent || undefined}
                style={{ animationDelay: `${Math.min(index * 15, 120)}ms` }}
                // 칩이 작아 수치를 못 넣으므로 접근성 라벨에 정확한 값을 싣는다
                aria-label={`${name} ${Math.round(rate)}%`}
                title={`${name} · ${Math.round(rate)}%`}
                onClick={() => onBookSelect(book)}
              >
                {bookAbbrev(book.book_number, language)}
              </button>
            )
          })}
        </div>
        <div className="bible-map__foot">
          <div className="bible-map__legend">
            <span className="bible-map__legend-text">{t.none}</span>
            {[0, 1, 2, 3, 4].map(level => (
              <span key={level} className="bible-map__legend-swatch" data-level={level} />
            ))}
            <span className="bible-map__legend-text">{t.done}</span>
          </div>
          <p className="bible-map__hint">{t.hint}</p>
        </div>
      </section>
    </div>
  )
}

export default BibleProgressMap
