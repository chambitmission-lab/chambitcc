import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import { useBibleBooks } from '../../../hooks/useBible'
import { useLinkSummary, useMannaSummary, useTypingHome, useTypingRelayLive } from '../../../hooks/useBibleTyping'
import { useTitles } from '../../../hooks/useTitles'
import { tokenStore } from '../../../utils/tokenStore'
import { smoothScrollToElement } from '../../../utils/scrollTo'
import { sessionPath, useIgnorePunct, useTypingMode } from './typingPrefs'
import TodayCard from './home/TodayCard'
import DailyVerseCard from './home/DailyVerseCard'
import InkCalendar from './home/InkCalendar'
import BookSection, { PICK_SECTION_ID } from './home/BookSection'
import ChurchBibleCard from './home/ChurchBibleCard'
import RelayCard from './home/RelayCard'
import NextTitleCard from './home/NextTitleCard'
import ContestEntryCard from './home/ContestEntryCard'
import './typing.css'

/**
 * 말씀 필사 허브 — "매일 한 페이지씩 쌓이는 나의 필사 노트".
 * 첫 화면은 '오늘의 필사' 하나(등잔·이번 주·이어 쓸 말씀·버튼 하나), 그 아래로
 * 골라 쓰기(펼친 책·장 격자) → 오늘의 한 절 → 잉크 달력 → 스프린트. 오른쪽(모바일은 아래)은 함께 쓰는 것들.
 */
const TypingHome = () => {
  const navigate = useNavigate()
  const loggedIn = !!tokenStore.getAccess()
  const { data: books } = useBibleBooks()
  // 허브 데이터는 요청 하나(묶음)로 — 조각별 요청 6개가 홈의 요청들과 섞여 줄을 서던 것을 줄인다
  const { data: home, isPending: homePending } = useTypingHome()
  // 내 릴레이 카드의 진행 칸도 다른 멤버가 쓰면 바로 바뀌게(SSE)
  useTypingRelayLive()
  const stats = home?.stats
  const calendar = home?.calendar
  const daily = home?.daily
  const church = home?.church_bible
  // 첫 화면(오늘의 필사)이 기다리는 건 묶음 하나다 — 칭호(GET /titles 는 평가까지 도는 무거운 요청)와 만나 순위는
  // 묶음이 도착한 뒤에 받아 콜드 진입에서 묶음과 대역폭·DB 를 다투지 않게 한다 (캐시가 있으면 바로 그려진다)
  const homeSettled = !loggedIn || !homePending
  const { data: titles } = useTitles(loggedIn && homeSettled)
  const { data: manna } = useMannaSummary(homeSettled)
  const { data: link } = useLinkSummary(homeSettled)
  // 로그인했는데 묶음이 아직 없다 — 첫 방문자용 문구(시편 23편부터)를 먼저 그렸다가 실제 자리로 바꾸면 화면이 튄다.
  // 요청이 실패하면(isPending false) 자리표시자를 걷고 평소 화면으로 돌아간다
  const loading = loggedIn && homePending
  const [mode, setMode] = useTypingMode()
  const [ignorePunct, setIgnorePunct] = useIgnorePunct()

  const bookName = (n: number) => books?.find((b) => b.book_number === n)?.book_name_ko ?? ''
  const typingTitles = useMemo(() => (titles?.titles ?? []).filter((t) => t.category === 'typing'), [titles])
  const go = (book: number, chapter: number, verse?: number) => navigate(sessionPath(book, chapter, mode, verse))
  const toPicker = () => smoothScrollToElement(document.getElementById(PICK_SECTION_ID), { offset: 76 })

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--home pb-bottomnav-safe">
          {/* PC 2단 — 왼쪽 나의 필사, 오른쪽 함께 쓰는 것. 모바일에선 래퍼가 display:contents 라 순서 그대로 */}
          <div className="bt-home-main">
            <TodayCard
              loggedIn={loggedIn}
              loading={loading}
              stats={stats}
              calendar={calendar}
              mode={mode}
              setMode={setMode}
              ignorePunct={ignorePunct}
              setIgnorePunct={setIgnorePunct}
              bookName={bookName}
              nextVerseText={home ? home.next_verse_text : undefined}
              onGo={go}
              onPick={toPicker}
            />

            {/* 골라 쓰기는 접지 않고 바로 아래 — 대부분은 오늘 쓰고 싶은 곳을 들고 온다 */}
            <BookSection loggedIn={loggedIn} loading={loading} stats={stats} bookTotals={church?.book_totals} onGo={go} />

            {loggedIn && <DailyVerseCard daily={daily} />}

            {loggedIn && <InkCalendar calendar={calendar} stats={stats} />}

            <button type="button" className="bt-card bt-sprint-entry" onClick={() => navigate('/bible/typing/sprint')}>
              <span className="material-icons-round bt-sprint-entry__icon" aria-hidden>
                timer
              </span>
              <span className="bt-sprint-entry__body">
                <span className="bt-sprint-entry__title">말씀 스프린트</span>
                <span className="bt-sprint-entry__desc">
                  익숙한 5절 시간 경주{stats?.best_cpm ? ` · 나의 최고 ${stats.best_cpm}타` : ''} · 이번 주 순위
                </span>
              </span>
              <span className="material-icons-round" aria-hidden>
                chevron_right
              </span>
            </button>

            <button type="button" className="bt-card bt-sprint-entry bt-manna-entry" onClick={() => navigate('/bible/typing/manna')}>
              <span className="material-icons-round bt-sprint-entry__icon" aria-hidden>
                grain
              </span>
              <span className="bt-sprint-entry__body">
                <span className="bt-sprint-entry__title">만나 내리기</span>
                <span className="bt-sprint-entry__desc">
                  {manna?.today?.rank
                    ? `오늘의 만나 ${manna.today.rank}위 · ${manna.today.score.toLocaleString('ko-KR')}점`
                    : manna && manna.players_today > 0
                      ? `오늘 ${manna.players_today}명이 거뒀어요 · 부서 대항전`
                      : '내려오는 말씀을 순서대로 거두는 게임 · 부서 대항전'}
                </span>
              </span>
              <span className="material-icons-round" aria-hidden>
                chevron_right
              </span>
            </button>

            <button type="button" className="bt-card bt-sprint-entry bt-link-entry" onClick={() => navigate('/bible/typing/link')}>
              <span className="material-icons-round bt-sprint-entry__icon" aria-hidden>
                extension
              </span>
              <span className="bt-sprint-entry__body">
                <span className="bt-sprint-entry__title">말씀 잇기</span>
                <span className="bt-sprint-entry__desc">
                  {link?.today
                    ? `오늘 ${link.today.rank}위 · ${link.today.score.toLocaleString('ko-KR')}점`
                    : link && link.players_today > 0
                      ? `오늘 ${link.players_today}명이 이었어요 · 부서 대항`
                      : '흩어진 말씀 조각을 순서대로 톡톡 · 부서 대항'}
                </span>
              </span>
              <span className="material-icons-round" aria-hidden>
                chevron_right
              </span>
            </button>
          </div>

          <div className="bt-home-side">
            <ContestEntryCard enabled={homeSettled} />
            {loggedIn && <ChurchBibleCard data={church} bookName={bookName} />}
            {loggedIn && <RelayCard relays={home?.relays} />}
            {loggedIn && <NextTitleCard titles={typingTitles} />}
          </div>
        </main>
      </div>
      <BibleBottomNav active="typing" />
    </div>
  )
}

export default TypingHome
