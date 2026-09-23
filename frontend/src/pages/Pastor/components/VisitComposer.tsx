// 심방 기록 쓰기·고치기 — 내용과 후속 할 일은 작성한 교역자만 본다.
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
} from '../../../api/pastor'
import { FieldLabel, GhostButton, PastorModal, PrimaryButton } from './ui'
import { inputCls, todayIso } from './pastorUtils'

const KINDS = Object.keys(VISIT_KIND_LABEL) as VisitKind[]

const DATE_CHIPS = [
  { label: '오늘', offset: 0 },
  { label: '어제', offset: -1 },
  { label: '그저께', offset: -2 },
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
  onClose: () => void
}

const chipCls = (active: boolean) =>
  `px-3 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors ${
    active
      ? 'bg-brand border-brand text-white'
      : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
  }`

const VisitComposer = ({ memberId, memberName, visit, onClose }: Props) => {
  const qc = useQueryClient()
  const [visitDate, setVisitDate] = useState(visit?.visit_date ?? todayIso())
  const [kind, setKind] = useState<VisitKind>(visit?.kind ?? 'visit')
  const [summary, setSummary] = useState(visit?.summary ?? '')
  const [followUp, setFollowUp] = useState(visit?.follow_up ?? '')
  const [followDate, setFollowDate] = useState(visit?.follow_up_date ?? '')
  const [followDone, setFollowDone] = useState(visit?.follow_up_done ?? false)

  const refresh = () => {
    for (const key of [['pastor-member', memberId], ['pastor-roster'], ['pastor-visits'], ['pastor-home']]) {
      void qc.invalidateQueries({ queryKey: key, refetchType: 'all' })
    }
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        visit_date: visitDate,
        kind,
        summary,
        follow_up: followUp,
        follow_up_date: followUp.trim() && followDate ? followDate : null,
      }
      return visit
        ? updateVisit(visit.id, { ...payload, follow_up_done: followDone })
        : createVisit(memberId, payload)
    },
    onSuccess: () => {
      showToast(visit ? '심방 기록을 고쳤습니다' : '심방 기록을 남겼습니다', 'success')
      refresh()
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: () => deleteVisit(visit!.id),
    onSuccess: () => {
      showToast('심방 기록을 지웠습니다', 'success')
      refresh()
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <PastorModal
      title={`${memberName} · ${visit ? '심방 기록 고치기' : '심방 기록'}`}
      onClose={onClose}
      footer={
        <>
          {visit && (
            <GhostButton
              danger
              onClick={() => (confirmDelete ? remove.mutate() : setConfirmDelete(true))}
            >
              {confirmDelete ? '정말 지우기' : '지우기'}
            </GhostButton>
          )}
          <PrimaryButton disabled={!visitDate || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? '저장 중...' : '저장'}
          </PrimaryButton>
        </>
      }
    >
      <p className="flex items-center gap-1.5 text-[11.5px] text-gray-500 dark:text-white/45">
        <span className="material-icons-outlined text-[15px] text-brand">lock</span>
        내용과 후속 할 일은 목사님만 봅니다. 다른 교역자에게는 날짜와 방식만 보입니다.
      </p>

      <div>
        <FieldLabel>언제</FieldLabel>
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_CHIPS.map(c => {
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
            max={todayIso()}
            onChange={e => setVisitDate(e.target.value)}
          />
        </div>
      </div>

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
        <FieldLabel>나눈 이야기</FieldLabel>
        <textarea
          className={`${inputCls} min-h-[120px] resize-y`}
          value={summary}
          maxLength={4000}
          placeholder="형편, 기도 제목, 함께 읽은 말씀 등"
          onChange={e => setSummary(e.target.value)}
        />
      </label>

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
        {visit && followUp.trim() && (
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
    </PastorModal>
  )
}

export default VisitComposer
