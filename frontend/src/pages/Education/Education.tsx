// 교육과 훈련 (/education) — 2026-10 '클래스 카탈로그' 개편 (B안)
//
// 레거시 홈페이지의 "교육과 훈련 > 주일학교 > 영유아부 …" 3단 메뉴 + 이미지 한 장을
// 데이터로 승격한 화면. 글 위주 카드 나열이던 것을 세 덩어리로 다시 짰다:
//   1) 벤토 타일 — 분야(카테고리)를 한눈에. 첫 타일은 기존 히어로 삽화(양들의 교실)가 무대.
//   2) 이번 주 시간표 — "언제 가면 되지?"에 바로 답한다. 오늘 열리는 모임·지금 진행 중.
//   3) 모든 과정 — N주 표지가 있는 강의 카드. 누르면 하단 시트에 시간·담당·장소·선생님.
// 칩·타일은 ?cat= 필터(단일 소스)라 새로고침·딥링크(/education?cat=youth)가 그대로 유지된다.
// 시간표·다음 모임은 meeting_time/description 문장을 읽어 계산한다(eduSchedule.ts) — 읽히지
// 않는 문장은 시간표에 올리지 않을 뿐 지어내지 않는다. 빈 값('') = 미확인 → 줄을 숨긴다.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type React from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAboutContent } from '../../hooks/useAboutContent'
import { useEducationTree } from '../../hooks/useEducation'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { EditableText } from '../../components/AboutEditor'
import { categoryText, programText } from '../../types/education'
import type { EducationCategory, EducationProgram } from '../../types/education'
import { can } from '../../utils/access'
import './education.css'
import { EduGlyph, PencilIcon, SproutIcon } from './EduIcons'
import {
  DAY_SHORT_EN,
  DAY_SHORT_KO,
  cleanDescription,
  isLive,
  isOver,
  nextSession,
  programSessions,
  programStaffLine,
  programStage,
  programTeachers,
  programWeeks,
  stripStage,
  whenLabel,
} from './eduSchedule'
import type { EduSession } from './eduSchedule'

type Lang = 'ko' | 'en'

// 분야별 색 — 부서는 DB 기반이라 고정 키 대신 순서로 블루 패밀리(토스 블루 톤 안에서만)를 순환한다.
// 칩·벤토 타일·과정 카드 표지·시간표 줄이 같은 톤을 써서 "이 카드는 어느 분야"가 색으로 읽힌다.
const TONES: Array<[string, string, string]> = [
  ['#4593fc', '#3182f6', '49, 130, 246'], // brand blue
  ['#38bdf8', '#0ea5e9', '56, 189, 248'], // sky
  ['#22d3ee', '#0891b2', '34, 211, 238'], // cyan
  ['#818cf8', '#4f46e5', '129, 140, 248'], // indigo
  ['#60a5fa', '#2563eb', '96, 165, 250'], // light blue
  ['#2dd4bf', '#0d9488', '45, 212, 191'], // teal
  ['#a78bfa', '#6d28d9', '167, 139, 250'], // violet
]
const toneVars = (i: number) => {
  const [a, b, rgb] = TONES[((i % TONES.length) + TONES.length) % TONES.length]
  return { '--chip-a': a, '--chip-b': b, '--chip-rgb': rgb } as React.CSSProperties
}

// 주일학교·청년부처럼 '부서'로 부르는 분야 — 나머지는 '과정'
const DEPARTMENT_KEYS = new Set(['sunday-school', 'youth'])

/** 1분마다 다시 그려 '지금 진행 중'·'오늘 N개'가 낡지 않게 */
const useNow = () => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

