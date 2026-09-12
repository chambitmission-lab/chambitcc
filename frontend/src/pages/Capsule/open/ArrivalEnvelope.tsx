// 도착한 캡슐 = 밀랍 인장을 직접 뜯는 우편물.

import { useEffect, useRef, useState } from 'react'
import type { CapsuleDetail } from '../../../types/timeCapsule'
import { Icon, LockShackle, SigilGlyph } from '../capsuleIcons'
import { addressTo, postmark } from './letterText'

/* ── 도착한 캡슐 = 밀랍 인장을 직접 뜯는 우편물 ────────────────────
   파란 버튼 한 번으로 끝내면 기대감이 쌓일 틈이 없다. 인장을 1초간 꾹 누르는
   동안 링이 차오르고 밀랍이 버티다 갈라지는 시간이 이 화면의 감정이다.
   (키보드·보조기기는 Enter/Space로 즉시 개봉 — 꾹 누르기는 촉감이지 관문이 아니다) */
const HOLD_MS = 1000
const BYPASS_AFTER_MS = 9000

const ArrivalEnvelope = ({
  capsule,
  opening,
  onOpen,
}: {
  capsule: CapsuleDetail
  opening: boolean
  onOpen: () => void
}) => {
  const [holding, setHolding] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [bypass, setBypass] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const nudgeTimer = useRef<number | undefined>(undefined)

  const mark = postmark(capsule.sealed_at)
  const hasPhoto = (capsule.photo_count ?? 0) > 0

  useEffect(() => {
    const t = window.setTimeout(() => setBypass(true), BYPASS_AFTER_MS)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(timer.current)
      window.clearTimeout(nudgeTimer.current)
    }
  }, [])

  const startHold = () => {
    if (opening || timer.current !== undefined) return
    setHolding(true)
    // 밀랍에 손이 닿은 순간의 촉감 (미지원 브라우저는 조용히 무시)
    navigator.vibrate?.(10)
    timer.current = window.setTimeout(() => {
      timer.current = undefined
      setHolding(false)
      onOpen()
    }, HOLD_MS)
  }

  // 다 누르기 전에 손을 뗐다 — 밀랍이 다시 굳고, 안내가 흔들려 알려준다
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
    <>
      {/* 부유 애니메이션은 클래스를 떼지 않고 --opening에서 정지시킨다.
          중간에 떼면 봉투가 원위치로 톡 떨어지듯 튄다. */}
      <div className="capsule-mailpiece capsule-mailpiece--idle">
        {/* 봉투 밖으로 삐져나온 것들 — 안에 뭔가 들어 있다 */}
        {hasPhoto && (
          <span className="capsule-mailpiece__peek capsule-mailpiece__peek--photo" aria-hidden>
            <i />
          </span>
        )}
        <span className="capsule-mailpiece__peek capsule-mailpiece__peek--paper" aria-hidden />

        {/* 개봉 연출에서 솟아오르는 속지 (몸통 뒤에 숨어 있다) */}
        <div className="capsule-mailpiece__letter" aria-hidden />

        <div className="capsule-mailpiece__body">
          <span className="capsule-mailpiece__air" aria-hidden />
        </div>
        <div className="capsule-mailpiece__flap" aria-hidden />

        <span className="capsule-mailpiece__stamp" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
            <SigilGlyph />
          </svg>
        </span>
        <span className="capsule-mailpiece__postmark" aria-hidden>
          <b>{mark.year}</b>
          <i>{mark.day}</i>
          <em>SEALED</em>
        </span>
        <p className="capsule-mailpiece__to">
          To. <b>{addressTo(capsule)}</b>
        </p>

        <button
          type="button"
          className={`capsule-wax ${holding ? 'capsule-wax--holding' : ''} ${
            opening ? 'capsule-wax--released' : ''
          }`}
          onPointerDown={startHold}
          onPointerUp={abortHold}
          onPointerLeave={abortHold}
          onPointerCancel={abortHold}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen()
            }
          }}
          disabled={opening}
          aria-label="밀랍 인장을 꾹 눌러 봉투 뜯기"
        >
          <span className="capsule-wax__disc">
            <span className="capsule-wax__half capsule-wax__half--l" />
            <span className="capsule-wax__half capsule-wax__half--r" />
            <span className="capsule-wax__glare" aria-hidden />
            <span className="capsule-wax__sigil">
              <Icon size={19}>
                <LockShackle open />
              </Icon>
            </span>
          </span>
          <svg className="capsule-wax__ring" viewBox="0 0 72 72" aria-hidden>
            <circle cx="36" cy="36" r="34" />
          </svg>
        </button>
      </div>

      <div className="mt-7">
        {opening ? (
          <span className="capsule-arrival__hint">봉인이 풀렸어요</span>
        ) : (
          <span className={`capsule-arrival__hint ${nudge ? 'capsule-arrival__hint--nudge' : ''}`}>
            <i aria-hidden />
            {nudge ? '떼지 말고 조금만 더 —' : '인장을 꾹 눌러 뜯어주세요'}
          </span>
        )}
      </div>

      {bypass && !opening && (
        <div className="mt-3.5">
          <button type="button" className="capsule-arrival__bypass" onClick={onOpen}>
            바로 열기
          </button>
        </div>
      )}
    </>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { ArrivalEnvelope }
