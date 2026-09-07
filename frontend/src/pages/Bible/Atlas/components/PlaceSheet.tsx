import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import type { AtlasPlace } from '../atlasTypes'
import { placeLabel } from '../data/places'
import { journeysAtPlace } from '../data/journeys'

interface PlaceSheetProps {
  place: AtlasPlace
  /** 이 여정에서 이 장소가 몇 번째 지점인지 (1부터) */
  order?: number
  /** 트랙 색 — 헤더 강조에 쓴다 */
  color: string
  /** 지금 보고 있는 여정 — "다른 시대" 목록에서 자기 자신은 뺀다 */
  currentJourneyId: string
  onOpenJourney: (journeyId: string) => void
  onClose: () => void
}

/**
 * 핀 상세 — 장소 카드.
 *
 * 초보자가 지도에서 핀을 눌렀을 때 가장 궁금해하는 순서대로 담는다.
 *   1) 지금은 어디인가  2) 여기서 무슨 일이 있었나  3) 그 본문을 어디서 읽나
 * 사건마다 성경 딥링크를 달아, 지도에서 본문으로 곧장 건너갈 수 있게 한다.
 */
const PlaceSheet = ({
  place,
  order,
  color,
  currentJourneyId,
  onOpenJourney,
  onClose,
}: PlaceSheetProps) => {
  const navigate = useNavigate()

  // 뒤로가기 → 시트만 닫기 (홈으로 빠지지 않게)
  useModalBackButton(onClose)

  // 같은 자리에 다른 시대가 겹치는 것이 이 지도의 묘미다 — 헤브론은 아브라함이
  // 사라를 장사한 곳이자 다윗이 처음 왕이 된 곳이고, 예루살렘은 네 여정에 모두 나온다
  const alsoIn = journeysAtPlace(place.id).filter((j) => j.id !== currentJourneyId)

  const openVerse = (book: number, chapter: number, verse?: number) => {
    navigate(`/bible/${book}/${chapter}${verse ? `?verse=${verse}` : ''}`)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md sheet-rise max-h-[88vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center gap-3 px-5 pt-5 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <span
            className="atl-sheet__badge"
            style={{ background: color }}
            aria-hidden={order == null}
          >
            {order ?? <span className="material-icons-round text-[18px]">place</span>}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-ink-strong text-[19px] font-bold tracking-[-0.015em] truncate">
              {placeLabel(place)}
            </h3>
            <p className="text-[12px] text-gray-500 dark:text-white/50 mt-0.5 truncate">
              {place.modern}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <p className="text-[14.5px] leading-[1.75] text-[var(--text-body)] break-keep">
            {place.blurb}
          </p>

          {!!place.events?.length && (
            <section>
              <p className="atl-sheet__label">여기서 일어난 일</p>
              <ol className="atl-events">
                {place.events.map((event, i) => (
                  <li key={event.ref.label + i} className="atl-event">
                    <span className="atl-event__no" style={{ color }}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="atl-event__text">{event.text}</p>
                      <button
                        type="button"
                        className="atl-event__ref"
                        onClick={() =>
                          openVerse(event.ref.book, event.ref.chapter, event.ref.verse)
                        }
                      >
                        {event.ref.label}
                        <span className="material-icons-round text-[14px]">chevron_right</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {!!alsoIn.length && (
            <section>
              <p className="atl-sheet__label">이 자리에 겹치는 다른 여정</p>
              <div className="flex flex-wrap gap-1.5">
                {alsoIn.map((other) => (
                  <button
                    key={other.id}
                    type="button"
                    className="atl-cross"
                    style={{ borderColor: other.color, color: other.color }}
                    onClick={() => onOpenJourney(other.id)}
                  >
                    <span className="atl-cross__dot" style={{ background: other.color }} />
                    {other.title}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!!place.figures?.length && (
            <section>
              <p className="atl-sheet__label">관련 인물</p>
              <div className="flex flex-wrap gap-1.5">
                {place.figures.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="atl-figure"
                    onClick={() => navigate(`/bible/genealogy?q=${encodeURIComponent(name)}`)}
                  >
                    <span className="material-icons-outlined text-[15px]">account_tree</span>
                    {name}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PlaceSheet
