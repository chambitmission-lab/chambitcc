// 봉인 대기 화면 조각 — 정보 칩 · 봉인 다이얼 · 가려진 편지 프리뷰.

import type { ReactNode } from 'react'
import type { CapsuleDetail } from '../../../types/timeCapsule'
import { daysSealed, daysUntil, formatKoreanDate, sealProgress } from '../capsuleDates'
import { Icon, LockShackle } from '../capsuleIcons'

/** 봉인 정보 칩 — 이모지 나열 대신 한 줄로 정리 */
const MetaChip = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12px] font-bold text-gray-600 dark:text-white/60">
    <Icon>{icon}</Icon>
    {children}
  </span>
)

/* ── 봉인 다이얼 ──────────────────────────────────────────────
   눈금 60개는 요소가 아니라 dasharray로 그린다.
   stroke-width가 반지름 방향이므로 짧은 dash = 방사형 눈금. */
const DIAL = 208
const TICK_R = 98
const ARC_R = 86
const TICK_LEN = 2 * Math.PI * TICK_R
const ARC_LEN = 2 * Math.PI * ARC_R
const TICK_GAP = TICK_LEN / 60

const SealDial = ({ sealedAt, openAt }: { sealedAt: string; openAt: string }) => {
  const progress = sealProgress(sealedAt, openAt)
  return (
    <div className="capsule-dial">
      <div className="capsule-dial__halo" />
      <svg className="capsule-dial__svg" viewBox={`0 0 ${DIAL} ${DIAL}`}>
        <circle
          className="capsule-dial__ticks"
          cx={DIAL / 2}
          cy={DIAL / 2}
          r={TICK_R}
          fill="none"
          strokeWidth={7}
          strokeDasharray={`${(TICK_GAP * 0.2).toFixed(2)} ${(TICK_GAP * 0.8).toFixed(2)}`}
        />
        <circle
          className="capsule-dial__track"
          cx={DIAL / 2}
          cy={DIAL / 2}
          r={ARC_R}
          fill="none"
          strokeWidth={4.5}
        />
        <circle
          className="capsule-dial__arc"
          cx={DIAL / 2}
          cy={DIAL / 2}
          r={ARC_R}
          fill="none"
          strokeWidth={4.5}
          strokeDasharray={ARC_LEN}
          strokeDashoffset={ARC_LEN * (1 - progress)}
        />
      </svg>
      <div className="capsule-dial__core">
        <span className="capsule-dial__lock">
          <Icon size={17}>
            <LockShackle />
          </Icon>
        </span>
        <span className="capsule-dial__label">개봉까지</span>
        <span className="capsule-dial__dday">D-{daysUntil(openAt)}</span>
        <span className="capsule-dial__elapsed">봉인 {daysSealed(sealedAt)}일째</span>
      </div>
    </div>
  )
}

/** 봉인된 편지 프리뷰 — 내용을 못 받는다는 사실 자체를 화면 언어로 쓴다 */
const REDACTED_WIDTHS = ['100%', '93%', '76%', '88%', '48%']

const SealedLetterPreview = ({ capsule }: { capsule: CapsuleDetail }) => (
  <div className="capsule-redacted">
    <p className="capsule-redacted__label">
      <Icon size={13}>
        <LockShackle />
      </Icon>
      봉인된 편지
    </p>
    <div className="capsule-redacted__lines" aria-hidden>
      {REDACTED_WIDTHS.map((w) => (
        <span key={w} className="capsule-redacted__line" style={{ width: w }} />
      ))}
    </div>
    {(capsule.photo_count ?? 0) > 0 && (
      <div className="capsule-redacted__strip" aria-hidden>
        {Array.from({ length: Math.min(capsule.photo_count ?? 0, 4) }).map((_, i) => (
          <span key={i} className="capsule-redacted__thumb" />
        ))}
      </div>
    )}
    <p className="capsule-redacted__foot">
      {formatKoreanDate(capsule.open_at)}
      {capsule.open_label ? ` (${capsule.open_label})` : ''} 아침에 열려요
    </p>
  </div>
)

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { MetaChip, SealDial, SealedLetterPreview }
