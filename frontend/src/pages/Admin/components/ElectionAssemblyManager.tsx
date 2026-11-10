// 공동의회 — 같은 날 여러 선거(장로·권사·안수집사)가 함께 쓰는 선거인 명부·선거관리위원을 한 번만 정한다.
//
// 모달 한 장 안에서 목록 ↔ 편집을 오간다(모달을 겹치지 않는다). 여기서 명부를 고치면 서버가 소속 선거의
// 명부로 바로 내려 보낸다 — 이미 투표한 선거인을 빼려 하면 저장 전체가 거절되고 그 선거 이름이 안내된다.
// 선거마다 투표권이 다른 사람은 여기서 빼지 않는다. 그 선거의 수정 화면에서 '제외'로 체크를 푼다.
// 공동의회를 지워도 소속 선거는 남는다(그때 명부 그대로 단독 선거가 된다).
import { useMemo, useState } from 'react'
import { getElectionAssembly } from '../../../api/election'
import {
  useDeleteAssembly,
  useElectionAssemblies,
  useElectionRosterPool,
  useSaveAssembly,
} from '../../../hooks/useElections'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { confirmDialog } from '../../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../../utils/toast'
import type { ElectionAssembly, ElectionAssemblyDetail, RosterPoolMember } from '../../../types/election'
import { STATUS_META, inputCls, labelCls } from '../../Election/electionShared'
import { ManagerPicker, RosterPicker } from './ElectionRosterPicker'
import { CloseButton, Stepper } from './SeatEventComposer'

const ghostBtn =
  'px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors disabled:opacity-50'
const brandBtn = 'px-4 py-2 rounded-xl bg-brand text-white text-[13.5px] font-bold disabled:opacity-50'

interface EditorProps {
  assembly: ElectionAssemblyDetail | null
  onBack: () => void
  /** 새로 만든 직후 — 만들기 흐름에서는 곧바로 첫 선거 만들기로 넘어간다 */
  onCreated?: (assemblyId: number) => void
}

