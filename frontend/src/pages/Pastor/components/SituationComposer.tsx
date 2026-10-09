// 지금 겪는 일 남기기/고치기 — 투병·사별·출산·이사… 시작일과 함께.
// 명부처럼 교역자끼리 함께 보고 고친다. 시작일이 있어야 목회 비서가 '사별 한 달', '출산 2주' 같은 때를 짚는다.
// 지나간 일은 지우지 않고 '지나갔어요'로 마친다 — 지난 형편도 다음 심방의 맥락이라서. 지우기는 잘못 남긴 것만.
import { pastorKeys } from '../../../hooks/queryKeys'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../../utils/toast'
import {
  SITUATION_KIND_ICON,
  SITUATION_KIND_LABEL,
  SITUATION_RULE_HINT,
  SITUATION_START_LABEL,
  createSituation,
  deleteSituation,
  updateSituation,
  type MemberSituation,
  type SituationKind,
} from '../../../api/pastor'
import DatePicker from '../../../components/common/DatePicker'
import { FieldLabel, GhostButton, PastorModal, PrimaryButton } from './ui'
import { inputCls, pickerCls, todayIso } from './pastorUtils'

const KINDS = Object.keys(SITUATION_KIND_LABEL) as SituationKind[]

const DATE_CHIPS = [
  { label: '오늘', offset: 0 },
  { label: '어제', offset: -1 },
  { label: '1주 전', offset: -7 },
  { label: '한 달 전', offset: -30 },
]

const NOTE_PLACEHOLDER: Record<SituationKind, string> = {
  illness: '예: 위암 수술, 서울대병원 입원',
  bereavement: '예: 모친상',
  birth: '예: 둘째 딸',
  move: '예: 분당으로 이사',
  job: '예: 회사 정리해고, 구직 중',
  family: '예: 부부 갈등으로 상담 중',
  other: '예: 수능 준비 중인 자녀',
}

const chipCls = (active: boolean) =>
  `px-3 py-1.5 lg:px-4 lg:py-2.5 rounded-full border text-[12.5px] lg:text-[15px] font-semibold transition-colors ${
    active
      ? 'bg-brand border-brand text-white'
      : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
  }`

interface Props {
  memberId: number
  memberName: string
  /** 있으면 고치기 */
  situation?: MemberSituation
  onClose: () => void
}

/** 지금 겪는 일이 바뀌면 비서 제안·브리핑·명부 태그가 함께 바뀐다 */
const useRefreshSituations = (memberId: number) => {
  const qc = useQueryClient()
  return () => {
    for (const key of [
      pastorKeys.member(memberId),
      pastorKeys.roster(),
      pastorKeys.home(),
      pastorKeys.suggestions(),
      pastorKeys.briefing(memberId),
    ]) {
      void qc.invalidateQueries({ queryKey: key })
    }
  }
}

const SituationComposer = ({ memberId, memberName, situation, onClose }: Props) => {
  const refresh = useRefreshSituations(memberId)
  const [kind, setKind] = useState<SituationKind>(situation?.kind ?? 'illness')
  const [startedOn, setStartedOn] = useState(situation?.started_on ?? todayIso())
  const [note, setNote] = useState(situation?.note ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const ended = !!situation?.ended_on

  const done = (msg: string) => {
    showToast(msg, 'success')
    refresh()
    onClose()
  }

  const save = useMutation({
    mutationFn: () =>
      situation
        ? updateSituation(situation.id, { kind, started_on: startedOn, note })
        : createSituation(memberId, { kind, started_on: startedOn, note }),
    onSuccess: () => done(situation ? '고쳤습니다' : '지금 겪는 일로 남겼습니다'),
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const toggleEnd = useMutation({
    mutationFn: () => updateSituation(situation!.id, { ended: !ended }),
    onSuccess: () => done(ended ? '다시 겪는 중으로 돌렸습니다' : '지나간 일로 옮겼습니다'),
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: () => deleteSituation(situation!.id),
    onSuccess: () => done('지웠습니다'),
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const dateOk = !!startedOn && startedOn <= todayIso()
  const busy = save.isPending || toggleEnd.isPending || remove.isPending

  return (
    <PastorModal
      title={`${memberName} · ${situation ? '지금 겪는 일 고치기' : '지금 겪는 일'}`}
      onClose={onClose}
      footer={
        <>
          {situation && (
            <GhostButton danger onClick={() => (confirmDelete ? remove.mutate() : setConfirmDelete(true))}>
              {confirmDelete ? '정말 지우기' : '지우기'}
            </GhostButton>
          )}
          {situation && (
            <GhostButton onClick={() => !busy && toggleEnd.mutate()}>{ended ? '다시 겪는 중' : '지나갔어요'}</GhostButton>
          )}
          <PrimaryButton disabled={!dateOk || busy} onClick={() => save.mutate()}>
            {save.isPending ? '저장 중...' : '저장'}
          </PrimaryButton>
        </>
      }
    >
      <p className="flex items-start gap-1.5 text-[12px] lg:text-[14px] leading-relaxed text-gray-600 dark:text-white/60">
        <span className="material-icons-outlined text-[15px] lg:text-[18px] text-brand mt-0.5 lg:mt-[1px]">group</span>
        명부처럼 교역자 모두가 함께 봅니다. 성도 본인에게는 보이지 않아요.
      </p>

      <div>
        <FieldLabel>어떤 일인가요</FieldLabel>
        <div className="grid grid-cols-4 gap-1.5 lg:gap-2">
          {KINDS.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`flex flex-col items-center gap-1 py-2.5 lg:py-3.5 rounded-xl border text-[12px] lg:text-[14px] font-semibold transition-colors ${
                kind === k
                  ? 'bg-[var(--brand-soft)] border-brand text-brand'
                  : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
              }`}
            >
              <span className="material-icons-outlined text-[20px] lg:text-[24px]">{SITUATION_KIND_ICON[k]}</span>
              {SITUATION_KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[12px] lg:text-[14px] font-semibold text-brand">
          <span className="material-icons-outlined text-[15px] lg:text-[18px]">notifications_active</span>
          {SITUATION_RULE_HINT[kind]}
        </p>
      </div>

      <div>
        <FieldLabel>{SITUATION_START_LABEL[kind]}</FieldLabel>
        <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
          {DATE_CHIPS.map(c => {
            const v = todayIso(c.offset)
            return (
              <button key={c.label} type="button" className={chipCls(startedOn === v)} onClick={() => setStartedOn(v)}>
                {c.label}
              </button>
            )
          })}
        </div>
        <div className="mt-2 lg:mt-2.5">
          <DatePicker large value={startedOn} onChange={setStartedOn} maxDate={todayIso()} className={pickerCls} />
        </div>
        {startedOn > todayIso() && (
          <p className="mt-1.5 text-[12px] lg:text-[14px] font-semibold text-[var(--amber)]">앞날로는 남길 수 없어요</p>
        )}
      </div>

      <label className="block">
        <FieldLabel hint={kind === 'other' ? '목록에 이 말이 이름으로 보여요' : '선택'}>한 줄 메모</FieldLabel>
        <input
          className={`${inputCls} lg:px-5 lg:py-3.5 lg:text-[17px]`}
          value={note}
          maxLength={200}
          placeholder={NOTE_PLACEHOLDER[kind]}
          onChange={e => setNote(e.target.value)}
        />
      </label>
    </PastorModal>
  )
}

export default SituationComposer
