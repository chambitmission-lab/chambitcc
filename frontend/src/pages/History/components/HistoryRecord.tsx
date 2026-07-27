import type { HistoryEvent } from '../historyData'

// '1995-07-31' (+ 종료일) → '7월 31일' / '7월 31일 – 8월 2일'
const fmtDay = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`

const formatDate = (event: HistoryEvent): string => {
  if (!event.d2) return fmtDay(event.d)
  const sameYear = event.d.slice(0, 4) === event.d2.slice(0, 4)
  const end = sameYear ? fmtDay(event.d2) : `${event.d2.slice(0, 4)}년 ${fmtDay(event.d2)}`
  return `${fmtDay(event.d)} – ${end}`
}

/** 이보다 길거나 명단(줄바꿈)이 들어 있으면 탭해서 펼친다. */
const COLLAPSE_THRESHOLD = 90

const isCollapsible = (event: HistoryEvent) =>
  event.text.length > COLLAPSE_THRESHOLD || event.text.includes('\n')

interface Props {
  event: HistoryEvent
  index: number
  open: boolean
  onToggle: (index: number) => void
  flashed?: boolean
  /** 테마 렌즈에서는 연도가 흩어져 있으므로 연도까지 같이 보여준다. */
  showYear?: boolean
  ko: boolean
}

const HistoryRecord = ({ event, index, open, onToggle, flashed, showYear, ko }: Props) => {
  const isMilestone = Boolean(event.icon)
  const collapsible = isCollapsible(event)
  const date = showYear ? `${event.d.slice(0, 4)}. ${formatDate(event)}` : formatDate(event)

  return (
    <div id={`hrec-${index}`} className={`hrec ${isMilestone ? 'is-milestone' : ''} ${flashed ? 'is-flashed' : ''}`}>
      <span className="hrec-marker" aria-hidden="true">
        {isMilestone ? <span className="hrec-icon">{event.icon}</span> : <span className="hrec-dot" />}
      </span>
      <button
        type="button"
        className={`hrec-card ${collapsible ? 'is-collapsible' : ''} ${open ? 'is-open' : ''}`}
        onClick={() => collapsible && onToggle(index)}
        aria-expanded={collapsible ? open : undefined}
      >
        <span className="hrec-date">{date}</span>
        {isMilestone && <span className="hrec-title">{event.title}</span>}
        <span className={`hrec-text ${collapsible && !open ? 'is-clamped' : ''}`}>{event.text}</span>
        {collapsible && (
          <span className="hrec-more">{open ? (ko ? '접기' : 'Less') : ko ? '더보기' : 'More'}</span>
        )}
      </button>
    </div>
  )
}

export default HistoryRecord
