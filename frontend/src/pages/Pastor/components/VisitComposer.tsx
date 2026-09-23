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
import DatePicker from '../../../components/common/DatePicker'
import TimePicker from '../../../components/common/TimePicker'
import { FieldLabel, GhostButton, PastorModal, PrimaryButton } from './ui'
import { inputCls, pickerCls, todayIso } from './pastorUtils'

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
  `px-3 py-1.5 lg:px-4 lg:py-2.5 rounded-full border text-[12.5px] lg:text-[15px] font-semibold transition-colors ${
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
      void qc.invalidateQueries({ queryKey: key })
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
      wide
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
      {/* PC(lg+): 왼쪽 '언제·어떻게'(고르는 칸) / 오른쪽 '나눈 이야기·후속 할 일'(쓰는 칸) 2단.
          쓰는 칸은 남는 높이를 다 받아 긴 기록도 스크롤 없이 한눈에 본다.
          모바일은 기존 순서대로 한 줄로 흐른다(두 칸이 그대로 위아래로 쌓인다). */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-10 lg:min-h-full">
      <div className="space-y-4 lg:space-y-7 lg:min-w-0">
      {/* 새로 쓸 때만 모드를 고른다 — 예약은 '다녀왔어요'로만 기록이 된다 */}
      {!visit && (
        <div className="grid grid-cols-2 gap-1 p-1 lg:p-1.5 rounded-xl bg-gray-100 dark:bg-white/[0.05]" role="tablist">
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
              className={`py-2 lg:py-3 rounded-lg text-[13px] lg:text-[16px] font-bold transition-colors ${
                status === key ? 'bg-white dark:bg-white/[0.12] text-brand shadow-sm' : 'text-gray-600 dark:text-white/65'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-[12px] lg:text-[14px] leading-relaxed text-gray-600 dark:text-white/60">
        <span className="material-icons-outlined text-[15px] lg:text-[18px] text-brand mt-0.5 lg:mt-[1px]">lock</span>
        {planned
          ? '메모는 목사님만 봅니다. 다른 교역자에게는 누가·언제·어떤 방식으로 가는지만 보여 겹치지 않게 합니다.'
          : '내용과 후속 할 일은 목사님만 봅니다. 다른 교역자에게는 날짜와 방식만 보입니다.'}
      </p>

      <div>
        <FieldLabel>{planned ? '언제 찾아갈까요' : '언제'}</FieldLabel>
        <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
          {(planned ? PLAN_DATE_CHIPS : DONE_DATE_CHIPS).map(c => {
            const v = todayIso(c.offset)
            return (
              <button key={c.label} type="button" className={chipCls(visitDate === v)} onClick={() => setVisitDate(v)}>
                {c.label}
              </button>
            )
          })}
        </div>
        {/* 앱 공용 달력 — 'YYYY년 M월 D일 (요일)'로 읽히고, PC에선 칸이 큰 달력이 열린다 */}
        <div className="mt-2 lg:mt-2.5">
          <DatePicker
            large
            value={visitDate}
            onChange={setVisitDate}
            minDate={planned && !wasPlan ? todayIso() : undefined}
            maxDate={planned ? undefined : todayIso()}
            className={pickerCls}
          />
        </div>
        {!dateOk && (
          <p className="mt-1.5 text-[12px] lg:text-[14px] font-semibold text-[var(--amber)]">
            {planned ? '예약은 오늘부터 잡을 수 있어요' : '다녀온 기록은 앞날로 남길 수 없어요 — 예약하기를 써 주세요'}
          </p>
        )}
      </div>

      {planned && (
        <div>
          <FieldLabel hint="선택">시간</FieldLabel>
          <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
            {TIME_CHIPS.map(c => (
              <button key={c.value} type="button" className={chipCls(visitTime === c.value)} onClick={() => setVisitTime(c.value)}>
                {c.label}
              </button>
            ))}
            <button type="button" className={chipCls(!visitTime)} onClick={() => setVisitTime('')}>
              시간 미정
            </button>
          </div>
          <div className="mt-2 lg:mt-2.5">
            <TimePicker large value={visitTime} onChange={setVisitTime} placeholder="다른 시간 고르기" className={pickerCls} />
          </div>
        </div>
      )}

      <div>
        <FieldLabel>어떻게</FieldLabel>
        <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
          {KINDS.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`flex flex-col items-center gap-1 py-2.5 lg:py-3.5 rounded-xl border text-[12px] lg:text-[15px] font-semibold transition-colors ${
                kind === k
                  ? 'bg-[var(--brand-soft)] border-brand text-brand'
                  : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
              }`}
            >
              <span className="material-icons-outlined text-[20px] lg:text-[26px]">{VISIT_KIND_ICON[k]}</span>
              {VISIT_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      </div>{/* /왼쪽: 언제·어떻게 */}

      <div className="space-y-4 lg:space-y-7 lg:min-w-0 lg:min-h-0 lg:flex lg:flex-col">
      <label className="block lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
        <FieldLabel hint={planned ? '선택' : undefined}>{planned ? '메모' : '나눈 이야기'}</FieldLabel>
        <textarea
          className={`${inputCls} ${planned ? 'min-h-[72px]' : 'min-h-[120px]'} resize-y lg:resize-none lg:flex-1 lg:min-h-[220px] lg:px-5 lg:py-4 lg:text-[17px] lg:leading-[1.8]`}
          value={summary}
          maxLength={4000}
          placeholder={planned ? '예: 사모님과 함께, 과일 준비' : '형편, 기도 제목, 함께 읽은 말씀 등'}
          onChange={e => setSummary(e.target.value)}
        />
      </label>

      {!planned && (
        <div className="lg:shrink-0">
          <FieldLabel hint="목사님 홈에 알려 드려요">후속 할 일</FieldLabel>
          <input
            className={`${inputCls} lg:px-5 lg:py-3.5 lg:text-[17px]`}
            value={followUp}
            maxLength={300}
            placeholder="예: 수술 끝나면 전화 드리기"
            onChange={e => setFollowUp(e.target.value)}
          />
          {followUp.trim() && (
            <>
              <div className="flex flex-wrap items-center gap-1.5 lg:gap-2 mt-2 lg:mt-3">
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
              </div>
              <div className="mt-2 lg:mt-2.5">
                <DatePicker large value={followDate} onChange={setFollowDate} placeholder="다른 날짜 고르기" className={pickerCls} />
              </div>
            </>
          )}
          {visit?.status === 'done' && followUp.trim() && (
            <button
              type="button"
              onClick={() => setFollowDone(!followDone)}
              aria-pressed={followDone}
              className="mt-2 lg:mt-3 flex items-center gap-1.5 text-[12.5px] lg:text-[15px] font-semibold text-gray-600 dark:text-white/65"
            >
              <span className={`material-icons-outlined text-[18px] lg:text-[22px] ${followDone ? 'text-brand' : ''}`}>
                {followDone ? 'check_box' : 'check_box_outline_blank'}
              </span>
              마친 일로 표시
            </button>
          )}
        </div>
      )}
      </div>{/* /오른쪽: 나눈 이야기·후속 할 일 */}
      </div>
    </PastorModal>
  )
}

export default VisitComposer
