// 손글씨 필사대회 관리 — 대회를 열고(기간·표 수·순위 공개), 마감 뒤 결과를 발표한다.
// 작품 숨기기는 대회 화면에서 작품을 열면 관리자에게만 보이는 버튼으로 한다(관리자는 표 수도 늘 보인다).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAdminContests,
  useDeleteContest,
  usePublishContest,
  useSaveContest,
} from '../../hooks/useHandwritingContest'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import type { ContestSummary, ContestWrite } from '../../types/handwritingContest'
import { can } from '../../utils/access'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../utils/toast'
import { PhaseChip } from '../HandwritingContest/contestShared'
import { periodText } from '../HandwritingContest/contestFormat'

const cardCls =
  'rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none'
const inputCls =
  'w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-3 py-2.5 text-[14px] text-ink-strong focus:outline-none focus:border-brand'

/** 서버는 KST 벽시계를 +09:00 으로 내려준다 → datetime-local 값 */
const toLocalInput = (iso: string) => iso.slice(0, 16)

/** 다음 달 1일 0시 ~ 말일 끝(다음다음 달 1일 0시) — 한 달 대회 기본값 */
const nextMonthDefaults = (): Pick<ContestWrite, 'starts_at' | 'ends_at'> => {
  const now = new Date(Date.now() + 9 * 3_600_000)
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const fmt = (yy: number, mm: number) => {
    const d = new Date(Date.UTC(yy, mm, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01T00:00`
  }
  return { starts_at: fmt(y, m + 1), ends_at: fmt(y, m + 2) }
}

const emptyForm = (): ContestWrite => ({
  title: '',
  description: '',
  ...nextMonthDefaults(),
  votes_per_user: 3,
  show_ranking: false,
  is_active: true,
})

const ContestComposer = ({
  target,
  onClose,
}: {
  target: ContestSummary | null
  onClose: () => void
}) => {
  useModalBackButton(onClose)
  const save = useSaveContest(toastFeedback({ success: target ? '대회를 고쳤어요' : '대회를 열었어요' }))
  const [form, setForm] = useState<ContestWrite>(() =>
    target
      ? {
          title: target.title,
          description: target.description ?? '',
          starts_at: toLocalInput(target.starts_at),
          ends_at: toLocalInput(target.ends_at),
          votes_per_user: target.votes_per_user,
          show_ranking: target.show_ranking,
          is_active: target.is_active,
        }
      : emptyForm(),
  )
  const set = <K extends keyof ContestWrite>(key: K, value: ContestWrite[K]) => setForm((f) => ({ ...f, [key]: value }))
  const valid = form.title.trim() && form.starts_at && form.ends_at && form.ends_at > form.starts_at

  const submit = () => {
    if (!valid) return
    save.mutate(
      { id: target?.id ?? null, payload: { ...form, title: form.title.trim(), description: form.description?.trim() || null } },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[calc(90vh/var(--az,1))] overflow-y-auto rounded-t-[24px] lg:rounded-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl">
        <h2 className="text-[18px] font-bold text-ink-strong mb-4">{target ? '대회 고치기' : '새 필사대회 열기'}</h2>
        <div className="space-y-3.5">
          <div>
            <label className="block text-[12.5px] font-bold text-ink-muted mb-1.5">대회 이름</label>
            <input className={inputCls} value={form.title} maxLength={100} onChange={(e) => set('title', e.target.value)} placeholder="제1회 참빛 손글씨 성경 필사대회" />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold text-ink-muted mb-1.5">소개 (선택)</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              maxLength={2000}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="한 달 동안 마음에 닿는 말씀을 손으로 써 주세요. 성도들이 뽑은 1~3등 작품은 말씀카드로 만들어져요."
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[12.5px] font-bold text-ink-muted mb-1.5">시작 (KST)</label>
              <input type="datetime-local" className={inputCls} value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-ink-muted mb-1.5">마감 (KST)</label>
              <input type="datetime-local" className={inputCls} value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
            </div>
          </div>
          {form.ends_at && form.starts_at && form.ends_at <= form.starts_at ? (
            <p className="text-[12px] text-rose-500">마감은 시작보다 뒤여야 해요</p>
          ) : null}
          <div>
            <label className="block text-[12.5px] font-bold text-ink-muted mb-1.5">한 사람이 줄 수 있는 표</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set('votes_per_user', n)}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-bold border ${
                    form.votes_per_user === n ? 'border-brand bg-[var(--brand-soft)] text-brand' : 'border-gray-200 dark:border-white/10 text-ink-muted'
                  }`}
                >
                  {n}표
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[var(--brand)]" checked={form.show_ranking} onChange={(e) => set('show_ranking', e.target.checked)} />
            <span className="text-[13px] text-ink-strong">
              진행 중에도 표 수·순위 공개
              <span className="block text-[12px] text-ink-muted">끄면 발표 때까지 표 수를 숨기고 갤러리를 사람마다 섞어 보여줘요 (추천)</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[var(--brand)]" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            <span className="text-[13px] text-ink-strong">
              성도에게 보이기
              <span className="block text-[12px] text-ink-muted">끄면 관리자만 볼 수 있어요</span>
            </span>
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-ink-muted bg-gray-100 dark:bg-white/[0.06]">
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || save.isPending}
            className="flex-[2] py-3 rounded-2xl text-[14px] font-bold text-white bg-brand disabled:opacity-40"
          >
            {save.isPending ? '저장 중…' : target ? '저장' : '대회 열기'}
          </button>
        </div>
      </div>
    </div>
  )
}

