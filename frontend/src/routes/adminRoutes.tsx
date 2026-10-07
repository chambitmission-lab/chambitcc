import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { CareRadar } from './sharedPages'

// 관리자 화면 /admin/*

const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'))
const NotificationManagement = lazy(() => import('../pages/Admin/NotificationManagement'))
const DailyVerseManagement = lazy(() => import('../pages/Admin/DailyVerseManagement'))
const BulletinManagement = lazy(() => import('../pages/Admin/BulletinManagement'))
const NewsManagement = lazy(() => import('../pages/Admin/NewsManagement'))
const NewFamilyManagement = lazy(() => import('../pages/Admin/NewFamilyManagement'))
const EventAlbumManagement = lazy(() => import('../pages/Admin/EventAlbumManagement'))
const PushNotificationManagement = lazy(() =>
  import('../pages/Admin/PushNotificationManagement').then((m) => ({
    default: m.PushNotificationManagement,
  })),
)
const EventManagement = lazy(() => import('../pages/Admin/EventManagement'))
const UserManagement = lazy(() => import('../pages/Admin/UserManagement'))
const GroupManagement = lazy(() => import('../pages/Admin/GroupManagement'))
const BiblePlanManagement = lazy(() => import('../pages/Admin/BiblePlanManagement'))
const BibleCommentaryManagement = lazy(() => import('../pages/Admin/BibleCommentaryManagement'))
const SituationManagement = lazy(() => import('../pages/Admin/SituationManagement'))
const ChatbotManagement = lazy(() => import('../pages/Admin/ChatbotManagement'))
const CultureManagement = lazy(() => import('../pages/Admin/CultureManagement'))
const SurveyManagement = lazy(() => import('../pages/Admin/SurveyManagement'))
const SeatEventManagement = lazy(() => import('../pages/Admin/SeatEventManagement'))
const ElectionManagement = lazy(() => import('../pages/Admin/ElectionManagement'))
const IntercessionManagement = lazy(() => import('../pages/Admin/IntercessionManagement'))
const OrganizationManagement = lazy(() => import('../pages/Admin/OrganizationManagement'))
const PastorManagement = lazy(() => import('../pages/Admin/PastorManagement'))
const PeopleManagement = lazy(() => import('../pages/Admin/PeopleManagement'))
const EducationManagement = lazy(() => import('../pages/Admin/EducationManagement'))
const OfferingManagement = lazy(() => import('../pages/Admin/OfferingManagement'))
const BibleEngagementManagement = lazy(() => import('../pages/Admin/BibleEngagementManagement'))
const WeeklyPrayerManagement = lazy(() => import('../pages/Admin/WeeklyPrayerManagement'))

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