const AssemblyEditor = ({ assembly, onBack, onCreated }: EditorProps) => {
  const { data: pool, isLoading } = useElectionRosterPool()
  const [title, setTitle] = useState(assembly?.title ?? '')
  const [offlineCount, setOfflineCount] = useState(assembly?.offline_voter_count ?? 0)
  const [voterIds, setVoterIds] = useState<Set<number>>(new Set(assembly?.voters.map((v) => v.user_id) ?? []))
  const [managerIds, setManagerIds] = useState<Set<number>>(new Set(assembly?.managers.map((m) => m.user_id) ?? []))

  // 승인된 활성 회원 + (이미 명부·선관위원이지만 지금은 비활성인 회원 — 목록에서 사라지지 않게)
  const users = useMemo<RosterPoolMember[]>(() => {
    const list = [...(pool ?? [])]
    const known = new Set(list.map((u) => u.id))
    for (const m of [...(assembly?.voters ?? []), ...(assembly?.managers ?? [])]) {
      if (!known.has(m.user_id)) {
        known.add(m.user_id)
        list.push({ id: m.user_id, name: m.name, username: '' })
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [pool, assembly])

  const save = useSaveAssembly({
    onSuccess: (saved) => {
      const n = saved.elections.length
      showToast(
        assembly
          ? n
            ? `저장했어요. 소속 선거 ${n}개의 명부에도 반영됐어요`
            : '공동의회를 저장했어요'
          : onCreated
            ? '명부를 만들었어요. 이제 첫 번째 선거의 후보를 넣어 주세요'
            : '공동의회를 만들었어요. 이제 이 명부로 선거를 만들어 보세요',
        'success'
      )
      if (!assembly && onCreated) onCreated(saved.id)
      else onBack()
    },
    onError: (e) => showToast(e.message, 'error'),
  })

  const submit = () => {
    if (!title.trim()) return showToast('공동의회 이름을 입력해주세요', 'error')
    if (!voterIds.size && !offlineCount) return showToast('선거인을 한 명 이상 골라주세요', 'error')
    save.mutate({
      id: assembly?.id,
      data: {
        title: title.trim(),
        offline_voter_count: offlineCount,
        voter_ids: [...voterIds],
        manager_ids: [...managerIds],
      },
    })
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 lg:overflow-hidden lg:p-0 lg:space-y-0 lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:min-h-0">
        <div className="space-y-5 lg:overflow-y-auto lg:px-5 lg:py-4 lg:border-r lg:border-black/[0.05] dark:lg:border-white/[0.06]">
          <div>
            <label className={labelCls}>공동의회 이름</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 2026 공동의회" className={inputCls} />
          </div>
          <div>
            <p className="text-[13.5px] font-bold text-ink-strong">선거관리위원 (선택)</p>
            <p className="text-[11.5px] text-ink-muted break-keep">
              이 공동의회에 속한 모든 선거의 현황판에서 투표 시작·마감, 종이 표·투표용지 교부를 할 수 있어요.
            </p>
            <ManagerPicker users={users} managerIds={managerIds} setManagerIds={setManagerIds} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink-strong">앱을 안 쓰는 선거인</p>
              <p className="text-[11.5px] text-ink-muted break-keep">종이로 투표할 분들 — 재적 수에 더해져요</p>
            </div>
            <Stepper value={offlineCount} min={0} max={9999} onChange={setOfflineCount} suffix="명" />
          </div>
          {assembly?.elections.length ? (
            <div className="px-3 py-2.5 rounded-xl bg-[var(--brand-soft)] text-[12.5px] text-ink leading-relaxed break-keep">
              저장하면 <b className="text-brand">{assembly.elections.map((e) => e.title).join(' · ')}</b>의 명부와
              선관위원에 바로 반영돼요. 끝난 선거는 바뀌지 않고, 이미 투표한 분은 뺄 수 없어요.
            </div>
          ) : (
            <p className="px-3 py-2.5 rounded-xl bg-[var(--surface-inset)] text-[12.5px] text-ink-muted leading-relaxed break-keep">
              선거마다 투표권이 다른 분이 있으면, 여기에는 모두 넣어 두고 그 선거를 만들 때 체크만 풀면 돼요.
            </p>
          )}
        </div>

        <div className="space-y-3 lg:flex lg:flex-col lg:space-y-0 lg:gap-3 lg:min-h-0 lg:px-5 lg:py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-extrabold text-ink-strong tracking-[-0.02em]">선거인 명부</h3>
            <span className="ml-auto text-[12px] font-semibold text-ink-muted tabular-nums">
              앱 {voterIds.size}명 + 종이 {offlineCount}명
            </span>
          </div>
          <RosterPicker users={users} loading={isLoading} selected={voterIds} setSelected={setVoterIds} />
        </div>
      </div>

      <div className="relative z-10 px-5 py-3.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2 sm:justify-end">
        <button type="button" onClick={onBack} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[14px] font-semibold text-ink">
          취소
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={save.isPending}
          className="flex-[2] sm:flex-none px-7 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold disabled:opacity-50"
        >
          {save.isPending ? '저장하는 중…' : !assembly && onCreated ? '저장하고 선거 만들기' : '저장'}
        </button>
      </div>
    </>
  )
}

interface Props {
  onClose: () => void
  /** 이 공동의회 명부로 새 선거 만들기 — 부모가 이 모달을 닫고 선거 편집기를 연다 */
  onAddElection: (assemblyId: number) => void
  /** 만들기 흐름('여러 직분을 뽑아요')에서 열렸다 — 목록 없이 새 명부부터, 저장하면 바로 첫 선거로 */
  startNew?: boolean
}

const ElectionAssemblyManager = ({ onClose, onAddElection, startNew = false }: Props) => {
  useModalBackButton(onClose)
  const { data: assemblies, isLoading } = useElectionAssemblies()
  // undefined = 목록, null = 새로 만들기, 객체 = 고치기
  const [editing, setEditing] = useState<ElectionAssemblyDetail | null | undefined>(startNew ? null : undefined)
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null)
  const remove = useDeleteAssembly(toastFeedback({ success: '공동의회를 삭제했어요' }))

  const openEdit = async (a: ElectionAssembly) => {
    try {
      setLoadingEdit(a.id)
      setEditing(await getElectionAssembly(a.id)) // 목록에는 명부가 없다
    } catch {
      showToast('공동의회를 불러오지 못했습니다', 'error')
    } finally {
      setLoadingEdit(null)
    }
  }

  const confirmDelete = async (a: ElectionAssembly) => {
    const ok = await confirmDialog({
      title: '공동의회를 삭제할까요?',
      message: `'${a.title}'`,
      description: a.elections.length
        ? `소속 선거 ${a.elections.length}개는 지워지지 않고, 지금 명부 그대로 따로 관리하는 선거로 남아요.`
        : '복구할 수 없습니다.',
      confirmText: '삭제',
      tone: 'danger',
    })
    if (ok) remove.mutate(a.id)
  }

  const isEditor = editing !== undefined

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div
        className={`relative w-full max-h-[94vh] sm:max-h-[92vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] flex flex-col ${
          isEditor ? 'sm:max-w-3xl lg:max-w-[1000px] lg:h-[90vh]' : 'sm:max-w-2xl'
        }`}
      >
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {!isEditor ? '공동의회 명부' : editing ? '공동의회 수정' : startNew ? '먼저, 함께 쓸 선거인 명부' : '새 공동의회'}
            </h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {isEditor ? (
          <AssemblyEditor
            key={editing?.id ?? 'new'}
            assembly={editing}
            onBack={startNew ? onClose : () => setEditing(undefined)}
            onCreated={startNew ? onAddElection : undefined}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <p className="text-[13px] text-ink-muted leading-relaxed break-keep">
              같은 날 장로·권사·안수집사처럼 여러 선거를 치를 때, 선거인 명부와 선거관리위원을 <b className="text-ink-strong">한 번만</b> 정해
              두는 곳이에요. 여기서 고치면 소속 선거에 모두 반영돼요.
            </p>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
              </div>
            ) : !assemblies?.length ? (
              <div className="rounded-2xl bg-[var(--surface-inset)] px-4 py-8 text-center">
                <p className="text-[14px] font-semibold text-ink-strong">아직 만든 공동의회가 없어요</p>
                <p className="mt-1 text-[12.5px] text-ink-muted break-keep">명부를 먼저 만들고, 그 명부로 선거를 여러 개 만들 수 있어요</p>
              </div>
            ) : (
              assemblies.map((a) => (
                <div key={a.id} className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-4">
                  <h3 className="text-[16px] font-extrabold text-ink-strong break-keep">{a.title}</h3>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted tabular-nums">
                    선거인 앱 {a.voter_count}명 + 종이 {a.offline_voter_count}명 · 선관위원 {a.manager_count}명
                  </p>
                  {a.elections.length ? (
                    <ul className="mt-2.5 space-y-1">
                      {a.elections.map((e) => (
                        <li key={e.id} className="flex items-center gap-2 text-[13px] text-ink">
                          <span className={`shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[e.status].badge}`}>
                            {STATUS_META[e.status].label}
                          </span>
                          <span className="min-w-0 truncate font-semibold">{e.title}</span>
                          <span className="ml-auto shrink-0 text-[12px] text-ink-muted tabular-nums">
                            앱 {e.voter_count}명
                            {e.status !== 'finished' && e.voter_count < a.voter_count ? ` (${a.voter_count - e.voter_count}명 제외)` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2.5 text-[12.5px] text-ink-muted">아직 이 명부로 만든 선거가 없어요</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => onAddElection(a.id)} className={brandBtn}>
                      + 이 명부로 선거 만들기
                    </button>
                    <button type="button" onClick={() => void openEdit(a)} disabled={loadingEdit === a.id} className={ghostBtn}>
                      {loadingEdit === a.id ? '여는 중…' : '명부 수정'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void confirmDelete(a)}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-ink-muted hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-[13.5px] font-bold text-ink-muted hover:border-brand hover:text-brand transition-colors"
            >
              + 새 공동의회 만들기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ElectionAssemblyManager
