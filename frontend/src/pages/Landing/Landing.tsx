import { useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useSermons } from '../../hooks/useSermons'
import { useEvents } from '../../hooks/useEvents'
import HeroSection from './components/HeroSection'
import FaqSection from './components/FaqSection'
import PillarsSection from './components/PillarsSection'
import DemoSection from './components/DemoSection'
import QuizSection from './components/QuizSection'
import ThisWeekSection from './components/ThisWeekSection'
import ClosingCta from './components/ClosingCta'
import './Landing.css'
import { can } from '../../utils/access'

// 비로그인 방문자용 메인 — 로그인 교인은 App의 HomeGate가 기도 피드 홈(NewHome)을 보여준다.
//
// "교회 홈페이지" 문법(정보 나열)이 아니라 제품 랜딩 문법으로 구성한다:
//   히어로(큰 약속 + 살아있는 숫자) → 유머 FAQ(첫 방문 불안 해소) → 3기둥(설교·성경공부·스마트)
//   → 직접 써보기(참비·통독표 도장·말씀 카드) → 성도 테스트(공유) → 이번 주(예배 카운트다운·일정)
//   → 마무리 두 갈래(와보세요 / 앱으로). 가입 CTA는 마지막에서만 주연이다.
// 히어로·FAQ 카피는 about_content.fields 에 저장돼 관리자가 화면에서 바로 고친다.

const toDateString = (d: Date) => {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

const Landing = () => {
  const { language } = useLanguage()
  const ko = language === 'ko'
  const isAdminUser = can('content:manage')

  const { data: sermons } = useSermons(0, 2, false) // 제목·설교자·날짜만 쓴다 — 전문 제외
  const today = new Date()
  const rangeEnd = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  const { events } = useEvents(toDateString(today), toDateString(rangeEnd))

  const scrollToTour = useCallback(() => {
    const el = document.getElementById('tour')
    if (!el) return
    // 이 앱은 window가 아니라 #root가 스크롤 컨테이너라 window.scrollTo는 아무 일도 하지 않는다.
    // 컨테이너를 가리지 않는 scrollIntoView만 쓴다 (헤더 오프셋은 섹션의 scroll-mt-20이 처리).
    // 모바일(터치)에선 탭 직후 이어지는 터치 이벤트가 smooth 스크롤을 중간에 끊어
    // 제자리에 머무는 경우가 있어 즉시 이동한다.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    const behavior: ScrollBehavior = coarse ? 'auto' : 'smooth'
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior, block: 'start' })
    })
  }, [])

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen page-stage">
      <HeroSection isAdmin={isAdminUser} ko={ko} onTour={scrollToTour} />
      <div className="max-w-[1040px] mx-auto px-5 pb-20">
        <FaqSection isAdmin={isAdminUser} ko={ko} onAsk={scrollToTour} />
        <PillarsSection ko={ko} sermons={sermons ?? []} />
        <DemoSection ko={ko} />
        <QuizSection ko={ko} />
        <ThisWeekSection ko={ko} events={events} />
        <ClosingCta ko={ko} />
      </div>
    </div>
  )
}

export default Landing
