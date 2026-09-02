import { Fragment, useMemo, useState } from 'react'
import { Buildings, Gavel, UsersThree, Church, MagnifyingGlass, X } from '@phosphor-icons/react'
import { useOrgTree } from '../../hooks/useOrganization'
import type { OrgUnit } from '../../types/organization'
import './Organization.css'

/* 종이 조직도의 가로 5열 격자는 모바일에서 글자가 3px가 된다.
   같은 정보를 '의결기구 밴드 + 위원회 아코디언'으로 옮겨 담는다. */

const cardClass = 'org-card relative overflow-hidden rounded-[20px]'

/** 카드 위에 얹는 미세 그라데이션 — 다크에서만 보인다 */
const CardSheen = () => (
  <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
)

const matches = (unit: OrgUnit, needle: string): boolean =>
  unit.name.toLowerCase().includes(needle) ||
  (unit.note ?? '').toLowerCase().includes(needle) ||
  unit.children.some(child => matches(child, needle))

/** 검색어에 걸리는 가지만 남긴다. 위원회 이름 자체가 걸리면 하위는 통째로 유지 */
const pruneTree = (units: OrgUnit[], needle: string): OrgUnit[] =>
  units.reduce<OrgUnit[]>((kept, unit) => {
    if (!matches(unit, needle)) return kept
    const selfHit = unit.name.toLowerCase().includes(needle)
    kept.push({
      ...unit,
      children: selfHit ? unit.children : pruneTree(unit.children, needle),
    })
    return kept
  }, [])

const countDepartments = (unit: OrgUnit): number =>
  unit.children.reduce(
    (total, child) => total + (child.unit_type === 'department' ? 1 : 0) + countDepartments(child),
    0,
  )

// ── 의결기구 밴드 ─────────────────────────────────────────────────────

/* 의결기구 노드 — 원형 아이콘 + 아래 이름. 최상위는 브랜드 채움, 하위는 톤 틴트 */
const TREE_TONES = ['tone-violet', 'tone-blue', 'tone-teal', 'tone-indigo'] as const

const TreeNode = ({ unit, root = false, tone = 0 }: { unit: OrgUnit; root?: boolean; tone?: number }) => (
  <span className={`org-node ${root ? 'is-root' : TREE_TONES[tone % TREE_TONES.length]}`}>
    <span className="org-node-circle">
      <UsersThree size={root ? 30 : 24} weight="duotone" />
    </span>
    <span className="org-node-label">{unit.name}</span>
  </span>
)

/* 연결선 — 줄기가 내려오다 좌우로 갈라지는 둥근 모서리 엘보.
   실처럼 처지는 자유곡선 대신 노선도식 라운드 라인이라 부드러우면서 또렷하다. */
const BranchElbows = () => (
  <div className="org-tree-branch" aria-hidden>
    <span className="org-branch-stem" />
    <span className="org-elbow is-left" />
    <span className="org-elbow is-right" />
  </div>
)

/* 원본 종이 조직도의 십자(+) 배치를 유지하되 곡선 가지로 상하 관계를 그린다.
   최상위 아래 첫 3개는 가지로 벌리고, 나머지는 가운데 줄기로 이어 내린다.
   하위가 2개 이하면 가지 없이 전부 줄기로 쌓는다(십자가 안 되므로). */
const GovernanceTree = ({ root }: { root: OrgUnit }) => {
  const branch = root.children.length >= 3 ? root.children.slice(0, 3) : []
  const tail = root.children.length >= 3 ? root.children.slice(3) : root.children

  return (
    <div className="org-tree">
      <div className="org-tree-row is-single is-root">
        <TreeNode unit={root} root />
      </div>

      {branch.length > 0 && (
        <>
          <BranchElbows />
          <div className="org-tree-row is-triple">
            {branch.map((child, index) => (
              <TreeNode key={child.id} unit={child} tone={index} />
            ))}
          </div>
        </>
      )}

      {tail.map(child => (
        <Fragment key={child.id}>
          <div className="org-tree-stem" aria-hidden />
          <div className="org-tree-row is-single is-tail">
            <TreeNode unit={child} tone={1} />
          </div>
        </Fragment>
      ))}
    </div>
  )
}

