/**
 * 지금 쓰는 절 카드의 조각들 (TypingSession.tsx 의 renderActive 에서 분리)
 *
 * - ActiveVerseLabel : 절 번호 줄 — 릴레이 방이면 칸 상태(빈칸·내 차례·누가 채운 칸), 아니면 '이미 쓴 절'. 새김 도장도 여기
 * - OutcomeBox       : 한 절을 쓴 결과 — 통과(정확도·타수·읽음·개인 최고) 또는 실패(사유·다시 쓰기·다음 절)
 * - CheerFloats      : 내게 온 응원 말풍선
 */
import type { TypingRelayDetail } from '../../../../api/bibleTyping'
import type { CheerFloat, Outcome, SessionVerse } from './sessionModel'

interface LabelProps {
  verse: SessionVerse
  room: TypingRelayDetail | null
  myId: number | undefined
  isDone: boolean
  passed: boolean
  hidden: boolean
}

const RoomSlotLabel = ({ verse, room, myId }: { verse: SessionVerse; room: TypingRelayDetail; myId: number | undefined }) => {
  const slot = room.verses.find((rv) => rv.id === verse.id)
  if (!slot?.by) {
    const turn = room.turn
    // '내 차례'는 실제로 내게 바통이 왔을 때만. 남의 차례인 칸도 막지는 않는다
    if (turn && turn.verse === verse.verse && turn.user_id !== myId)
      return (
        <>
          <span className="bt-verse-no">
            {turn.name}님 차례 · {verse.label}절
          </span>
          <span className="bt-badge">먼저 써도 괜찮아요</span>
        </>
      )
    if (turn && turn.verse === verse.verse) return <span className="bt-verse-no bt-room-turn">내 차례 · {verse.label}절</span>
    return <span className="bt-verse-no">빈칸 · {verse.label}절</span>
  }
  return (
    <>
      <span className="bt-verse-no">{verse.label}절</span>
      <span className="bt-badge">{slot.by.user_id === myId ? '내가 채운 칸' : `${slot.by.name}님이 채운 칸`}</span>
    </>
  )
}

export const ActiveVerseLabel = ({ verse, room, myId, isDone, passed, hidden }: LabelProps) => (
  <div className="bt-card__label" hidden={hidden}>
    {room ? (
      <RoomSlotLabel verse={verse} room={room} myId={myId} />
    ) : (
      <>
        <span className="bt-verse-no">{verse.label}절</span>
        {isDone && !passed && <span className="bt-badge">이미 쓴 절</span>}
      </>
    )}
    {/* 새김 도장 — 카드 모서리가 아니라 절 번호 줄에 붙인다(위에 함께 쓰는 줄이 와도 겹치지 않게) */}
    {passed && (
      <span className="bt-seal" aria-hidden>
        새김
      </span>
    )}
  </div>
)

interface OutcomeProps {
  outcome: Outcome
  hasNext: boolean
  onRetry: () => void
  onNext: () => void
}

export const OutcomeBox = ({ outcome, hasNext, onRetry, onNext }: OutcomeProps) => (
  <div className={`bt-outcome bt-outcome--${outcome.status}`} role="status">
    {outcome.status === 'passed' && (
      <>
        <span className="material-icons-round" aria-hidden>
          check_circle
        </span>
        <span>
          정확도 <b>{Math.round(outcome.accuracy * 100)}%</b> · <b>{outcome.cpm}</b>타/분
          {outcome.newlyRead && ' · 읽음 완료'}
        </span>
        {outcome.personalBest && <span className="bt-badge bt-badge--best">개인 최고 기록!</span>}
      </>
    )}
    {outcome.status === 'failed' && (
      <>
        <span>
          {outcome.note ?? (
            <>
              정확도 <b>{Math.round(outcome.accuracy * 100)}%</b> — 95% 이상이면 완료돼요
            </>
          )}
        </span>
        <span className="bt-outcome__actions">
          <button type="button" className="bt-btn bt-btn--primary" onClick={onRetry}>
            다시 쓰기
          </button>
          {hasNext && (
            <button type="button" className="bt-btn" onClick={onNext}>
              다음 절
            </button>
          )}
        </span>
      </>
    )}
    {outcome.status === 'passed' && outcome.note && <span className="bt-outcome__note">{outcome.note}</span>}
  </div>
)

export const CheerFloats = ({ cheers }: { cheers: CheerFloat[] }) =>
  cheers.length > 0 ? (
    <div className="bt-room-floats" aria-live="polite">
      {cheers.map((c) => (
        <span key={c.id} className={`bt-room-float bt-hue-${c.hue}`}>
          {c.text}
        </span>
      ))}
    </div>
  ) : null
