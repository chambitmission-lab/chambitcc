/**
 * 필사 세션의 전체 화면 모달 세 가지 (TypingSession.tsx 에서 분리)
 *
 * - GoalMomentDialog : 오늘 목표 달성 — 등잔이 가득 찬 순간, 내일 이어질 말씀
 * - RelayDoneDialog  : 릴레이 완성 — 마지막 칸을 내가 채웠을 때 함께한 사람들
 * - SummaryDialog    : 장 필사 완료 — 이번 세션 숫자, 다음 장·말씀 카드·홈
 * 모두 보여 주기만 하고, 무엇을 할지는 부모가 콜백으로 정한다.
 */
import type { TypingRelayDetail, TypingStats } from '../../../../api/bibleTyping'
import { chapterUnit } from '../../../../utils/bibleLabels'
import Lamp from '../home/Lamp'
import { teaser } from '../home/teaser'
import { formatDuration } from '../typingPrefs'
import type { SessionSummary, SessionVerse } from './sessionModel'

export interface NextChapter {
  book: number
  chapter: number
  name: string
}

interface GoalMomentProps {
  goal: number
  stats: TypingStats | undefined
  /** 이어 쓸 절(장 끝이면 null) */
  nextVerse: SessionVerse | null
  bookName: string
  chapter: number
  nextChapter: NextChapter | null
  /** 바통을 넘기고 기다리는 중 — 버튼이 '확인'이 된다 */
  waiting: boolean
  onMore: () => void
  onHome: () => void
}

export const GoalMomentDialog = ({ goal, stats, nextVerse, bookName, chapter, nextChapter, waiting, onMore, onHome }: GoalMomentProps) => {
  const ref = nextVerse ? `${bookName} ${chapter}:${nextVerse.label}` : nextChapter ? `${nextChapter.name} ${nextChapter.chapter}장` : null
  return (
    <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-goal-title">
      <div className="bt-summary__card bt-goalmoment">
        <Lamp fill={1} lit full className="bt-goalmoment__lamp" />
        <p className="bt-summary__eyebrow">오늘의 목표 {goal}절 달성</p>
        <h2 id="bt-goal-title" className="bt-summary__title">
          오늘의 등잔이 가득 찼어요
        </h2>
        {stats && stats.current_streak > 0 && (
          <p className="bt-goalmoment__streak">
            <b>{stats.current_streak}</b>일째 등불이 이어지고 있어요
          </p>
        )}
        {ref && (
          <div className="bt-goalmoment__tomorrow">
            <span className="bt-goalmoment__eyebrow">내일 이어질 말씀 · {ref}</span>
            <span className="bt-goalmoment__text">{nextVerse ? `“${teaser(nextVerse.text, 3)}”` : '새 장이 기다리고 있어요'}</span>
          </div>
        )}
        <div className="bt-summary__actions">
          <button type="button" className="bt-btn bt-btn--primary bt-btn--block" onClick={onMore}>
            {waiting ? '확인' : '조금 더 쓰기'}
          </button>
          <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={onHome}>
            오늘은 여기까지
          </button>
        </div>
      </div>
    </div>
  )
}

interface RelayDoneProps {
  room: TypingRelayDetail
  hueOf: Map<number, number>
  /** 내가 아직 안 써 본 절(더 써 보기용) — 없으면 null */
  personalNext: number | null
  onOpenRelay: () => void
  onHome: () => void
  onContinue: () => void
}

export const RelayDoneDialog = ({ room, hueOf, personalNext, onOpenRelay, onHome, onContinue }: RelayDoneProps) => (
  <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-relaydone-title">
    <div className="bt-summary__card bt-relaydone">
      <span className="bt-baton__torch" aria-hidden />
      <p className="bt-summary__eyebrow">릴레이 완성 · 마지막 칸을 내가 채웠어요</p>
      <h2 id="bt-relaydone-title" className="bt-summary__title">
        {room.book_name} {room.chapter}
        {chapterUnit(room.book_number)}을 함께 완성했어요!
      </h2>
      <ul className="bt-relaydone__members">
        {[...room.members]
          .sort((a, b) => b.verses - a.verses)
          .map((m) => (
            <li key={m.user_id} className={`bt-hue-${hueOf.get(m.user_id) ?? 0}`}>
              <span className="bt-relay__swatch" aria-hidden />
              {m.is_me ? '나' : m.name}
              <b>{m.verses}칸</b>
            </li>
          ))}
      </ul>
      <div className="bt-summary__actions">
        <button type="button" className="bt-btn bt-btn--primary bt-btn--block" onClick={onOpenRelay}>
          릴레이 현황 보기
        </button>
        <button type="button" className="bt-btn bt-btn--block" onClick={onHome}>
          필사 홈으로
        </button>
        {personalNext !== null && (
          <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={onContinue}>
            친구가 쓴 절도 내 손으로 써 보기
          </button>
        )}
      </div>
    </div>
  </div>
)

interface SummaryProps {
  bookName: string
  chapter: number
  summary: SessionSummary
  nextChapter: NextChapter | null
  onNextChapter: () => void
  onKeepCard: () => void
  onHome: () => void
}

export const SummaryDialog = ({ bookName, chapter, summary, nextChapter, onNextChapter, onKeepCard, onHome }: SummaryProps) => (
  <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-summary-title">
    <div className="bt-summary__card">
      <span className="bt-summary__seal" aria-hidden>
        <span className="material-icons-round">history_edu</span>
      </span>
      <p className="bt-summary__eyebrow">필사 완료</p>
      <h2 id="bt-summary-title" className="bt-summary__title">
        {bookName} {chapter}장을 온전히 새겼어요
      </h2>
      <dl className="bt-summary__stats">
        <div>
          <dt>이번에 쓴 절</dt>
          <dd className="brand-text-gradient">{summary.count}</dd>
        </div>
        <div>
          <dt>평균 타수</dt>
          <dd className="brand-text-gradient">{summary.cpm}</dd>
        </div>
        <div>
          <dt>정확도</dt>
          <dd className="brand-text-gradient">{Math.round(summary.acc * 100)}%</dd>
        </div>
      </dl>
      <p className="bt-summary__time">
        걸린 시간 {formatDuration(summary.totalMs)}
        {summary.bestCombo >= 10 && <> · 최고 {summary.bestCombo}자 연속 정확</>}
      </p>
      <div className="bt-summary__actions">
        {nextChapter && (
          <button type="button" className="bt-btn bt-btn--primary bt-btn--block" onClick={onNextChapter}>
            이어서 {nextChapter.name} {nextChapter.chapter}장 쓰기
          </button>
        )}
        <button type="button" className="bt-btn bt-btn--block" onClick={onKeepCard}>
          말씀 카드로 간직하기
        </button>
        <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={onHome}>
          필사 홈으로
        </button>
      </div>
    </div>
  </div>
)
