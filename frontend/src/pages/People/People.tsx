// 섬기는 사람들 (/people)
//
// 레거시 홈페이지의 "교회소개 > 섬기는사람들" — 교역자 / 파송선교사 / 장로 / 교회직원
// 네 개의 네모 탭과 사진 나열을, 세그먼트 탭 + 인물 카드 그리드 + 하단 시트로 옮긴 화면.
// 데이터는 church_people(= /admin/people 에서 편집), 담임·원로목사만 church_pastors 에서
// 빌려와 교역자 탭 맨 위 대표 카드로 얹는다(편집은 /admin/pastors 한 곳).
// ?tab= 이 곧 탭 상태(단일 소스)라 새로고침·딥링크·공유가 그대로 탭 선택이 된다.
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  Church,
  GlobeHemisphereEast,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  ShieldCheck,
  UsersThree,
  X,
} from '../../components/icons/phosphor'
import type { Icon } from '../../components/icons/phosphor'
import CountryFlag from '../../components/common/CountryFlag'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePeopleDirectory } from '../../hooks/usePeople'
import { can } from '../../utils/access'
import {
  CATEGORY_LABEL,
  PERSON_CATEGORIES,
  assignmentList,
  buildLeaderSlots,
  groupPeople,
  leaderText,
  personInitial,
  personText,
  withoutLeaderPeople,
} from '../../types/people'
import type { LeaderSlot, Person, PersonCategory } from '../../types/people'
import PersonSheet from './PersonSheet'
import './people.css'

const CATEGORY_ICON: Record<PersonCategory, Icon> = {
  pastor: Church,
  missionary: GlobeHemisphereEast,
  elder: ShieldCheck,
  staff: Briefcase,
}

const isCategory = (value: string | null): value is PersonCategory =>
  value !== null && (PERSON_CATEGORIES as string[]).includes(value)

