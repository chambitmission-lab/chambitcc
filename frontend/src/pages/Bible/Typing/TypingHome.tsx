import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import { Feather } from '../../../components/icons/phosphor'
import { useBibleBooks } from '../../../hooks/useBible'
import { useBookReadingProgress, useReadingProgress } from '../../../hooks/useBibleReading'
import { useBookTyping, useTypingStats, useTypingWeekly } from '../../../hooks/useBibleTyping'
import { useTitles } from '../../../hooks/useTitles'
import { TitleGlyph } from '../../../components/titles/TitleGlyph'
import { tokenStore } from '../../../utils/tokenStore'
import type { TypingMode } from '../../../api/bibleTyping'
import { sessionPath, useIgnorePunct, useTypingMode } from './typingPrefs'
import './typing.css'

// 처음 오는 성도에게 건넬 짧고 친숙한 장들
const QUICK_PICKS: { book: number; chapter: number; label: string }[] = [
  { book: 19, chapter: 23, label: '시편 23편' },
  { book: 19, chapter: 1, label: '시편 1편' },
  { book: 46, chapter: 13, label: '고린도전서 13장' },
  { book: 40, chapter: 5, label: '마태복음 5장' },
  { book: 43, chapter: 1, label: '요한복음 1장' },
  { book: 45, chapter: 8, label: '로마서 8장' },
]

const MODES: { key: TypingMode; title: string; desc: string; icon: string }[] = [
  { key: 'copy', title: '따라 쓰기', desc: '말씀을 보며 한 자 한 자', icon: 'edit_note' },
  { key: 'memorize', title: '암송 쓰기', desc: '가린 말씀을 기억으로', icon: 'visibility_off' },
]

