import { useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useSermons } from '../../hooks/useSermons'
import { useEvents } from '../../hooks/useEvents'
import { isAdmin } from '../../utils/auth'
import HeroSection from './components/HeroSection'
import FaqSection from './components/FaqSection'
import PillarsSection from './components/PillarsSection'
import DemoSection from './components/DemoSection'
import QuizSection from './components/QuizSection'
import ThisWeekSection from './components/ThisWeekSection'
import ClosingCta from './components/ClosingCta'
import './Landing.css'

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
  const isAdminUser = isAdmin()

  const { data: sermons } = useSermons(0, 2)
  const today = new Date()
  const rangeEnd = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  const { events } = useEvents(toDateString(today), toDateString(rangeEnd))

  const scrollToTour = useCallback(() => {
    document.getElementById('tour')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen page-stage">
      <HeroSection isAdmin={isAdminUser} ko={ko} onTour={scrollToTour} />
      <div className="max-w-[1040px] mx-auto px-5 pb-20">
        <FaqSection isAdmin={isAdminUser} ko={ko} />
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
