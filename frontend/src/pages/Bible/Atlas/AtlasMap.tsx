import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import MapCanvas from './components/MapCanvas'
import PlaceSheet from './components/PlaceSheet'
import DistanceSheet from './components/DistanceSheet'
import PassportSheet from './components/PassportSheet'
import QuizPanel from './components/QuizPanel'
import { JOURNEYS, getJourney, uniquePlaceIds } from './data/journeys'
import { PLACES, placeLabel } from './data/places'
import { distanceFeelOf, formatKm } from './distanceFeel'
import { hasCelebratedJourney, markJourneyCelebrated, useAtlasProgress } from './atlasProgress'
import { useJourneyPlayer } from './useJourneyPlayer'
import { useMapQuiz } from './useMapQuiz'
import './Atlas.css'

/**
 * 성경 지도여행 — 지도 위에서 이야기를 따라 걷는 화면.
 *
 * 초보자가 성경을 어려워하는 세 가지(지명이 낯설다 / 순서가 안 잡힌다 / 남
 * 얘기 같다)를 지도 하나로 건드리는 것이 목표다. 그래서 화면의 무게 중심은
 * 목록이 아니라 지도이고, 첫 행동은 읽기가 아니라 "걸어보기" 재생이다.
 *
 * 구조는 스토리 모드(/bible/story)와 같다 — 콘텐츠는 정적 데이터, 진행만 서버.
 */
