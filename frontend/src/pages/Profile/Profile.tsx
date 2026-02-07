import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useProfileDetail, clearProfileCache } from '../../hooks/useProfile'
import ProfileHeader from './components/ProfileHeader'
import ActivityStats from './components/ActivityStats'
import ContentTabs from './components/ContentTabs'
import MyPrayersList from './components/MyPrayersList'
import PrayingForList from './components/PrayingForList'
import MyRepliesList from './components/MyRepliesList'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import type { ProfileTab } from '../../types/profile'
import './styles/Profile.css'

const Profile = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<ProfileTab>('prayers')
  
  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [navigate])
  
  const { data, isLoading, error } = useProfileDetail()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    clearProfileCache() // 프로필 캐시 삭제
    navigate('/auth/login')
  }

  const handlePrayerClick = (prayerId: number) => {
    navigate('/', { state: { openPrayerId: prayerId } })
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
        />

        {/* 활동 통계 */}
        <ActivityStats
          thisWeekCount={stats.activity.this_week_count}
          totalCount={stats.activity.total_count}
          streakDays={stats.activity.streak_days}
        />

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
      </div>
    </div>
  )
}

export default Profile
