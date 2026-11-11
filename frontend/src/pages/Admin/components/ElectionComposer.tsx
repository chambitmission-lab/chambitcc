// 선거 만들기/고치기 — ① 선거 정보·선관위원·당선 기준 ② 후보(사진·기호) ③ 선거인 명부.
// 당선 기준은 ElectionRulesSection 이 그린다 — 평소엔 요약 한 덩어리, 고칠 때만 펼친다.
//
// 기준의 기본값은 서버(election_rules.DEFAULT_RULES)에서 받아 온다 — 이 화면에는 숫자를
// 박아 두지 않는다. 투표가 시작된 뒤에는 후보를 넣고 뺄 수 없고(이름·사진 오타만),
// 이미 투표한 선거인은 명부에서 뺄 수 없다(서버가 거절한다).
// 명부 고르기·선관위원 지정은 ElectionRosterPicker 가 그린다(공동의회 편집기와 함께 쓴다).
// 공동의회 소속 선거는 명부·선관위원을 공동의회에서 내려받고, 여기서는 '이 선거에서 제외'만 고른다.
// 어느 공동의회 소속인지는 만들기 흐름(ElectionNewChooser)이 정해서 넘겨 준다 — 이 화면에서는 고르지 않는다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Reorder, motion, useDragControls } from 'framer-motion'
import { uploadCandidatePhoto } from '../../../api/election'
import {
  useAdminElections,
  useDefaultElectionRules,
  useElectionAssembly,
  useElectionRosterPool,
  useElectionRulePresets,
  useSaveElection,
} from '../../../hooks/useElections'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'
import type {
  ElectionAdminDetail,
  ElectionRules,
  RosterPoolMember,
} from '../../../types/election'
import { inputCls, labelCls, presetForTitle } from '../../Election/electionShared'
import { ManagerPicker, RosterPicker } from './ElectionRosterPicker'
import ElectionRulesSection from './ElectionRulesSection'
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

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_CANDIDATES = 100 // 서버 스키마(ElectionCreate.candidates)의 상한
const BULK_UPLOAD_CONCURRENCY = 3

/** NFC 로 합친 파일 이름 — macOS 는 한글 파일명을 자모 분리(NFD)로 넘겨서, 그대로 쓰면
 *  눈에는 같은 '김민수'가 명부·이미 입력한 후보 이름과 다른 글자가 된다 */
const fileLabel = (file: File) => file.name.normalize('NFC')

/** 파일 이름 → 후보 이름. '1_김민수.jpg'·'김민수 (1).jpg' 처럼 붙은 기호·복사본 번호는 뗀다 */
const nameFromFile = (file: File) => {
  const base = fileLabel(file).replace(/\.[^.]+$/, '').trim()
  const name = base.replace(/^\d+[\s._\-)]*/, '').replace(/\s*\(\d+\)$/, '').trim()
  return (name || base).slice(0, 100)
}

const StepTitle = ({ n, children, aside }: { n: number; children: string; aside?: string }) => (
  <div className="flex items-center gap-2">
    <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-extrabold flex items-center justify-center">{n}</span>
    <h3 className="text-[14px] font-extrabold text-ink-strong tracking-[-0.02em]">{children}</h3>
    {aside ? <span className="ml-auto text-[12px] font-semibold text-ink-muted tabular-nums">{aside}</span> : null}
  </div>
)

interface CandidateRowProps {
  candidate: CandidateDraft
  index: number
  total: number
  locked: boolean
  onPatch: (patch: Partial<CandidateDraft>) => void
  onPickPhoto: () => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}

/**
 * 후보 한 줄 — 기호 아래 손잡이만 드래그 시작점(FavoritesPlaylistModal 의 PlaylistRow 와 같은 방식).
 * dragListener={false} 라 입력칸 글자 선택과 목록 스크롤은 그대로 동작한다.
 * 투표가 시작되면 후보 순서(기호)도 잠기므로 손잡이를 감춘다.
 */
