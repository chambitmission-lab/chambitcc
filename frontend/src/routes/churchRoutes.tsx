import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { historyLabLoader, menuRouteLoaders } from '../utils/routePreload'

// 교회 소개·예배·소식·행사·참여(설문·좌석·선거)
// 햄버거 메뉴 페이지는 routePreload 의 로더를 공유해 프리로드 청크를 재사용한다

const About = lazy(menuRouteLoaders['/about'])
const Greeting = lazy(menuRouteLoaders['/greeting'])
const Visit = lazy(menuRouteLoaders['/visit'])
const Organization = lazy(menuRouteLoaders['/organization'])
const People = lazy(menuRouteLoaders['/people'])
const History = lazy(menuRouteLoaders['/history'])
const HistoryLab = lazy(historyLabLoader)
const TV = lazy(() => import('../pages/TV/TV'))
const Education = lazy(menuRouteLoaders['/education'])
const Mission = lazy(menuRouteLoaders['/mission'])
const Ministry = lazy(menuRouteLoaders['/ministry'])
const News = lazy(menuRouteLoaders['/news'])
const Participate = lazy(() => import('../pages/Participate/Participate'))
const Online = lazy(() => import('../pages/Online/Online'))
const Culture = lazy(menuRouteLoaders['/culture'])
const SurveyList = lazy(menuRouteLoaders['/survey'])
const SurveyDetail = lazy(() => import('../pages/Survey/SurveyDetail'))
const SeatEventList = lazy(menuRouteLoaders['/seats'])
const SeatEventDetail = lazy(() => import('../pages/Seats/SeatEventDetail'))
const ElectionList = lazy(() => import('../pages/Election/ElectionList'))
const ElectionDetail = lazy(() => import('../pages/Election/ElectionDetail'))
const Worship = lazy(menuRouteLoaders['/worship'])
const Sermon = lazy(menuRouteLoaders['/sermon'])
const EventCalendar = lazy(menuRouteLoaders['/events'])
const EventDetail = lazy(() => import('../pages/Events/EventDetail'))

export const churchRoutes = (
  <>
    <Route path="/about" element={<About />} />
    <Route path="/greeting" element={<Greeting />} />
    <Route path="/visit" element={<Visit />} />
    <Route path="/organization" element={<Organization />} />
    <Route path="/people" element={<People />} />
    <Route path="/history" element={<History />} />
    {/* 발자취 새 화면 시범 운영 — 성도 의견 수렴 중, 기존 화면은 그대로 유지 */}
    <Route path="/history/new" element={<HistoryLab />} />
    <Route path="/tv" element={<TV />} />
    <Route path="/education" element={<Education />} />
    <Route path="/mission" element={<Mission />} />
    <Route path="/ministry" element={<Ministry />} />
    <Route path="/news" element={<News />} />
    <Route path="/participate" element={<Participate />} />
    <Route path="/online" element={<Online />} />
    <Route path="/culture" element={<Culture />} />
    <Route path="/survey" element={<SurveyList />} />
    <Route path="/survey/:id" element={<SurveyDetail />} />
    <Route path="/seats" element={<SeatEventList />} />
    <Route path="/seats/:id" element={<SeatEventDetail />} />
    <Route path="/elections" element={<ElectionList />} />
    <Route path="/elections/:id" element={<ElectionDetail />} />
    <Route path="/worship" element={<Worship />} />
    <Route path="/sermon" element={<Sermon />} />
    <Route path="/events" element={<EventCalendar />} />
    <Route path="/events/:id" element={<EventDetail />} />
  </>
)
