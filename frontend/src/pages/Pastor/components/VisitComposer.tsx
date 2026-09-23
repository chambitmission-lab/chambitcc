// 심방 기록·예약 쓰기/고치기 — 내용과 후속 할 일은 작성한 교역자만 본다.
//
// 모드 두 가지:
//   done    — 다녀온 기록 (오늘까지의 날짜, 후속 할 일 가능)
//   planned — 예약 (오늘부터의 날짜·시간, 메모만). 다른 교역자에게는 '누가·언제·누구·방식'만 보인다.
// 예약을 열어 '다녀왔어요'를 누르면 같은 기록이 done 으로 바뀐다(날짜가 앞날이면 오늘로).
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../../utils/toast'
import {
  VISIT_KIND_ICON,
  VISIT_KIND_LABEL,
  createVisit,
  deleteVisit,
  updateVisit,
  type PastoralVisit,
  type VisitKind,
  type VisitStatus,
} from '../../../api/pastor'
import { FieldLabel, GhostButton, PastorModal, PrimaryButton } from './ui'
import { inputCls, todayIso } from './pastorUtils'

const KINDS = Object.keys(VISIT_KIND_LABEL) as VisitKind[]

const DONE_DATE_CHIPS = [
  { label: '오늘', offset: 0 },
  { label: '어제', offset: -1 },
  { label: '그저께', offset: -2 },
]

const PLAN_DATE_CHIPS = [
  { label: '오늘', offset: 0 },
  { label: '내일', offset: 1 },
  { label: '모레', offset: 2 },
  { label: '다음 주', offset: 7 },
]

const TIME_CHIPS = [
  { label: '오전 10시', value: '10:00' },
  { label: '오후 2시', value: '14:00' },
  { label: '오후 4시', value: '16:00' },
  { label: '저녁 7시', value: '19:00' },
]

const FOLLOW_CHIPS = [
  { label: '내일', offset: 1 },
  { label: '3일 뒤', offset: 3 },
  { label: '1주 뒤', offset: 7 },
  { label: '2주 뒤', offset: 14 },
]

interface Props {
  memberId: number
  memberName: string
  /** 있으면 수정 모드 (내 기록만 넘어온다) */
  visit?: PastoralVisit
  /** 새로 쓸 때의 시작 모드 */
  initialStatus?: VisitStatus
  /** 예약을 열자마자 '다녀왔어요'로 바꿔 기록을 채우게 할 때 */
  completing?: boolean
  onClose: () => void
}

const chipCls = (active: boolean) =>
  `px-3 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors ${
    active
      ? 'bg-brand border-brand text-white'
      : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
  }`

