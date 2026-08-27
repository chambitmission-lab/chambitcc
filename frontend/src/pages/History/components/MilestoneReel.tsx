import { MILESTONES } from '../historyThemes'
import { HistoryGlyph } from '../HistoryIcons'

interface Props {
  onPick: (index: number) => void
  ko: boolean
}

/** 35개 이정표만 뽑아 가로로 훑어보는 릴. 카드를 탭하면 본문의 해당 기록으로 간다. */
const MilestoneReel = ({ onPick, ko }: Props) => (
  <section className="hreel" aria-label={ko ? '주요 이정표' : 'Milestones'}>
    <header className="hreel-head">
      <h2 className="hreel-title">
        {ko ? '주요 이정표' : 'Milestones'}
        <span className="hreel-count">{MILESTONES.length}</span>
      </h2>
      <span className="hreel-hint">{ko ? '옆으로 밀어보세요' : 'Swipe →'}</span>
    </header>

    <ul className="hreel-track">
      {MILESTONES.map(({ event, index, year }) => (
        <li key={index}>
          <button type="button" className="hreel-card" onClick={() => onPick(index)}>
            <span className="hreel-icon" aria-hidden="true">
              <HistoryGlyph emoji={event.icon} size={17} />
            </span>
            <span className="hreel-year">{year}</span>
            <span className="hreel-label">{event.title}</span>
          </button>
        </li>
      ))}
    </ul>
  </section>
)

export default MilestoneReel