const HandwritingContestManagement = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useAdminContests()
  const [composer, setComposer] = useState<ContestSummary | null | undefined>(undefined)
  const publish = usePublishContest(
    toastFeedback({ success: (_d, v) => ((v as { on: boolean }).on ? '결과를 발표했어요 · 입상자와 참가자에게 알림을 보냈어요' : '발표를 취소했어요') }),
  )
  const remove = useDeleteContest(toastFeedback({ success: '대회를 지웠어요' }))

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const confirmPublish = async (c: ContestSummary) => {
    const ok = await confirmDialog({
      title: '결과를 발표할까요?',
      message: `'${c.title}'`,
      description: '표를 많이 받은 1~3등을 확정하고, 입상자와 참가자에게 알림을 보내요. 표가 같으면 먼저 낸 작품이 앞서요.',
      confirmText: '발표하기',
      tone: 'brand',
    })
    if (ok) publish.mutate({ id: c.id, on: true })
  }

  const confirmUnpublish = async (c: ContestSummary) => {
    const ok = await confirmDialog({
      title: '발표를 취소할까요?',
      message: '입상 순위가 풀리고 집계 중 상태로 돌아가요. 이미 보낸 알림은 되돌릴 수 없어요.',
      confirmText: '발표 취소',
      tone: 'warning',
    })
    if (ok) publish.mutate({ id: c.id, on: false })
  }

  const confirmDelete = async (c: ContestSummary) => {
    const ok = await confirmDialog({
      title: '대회를 지울까요?',
      message: `'${c.title}'`,
      description: `출품작 ${c.entry_count}개와 모든 표, 글씨 파일이 함께 사라져요. 복구할 수 없어요.`,
      confirmText: '삭제',
      tone: 'danger',
    })
    if (ok) remove.mutate(c.id)
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-24">
        <header className="mb-4">
          <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
          <h1 className="text-ink-strong text-[24px] font-bold tracking-[-0.02em]">손글씨 필사대회 관리</h1>
          <p className="text-[13px] text-ink-muted mt-1">대회를 열고, 마감 뒤 성도들이 뽑은 1~3등을 발표하세요</p>
        </header>

        <button type="button" onClick={() => setComposer(null)} className="w-full mb-4 py-3 rounded-2xl bg-brand text-white text-[14.5px] font-bold">
          + 새 필사대회 열기
        </button>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
          </div>
        ) : !data?.items.length ? (
          <div className={`${cardCls} px-4 py-12 text-center`}>
            <p className="text-[14px] font-semibold text-ink-strong">아직 연 대회가 없어요</p>
            <p className="mt-1 text-[13px] text-ink-muted">대회를 열면 성도들이 /handwriting 에서 참여할 수 있어요</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.items.map((c) => (
              <div key={c.id} className={`${cardCls} p-4`}>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <PhaseChip phase={c.phase} />
                  {!c.is_active ? (
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:border-white/[0.08]">
                      숨김
                    </span>
                  ) : null}
                  {c.show_ranking ? (
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]">
                      순위 공개
                    </span>
                  ) : null}
                </div>
                <p className="text-[15.5px] font-bold text-ink-strong">{c.title}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">
                  {periodText(c)} · 출품 {c.entry_count} · 투표 {c.voter_count}명 · 1인 {c.votes_per_user}표
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => navigate(`/handwriting/${c.id}`)} className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold bg-gray-100 dark:bg-white/[0.06] text-ink-strong">
                    작품 보기
                  </button>
                  <button type="button" onClick={() => setComposer(c)} className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold bg-gray-100 dark:bg-white/[0.06] text-ink-strong">
                    고치기
                  </button>
                  {c.phase === 'closed' ? (
                    <button type="button" onClick={() => confirmPublish(c)} disabled={publish.isPending} className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold bg-brand text-white">
                      결과 발표
                    </button>
                  ) : null}
                  {c.phase === 'announced' ? (
                    <button type="button" onClick={() => confirmUnpublish(c)} disabled={publish.isPending} className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      발표 취소
                    </button>
                  ) : null}
                  <button type="button" onClick={() => confirmDelete(c)} className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold text-rose-600 dark:text-rose-300">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {composer !== undefined ? <ContestComposer target={composer} onClose={() => setComposer(undefined)} /> : null}
    </div>
  )
}

export default HandwritingContestManagement