const AtlasMap = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const journeyId = searchParams.get('j') ?? JOURNEYS[0].id
  const journey = useMemo(() => getJourney(journeyId) ?? JOURNEYS[0], [journeyId])

  const player = useJourneyPlayer(journey)
  const { visitedIds, markVisited } = useAtlasProgress()
  const quiz = useMapQuiz(journey)

  const [activePlaceId, setActivePlaceId] = useState<string | null>(null)
  const [distanceLeg, setDistanceLeg] = useState<number | null>(null)
  const [showPassport, setShowPassport] = useState(false)

  const currentStop = journey.stops[player.index]
  const currentPlace = currentStop ? PLACES[currentStop.place] : undefined

  // 장소별 방문 순번 — 핀 번호·시트 헤더와 같은 값을 써야 헷갈리지 않는다
  const placeOrder = useMemo(() => {
    const map = new Map<string, number>()
    for (const stop of journey.stops) {
      if (!map.has(stop.place)) map.set(stop.place, map.size + 1)
    }
    return map
  }, [journey])

  const journeyPlaceIds = useMemo(() => uniquePlaceIds(journey), [journey])
  const visitedInJourney = journeyPlaceIds.filter((id) => visitedIds.has(id)).length
  const journeyComplete = visitedInJourney === journeyPlaceIds.length

  // 여정 완주 축하 — 여정당 최초 1회만 (스토리 모드 완주 연출과 같은 규약)
  useEffect(() => {
    if (!journeyComplete || hasCelebratedJourney(journey.id)) return
    markJourneyCelebrated(journey.id)
    // 축하 효과는 완주 순간에만 필요하다 — canvas-confetti 는 그때 받는다
    // (읽기 화면·플랜과 같은 규약. 첫 진입 청크에 들고 다니지 않는다)
    void import('canvas-confetti').then(({ default: confetti }) =>
      confetti({
        particleCount: 110,
        spread: 78,
        origin: { y: 0.55 },
        colors: [journey.color, '#3182f6', '#facc15'],
      }),
    )
  }, [journeyComplete, journey])

  const activePlace = activePlaceId ? PLACES[activePlaceId] : undefined

  // ?p=<슬러그> 로 들어오면 그 장소 카드를 바로 편다 — 본문의 지명 칩,
  // 스토리 에피소드에서 건너오는 딥링크가 이 자리로 떨어진다.
  const deepLinkPlace = searchParams.get('p')
  const [handledDeepLink, setHandledDeepLink] = useState<string | null>(null)
  if (deepLinkPlace && deepLinkPlace !== handledDeepLink && PLACES[deepLinkPlace]) {
    setHandledDeepLink(deepLinkPlace)
    setActivePlaceId(deepLinkPlace)
  }

  /** 핀 카드를 여는 것이 곧 "방문" — 여권에 도장이 찍힌다 */
  const openPlace = (placeId: string) => {
    setActivePlaceId(placeId)
    markVisited(placeId)
  }

  /** 지도에서 핀을 눌렀을 때 — 퀴즈 중이면 답, 아니면 장소 카드 */
  const handlePinTap = (placeId: string) => {
    if (quiz.active) quiz.pick(placeId)
    else openPlace(placeId)
  }

  const startQuiz = () => {
    // 퀴즈는 전체 지도가 보이는 상태에서 풀어야 후보를 고를 수 있다
    player.skipToEnd()
    quiz.start()
  }

  const selectJourney = (id: string) => {
    setSearchParams(id === JOURNEYS[0].id ? {} : { j: id }, { replace: true })
  }

  // 아직 걸어보지 않았다면 진행 바는 비어 있어야 한다 — 전체가 그려진 상태와
  // "다 걸었다"는 다른 뜻이다
  const progressPct =
    !player.hasPlayed || journey.stops.length <= 1
      ? 0
      : Math.round((player.index / (journey.stops.length - 1)) * 100)

  const legPlaces =
    distanceLeg != null
      ? {
          from: PLACES[journey.stops[distanceLeg - 1].place],
          to: PLACES[journey.stops[distanceLeg].place],
          bySea: !!journey.stops[distanceLeg].sea,
        }
      : null

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="atlas" />

        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-bottomnav-safe lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:pb-8 lg:overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => navigate('/bible')}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-full lg:hidden"
              aria-label="성경으로 돌아가기"
            >
              <span className="material-icons-round text-[22px]">arrow_back</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] font-bold text-ink-strong">지도여행</h1>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                말씀이 실제로 걸어간 길
              </p>
            </div>
            <button type="button" className="atl-passport-btn" onClick={() => setShowPassport(true)}>
              <span className="material-icons-outlined">approval</span>
              여권
            </button>
          </div>

          {/* 여정 선택 */}
          <div className="atl-tracks">
            {JOURNEYS.map((item) => {
              const on = item.id === journey.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`atl-track${on ? ' atl-track--on' : ''}`}
                  style={on ? { borderColor: item.color, color: item.color } : undefined}
                  onClick={() => selectJourney(item.id)}
                >
                  <span className="atl-track__dot" style={{ background: item.color }} />
                  {item.short}
                </button>
              )
            })}
          </div>

          {/* 지도 */}
          <div className="atl-stage">
            <MapCanvas
              journey={journey}
              revealedIndex={player.index}
              legProgress={player.legProgress}
              traveling={player.playing}
              activePlaceId={activePlaceId}
              onSelectPlace={handlePinTap}
              visitedPlaceIds={visitedIds}
              quizChoices={quiz.active && quiz.current ? quiz.current.choices : null}
              quizRevealed={
                quiz.current && quiz.picked
                  ? { answer: quiz.current.answer, picked: quiz.picked }
                  : null
              }
            />

            {/* 자막 — 걸어본 뒤에는 지금 지점, 그 전에는 여정 훅.
                퀴즈 중에는 문제 패널이 아래에 있으므로 자막을 비운다 */}
            <div className="atl-caption" aria-live="polite" hidden={quiz.active}>
              {player.hasPlayed ? (
                <>
                  <span className="atl-caption__where" style={{ color: journey.color }}>
                    {currentPlace ? placeLabel(currentPlace) : ''}
                  </span>
                  <span className="atl-caption__text">{currentStop?.narration}</span>
                </>
              ) : (
                <span className="atl-caption__text atl-caption__text--hook">{journey.hook}</span>
              )}
            </div>

            <div className="atl-seek">
              <div
                className="atl-seek__fill"
                style={{ width: `${progressPct}%`, background: journey.color }}
              />
            </div>
          </div>

          {/* 퀴즈 중에는 재생 컨트롤 대신 문제 패널이 온다 */}
          {quiz.active ? (
            <QuizPanel quiz={quiz} color={journey.color} />
          ) : (
          <div className="atl-controls">
            <button
              type="button"
              className="atl-play"
              style={{ background: journey.color }}
              onClick={player.toggle}
            >
              <span className="material-icons-round text-[22px]">
                {player.playing ? 'pause' : player.finished ? 'replay' : 'play_arrow'}
              </span>
              {player.playing ? '멈추기' : player.finished ? '다시 걸어보기' : '걸어보기'}
            </button>
            <button
              type="button"
              className="atl-ghost"
              onClick={player.skipToEnd}
              disabled={player.finished}
            >
              전체 보기
            </button>
            <button
              type="button"
              className="atl-ghost atl-ghost--quiz"
              onClick={startQuiz}
              aria-label="지도 퀴즈"
              title="지도 퀴즈"
            >
              <span className="material-icons-outlined">quiz</span>
            </button>
          </div>
          )}

          {/* 여정 요약 */}
          <div className="px-4">
            <div className="atl-meta">
              <span className="atl-meta__era">{journey.era}</span>
              <span className="atl-meta__dot" aria-hidden>
                ·
              </span>
              <span>{journey.scripture}</span>
              <span className="atl-meta__dot" aria-hidden>
                ·
              </span>
              <span
                className={journeyComplete ? 'atl-meta__done' : undefined}
                style={journeyComplete ? { color: journey.color } : undefined}
              >
                도장 {visitedInJourney}/{journeyPlaceIds.length}
              </span>
            </div>
            <p className="atl-subtitle">{journey.subtitle}</p>
          </div>

          {/* 지점 목록 — 탭하면 그 지점으로 건너뛴다 */}
          <ol className="atl-stops">
            {journey.stops.map((stop, i) => {
              const place = PLACES[stop.place]
              if (!place) return null
              const reached = i <= player.index
              const isCurrent = i === player.index
              const revisit = journey.stops.findIndex((s) => s.place === stop.place) !== i
              const prev = i > 0 ? PLACES[journey.stops[i - 1].place] : undefined
              const feel = prev ? distanceFeelOf(prev, place, !!stop.sea) : null
              return (
                <li key={`${stop.place}-${i}`}>
                  {/* 구간 거리 — 지점과 지점 사이에 끼워 "얼마나 멀었나"를 계속 보이게 */}
                  {feel && feel.km >= 15 && (
                    <button
                      type="button"
                      className="atl-leg-chip"
                      onClick={() => setDistanceLeg(i)}
                    >
                      <span className="material-icons-round text-[13px]">
                        {stop.sea ? 'sailing' : 'directions_walk'}
                      </span>
                      {formatKm(feel.km)}km · {feel.mode === 'sail' ? '뱃길' : '걸어서'} {feel.days}일
                      <span className="material-icons-round atl-leg-chip__more">expand_more</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`atl-stop${reached ? ' atl-stop--on' : ''}${
                      isCurrent ? ' atl-stop--current' : ''
                    }`}
                    onClick={() => player.seekTo(i)}
                  >
                    <span
                      className="atl-stop__no"
                      style={reached ? { background: journey.color } : undefined}
                    >
                      {revisit ? (
                        <span className="material-icons-round text-[14px]">u_turn_left</span>
                      ) : (
                        placeOrder.get(stop.place)
                      )}
                    </span>
                    <span className="atl-stop__body">
                      <span className="atl-stop__head">
                        <span className="atl-stop__place">{placeLabel(place)}</span>
                        {visitedIds.has(stop.place) && (
                          <span
                            className="atl-stop__stamp"
                            style={{ color: journey.color }}
                            title="방문 도장"
                          >
                            <span className="material-icons-round text-[13px]">check_circle</span>
                          </span>
                        )}
                      </span>
                      <span className="atl-stop__title">{stop.title}</span>
                      <span className="atl-stop__narration">{stop.narration}</span>
                    </span>
                    <span
                      className="atl-stop__more"
                      onClick={(e) => {
                        e.stopPropagation()
                        openPlace(stop.place)
                      }}
                      role="button"
                      tabIndex={-1}
                      aria-label={`${placeLabel(place)} 자세히`}
                    >
                      <span className="material-icons-round text-[18px]">info</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        {/* 우측 레일 (lg+) */}
        <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
          <section className="atl-rail-card">
            <span className="atl-rail-card__eyebrow" style={{ color: journey.color }}>
              {journey.era}
            </span>
            <h2 className="atl-rail-card__title">{journey.title}</h2>
            <p className="atl-rail-card__text">{journey.hook}</p>
            <dl className="atl-rail-stats">
              <div>
                <dt>지점</dt>
                <dd>{journeyPlaceIds.length}곳</dd>
              </div>
              <div>
                <dt>도장</dt>
                <dd style={journeyComplete ? { color: journey.color } : undefined}>
                  {visitedInJourney}/{journeyPlaceIds.length}
                </dd>
              </div>
              <div>
                <dt>본문</dt>
                <dd>{journey.scripture}</dd>
              </div>
            </dl>
          </section>

          <section className="atl-rail-card atl-rail-card--tip">
            <p className="atl-rail-card__eyebrow">이렇게 보세요</p>
            <ul className="atl-tips">
              <li>
                <span className="material-icons-round">play_arrow</span>
                <span>걸어보기를 누르면 경로가 순서대로 그려집니다.</span>
              </li>
              <li>
                <span className="material-icons-round">place</span>
                <span>핀을 누르면 그곳에서 일어난 일이 열리고, 여권에 도장이 찍힙니다.</span>
              </li>
              <li>
                <span className="material-icons-round">directions_walk</span>
                <span>구간 거리를 누르면 우리 교회 기준으로 얼마나 먼지 보여 줍니다.</span>
              </li>
              <li>
                <span className="material-icons-round">sailing</span>
                <span>점선은 바닷길, 실선은 걸어간 길입니다.</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {activePlace && (
        <PlaceSheet
          place={activePlace}
          order={placeOrder.get(activePlace.id)}
          color={journey.color}
          currentJourneyId={journey.id}
          onOpenJourney={(id) => {
            setActivePlaceId(null)
            selectJourney(id)
          }}
          onClose={() => setActivePlaceId(null)}
        />
      )}

      {legPlaces?.from && legPlaces.to && (
        <DistanceSheet
          from={legPlaces.from}
          to={legPlaces.to}
          bySea={legPlaces.bySea}
          color={journey.color}
          onClose={() => setDistanceLeg(null)}
        />
      )}

      {showPassport && (
        <PassportSheet
          visitedIds={visitedIds}
          onOpenJourney={(id) => {
            setShowPassport(false)
            selectJourney(id)
          }}
          onClose={() => setShowPassport(false)}
        />
      )}

      <BibleBottomNav active="atlas" />
    </div>
  )
}

export default AtlasMap
