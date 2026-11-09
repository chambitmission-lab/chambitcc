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
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTickingNow } from '../../hooks/useTickingNow'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAboutContent } from '../../hooks/useAboutContent'
import { useEducationTree } from '../../hooks/useEducation'
import { EditableText } from '../../components/AboutEditor'
import { categoryText } from '../../types/education'
import type { EducationCategory, EducationProgram } from '../../types/education'
import { can } from '../../utils/access'
import './education.css'
import { EduGlyph, PencilIcon } from './EduIcons'
import { programSessions } from './eduSchedule'
import type { EduSession } from './eduSchedule'
import { BentoTile } from './components/BentoTile'
import { CategoryIntro } from './components/CategoryIntro'
import { CourseCard } from './components/CourseCard'
import { EmptyState, QuickLink, Skeleton } from './components/EduBits'
import { toneVars } from './components/eduTone'
import { ProgramSheet, type Labels } from './components/ProgramSheet'
import { TodayCard } from './components/TodayCard'
import { WeekSchedule } from './components/WeekSchedule'

const Education = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const { tx } = useAboutContent()
  const { categories, isLoading } = useEducationTree()
  const isAdminUser = can('content:manage')
  const [params, setSearchParams] = useSearchParams()
  // 1분마다 다시 그려 '지금 진행 중'·'오늘 N개'가 낡지 않게(탭이 숨겨진 동안은 멈춤)
  const nowMs = useTickingNow(60_000)
  const now = useMemo(() => new Date(nowMs), [nowMs])
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
  const hasSchedule = Object.keys(byDay).length > 0
  // 시간표에서 보고 있는 요일 — 히어로 '오늘/다음 모임' 카드가 바꿀 수 있게 여기서 들고 있는다
  const [weekDay, setWeekDay] = useState(() => new Date().getDay())
  const weekRef = useRef<HTMLElement | null>(null)
  const showWeekDay = (d: number) => {
    setWeekDay(d)
    weekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
          <header className={`edu-hero ${hasSchedule ? 'has-aside' : ''}`}>
            <div className="edu-hero-text">
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
                    {/* PC 에선 오른쪽 '오늘의 모임' 카드가 같은 말을 하므로 숨긴다 */}
                    <span className={`edu-pill lg:!hidden ${todayCount > 0 ? 'is-live' : ''}`}>
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
            </div>

            {hasSchedule && (
              <TodayCard
                now={now}
                byDay={byDay}
                toneOf={(p) => toneOf.get(categoryOf.get(p.id)?.id ?? -1) ?? 0}
                categoryName={(p) => {
                  const c = categoryOf.get(p.id)
                  return c ? categoryText(c, 'name', language) : ''
                }}
                language={language}
                onOpen={setOpenProgramId}
                onShowDay={showWeekDay}
              />
            )}
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
                  <section ref={weekRef} className="edu-week-col" aria-labelledby="edu-week-title">
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
                      day={weekDay}
                      onDay={setWeekDay}
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

export default Education