const CandidateRow = ({ candidate: c, index, total, locked, onPatch, onPickPhoto, onMove, onRemove }: CandidateRowProps) => {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      as="div"
      value={c}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.015, zIndex: 20, boxShadow: '0 10px 26px rgba(0,0,0,0.18)' }}
      className="relative flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06]"
    >
      <div className="shrink-0 mt-1 flex flex-col items-center gap-1.5">
        <span className="w-6 h-6 rounded-full bg-ink-strong text-white dark:bg-white dark:text-[#16161d] text-[11.5px] font-extrabold flex items-center justify-center tabular-nums">
          {index + 1}
        </span>
        {!locked ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              dragControls.start(e)
            }}
            aria-label="순서 변경 (드래그)"
            className="w-7 h-9 -mx-0.5 grid place-items-center rounded-lg cursor-grab active:cursor-grabbing text-gray-300 dark:text-white/25 hover:text-gray-500 dark:hover:text-white/50 transition-colors touch-none"
          >
            <span className="material-icons-round text-[20px]">drag_indicator</span>
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onPickPhoto}
        disabled={c.uploading}
        className="shrink-0 relative w-[68px] h-[85px] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.05] border border-dashed border-gray-300 dark:border-white/[0.15] flex items-center justify-center text-[11px] font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors"
        aria-label="후보 사진 올리기"
      >
        {c.photo_url ? <img src={c.photo_url} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" /> : null}
        {c.uploading ? (
          <span className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </span>
        ) : !c.photo_url ? (
          '사진'
        ) : null}
      </button>
      <div className="min-w-0 flex-1 space-y-1.5">
        <input value={c.name} onChange={(e) => onPatch({ name: e.target.value })} placeholder="이름" maxLength={100} className={inputCls} />
        <input value={c.bio} onChange={(e) => onPatch({ bio: e.target.value })} placeholder="한 줄 소개 (예: 안수집사 · 재정부)" maxLength={300} className={inputCls} />
        {c.photo_url ? (
          <button type="button" onClick={() => onPatch({ photo_url: null })} className="text-[11.5px] font-semibold text-ink-muted hover:text-red-500">
            사진 지우기
          </button>
        ) : null}
      </div>
      {!locked ? (
        <div className="shrink-0 flex flex-col items-center gap-0.5 text-ink-muted">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand disabled:opacity-25" aria-label="위로">▲</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand disabled:opacity-25" aria-label="아래로">▼</button>
          <button type="button" onClick={onRemove} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-red-500" aria-label="후보 삭제">✕</button>
        </div>
      ) : null}
    </Reorder.Item>
  )
}

interface Props {
  election?: ElectionAdminDetail | null
  /** 새 선거를 이 공동의회 소속으로 시작한다 (명부·선관위원을 함께 쓴다) */
  assemblyId?: number | null
  onClose: () => void
  onSaved: (saved: ElectionAdminDetail) => void
}

