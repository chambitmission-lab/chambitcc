// 봉인 = 금빛 밀랍 인장을 1초 꾹 누르기.
// 개봉 화면(ArrivalTrail)이 꾹 눌러 여니, 봉인도 같은 손짓으로 찍는다 —
// 시작과 끝이 거울상이다. 꾹 누르기가 "정말 봉인할까요?" 확인을 대신한다
// (예전엔 버튼을 두 번 눌러야 했다). 키보드·보조기기는 Enter/Space로 즉시 봉인.
import { useEffect, useRef, useState } from 'react'

const HOLD_MS = 1000

const SealHold = ({
  disabled,
  pending,
  onSeal,
}: {
  disabled: boolean
  pending: boolean
  onSeal: () => void
}) => {
  const [holding, setHolding] = useState(false)
  const [nudge, setNudge] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const nudgeTimer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      window.clearTimeout(nudgeTimer.current)
    },
    [],
  )

  const startHold = () => {
    if (disabled || pending || timer.current !== undefined) return
    setHolding(true)
    navigator.vibrate?.(10)
    timer.current = window.setTimeout(() => {
      timer.current = undefined
      setHolding(false)
      navigator.vibrate?.([12, 40, 24])
      onSeal()
    }, HOLD_MS)
  }

  // 다 누르기 전에 뗐다 — 밀랍이 다시 굳고 안내가 흔들린다
  const abortHold = () => {
    if (timer.current === undefined) return
    window.clearTimeout(timer.current)
    timer.current = undefined
    setHolding(false)
    setNudge(true)
    window.clearTimeout(nudgeTimer.current)
    nudgeTimer.current = window.setTimeout(() => setNudge(false), 700)
  }

  return (
    <div className="cw-seal">
      <button
        type="button"
        className={`cw-wax ${holding ? 'cw-wax--holding' : ''} ${pending ? 'cw-wax--pending' : ''}`}
        onPointerDown={startHold}
        onPointerUp={abortHold}
        onPointerLeave={abortHold}
        onPointerCancel={abortHold}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled && !pending) onSeal()
          }
        }}
        disabled={disabled || pending}
        aria-label="밀랍 인장을 꾹 눌러 캡슐 봉인하기"
      >
        <span className="cw-wax__disc">
          <svg viewBox="0 0 32 32" aria-hidden>
            <path d="M16 5.5l2.6 6.9 7.2.5-5.6 4.6 1.9 7.1L16 20.6l-6.1 4 1.9-7.1-5.6-4.6 7.2-.5z" />
          </svg>
        </span>
        <svg className="cw-wax__ring" viewBox="0 0 100 100" aria-hidden>
          <circle className="cw-wax__ring-bg" cx="50" cy="50" r="46" />
          <circle className="cw-wax__ring-fill" cx="50" cy="50" r="46" />
        </svg>
      </button>
      <p className={`cw-seal__hint ${nudge ? 'cw-seal__hint--nudge' : ''}`}>
        {pending ? '봉인하는 중…' : nudge ? '떼지 말고 조금만 더 —' : '인장을 꾹 눌러 문 닫기'}
      </p>
    </div>
  )
}

export default SealHold
