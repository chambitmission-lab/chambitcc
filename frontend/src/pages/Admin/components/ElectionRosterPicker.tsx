// 선거인 명부 고르기·선관위원 지정 — 선거 편집기(ElectionComposer)와 공동의회 편집기(AssemblyComposer)가 함께 쓴다.
//
// 명부는 직분·구역·나이로 거르고, 지난 선거 명부를 불러오거나 이름 명단을 붙여 넣어 채운다.
// 평소에는 '이름으로 찾기'와 목록만 보인다 — 조건 좁히기·명단 불러오기는 눌렀을 때만 펼친다.
// 회원 목록(roster-pool)에는 동명이인을 가를 단서(직분·구역·출생 연도·전화 끝자리)가 함께 온다.
// RosterPicker 는 감싸는 칸 없이 조각(fragment)으로 그린다 — 부모의 세로 flex 칸 안에서 목록이 남은 높이를 채운다.
import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { getElectionAdmin } from '../../../api/election'
import { showToast } from '../../../utils/toast'
import type { ElectionSummary, RosterPoolMember } from '../../../types/election'
import { chipBtn, inputCls, memberHint } from '../../Election/electionShared'

const AGE_LIMITS = [0, 18, 20] as const
const NO_TITLE = '(직분 없음)'

/** 붙여 넣은 명단 → 이름 목록 (줄·쉼표·탭으로 나눔, 앞 번호 제거) */
const parseNames = (text: string) =>
  text
    .split(/[\n,\t;]+/)
    .map((t) => t.replace(/^\s*\d+[.)\s]*/, '').trim())
    .filter(Boolean)

type IdSetter = Dispatch<SetStateAction<Set<number>>>

interface RosterPickerProps {
  /** 고를 수 있는 사람 — 이름순 */
  users: RosterPoolMember[]
  loading?: boolean
  selected: Set<number>
  setSelected: IdSetter
  /** 이미 투표해 뺄 수 없는 사람 */
  lockedIds?: Set<number>
  /** 명부를 불러올 지난 선거 — 비우면 불러오기 칩을 감춘다 */
  pastElections?: ElectionSummary[]
  /** 이름 명단 붙여넣기 — 공동의회 명부에서 빼기만 하는 화면에서는 끈다 */
  allowPaste?: boolean
  /** 체크 해제된 줄 오른쪽에 붙일 말 (예: '제외') */
  uncheckedLabel?: string
}

