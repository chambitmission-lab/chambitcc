import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useProfileDetail, clearProfileCache } from '../../hooks/useProfile'
import { logout } from '../../utils/auth'
import { PushNotificationButton } from '../../components/common/PushNotificationButton'
import ProfileHeader from './components/ProfileHeader'
import ActivityStats from './components/ActivityStats'
import LevelProgress from './components/LevelProgress'
import AchievementBadges from './components/AchievementBadges'
import AchievementModal from './components/AchievementModal'
import ContentTabs from './components/ContentTabs'
import MyPrayersList from './components/MyPrayersList'
import PrayingForList from './components/PrayingForList'
import MyRepliesList from './components/MyRepliesList'
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
  
  const { data, isLoading, error } = useProfileDetail()
  
  // 활동 데이터를 기반으로 업적 계산
  const activityData = useMemo<UserActivityData | null>(() => {
    if (!data) return null
    
    return {
      totalPrayerTime: data.stats.activity.total_prayer_time || data.stats.activity.total_count * 5, // API 데이터 또는 추정값
      totalPrayerCount: data.stats.activity.total_count,
      streakDays: data.stats.activity.streak_days,
      bibleChaptersRead: data.stats.bible_reading?.chapters_read || 0,
      bibleBooksCompleted: data.stats.bible_reading?.books_completed || [],
      repliesCount: data.stats.content.my_replies,
      prayingForCount: data.stats.content.praying_for,
    }
  }, [data])
  
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
  useEffect(() => {
    if (achievements.length > 0) {
      const newlyUnlocked = getNewlyUnlockedAchievements(achievements)
      if (newlyUnlocked.length > 0) {
        setSelectedAchievement(newlyUnlocked[0])
      }
    }
  }, [achievements])

  const handleLogout = () => {
    logout() // 통합된 로그아웃 함수 사용
    clearProfileCache() // 프로필 캐시 삭제
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark p-8 rounded-2xl">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark p-8 rounded-2xl text-center">
          <p className="text-red-500 mb-4">{t('profileCannotLoad')}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-all"
          >
            {t('profileBackHome')}
          </button>
        </div>
      </div>
    )
  }

  const { stats, my_prayers, praying_for, my_replies } = data

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl min-h-screen border-x border-border-light dark:border-border-dark">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
          <button 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            onClick={() => navigate('/')}
          >
            <span className="material-icons-outlined">arrow_back</span>
            <span className="text-sm font-semibold">{t('profileBack')}</span>
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">{t('profileTitle')}</h1>
          <button 
            className="flex items-center gap-1 text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 transition-all"
            onClick={handleLogout}
          >
            <span className="material-icons-outlined text-lg bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">logout</span>
            <span>{t('logout')}</span>
          </button>
        </div>

        {/* 프로필 정보 */}
        <ProfileHeader
          username={stats.username}
          fullName={stats.full_name}
          glowLevel={glowLevel}
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

        {/* 푸시 알림 설정 */}
        <div className="px-4 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                푸시 알림
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                새로운 소식을 실시간으로 받아보세요
              </p>
            </div>
            <PushNotificationButton />
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
