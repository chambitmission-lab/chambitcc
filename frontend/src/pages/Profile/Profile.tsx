import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useProfileDetail } from '../../hooks/useProfile'
import { useBluemarbleStats } from '../../hooks/useBluemarble'
import { logout } from '../../utils/auth'
import { PushNotificationButton } from '../../components/common/PushNotificationButton'
import ProfileHeader from './components/ProfileHeader'
import ActivityStats from './components/ActivityStats'
import WeeklyStoryHook from './components/WeeklyStoryHook'
import GrowthHook from './components/GrowthHook'
import LevelProgress from './components/LevelProgress'
import AchievementBadges from './components/AchievementBadges'
import AchievementModal from './components/AchievementModal'
import ContentTabs from './components/ContentTabs'
import MyPrayersList from './components/MyPrayersList'
import PrayingForList from './components/PrayingForList'
import MyRepliesList from './components/MyRepliesList'
import MyBookmarksList from './components/MyBookmarksList'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import type { ProfileTab } from '../../types/profile'
import type { Achievement, UserActivityData } from '../../types/achievement'
import { 
  calculateActivityPoints, 
  calculateGlowLevel, 
  getPointsToNextLevel,
  calculateAchievements,
  getNewlyUnlockedAchievements 
} from '../../utils/achievementCalculator'
import './styles/Profile.css'