export const RosterPicker = ({
  users,
  loading = false,
  selected,
  setSelected,
  lockedIds,
  pastElections = [],
  allowPaste = true,
  uncheckedLabel,
}: RosterPickerProps) => {
  const [search, setSearch] = useState('')
  const [onlySelected, setOnlySelected] = useState(false)
  const [titleFilter, setTitleFilter] = useState<Set<string>>(new Set())
  const [districtFilter, setDistrictFilter] = useState<Set<string>>(new Set())
  const [minAge, setMinAge] = useState<number>(0)
  // 접어 두는 도구 두 가지 — 한 번에 하나만 편다
  const [panel, setPanel] = useState<'filter' | 'import' | null>(null)
  const togglePanel = (key: 'filter' | 'import') => setPanel((p) => (p === key ? null : key))
  const [pasteText, setPasteText] = useState('')
  const [pasteReport, setPasteReport] = useState<{ added: number; ambiguous: string[]; missing: string[] } | null>(null)
  const [importingFrom, setImportingFrom] = useState<number | null>(null)

  const titleOptions = useMemo(() => {
    const set = new Set(users.map((u) => u.church_title || NO_TITLE))
    return [...set].sort((a, b) => (a === NO_TITLE ? 1 : b === NO_TITLE ? -1 : a.localeCompare(b, 'ko')))
  }, [users])
  const districtOptions = useMemo(
    () => [...new Set(users.map((u) => u.district).filter((d): d is string => !!d))].sort((a, b) => a.localeCompare(b, 'ko')),
    [users]
  )
  const thisYear = new Date().getFullYear()

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(
      (u) =>
        (!onlySelected || selected.has(u.id)) &&
        (!titleFilter.size || titleFilter.has(u.church_title || NO_TITLE)) &&
        (!districtFilter.size || (u.district != null && districtFilter.has(u.district))) &&
        // 나이는 아는 사람만 거른다 — 출생 연도를 모르는 분은 남기고 아래에 따로 알린다
        (!minAge || !u.birth_year || thisYear - u.birth_year >= minAge) &&
        (!q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    )
  }, [users, search, onlySelected, selected, titleFilter, districtFilter, minAge, thisYear])
  const unknownAge = minAge ? visibleUsers.filter((u) => !u.birth_year).length : 0
  const filterCount = titleFilter.size + districtFilter.size + (minAge ? 1 : 0)
  const clearFilters = () => {
    setTitleFilter(new Set())
    setDistrictFilter(new Set())
    setMinAge(0)
  }
  const canImport = allowPaste || pastElections.length > 0

  const toggleIn = (setter: typeof setTitleFilter, value: string) =>
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  // 지난 선거 명부 더하기 — 지우지 않고 합친다
  const importRoster = async (id: number) => {
    try {
      setImportingFrom(id)
      const past = await getElectionAdmin(id)
      const known = new Set(users.map((u) => u.id))
      const fresh = past.voters.filter((v) => known.has(v.user_id) && !selected.has(v.user_id))
      setSelected((prev) => new Set([...prev, ...fresh.map((v) => v.user_id)]))
      showToast(`'${past.title}' 명부에서 ${fresh.length}명을 더했어요`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '명부를 불러오지 못했어요', 'error')
    } finally {
      setImportingFrom(null)
    }
  }

  // 붙여 넣은 이름 명단 맞추기 — 이름이 하나뿐이면 넣고, 동명이인·없는 이름은 따로 알린다
  const applyPaste = () => {
    const names = parseNames(pasteText)
    if (!names.length) return
    const byName = new Map<string, RosterPoolMember[]>()
    for (const u of users) byName.set(u.name, [...(byName.get(u.name) ?? []), u])
    const ambiguous: string[] = []
    const missing: string[] = []
    const picked: number[] = []
    for (const name of names) {
      const hits = byName.get(name) ?? []
      if (hits.length === 1) picked.push(hits[0].id)
      else if (hits.length > 1) ambiguous.push(name)
      else missing.push(name)
    }
    const before = selected.size
    const next = new Set([...selected, ...picked])
    setSelected(next)
    setPasteReport({ added: next.size - before, ambiguous: [...new Set(ambiguous)], missing: [...new Set(missing)] })
    setPasteText('')
  }

  // 동명이인은 검색창에 이름을 넣어 단서를 보고 직접 고른다
  const showAmbiguous = (name: string) => {
    setSearch(name)
    setOnlySelected(false)
    clearFilters()
  }

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const setVisible = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      visibleUsers.forEach((u) => {
        if (checked) next.add(u.id)
        else if (!lockedIds?.has(u.id)) next.delete(u.id)
      })
      return next
    })

  return (
    <>
      <div className="flex items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름으로 찾기" className={inputCls} />
        <button type="button" onClick={() => setOnlySelected((v) => !v)} className={`shrink-0 ${chipBtn(onlySelected)}`}>
          고른 사람만
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => togglePanel('filter')} aria-expanded={panel === 'filter'} className={chipBtn(panel === 'filter')}>
          직분·구역·나이로 좁히기{filterCount ? ` (${filterCount})` : ''}
        </button>
        {canImport ? (
          <button type="button" onClick={() => togglePanel('import')} aria-expanded={panel === 'import'} className={chipBtn(panel === 'import')}>
            명단 불러오기
          </button>
        ) : null}
        {filterCount && panel !== 'filter' ? (
          <button type="button" onClick={clearFilters} className="text-[12px] font-bold text-brand underline underline-offset-2">
            조건 지우기
          </button>
        ) : null}
      </div>
      {canImport && panel === 'import' ? (
        <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.08] p-3 space-y-2">
          {pastElections.length ? (
            <div>
              <p className="mb-1.5 text-[11.5px] font-bold text-ink-muted">지난 선거 명부 더하기</p>
              <div className="flex flex-wrap gap-1.5">
                {pastElections.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => void importRoster(e.id)}
                    disabled={importingFrom !== null}
                    className={chipBtn(false)}
                    title="이 선거의 명부를 지금 명부에 더해요"
                  >
                    {importingFrom === e.id ? '불러오는 중…' : `+ ${e.title}`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {allowPaste ? (
            <>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={4}
                placeholder={'엑셀·한글에서 이름 열을 복사해 붙여 넣으세요\n김하나\n이두리, 박세찬'}
                className={`${inputCls} resize-none`}
              />
              <button
                type="button"
                onClick={applyPaste}
                disabled={!pasteText.trim()}
                className="w-full py-2 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-50"
              >
                이름 맞춰서 명부에 넣기
              </button>
            </>
          ) : null}
          {pasteReport ? (
            <div className="text-[12px] leading-relaxed text-ink break-keep">
              <p className="font-bold text-emerald-600 dark:text-emerald-300">{pasteReport.added}명을 넣었어요</p>
              {pasteReport.ambiguous.length ? (
                <p className="mt-1">
                  동명이인이라 직접 골라 주세요:{' '}
                  {pasteReport.ambiguous.map((n) => (
                    <button key={n} type="button" onClick={() => showAmbiguous(n)} className="mr-1.5 font-bold text-brand underline">
                      {n}
                    </button>
                  ))}
                </p>
              ) : null}
              {pasteReport.missing.length ? (
                <p className="mt-1 text-ink-muted">
                  회원이 아닌 이름 {pasteReport.missing.length}명: {pasteReport.missing.join(', ')} — 앱을 안 쓰는 분이면 아래 &lsquo;앱을 안 쓰는 선거인&rsquo; 수에 더해 주세요.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {panel === 'filter' ? (
        <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.08] p-3 space-y-2">
          {titleOptions.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              <span className="self-center text-[11.5px] font-bold text-ink-muted mr-0.5">직분</span>
              {titleOptions.map((t) => (
                <button key={t} type="button" onClick={() => toggleIn(setTitleFilter, t)} className={chipBtn(titleFilter.has(t))}>
                  {t}
                </button>
              ))}
            </div>
          ) : null}
          {districtOptions.length ? (
            <div className="flex flex-wrap gap-1.5">
              <span className="self-center text-[11.5px] font-bold text-ink-muted mr-0.5">구역</span>
              {districtOptions.map((d) => (
                <button key={d} type="button" onClick={() => toggleIn(setDistrictFilter, d)} className={chipBtn(districtFilter.has(d))}>
                  {d}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-[11.5px] font-bold text-ink-muted mr-0.5">나이</span>
            {AGE_LIMITS.map((age) => (
              <button key={age} type="button" onClick={() => setMinAge(age)} className={chipBtn(minAge === age)}>
                {age ? `${age}세 이상` : '제한 없음'}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {unknownAge ? (
        <p className="text-[11.5px] text-amber-700 dark:text-amber-300 break-keep">
          출생 연도를 모르는 {unknownAge}명은 나이와 상관없이 목록에 남아 있어요. 확인 후 골라 주세요.
        </p>
      ) : null}
      <div className="flex items-center justify-between text-[12px] font-semibold text-ink-muted">
        <span className="tabular-nums">{visibleUsers.length}명 표시</span>
        <span className="flex gap-3">
          <button type="button" onClick={() => setVisible(true)} className="hover:text-brand">보이는 사람 모두 선택</button>
          <button type="button" onClick={() => setVisible(false)} className="hover:text-brand">해제</button>
        </span>
      </div>
      <div className="max-h-[320px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] divide-y divide-gray-100 dark:divide-white/[0.05]">
        {loading ? (
          <p className="px-4 py-8 text-center text-[13px] text-ink-muted">회원 목록을 불러오는 중…</p>
        ) : !visibleUsers.length ? (
          <p className="px-4 py-8 text-center text-[13px] text-ink-muted">해당하는 회원이 없어요</p>
        ) : (
          visibleUsers.map((u) => {
            const checked = selected.has(u.id)
            const locked = !!lockedIds?.has(u.id)
            return (
              <label key={u.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${locked ? 'opacity-60' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  onChange={() => toggle(u.id)}
                  className="w-[18px] h-[18px] accent-[var(--brand)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink-strong truncate">{u.name}</span>
                  {memberHint(u) ? (
                    <span className="block text-[11.5px] text-ink-muted truncate">{memberHint(u)}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[11.5px] text-ink-muted truncate max-w-[30%]">
                  {locked ? '투표함' : !checked && uncheckedLabel ? uncheckedLabel : u.username}
                </span>
              </label>
            )
          })
        )}
      </div>
    </>
  )
}

interface ManagerPickerProps {
  users: RosterPoolMember[]
  managerIds: Set<number>
  setManagerIds: IdSetter
}

/** 선거관리위원 — 이름으로 찾아 지정하고, 칩을 눌러 해제한다 */
export const ManagerPicker = ({ users, managerIds, setManagerIds }: ManagerPickerProps) => {
  const [search, setSearch] = useState('')
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return users.filter((u) => !managerIds.has(u.id) && u.name.toLowerCase().includes(q)).slice(0, 6)
  }, [users, search, managerIds])

  return (
    <>
      {managerIds.size ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {users
            .filter((u) => managerIds.has(u.id))
            .map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setManagerIds((prev) => new Set([...prev].filter((x) => x !== u.id)))}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-bold"
                aria-label={`${u.name} 선관위원 해제`}
              >
                {u.name} <span aria-hidden>✕</span>
              </button>
            ))}
        </div>
      ) : null}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="이름으로 찾아 지정"
        className={`${inputCls} mt-2`}
      />
      {matches.length ? (
        <div className="mt-1.5 rounded-xl border border-gray-200/70 dark:border-white/[0.06] divide-y divide-gray-100 dark:divide-white/[0.05]">
          {matches.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                setManagerIds((prev) => new Set([...prev, u.id]))
                setSearch('')
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            >
              <span className="text-[13.5px] font-semibold text-ink-strong">{u.name}</span>
              <span className="min-w-0 truncate text-[11.5px] text-ink-muted">{memberHint(u)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}
