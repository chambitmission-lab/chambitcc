// 교육과 훈련 (/education)
//
// 레거시 홈페이지의 "교육과 훈련 > 주일학교 > 영유아부 …" 3단 메뉴 + 이미지 한 장을
// 카테고리 섹션 + 프로그램 카드(시간·담당·장소 데이터)로 다시 만든 화면.
// 부서 데이터는 education_* 테이블(/admin/education 에서 편집), 페이지 문구는
// about_content.fields 공유 → EditableText ✏️ 인라인 편집.
// 빈 값('')은 '미확인' — 그 줄을 숨기고 관리자에게만 힌트를 보인다. 지어내지 않는다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
import { useAboutContent } from '../../hooks/useAboutContent'
import { useEducationTree } from '../../hooks/useEducation'
import { EditableText } from '../../components/AboutEditor'
import { categoryText, programText } from '../../types/education'
import type { EducationCategory, EducationProgram } from '../../types/education'
import './education.css'

const sectionId = (key: string) => `edu-${key}`

// body 가 스크롤 컨테이너라 smooth scrollIntoView 가 도중에 끊긴다 — instant 로 이동
const scrollToSection = (key: string) =>
  document.getElementById(sectionId(key))?.scrollIntoView({ behavior: 'auto', block: 'start' })

/**
 * 딥링크용: 뒤로가기/새로고침(POP) 직후엔 전역 ScrollRestoration 이 최대 1초 동안
 * 매 프레임 저장 위치로 되돌리므로, 섹션이 상단에 올 때까지 잠시 재시도한다.
 * rAF 는 백그라운드 탭에서 멈추므로 setTimeout 으로 돈다. 사용자가 직접 스크롤하면 즉시 멈춘다.
 */
const scrollToSectionUntilSettled = (key: string, timeoutMs = 1300): void => {
  const deadline = performance.now() + timeoutMs
  let timer = 0
  let cancelled = false
  const cancel = () => {
    cancelled = true
    window.clearTimeout(timer)
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
  }
  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchstart', cancel, { passive: true })
  const attempt = () => {
    if (cancelled) return
    const el = document.getElementById(sectionId(key))
    if (!el) return cancel()
    const top = el.getBoundingClientRect().top
    if (Math.abs(top - 16) > 4) el.scrollIntoView({ behavior: 'auto', block: 'start' })
    if (performance.now() > deadline) return cancel()
    timer = window.setTimeout(attempt, 60)
  }
  attempt()
}

const Education = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const { tx } = useAboutContent()
  const { categories, isLoading } = useEducationTree()
  const isAdminUser = isAdmin()
  const [params] = useSearchParams()

  const visible = useMemo(
    () => categories.filter((c) => c.programs.length > 0 || isAdminUser),
    [categories, isAdminUser],
  )

  // ?cat=youth 딥링크 — 데이터가 온 뒤 해당 섹션으로 스크롤.
  // 칩 클릭은 URL 을 바꾸지 않는다: setSearchParams 는 새 history 엔트리를 만들고
  // 전역 ScrollRestoration 이 그 엔트리를 "새 페이지"로 보고 맨 위로 되돌려 스크롤이 취소된다.
  const requested = params.get('cat')
  // 활성 칩: 클릭한 칩(userKey)이 있으면 그것, 아니면 URL 의 cat. URL 이 바뀌면 클릭 기억을 비운다
  // (렌더 중 파생 — effect 안에서 setState 하지 않는다)
  const [userPick, setUserPick] = useState<{ forCat: string | null; key: string } | null>(null)
  const activeKey = userPick && userPick.forCat === requested ? userPick.key : requested
  // 같은 링크를 다시 눌러도(같은 cat, 새 history 엔트리) 다시 내려가도록 location.key 로 구분한다
  const location = useLocation()
  const handledRef = useRef<string | null>(null)
  useEffect(() => {
    if (!requested || visible.length === 0) return
    const stamp = `${location.key}:${requested}`
    if (handledRef.current === stamp) return
    if (!visible.some((c) => c.key === requested)) return
    handledRef.current = stamp
    // ScrollRestoration(layout effect)이 위치를 잡은 다음 프레임에 내려간다.
    // smooth 는 이 레이아웃(body 스크롤)에서 중간에 끊기므로 instant 로 확실히 이동한다.
    // cleanup 으로 취소하지 않는다 — 데이터 도착 직후 deps(visible)가 한 번 더 바뀌며
    // 이전 effect 의 cleanup 이 루프를 첫 프레임도 못 돌고 죽인다. 루프는 스스로 끝난다.
    scrollToSectionUntilSettled(requested)
  }, [requested, location.key, visible])

  const jumpTo = (key: string) => {
    setUserPick({ forCat: requested, key })
    scrollToSection(key)
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen lg:max-w-none lg:mx-0 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
          {/* Hero */}
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

            {/* 연결 동선 — 예배 시간, 우리반 알림장 */}
            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
              <QuickLink to="/worship" icon="clock" label={tx('educationWorshipLink')} />
              <QuickLink to="/classes" icon="note" label={tx('educationClassLink')} />
              {isAdminUser && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/education')}
                  className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] hover:bg-[var(--brand-soft)] transition-colors"
                >
                  ✏️ {ko ? '부서 관리' : 'Manage'}
                </button>
              )}
            </div>
          </header>

          {/* 카테고리 칩 */}
          {visible.length > 1 && (
            <nav className="edu-chips" aria-label={ko ? '교육 부서' : 'Departments'}>
              {visible.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => jumpTo(c.key)}
                  className={`edu-chip ${activeKey === c.key ? 'is-active' : ''}`}
                >
                  {c.emoji && <span aria-hidden="true">{c.emoji}</span>}
                  {categoryText(c, 'name', language)}
                </button>
              ))}
            </nav>
          )}

          <div className="px-4 pb-16 pt-2 space-y-8 lg:px-8 lg:pb-12 lg:pt-4">
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
              visible.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
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
              ))
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
    <section id={sectionId(category.key)} className="scroll-mt-4">
      {/* 헤더 — 엠블럼 + 이름 + 태그라인 */}
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] flex items-center justify-center text-[22px]">
          {category.emoji || <BookGlyph />}
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
          {category.programs.map((program) => (
            <ProgramCard key={program.id} program={program} language={language} labels={labels} />
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
  language,
  labels,
}: {
  program: EducationProgram
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[16px] font-bold leading-[1.35] tracking-[-0.01em] text-ink-strong">{name}</h3>
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
    <span className="text-4xl block mb-3">🌱</span>
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
