import { useMemo, useState } from 'react'
import { useOrgTree } from '../../hooks/useOrganization'
import type { OrgUnit } from '../../types/organization'
import { getNaturalSeason, type NaturalSeason } from '../../utils/naturalSeason'
import orgSpring from '../../assets/hero/spring-afternoon.jpg'
/* 여름은 afternoon(회색 산·호수)보다 morning(초록 능선)이 계절감이 산다 */
import orgSummer from '../../assets/hero/morning.jpg'
import orgAutumn from '../../assets/hero/autumn-afternoon.jpg'
import orgWinter from '../../assets/hero/winter-afternoon.jpg'
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

/* 계절 배경 — 홈 히어로와 같은 사진을 재사용한다(추가 다운로드 없음).
   CSS 변수로만 참조되므로 실제로 받는 이미지는 현재 계절 1장뿐. */
const SEASON_IMAGE: Record<NaturalSeason, string> = {
  spring: orgSpring,
  summer: orgSummer,
  autumn: orgAutumn,
  winter: orgWinter,
}

const SEASON_CHIP: Record<NaturalSeason, { glyph: string; label: string }> = {
  spring: { glyph: '🌸', label: '봄' },
  summer: { glyph: '🌿', label: '여름' },
  autumn: { glyph: '🍂', label: '가을' },
  winter: { glyph: '❄️', label: '겨울' },
}

/* 떨어지는 글리프 — 여름은 배경 자체가 청량해 두지 않는다(홈 히어로와 같은 규칙) */
const SEASON_PARTICLE: Partial<Record<NaturalSeason, string>> = {
  spring: '🌸',
  autumn: '🍂',
  winter: '❄️',
}

/* 렌더마다 흔들리지 않도록 고정 배치 */
const PARTICLES = [
  { left: '10%', delay: '0s', duration: '16s', drift: '14px', size: '10px', opacity: 0.45 },
  { left: '34%', delay: '5.5s', duration: '19s', drift: '-12px', size: '8px', opacity: 0.35 },
  { left: '58%', delay: '2.5s', duration: '17s', drift: '18px', size: '11px', opacity: 0.4 },
  { left: '82%', delay: '8.5s', duration: '21s', drift: '-10px', size: '9px', opacity: 0.3 },
] as const

/* 원본 종이 조직도의 십자(+) 배치를 그대로 옮긴다. 연결선은 원본에도 없다.
   3열 그리드에서 최상위는 가운데 위, 하위는 등록 순서대로
   왼쪽 → 가운데 → 오른쪽 → 그 아래 가운데로 채운다. */
const governanceSlot = (index: number, total: number) => {
  if (total === 1) return { gridColumn: 2, gridRow: 2 }
  // 2개뿐이면 가로로 벌리는 대신 가운데 열에 세로로 쌓는다(십자가 안 되므로)
  if (total === 2) return { gridColumn: 2, gridRow: 2 + index }
  if (index === 0) return { gridColumn: 1, gridRow: 2 }
  if (index === 1) return { gridColumn: 2, gridRow: 2 }
  if (index === 2) return { gridColumn: 3, gridRow: 2 }
  return { gridColumn: 2, gridRow: index } // 4번째부터는 가운데 열 아래로 이어 붙는다
}

const BOX_BASE =
  'w-full text-center px-2 py-2.5 rounded-xl text-[13px] leading-tight tracking-[-0.01em] break-keep'

const GovernanceCross = ({ root }: { root: OrgUnit }) => {
  const children = root.children

  return (
    <div className="w-full grid grid-cols-3 gap-1.5 items-center">
      <span
        style={{ gridColumn: 2, gridRow: 1 }}
        className={`${BOX_BASE} org-gov-box font-bold bg-brand text-white shadow-[0_2px_12px_var(--brand-glow)]`}
      >
        {root.name}
      </span>

      {children.map((child, index) => {
        const slot = governanceSlot(index, children.length)
        // 가운데 열은 원본에서도 톤이 진하다 — 옆으로 뻗은 당회·구역회보다 한 단계 강조
        const isCenterColumn = slot.gridColumn === 2
        return (
          <span
            key={child.id}
            style={slot}
            // 배경 사진 위에 얹히므로 면 색은 CSS(.org-gov-box.is-sub)가 2겹으로 깐다
            className={`${BOX_BASE} org-gov-box is-sub ${
              isCenterColumn
                ? 'is-center font-semibold border border-[var(--brand-glow)] text-brand'
                : 'font-medium border border-[var(--brand-soft-strong)] text-brand'
            }`}
          >
            {child.name}
          </span>
        )
      })}
    </div>
  )
}

const GovernanceBand = ({ units }: { units: OrgUnit[] }) => {
  if (units.length === 0) return null

  /* 지금 계절이 밴드 뒤의 사진·색 기운·앰비언트를 함께 정한다 */
  const season = getNaturalSeason(new Date())
  const chip = SEASON_CHIP[season]
  const particle = SEASON_PARTICLE[season]

  return (
    <section className="px-4 pt-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
          의결기구
        </p>
        <span className="org-season-chip">
          <span aria-hidden>{chip.glyph}</span>
          {chip.label}
        </span>
      </div>
      <div
        className={`${cardClass} org-gov-card px-4 py-4`}
        data-season={season}
        style={
          { '--org-season-image': `url(${SEASON_IMAGE[season]})` } as React.CSSProperties
        }
      >
        {/* 계절 배경 레이어 — 사진(블러·저채도) + 계절 색 기운 + 앰비언트 */}
        <span className="org-gov-scene" aria-hidden>
          <span className="org-gov-photo" />
          <span className="org-gov-wash" />
          {particle &&
            PARTICLES.map((p, i) => (
              <span
                key={i}
                className="org-gov-particle"
                style={
                  {
                    left: p.left,
                    fontSize: p.size,
                    '--fall-delay': p.delay,
                    '--fall-duration': p.duration,
                    '--fall-drift': p.drift,
                    '--fall-opacity': p.opacity,
                  } as React.CSSProperties
                }
              >
                {particle}
              </span>
            ))}
        </span>
        <CardSheen />
        <div className="relative z-10 space-y-4">
          {units.map(root => (
            <GovernanceCross key={root.id} root={root} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 위원회 카드 ───────────────────────────────────────────────────────

const DepartmentChip = ({ unit }: { unit: OrgUnit }) => (
  <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.05] text-[12.5px] text-gray-700 dark:text-white/70">
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
        <span className="w-1.5 h-8 rounded-full bg-brand shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
            {committee.name}
          </span>
          <span className="block text-[11.5px] text-gray-400 dark:text-white/35 mt-0.5">
            {bureaus.length > 0 && `${bureaus.map(b => b.name).join(' · ')} · `}
            부서 {departmentCount}
          </span>
        </span>
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
              <span className="inline-block px-2.5 py-1 rounded-lg bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand text-[12px] font-bold mb-2">
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
            <p className="mt-2.5 text-[13px] text-gray-500 dark:text-white/50">
              위원회 <span className="font-bold text-brand">{data.committee_count}</span>개 · 부서{' '}
              <span className="font-bold text-brand">{data.department_count}</span>개
            </p>
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
              className="w-full pl-10 pr-9 py-2.5 text-[13.5px] rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
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
