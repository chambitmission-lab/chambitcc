// 손글씨 필사대회 관리 — 대회 열기·고치기 창 (2026-11-27 데스크 개편 때 관리 화면에서 떼어 냄)
// ★발표한 대회는 서버가 마감 변경을 막는다(handwriting_contest_service.update) — 기간 칸을 잠그고 까닭을 적는다.
import { useState } from 'react'
import { dateTriggerClass } from '../../../components/common/ComposerFields'
import DatePicker from '../../../components/common/DatePicker'
import TimePicker from '../../../components/common/TimePicker'
import { useSaveContest } from '../../../hooks/useHandwritingContest'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { ContestSummary, ContestWrite } from '../../../types/handwritingContest'
import { joinDT, splitDT } from '../../../utils/datetimeParts'
import { toastFeedback } from '../../../utils/toast'
import { contestToWrite, nextMonthDefaults } from './handwritingDeskUtils'

const inputCls =
  'w-full rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-3 py-2.5 text-[14px] text-ink-strong focus:outline-none focus:border-brand'

/** 네이티브 datetime-local(OS 달력·시분 따로 굴리기) 대신 앱 공통 달력 + 30분 간격 시간 목록 */
const DateTimeField = ({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  minDate?: string
}) => {
  const { date, time } = splitDT(value)
  return (
    <div>
      <label className="block text-[12.5px] font-bold text-ink-muted mb-1.5">{label}</label>
      <div className="grid grid-cols-[minmax(0,1fr)_132px] gap-2">
        <DatePicker value={date} onChange={(d) => onChange(joinDT(d, time || '00:00'))} minDate={minDate} className={dateTriggerClass} />
        <TimePicker value={time} onChange={(t) => onChange(joinDT(date, t))} className={dateTriggerClass} />
      </div>
    </div>
  )
}

const emptyForm = (): ContestWrite => ({
  title: '',
  description: '',
  ...nextMonthDefaults(),
  votes_per_user: 3,
  show_ranking: false,
  is_active: true,
})

const HandwritingContestComposer = ({
  target,
  onClose,
}: {
  target: ContestSummary | null
  onClose: () => void
}) => {
  useModalBackButton(onClose)
  const save = useSaveContest(toastFeedback({ success: target ? '대회를 고쳤어요' : '대회를 열었어요' }))
  const [form, setForm] = useState<ContestWrite>(() =>
    target ? { ...contestToWrite(target), description: target.description ?? '' } : emptyForm(),
  )
  const announced = target?.phase === 'announced'
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
      <div className="relative w-full max-w-lg max-h-[calc(90dvh/var(--az,1))] overflow-y-auto rounded-t-[24px] lg:rounded-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl">
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
          <DateTimeField label="시작 (KST)" value={form.starts_at} onChange={(v) => set('starts_at', v)} />
          {announced ? (
            <div>
              <label className="block text-[12.5px] font-bold text-ink-muted mb-1.5">마감 (KST)</label>
              <p className="rounded-xl bg-gray-100 dark:bg-white/[0.06] px-3 py-2.5 text-[14px] font-semibold text-ink-strong">
                {splitDT(form.ends_at).date} {splitDT(form.ends_at).time}
              </p>
              <p className="mt-1 text-[12px] text-ink-muted">발표한 대회는 마감을 바꿀 수 없어요 — 바꾸려면 발표를 먼저 취소해 주세요</p>
            </div>
          ) : (
            <DateTimeField
              label="마감 (KST)"
              value={form.ends_at}
              onChange={(v) => set('ends_at', v)}
              minDate={splitDT(form.starts_at).date || undefined}
            />
          )}
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

export default HandwritingContestComposer