const ElectionComposer = ({ election, assemblyId: presetAssemblyId, onClose, onSaved }: Props) => {
  useModalBackButton(onClose)

  const { data: defaultRules } = useDefaultElectionRules(!election)
  const { data: pool, isLoading: usersLoading } = useElectionRosterPool()
  const { data: allElections } = useAdminElections()
  const { data: presets } = useElectionRulePresets()
  const pastElections = useMemo(
    () => (allElections ?? []).filter((e) => e.id !== election?.id).slice(0, 6),
    [allElections, election?.id]
  )

  const [title, setTitle] = useState(election?.title ?? '')
  const [description, setDescription] = useState(election?.description ?? '')
  const [notice, setNotice] = useState(election?.notice ?? '')
  const [seats, setSeats] = useState(election?.seats ?? 1)
  const [offlineCount, setOfflineCount] = useState(election?.offline_voter_count ?? 0)
  const [rules, setRules] = useState<ElectionRules | null>(election?.rules ?? null)
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
  const [managerIds, setManagerIds] = useState<Set<number>>(new Set(election?.managers?.map((m) => m.user_id) ?? []))
  // 공동의회 소속 선거 — 만들 때만 정한다(고칠 때는 그대로). voterIds 는 '공동의회 명부 중 투표권이 있는 사람'이 된다
  const assemblyId = election ? (election.assembly_id ?? null) : (presetAssemblyId ?? null)
  const [offlineCustom, setOfflineCustom] = useState(election?.offline_custom ?? false)
  const { data: assembly } = useElectionAssembly(assemblyId)

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

  // 새 선거: 이름에 저장해 둔 기준의 이름(장로·권사 …)이 들어 있으면 그 기준으로 시작한다.
  // 기준을 한 번이라도 직접 만졌으면 더는 건드리지 않는다.
  // 이름을 고쳐 그 직분이 빠지면(장로 → 권사) 자동으로 넣었던 기준도 기본값으로 되돌린다 —
  // 안 그러면 '장로 기준' 표시와 함께 다른 직분 선거가 장로 기준으로 저장된다.
  const rulesTouched = useRef(false)
  const [autoNote, setAutoNote] = useState<string | null>(null)
  const changeTitle = (value: string) => {
    setTitle(value)
    if (election || rulesTouched.current) return
    const hit = presetForTitle(presets, value)
    if (hit) {
      if (hit.name !== autoNote) {
        setRules({ ...hit.rules })
        setAutoNote(hit.name)
      }
    } else if (autoNote) {
      if (defaultRules) setRules({ ...defaultRules })
      setAutoNote(null)
    }
  }
  const changeRules = (next: ElectionRules) => {
    rulesTouched.current = true
    setRules(next)
  }

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

  // 사진 여러 장 한 번에 — 파일 이름이 곧 후보 이름. 같은 이름의 후보가 있으면 그 후보에
  // 사진만 넣고, 없으면 빈 칸을 먼저 채운 뒤 모자라면 칸을 늘린다. 순서는 파일 이름순이라
  // '1_김민수'처럼 번호를 붙여 두면 그대로 기호 순서가 된다.
  const bulkInput = useRef<HTMLInputElement>(null)
  const [bulkDragging, setBulkDragging] = useState(false)

  const onBulkPicked = async (picked: File[]) => {
    if (!picked.length) return
    const files = picked
      .filter((f) => PHOTO_TYPES.includes(f.type))
      .sort((a, b) => fileLabel(a).localeCompare(fileLabel(b), 'ko', { numeric: true }))
    if (!files.length) return showToast('JPG · PNG · WEBP 사진을 골라주세요', 'error')

    const next = [...candidates]
    const jobs = new Map<string, File>()
    let skipped = 0
    for (const file of files) {
      const name = nameFromFile(file)
      let target = next.find((c) => c.name.trim() === name)
      if (!target && !candidatesLocked) {
        const emptyAt = next.findIndex((c) => !c.id && !c.name.trim() && !c.bio.trim() && !c.photo_url && !c.uploading)
        if (emptyAt >= 0) target = next[emptyAt] = { ...next[emptyAt], name }
        else if (next.length < MAX_CANDIDATES) next.push((target = { ...newDraft(), name }))
      }
      if (target) jobs.set(target.key, file)
      else skipped++
    }
    setCandidates(next.map((c) => (jobs.has(c.key) ? { ...c, uploading: true } : c)))

    const queue = [...jobs]
    let failed = 0
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const [key, file] = job
        try {
          patchCandidate(key, { photo_url: await uploadCandidatePhoto(file), uploading: false })
        } catch {
          failed++
          patchCandidate(key, { uploading: false })
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(BULK_UPLOAD_CONCURRENCY, queue.length) }, worker))

    const done = jobs.size - failed
    const notes = [
      failed ? `${failed}장은 업로드에 실패했어요` : '',
      skipped ? `${skipped}장은 ${candidatesLocked ? '같은 이름의 후보가 없어' : '후보 수 한도를 넘어'} 건너뛰었어요` : '',
    ].filter(Boolean)
    showToast(
      [done ? `${done}명의 사진을 올렸어요` : '', ...notes].filter(Boolean).join(' · '),
      !notes.length ? 'success' : done ? 'info' : 'error'
    )
  }

  // ── 선거인 명부 ─────────────────────────────────────────────────────

  // 승인된 활성 회원 + (이미 명부에 있지만 지금은 비활성인 회원 — 목록에서 사라지지 않게)
  const users = useMemo<RosterPoolMember[]>(() => {
    const list = [...(pool ?? [])]
    const known = new Set(list.map((u) => u.id))
    for (const v of election?.voters ?? []) {
      if (!known.has(v.user_id)) list.push({ id: v.user_id, name: v.name, username: '' })
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [pool, election?.voters])

  // 공동의회 소속이면 고를 수 있는 사람은 공동의회 명부뿐 — 체크를 풀면 '이 선거에서는 제외'
  const rosterUsers = useMemo<RosterPoolMember[]>(() => {
    if (!assemblyId) return users
    if (!assembly) return []
    const byId = new Map(users.map((u) => [u.id, u]))
    return assembly.voters.map((v) => byId.get(v.user_id) ?? { id: v.user_id, name: v.name, username: '' })
  }, [assemblyId, assembly, users])
  const excludedIds = useMemo(
    () => (assemblyId ? rosterUsers.filter((u) => !voterIds.has(u.id)).map((u) => u.id) : []),
    [assemblyId, rosterUsers, voterIds]
  )
  const appCount = assemblyId ? rosterUsers.length - excludedIds.length : voterIds.size
  const offlineValue = assemblyId && !offlineCustom ? (assembly?.offline_voter_count ?? offlineCount) : offlineCount

  // 공동의회 소속 새 선거는 그 명부 전원으로 시작한다
  const seededFor = useRef<number | null>(null)
  useEffect(() => {
    if (election || !assembly || assembly.id !== assemblyId || seededFor.current === assembly.id) return
    seededFor.current = assembly.id
    setVoterIds(new Set(assembly.voters.map((v) => v.user_id)))
  }, [election, assembly, assemblyId])

  // ── 저장 ────────────────────────────────────────────────────────────

  const save = useSaveElection({
    onSuccess: (saved) => {
      showToast(election ? '선거를 저장했어요' : '선거를 만들었어요. 준비가 되면 투표를 시작하세요', 'success')
      onSaved(saved)
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
    if (assemblyId && !assembly) return showToast('공동의회 명부를 불러오는 중이에요. 잠시 뒤 다시 눌러 주세요', 'error')

    save.mutate({
      id: election?.id,
      data: {
        title: title.trim(),
        description: description.trim() || null,
        notice: notice.trim() || null,
        seats,
        offline_voter_count: offlineValue,
        rules,
        candidates: filled.map((c) => ({
          id: c.id,
          name: c.name.trim(),
          bio: c.bio.trim() || null,
          photo_url: c.photo_url,
        })),
        // 공동의회 소속이면 명부·선관위원은 서버가 공동의회에서 내려받는다 — 여기서는 '제외'만 보낸다
        voter_ids: assemblyId ? [] : [...voterIds],
        manager_ids: assemblyId ? [] : [...managerIds],
        ...(assemblyId
          ? { assembly_id: assemblyId, excluded_voter_ids: excludedIds, offline_custom: offlineCustom }
          : {}),
      },
    })
  }

  const exampleBase = rules?.threshold_basis === 'voters' ? appCount + offlineValue : 100

  // 배경을 눌러도 닫지 않는다 — 입력이 많은 폼이라 드래그·사진 끌어 놓기 중 빗나간 클릭 한 번에
  // 작성하던 내용이 날아간다. 닫기는 ✕·취소(와 뒤로가기)로만. 같은 이유로 등록 칸을 빗나간
  // 사진 드롭은 삼킨다(그냥 두면 브라우저가 그 사진 파일로 이동해 버린다).
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="relative w-full sm:max-w-3xl lg:max-w-[1320px] max-h-[94vh] sm:max-h-[92vh] lg:h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] flex flex-col">
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {election ? '선거 수정' : '새 선거'}
              {assemblyId && (assembly?.title ?? election?.assembly_title) ? (
                <span className="ml-2 text-[13px] font-bold text-ink-muted">{assembly?.title ?? election?.assembly_title}</span>
              ) : null}
            </h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* 모바일은 한 줄로 쌓고, PC(lg)는 3칸 — ① 정보·기준 | ② 후보 | ③ 명부. 칸마다 따로 스크롤한다 */}
        <motion.div layoutScroll className="flex-1 overflow-y-auto px-5 py-4 space-y-6 lg:overflow-hidden lg:p-0 lg:space-y-0 lg:grid lg:grid-cols-[400px_minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)] lg:min-h-0">
          {/* ① 선거 정보 · 당선 기준 */}
          <div className="space-y-5 lg:overflow-y-auto lg:px-5 lg:py-4 lg:border-r lg:border-black/[0.05] dark:lg:border-white/[0.06]">
            <section className="space-y-3">
              <StepTitle n={1}>선거 정보</StepTitle>
              <div>
                <label className={labelCls}>선거 이름</label>
                <input value={title} onChange={(e) => changeTitle(e.target.value)} placeholder="예) 2026 장로 선출" className={inputCls} />
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
              <div>
                <p className="text-[13.5px] font-bold text-ink-strong">선거관리위원 (선택)</p>
                <p className="text-[11.5px] text-ink-muted break-keep">
                  관리자가 아니어도 이 선거의 현황판에서 투표 시작·마감, 종이 표·투표용지 교부를 할 수 있어요. 기준·명부는 못 고쳐요.
                </p>
                {assemblyId ? (
                  <p className="mt-2 px-3 py-2.5 rounded-xl bg-[var(--surface-inset)] text-[12.5px] text-ink leading-relaxed break-keep">
                    공동의회에서 정한 분들이 맡아요
                    {assembly?.managers.length ? (
                      <>
                        {' — '}
                        <b>{assembly.managers.map((m) => m.name).join(', ')}</b>
                      </>
                    ) : (
                      ' (아직 지정하지 않았어요)'
                    )}
                  </p>
                ) : (
                  <ManagerPicker users={users} managerIds={managerIds} setManagerIds={setManagerIds} />
                )}
              </div>
            </section>

            {rules ? (
              <ElectionRulesSection
                header={<StepTitle n={2}>당선 기준</StepTitle>}
                rules={rules}
                onChange={changeRules}
                presets={presets ?? []}
                autoNote={autoNote}
                seats={seats}
                exampleBase={exampleBase}
                pastElections={pastElections}
                hasOpenRound={hasOpenRound}
              />
            ) : (
              <p className="text-[13px] text-ink-muted">기본 기준을 불러오는 중…</p>
            )}
          </div>

          {/* ② 후보 — 스크롤하는 칸(모바일은 위 본문, PC 는 이 칸)에 layoutScroll 이 있어야 스크롤된 상태에서도 드래그 자리가 맞는다 */}
          <motion.div layoutScroll className="space-y-3 lg:overflow-y-auto lg:px-5 lg:py-4 lg:border-r lg:border-black/[0.05] dark:lg:border-white/[0.06]">
            <StepTitle n={3} aside={`${candidates.filter((c) => c.name.trim()).length}명`}>후보</StepTitle>
            <p className="text-[12px] text-ink-muted break-keep">
              {candidatesLocked
                ? '투표가 시작되어 후보를 넣고 뺄 수 없어요. 이름·사진·소개만 고칠 수 있어요.'
                : '위에서부터 기호 1번이에요. 손잡이를 끌거나 화살표로 순서를 바꾸세요.'}
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
            <input
              ref={bulkInput}
              type="file"
              multiple
              accept={PHOTO_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                void onBulkPicked([...(e.target.files ?? [])])
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => bulkInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setBulkDragging(true)
              }}
              onDragLeave={() => setBulkDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setBulkDragging(false)
                void onBulkPicked([...e.dataTransfer.files])
              }}
              className={`w-full px-3 py-3 rounded-xl border border-dashed text-center transition-colors ${
                bulkDragging
                  ? 'border-brand bg-[var(--brand-soft)] text-brand'
                  : 'border-gray-300 dark:border-white/[0.15] text-ink-muted hover:border-brand hover:text-brand'
              }`}
            >
              <span className="block text-[13px] font-bold">사진 여러 장으로 한 번에 등록</span>
              <span className="block mt-0.5 text-[11.5px] font-medium break-keep">
                {candidatesLocked
                  ? '파일 이름과 같은 이름의 후보에게 사진을 넣어요 (예: 김민수.jpg)'
                  : '파일 이름이 후보 이름이 돼요 (예: 김민수.jpg) · 여기로 끌어다 놓아도 돼요'}
              </span>
            </button>
            <Reorder.Group as="div" axis="y" values={candidates} onReorder={setCandidates} className="space-y-2.5">
              {candidates.map((c, i) => (
                <CandidateRow
                  key={c.key}
                  candidate={c}
                  index={i}
                  total={candidates.length}
                  locked={candidatesLocked}
                  onPatch={(patch) => patchCandidate(c.key, patch)}
                  onPickPhoto={() => pickPhoto(c.key)}
                  onMove={(dir) => moveCandidate(i, dir)}
                  onRemove={() => setCandidates((prev) => prev.filter((x) => x.key !== c.key))}
                />
              ))}
            </Reorder.Group>
            {!candidatesLocked ? (
              <button
                type="button"
                onClick={() => setCandidates((prev) => [...prev, newDraft()])}
                className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-[13px] font-bold text-ink-muted hover:border-brand hover:text-brand transition-colors"
              >
                + 후보 추가
              </button>
            ) : null}
          </motion.div>

          {/* ③ 선거인 명부 */}
          <div className="space-y-3 lg:flex lg:flex-col lg:space-y-0 lg:gap-3 lg:min-h-0 lg:px-5 lg:py-4">
            <StepTitle n={4} aside={`앱 ${appCount}명 + 종이 ${offlineValue}명`}>선거인 명부</StepTitle>
            {assemblyId ? (
              <p className="px-3 py-2.5 rounded-xl bg-[var(--brand-soft)] text-[12.5px] text-ink leading-relaxed break-keep">
                <b className="text-brand">{assembly?.title ?? election?.assembly_title ?? '공동의회'}</b> 명부를 함께 써요.
                이 선거에서 투표권이 없는 분만 체크를 풀어 주세요.
                {excludedIds.length ? <b className="tabular-nums"> 지금 {excludedIds.length}명 제외.</b> : null}
              </p>
            ) : (
              <p className="text-[12px] text-ink-muted break-keep">
                여기서 고른 성도만 투표할 수 있어요. 다른 성도에게는 선거가 보이지 않아요.
              </p>
            )}
            <RosterPicker
              users={rosterUsers}
              loading={usersLoading || (!!assemblyId && !assembly)}
              selected={voterIds}
              setSelected={setVoterIds}
              lockedIds={votedIds}
              pastElections={assemblyId ? [] : pastElections}
              allowPaste={!assemblyId}
              uncheckedLabel={assemblyId ? '제외' : undefined}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink-strong">앱을 안 쓰는 선거인</p>
                <p className="text-[11.5px] text-ink-muted break-keep">
                  종이로 투표할 분들 — 재적 수에 더해져요
                  {assemblyId && !offlineCustom ? ' · 공동의회 값을 따라요' : ''}
                </p>
                {assemblyId && offlineCustom ? (
                  <button type="button" onClick={() => setOfflineCustom(false)} className="text-[11.5px] font-bold text-brand underline">
                    공동의회 값({assembly?.offline_voter_count ?? 0}명)으로 되돌리기
                  </button>
                ) : null}
              </div>
              <Stepper
                value={offlineValue}
                min={0}
                max={9999}
                onChange={(v) => {
                  if (assemblyId) setOfflineCustom(true)
                  setOfflineCount(v)
                }}
                suffix="명"
              />
            </div>
          </div>
        </motion.div>

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
