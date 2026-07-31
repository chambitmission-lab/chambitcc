// 이번 주 말씀 히어로 — 최신 설교 1건을 성구 인용 중심으로 크게
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Sermon } from '../../../types/sermon'
import { getBibleVerse } from '../../../api/bible'
import { parseBibleReference, formatReference, stripTitleDate } from '../utils/sermonMeta'
import './SermonHero.css'

interface SermonHeroProps {
  sermon: Sermon
  onOpen: (media?: 'audio' | 'video') => void
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const SermonHero = ({ sermon, onOpen }: SermonHeroProps) => {
  const parsed = useMemo(() => parseBibleReference(sermon.bible_verse), [sermon.bible_verse])

  // 본문 첫 절을 인용구로 — 성경 API 재사용, 파싱 실패·조회 실패 시 조용히 생략
  const { data: verse } = useQuery({
    queryKey: ['sermon-hero-verse', parsed?.book, parsed?.chapter, parsed?.verse ?? 1],
    queryFn: () => getBibleVerse(parsed!.book, parsed!.chapter, parsed!.verse ?? 1),
    enabled: !!parsed,
    staleTime: Infinity,
    retry: 1,
  })

  const isThisWeek = Date.now() - new Date(sermon.sermon_date).getTime() < WEEK_MS
  const dateLabel = new Date(sermon.sermon_date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <section
      className={`sermon-hero${sermon.thumbnail_url ? ' has-thumb' : ''}`}
      onClick={() => onOpen()}
    >
      {sermon.thumbnail_url && (
        <div
          className="sermon-hero-thumb"
          style={{ backgroundImage: `url(${sermon.thumbnail_url})` }}
          aria-hidden
        />
      )}

      <div className="sermon-hero-top">
        <span className="sermon-hero-label">{isThisWeek ? '이번 주 말씀' : '최근 말씀'}</span>
        <span className="sermon-hero-date">{dateLabel}</span>
      </div>

      {verse?.text ? (
        <blockquote className="sermon-hero-quote">
          <p className="sermon-hero-quote-text">{verse.text}</p>
        </blockquote>
      ) : (
        <div className="sermon-hero-quote-fallback" aria-hidden>
          ❝
        </div>
      )}

      <div className="sermon-hero-reference">
        {parsed ? formatReference(parsed) : sermon.bible_verse}
      </div>

      <h2 className="sermon-hero-title">{stripTitleDate(sermon.title)}</h2>
      <div className="sermon-hero-pastor">{sermon.pastor}</div>

      <div className="sermon-hero-actions">
        {sermon.video_url && (
          <button
            className="sermon-hero-btn primary"
            onClick={(e) => {
              e.stopPropagation()
              onOpen('video')
            }}
          >
            <span className="material-icons-outlined">play_arrow</span>
            영상 보기
          </button>
        )}
        {sermon.audio_url && (
          <button
            className={`sermon-hero-btn ${sermon.video_url ? 'secondary' : 'primary'}`}
            onClick={(e) => {
              e.stopPropagation()
              onOpen('audio')
            }}
          >
            <span className="material-icons-outlined">headphones</span>
            음성 듣기
          </button>
        )}
        <button
          className={`sermon-hero-btn ${sermon.video_url || sermon.audio_url ? 'secondary' : 'primary'}`}
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
        >
          <span className="material-icons-outlined">menu_book</span>
          전문 보기
        </button>
      </div>
    </section>
  )
}

export default SermonHero
