// 교육과 훈련 (/education)
//
// 레거시 홈페이지의 "교육과 훈련 > 주일학교 > 영유아부 …" 3단 메뉴 + 이미지 한 장을
// 카테고리 탭 + 프로그램 카드(시간·담당·장소 데이터)로 다시 만든 화면.
// 칩은 스크롤 앵커가 아니라 탭 — 선택한 카테고리 하나만 렌더링한다. ?cat= 이 곧
// 탭 상태(단일 소스)라 새로고침·딥링크·공유가 그대로 탭 선택이 된다.
// 부서 데이터는 education_* 테이블(/admin/education 에서 편집), 페이지 문구는
// about_content.fields 공유 → EditableText ✏️ 인라인 편집.
// 빈 값('')은 '미확인' — 그 줄을 숨기고 관리자에게만 힌트를 보인다. 지어내지 않는다.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
import { useAboutContent } from '../../hooks/useAboutContent'
import type React from 'react'
import { useEducationTree } from '../../hooks/useEducation'
import { EditableText } from '../../components/AboutEditor'
import { categoryText, programText } from '../../types/education'
import type { EducationCategory, EducationProgram } from '../../types/education'
import './education.css'
import { EduGlyph, OpenBookIcon, PencilIcon, PeopleIcon, SproutIcon } from './EduIcons'

// /events 카테고리 칩처럼 선택마다 색이 살짝 달라지도록 — 부서는 DB 기반이라
// 고정 키 매핑 대신 순서로 블루 패밀리(토스 블루 톤 안에서만) 팔레트를 순환한다.
const CHIP_TONES: Array<[string, string, string]> = [
  ['#4593fc', '#3182f6', '49, 130, 246'], // brand blue
  ['#38bdf8', '#0ea5e9', '56, 189, 248'], // sky
  ['#22d3ee', '#0891b2', '34, 211, 238'], // cyan
  ['#818cf8', '#4f46e5', '129, 140, 248'], // indigo
  ['#60a5fa', '#2563eb', '96, 165, 250'], // light blue
  ['#2dd4bf', '#0d9488', '45, 212, 191'], // teal
  ['#a78bfa', '#6d28d9', '167, 139, 250'], // violet
]
const chipTone = (i: number) => {
  const [a, b, rgb] = CHIP_TONES[i % CHIP_TONES.length]
  return { '--chip-a': a, '--chip-b': b, '--chip-rgb': rgb } as React.CSSProperties
}

