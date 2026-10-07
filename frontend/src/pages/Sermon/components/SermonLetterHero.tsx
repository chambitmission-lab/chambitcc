// 이번 주 말씀 편지 히어로 — 두 갈래를 성도 의견으로 고르는 중(2026-10 시범)
//   light: 새벽 하늘 빛줄기 위에 소인·손글씨 서명을 얹은 '빛 속에 도착한 편지' (/sermon 기본)
//   video: 설교 영상을 크게 깔고 그 아래 종이 편지가 겹쳐 올라오는 안 (/sermon/new 시범)
// 유튜브 썸네일은 매주 같은 교회 템플릿이라, 주마다 달라 보이는 건 본문·인용 구절이 맡는다.
import { useMemo } from 'react'
import type { Sermon } from '../../../types/sermon'
import { useSermonLeadVerse } from '../hooks/useSermonLeadVerse'
import { extractYouTubeVideoId, formatReference, parseBibleReference, youtubeThumbnailUrl } from '../utils/sermonMeta'
import { primaryMedia, signatureName, stampParts, worshipSlot } from '../utils/sermonLetter'
import './SermonLetter.css'

export type SermonHeroVariant = 'light' | 'video'

interface SermonLetterHeroProps {
  sermon: Sermon
  variant: SermonHeroVariant
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

const MediaLabel = ({ media }: { media: 'audio' | 'video' | null }) =>
  media === 'video' ? (
    <><span className="material-icons-outlined">play_arrow</span>설교 영상</>
  ) : media === 'audio' ? (
    <><span className="material-icons-outlined">headphones</span>음성 듣기</>
  ) : (
    <><span className="material-icons-outlined">menu_book</span>전문 보기</>
  )

const SermonLetterHero = ({ sermon, variant, onOpen, onReadPassage }: SermonLetterHeroProps) => {
  const parsed = useMemo(() => parseBibleReference(sermon.bible_verse), [sermon.bible_verse])
  const { data: verse } = useSermonLeadVerse(parsed)
  const reference = parsed ? formatReference(parsed) : sermon.bible_verse
  const media = primaryMedia(sermon)
  const signature = signatureName(sermon.pastor)

  const readPassage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onReadPassage()
  }

  if (variant === 'light') {
    return (
      <section
        className="sl-sky"
        role="button"
        tabIndex={0}
        aria-label={`${reference} 설교 열기`}
        onClick={() => onOpen(media)}
        onKeyDown={(e) => e.key === 'Enter' && onOpen(media)}
      >
        <div className="sl-sky-stars" aria-hidden />
        <div className="sl-sky-beam" aria-hidden />
        <div className="sl-sky-glow" aria-hidden />
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

  const videoId = sermon.video_url ? extractYouTubeVideoId(sermon.video_url) : null
  const thumb = sermon.thumbnail_url || (videoId ? youtubeThumbnailUrl(videoId) : null)
  const slot = worshipSlot(sermon.title)
  const { md } = stampParts(sermon.sermon_date)

  return (
    <div className="sl-cinema-wrap">
      <section
        className={`sl-cinema${thumb ? '' : ' sl-cinema--plain'}`}
        style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
        role="button"
        tabIndex={0}
        aria-label={`${reference} 설교 ${media === 'audio' ? '듣기' : '보기'}`}
        onClick={() => onOpen(media)}
        onKeyDown={(e) => e.key === 'Enter' && onOpen(media)}
      >
        <span className="sl-cinema-play" aria-hidden>
          <span className="material-icons-outlined">{media === 'audio' ? 'headphones' : 'play_arrow'}</span>
        </span>
        <div className="sl-cinema-tags">
          <span className="is-brand">이번 주 설교</span>
          <span>{md} 주일{slot ? ` · ${slot}` : ''}</span>
          <span>{sermon.pastor}</span>
        </div>
      </section>

      <article className="sl-paper sl-paper--overlap">
        <div className="sl-paper-tape" aria-hidden />
        <LetterStamp sermon={sermon} />
        <p className="sl-to">참빛 가족에게</p>
        <p className="sl-paper-ref">{reference}</p>
        {verse?.text && <p className="sl-paper-verse">“{verse.text}”</p>}
        <div className="sl-paper-foot">
          {parsed?.bookNumber != null ? (
            <button type="button" className="sl-paper-link" onClick={readPassage}>
              <span className="material-icons-outlined">menu_book</span>본문 읽기
            </button>
          ) : <span />}
          <p className="sl-paper-sign"><small>말씀을 전한 이</small>{signature}</p>
        </div>
      </article>
    </div>
  )
}

export default SermonLetterHero