const GovernanceBand = ({ units }: { units: OrgUnit[] }) => {
  if (units.length === 0) return null

  return (
    <section className="org-governance px-4 pt-4">
      <p className="org-section-title">
        <Gavel size={18} weight="duotone" />
        의결기구
      </p>
      <div className={`${cardClass} org-tree-card px-4 py-6`}>
        <span className="org-dots" aria-hidden />
        <CardSheen />
        <div className="relative z-10 space-y-5">
          {units.map(root => (
            <GovernanceTree key={root.id} root={root} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 위원회 카드 ───────────────────────────────────────────────────────

const DepartmentChip = ({ unit }: { unit: OrgUnit }) => (
  <span className="px-3 py-1.5 rounded-full bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.05] text-[12.5px] text-gray-700 dark:text-white/70">
    {unit.name}
    {unit.note && (
      <span className="ml-1.5 text-[11px] text-gray-400 dark:text-white/35">{unit.note}</span>
    )}
  </span>
)

const CommitteeCard = ({
  committee,
  expanded,
  onToggle,
}: {
  committee: OrgUnit
  expanded: boolean
  onToggle: () => void
}) => {
  const bureaus = committee.children.filter(child => child.unit_type === 'bureau')
  const directDepartments = committee.children.filter(child => child.unit_type !== 'bureau')
  const departmentCount = countDepartments(committee)

  return (
    <div className={cardClass}>
      <CardSheen />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="relative z-10 w-full flex items-center gap-3.5 px-4 py-4 text-left"
      >
        {/* 위원회 첫 글자 모노그램 — 밋밋한 막대 대신 얼굴이 되어 준다 */}
        <span
          className={`org-tile tone-${committee.id % 4} w-[54px] h-[54px] rounded-full flex items-center justify-center text-[22px] font-extrabold shrink-0`}
        >
          {committee.name.charAt(0)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-bold text-ink-strong tracking-[-0.02em] truncate">
            {committee.name}
          </span>
          {bureaus.length > 0 && (
            <span className="block text-[12px] text-gray-500 dark:text-white/40 mt-1 truncate">
              {bureaus.map(b => b.name).join(' · ')}
            </span>
          )}
        </span>
        {departmentCount > 0 && (
          <span className={`org-count tone-${committee.id % 4} shrink-0 px-2.5 py-1 rounded-full text-[11.5px] font-semibold`}>
            부서 {departmentCount}
          </span>
        )}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-gray-400 dark:text-white/35 transition-transform duration-200 ${
            expanded ? 'rotate-90' : ''
          }`}
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>

      {expanded && (
        <div className="relative z-10 px-4 pb-4 space-y-3 animate-pop-in">
          {bureaus.map(bureau => (
            <div key={bureau.id}>
              <span className="inline-block px-2.5 py-1 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand text-[12px] font-bold mb-2">
                {bureau.name}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {bureau.children.map(dept => (
                  <DepartmentChip key={dept.id} unit={dept} />
                ))}
              </div>
            </div>
          ))}

          {directDepartments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {directDepartments.map(dept => (
                <DepartmentChip key={dept.id} unit={dept} />
              ))}
            </div>
          )}

          {bureaus.length === 0 && directDepartments.length === 0 && (
            <p className="text-[12.5px] text-gray-400 dark:text-white/30">
              등록된 하위 조직이 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── 성구 카드 — 레일 맨 아래, '한 몸의 지체' 말씀 ───────────────────────

const VerseCard = () => (
  <section className="org-verse px-4 pt-4">
    <div className={`${cardClass} org-verse-card px-5 py-5`}>
      <CardSheen />
      <span className="org-verse-quote" aria-hidden>“</span>
      <p className="relative z-10 m-0 pr-16 text-[13px] leading-relaxed text-gray-600 dark:text-white/65 break-keep">
        몸은 하나인데 많은 지체가 있고 몸의 지체가 많으나 한 몸임과 같이 그리스도도 그러하니라
      </p>
      <p className="relative z-10 m-0 mt-2.5 text-[12px] font-semibold text-brand">고린도전서 12:12</p>
      <span className="org-verse-art" aria-hidden>
        <Church size={56} weight="duotone" />
      </span>
    </div>
  </section>
)

// ── 페이지 ────────────────────────────────────────────────────────────

const Organization = () => {
  const { data, isLoading, isError } = useOrgTree()
  const [query, setQuery] = useState('')
  const [openIds, setOpenIds] = useState<Set<number>>(new Set())

  const needle = query.trim().toLowerCase()

  const committees = useMemo(() => {
    if (!data) return []
    return needle ? pruneTree(data.committees, needle) : data.committees
  }, [data, needle])

  const toggle = (id: number) =>
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 page-stage org-page">
      {/* lg:overflow-hidden 을 주면 이 셸이 sticky 의 스크롤 조상이 되어 우측 레일이 죽는다 */}
      {/* lg: /history 와 같은 "둥근 패널" 문법 — 표준 콘텐츠 폭(1200px = 1240 - px-5×2)에
          rounded-3xl 테두리 + 그림자. lg:overflow-hidden 금지(셸 안 레일 sticky 가 죽는다) */}
      <div className="org-shell max-w-md mx-auto min-h-screen pb-20 lg:max-w-[1200px] lg:mt-3 lg:mb-12 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:shadow-2xl lg:min-h-0">
        {/* 헤더 */}
        <header className="org-head px-4 pt-5 pb-3">
          <div className="org-head-text">
            <span className="org-eyebrow">
              <span className="org-eyebrow-dot" aria-hidden />
              Church Organization
            </span>
            <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-ink-strong mt-2.5">교회 조직도</h1>
            <p className="text-[13px] text-gray-500 dark:text-white/45 mt-2 break-keep">
              한 몸을 이루는 여러 지체입니다. 섬기고 계신 자리를 찾아보세요.
            </p>
          </div>
          {data && (
            <div className="org-head-stats mt-4 flex items-center gap-2">
              <span className="org-stat">
                <UsersThree size={20} weight="duotone" />
                위원회 <b>{data.committee_count}</b>
              </span>
              <span className="org-stat">
                <Buildings size={20} weight="duotone" />
                부서 <b>{data.department_count}</b>
              </span>
            </div>
          )}
        </header>

        {/* PC(lg+) 2단 — 좌: 위원회 목록(2열) / 우: 검색 + 의결기구가 sticky 로 따라온다.
            래퍼 3개는 lg 미만에서 display:contents 라 모바일 흐름은 기존과 완전히 동일하다. */}
        <div className="org-columns">
          <div className="org-col-side">
            {/* 검색 */}
            <div className="org-search px-4 pb-1">
              <div className="relative">
                <MagnifyingGlass
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30"
                />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="부서 · 위원회 이름으로 찾기"
                  className="org-search-input w-full pl-11 pr-10 py-3.5 text-[13.5px] rounded-full text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none transition-[border-color,box-shadow]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="검색어 지우기"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <X size={14} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            {/* 의결기구 — PC 에선 검색 아래 레일에 붙어 위원회를 훑는 내내 함께 보인다 */}
            {!isLoading && !isError && data && !needle && (
              <>
                <GovernanceBand units={data.governance} />
                <VerseCard />
              </>
            )}
          </div>

          <div className="org-col-main">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
              </div>
            ) : isError ? (
              <p className="px-6 py-20 text-center text-[13px] text-gray-500 dark:text-white/50">
                조직도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            ) : !data || (data.governance.length === 0 && data.committees.length === 0) ? (
              <p className="px-6 py-20 text-center text-[13px] text-gray-400 dark:text-white/30">
                아직 등록된 조직도가 없습니다
              </p>
            ) : (
              <>
                <section className="org-committees px-4 pt-4 space-y-2">
                  <p className="org-section-title">
                    <Buildings size={18} weight="duotone" />
                    위원회
                  </p>
                  {committees.length === 0 ? (
                    <p className="py-12 text-center text-[13px] text-gray-400 dark:text-white/30">
                      "{query}"와 일치하는 조직이 없습니다
                    </p>
                  ) : (
                    committees.map(committee => (
                      <CommitteeCard
                        key={committee.id}
                        committee={committee}
                        // 검색 중에는 걸린 가지를 바로 보여준다
                        expanded={!!needle || openIds.has(committee.id)}
                        onToggle={() => toggle(committee.id)}
                      />
                    ))
                  )}
                </section>

                {data.updated_at && (
                  <p className="org-updated px-5 pt-5 text-[11.5px] text-gray-400 dark:text-white/30">
                    마지막 업데이트 {formatStamp(data.updated_at)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** '2026-08-10T09:51:00' → '2026년 8월 10일' (서버가 로컬시간으로 저장하므로 그대로 읽는다) */
const formatStamp = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default Organization
