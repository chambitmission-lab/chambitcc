// 선거 만들기/고치기 — ① 선거 정보·당선 기준 ② 후보(사진·기호) ③ 선거인 명부.
//
// 기준의 기본값은 서버(election_rules.DEFAULT_RULES)에서 받아 온다 — 이 화면에는 숫자를
// 박아 두지 않는다. 투표가 시작된 뒤에는 후보를 넣고 뺄 수 없고(이름·사진 오타만),
// 이미 투표한 선거인은 명부에서 뺄 수 없다(서버가 거절한다).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { uploadCandidatePhoto } from '../../../api/election'
import { getUserList } from '../../../api/user'
import { useDefaultElectionRules, useSaveElection } from '../../../hooks/useElections'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'
import type {
  ElectionAdminDetail,
  ElectionRules,
  ResultVisibility,
  RunoffRule,
} from '../../../types/election'
import {
  RUNOFF_META,
  THRESHOLD_PRESETS,
  VISIBILITY_META,
  inputCls,
  labelCls,
  matchPreset,
  thresholdText,
} from '../../Election/electionShared'
import { CloseButton, Stepper } from './SeatEventComposer'

interface CandidateDraft {
  key: string
  id?: number
  name: string
  bio: string
  photo_url: string | null
  uploading?: boolean
}

let draftSeq = 0
const newDraft = (): CandidateDraft => ({ key: `new-${++draftSeq}`, name: '', bio: '', photo_url: null })

