import { useState } from 'react'
import type { ElectionAdminDetail, OpenRoundPayload } from '../../../../types/election'
import { ClosesPicker, Toggle } from './RoundOptions'
import { toIso } from './toIso'

// ── 첫 회차 시작 ──────────────────────────────────────────────────────

export const StartPanel = ({
  election,
  pending,
  onStart,
  togetherTitles = [],
}: {
  election: ElectionAdminDetail
  pending: boolean
  /** together — 같은 공동의회의 다른 선거도 함께 연다 */
  onStart: (data: OpenRoundPayload, together: boolean) => void
  /** 함께 시작할 수 있는(아직 열지 않은) 같은 공동의회의 다른 선거 */
  togetherTitles?: string[]
}) => {
  const [practice, setPractice] = useState(false)
  const [notify, setNotify] = useState(true)
  const [closes, setCloses] = useState('')
  const [together, setTogether] = useState(false)
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Toggle
          checked={practice}
          onChange={(v) => {
            setPractice(v)
            setNotify(!v) // 연습은 보통 알림 없이
          }}
        >
          연습 투표로 먼저 해 보기
        </Toggle>
        <Toggle checked={notify} onChange={setNotify}>
          선거인에게 시작 알림 보내기
        </Toggle>
        {togetherTitles.length ? (
          <Toggle checked={together} onChange={setTogether}>
            {`${togetherTitles.join(' · ')}도 함께 시작`}
          </Toggle>
        ) : null}
      </div>
      <div>
        <p className="text-[12px] font-bold text-ink-muted mb-1.5">마감</p>
        <ClosesPicker value={closes} onChange={setCloses} />
      </div>
      {practice ? (
        <p className="text-[11.5px] text-ink-muted break-keep">
          연습 투표는 선거인 화면에 &lsquo;연습&rsquo; 띠가 붙고, 끝나면 &lsquo;연습 정리&rsquo;로 표를 모두 지워요.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onStart({ practice, notify, closes_at: toIso(closes) }, together && togetherTitles.length > 0)}
        disabled={pending || !election.candidates.length}
        className="w-full py-3 rounded-xl bg-brand text-white text-[14.5px] font-bold disabled:opacity-50"
      >
        {practice ? '연습 투표' : '1차 투표'}
        {together && togetherTitles.length ? ` ${togetherTitles.length + 1}개 함께 시작` : ' 시작'}
      </button>
    </div>
  )
}