const Profile = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<ProfileTab>('prayers')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  
  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [navigate])
  
  const hasToken = !!localStorage.getItem('access_token')
  const { data, isLoading, error } = useProfileDetail()
  // 블루마블 통계도 포인트(=양 단계/레벨)에 기여하므로, 도착 전 렌더하면
  // bluemarble=0 으로 낮게 계산된 양이 먼저 떴다가 점프하는 플래시가 생긴다.
  const { data: bmStats, isLoading: bmLoading } = useBluemarbleStats(hasToken)

  // 활동 데이터를 기반으로 업적 계산
  const activityData = useMemo<UserActivityData | null>(() => {
    if (!data) return null

    return {
      totalPrayerTime: data.stats.activity.total_prayer_time || data.stats.activity.total_count * 5, // API 데이터 또는 추정값
      totalPrayerCount: data.stats.activity.total_count,
      streakDays: data.stats.activity.streak_days,
      bibleVersesRead: data.stats.bible_reading?.verses_read || 0,
      bibleChaptersRead: data.stats.bible_reading?.chapters_read || 0,
      bibleBooksCompleted: data.stats.bible_reading?.books_completed || [],
      repliesCount: data.stats.content.my_replies,
      prayingForCount: data.stats.content.praying_for,
      bookmarksCount: data.stats.bible_reading?.bookmarks_count || 0,
      notesCount: data.stats.bible_reading?.notes_count || 0,
      favoritesCount: data.stats.bible_reading?.favorites_count || 0,
      bluemarbleBestScore: bmStats?.best_score ?? 0,
      bluemarbleCorrectTotal: bmStats?.total_correct ?? 0,
      bluemarbleLapsTotal: 0, // 누적 바퀴는 stats에 추가하지 않음. 완주 횟수로 대체 가능
      bluemarbleClearCount: bmStats?.completed_games ?? 0,
    }
  }, [data, bmStats])
  
  // 포인트 및 레벨 계산
  const activityPoints = useMemo(() => {
    if (!activityData) return 0
    return calculateActivityPoints(activityData)
  }, [activityData])
  
  const glowLevel = useMemo(() => {
    return calculateGlowLevel(activityPoints)
  }, [activityPoints])
  
  const pointsToNext = useMemo(() => {
    return getPointsToNextLevel(activityPoints)
  }, [activityPoints])
  
  // 업적 계산
  const achievements = useMemo(() => {
    if (!activityData) return []
    return calculateAchievements(activityData)
  }, [activityData])
  
  // 새로 해금된 업적 확인
  // 주의: activityData는 프로필(data) + 블루마블(bmStats) 두 쿼리로 단계적으로 만들어진다.
  // 둘 중 하나만 도착한 상태에서 감지가 돌면, 아직 안 온 데이터 기준 업적이 빠진 채로
  // localStorage('unlocked_achievements')를 덮어쓴 뒤 → 나머지 데이터 도착 시 "새 해금"으로
  // 오판되어 매 방문마다 모달이 뜬다. 따라서 데이터가 완전히 로드된 뒤에만 감지한다.
  useEffect(() => {
    if (isLoading || (hasToken && bmLoading)) return
    if (achievements.length > 0) {
      const newlyUnlocked = getNewlyUnlockedAchievements(achievements)
      if (newlyUnlocked.length > 0) {
        setSelectedAchievement(newlyUnlocked[0])
      }
    }
  }, [achievements, isLoading, bmLoading, hasToken])

  const handleLogout = async () => {
    await logout() // 푸시 구독 해제 + 토큰 제거 + React Query 캐시 정리
    navigate('/auth/login')
  }

  const handlePrayerClick = (prayerId: number) => {
    navigate('/', { state: { openPrayerId: prayerId } })
  }
  
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement)
  }
  
  const handleCloseAchievementModal = () => {
    setSelectedAchievement(null)
  }

  if (isLoading || (hasToken && bmLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex items-center justify-center">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark p-8 rounded-2xl">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark p-8 rounded-2xl text-center">
          <p className="text-red-500 mb-4">{t('profileCannotLoad')}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 brand-gradient font-bold rounded-full shadow-[0_2px_10px_var(--brand-glow)] hover:scale-105 transition-all"
          >
            {t('profileBackHome')}
          </button>
        </div>
      </div>
    )
  }

  const { stats, my_prayers, praying_for, my_replies } = data

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl min-h-screen border-x border-border-light dark:border-border-dark">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            onClick={() => navigate('/')}
          >
            <span className="material-icons-outlined">arrow_back</span>
            <span className="text-sm font-semibold">{t('profileBack')}</span>
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-[-0.015em]">{t('profileTitle')}</h1>
          <button
            className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dim transition-colors"
            onClick={handleLogout}
          >
            <span className="material-icons-outlined text-lg">logout</span>
            <span>{t('logout')}</span>
          </button>
        </div>

        {/* 프로필 정보 */}
        <ProfileHeader
          username={stats.username}
          fullName={stats.full_name}
          avatarUrl={stats.avatar_url ?? null}
          glowLevel={glowLevel}
          activityPoints={activityPoints}
          thisWeekCount={stats.activity.this_week_count}
          totalCount={stats.activity.total_count}
          streakDays={stats.activity.streak_days}
          pointsToNext={pointsToNext}
          achievements={achievements}
        />

        {/* 레벨 진행도 */}
        <LevelProgress
          currentLevel={glowLevel}
          currentPoints={activityPoints}
          pointsToNext={pointsToNext}
        />

        {/* 업적 뱃지 */}
        <AchievementBadges
          achievements={achievements}
          onAchievementClick={handleAchievementClick}
        />

        {/* 활동 통계 */}
        <ActivityStats
          thisWeekCount={stats.activity.this_week_count}
          totalCount={stats.activity.total_count}
          streakDays={stats.activity.streak_days}
        />

        {/* 신앙 여정(전체) 진입 */}
        <GrowthHook />

        {/* 주간 기도 스토리 진입 */}
        <WeeklyStoryHook thisWeekCount={stats.activity.this_week_count} />

        {/* 푸시 알림 설정 */}
        <div className="px-4 py-3">
          <div
            className="
              relative overflow-hidden rounded-2xl p-4
              bg-white/80 dark:bg-card-dark
              border border-gray-200/70 dark:border-white/[0.08]
              shadow-sm
              dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]
            "
          >
            <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-0.5 tracking-[-0.01em]">
                  푸시 알림
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-white/55">
                  새로운 소식을 실시간으로 받아보세요
                </p>
              </div>
              <PushNotificationButton />
            </div>
          </div>
        </div>

        {/* 콘텐츠 탭 */}
        <ContentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            prayers: stats.content.my_prayers,
            praying: stats.content.praying_for,
            replies: stats.content.my_replies,
            notes: stats.bible_reading?.bookmarks_count || 0,
          }}
        />

        {/* 콘텐츠 영역 */}
        <div className="px-4 py-4">
          {activeTab === 'prayers' && (
            <MyPrayersList
              prayers={my_prayers}
              onPrayerClick={handlePrayerClick}
            />
          )}
          {activeTab === 'praying' && (
            <PrayingForList
              prayers={praying_for}
              onPrayerClick={handlePrayerClick}
            />
          )}
          {activeTab === 'replies' && (
            <MyRepliesList
              replies={my_replies}
              onReplyClick={handlePrayerClick}
            />
          )}
          {activeTab === 'notes' && <MyBookmarksList />}
        </div>
        
        {/* 업적 모달 */}
        <AchievementModal
          achievement={selectedAchievement}
          onClose={handleCloseAchievementModal}
        />
      </div>
    </div>
  )
}

export default Profile
