import { Link } from 'react-router-dom'
import type { TypingDaily } from '../../../../api/bibleTyping'
import Faces from './Faces'
import { teaser } from './teaser'
import { formatDuration } from '../typingPrefs'

/**
 * 오늘의 한 절 — 교회 전체가 하루에 같은 구절 하나(워들처럼).
 * 아직 안 썼으면 첫 몇 어절만 보여 주고, 썼으면 내 순번과 카드로.
 */
const DailyVerseCard = ({ daily }: { daily?: TypingDaily }) => {
  if (!daily?.verse) return null
  const v = daily.verse
  const ref = `${v.book_name} ${v.chapter}:${v.label}`
  const me = daily.me
  return (
    <Link to="/bible/typing/daily" className={`bt-card bt-daily${me ? ' is-done' : ''}`}>
      <span className="bt-daily__badge" aria-hidden>
        <span className="material-icons-round">{me ? 'verified' : 'wb_twilight'}</span>
      </span>
      <span className="bt-daily__body">
        <span className="bt-daily__eyebrow">
          오늘의 한 절 <span aria-hidden>·</span> {ref}
        </span>
        <span className="bt-daily__text">{me ? v.text : `“${teaser(v.text, 3)}”`}</span>
        <span className="bt-daily__meta">
          {daily.recent.length > 0 && <Faces people={daily.recent} max={4} />}
          {me ? (
            <span>
              <b>{me.rank}</b>번째로 새겼어요 · {formatDuration(me.duration_ms)}
            </span>
          ) : daily.done_count > 0 ? (
            <span>
              오늘 <b>{daily.done_count}</b>명이 먼저 썼어요
            </span>
          ) : (
            <span>오늘 첫 번째로 새겨 보세요</span>
          )}
        </span>
      </span>
      <span className="bt-daily__go">
        {me ? '카드 보기' : '1분 쓰기'}
        <span className="material-icons-round" aria-hidden>
          chevron_right
        </span>
      </span>
    </Link>
  )
}

export default DailyVerseCard
