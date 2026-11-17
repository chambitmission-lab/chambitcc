// 이번 주 말씀 편지 히어로 — 설교 날짜의 계절 교회 사진(/visit scene-계절-day|night) 위에 소인·손글씨 서명을 얹은 편지
//   라이트=낮 사진, 다크=밤 사진. 구절은 하늘 쪽(왼쪽), 교회는 오른쪽.
// 유튜브 썸네일은 매주 같은 교회 템플릿이라, 주마다 달라 보이는 건 본문·인용 구절이 맡는다.
import { useMemo } from 'react'
import type { Sermon } from '../../../types/sermon'
import { useSermonLeadVerse } from '../hooks/useSermonLeadVerse'
import { formatReference, parseBibleReference } from '../utils/sermonMeta'
import { primaryMedia, signatureName, stampParts, worshipSlot } from '../utils/sermonLetter'
import { letterSeasonOf } from '../../Ministry/letterSeason'
import './SermonLetter.css'

interface SermonLetterHeroProps {
  sermon: Sermon
  onOpen: (media: 'audio' | 'video' | null) => void
  onReadPassage: () => void
}

const LetterStamp = ({ sermon }: { sermon: Sermon }) => {
  const { year, md, day } = stampParts(sermon.sermon_date)
  const slot = worshipSlot(sermon.title)
  return (
    <div className="sl-stamp" aria-hidden>
      <span>{year}</span>
      <b>{md}</b>
      <span>{day}{slot ? ` ${slot}` : ''}</span>
    </div>
  )
}

/** 계절 입자(꽃잎·빛 알갱이/반딧불·단풍·눈) — 위치·속도는 고정 표라 렌더마다 같다 */
const SEASON_PARTICLES = Array.from({ length: 9 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: -((i * 1.7) % 14),
  dur: 11 + ((i * 3) % 7),
  size: 0.7 + ((i * 7) % 5) / 10,
  sway: i % 2 ? 1 : -1,
}))

const SeasonParticles = () => (
  <div className="sl-sky-fx" aria-hidden>
    {SEASON_PARTICLES.map((p, i) => (
      <i
        key={i}
        style={{
          left: `${p.left}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.dur}s`,
          ['--s' as string]: p.size,
          ['--sway' as string]: p.sway,
        }}
      />
    ))}
  </div>
)

const MediaLabel = ({ media }: { media: 'audio' | 'video' | null }) =>
  media === 'video' ? (
    <><span className="material-icons-outlined">play_arrow</span>설교 영상</>
  ) : media === 'audio' ? (
    <><span className="material-icons-outlined">headphones</span>음성 듣기</>
  ) : (
    <><span className="material-icons-outlined">menu_book</span>전문 보기</>
  )

const SermonLetterHero = ({ sermon, onOpen, onReadPassage }: SermonLetterHeroProps) => {
  const parsed = useMemo(() => parseBibleReference(sermon.bible_verse), [sermon.bible_verse])
  const { data: verse } = useSermonLeadVerse(parsed)
  const reference = parsed ? formatReference(parsed) : sermon.bible_verse
  const media = primaryMedia(sermon)
  const signature = signatureName(sermon.pastor)

  const readPassage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onReadPassage()
  }

  const season = letterSeasonOf(sermon.sermon_date)
  return (
    <section
      className={`sl-sky sl-sky--${season}`}
      role="button"
      tabIndex={0}
      aria-label={`${reference} 설교 열기`}
      onClick={() => onOpen(media)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(media)}
    >
      <div className="sl-sky-photo" aria-hidden />
      <SeasonParticles />
      <LetterStamp sermon={sermon} />

      <p className="sl-to">참빛 가족에게</p>
      {verse?.text ? (
        <blockquote className="sl-sky-quote">“{verse.text}”</blockquote>
      ) : (
        <div className="sl-sky-quote sl-sky-quote--empty" aria-hidden />
      )}
      <p className="sl-sky-ref">{reference}</p>
      <p className="sl-sky-sign">{signature}</p>

      <div className="sl-sky-actions">
        <button
          type="button"
          className="sl-sky-btn sl-sky-btn--primary"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(media)
          }}
        >
          <MediaLabel media={media} />
        </button>
        {parsed?.bookNumber != null && (
          <button type="button" className="sl-sky-btn sl-sky-btn--ghost" onClick={readPassage}>
            <span className="material-icons-outlined">menu_book</span>본문 읽기
          </button>
        )}
      </div>
    </section>
  )
}

export default SermonLetterHero
