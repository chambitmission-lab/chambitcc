import { lazy } from 'react'
import { Route } from 'react-router-dom'

// 목회자 영역 /pastor — 브리핑·돌봄·명부·심방·일정·설교 준비·리포트·비서

const PastorHome = lazy(() => import('../pages/Pastor/PastorHome'))
// 돌봄 레이더는 관리자 화면(/admin/care)과 같은 모듈 — scope 만 다르다
const CareRadar = lazy(() => import('../pages/Admin/CareRadar'))
const PastorMembers = lazy(() => import('../pages/Pastor/PastorMembers'))
const PastorMemberDetail = lazy(() => import('../pages/Pastor/PastorMemberDetail'))
const PastorVisits = lazy(() => import('../pages/Pastor/PastorVisits'))
const PastorAssistant = lazy(() => import('../pages/Pastor/PastorAssistant'))
const PastorReport = lazy(() => import('../pages/Pastor/PastorReport'))
const PastorSchedule = lazy(() => import('../pages/Pastor/PastorSchedule'))
const PastorSermon = lazy(() => import('../pages/Pastor/PastorSermon'))
const PastorSermonNotes = lazy(() => import('../pages/Pastor/PastorSermonNotes'))
const PastorSermonOutlines = lazy(() => import('../pages/Pastor/PastorSermonOutlines'))
const PastorSermonOutline = lazy(() => import('../pages/Pastor/PastorSermonOutline'))

export const pastorRoutes = (
  <>
    <Route path="/pastor" element={<PastorHome />} />
    <Route path="/pastor/care" element={<CareRadar scope="pastor" />} />
    <Route path="/pastor/members" element={<PastorMembers />} />
    <Route path="/pastor/members/:id" element={<PastorMemberDetail />} />
    <Route path="/pastor/visits" element={<PastorVisits />} />
    <Route path="/pastor/assistant" element={<PastorAssistant />} />
    <Route path="/pastor/report" element={<PastorReport />} />
    <Route path="/pastor/schedule" element={<PastorSchedule />} />
    <Route path="/pastor/sermon" element={<PastorSermon />} />
    <Route path="/pastor/sermon/notes" element={<PastorSermonNotes />} />
    <Route path="/pastor/sermon/outlines" element={<PastorSermonOutlines />} />
    <Route path="/pastor/sermon/outlines/:id" element={<PastorSermonOutline />} />
  </>
)
