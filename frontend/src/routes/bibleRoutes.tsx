import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { menuRouteLoaders } from '../utils/routePreload'

// /bible 섹션 — 읽기·플랜·단어장·지도·스토리·필사·말씀 카드·묵상·알람

const BibleStudy = lazy(menuRouteLoaders['/bible'])
const Genealogy = lazy(() => import('../pages/Bible/Genealogy/Genealogy'))
const PlanList = lazy(() => import('../pages/Bible/Plans/PlanList'))
const PlanDetail = lazy(() => import('../pages/Bible/Plans/PlanDetail'))
const JoinPlan = lazy(() => import('../pages/Bible/Plans/JoinPlan'))
const BibleWordbook = lazy(() => import('../pages/Bible/Wordbook/WordbookPage'))
const BibleAtlas = lazy(() => import('../pages/Bible/Atlas/AtlasMap'))
const SituationBible = lazy(menuRouteLoaders['/bible/situation'])
const BibleStoryMap = lazy(() => import('../pages/Bible/Story/StoryMap'))
const BibleStoryEpisode = lazy(() => import('../pages/Bible/Story/StoryEpisode'))
const BibleTypingHome = lazy(menuRouteLoaders['/bible/typing'])
const BibleTypingSprint = lazy(() => import('../pages/Bible/Typing/TypingSprint'))
const BibleTypingSession = lazy(() => import('../pages/Bible/Typing/TypingSession'))
const PhotoVerse = lazy(() => import('../pages/Bible/PhotoVerse/PhotoVerse'))
const MeditationPage = lazy(() => import('../pages/Bible/Meditation/MeditationPage'))
const VerseAlarmPage = lazy(() => import('../pages/Bible/VerseAlarm/VerseAlarmPage'))

export const bibleRoutes = (
  <>
    <Route path="/bible" element={<BibleStudy />} />
    <Route path="/bible/genealogy" element={<Genealogy />} />
    <Route path="/bible/plans" element={<PlanList />} />
    {/* 정적 경로를 :planId 보다 먼저 — 나만의 플랜 초대 링크 랜딩 */}
    <Route path="/bible/plans/join/:code" element={<JoinPlan />} />
    <Route path="/bible/plans/:planId" element={<PlanDetail />} />
    <Route path="/bible/wordbook" element={<BibleWordbook />} />
    <Route path="/bible/situation" element={<SituationBible />} />
    <Route path="/bible/story" element={<BibleStoryMap />} />
    <Route path="/bible/atlas" element={<BibleAtlas />} />
    <Route path="/bible/story/:episodeId" element={<BibleStoryEpisode />} />
    <Route path="/bible/photo-verse" element={<PhotoVerse />} />
    <Route path="/bible/meditation" element={<MeditationPage />} />
    <Route path="/bible/alarm" element={<VerseAlarmPage />} />
    <Route path="/bible/typing" element={<BibleTypingHome />} />
    <Route path="/bible/typing/sprint" element={<BibleTypingSprint />} />
    <Route path="/bible/typing/:book/:chapter" element={<BibleTypingSession />} />
    <Route path="/bible/:bookNumber/:chapter" element={<BibleStudy />} />
  </>
)