const Education = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const { tx } = useAboutContent()
  const { categories, isLoading } = useEducationTree()
  const isAdminUser = can('content:manage')
  const [params, setSearchParams] = useSearchParams()
  const now = useNow()
  const [openProgramId, setOpenProgramId] = useState<number | null>(null)

  const visible = useMemo(
    () => categories.filter((c) => c.programs.length > 0 || isAdminUser),
    [categories, isAdminUser],
  )
  const toneOf = useMemo(() => new Map(visible.map((c, i) => [c.id, i])), [visible])
  const categoryOf = useMemo(() => {
    const m = new Map<number, EducationCategory>()
    for (const c of visible) for (const p of c.programs) m.set(p.id, c)
    return m
  }, [visible])
  const allPrograms = useMemo(() => visible.flatMap((c) => c.programs), [visible])

  // 이번 주 시간표 — 요일별 모임 (시각순)
  const byDay = useMemo(() => {
    const map: Record<number, Array<{ program: EducationProgram; session: EduSession }>> = {}
    for (const program of allPrograms) {
      for (const session of programSessions(program)) (map[session.day] ||= []).push({ program, session })
    }
    for (const list of Object.values(map)) list.sort((a, b) => a.session.h * 60 + a.session.mi - (b.session.h * 60 + b.session.mi))
    return map
  }, [allPrograms])
  const todayCount = (byDay[now.getDay()] ?? []).length

  // ?cat= 필터 — 없거나 모르는 키면 '전체'. replace 로 바꿔 history 를 쌓지 않는다.
  const requested = params.get('cat')
  const active = visible.find((c) => c.key === requested) ?? null
  const shownCategories = active ? [active] : visible

  const chipsRef = useRef<HTMLElement | null>(null)
  const catalogRef = useRef<HTMLElement | null>(null)
  // 필터 전환 후 세로 스크롤 처리. setSearchParams(REPLACE)를 전역 ScrollRestoration 이
  // 새 이동으로 보고 페이지 맨 위로 올려 두므로, 같은 커밋의 layout effect 에서 되돌린다
  // (paint 전이라 "맨 위" 프레임이 그려지지 않는다).
  //   칩 클릭 → 누르기 전 위치 그대로 / 벤토 타일 → 카탈로그 머리를 상단에
  const pendingScrollRef = useRef<'catalog' | { y: number } | null>(null)

  useLayoutEffect(() => {
    const nav = chipsRef.current
    const pending = pendingScrollRef.current
    // 가로 칩 스트립(모바일)에서 활성 칩이 밖에 있으면 가운데로 — 칩을 직접 탭한 경우는
    // 이미 보이는 칩이라 움직이지 않는다(손가락 아래에서 칩이 미끄러지면 연달아 눌린 듯 보인다).
    const chip = nav?.querySelector<HTMLElement>('.edu-chip.is-active')
    if (nav && chip && (pending === null || pending === 'catalog')) {
      const delta = chip.getBoundingClientRect().left - nav.getBoundingClientRect().left
      nav.scrollTo({ left: nav.scrollLeft + delta - (nav.clientWidth - chip.offsetWidth) / 2 })
    }
    if (!pending) return
    pendingScrollRef.current = null
    if (pending === 'catalog') {
      // 'auto' 는 html 의 scroll-behavior:smooth 를 따라 "0 → 카탈로그" 구간이 애니메이션된다. 즉시 이동.
      catalogRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
    } else {
      // body 가 실제 스크롤러 — 둘 다에 써서 확실히 복원
      window.scrollTo({ top: pending.y, left: 0, behavior: 'instant' as ScrollBehavior })
      document.body.scrollTop = pending.y
    }
  }, [active?.key])

  const selectFilter = (key: string | null, from: 'chip' | 'tile') => {
    if (key === (active?.key ?? null)) {
      if (from === 'tile') catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    pendingScrollRef.current =
      from === 'tile'
        ? 'catalog'
        : { y: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0 }
    setSearchParams(key ? { cat: key } : {}, { replace: true })
  }

  const openProgram = openProgramId != null ? allPrograms.find((p) => p.id === openProgramId) ?? null : null
  const labels: Labels = {
    time: tx('educationTimeLabel'),
    leader: tx('educationLeaderLabel'),
    location: tx('educationLocationLabel'),
    target: tx('educationTargetLabel'),
    pending: tx('educationPendingHint'),
  }

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto min-h-screen lg:max-w-none lg:mx-0 lg:min-h-0">
          {/* Hero — 글 + 오늘의 요약 칩. 삽화는 아래 첫 벤토 타일로 옮겨 갔다 */}
          <header className="edu-hero">
            <span className="edu-hero-badge">
              <EditableText fieldKey="educationBadge" isAdmin={isAdminUser}>
                {tx('educationBadge')}
              </EditableText>
            </span>
            <h1 className="edu-hero-title">
              <EditableText fieldKey="educationHeroTitle" multiline isAdmin={isAdminUser}>
                {tx('educationHeroTitle')}
              </EditableText>
            </h1>
            <p className="edu-hero-subtitle">
              <EditableText fieldKey="educationHeroSubtitle" isAdmin={isAdminUser}>
                {tx('educationHeroSubtitle')}
              </EditableText>
            </p>

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {visible.length > 0 && (
                <>
                  <span className={`edu-pill ${todayCount > 0 ? 'is-live' : ''}`}>
                    {todayCount > 0 && <i className="edu-live-dot" aria-hidden="true" />}
                    {ko ? `오늘 열리는 모임 ${todayCount}개` : `${todayCount} meeting${todayCount === 1 ? '' : 's'} today`}
                  </span>
                  <span className="edu-pill is-quiet">
                    {ko
                      ? `${visible.length}개 분야 · ${allPrograms.length}개 과정`
                      : `${visible.length} areas · ${allPrograms.length} programs`}
                  </span>
                </>
              )}
            </div>

            {/* 연결 동선 — 예배 시간, 우리반 알림장 */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <QuickLink to="/worship" icon="clock" label={tx('educationWorshipLink')} />
              <QuickLink to="/classes" icon="note" label={tx('educationClassLink')} />
              {isAdminUser && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/education')}
                  className="inline-flex items-center gap-1 h-9 px-3.5 lg:h-11 lg:px-5 lg:text-[15px] rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] hover:bg-[var(--brand-soft)] transition-colors"
                >
                  <PencilIcon width={13} height={13} className="shrink-0" />
                  {ko ? '부서 관리' : 'Manage'}
                </button>
              )}
            </div>
          </header>

          <div className="px-4 pb-16 lg:px-0 lg:pb-4">
            {isLoading && categories.length === 0 ? (
              <Skeleton />
            ) : visible.length === 0 ? (
              <EmptyState
                title={tx('educationEmptyTitle')}
                hint={tx('educationEmptyHint')}
                isAdmin={isAdminUser}
                ko={ko}
                onGoAdmin={() => navigate('/admin/education')}
              />
            ) : (
              <>
                {/* 1) 벤토 — 분야 한눈에 */}
                <nav className="edu-bento" aria-label={ko ? '교육 분야' : 'Areas'}>
                  {visible.map((c, i) => (
                    <BentoTile
                      key={c.id}
                      category={c}
                      index={i}
                      total={visible.length}
                      language={language}
                      isAdmin={isAdminUser}
                      selected={active?.id === c.id}
                      onClick={() => selectFilter(c.key, 'tile')}
                    />
                  ))}
                </nav>

                <div className="edu-split">
                  {/* 2) 이번 주 시간표 */}
                  <section className="edu-week-col" aria-labelledby="edu-week-title">
                    <div className="edu-sec-head">
                      <h2 id="edu-week-title" className="edu-sec-title">
                        {ko ? '이번 주 시간표' : 'This week'}
                      </h2>
                      <span className="edu-sec-aside">
                        {ko ? `${now.getMonth() + 1}월` : now.toLocaleString('en', { month: 'long' })}
                      </span>
                    </div>
                    <WeekSchedule
                      now={now}
                      byDay={byDay}
                      toneOf={(p) => toneOf.get(categoryOf.get(p.id)?.id ?? -1) ?? 0}
                      language={language}
                      onOpen={setOpenProgramId}
                    />
                  </section>

                  {/* 3) 모든 과정 */}
                  <section ref={catalogRef} className="edu-catalog-col" aria-labelledby="edu-catalog-title">
                    <div className="edu-sec-head">
                      <h2 id="edu-catalog-title" className="edu-sec-title">
                        {active ? categoryText(active, 'name', language) : ko ? '모든 과정' : 'All programs'}
                      </h2>
                      <span className="edu-sec-aside">
                        {ko
                          ? `${shownCategories.reduce((n, c) => n + c.programs.length, 0)}개`
                          : shownCategories.reduce((n, c) => n + c.programs.length, 0)}
                      </span>
                    </div>

                    {visible.length > 1 && (
                      <nav ref={chipsRef} className="edu-chips" aria-label={ko ? '분야 필터' : 'Filter by area'}>
                        <button
                          type="button"
                          onClick={() => selectFilter(null, 'chip')}
                          aria-pressed={!active}
                          className={`edu-chip ${!active ? 'is-active' : ''}`}
                          style={toneVars(0)}
                        >
                          {ko ? '전체' : 'All'}
                        </button>
                        {visible.map((c, i) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectFilter(c.key, 'chip')}
                            aria-pressed={active?.key === c.key}
                            className={`edu-chip ${active?.key === c.key ? 'is-active' : ''}`}
                            style={toneVars(i)}
                          >
                            <EduGlyph emoji={c.emoji} size={15} className="shrink-0" />
                            {categoryText(c, 'name', language)}
                          </button>
                        ))}
                      </nav>
                    )}

                    <div key={active?.id ?? 'all'} className="edu-tabpane">
                      {active && <CategoryIntro category={active} language={language} isAdmin={isAdminUser} />}

                      {shownCategories.every((c) => c.programs.length === 0) ? (
                        <p className="text-[13px] lg:text-[15px] text-[var(--text-muted)] py-6 text-center">
                          {ko ? '등록된 프로그램이 없습니다' : 'No programs yet'}
                        </p>
                      ) : (
                        <div className="edu-catalog">
                          {shownCategories.flatMap((c) =>
                            c.programs.map((p) => (
                              <CourseCard
                                key={p.id}
                                program={p}
                                category={c}
                                tone={toneOf.get(c.id) ?? 0}
                                now={now}
                                language={language}
                                isAdmin={isAdminUser}
                                onOpen={() => setOpenProgramId(p.id)}
                              />
                            )),
                          )}
                        </div>
                      )}

                      {active && categoryText(active, 'verse_text', language) && (
                        <blockquote className="edu-verse mt-4">
                          <p className="text-[14px] lg:text-[17px] leading-[1.75] text-ink-strong">
                            {categoryText(active, 'verse_text', language)}
                          </p>
                          {categoryText(active, 'verse_ref', language) && (
                            <cite className="block mt-1.5 text-[12px] lg:text-[14.5px] not-italic font-semibold text-brand">
                              {categoryText(active, 'verse_ref', language)}
                            </cite>
                          )}
                        </blockquote>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {openProgram && (
        <ProgramSheet
          program={openProgram}
          category={categoryOf.get(openProgram.id) ?? null}
          tone={toneOf.get(categoryOf.get(openProgram.id)?.id ?? -1) ?? 0}
          now={now}
          language={language}
          labels={labels}
          onClose={() => setOpenProgramId(null)}
        />
      )}
    </div>
  )
}

// ── 벤토 타일 ─────────────────────────────────────────
// 첫 타일은 기존 히어로 삽화(양들의 교실)가 무대 — 위쪽은 카드색 페이드(글자 자리), 바닥에 교실.
// 개수가 DB 에 따라 바뀌므로 빈칸이 생기지 않게 span 을 계산한다.
//   모바일(2열): 첫 타일 2칸, 나머지가 홀수면 마지막 2칸
//   PC(4열·첫 타일 2×2): 첫 타일 옆 2×2 자리를 먼저 채우고, 그 아래 줄은 4칸 단위
const tileSpanClass = (index: number, total: number) => {
  if (index === 0) return total === 1 ? 'is-art is-solo' : 'is-art'
  const rest = total - 1
  const pos = index - 1 // 0-based among rest
  const cls: string[] = []
  if (rest % 2 === 1 && pos === rest - 1) cls.push('m-wide')
  if (rest <= 4) {
    // 첫 타일 옆 2열×2행 자리
    if (rest === 1) cls.push('d-side-full')
    else if (rest === 2) cls.push('d-wide')
    else if (rest === 3 && pos === 2) cls.push('d-wide')
  } else if (pos >= 4) {
    const tail = rest - 4
    const lastRow = tail % 4
    const firstOfLastRow = 4 + tail - (lastRow || 4)
    if (pos >= firstOfLastRow && lastRow !== 0) {
      if (lastRow === 1) cls.push('d-full')
      else if (lastRow === 2) cls.push('d-wide')
      else if (lastRow === 3 && pos === rest - 1) cls.push('d-wide')
    }
  }
  return cls.join(' ')
}

const BentoTile = ({
  category,
  index,
  total,
  language,
  isAdmin,
  selected,
  onClick,
}: {
  category: EducationCategory
  index: number
  total: number
  language: Lang
  isAdmin: boolean
  selected: boolean
  onClick: () => void
}) => {
  const ko = language === 'ko'
  const n = category.programs.length
  const unit = DEPARTMENT_KEYS.has(category.key) ? (ko ? '부서' : 'depts') : ko ? '과정' : 'programs'
  const isArt = index === 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`edu-tile ${tileSpanClass(index, total)} ${selected ? 'is-selected' : ''} ${!category.is_active ? 'opacity-60' : ''}`}
      style={toneVars(index)}
    >
      <span className="edu-tile-count">
        {ko ? `${n}개 ${unit}` : `${n} ${unit}`}
        {!category.is_active && isAdmin && <span className="ml-1">· 숨김</span>}
      </span>
      {!isArt && (
        <span className="edu-tile-mark" aria-hidden="true">
          <EduGlyph emoji={category.emoji} size={84} />
        </span>
      )}
      <span className="edu-tile-name">{categoryText(category, 'name', language)}</span>
      {categoryText(category, 'tagline', language) && (
        <span className="edu-tile-tagline">{categoryText(category, 'tagline', language)}</span>
      )}
    </button>
  )
}

