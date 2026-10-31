import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { CareRadar } from './sharedPages'
import { adminRouteLoaders } from '../utils/routePreload'

// 관리자 화면 /admin/* — lazy 는 utils/routePreload 의 adminRouteLoaders 와 같은 함수(관리 메뉴 호버 프리로드 공유)

const AdminDashboard = lazy(adminRouteLoaders['/admin'])
const NotificationManagement = lazy(adminRouteLoaders['/admin/notifications'])
const DailyVerseManagement = lazy(adminRouteLoaders['/admin/daily-verse'])
const BulletinManagement = lazy(adminRouteLoaders['/admin/bulletins'])
const NewsManagement = lazy(adminRouteLoaders['/admin/news'])
const NewFamilyManagement = lazy(adminRouteLoaders['/admin/new-family'])
const EventAlbumManagement = lazy(adminRouteLoaders['/admin/event-albums'])
const PushNotificationManagement = lazy(adminRouteLoaders['/admin/push'])
const EventManagement = lazy(adminRouteLoaders['/admin/events'])
const UserManagement = lazy(adminRouteLoaders['/admin/users'])
const GroupManagement = lazy(adminRouteLoaders['/admin/groups'])
const BiblePlanManagement = lazy(adminRouteLoaders['/admin/bible-plans'])
const BibleCommentaryManagement = lazy(adminRouteLoaders['/admin/bible-commentaries'])
const SituationManagement = lazy(adminRouteLoaders['/admin/situations'])
const ChatbotManagement = lazy(adminRouteLoaders['/admin/chatbot'])
const CultureManagement = lazy(adminRouteLoaders['/admin/culture'])
const SurveyManagement = lazy(adminRouteLoaders['/admin/surveys'])
const HandwritingContestManagement = lazy(adminRouteLoaders['/admin/handwriting'])
const SeatEventManagement = lazy(adminRouteLoaders['/admin/seats'])
const ElectionManagement = lazy(adminRouteLoaders['/admin/elections'])
const IntercessionManagement = lazy(adminRouteLoaders['/admin/intercession'])
const OrganizationManagement = lazy(adminRouteLoaders['/admin/organization'])
const PastorManagement = lazy(adminRouteLoaders['/admin/pastors'])
const PeopleManagement = lazy(adminRouteLoaders['/admin/people'])
const EducationManagement = lazy(adminRouteLoaders['/admin/education'])
const OfferingManagement = lazy(adminRouteLoaders['/admin/offering'])
const BibleEngagementManagement = lazy(adminRouteLoaders['/admin/bible-engagement'])
const WeeklyPrayerManagement = lazy(adminRouteLoaders['/admin/weekly-prayers'])

export const adminRoutes = (
  <>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/care" element={<CareRadar />} />
    <Route path="/admin/notifications" element={<NotificationManagement />} />
    <Route path="/admin/daily-verse" element={<DailyVerseManagement />} />
    <Route path="/admin/bulletins" element={<BulletinManagement />} />
    <Route path="/admin/news" element={<NewsManagement />} />
    <Route path="/admin/new-family" element={<NewFamilyManagement />} />
    <Route path="/admin/event-albums" element={<EventAlbumManagement />} />
    <Route path="/admin/push" element={<PushNotificationManagement />} />
    <Route path="/admin/events" element={<EventManagement />} />
    <Route path="/admin/users" element={<UserManagement />} />
    <Route path="/admin/groups" element={<GroupManagement />} />
    <Route path="/admin/bible-plans" element={<BiblePlanManagement />} />
    <Route path="/admin/bible-commentaries" element={<BibleCommentaryManagement />} />
    <Route path="/admin/situations" element={<SituationManagement />} />
    <Route path="/admin/chatbot" element={<ChatbotManagement />} />
    <Route path="/admin/culture" element={<CultureManagement />} />
    <Route path="/admin/surveys" element={<SurveyManagement />} />
    <Route path="/admin/handwriting" element={<HandwritingContestManagement />} />
    <Route path="/admin/seats" element={<SeatEventManagement />} />
    <Route path="/admin/elections" element={<ElectionManagement />} />
    <Route path="/admin/intercession" element={<IntercessionManagement />} />
    <Route path="/admin/organization" element={<OrganizationManagement />} />
    <Route path="/admin/pastors" element={<PastorManagement />} />
    <Route path="/admin/people" element={<PeopleManagement />} />
    <Route path="/admin/education" element={<EducationManagement />} />
    <Route path="/admin/offering" element={<OfferingManagement />} />
    <Route path="/admin/bible-engagement" element={<BibleEngagementManagement />} />
    <Route path="/admin/weekly-prayers" element={<WeeklyPrayerManagement />} />
  </>
)
