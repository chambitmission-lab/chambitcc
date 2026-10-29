// 캡슐함의 '편지 도착 안내판' — 언덕 위에 떠 있는 유리 안내판(라이트 = 낮의 역, 다크 = 밤의 역).
//   · 맨 위: 다음에 도착할 편지까지 일·시간·분·초 실시간 카운트다운(스플릿 플랩)
//   · 그 아래: 도착한 편지 목록(children — CapsuleMailbox 의 달별 서랍이 그대로 들어온다)
// 밤의 역에서는 안내판 안의 테마 토큰을 밤 유리 색으로 다시 정의한다(station.css).
// 그래서 목록 행(.capsule-row)·서랍·더 보기는 컴포넌트를 바꾸지 않고도 유리 카드로 바뀐다.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { CapsuleSummary } from '../../../types/timeCapsule'
import { capsuleKeys } from '../../../hooks/useTimeCapsule'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import { formatKoreanDate } from '../capsuleDates'
import { counterpartLabel } from '../capsuleGroups'
import { FlapNumber } from './SplitFlap'

// 블루 캔디 숫자판의 동글동글한 숫자(0~9만 담긴 작은 조각)
void ensureFontFamily('fredokaDigits')

/** 1초마다 지금 시각 — 카운트다운과 안내판 시계가 같은 박자로 움직인다 */
const useNow = () => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

const timeOfDay = (d: Date) => {
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${m ? ` ${m}분` : ''}`
}

const clockLabel = (ms: number) => {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const CountGroup = ({
  value,
  unit,
  pad,
  spin,
  gold,
}: {
  value: number
  unit: string
  pad: number
  spin: number
  gold?: boolean
}) => (
  <span className={`capsule-next__group${gold ? ' is-gold' : ''}`}>
    <FlapNumber value={value} pad={pad} spin={spin} />
    <small>{unit}</small>
  </span>
)

const NextArrival = ({ capsule, now }: { capsule: CapsuleSummary; now: number }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const target = useMemo(() => new Date(capsule.open_at), [capsule.open_at])
  const left = Math.max(0, Math.floor((target.getTime() - now) / 1000))
  const arrived = left === 0

  // 보는 중에 도착 시각이 지나면 목록을 다시 받아 도착함으로 옮긴다 (한 번만)
  const refreshed = useRef(false)
  useEffect(() => {
    if (!arrived || refreshed.current) return
    refreshed.current = true
    void queryClient.invalidateQueries({ queryKey: capsuleKeys.list() })
  }, [arrived, queryClient])

  const days = Math.floor(left / 86_400)
  const hours = Math.floor((left % 86_400) / 3_600)
  const minutes = Math.floor((left % 3_600) / 60)
  const seconds = left % 60
  const name = capsule.title || counterpartLabel(capsule)
  // 하루 안으로 들어오면 '일' 칸을 걷고 시·분·초를 키운다 — 마지막 하루는 시계를 보는 시간이다
  const lastDay = days === 0

  return (
    <button
      type="button"
      onClick={() => navigate(`/capsule/${capsule.id}`)}
      className={`capsule-next${lastDay ? ' is-last-day' : ''}`}
      aria-label={`다음 도착 편지 ${name}, ${formatKoreanDate(capsule.open_at)} ${
        arrived ? '도착했어요' : days > 0 ? `${days}일 남음` : `${hours}시간 ${minutes}분 남음`
      }`}
    >
      <span className="capsule-next__info">
        <span className="capsule-next__eyebrow">NEXT ARRIVAL · 다음 도착</span>
        <span className="capsule-next__title">
          <span className="capsule-next__env" aria-hidden />
          <span className="min-w-0">
            <b>{name}</b>
            <small>
              {formatKoreanDate(capsule.open_at)} {timeOfDay(target)}
              {capsule.open_label ? ` · ${capsule.open_label}` : ''}
            </small>
          </span>
        </span>
      </span>

      {arrived ? (
        <span className="capsule-next__arrived">편지가 도착했어요 · 열어보기</span>
      ) : (
        <span className="capsule-next__count" aria-hidden>
          {!lastDay && <CountGroup value={days} unit="일" pad={2} spin={6} gold />}
          <CountGroup value={hours} unit="시간" pad={2} spin={4} />
          <CountGroup value={minutes} unit="분" pad={2} spin={4} />
          <CountGroup value={seconds} unit="초" pad={2} spin={2} />
        </span>
      )}

      {!arrived && (
        <span className="capsule-next__msg">
          지금 이 순간에도 편지가 <b>한 칸씩</b> 다가오고 있어요
        </span>
      )}
    </button>
  )
}

const ClockGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

const CapsuleStation = ({
  next,
  arrivedTotal,
  unreadTotal,
  sealedCount,
  children,
}: {
  next: CapsuleSummary | null
  arrivedTotal: number
  unreadTotal: number
  sealedCount: number
  children?: ReactNode
}) => {
  const now = useNow()

  return (
    <section className="capsule-station" aria-label="편지 도착 안내">
      <div className="capsule-station__board">
        {next && <NextArrival capsule={next} now={now} />}

        <div className="capsule-station__head">
          <div className="min-w-0">
            <h3>
              도착한 편지
              {arrivedTotal > 0 && <span>{arrivedTotal}통</span>}
            </h3>
            <p>과거의 내가, 사랑하는 이가 보낸 편지</p>
          </div>
          {unreadTotal > 0 && <span className="capsule-station__unread">{unreadTotal}통 안 읽음</span>}
          <span className="capsule-station__clock">
            <ClockGlyph />
            {clockLabel(now)}
          </span>
        </div>

        {children ?? (
          <p className="capsule-station__empty">
            아직 도착한 편지가 없어요.
            {next && (
              <>
                <br />첫 편지는 {formatKoreanDate(next.open_at)} 아침에 도착해요.
              </>
            )}
          </p>
        )}

        {sealedCount > 0 && (
          <p className="capsule-station__foot">
            <i aria-hidden />
            기다리는 편지 {sealedCount}통이 모두 정시에 오고 있어요
          </p>
        )}
      </div>
    </section>
  )
}

export default CapsuleStation
