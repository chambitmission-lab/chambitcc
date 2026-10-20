import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { CareRadar } from './sharedPages'

// 목회자 영역 /pastor — 브리핑·돌봄·명부·심방·일정·설교 준비·리포트·비서

const PastorHome = lazy(() => import('../pages/Pastor/PastorHome'))
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
const PastorSermonStudy = lazy(() => import('../pages/Pastor/PastorSermonStudy'))
const PastorPulpit = lazy(() => import('../pages/Pastor/PastorPulpit'))
// 설교 준비실 — 담임목사 전용(서버가 직분으로 판단)
const PastorStudio = lazy(() => import('../pages/Pastor/PastorStudio'))
const PastorStudioRoom = lazy(() => import('../pages/Pastor/PastorStudioRoom'))

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
    <Route path="/pastor/sermon/study" element={<PastorSermonStudy />} />
    <Route path="/pastor/sermon/notes" element={<PastorSermonNotes />} />
    <Route path="/pastor/sermon/outlines" element={<PastorSermonOutlines />} />
    <Route path="/pastor/sermon/outlines/:id" element={<PastorSermonOutline />} />
    <Route path="/pastor/sermon/outlines/:id/pulpit" element={<PastorPulpit />} />
    <Route path="/pastor/studio" element={<PastorStudio />} />
    <Route path="/pastor/studio/:id" element={<PastorStudioRoom />} />
  </>
)