const TypingHome = () => {
  const navigate = useNavigate()
  const loggedIn = !!tokenStore.getAccess()
  const { data: books } = useBibleBooks()
  const { data: stats } = useTypingStats()
  // 책별 전체 절 수는 읽기 진행률 응답에서 빌린다 (books[].book_id = book_number)
  const { data: reading } = useReadingProgress(loggedIn)
  const { data: weekly } = useTypingWeekly()
  const { data: titles } = useTitles(loggedIn)
  const [mode, setMode] = useTypingMode()
  const [ignorePunct, setIgnorePunct] = useIgnorePunct()
  const [testament, setTestament] = useState<'OLD' | 'NEW'>('NEW')
  const [pickedBook, setPickedBook] = useState<number | null>(null)

  const bookList = useMemo(() => (books ?? []).filter((b) => b.testament === testament), [books, testament])
  const picked = books?.find((b) => b.book_number === pickedBook) ?? null
  // 고른 책의 장별 필사 절 수 + 장별 전체 절 수(읽기 진행률 응답에서 빌림)
  const { data: bookTyping } = useBookTyping(pickedBook)
  const { data: bookReading } = useBookReadingProgress(pickedBook ?? 0, loggedIn)
  const chapterTotals = useMemo(
    () => new Map((bookReading?.chapters ?? []).map((c) => [c.chapter, c.total_verses])),
    [bookReading]
  )
  const bookName = (n: number) => books?.find((b) => b.book_number === n)?.book_name_ko ?? ''
  const bookTotals = useMemo(
    () => new Map((reading?.books ?? []).map((b) => [b.book_id, b.total_verses])),
    [reading]
  )
  /** 필사 진행 라벨 — 전체 절 수를 모르면 절 수로, 다 쓰면 '완필', 조금이라도 썼으면 최소 1% */
  const progressLabel = (n: number, total: number) => {
    if (!total) return `${n}절`
    if (n >= total) return '완필'
    return `${Math.max(1, Math.floor((n / total) * 100))}%`
  }
  const typedLabel = (bookNumber: number, n: number) => progressLabel(n, bookTotals.get(bookNumber) ?? 0)

  const typingTitles = useMemo(() => (titles?.titles ?? []).filter((t) => t.category === 'typing'), [titles])
  const earnedCount = typingTitles.filter((t) => t.earned).length

  const next = stats?.next_position
  const go = (book: number, chapter: number, verse?: number) => navigate(sessionPath(book, chapter, mode, verse))

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--home pb-bottomnav-safe">
          {/* PC 2단 — 왼쪽 시작하기, 오른쪽 함께·칭호. 모바일에선 래퍼가 display:contents 라 순서 그대로 */}
          <div className="bt-home-main">
            {/* Hero — emblem + label + title, 숫자는 브랜드 강조 */}
            <section className="bt-hero">
              <div className="bt-hero__top">
                <span className="bt-hero__emblem" aria-hidden>
                  <Feather size="1em" weight="duotone" />
                </span>
                <div>
                  <p className="bt-hero__label">말씀 필사</p>
                  <h1 className="bt-hero__title">손끝으로 새기는 말씀</h1>
                </div>
              </div>
              <p className="bt-hero__desc">한 절씩 따라 쓰면 그 절이 읽음으로 기록돼요. 쓰는 동안 말씀이 천천히 마음에 머뭅니다.</p>
              <dl className="bt-hero__stats">
                <div>
                  <dt>필사한 절</dt>
                  <dd className="brand-text-gradient">{(stats?.total_verses ?? 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>최고 타수</dt>
                  <dd className="brand-text-gradient">{stats?.best_cpm ?? 0}</dd>
                </div>
                <div>
                  <dt>연속</dt>
                  <dd className="brand-text-gradient">{stats?.current_streak ?? 0}일</dd>
                </div>
              </dl>
              {!loggedIn && (
                <p className="bt-note bt-note--hero">
                  <Link to="/login">로그인</Link>하면 필사 기록·읽음 처리·칭호가 저장돼요. 로그인 없이도 연습은 할 수 있어요.
                </p>
              )}
            </section>

            {next && (
              <button type="button" className="bt-card bt-continue" onClick={() => go(next.book_number, next.chapter, next.verse)}>
                <span className="material-icons-round bt-continue__icon" aria-hidden>
                  history_edu
                </span>
                <span className="bt-continue__body">
                  <span className="bt-continue__eyebrow">이어서 쓰기</span>
                  <span className="bt-continue__title">
                    {bookName(next.book_number)} {next.chapter}장 {next.verse}절부터
                  </span>
                </span>
                <span className="material-icons-round" aria-hidden>
                  chevron_right
                </span>
              </button>
            )}

            <section className="bt-section">
              <h2 className="bt-section__title">어떻게 쓸까요?</h2>
              <div className="bt-modes">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className={`bt-mode${mode === m.key ? ' is-on' : ''}`}
                    onClick={() => setMode(m.key)}
                    aria-pressed={mode === m.key}
                  >
                    <span className="material-icons-round bt-mode__icon" aria-hidden>
                      {m.icon}
                    </span>
                    <span className="bt-mode__title">{m.title}</span>
                    <span className="bt-mode__desc">{m.desc}</span>
                  </button>
                ))}
                <button type="button" className="bt-mode bt-mode--sprint" onClick={() => navigate('/bible/typing/sprint')}>
                  <span className="material-icons-round bt-mode__icon" aria-hidden>
                    timer
                  </span>
                  <span className="bt-mode__title">말씀 스프린트</span>
                  <span className="bt-mode__desc">익숙한 5절 시간 경주</span>
                </button>
              </div>
              <label className="bt-toggle">
                <input type="checkbox" checked={ignorePunct} onChange={(e) => setIgnorePunct(e.target.checked)} />
                <span>문장부호 무시 — 쉼표·마침표는 치지 않아도 돼요</span>
              </label>
            </section>

            <section className="bt-section">
              <h2 className="bt-section__title">어디를 쓸까요?</h2>
              <div className="bt-quick">
                {QUICK_PICKS.map((q) => (
                  <button key={q.label} type="button" className="bt-chip" onClick={() => go(q.book, q.chapter)}>
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="bt-card bt-picker">
                <div className="bt-seg" role="tablist" aria-label="구약·신약">
                  {(['OLD', 'NEW'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={testament === t}
                      className={testament === t ? 'is-on' : ''}
                      onClick={() => {
                        setTestament(t)
                        setPickedBook(null)
                      }}
                    >
                      {t === 'OLD' ? '구약' : '신약'}
                    </button>
                  ))}
                </div>

                {picked ? (
                  <>
                    <div className="bt-picker__head">
                      <button type="button" className="bt-icon-btn" onClick={() => setPickedBook(null)} aria-label="책 다시 고르기">
                        <span className="material-icons-round">arrow_back</span>
                      </button>
                      <span className="bt-picker__book">{picked.book_name_ko}</span>
                      <span className="bt-picker__meta">
                        {stats?.books[String(picked.book_number)] ? `${stats.books[String(picked.book_number)]}절 필사` : '장을 고르세요'}
                      </span>
                    </div>
                    <div className="bt-chapters">
                      {Array.from({ length: picked.chapter_count }, (_, i) => i + 1).map((c) => {
                        const n = bookTyping?.[String(c)] ?? 0
                        const label = n > 0 ? progressLabel(n, chapterTotals.get(c) ?? 0) : null
                        return (
                          <button
                            key={c}
                            type="button"
                            className={`bt-chapter${label === '완필' ? ' is-done' : ''}`}
                            onClick={() => go(picked.book_number, c)}
                          >
                            {c}
                            {label && (
                              <span className="bt-book__pct" aria-label={`${n}절 필사`}>
                                {label}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="bt-books">
                    {bookList.map((b) => {
                      const n = stats?.books[String(b.book_number)] ?? 0
                      const label = n > 0 ? typedLabel(b.book_number, n) : null
                      return (
                        <button
                          key={b.book_number}
                          type="button"
                          className={`bt-book${n ? ' has-typed' : ''}${label === '완필' ? ' is-done' : ''}`}
                          onClick={() => setPickedBook(b.book_number)}
                        >
                          <span className="bt-book__name">{b.book_name_ko}</span>
                          {label && (
                            <span className="bt-book__pct" aria-label={`${n}절 필사`}>
                              {label}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="bt-home-side">
            {loggedIn && weekly && (
              <section className="bt-section">
                <h2 className="bt-section__title">이번 주 우리 교회</h2>
                <div className="bt-card bt-weekly">
                  <p className="bt-weekly__lead">
                    <b className="brand-text-gradient">{weekly.church_verses.toLocaleString()}</b>절을
                    <span> {weekly.participants}명이 함께 필사했어요</span>
                  </p>
                  {weekly.items.length > 0 ? (
                    <ol className="bt-board">
                      {weekly.items.map((it) => (
                        <li key={it.user_id} className={it.is_me ? 'is-me' : ''}>
                          <span className="bt-board__rank">{it.rank}</span>
                          {it.avatar_url ? (
                            <img className="bt-board__avatar" src={it.avatar_url} alt="" loading="lazy" />
                          ) : (
                            <span className="bt-board__avatar bt-board__avatar--initial" aria-hidden>
                              {it.name.slice(0, 1)}
                            </span>
                          )}
                          <span className="bt-board__name">{it.name}</span>
                          <span className="bt-board__value">
                            <b>{it.verses}</b>절
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="bt-empty">이번 주 첫 필사의 주인공이 되어 보세요.</p>
                  )}
                  {weekly.my_rank && weekly.my_rank > weekly.items.length && (
                    <p className="bt-weekly__me">
                      나는 {weekly.my_rank}번째 · {weekly.my_verses}절
                    </p>
                  )}
                </div>
              </section>
            )}

            {loggedIn && typingTitles.length > 0 && (
              <section className="bt-section">
                <h2 className="bt-section__title">
                  필사 칭호{' '}
                  <span className="bt-section__count">
                    {earnedCount}/{typingTitles.length}
                  </span>
                </h2>
                <ul className="bt-titles">
                  {typingTitles.map((t) => {
                    const pct = t.progress
                      ? Math.min(100, Math.round((t.progress.current / Math.max(1, t.progress.target)) * 100))
                      : t.earned
                        ? 100
                        : 0
                    return (
                      <li key={t.key} className={`bt-title${t.earned ? ' is-earned' : ''}`}>
                        <span className="bt-title__icon" aria-hidden>
                          <TitleGlyph titleKey={t.key} fallback={t.icon} />
                        </span>
                        <span className="bt-title__body">
                          <span className="bt-title__name">{t.name}</span>
                          <span className="bt-title__hint">{t.earned ? '획득' : t.hint}</span>
                          {!t.earned && t.progress && (
                            <span className="bt-title__bar">
                              <span style={{ width: `${pct}%` }} />
                            </span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <Link to="/garden" className="bt-link">
                  칭호 도감 전체 보기
                </Link>
              </section>
            )}
          </div>
        </main>
      </div>
      <BibleBottomNav active="typing" />
    </div>
  )
}

export default TypingHome