// ── 이번 주 시간표 ─────────────────────────────────────
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // 월 → 주일

const WeekSchedule = ({
  now,
  byDay,
  toneOf,
  language,
  onOpen,
}: {
  now: Date
  byDay: Record<number, Array<{ program: EducationProgram; session: EduSession }>>
  toneOf: (p: EducationProgram) => number
  language: Lang
  onOpen: (id: number) => void
}) => {
  const ko = language === 'ko'
  const today = now.getDay()
  const [day, setDay] = useState(today)
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((today + 6) % 7))
  const list = byDay[day] ?? []
  const dayNames = ko ? DAY_SHORT_KO : DAY_SHORT_EN

  return (
    <div className="edu-week">
      <div className="edu-days" role="tablist" aria-label={ko ? '요일' : 'Day'}>
        {WEEK_ORDER.map((d, i) => {
          const date = new Date(monday)
          date.setDate(monday.getDate() + i)
          const count = (byDay[d] ?? []).length
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={day === d}
              onClick={() => setDay(d)}
              className={`edu-day ${day === d ? 'is-on' : ''} ${d === today ? 'is-today' : ''}`}
            >
              {dayNames[d]}
              <span className="edu-day-num">{date.getDate()}</span>
              <span className="edu-day-dots" aria-label={ko ? `모임 ${count}개` : `${count} meetings`}>
                {Array.from({ length: Math.min(count, 4) }).map((_, k) => (
                  <i key={k} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="edu-timeline">
        {list.length === 0 ? (
          <p className="edu-timeline-empty">{ko ? '이 날은 정해진 모임이 없어요' : 'No meetings on this day'}</p>
        ) : (
          list.map(({ program, session }) => {
            const isToday = day === today
            const live = isToday && isLive(session, now)
            const over = isToday && !live && isOver(session, now)
            const place = [programText(program, 'location', language), programText(program, 'leader', language)]
              .filter((v) => v.trim())
              .join(' · ')
            return (
              <button
                key={`${program.id}-${session.key}`}
                type="button"
                onClick={() => onOpen(program.id)}
                className={`edu-tl-item ${over ? 'is-over' : ''}`}
                style={toneVars(toneOf(program))}
              >
                <span className="edu-tl-time">
                  {session.h % 12 || 12}:{String(session.mi).padStart(2, '0')}
                  <small>{ko ? (session.h < 12 ? '오전' : '오후') : session.h < 12 ? 'AM' : 'PM'}</small>
                </span>
                <span className="edu-tl-card">
                  <b>
                    {stripStage(programText(program, 'name', language))}
                    {session.ban && <span className="font-semibold"> · {session.ban}</span>}
                    {live && (
                      <span className="edu-pill is-live is-mini">
                        <i className="edu-live-dot" aria-hidden="true" />
                        {ko ? '지금' : 'Now'}
                      </span>
                    )}
                  </b>
                  {place && <span>{place}</span>}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── 분야 소개 (필터를 골랐을 때만) ─────────────────────
const CategoryIntro = ({ category, language, isAdmin }: { category: EducationCategory; language: Lang; isAdmin: boolean }) => {
  const tagline = categoryText(category, 'tagline', language)
  const description = categoryText(category, 'description', language)
  if (!tagline && !description && !(isAdmin && !category.is_active)) return null
  return (
    <div className="edu-intro">
      {tagline && (
        <p className="text-[15px] lg:text-[17px] font-bold text-ink-strong">
          {tagline}
          {!category.is_active && isAdmin && <HiddenBadge />}
        </p>
      )}
      {description && (
        <p className="mt-1.5 text-[14px] lg:text-[16px] leading-[1.75] text-[var(--text-body)] whitespace-pre-line">{description}</p>
      )}
    </div>
  )
}

// ── 과정 카드 ─────────────────────────────────────────
const CourseCard = ({
  program,
  category,
  tone,
  now,
  language,
  isAdmin,
  onOpen,
}: {
  program: EducationProgram
  category: EducationCategory
  tone: number
  now: Date
  language: Lang
  isAdmin: boolean
  onOpen: () => void
}) => {
  const ko = language === 'ko'
  const name = stripStage(programText(program, 'name', language))
  const time = programText(program, 'meeting_time', language)
  const location = programText(program, 'location', language)
  const leader = programText(program, 'leader', language)
  const target = programText(program, 'target', language)
  const weeks = programWeeks(program)
  const stage = programStage(program)
  const teachers = programTeachers(program)
  const when = whenLabel(nextSession(program, now), ko)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`edu-course ${!program.is_active ? 'opacity-60' : ''}`}
      style={toneVars(tone)}
    >
      <span className={`edu-cover ${program.image_url ? 'has-image' : ''}`}>
        {program.image_url ? (
          <img src={program.image_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="edu-cover-mark" aria-hidden="true">
            <EduGlyph emoji={category.emoji} size={116} />
          </span>
        )}
        <span className="edu-cover-cat">{categoryText(category, 'name', language)}</span>
        {weeks && (
          <span className="edu-cover-weeks">
            {weeks}
            <small>{ko ? '주 과정' : '-week'}</small>
          </span>
        )}
        {stage && <span className="edu-cover-stage">{ko ? `${stage}단계` : `Step ${stage}`}</span>}
      </span>

      <span className="edu-course-body">
        <span className="edu-course-name">
          {name}
          {!program.is_active && isAdmin && <HiddenBadge />}
        </span>
        {time && <MetaRow icon="clock" text={time} />}
        {location && <MetaRow icon="pin" text={location} />}
        <span className="edu-course-foot">
          {teachers.length > 0 ? (
            <TeacherStack names={teachers} max={4} />
          ) : leader ? (
            <MetaRow icon="user" text={leader} />
          ) : (
            <span className="text-[12.5px] lg:text-[14px] text-[var(--text-muted)] truncate">{target}</span>
          )}
          {when && (
            <span className={`edu-pill shrink-0 ${when.live ? 'is-live' : ''}`}>
              {when.live && <i className="edu-live-dot" aria-hidden="true" />}
              {when.big}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

// ── 과정 상세 하단 시트 ────────────────────────────────
interface Labels {
  time: string
  leader: string
  location: string
  target: string
  pending: string
}

const ProgramSheet = ({
  program,
  category,
  tone,
  now,
  language,
  labels,
  onClose,
}: {
  program: EducationProgram
  category: EducationCategory | null
  tone: number
  now: Date
  language: Lang
  labels: Labels
  onClose: () => void
}) => {
  useModalBackButton(onClose)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const ko = language === 'ko'
  const stage = programStage(program)
  const rows = [
    [labels.target, programText(program, 'target', language)],
    [labels.time, programText(program, 'meeting_time', language)],
    [labels.leader, programText(program, 'leader', language)],
    [labels.location, programText(program, 'location', language)],
  ].filter(([, v]) => v.trim().length > 0)
  const description = cleanDescription(programText(program, 'description', language))
  const notice = programText(program, 'notice', language)
  const teachers = programTeachers(program)
  const staff = programStaffLine(program)
  const linkUrl = program.link_url?.trim() ?? ''
  const linkLabel = programText(program, 'link_label', language) || (ko ? '바로가기' : 'Open')
  const when = whenLabel(nextSession(program, now), ko)
  const hasDetails = rows.length > 0 || description.length > 0 || notice.length > 0 || linkUrl.length > 0

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={stripStage(programText(program, 'name', language))}
        className="pc-scale-sheet relative w-full sm:max-w-lg sheet-rise max-h-[88vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_8px_28px_var(--brand-glow)] flex flex-col"
        style={toneVars(tone)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-300 dark:bg-white/20" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          aria-label={ko ? '닫기' : 'Close'}
          className="absolute right-3 top-3 z-10 w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="relative overflow-y-auto px-5 pt-4 pb-7 sm:pt-6 lg:px-7">
          <div className="flex items-center gap-3 pr-10">
            <span className="edu-sheet-glyph" aria-hidden="true">
              <EduGlyph emoji={category?.emoji} size={26} />
            </span>
            <div className="min-w-0">
              {category && (
                <p className="text-[12.5px] lg:text-[14px] font-bold text-[var(--chip-b)] dark:text-[var(--chip-a)]">
                  {categoryText(category, 'name', language)}
                  {stage ? ` · ${ko ? `${stage}단계` : `Step ${stage}`}` : ''}
                </p>
              )}
              <h3 className="text-[20px] lg:text-[23px] font-bold leading-[1.3] tracking-[-0.02em] text-ink-strong">
                {stripStage(programText(program, 'name', language))}
              </h3>
            </div>
          </div>

          {when && (
            <div className="edu-next">
              <CalendarGlyph />
              <div className="min-w-0">
                <b>{when.big}</b>
                <small>
                  {when.small}
                  {!when.live && (ko ? ' · 다음 모임' : ' · next meeting')}
                </small>
              </div>
              {when.live && (
                <span className="edu-pill is-live ml-auto">
                  <i className="edu-live-dot" aria-hidden="true" />
                  LIVE
                </span>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <dl className="mt-4 space-y-2">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-start gap-2.5">
                  <dt className="edu-row-label mt-[1px]">{label}</dt>
                  <dd className="text-[14.5px] lg:text-[16.5px] font-medium text-ink-strong min-w-0">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {teachers.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5">
              <TeacherStack names={teachers} max={6} />
              <span className="text-[13px] lg:text-[15px] text-[var(--text-muted)]">
                {ko ? `선생님 ${teachers.length}명이 함께해요` : `${teachers.length} teachers`}
              </span>
            </div>
          )}

          {description && (
            <p className="mt-4 text-[14.5px] lg:text-[16.5px] leading-[1.75] text-[var(--text-body)] whitespace-pre-line">{description}</p>
          )}

          {notice && (
            <p className="mt-4 text-[14px] lg:text-[16px] leading-[1.6] font-semibold text-ink-strong bg-[var(--brand-soft)] rounded-2xl px-4 py-3">
              {notice}
            </p>
          )}

          {teachers.length > 0 && (
            <p className="mt-3 text-[13px] lg:text-[15px] leading-[1.7] text-[var(--text-body)] rounded-2xl px-4 py-3 bg-black/[0.03] dark:bg-white/[0.04]">
              {staff && <span className="block font-semibold text-ink-strong mb-1">{staff}</span>}
              {(ko ? '교사: ' : 'Teachers: ') + teachers.join(' ')}
            </p>
          )}
          {teachers.length === 0 && staff && (
            <p className="mt-3 text-[13px] lg:text-[15px] text-[var(--text-body)]">{staff}</p>
          )}

          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 h-11 px-5 lg:h-12 lg:text-[15.5px] rounded-full bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] transition-colors"
            >
              {linkLabel}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          )}

          {!hasDetails && <p className="mt-4 text-[13px] lg:text-[15px] text-[var(--text-muted)]">{labels.pending}</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── 작은 조각들 ───────────────────────────────────────
const AV_TONES = ['#3182f6', '#0ea5e9', '#14b8a6', '#6366f1', '#8b5cf6', '#38bdf8']

/** 레거시 '교사:' 명단을 이름 첫 글자 아바타 묶음으로 */
const TeacherStack = ({ names, max }: { names: string[]; max: number }) => (
  <span className="edu-avs" aria-label={names.join(', ')}>
    {names.slice(0, max).map((n, i) => (
      <span key={`${n}-${i}`} className="edu-av" style={{ background: AV_TONES[i % AV_TONES.length] }} aria-hidden="true">
        {n[0]}
      </span>
    ))}
    {names.length > max && <span className="edu-av-more">+{names.length - max}</span>}
  </span>
)

const META_PATHS = {
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5a7.5 7.5 0 0 1 15 0',
} as const

const MetaRow = ({ icon, text }: { icon: keyof typeof META_PATHS; text: string }) => (
  <span className="edu-meta">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={META_PATHS[icon]} />
    </svg>
    <span>{text}</span>
  </span>
)

const CalendarGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-brand">
    <rect x="4" y="5" width="16" height="15" rx="2.5" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </svg>
)

const HiddenBadge = () => (
  <span className="ml-2 align-middle text-[10px] lg:text-[12.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60">
    숨김
  </span>
)

const QuickLink = ({ to, icon, label }: { to: string; icon: 'clock' | 'note'; label: string }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-1.5 h-9 px-3.5 lg:h-11 lg:px-5 lg:text-[15px] rounded-full text-[12.5px] font-semibold text-gray-700 dark:text-white/75 bg-white/80 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] hover:text-brand hover:border-[var(--brand-glow)] transition-colors"
  >
    {icon === 'clock' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </svg>
    )}
    {label}
  </Link>
)

const Skeleton = () => (
  <div className="space-y-4 pt-2">
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      <div className="col-span-2 h-56 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse lg:row-span-2 lg:h-auto" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ))}
    </div>
    <div className="h-48 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
  </div>
)

const EmptyState = ({
  title,
  hint,
  isAdmin,
  ko,
  onGoAdmin,
}: {
  title: string
  hint: string
  isAdmin: boolean
  ko: boolean
  onGoAdmin: () => void
}) => (
  <div className="text-center py-16">
    <SproutIcon width={38} height={38} className="mx-auto mb-3 text-brand opacity-70" />
    <p className="text-[15px] lg:text-[18px] font-bold text-ink-strong">{title}</p>
    <p className="text-[12.5px] lg:text-[15px] text-gray-500 dark:text-white/50 lg:text-gray-600 lg:dark:text-white/65 mt-1">{hint}</p>
    {isAdmin && (
      <button
        type="button"
        onClick={onGoAdmin}
        className="mt-5 inline-flex items-center h-10 px-5 lg:h-12 lg:text-[15.5px] rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)]"
      >
        {ko ? '부서 등록하러 가기' : 'Add departments'}
      </button>
    )}
  </div>
)

export default Education
