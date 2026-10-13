import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import { useBibleBooks } from '../../../hooks/useBible'
import { useTypingHome } from '../../../hooks/useBibleTyping'
import { useTitles } from '../../../hooks/useTitles'
import { tokenStore } from '../../../utils/tokenStore'
import { sessionPath, useIgnorePunct, useTypingMode } from './typingPrefs'
import TodayCard from './home/TodayCard'
import DailyVerseCard from './home/DailyVerseCard'
import InkCalendar from './home/InkCalendar'
import BookSection from './home/BookSection'
import ChurchBibleCard from './home/ChurchBibleCard'
import RelayCard from './home/RelayCard'
import NextTitleCard from './home/NextTitleCard'
import './typing.css'

/**
 * 말씀 필사 허브 — "매일 한 페이지씩 쌓이는 나의 필사 노트".
 * 첫 화면은 '오늘의 필사' 하나(등잔·이번 주·이어 쓸 말씀·버튼 하나), 그 아래로
 * 오늘의 한 절 → 잉크 달력 → 쓰는 중인 책 → 스프린트. 오른쪽(모바일은 아래)은 함께 쓰는 것들.
 */
const TypingHome = () => {
  const navigate = useNavigate()
  const loggedIn = !!tokenStore.getAccess()
  const { data: books } = useBibleBooks()
  // 허브 데이터는 요청 하나(묶음)로 — 조각별 요청 6개가 홈의 요청들과 섞여 줄을 서던 것을 줄인다
  const { data: home } = useTypingHome()
  const stats = home?.stats
  const calendar = home?.calendar
  const daily = home?.daily
  const church = home?.church_bible
  const { data: titles } = useTitles(loggedIn)
  const [mode, setMode] = useTypingMode()
  const [ignorePunct, setIgnorePunct] = useIgnorePunct()

  const bookName = (n: number) => books?.find((b) => b.book_number === n)?.book_name_ko ?? ''
  const typingTitles = useMemo(() => (titles?.titles ?? []).filter((t) => t.category === 'typing'), [titles])
  const go = (book: number, chapter: number, verse?: number) => navigate(sessionPath(book, chapter, mode, verse))

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--home pb-bottomnav-safe">
          {/* PC 2단 — 왼쪽 나의 필사, 오른쪽 함께 쓰는 것. 모바일에선 래퍼가 display:contents 라 순서 그대로 */}
          <div className="bt-home-main">
            <TodayCard
              loggedIn={loggedIn}
              stats={stats}
              calendar={calendar}
              mode={mode}
              setMode={setMode}
              ignorePunct={ignorePunct}
              setIgnorePunct={setIgnorePunct}
              bookName={bookName}
              nextVerseText={home ? home.next_verse_text : undefined}
              onGo={go}
            />

            {loggedIn && <DailyVerseCard daily={daily} />}

            {loggedIn && <InkCalendar calendar={calendar} stats={stats} />}

            <BookSection loggedIn={loggedIn} stats={stats} bookTotals={church?.book_totals} onGo={go} />

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
          </div>

          <div className="bt-home-side">
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
