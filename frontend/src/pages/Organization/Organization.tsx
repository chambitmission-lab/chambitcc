import { Fragment, useMemo, useState } from 'react'
import { useOrgTree } from '../../hooks/useOrganization'
import type { OrgUnit } from '../../types/organization'
import './Organization.css'

/* 종이 조직도의 가로 5열 격자는 모바일에서 글자가 3px가 된다.
   같은 정보를 '의결기구 밴드 + 위원회 아코디언'으로 옮겨 담는다. */

const cardClass =
  'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] ' +
  'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]'

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

const BOX_BASE =
  'text-center px-3 py-2.5 rounded-full text-[13px] leading-tight tracking-[-0.01em] break-keep'

const SubBox = ({ unit, emphasized }: { unit: OrgUnit; emphasized: boolean }) => (
  <span
    className={`${BOX_BASE} border text-brand ${
      emphasized
        ? 'font-semibold bg-[var(--brand-soft-strong)] border-[var(--brand-glow)]'
        : 'font-medium bg-[var(--brand-soft)] border-[var(--brand-soft-strong)]'
    }`}
  >
    {unit.name}
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
        <span className={`${BOX_BASE} org-root-box font-bold text-white`}>{root.name}</span>
      </div>

      {branch.length > 0 && (
        <>
          <BranchElbows />
          <div className="org-tree-row is-triple">
            {branch.map((child, index) => (
              <SubBox key={child.id} unit={child} emphasized={index === 1} />
            ))}
          </div>
        </>
      )}

      {tail.map(child => (
        <Fragment key={child.id}>
          <div className="org-tree-stem" aria-hidden />
          <div className="org-tree-row is-single is-tail">
            <SubBox unit={child} emphasized />
          </div>
        </Fragment>
      ))}
    </div>
  )
}

const GovernanceBand = ({ units }: { units: OrgUnit[] }) => {
  if (units.length === 0) return null

  return (
    <section className="px-4 pt-4">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        의결기구
      </p>
      <div className={`${cardClass} px-4 py-5`}>
        {/* 최상위 기구 뒤로 번지는 은은한 빛 — 플랫함이 밋밋해지지 않게 */}
        <span className="org-halo" aria-hidden />
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
        className="relative z-10 w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        {/* 위원회 첫 글자 모노그램 — 밋밋한 막대 대신 얼굴이 되어 준다 */}
        <span
          className={`org-tile tone-${committee.id % 4} w-9 h-9 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0`}
        >
          {committee.name.charAt(0)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
            {committee.name}
          </span>
          {bureaus.length > 0 && (
            <span className="block text-[11.5px] text-gray-400 dark:text-white/35 mt-0.5 truncate">
              {bureaus.map(b => b.name).join(' · ')}
            </span>
          )}
        </span>
        {departmentCount > 0 && (
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[11px] font-semibold text-gray-500 dark:text-white/45">
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
            expanded ? 'rotate-180' : ''
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
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
    <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen pb-20">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-3">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
            CHURCH ORGANIZATION
          </p>
          <h1 className="text-ink-strong text-[26px] font-bold leading-none tracking-[-0.02em]">
            교회 조직도
          </h1>
          <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2 leading-relaxed">
            한 몸을 이루는 여러 지체입니다. 섬기고 계신 자리를 찾아보세요.
          </p>
          {data && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-[12px] text-brand">
                위원회 <span className="font-bold">{data.committee_count}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-[12px] text-brand">
                부서 <span className="font-bold">{data.department_count}</span>
              </span>
            </div>
          )}
        </header>

        {/* 검색 */}
        <div className="px-4 pb-1">
          <div className="relative">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="부서 · 위원회 이름으로 찾기"
              className="w-full pl-10 pr-9 py-3 text-[13.5px] rounded-full border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.05] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand focus:ring-2 focus:ring-[var(--brand-glow)] transition-[border-color,box-shadow]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="검색어 지우기"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-icons-round text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

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
            {!needle && <GovernanceBand units={data.governance} />}

            <section className="px-4 pt-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted px-1">
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
              <p className="px-5 pt-5 text-[11.5px] text-gray-400 dark:text-white/30">
                마지막 업데이트 {formatStamp(data.updated_at)}
              </p>
            )}
          </>
        )}
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
