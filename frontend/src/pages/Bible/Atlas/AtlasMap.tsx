import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import MapCanvas from './components/MapCanvas'
import PlaceSheet from './components/PlaceSheet'
import DistanceSheet from './components/DistanceSheet'
import PassportSheet from './components/PassportSheet'
import QuizPanel from './components/QuizPanel'
import { ALL_JOURNEY_PLACE_IDS, JOURNEYS, getJourney, uniquePlaceIds } from './data/journeys'
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

  // 모바일에서 이 화면은 자체 스크롤러(.atl-page)다 — 그 안에서만 지도가 sticky 로
  // 붙는다(앱 전역 #root overflow 탓에 body 스크롤에는 sticky 가 먹지 않는다).
  const shellRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  // 지도가 실제로 화면 위에 붙은 순간에만 그림자를 준다 — 맨 위에서도 그림자가 있으면
  // 지도가 괜히 떠 보인다
  useEffect(() => {
    const el = shellRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setStuck(el.scrollTop > 6)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // 현재 지점이 바뀌면 목록이 따라간다 — 지도(고정)와 목록이 같은 지점을 가리켜야
  // "지금 어디"가 한 화면에서 읽힌다.
  // ★단, 지금 지점이 화면 밖으로 나갔을 때만 움직인다. scrollIntoView 는 고정된
  //   지도에 가린 항목도 "안 보인다"고 보고 매 걸음 스크롤을 걸어 화면이 떨렸다.
  //   여기서는 지도 덩어리 아래의 실제로 보이는 띠를 직접 재서, 이미 보이면 가만히 둔다.
  const listRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const currentStopRef = useRef<HTMLLIElement>(null)
  const followedRef = useRef<number | null>(null)
  const journeyRef = useRef(journey.id)
  useEffect(() => {
    // 여정을 바꾸면 index 가 마지막 지점으로 초기화된다 — 그걸 따라가면 새 여정을
    // 열자마자 목록이 맨 아래로 튄다. 바뀐 첫 번째는 건너뛰고 목록을 위로 되돌린다.
    if (journeyRef.current !== journey.id) {
      journeyRef.current = journey.id
      followedRef.current = player.index
      if (listRef.current) listRef.current.scrollTop = 0
      return
    }
    // 첫 렌더에서 스크롤하면 들어오자마자 목록이 지도를 밀어 올린다 — 한 번은 건너뛴다
    if (followedRef.current === null || followedRef.current === player.index) {
      followedRef.current = player.index
      return
    }
    followedRef.current = player.index

    const li = currentStopRef.current
    const desktop = window.innerWidth >= 1024
    // 스크롤하는 주체가 다르다 — PC 는 목록 판, 모바일은 화면 전체(.atl-page)
    const scroller = desktop ? listRef.current : shellRef.current
    if (!li || !scroller) return
    const item = li.getBoundingClientRect()
    const box = scroller.getBoundingClientRect()
    // 모바일에선 고정된 지도 덩어리가 위를 덮고, 하단 독이 아래를 덮는다
    const top = desktop
      ? box.top
      : Math.max(box.top, stickyRef.current?.getBoundingClientRect().bottom ?? box.top)
    const bottom = desktop ? box.bottom : box.bottom - 96
    if (item.top >= top - 2 && item.bottom <= bottom + 2) return
    scroller.scrollBy({ top: item.top - top - 8, behavior: 'smooth' })
  }, [player.index, journey.id])

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

  // 여권 진척 — 여정을 통틀어 찍은 도장. 헤더의 "여권"이 빈 버튼이 아니라
  // 지금 상태를 가리키게 한다(여권 시트와 같은 분모를 쓴다)
  const totalVisited = ALL_JOURNEY_PLACE_IDS.filter((id) => visitedIds.has(id)).length

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

  /** 핀 카드를 여는 것이 곧 "방문" — 여권에 도장이 찍힌다.
      참조가 안정적이어야 지점 목록 useMemo 가 유지된다 */
  const openPlace = useCallback(
    (placeId: string) => {
      setActivePlaceId(placeId)
      markVisited(placeId)
    },
    [markVisited],
  )

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

  /** 지점 목록 — 탭하면 그 지점으로 건너뛴다.
      ★재생 중에는 legProgress 가 매 프레임 바뀌어 이 화면이 통째로 다시 그려진다.
      목록까지 프레임마다 다시 만들면(항목 20개 × span 여러 개) 고정된 지도와 함께
      화면이 미세하게 떨린다 — 지점이 바뀔 때만 다시 만든다. */
  // 목록 memo 가 player 객체(매 렌더 새로 만들어진다) 대신 실제로 쓰는 값만 보게 한다
  const playerIndex = player.index
  const seekTo = player.seekTo

  const stopList = useMemo(
    () => (
      <ol className="atl-stops">
        {journey.stops.map((stop, i) => {
          const place = PLACES[stop.place]
          if (!place) return null
          const reached = i <= playerIndex
          const isCurrent = i === playerIndex
          const revisit = journey.stops.findIndex((s) => s.place === stop.place) !== i
          const prev = i > 0 ? PLACES[journey.stops[i - 1].place] : undefined
          const feel = prev ? distanceFeelOf(prev, place, !!stop.sea) : null
          return (
            <li key={`${stop.place}-${i}`} ref={isCurrent ? currentStopRef : undefined}>
              {/* 구간 거리 — 지점과 지점 사이에 끼워 "얼마나 멀었나"를 계속 보이게 */}
              {feel && feel.km >= 15 && (
                <button type="button" className="atl-leg-chip" onClick={() => setDistanceLeg(i)}>
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
                onClick={() => seekTo(i)}
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
    ),
    [journey, playerIndex, seekTo, visitedIds, placeOrder, openPlace],
  )

  return (
    // 모바일에선 이 화면만 자체 스크롤러다 — 페이지 전체가 스크롤되면 지도가 위로
    // 사라져, 아래 지점 목록을 누를 때마다 다시 위로 올라가 확인해야 했다.
    // 앱 전역(#root overflow) 탓에 body 스크롤에는 sticky 가 붙지 않으므로,
    // 여기서 스크롤 컨테이너를 만들어 그 안에서 지도를 sticky 로 세운다.
    <div
      ref={shellRef}
      className="atl-page bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage"
    >
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="atlas" />

        <div className="atl-card max-w-md mx-auto bg-background-light dark:bg-background-dark pb-bottomnav-safe lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:pb-6 lg:overflow-hidden">
          {/* 페이지 헤드 — 타이틀·여권 진척·여정 선택을 한 블록으로 묶는다.
              예전엔 56px 고정 띠(17px 제목 + 부제 두 줄)에 칩 줄이 따로 떠 있어,
              PC에선 제목과 여권 사이가 통째로 비고 모바일에선 두 줄이 눌려 보였다.
              다른 성경 하위 화면(읽기 플랜·단어장·구절 알람)의 헤더 문법대로
              아래 헤어라인 하나로 크롬을 닫고, 제목은 같은 급(19 / PC 22px)으로 올린다. */}
          <div className="atl-head">
            <div className="atl-head__row">
              <button
                onClick={() => navigate('/bible')}
                className="atl-head__back lg:hidden"
                aria-label="성경으로 돌아가기"
              >
                <span className="material-icons-round">arrow_back</span>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="atl-head__title">지도여행</h1>
                <p className="atl-head__sub">말씀이 실제로 걸어간 길</p>
              </div>
              {/* 빈 가로를 채우면서 여권 버튼에 이유를 만들어 주는 자리 */}
              <span className="atl-stamps">
                도장 {totalVisited}
                <span className="atl-stamps__total">/{ALL_JOURNEY_PLACE_IDS.length}</span>
              </span>
              <button
                type="button"
                className="atl-passport-btn"
                onClick={() => setShowPassport(true)}
              >
                <span className="material-icons-outlined">approval</span>
                여권
              </button>
            </div>

            {/* 여정 선택 */}
            <div className="atl-tracks">
              {JOURNEYS.map((item) => {
                const on = item.id === journey.id
                return (
                  // 활성 칩은 배경 틴트까지 여정 색에서 뽑는다 — 배경만 brand-soft(파랑)를
                  // 쓰던 예전 조합은 주황·초록 여정에서 한 칩에 액센트가 둘로 갈렸다
                  <button
                    key={item.id}
                    type="button"
                    className={`atl-track${on ? ' atl-track--on' : ''}`}
                    style={
                      on
                        ? {
                            borderColor: item.color,
                            color: item.color,
                            background: `${item.color}1f`,
                          }
                        : undefined
                    }
                    onClick={() => selectJourney(item.id)}
                  >
                    <span className="atl-track__dot" style={{ background: item.color }} />
                    {item.short}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 지도 판 + 지점 목록 — PC(lg+)에선 나란히 놓아 목록을 눌러도 지도가
              그대로 보인다. 모바일에선 위아래로 쌓이고, 지도 덩어리가 sticky 로 남는다. */}
          <div className="atl-body">
            <div className="atl-pane-map">
              {/* 지도와 재생 컨트롤(퀴즈 중엔 문제 패널)은 한 덩어리로 붙어 있어야 한다 —
                  퀴즈의 답은 지도의 핀을 누르는 것이라 문제와 지도가 함께 보여야 한다 */}
              <div ref={stickyRef} className={`atl-sticky${stuck ? ' atl-sticky--stuck' : ''}`}>
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
                      <span className="atl-caption__text atl-caption__text--hook">
                        {journey.hook}
                      </span>
                    )}
                  </div>

                  <div className="atl-seek">
                    <div
                      className="atl-seek__fill"
                      style={{
                        width: `${progressPct}%`,
                        background: journey.color,
                      }}
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
              </div>

              {/* 여정 요약 — 예전엔 같은 내용이 우측 레일 카드에도 있었다.
                  레일 자리는 지점 목록이 쓰므로 여정 제목까지 여기로 합친다 */}
              <div className="atl-summary">
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
                <h2 className="atl-subtitle">{journey.title}</h2>
                <p className="atl-tagline">{journey.subtitle}</p>
              </div>
            </div>

            {/* 지점 목록 — 탭하면 그 지점으로 건너뛴다 */}
            <div className="atl-pane-list" ref={listRef}>
              <div className="atl-list-head">
                <span className="atl-list-head__title">지점 {journey.stops.length}</span>
                <span className="atl-list-head__hint">누르면 지도가 그곳으로 갑니다</span>
              </div>

              {stopList}

              {/* 사용법 — 예전 우측 레일 카드. 목록 아래 꼬리에 둔다(PC 전용) */}
              <section className="atl-rail-card atl-rail-card--tip atl-tips-card">
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
            </div>
          </div>
        </div>
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
