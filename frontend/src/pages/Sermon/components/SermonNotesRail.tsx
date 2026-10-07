// 우측 레일(lg+) '나의 말씀 노트' — 붙잡은 한 줄을 최근순으로, 누르면 그 설교를 연다
import type { SermonTakeaway } from '../../../api/sermonTakeaway'
import type { Sermon } from '../../../types/sermon'
import { compactReference } from '../utils/sermonMeta'
import { stampParts } from '../utils/sermonLetter'

const RAIL_LIMIT = 5

interface SermonNotesRailProps {
  loggedIn: boolean
  takeaways: SermonTakeaway[]
  sermonsById: Map<number, Sermon>
  onOpen: (sermonId: number) => void
  onLogin: () => void
}

const SermonNotesRail = ({ loggedIn, takeaways, sermonsById, onOpen, onLogin }: SermonNotesRailProps) => (
  <section className="feed-card rounded-2xl p-4">
    <p className="sermon-rail-title">나의 말씀 노트</p>
    {!loggedIn ? (
      <>
        <p className="sermon-rail-note">설교에서 붙잡은 한 줄이 이곳에 손글씨로 쌓여요.</p>
        <button type="button" className="sl-btn mt-3" onClick={onLogin}>로그인하기</button>
      </>
    ) : takeaways.length === 0 ? (
      <p className="sermon-rail-note">아직 붙잡은 한 줄이 없어요. 이번 주 말씀에서 한 문장을 적어 보세요.</p>
    ) : (
      <ul className="sl-rail-notes">
        {takeaways.slice(0, RAIL_LIMIT).map((t) => {
          const sermon = sermonsById.get(t.sermon_id)
          return (
            <li key={t.sermon_id}>
              <button type="button" onClick={() => onOpen(t.sermon_id)}>
                <span className="sl-pen">{t.text}</span>
                {sermon && (
                  <small>
                    {compactReference(sermon.bible_verse)} · {stampParts(sermon.sermon_date).md}
                  </small>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    )}
  </section>
)

export default SermonNotesRail
