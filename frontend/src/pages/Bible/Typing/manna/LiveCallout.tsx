import type { MannaLive } from '../../../../api/bibleTyping'
import { useTickingNow } from '../../../../hooks/useTickingNow'
import { parseApiDate } from '../../../../utils/dateUtils'
import { hhmm, leftLabel, modeLabel, untilLabel } from './mannaPageShared'

// ── 라이브 한 판 안내(시작 카드) ─────────────────────────

export const LiveCallout = ({ live, onJoin, disabled }: { live: MannaLive; onJoin: () => void; disabled: boolean }) => {
  const now = useTickingNow(1000, !!live.current)
  if (live.current) {
    const left = parseApiDate(live.current.ends_at).getTime() - now
    return (
      <div className="mn-live mn-live--on">
        <span className="mn-live__dot" aria-hidden />
        <div className="mn-live__body">
          <strong>만나 라이브 진행 중 · {leftLabel(left)}</strong>
          <span>
            교회 전체가 지금 같은 판을 쳐요 · {modeLabel(live.mode)} · 지금 {live.current.board.players}명
          </span>
        </div>
        <button type="button" className="mn-live__btn" disabled={disabled} onClick={onJoin}>
          참여
        </button>
      </div>
    )
  }
  if (!live.next) return null
  const until = parseApiDate(live.next.starts_at).getTime() - now
  return (
    <div className="mn-live">
      <span className="material-icons-round mn-live__icon" aria-hidden>
        podcasts
      </span>
      <div className="mn-live__body">
        <strong>
          다음 만나 라이브 · {live.next.weekday}요일 {hhmm(live.next.starts_at)}
        </strong>
        <span>
          {untilLabel(until)} · {live.minutes}분 동안 교회 전체가 동시에 · 끝난 사람 점수가 실시간으로 흘러요
        </span>
      </div>
    </div>
  )
}