const People = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const isAdminUser = can('content:manage')
  const { leaders, people: registered, isLoading } = usePeopleDirectory()

  // 담임·원로목사가 church_people 에도 등록돼 있으면 대표 카드와 격자에 두 번 보인다 —
  // 대표 카드만 남기고 격자에서 민다. 대신 대표 카드를 누르면 그분의 인물 시트가 열려
  // 담당 사역·연락처는 그대로 닿는다.
  const leaderSlots = useMemo(() => buildLeaderSlots(registered, leaders), [registered, leaders])
  const people = useMemo(
    () => withoutLeaderPeople(registered, leaderSlots),
    [registered, leaderSlots],
  )

  const [params, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Person | null>(null)

  // 등록된 인원이 있는 탭만 보인다. 교역자 탭은 대표(담임·원로)만 있어도 살린다
  const counts = useMemo(() => {
    const map = {} as Record<PersonCategory, number>
    PERSON_CATEGORIES.forEach((c) => {
      map[c] = people.filter((p) => p.category === c).length
    })
    return map
  }, [people])

  // 대표 카드도 교역자 수에 든다 — 탭 배지와 히어로 통계가 같은 숫자를 말하게
  const totalFor = (c: PersonCategory) => counts[c] + (c === 'pastor' ? leaderSlots.length : 0)

  const tabs = useMemo(
    () =>
      PERSON_CATEGORIES.filter(
        (c) => counts[c] > 0 || (c === 'pastor' && leaderSlots.length > 0),
      ),
    [counts, leaderSlots.length],
  )

  const requested = params.get('tab')
  const active: PersonCategory | null =
    (isCategory(requested) && tabs.includes(requested) ? requested : tabs[0]) ?? null

  // 탭 안에서 이름·직분·담당 사역·사역지로 좁힌다
  const visible = useMemo(() => {
    if (!active) return []
    const needle = query.trim().toLowerCase()
    const inTab = people.filter((p) => p.category === active)
    if (!needle) return inTab
    return inTab.filter((person) =>
      [
        personText(person, 'name', language),
        personText(person, 'role', language),
        personText(person, 'group', language),
        personText(person, 'field', language),
        personText(person, 'org', language),
        personText(person, 'assignments', language),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [people, active, query, language])

  const groups = useMemo(
    () => (active ? groupPeople(visible, active, language) : []),
    [visible, active, language],
  )

  // 탭 전환 후 스크롤 처리. setSearchParams(replace)를 전역 ScrollRestoration 이 새 이동으로
  // 보고 맨 위로 올려 두므로, 같은 커밋의 layout effect 에서 누르기 전 위치로 되돌린다
  // (일반 effect 면 위로 튄 프레임이 먼저 보여 화면이 흔들린다). /education 과 같은 처리.
  const pendingScrollRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const y = pendingScrollRef.current
    if (y === null) return
    pendingScrollRef.current = null
    // body 가 실제 스크롤러인 경우가 있어 둘 다에 쓴다
    window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior })
    document.body.scrollTop = y
  }, [active])

  const selectTab = (key: PersonCategory) => {
    if (key === active) return
    pendingScrollRef.current =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
    setQuery('')
    setSearchParams({ tab: key }, { replace: true })
  }

  const totalPeople = people.length
  const showSearch = active !== null && counts[active] >= 6

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-12 lg:max-w-none lg:mx-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
          {/* Hero */}
          <header className="ppl-hero">
            <span className="ppl-hero-emblem">
              <UsersThree size={28} weight="duotone" />
            </span>
            <span className="ppl-hero-badge">{ko ? '섬기는 사람들' : 'Our People'}</span>
            <h1 className="ppl-hero-title">
              {ko ? '함께 섬기는 얼굴들' : 'The faces who serve'}
            </h1>
            <p className="ppl-hero-subtitle">
              {ko
                ? '말씀과 기도로 참빛교회를 함께 세워가는 분들입니다. 궁금한 분을 누르면 담당 사역과 연락처를 볼 수 있어요.'
                : 'Those who build Chambit Church together in word and prayer. Tap a card to see what they serve and how to reach them.'}
            </p>

            {(totalPeople > 0 || leaderSlots.length > 0) && (
              <div className="ppl-stats" aria-label={ko ? '한눈에 보기' : 'At a glance'}>
                {PERSON_CATEGORIES.filter((c) => totalFor(c) > 0).map((c) => (
                  <span key={c} className="ppl-stat">
                    <strong className="ppl-stat-num">{totalFor(c)}</strong>
                    {CATEGORY_LABEL[c][ko ? 'ko' : 'en']}
                  </span>
                ))}
              </div>
            )}

            {isAdminUser && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/admin/people')}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] hover:bg-[var(--brand-soft)] transition-colors"
                >
                  <PencilSimple size={13} weight="bold" />
                  {ko ? '인물 관리' : 'Manage'}
                </button>
              </div>
            )}
          </header>

          {/* 탭 */}
          {tabs.length > 1 && (
            <nav className="ppl-tabs" aria-label={ko ? '분류' : 'Categories'}>
              {tabs.map((c) => {
                const TabIcon = CATEGORY_ICON[c]
                const count = totalFor(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => selectTab(c)}
                    aria-current={active === c ? 'true' : undefined}
                    className={`ppl-tab ${active === c ? 'is-active' : ''}`}
                  >
                    <TabIcon size={15} weight="duotone" />
                    {CATEGORY_LABEL[c][ko ? 'ko' : 'en']}
                    <span className="ppl-tab-count">{count}</span>
                  </button>
                )
              })}
            </nav>
          )}

          {/* 대표(담임·원로목사) — 교역자 탭 맨 위. 편집은 /admin/pastors 에서 */}
          {active === 'pastor' && leaderSlots.length > 0 && !query && (
            <>
              <div className="ppl-group-title">
                {ko ? '담임 · 원로목사' : 'Senior & Emeritus'}
                <span className="ppl-group-rule" />
              </div>
              {/* 한 분뿐이면 왼쪽에 홀로 붙어 허전하다 — 가운데로 모은다 */}
              <div className={`ppl-leaders ${leaderSlots.length === 1 ? 'is-single' : ''}`}>
                {leaderSlots.map((slot) => (
                  <LeaderTile
                    key={slot.key}
                    slot={slot}
                    language={language}
                    onOpen={slot.person ? () => setSelected(slot.person as Person) : undefined}
                  />
                ))}
              </div>
            </>
          )}

          {/* 검색 — 인원이 많은 탭에서만 */}
          {showSearch && (
            <div className="ppl-search">
              <span className="ppl-search-icon">
                <MagnifyingGlass size={16} weight="bold" />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ko ? '이름 · 담당 사역 검색' : 'Search name or ministry'}
                aria-label={ko ? '검색' : 'Search'}
              />
              {query && (
                <button
                  type="button"
                  className="ppl-search-clear"
                  onClick={() => setQuery('')}
                  aria-label={ko ? '검색어 지우기' : 'Clear'}
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>
          )}

          {/* 목록 */}
          {isLoading && people.length === 0 ? (
            <div className="ppl-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ppl-skeleton" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              ko={ko}
              searching={query.trim().length > 0}
              isAdminUser={isAdminUser}
              onManage={() => navigate('/admin/people')}
              hasAnyone={totalPeople > 0 || leaderSlots.length > 0}
            />
          ) : (
            groups.map((group) => (
              <section key={group.key}>
                {/* 그룹이 하나뿐이면 헤더가 탭 라벨과 같아 군더더기가 된다 —
                    예우 그룹(명예전도사·은퇴장로)만은 예외로 늘 이름을 붙인다 */}
                {(groups.length > 1 || group.honor) && (
                  <div className="ppl-group-title">
                    {group.label}
                    <span className="ppl-group-count">{group.people.length}</span>
                    <span className="ppl-group-rule" />
                  </div>
                )}
                <div className="ppl-grid">
                  {group.people.map((person, index) => (
                    <PersonTile
                      key={person.id}
                      person={person}
                      index={index}
                      language={language}
                      onOpen={() => setSelected(person)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}

          {/* 이어지는 동선 — 조직도로 */}
          <div className="px-4 pt-4 lg:px-5">
            <Link
              to="/organization"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] hover:border-brand transition-colors"
            >
              <span className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center shrink-0">
                <UsersThree size={18} weight="duotone" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-bold text-ink-strong">
                  {ko ? '교회 조직도' : 'Org chart'}
                </span>
                <span className="block text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
                  {ko ? '어느 부서가 무엇을 섬기는지' : 'Which team serves what'}
                </span>
              </span>
              <ArrowRight size={16} weight="bold" className="text-gray-400 dark:text-white/35 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {selected && <PersonSheet person={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ── 대표 카드 ─────────────────────────────────────────
// 인사말은 메뉴와 /greeting 이 따로 맡는다 — 여긴 사진·직분·한 줄 소개만.
// church_people 에 같은 분이 있으면 다른 카드처럼 눌러 인물 시트를 열 수 있다.
const LeaderTile = ({
  slot,
  language,
  onOpen,
}: {
  slot: LeaderSlot
  language: 'ko' | 'en'
  onOpen?: () => void
}) => {
  const name = leaderText(slot, 'name', language)
  const role = leaderText(slot, 'role', language)
  const headline = leaderText(slot, 'headline', language)
  const photo = slot.photo_url || slot.person?.photo_url || ''

  // 아래 인물 카드와 같은 생김새(세로 사진 + 이름·직분)로 간다 — 대표라고 따로 놀지 않게
  const className = [
    'ppl-card',
    'ppl-leader',
    slot.status === 'emeritus' ? 'is-emeritus' : '',
    onOpen ? '' : 'is-static',
  ]
    .filter(Boolean)
    .join(' ')

  const inner = (
    <>
      <span className="ppl-card-photo">
        {photo ? (
          <img src={photo} alt={name} loading="lazy" />
        ) : (
          <span className="ppl-card-initial">{personInitial(name)}</span>
        )}
      </span>

      <span className="ppl-card-body">
        <span className="ppl-card-name">
          {name}
          {role && <span className="ppl-card-role">{role}</span>}
        </span>
        {headline && <span className="ppl-card-sub">{headline}</span>}
      </span>
    </>
  )

  if (!onOpen) return <div className={className}>{inner}</div>

  return (
    <button type="button" onClick={onOpen} className={className}>
      {inner}
    </button>
  )
}

// ── 인물 카드 ─────────────────────────────────────────
const PersonTile = ({
  person,
  index,
  language,
  onOpen,
}: {
  person: Person
  index: number
  language: 'ko' | 'en'
  onOpen: () => void
}) => {
  const name = personText(person, 'name', language)
  const role = personText(person, 'role', language)
  const field = personText(person, 'field', language)
  const assignments = assignmentList(person, language)
  // 선교사는 사역지가 곧 정체성 — 담당 사역보다 먼저 보여준다
  const sub = person.category === 'missionary' ? field : ''

  return (
    <button
      type="button"
      onClick={onOpen}
      className="ppl-card"
      // 카드가 순서대로 떠오르게 — 6장까지만 지연을 준다(그 뒤는 스크롤 밖)
      style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
    >
      <span className="ppl-card-photo">
        {person.photo_url ? (
          <img src={person.photo_url} alt={name} loading="lazy" />
        ) : (
          <span className="ppl-card-initial">{personInitial(name)}</span>
        )}
        {person.country_code && (
          <span className="ppl-card-flag">
            <CountryFlag code={person.country_code} />
          </span>
        )}
      </span>

      <span className="ppl-card-body">
        <span className="ppl-card-name">
          {name}
          {role && <span className="ppl-card-role">{role}</span>}
        </span>

        {sub ? (
          <span className="ppl-card-sub">
            <MapPin size={11} weight="duotone" className="inline-block mr-0.5 -mt-0.5" />
            {sub}
          </span>
        ) : (
          assignments.length > 0 && (
            <span className="ppl-chips">
              {assignments.slice(0, 2).map((item) => (
                <span key={item} className="ppl-chip">
                  {item}
                </span>
              ))}
              {assignments.length > 2 && (
                <span className="ppl-chip is-more">+{assignments.length - 2}</span>
              )}
            </span>
          )
        )}
      </span>
    </button>
  )
}

// ── 빈 상태 ───────────────────────────────────────────
const EmptyState = ({
  ko,
  searching,
  isAdminUser,
  onManage,
  hasAnyone,
}: {
  ko: boolean
  searching: boolean
  isAdminUser: boolean
  onManage: () => void
  hasAnyone: boolean
}) => (
  <div className="ppl-empty">
    <span className="ppl-empty-icon">
      <UsersThree size={26} weight="duotone" />
    </span>
    <p className="ppl-empty-title">
      {searching
        ? ko
          ? '찾는 분이 없어요'
          : 'No one matched'
        : ko
          ? '아직 등록된 분이 없어요'
          : 'No one registered yet'}
    </p>
    <p className="ppl-empty-desc">
      {searching
        ? ko
          ? '이름이나 담당 사역을 다시 검색해보세요'
          : 'Try another name or ministry'
        : ko
          ? '관리자가 사진과 소개를 등록하면 이곳에 보입니다'
          : 'Profiles appear here once an admin adds them'}
    </p>
    {isAdminUser && !searching && !hasAnyone && (
      <button
        type="button"
        onClick={onManage}
        className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-brand hover:bg-brand-dim text-white text-[13px] font-bold transition-colors"
      >
        <PencilSimple size={14} weight="bold" />
        {ko ? '인물 등록하기' : 'Add people'}
      </button>
    )}
  </div>
)

export default People