// 프로그램 카드의 파스텔 아이콘 타일 — 목업처럼 카드마다 톤을 순환한다 (#rrggbb + 알파)
const TILE_TONES = ['#3182f6', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6']
const tileTone = (i: number) => {
  const c = TILE_TONES[i % TILE_TONES.length]
  return { '--tile-fg': c, '--tile-bg': `${c}1f` } as React.CSSProperties
}

const Education = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const { tx } = useAboutContent()
  const { categories, isLoading } = useEducationTree()
  const isAdminUser = isAdmin()
  const [params, setSearchParams] = useSearchParams()

  const visible = useMemo(
    () => categories.filter((c) => c.programs.length > 0 || isAdminUser),
    [categories, isAdminUser],
  )

  // 히어로 '한눈에 보기' 수치 — 데이터에 실제로 있는 것만 센다
  const programCount = useMemo(() => visible.reduce((n, c) => n + c.programs.length, 0), [visible])

  // ?cat= 가 없거나 모르는 키면 첫 카테고리. replace 로 바꿔 탭 전환이 history 를
  // 쌓지 않는다(뒤로가기는 이전 페이지로 나간다).
  const requested = params.get('cat')
  const activeIndex = Math.max(0, visible.findIndex((c) => c.key === requested))
  const active = visible[activeIndex] ?? null
  const prevCat = activeIndex > 0 ? visible[activeIndex - 1] : null
  const nextCat = active && activeIndex < visible.length - 1 ? visible[activeIndex + 1] : null

  const chipsRef = useRef<HTMLElement | null>(null)
  // 탭 전환 후 세로 스크롤 처리. setSearchParams(REPLACE)를 전역 ScrollRestoration 이
  // 새 이동으로 보고 페이지 맨 위로 올려 두므로, 같은 커밋의 layout effect 에서 되돌린다.
  // ScrollRestoration 이 트리상 앞 형제라 layout effect 가 먼저 실행되고, 여기는 그 뒤·
  // paint 전에 복원되어 "맨 위" 프레임이 화면에 그려지지 않는다(일반 effect 면 위로 튄
  // 프레임이 먼저 보여 화면이 흔들린다).
  //   칩 클릭 → 누르기 전 위치 그대로(화면이 튀지 않게)
  //   하단 이전/다음 → 칩 스트립을 상단에(사용자가 페이지 아래에 있으므로)
  //   딥링크 첫 진입 → 보정 없음(히어로부터)
  const pendingScrollRef = useRef<'chips' | { y: number } | null>(null)

  useLayoutEffect(() => {
    const nav = chipsRef.current
    // 가로 칩 스트립(모바일)에서 활성 칩이 밖에 있으면 가운데로 — 이전/다음·딥링크 진입 대비
    // 칩을 직접 탭한 경우는 이미 보이는 칩이므로 스트립을 움직이지 않는다 — 탭마다 가운데로
    // 당기면 손가락 아래에서 칩들이 미끄러져 여러 개가 연달아 눌리는 듯 보인다.
    const chip = nav?.querySelector<HTMLElement>('.edu-chip.is-active')
    const pending = pendingScrollRef.current
    const fromChipTap = pending !== null && pending !== 'chips'
    if (nav && chip && !fromChipTap) {
      const delta = chip.getBoundingClientRect().left - nav.getBoundingClientRect().left
      nav.scrollTo({ left: nav.scrollLeft + delta - (nav.clientWidth - chip.offsetWidth) / 2 })
    }
    if (!pending) return
    pendingScrollRef.current = null
    if (pending === 'chips') {
      // 'auto' 는 html 의 scroll-behavior:smooth 를 따라가 "0 → 칩" 구간이 애니메이션되며
      // 화면이 흔들린다(ScrollRestoration 이 먼저 0 으로 올려 두기 때문). 즉시 이동으로 고정.
      nav?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
    } else {
      // body 가 실제 스크롤러 (ScrollRestoration 참고) — 둘 다에 써서 확실히 복원
      window.scrollTo({ top: pending.y, left: 0, behavior: 'instant' as ScrollBehavior })
      document.body.scrollTop = pending.y
    }
  }, [active?.key])

  const selectTab = (key: string, from: 'chip' | 'pager' = 'chip') => {
    if (key === active?.key) return
    pendingScrollRef.current =
      from === 'pager'
        ? 'chips'
        : { y: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0 }
    setSearchParams({ cat: key }, { replace: true })
  }

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:max-w-none lg:mx-0 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
          {/* Hero — 모바일은 가운데, 데스크톱은 왼쪽 글 + 오른쪽 요약 카드 */}
          <header className="edu-hero">
            <div className="edu-hero-main">
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

              {/* 연결 동선 — 예배 시간, 우리반 알림장 */}
              <div className="mt-5 flex items-center justify-center lg:justify-start gap-2 flex-wrap">
                <QuickLink to="/worship" icon="clock" label={tx('educationWorshipLink')} />
                <QuickLink to="/classes" icon="note" label={tx('educationClassLink')} />
                {isAdminUser && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/education')}
                    className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] hover:bg-[var(--brand-soft)] transition-colors"
                  >
                    <PencilIcon width={13} height={13} className="shrink-0" />
                    {ko ? '부서 관리' : 'Manage'}
                  </button>
                )}
              </div>
            </div>

            {/* 한눈에 보기 — 실제 데이터에서 세는 수치만 (지어내지 않는다) */}
            {visible.length > 0 && (
              <aside className="edu-hero-stats" aria-label={ko ? '한눈에 보기' : 'At a glance'}>
                <div className="edu-stat">
                  <span className="edu-stat-icon">
                    <PeopleIcon width={17} height={17} />
                  </span>
                  <span className="edu-stat-body">
                    <strong className="edu-stat-num">{visible.length}</strong>
                    <span className="edu-stat-label">{ko ? '만나는 부서' : 'Departments'}</span>
                  </span>
                </div>
                <div className="edu-stat">
                  <span className="edu-stat-icon">
                    <OpenBookIcon width={17} height={17} />
                  </span>
                  <span className="edu-stat-body">
                    <strong className="edu-stat-num">{programCount}</strong>
                    <span className="edu-stat-label">{ko ? '훈련 프로그램' : 'Programs'}</span>
                  </span>
                </div>
              </aside>
            )}
          </header>

          {/* 카테고리 탭 */}
          {visible.length > 1 && (
            <nav ref={chipsRef} className="edu-chips" aria-label={ko ? '교육 부서' : 'Departments'}>
              {visible.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectTab(c.key)}
                  aria-current={active?.key === c.key ? 'true' : undefined}
                  className={`edu-chip ${active?.key === c.key ? 'is-active' : ''}`}
                  style={chipTone(i)}
                >
                  <EduGlyph emoji={c.emoji} size={15} className="shrink-0" />
                  {categoryText(c, 'name', language)}
                </button>
              ))}
            </nav>
          )}

          <div className="px-4 pb-16 pt-2 lg:px-8 lg:pb-12 lg:pt-4">
            {isLoading && categories.length === 0 ? (
              <Skeleton />
            ) : !active ? (
              <EmptyState
                title={tx('educationEmptyTitle')}
                hint={tx('educationEmptyHint')}
                isAdmin={isAdminUser}
                ko={ko}
                onGoAdmin={() => navigate('/admin/education')}
              />
            ) : (
              <div key={active.id} className="edu-tabpane">
                <CategorySection
                  category={active}
                  language={language}
                  isAdmin={isAdminUser}
                  labels={{
                    time: tx('educationTimeLabel'),
                    leader: tx('educationLeaderLabel'),
                    location: tx('educationLocationLabel'),
                    target: tx('educationTargetLabel'),
                    pending: tx('educationPendingHint'),
                  }}
                />

                {/* 하단 이전/다음 — 위로 올라가지 않고도 부서를 순서대로 훑는다 */}
                {(prevCat || nextCat) && (
                  <nav
                    className="mt-8 grid grid-cols-2 gap-3"
                    aria-label={ko ? '이전·다음 부서' : 'Previous / next department'}
                  >
                    {prevCat ? (
                      <PagerButton dir="prev" category={prevCat} language={language} ko={ko} onClick={() => selectTab(prevCat.key, 'pager')} />
                    ) : (
                      <span aria-hidden="true" />
                    )}
                    {nextCat ? (
                      <PagerButton dir="next" category={nextCat} language={language} ko={ko} onClick={() => selectTab(nextCat.key, 'pager')} />
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </nav>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section ──────────────────────────────────────────
interface Labels {
  time: string
  leader: string
  location: string
  target: string
  pending: string
}

const CategorySection = ({
  category,
  language,
  isAdmin,
  labels,
}: {
  category: EducationCategory
  language: 'ko' | 'en'
  isAdmin: boolean
  labels: Labels
}) => {
  const name = categoryText(category, 'name', language)
  const tagline = categoryText(category, 'tagline', language)
  const description = categoryText(category, 'description', language)
  const verseText = categoryText(category, 'verse_text', language)
  const verseRef = categoryText(category, 'verse_ref', language)

  return (
    <section>
      {/* 헤더 — 엠블럼 + 이름 + 태그라인 */}
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] flex items-center justify-center text-brand">
          {category.emoji ? <EduGlyph emoji={category.emoji} size={24} /> : <BookGlyph />}
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-[20px] font-bold leading-[1.3] tracking-[-0.02em] text-ink-strong">
            {name}
            {!category.is_active && isAdmin && (
              <span className="ml-2 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60">
                숨김
              </span>
            )}
          </h2>
          {tagline && (
            <p className="text-[13px] leading-[1.55] text-gray-500 dark:text-white/55 mt-0.5">{tagline}</p>
          )}
        </div>
      </div>

      {description && (
        <p className="text-[14px] leading-[1.75] text-gray-700 dark:text-white/75 whitespace-pre-line mb-4">
          {description}
        </p>
      )}

      {/* 프로그램 카드 */}
      {category.programs.length === 0 ? (
        <p className="text-[12.5px] text-gray-400 dark:text-white/40 py-3">
          {language === 'ko' ? '등록된 프로그램이 없습니다' : 'No programs yet'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {category.programs.map((program, i) => (
            <ProgramCard key={program.id} program={program} index={i} emoji={category.emoji} language={language} labels={labels} />
          ))}
        </div>
      )}

      {verseText && (
        <blockquote className="edu-verse mt-4">
          <p className="text-[14px] leading-[1.75] text-ink-strong">{verseText}</p>
          {verseRef && (
            <cite className="block mt-1.5 text-[12px] not-italic font-semibold text-brand">{verseRef}</cite>
          )}
        </blockquote>
      )}
    </section>
  )
}

// ── Program card — 레거시 이미지의 "시간 / 담당 / 장소" 3행을 카드로 ─────
const ProgramCard = ({
  program,
  index,
  emoji,
  language,
  labels,
}: {
  program: EducationProgram
  index: number
  emoji?: string | null
  language: 'ko' | 'en'
  labels: Labels
}) => {
  const name = programText(program, 'name', language)
  const target = programText(program, 'target', language)
  const time = programText(program, 'meeting_time', language)
  const leader = programText(program, 'leader', language)
  const location = programText(program, 'location', language)
  const description = programText(program, 'description', language)
  const notice = programText(program, 'notice', language)
  const linkUrl = program.link_url?.trim() ?? ''
  const linkLabel = programText(program, 'link_label', language) || (language === 'ko' ? '바로가기' : 'Open')
  const rows = [
    [labels.time, time],
    [labels.leader, leader],
    [labels.location, location],
  ].filter(([, v]) => v.trim().length > 0)
  const hasDetails = rows.length > 0 || description.length > 0 || notice.length > 0 || linkUrl.length > 0

  return (
    <article
      className={[
        'relative overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/[0.06]',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        'transition-[transform,box-shadow,border-color] duration-200 lg:hover:-translate-y-0.5 lg:hover:shadow-md lg:hover:border-[var(--brand-glow)]',
        !program.is_active ? 'opacity-60' : '',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
      {program.image_url && (
        <div className="relative aspect-[16/9] bg-[var(--brand-soft)]">
          <img src={program.image_url} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="relative p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="edu-card-tile" style={tileTone(index)} aria-hidden="true">
            {emoji ? <EduGlyph emoji={emoji} size={20} /> : <BookGlyph />}
          </span>
          <h3 className="flex-1 min-w-0 text-[16px] font-bold leading-[1.35] tracking-[-0.01em] text-ink-strong truncate">{name}</h3>
          {target && (
            <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full text-[11px] font-semibold text-gray-600 dark:text-white/65 bg-gray-100 dark:bg-white/[0.06]">
              {target}
            </span>
          )}
        </div>

        {rows.length > 0 && (
          <dl className="space-y-1.5">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center gap-2.5">
                <dt className="edu-row-label">{label}</dt>
                <dd className="text-[14px] font-medium text-gray-800 dark:text-white/85 min-w-0 truncate">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {description && (
          <p className="text-[13px] leading-[1.7] text-gray-600 dark:text-white/65 whitespace-pre-line">{description}</p>
        )}

        {notice && (
          <p className="text-[13px] leading-[1.6] font-semibold text-ink-strong bg-[var(--brand-soft)] rounded-xl px-3 py-2.5">
            {notice}
          </p>
        )}

        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-brand hover:bg-brand-dim text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] transition-colors"
          >
            {linkLabel}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        )}

        {!hasDetails && (
          <p className="text-[12px] text-gray-400 dark:text-white/40">{labels.pending}</p>
        )}
      </div>
    </article>
  )
}

// ── 하단 이전/다음 부서 버튼 ─────────────────────────
const PagerButton = ({
  dir,
  category,
  language,
  ko,
  onClick,
}: {
  dir: 'prev' | 'next'
  category: EducationCategory
  language: 'ko' | 'en'
  ko: boolean
  onClick: () => void
}) => {
  const isNext = dir === 'next'
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group rounded-2xl px-4 py-3 min-w-0 bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/[0.08]',
        'shadow-sm hover:border-[var(--brand-glow)] hover:bg-[var(--brand-soft)] transition-colors',
        isNext ? 'text-right' : 'text-left',
      ].join(' ')}
    >
      <span
        className={`flex items-center gap-0.5 text-[11px] font-semibold text-gray-400 dark:text-white/40 ${isNext ? 'justify-end' : ''}`}
      >
        {!isNext && <Chevron dir="left" />}
        {isNext ? (ko ? '다음' : 'Next') : ko ? '이전' : 'Previous'}
        {isNext && <Chevron dir="right" />}
      </span>
      <span className="mt-1 block text-[13.5px] font-bold text-ink-strong truncate group-hover:text-brand transition-colors">
        <EduGlyph emoji={category.emoji} size={14} className="inline-block align-[-2px] mr-1" />
        {categoryText(category, 'name', language)}
      </span>
    </button>
  )
}

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {dir === 'left' ? <path d="m14 6-6 6 6 6" /> : <path d="m10 6 6 6-6 6" />}
  </svg>
)

// ── 작은 조각들 ───────────────────────────────────────
const QuickLink = ({ to, icon, label }: { to: string; icon: 'clock' | 'note'; label: string }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-semibold text-gray-700 dark:text-white/75 bg-white/80 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] hover:text-brand hover:border-[var(--brand-glow)] transition-colors"
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

const BookGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
    <path d="M3 6.5c2.5-1.2 5-1.2 8 .5v12c-3-1.7-5.5-1.7-8-.5z" />
    <path d="M21 6.5c-2.5-1.2-5-1.2-8 .5v12c3-1.7 5.5-1.7 8-.5z" />
  </svg>
)

const Skeleton = () => (
  <div className="space-y-6 pt-2">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="h-12 w-1/2 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="h-28 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    ))}
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
    <p className="text-[15px] font-bold text-ink-strong">{title}</p>
    <p className="text-[12.5px] text-gray-500 dark:text-white/50 mt-1">{hint}</p>
    {isAdmin && (
      <button
        type="button"
        onClick={onGoAdmin}
        className="mt-5 inline-flex items-center h-10 px-5 rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)]"
      >
        {ko ? '부서 등록하러 가기' : 'Add departments'}
      </button>
    )}
  </div>
)

export default Education
