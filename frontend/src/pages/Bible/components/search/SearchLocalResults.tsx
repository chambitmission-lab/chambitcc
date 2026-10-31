import { useNavigate } from 'react-router-dom'
import { BOOK_ABBREV_KO, BOOK_ABBREV_EN } from '../bibleBookAbbrev'
import type { EventRef, SearchEvent, SearchPlace } from './searchIndex'

// 통합 결과의 로컬 섹션 — 사건(단락 제목)·지명(성경 지도). 서버 결과(절)와 달리 타이핑 즉시 그려진다.

export type SearchKind = 'all' | 'verse' | 'event' | 'place'

type Lang = 'ko' | 'en'

const TEXTS = {
  ko: {
    kindAll: '전체',
    kindVerse: '절',
    kindEvent: '사건',
    kindPlace: '지명',
    kindsLabel: '결과 종류',
    events: '사건',
    places: '지명',
    showAll: (n: number) => `${n}개 모두`,
    eventEyebrow: '사건',
    parallelNote: (n: number) => `${n}곳에 기록된 이야기`,
    openMap: '지도에서 보기',
  },
  en: {
    kindAll: 'All',
    kindVerse: 'Verses',
    kindEvent: 'Events',
    kindPlace: 'Places',
    kindsLabel: 'Result type',
    events: 'Events',
    places: 'Places',
    showAll: (n: number) => `All ${n}`,
    eventEyebrow: 'Event',
    parallelNote: (n: number) => `Told in ${n} places`,
    openMap: 'Open in map',
  },
}

const refLabel = (r: EventRef, lang: Lang) => {
  const book = (lang === 'ko' ? BOOK_ABBREV_KO : BOOK_ABBREV_EN)[r.b] ?? ''
  return `${book} ${r.c}:${r.v}${r.to > r.v ? `-${r.to}` : ''}`
}

/** 결과 종류 칩 — 전체·절·사건·지명. 0건인 종류는 감춘다(절은 서버 응답 전이라 늘 둔다) */
export const SearchKindTabs = ({
  kind,
  onChange,
  verseCount,
  eventCount,
  placeCount,
  lang,
}: {
  kind: SearchKind
  onChange: (k: SearchKind) => void
  verseCount: number | null
  eventCount: number
  placeCount: number
  lang: Lang
}) => {
  const t = TEXTS[lang]
  const tabs: { k: SearchKind; label: string; n: number | null }[] = [
    { k: 'all', label: t.kindAll, n: null },
    { k: 'verse', label: t.kindVerse, n: verseCount },
    ...(eventCount > 0 ? [{ k: 'event' as const, label: t.kindEvent, n: eventCount }] : []),
    ...(placeCount > 0 ? [{ k: 'place' as const, label: t.kindPlace, n: placeCount }] : []),
  ]
  return (
    <div className="search-kinds" role="tablist" aria-label={t.kindsLabel}>
      {tabs.map(tab => (
        <button
          key={tab.k}
          type="button"
          role="tab"
          aria-selected={kind === tab.k}
          className={`search-kind${kind === tab.k ? ' search-kind--active' : ''}`}
          onClick={() => onChange(tab.k)}
        >
          {tab.label}
          {tab.n != null && tab.n > 0 && <span className="search-kind__n">{tab.n.toLocaleString()}</span>}
        </button>
      ))}
    </div>
  )
}

/** 사건 줄 목록 — 같은 제목의 평행 본문은 참조를 이어 적고, 누르면 첫 본문으로 */
export const SearchEventRows = ({
  events,
  limit,
  onOpen,
  onShowAll,
  lang,
}: {
  events: SearchEvent[]
  limit?: number
  onOpen: (r: EventRef) => void
  onShowAll?: () => void
  lang: Lang
}) => {
  const t = TEXTS[lang]
  const shown = limit ? events.slice(0, limit) : events
  if (shown.length === 0) return null
  return (
    <section className="search-sec" aria-label={t.events}>
      {limit && (
        <div className="search-sec__head">
          <span>{t.events}</span>
          {events.length > limit && onShowAll && (
            <button type="button" className="search-sec__more" onClick={onShowAll}>
              {t.showAll(events.length)}
            </button>
          )}
        </div>
      )}
      <div className="search-rows">
        {shown.map(ev => (
          <button key={ev.title} type="button" className="search-row" onClick={() => onOpen(ev.refs[0])}>
            <span className="search-row__badge material-icons-round" aria-hidden="true">flag</span>
            <span className="search-row__text">
              <b>{ev.title}</b>
              <span>{ev.refs.slice(0, 4).map(r => refLabel(r, lang)).join(' · ')}{ev.refs.length > 4 ? ' …' : ''}</span>
            </span>
            <span className="search-row__chev material-icons-round" aria-hidden="true">chevron_right</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** 지명 줄 목록 — 누르면 성경 지도의 그 장소 카드로 */
export const SearchPlaceRows = ({
  places,
  limit,
  onShowAll,
  lang,
}: {
  places: SearchPlace[]
  limit?: number
  onShowAll?: () => void
  lang: Lang
}) => {
  const navigate = useNavigate()
  const t = TEXTS[lang]
  const shown = limit ? places.slice(0, limit) : places
  if (shown.length === 0) return null
  return (
    <section className="search-sec" aria-label={t.places}>
      {limit && (
        <div className="search-sec__head">
          <span>{t.places}</span>
          {places.length > limit && onShowAll && (
            <button type="button" className="search-sec__more" onClick={onShowAll}>
              {t.showAll(places.length)}
            </button>
          )}
        </div>
      )}
      <div className="search-rows">
        {shown.map(p => (
          <button
            key={p.id}
            type="button"
            className="search-row"
            onClick={() => navigate(`/bible/atlas?p=${encodeURIComponent(p.id)}`)}
          >
            <span className="search-row__badge material-icons-round" aria-hidden="true">place</span>
            <span className="search-row__text">
              <b>
                {p.name}
                {p.qualifier && <small> {p.qualifier}</small>}
              </b>
              <span>{p.modern}</span>
            </span>
            <span className="search-row__chev material-icons-round" aria-hidden="true">map</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** 최상위 결과 — 검색어가 사건 이름 그 자체일 때("오병이어", "십계명"). 기록된 본문을 전부 칩으로 */
export const SearchEventTopCard = ({
  event,
  onOpen,
  lang,
}: {
  event: SearchEvent
  onOpen: (r: EventRef) => void
  lang: Lang
}) => {
  const t = TEXTS[lang]
  return (
    <section className="search-top" aria-label={`${t.eventEyebrow} — ${event.title}`}>
      <span className="search-top__icon material-icons-round" aria-hidden="true">flag</span>
      <div className="search-top__body">
        <p className="search-top__eyebrow">
          {t.eventEyebrow}
          {event.refs.length > 1 && ` · ${t.parallelNote(event.refs.length)}`}
        </p>
        <h3 className="search-top__title">{event.title}</h3>
        <div className="search-top__refs">
          {event.refs.map(r => (
            <button
              key={`${r.b}:${r.c}:${r.v}`}
              type="button"
              className="search-top__ref"
              onClick={() => onOpen(r)}
            >
              {refLabel(r, lang)}
              <span className="material-icons-round" aria-hidden="true">chevron_right</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