const chipBtn = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-[12.5px] font-bold border transition-colors ${
    active
      ? 'bg-brand text-white border-transparent'
      : 'border-gray-200 dark:border-white/[0.1] text-ink-muted hover:border-brand hover:text-brand'
  }`

const StepTitle = ({ n, children, aside }: { n: number; children: string; aside?: string }) => (
  <div className="flex items-center gap-2">
    <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-extrabold flex items-center justify-center">{n}</span>
    <h3 className="text-[14px] font-extrabold text-ink-strong tracking-[-0.02em]">{children}</h3>
    {aside ? <span className="ml-auto text-[12px] font-semibold text-ink-muted tabular-nums">{aside}</span> : null}
  </div>
)

/** 작은 숫자 입력 — 비율의 분자·분모처럼 Stepper 로 누르기엔 범위가 넓은 값 */
const NumberBox = ({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) => (
  <input
    value={value}
    inputMode="numeric"
    onChange={(e) => {
      const n = Number(e.target.value.replace(/\D/g, ''))
      onChange(Math.max(min, Math.min(max, n || min)))
    }}
    className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-center text-[14px] font-bold text-ink-strong tabular-nums focus:outline-none focus:border-brand"
  />
)

interface Props {
  election?: ElectionAdminDetail | null
  onClose: () => void
  onSaved: () => void
}

const ElectionComposer = ({ election, onClose, onSaved }: Props) => {
  useModalBackButton(onClose)

  const { data: defaultRules } = useDefaultElectionRules(!election)
  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', 'election-roster'],
    queryFn: getUserList,
    staleTime: 1000 * 60,
  })

  const [title, setTitle] = useState(election?.title ?? '')
  const [description, setDescription] = useState(election?.description ?? '')
  const [notice, setNotice] = useState(election?.notice ?? '')
  const [seats, setSeats] = useState(election?.seats ?? 1)
  const [offlineCount, setOfflineCount] = useState(election?.offline_voter_count ?? 0)
  const [rules, setRules] = useState<ElectionRules | null>(election?.rules ?? null)
  const [customThreshold, setCustomThreshold] = useState(election ? matchPreset(election.rules) === 'custom' : false)
  const [candidates, setCandidates] = useState<CandidateDraft[]>(
    election?.candidates.map((c) => ({
      key: `c-${c.id}`,
      id: c.id,
      name: c.name,
      bio: c.bio ?? '',
      photo_url: c.photo_url ?? null,
    })) ?? [newDraft(), newDraft()]
  )
  const [voterIds, setVoterIds] = useState<Set<number>>(new Set(election?.voters.map((v) => v.user_id) ?? []))
  const [search, setSearch] = useState('')
  const [onlySelected, setOnlySelected] = useState(false)

  // 새 선거: 서버 기본 기준이 도착하면 폼의 출발값으로
  useEffect(() => {
    if (!rules && defaultRules) setRules(defaultRules)
  }, [rules, defaultRules])

  const candidatesLocked = !!election && !election.can_edit_candidates
  const votedIds = useMemo(
    () => new Set(election?.voters.filter((v) => v.has_voted).map((v) => v.user_id) ?? []),
    [election]
  )
  const hasOpenRound = election?.current_round_status === 'open'

  const patchRules = (patch: Partial<ElectionRules>) => setRules((prev) => (prev ? { ...prev, ...patch } : prev))

  // ── 후보 ────────────────────────────────────────────────────────────

  const patchCandidate = (key: string, patch: Partial<CandidateDraft>) =>
    setCandidates((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)))

  const moveCandidate = (index: number, dir: -1 | 1) =>
    setCandidates((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const fileInput = useRef<HTMLInputElement>(null)
  const uploadFor = useRef<string | null>(null)

  const pickPhoto = (key: string) => {
    uploadFor.current = key
    fileInput.current?.click()
  }

  const onPhotoPicked = async (file?: File) => {
    const key = uploadFor.current
    if (!file || !key) return
    patchCandidate(key, { uploading: true })
    try {
      patchCandidate(key, { photo_url: await uploadCandidatePhoto(file), uploading: false })
    } catch (e) {
      patchCandidate(key, { uploading: false })
      showToast(e instanceof Error ? e.message : '사진 업로드에 실패했습니다', 'error')
    }
  }

  // ── 선거인 명부 ─────────────────────────────────────────────────────

  const users = useMemo(
    () =>
      (userData?.users ?? [])
        .filter((u) => (u.is_active && u.approval_status === 'approved') || voterIds.has(u.id))
        .map((u) => ({ id: u.id, name: u.full_name || u.username, username: u.username }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    // voterIds 는 처음 명부에 있던 비활성 회원을 목록에 남기려는 것이라 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userData]
  )

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(
      (u) =>
        (!onlySelected || voterIds.has(u.id)) &&
        (!q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    )
  }, [users, search, onlySelected, voterIds])

  const toggleVoter = (id: number) =>
    setVoterIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const setVisible = (checked: boolean) =>
    setVoterIds((prev) => {
      const next = new Set(prev)
      visibleUsers.forEach((u) => {
        if (checked) next.add(u.id)
        else if (!votedIds.has(u.id)) next.delete(u.id)
      })
      return next
    })

  // ── 저장 ────────────────────────────────────────────────────────────

  const save = useSaveElection({
    onSuccess: () => {
      showToast(election ? '선거를 저장했어요' : '선거를 만들었어요. 준비가 되면 투표를 시작하세요', 'success')
      onSaved()
    },
    onError: (e) => showToast(e.message, 'error'),
  })

  const submit = () => {
    if (!rules) return
    if (!title.trim()) return showToast('선거 이름을 입력해주세요', 'error')
    const filled = candidates.filter((c) => c.name.trim())
    if (!filled.length) return showToast('후보를 한 명 이상 등록해주세요', 'error')
    if (candidates.some((c) => c.uploading)) return showToast('사진 업로드가 끝난 뒤 저장해주세요', 'error')
    if (rules.threshold_num > rules.threshold_den) return showToast('당선 기준 비율이 1을 넘을 수 없어요', 'error')

    save.mutate({
      id: election?.id,
      data: {
        title: title.trim(),
        description: description.trim() || null,
        notice: notice.trim() || null,
        seats,
        offline_voter_count: offlineCount,
        rules,
        candidates: filled.map((c) => ({
          id: c.id,
          name: c.name.trim(),
          bio: c.bio.trim() || null,
          photo_url: c.photo_url,
        })),
        voter_ids: [...voterIds],
      },
    })
  }

  const presetKey = rules ? (customThreshold ? 'custom' : matchPreset(rules)) : ''
  const exampleBase = rules?.threshold_basis === 'voters' ? voterIds.size + offlineCount : 100

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-3xl lg:max-w-[1320px] max-h-[94vh] sm:max-h-[92vh] lg:h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {election ? '선거 수정' : '새 선거'}
            </h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* 모바일은 한 줄로 쌓고, PC(lg)는 3칸 — ① 정보·기준 | ② 후보 | ③ 명부. 칸마다 따로 스크롤한다 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 lg:overflow-hidden lg:p-0 lg:space-y-0 lg:grid lg:grid-cols-[400px_minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)] lg:min-h-0">
          {/* ① 선거 정보 · 당선 기준 */}
          <div className="space-y-5 lg:overflow-y-auto lg:px-5 lg:py-4 lg:border-r lg:border-black/[0.05] dark:lg:border-white/[0.06]">
            <section className="space-y-3">
              <StepTitle n={1}>선거 정보</StepTitle>
              <div>
                <label className={labelCls}>선거 이름</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 2026 장로 선출" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>소개 (선택)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="선거의 취지를 적어주세요" className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>투표 안내 (선택)</label>
                <textarea value={notice} onChange={(e) => setNotice(e.target.value)} rows={2} placeholder="예) 공동의회 중 안내에 따라 투표해 주세요" className={`${inputCls} resize-none`} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13.5px] font-bold text-ink-strong">선출 인원</p>
                  <p className="text-[11.5px] text-ink-muted">이 선거로 뽑을 사람 수</p>
                </div>
                <Stepper value={seats} min={1} max={50} onChange={setSeats} suffix="명" />
              </div>
            </section>

            {rules ? (
              <section className="space-y-4">
                <StepTitle n={2}>당선 기준</StepTitle>

                <div>
                  <label className={labelCls}>득표 기준</label>
                  <div className="flex flex-wrap gap-1.5">
                    {THRESHOLD_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setCustomThreshold(false)
                          patchRules(p.rules)
                        }}
                        className={chipBtn(presetKey === p.key)}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button type="button" onClick={() => setCustomThreshold(true)} className={chipBtn(presetKey === 'custom')}>
                      직접 입력
                    </button>
                  </div>
                  {presetKey === 'custom' ? (
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <NumberBox value={rules.threshold_num} min={1} max={100} onChange={(v) => patchRules({ threshold_num: v })} />
                      <span className="text-[15px] font-bold text-ink-muted">/</span>
                      <NumberBox value={rules.threshold_den} min={1} max={100} onChange={(v) => patchRules({ threshold_den: v })} />
                      <div className="flex gap-1.5 ml-1">
                        <button type="button" onClick={() => patchRules({ threshold_comparison: 'gte' })} className={chipBtn(rules.threshold_comparison === 'gte')}>이상</button>
                        <button type="button" onClick={() => patchRules({ threshold_comparison: 'gt' })} className={chipBtn(rules.threshold_comparison === 'gt')}>초과</button>
                      </div>
                      <p className="w-full text-[11.5px] text-ink-muted">예) 100명 중 90표 이상 → 9 / 10 이상</p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className={labelCls}>무엇의 비율인가요</label>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => patchRules({ threshold_basis: 'ballots' })} className={chipBtn(rules.threshold_basis === 'ballots')}>투표수 (투표한 사람)</button>
                    <button type="button" onClick={() => patchRules({ threshold_basis: 'voters' })} className={chipBtn(rules.threshold_basis === 'voters')}>재적 선거인 전체</button>
                  </div>
                </div>

                <p className="px-3 py-2.5 rounded-xl bg-[var(--brand-soft)] text-[12.5px] text-ink leading-relaxed break-keep">
                  <b className="text-brand">{thresholdText(rules)}</b> 득표하면 당선이에요.
                  {exampleBase > 0 ? (
                    <>
                      {' '}
                      {rules.threshold_basis === 'voters' ? `재적 ${exampleBase}명이면` : `${exampleBase}명이 투표하면`}{' '}
                      <b className="tabular-nums">
                        {rules.threshold_comparison === 'gt'
                          ? Math.floor((exampleBase * rules.threshold_num) / rules.threshold_den) + 1
                          : Math.ceil((exampleBase * rules.threshold_num) / rules.threshold_den)}
                        표
                      </b>
                      가 필요해요.
                    </>
                  ) : null}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-ink-strong">한 표에 고를 수 있는 인원</p>
                    <p className="text-[11.5px] text-ink-muted break-keep">
                      {rules.max_select == null ? '남은 자리 수만큼 (1차는 선출 인원, 2차는 남은 자리)' : '정한 인원까지'}
                    </p>
                  </div>
                  {rules.max_select == null ? (
                    <button type="button" onClick={() => patchRules({ max_select: Math.max(1, seats) })} className={chipBtn(false)}>직접 정하기</button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Stepper value={rules.max_select} min={1} max={50} onChange={(v) => patchRules({ max_select: v })} suffix="명" />
                      <button type="button" onClick={() => patchRules({ max_select: null })} className="text-[12px] font-semibold text-ink-muted hover:text-brand">자동</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelCls}>자리가 남으면 — 다음 회차 후보</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(RUNOFF_META) as RunoffRule[]).map((key) => (
                      <button key={key} type="button" onClick={() => patchRules({ runoff_rule: key })} className={chipBtn(rules.runoff_rule === key)}>
                        {RUNOFF_META[key].label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-ink-muted break-keep">
                    {RUNOFF_META[rules.runoff_rule].hint}. 회차를 열 때 후보를 직접 고칠 수도 있어요.
                  </p>
                  {rules.runoff_rule === 'top_multiple' ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[12.5px] text-ink">남은 자리의</span>
                      <Stepper value={rules.runoff_multiple} min={1} max={10} onChange={(v) => patchRules({ runoff_multiple: v })} suffix="배" />
                    </div>
                  ) : rules.runoff_rule === 'min_share' ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[12.5px] text-ink">투표수의</span>
                      <NumberBox value={rules.runoff_min_num} min={0} max={100} onChange={(v) => patchRules({ runoff_min_num: v })} />
                      <span className="text-[15px] font-bold text-ink-muted">/</span>
                      <NumberBox value={rules.runoff_min_den} min={1} max={100} onChange={(v) => patchRules({ runoff_min_den: v })} />
                      <span className="text-[12.5px] text-ink">이상</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className={labelCls}>성도 화면에 결과 공개</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(VISIBILITY_META) as ResultVisibility[]).map((key) => (
                      <button key={key} type="button" onClick={() => patchRules({ result_visibility: key })} className={chipBtn(rules.result_visibility === key)}>
                        {VISIBILITY_META[key].label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-ink-muted break-keep">
                    {VISIBILITY_META[rules.result_visibility].hint}. 관리자 현황판에는 늘 실시간으로 보여요.
                  </p>
                </div>

                {hasOpenRound ? (
                  <p className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed break-keep">
                    지금 투표가 진행 중이에요. 표가 한 장이라도 들어온 회차의 당선 기준은 바뀌지 않고, 고친 기준은 다음 회차부터 적용돼요. (결과 공개 범위는 바로 적용)
                  </p>
                ) : null}
              </section>
            ) : (
              <p className="text-[13px] text-ink-muted">기본 기준을 불러오는 중…</p>
            )}
          </div>

          {/* ② 후보 */}
          <div className="space-y-3 lg:overflow-y-auto lg:px-5 lg:py-4 lg:border-r lg:border-black/[0.05] dark:lg:border-white/[0.06]">
            <StepTitle n={3} aside={`${candidates.filter((c) => c.name.trim()).length}명`}>후보</StepTitle>
            <p className="text-[12px] text-ink-muted break-keep">
              {candidatesLocked
                ? '투표가 시작되어 후보를 넣고 뺄 수 없어요. 이름·사진·소개만 고칠 수 있어요.'
                : '위에서부터 기호 1번이에요. 화살표로 순서를 바꾸세요.'}
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                void onPhotoPicked(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <div className="space-y-2.5">
              {candidates.map((c, i) => (
                <div key={c.key} className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06]">
                  <span className="shrink-0 mt-1 w-6 h-6 rounded-full bg-ink-strong text-white dark:bg-white dark:text-[#16161d] text-[11.5px] font-extrabold flex items-center justify-center tabular-nums">
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => pickPhoto(c.key)}
                    disabled={c.uploading}
                    className="shrink-0 relative w-[68px] h-[85px] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.05] border border-dashed border-gray-300 dark:border-white/[0.15] flex items-center justify-center text-[11px] font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors"
                    aria-label="후보 사진 올리기"
                  >
                    {c.photo_url ? <img src={c.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover" /> : null}
                    {c.uploading ? (
                      <span className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      </span>
                    ) : !c.photo_url ? (
                      '사진'
                    ) : null}
                  </button>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <input value={c.name} onChange={(e) => patchCandidate(c.key, { name: e.target.value })} placeholder="이름" maxLength={100} className={inputCls} />
                    <input value={c.bio} onChange={(e) => patchCandidate(c.key, { bio: e.target.value })} placeholder="한 줄 소개 (예: 안수집사 · 재정부)" maxLength={300} className={inputCls} />
                    {c.photo_url ? (
                      <button type="button" onClick={() => patchCandidate(c.key, { photo_url: null })} className="text-[11.5px] font-semibold text-ink-muted hover:text-red-500">
                        사진 지우기
                      </button>
                    ) : null}
                  </div>
                  {!candidatesLocked ? (
                    <div className="shrink-0 flex flex-col items-center gap-0.5 text-ink-muted">
                      <button type="button" onClick={() => moveCandidate(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand disabled:opacity-25" aria-label="위로">▲</button>
                      <button type="button" onClick={() => moveCandidate(i, 1)} disabled={i === candidates.length - 1} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand disabled:opacity-25" aria-label="아래로">▼</button>
                      <button type="button" onClick={() => setCandidates((prev) => prev.filter((x) => x.key !== c.key))} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-red-500" aria-label="후보 삭제">✕</button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {!candidatesLocked ? (
              <button
                type="button"
                onClick={() => setCandidates((prev) => [...prev, newDraft()])}
                className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-[13px] font-bold text-ink-muted hover:border-brand hover:text-brand transition-colors"
              >
                + 후보 추가
              </button>
            ) : null}
          </div>

          {/* ③ 선거인 명부 */}
          <div className="space-y-3 lg:flex lg:flex-col lg:space-y-0 lg:gap-3 lg:min-h-0 lg:px-5 lg:py-4">
            <StepTitle n={4} aside={`앱 ${voterIds.size}명 + 종이 ${offlineCount}명`}>선거인 명부</StepTitle>
            <p className="text-[12px] text-ink-muted break-keep">
              여기서 고른 성도만 투표할 수 있어요. 다른 성도에게는 선거가 보이지 않아요.
            </p>
            <div className="flex items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름으로 찾기" className={inputCls} />
              <button type="button" onClick={() => setOnlySelected((v) => !v)} className={`shrink-0 ${chipBtn(onlySelected)}`}>
                고른 사람만
              </button>
            </div>
            <div className="flex items-center justify-between text-[12px] font-semibold text-ink-muted">
              <span className="tabular-nums">{visibleUsers.length}명 표시</span>
              <span className="flex gap-3">
                <button type="button" onClick={() => setVisible(true)} className="hover:text-brand">보이는 사람 모두 선택</button>
                <button type="button" onClick={() => setVisible(false)} className="hover:text-brand">해제</button>
              </span>
            </div>
            <div className="max-h-[320px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] divide-y divide-gray-100 dark:divide-white/[0.05]">
              {usersLoading ? (
                <p className="px-4 py-8 text-center text-[13px] text-ink-muted">회원 목록을 불러오는 중…</p>
              ) : !visibleUsers.length ? (
                <p className="px-4 py-8 text-center text-[13px] text-ink-muted">해당하는 회원이 없어요</p>
              ) : (
                visibleUsers.map((u) => {
                  const checked = voterIds.has(u.id)
                  const locked = votedIds.has(u.id)
                  return (
                    <label key={u.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${locked ? 'opacity-60' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked}
                        onChange={() => toggleVoter(u.id)}
                        className="w-[18px] h-[18px] accent-[var(--brand)]"
                      />
                      <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink-strong truncate">{u.name}</span>
                      <span className="shrink-0 text-[11.5px] text-ink-muted truncate max-w-[40%]">
                        {locked ? '투표함' : u.username}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink-strong">앱을 안 쓰는 선거인</p>
                <p className="text-[11.5px] text-ink-muted break-keep">종이로 투표할 분들 — 재적 수에 더해져요</p>
              </div>
              <Stepper value={offlineCount} min={0} max={9999} onChange={setOfflineCount} suffix="명" />
            </div>
          </div>
        </div>

        <div className="relative z-10 px-5 py-3.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2">
          <p className="hidden sm:block flex-1 text-[12px] text-ink-muted">
            {election ? '' : '저장하면 ‘준비 중’으로 만들어져요. 투표 시작은 현황판에서 눌러요.'}
          </p>
          <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[14px] font-semibold text-ink">
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={save.isPending || !rules}
            className="flex-[2] sm:flex-none px-7 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold disabled:opacity-50"
          >
            {save.isPending ? '저장하는 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ElectionComposer
