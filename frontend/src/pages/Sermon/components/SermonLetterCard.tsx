// 지난 주일의 편지 한 장 — 소인 날짜 · 본문 · 첫 절 인용, 붙잡은 한 줄이 있으면 손글씨로 덧붙는다
import { useMemo } from 'react'
import type { Sermon } from '../../../types/sermon'
import { useSermonLeadVerse } from '../hooks/useSermonLeadVerse'
import { compactReference, parseBibleReference } from '../utils/sermonMeta'
import { pastorShortName, primaryMedia, stampParts, worshipSlot } from '../utils/sermonLetter'

interface SermonLetterCardProps {
  sermon: Sermon
  takeaway?: string
  /** 로그인한 사람에게만 '아직 붙잡은 한 줄이 없어요' 자리를 보인다 */
  showTakeawaySlot: boolean
  onOpen: (media: 'audio' | 'video' | null) => void
}

const SermonLetterCard = ({ sermon, takeaway, showTakeawaySlot, onOpen }: SermonLetterCardProps) => {
  const parsed = useMemo(() => parseBibleReference(sermon.bible_verse), [sermon.bible_verse])
  const { data: verse } = useSermonLeadVerse(parsed)
  const { md, day } = stampParts(sermon.sermon_date)
  const slot = worshipSlot(sermon.title)
  const media = primaryMedia(sermon)

  return (
    <article
      className="sl-letter"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(null)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(null)}
    >
      <div className="sl-letter-top">
        <span className="sl-letter-date">{md} {day}</span>
        <span className="sl-letter-who">{[slot, pastorShortName(sermon.pastor)].filter(Boolean).join(' · ')}</span>
      </div>
      <p className="sl-letter-ref">{compactReference(sermon.bible_verse)}</p>
      {verse?.text && <p className="sl-letter-verse">“{verse.text}”</p>}

      {(takeaway || showTakeawaySlot) && (
        <p className={`sl-letter-note${takeaway ? '' : ' is-empty'}`}>
          {takeaway || '아직 붙잡은 한 줄이 없어요'}
        </p>
      )}

      {media && (
        <button
          type="button"
          className="sl-letter-media"
          aria-label={media === 'video' ? '영상 보기' : '음성 듣기'}
          onClick={(e) => {
            e.stopPropagation()
            onOpen(media)
          }}
        >
          <span className="material-icons-outlined">{media === 'video' ? 'play_arrow' : 'headphones'}</span>
        </button>
      )}
    </article>
  )
}

export default SermonLetterCard
