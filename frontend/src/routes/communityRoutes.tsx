import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { menuRouteLoaders } from '../utils/routePreload'

// 나의 신앙·공동체 — 기도·감사·그룹·반·묵상방·타임캡슐·게임/회상 화면

const PrayerFocus = lazy(menuRouteLoaders['/prayer-focus'])
const WeeklyPrayerTopics = lazy(() => import('../pages/Prayer/WeeklyPrayerTopics'))
const WeeklyPrayerScreen = lazy(() => import('../pages/Prayer/WeeklyPrayerScreen'))
const AnsweredPrayers = lazy(menuRouteLoaders['/answered-prayers'])
const Intercession = lazy(menuRouteLoaders['/intercession'])
const Thanks = lazy(() => import('../pages/Thanks/Thanks'))
const MyGroups = lazy(menuRouteLoaders['/groups'])
const GroupDetail = lazy(() => import('../pages/Groups/GroupDetail'))
const JoinGroup = lazy(() => import('../pages/Groups/JoinGroup'))
const ClassList = lazy(menuRouteLoaders['/classes'])
const ClassHome = lazy(() => import('../pages/ClassRoom/ClassHome'))
const JoinClass = lazy(() => import('../pages/ClassRoom/JoinClass'))
const ClassReport = lazy(() => import('../pages/ClassRoom/ClassReport'))
const ClassAttendance = lazy(() => import('../pages/ClassRoom/ClassAttendance'))
const ClassAlbum = lazy(() => import('../pages/ClassRoom/ClassAlbum'))
const RoomList = lazy(() => import('../pages/Rooms/RoomList'))
const RoomHome = lazy(() => import('../pages/Rooms/RoomHome'))
const JoinRoom = lazy(() => import('../pages/Rooms/JoinRoom'))
const CapsuleList = lazy(() => import('../pages/Capsule/CapsuleList'))
const CapsuleCreate = lazy(() => import('../pages/Capsule/CapsuleCreate'))
const CapsuleOpen = lazy(() => import('../pages/Capsule/CapsuleOpen'))
const CapsuleInvite = lazy(() => import('../pages/Capsule/CapsuleInvite'))
const Garden = lazy(menuRouteLoaders['/garden'])
const Bluemarble = lazy(menuRouteLoaders['/bluemarble'])
const RabbitGallery = lazy(() => import('../pages/Bluemarble/RabbitGallery'))
const WeeklyStory = lazy(() => import('../pages/WeeklyStory/WeeklyStory'))
const Growth = lazy(() => import('../pages/Growth/Growth'))

export const communityRoutes = (
  <>
    <Route path="/prayer-focus" element={<PrayerFocus />} />
    <Route path="/prayer-topics" element={<WeeklyPrayerTopics />} />
    <Route path="/prayer-topics/screen" element={<WeeklyPrayerScreen />} />
    <Route path="/answered-prayers" element={<AnsweredPrayers />} />
    <Route path="/intercession" element={<Intercession />} />
    <Route path="/thanks" element={<Thanks />} />
    <Route path="/groups" element={<MyGroups />} />
    <Route path="/groups/join/:code" element={<JoinGroup />} />
    <Route path="/groups/:id" element={<GroupDetail />} />
    <Route path="/classes" element={<ClassList />} />
    <Route path="/classes/join/:code" element={<JoinClass />} />
    <Route path="/classes/:classId" element={<ClassHome />} />
    <Route path="/classes/:classId/report" element={<ClassReport />} />
    <Route path="/classes/:classId/attendance" element={<ClassAttendance />} />
    <Route path="/classes/:classId/album" element={<ClassAlbum />} />
    <Route path="/rooms" element={<RoomList />} />
    <Route path="/rooms/:roomId" element={<RoomHome />} />
    <Route path="/join/:code" element={<JoinRoom />} />
    <Route path="/capsule" element={<CapsuleList />} />
    <Route path="/capsule/new" element={<CapsuleCreate />} />
    <Route path="/capsule/invite/:code" element={<CapsuleInvite />} />
    <Route path="/capsule/:id" element={<CapsuleOpen />} />
    <Route path="/garden" element={<Garden />} />
    <Route path="/bluemarble" element={<Bluemarble />} />
    <Route path="/bluemarble/rabbit" element={<RabbitGallery />} />
    <Route path="/weekly-story" element={<WeeklyStory />} />
    <Route path="/growth" element={<Growth />} />
  </>
)
