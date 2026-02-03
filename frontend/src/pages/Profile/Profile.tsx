import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [activeTab, setActiveTab] = useState<ProfileTab>('prayers')
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
      <div className="profile-loading">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="profile-error">
        <p>프로필을 불러올 수 없습니다</p>
        <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
      </div>
    )
  }

  const { stats, my_prayers, praying_for, my_replies } = data

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* 헤더 */}
        <div className="profile-top">
          <button className="back-button" onClick={() => navigate('/')}>
            ← 뒤로
          </button>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
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
        <div className="content-area">
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
