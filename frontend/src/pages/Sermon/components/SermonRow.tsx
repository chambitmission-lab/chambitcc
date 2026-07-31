// 지난 말씀 콤팩트 행 — 날짜 칩 + 제목·성구 + 미디어 바로가기
import type { Sermon } from '../../../types/sermon'
import { stripTitleDate } from '../utils/sermonMeta'
import './SermonRow.css'

interface SermonRowProps {
  sermon: Sermon
  onOpen: (media?: 'audio' | 'video') => void
}

const SermonRow = ({ sermon, onOpen }: SermonRowProps) => {
  const date = new Date(sermon.sermon_date)
  const day = date.getDate()
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  const isSunday = date.getDay() === 0

  return (
    <div className="sermon-row" onClick={() => onOpen()}>
      <div className={`sermon-row-date${isSunday ? ' sunday' : ''}`}>
        <span className="sermon-row-day">{day}</span>
        <span className="sermon-row-weekday">{weekday}</span>
      </div>

      <div className="sermon-row-info">
        <div className="sermon-row-title">{stripTitleDate(sermon.title)}</div>
        <div className="sermon-row-sub">
          <span className="sermon-row-verse">{sermon.bible_verse}</span>
          <span className="sermon-row-sep">·</span>
          <span className="sermon-row-pastor">{sermon.pastor}</span>
        </div>
      </div>

      <div className="sermon-row-media">
        {sermon.video_url && (
          <button
            className="sermon-row-media-btn video"
            aria-label="영상 보기"
            onClick={(e) => {
              e.stopPropagation()
              onOpen('video')
            }}
          >
            <span className="material-icons-outlined">play_arrow</span>
          </button>
        )}
        {sermon.audio_url && (
          <button
            className="sermon-row-media-btn audio"
            aria-label="음성 듣기"
            onClick={(e) => {
              e.stopPropagation()
              onOpen('audio')
            }}
          >
            <span className="material-icons-outlined">headphones</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default SermonRow