const VisitComposer = ({ memberId, memberName, visit, initialStatus = 'done', completing = false, onClose }: Props) => {
  const qc = useQueryClient()
  const startStatus: VisitStatus = completing ? 'done' : visit?.status ?? initialStatus
  // 예약을 다녀온 기록으로 바꿀 때 — 앞날로 잡혀 있던 예약이면 오늘로
  const startDate =
    completing && visit && visit.visit_date > todayIso()
      ? todayIso()
      : visit?.visit_date ?? (startStatus === 'planned' ? todayIso(1) : todayIso())

  const [status, setStatus] = useState<VisitStatus>(startStatus)
  const [visitDate, setVisitDate] = useState(startDate)
  const [visitTime, setVisitTime] = useState(visit?.visit_time ?? '')
  const [kind, setKind] = useState<VisitKind>(visit?.kind ?? 'visit')
  const [summary, setSummary] = useState(visit?.summary ?? '')
  const [followUp, setFollowUp] = useState(visit?.follow_up ?? '')
  const [followDate, setFollowDate] = useState(visit?.follow_up_date ?? '')
  const [followDone, setFollowDone] = useState(visit?.follow_up_done ?? false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const planned = status === 'planned'
  const wasPlan = visit?.status === 'planned'

  const switchMode = (next: VisitStatus) => {
    setStatus(next)
    // 모드마다 날짜 허용 범위가 반대라, 범위를 벗어나면 기본값으로
    if (next === 'planned' && visitDate < todayIso()) setVisitDate(todayIso(1))
    if (next === 'done' && visitDate > todayIso()) setVisitDate(todayIso())
  }

  const refresh = () => {
    for (const key of [
      ['pastor-member', memberId],
      ['pastor-roster'],
      ['pastor-visits'],
      ['pastor-home'],
      ['pastor-suggestions'],
      ['pastor-briefing', memberId],
      ['pastor-agenda'],
      ['pastor-report'],
    ]) {
      void qc.invalidateQueries({ queryKey: key, refetchType: 'all' })
    }
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        visit_date: visitDate,
        visit_time: visitTime || null,
        status,
        kind,
        summary,
        follow_up: planned ? '' : followUp,
        follow_up_date: !planned && followUp.trim() && followDate ? followDate : null,
      }
      return visit
        ? updateVisit(visit.id, { ...payload, follow_up_done: followDone })
        : createVisit(memberId, payload)
    },
    onSuccess: () => {
      const msg = planned
        ? visit ? '심방 예약을 고쳤습니다' : '심방을 예약했습니다'
        : wasPlan ? '다녀온 기록으로 남겼습니다' : visit ? '심방 기록을 고쳤습니다' : '심방 기록을 남겼습니다'
      showToast(msg, 'success')
      refresh()
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: () => deleteVisit(visit!.id),
    onSuccess: () => {
      showToast(wasPlan ? '예약을 취소했습니다' : '심방 기록을 지웠습니다', 'success')
      refresh()
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const title = planned
    ? visit ? '심방 예약 고치기' : '심방 예약'
    : wasPlan ? '다녀온 기록 남기기' : visit ? '심방 기록 고치기' : '심방 기록'

  // 이미 잡혀 있던 예약은 날짜가 지나도 그대로 고칠 수 있게 둔다
  const dateOk = planned ? visitDate >= todayIso() || wasPlan : visitDate <= todayIso()

  return (
    <PastorModal
      title={`${memberName} · ${title}`}
      onClose={onClose}
      footer={
        <>
          {visit && (
            <GhostButton danger onClick={() => (confirmDelete ? remove.mutate() : setConfirmDelete(true))}>
              {confirmDelete ? (wasPlan ? '정말 취소' : '정말 지우기') : wasPlan ? '예약 취소' : '지우기'}
            </GhostButton>
          )}
          {wasPlan && planned && <GhostButton onClick={() => switchMode('done')}>다녀왔어요</GhostButton>}
          <PrimaryButton disabled={!visitDate || !dateOk || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? '저장 중...' : planned ? '예약 저장' : '저장'}
          </PrimaryButton>
        </>
      }
    >
      {/* 새로 쓸 때만 모드를 고른다 — 예약은 '다녀왔어요'로만 기록이 된다 */}
      {!visit && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]" role="tablist">
          {([
            ['done', '다녀온 기록'],
            ['planned', '예약하기'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={status === key}
              onClick={() => switchMode(key)}
              className={`py-2 rounded-lg text-[13px] font-bold transition-colors ${
                status === key ? 'bg-white dark:bg-white/[0.12] text-brand shadow-sm' : 'text-gray-600 dark:text-white/65'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-white/60">
        <span className="material-icons-outlined text-[15px] text-brand">lock</span>
        {planned
          ? '메모는 목사님만 봅니다. 다른 교역자에게는 누가·언제·어떤 방식으로 가는지만 보여 겹치지 않게 합니다.'
          : '내용과 후속 할 일은 목사님만 봅니다. 다른 교역자에게는 날짜와 방식만 보입니다.'}
      </p>

      <div>
        <FieldLabel>{planned ? '언제 찾아갈까요' : '언제'}</FieldLabel>
        <div className="flex flex-wrap items-center gap-1.5">
          {(planned ? PLAN_DATE_CHIPS : DONE_DATE_CHIPS).map(c => {
            const v = todayIso(c.offset)
            return (
              <button key={c.label} type="button" className={chipCls(visitDate === v)} onClick={() => setVisitDate(v)}>
                {c.label}
              </button>
            )
          })}
          <input
            type="date"
            className={`${inputCls} !w-auto !py-1.5 text-[13px]`}
            value={visitDate}
            min={planned && !wasPlan ? todayIso() : undefined}
            max={planned ? undefined : todayIso()}
            onChange={e => setVisitDate(e.target.value)}
          />
        </div>
        {!dateOk && (
          <p className="mt-1.5 text-[12px] font-semibold text-[var(--amber)]">
            {planned ? '예약은 오늘부터 잡을 수 있어요' : '다녀온 기록은 앞날로 남길 수 없어요 — 예약하기를 써 주세요'}
          </p>
        )}
      </div>

      {planned && (
        <div>
          <FieldLabel hint="선택">시간</FieldLabel>
          <div className="flex flex-wrap items-center gap-1.5">
            {TIME_CHIPS.map(c => (
              <button key={c.value} type="button" className={chipCls(visitTime === c.value)} onClick={() => setVisitTime(c.value)}>
                {c.label}
              </button>
            ))}
            <button type="button" className={chipCls(!visitTime)} onClick={() => setVisitTime('')}>
              시간 미정
            </button>
            <input
              type="time"
              className={`${inputCls} !w-auto !py-1.5 text-[13px]`}
              value={visitTime}
              onChange={e => setVisitTime(e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <FieldLabel>어떻게</FieldLabel>
        <div className="grid grid-cols-3 gap-1.5">
          {KINDS.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[12px] font-semibold transition-colors ${
                kind === k
                  ? 'bg-[var(--brand-soft)] border-brand text-brand'
                  : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
              }`}
            >
              <span className="material-icons-outlined text-[20px]">{VISIT_KIND_ICON[k]}</span>
              {VISIT_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <FieldLabel hint={planned ? '선택' : undefined}>{planned ? '메모' : '나눈 이야기'}</FieldLabel>
        <textarea
          className={`${inputCls} ${planned ? 'min-h-[72px]' : 'min-h-[120px]'} resize-y`}
          value={summary}
          maxLength={4000}
          placeholder={planned ? '예: 사모님과 함께, 과일 준비' : '형편, 기도 제목, 함께 읽은 말씀 등'}
          onChange={e => setSummary(e.target.value)}
        />
      </label>

      {!planned && (
        <div>
          <FieldLabel hint="목사님 홈에 알려 드려요">후속 할 일</FieldLabel>
          <input
            className={inputCls}
            value={followUp}
            maxLength={300}
            placeholder="예: 수술 끝나면 전화 드리기"
            onChange={e => setFollowUp(e.target.value)}
          />
          {followUp.trim() && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {FOLLOW_CHIPS.map(c => {
                const v = todayIso(c.offset)
                return (
                  <button key={c.label} type="button" className={chipCls(followDate === v)} onClick={() => setFollowDate(v)}>
                    {c.label}
                  </button>
                )
              })}
              <button type="button" className={chipCls(!followDate)} onClick={() => setFollowDate('')}>
                날짜 없음
              </button>
              <input
                type="date"
                className={`${inputCls} !w-auto !py-1.5 text-[13px]`}
                value={followDate}
                onChange={e => setFollowDate(e.target.value)}
              />
            </div>
          )}
          {visit?.status === 'done' && followUp.trim() && (
            <button
              type="button"
              onClick={() => setFollowDone(!followDone)}
              className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-600 dark:text-white/65"
            >
              <span className={`material-icons-outlined text-[18px] ${followDone ? 'text-brand' : ''}`}>
                {followDone ? 'check_box' : 'check_box_outline_blank'}
              </span>
              마친 일로 표시
            </button>
          )}
        </div>
      )}
    </PastorModal>
  )
}

export default VisitComposer
