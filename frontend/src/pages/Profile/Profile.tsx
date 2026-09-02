import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useProfileDetail, useMyPrayers, usePrayingFor, useMyReplies } from '../../hooks/useProfile'
import { useBluemarbleStats } from '../../hooks/useBluemarble'
import { logout } from '../../utils/auth'
import { PushNotificationButton } from '../../components/common/PushNotificationButton'
import ProfileHeader from './components/ProfileHeader'
import FaithInsightCard from './components/FaithInsightCard'
import WeeklyStoryHook from './components/WeeklyStoryHook'
import GrowthHook from './components/GrowthHook'
import LevelProgress from './components/LevelProgress'
import LevelUpMoment from './components/LevelUpMoment'
import AchievementBadges from './components/AchievementBadges'
import AchievementModal from './components/AchievementModal'
import ContentTabs from './components/ContentTabs'
import MyPrayersList from './components/MyPrayersList'
import PrayingForList from './components/PrayingForList'
import MyRepliesList from './components/MyRepliesList'
import MyBookmarksList from './components/MyBookmarksList'
import LoadMoreSentinel from './components/LoadMoreSentinel'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import type { ProfileTab } from '../../types/profile'
import type { Achievement, GlowLevel, UserActivityData } from '../../types/achievement'
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
  const [celebrateUnlock, setCelebrateUnlock] = useState(false)
  const [levelUp, setLevelUp] = useState<GlowLevel | null>(null)
  
  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [navigate])
  
  const hasToken = !!localStorage.getItem('access_token')
  const { data, isLoading, error } = useProfileDetail()

  // 탭 목록 무한 스크롤 — detail 응답은 미리보기(5/12/8개)일 뿐이므로,
  // 활성 탭에서만 페이지 단위(20개)로 이어서 불러온다
  const myPrayersQuery = useMyPrayers(hasToken && activeTab === 'prayers')
  const prayingForQuery = usePrayingFor(hasToken && activeTab === 'praying')
  const myRepliesQuery = useMyReplies(hasToken && activeTab === 'replies')
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
      bibleBookChapters: data.stats.bible_reading?.books_progress || {},
      // 포인트/업적은 누적(*_total/*_earned) 기준 — 삭제·취소해도 깎이지 않는다.
      // 구버전 백엔드(필드 없음)에서는 현재 개수로 폴백 (?? 라 0도 유효값)
      repliesCount: data.stats.content.my_replies_total ?? data.stats.content.my_replies,
      prayingForCount: data.stats.content.praying_for_total ?? data.stats.content.praying_for,
      bookmarksCount: data.stats.bible_reading?.bookmarks_earned ?? data.stats.bible_reading?.bookmarks_count ?? 0,
      notesCount: data.stats.bible_reading?.notes_earned ?? data.stats.bible_reading?.notes_count ?? 0,
      favoritesCount: data.stats.bible_reading?.favorites_earned ?? data.stats.bible_reading?.favorites_count ?? 0,
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
        setCelebrateUnlock(true)
        setSelectedAchievement(newlyUnlocked[0])
      }
    }
  }, [achievements, isLoading, bmLoading, hasToken])

  // 레벨업 감지 — 마지막으로 본 레벨을 localStorage 에 기억해 두고, 그보다
  // 오르면 축하 모먼트를 띄운다. 업적 감지와 같은 이유로 데이터가 전부
  // 도착한 뒤에만 판정한다(부분 데이터로 낮게 계산된 레벨을 기준으로 저장하면
  // 다음 방문마다 가짜 레벨업이 뜬다). 첫 방문(저장값 없음)은 기록만 한다.
  useEffect(() => {
    if (isLoading || (hasToken && bmLoading) || !data) return
    const KEY = 'glow_level_seen'
    const stored = localStorage.getItem(KEY)
    if (stored === null) {
      localStorage.setItem(KEY, String(glowLevel.level))
      return
    }
    const prev = Number(stored)
    if (glowLevel.level > prev) {
      setLevelUp(glowLevel)
    }
    if (glowLevel.level !== prev) {
      localStorage.setItem(KEY, String(glowLevel.level))
    }
  }, [isLoading, bmLoading, hasToken, data, glowLevel])

  const handleLogout = async () => {
    await logout() // 푸시 구독 해제 + 토큰 제거 + React Query 캐시 정리
    navigate('/auth/login')
  }

  const handlePrayerClick = (prayerId: number) => {
    navigate('/', { state: { openPrayerId: prayerId } })
  }
  
  const handleAchievementClick = (achievement: Achievement) => {
    setCelebrateUnlock(false) // 이미 해금된 배지를 다시 볼 때는 폭죽 없이
    setSelectedAchievement(achievement)
  }

  const handleCloseAchievementModal = () => {
    setSelectedAchievement(null)
  }

  if (isLoading || (hasToken && bmLoading)) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark flex items-center justify-center page-stage">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark p-8 rounded-2xl">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark flex items-center justify-center p-4 page-stage">
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
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문(정체성·온도·업적·콘텐츠) + 우측 레일(진입 카드·설정) 2단 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            onClick={() => navigate('/')}
          >
            <span className="material-icons-outlined">arrow_back</span>
            <span className="text-sm font-semibold">{t('profileBack')}</span>
          </button>
          <h1 className="text-base font-bold text-ink-strong tracking-[-0.015em]">{t('profileTitle')}</h1>
          <button
            className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dim transition-colors"
            onClick={handleLogout}
          >
            <span className="material-icons-outlined text-lg">logout</span>
            <span>{t('logout')}</span>
          </button>
        </div>

        {/* ① 아이덴티티 — 이름·칭호·단계, 조용하게 */}
        <ProfileHeader
          username={stats.username}
          fullName={stats.full_name}
          avatarUrl={stats.avatar_url ?? null}
          glowLevel={glowLevel}
        />

        {/* ② 신앙의 온도 — 레벨·포인트·활동 스탯을 한 카드로 */}
        <LevelProgress
          currentLevel={glowLevel}
          currentPoints={activityPoints}
          pointsToNext={pointsToNext}
          thisWeekCount={stats.activity.this_week_count}
          totalCount={stats.activity.total_count}
          streakDays={stats.activity.streak_days}
        />

        {/* ③④ 인사이트·여정·주간 스토리 — lg에선 우측 레일이 대신한다 */}
        <div className="lg:hidden">
          <FaithInsightCard />
          <GrowthHook />
          <WeeklyStoryHook thisWeekCount={stats.activity.this_week_count} />
        </div>

        {/* ⑤ 업적 — 대표 배지 행 + 펼쳐보기 */}
        <AchievementBadges
          achievements={achievements}
          onAchievementClick={handleAchievementClick}
        />

        {/* 푸시 알림 설정 — lg에선 우측 레일이 대신한다 */}
        <div className="px-4 py-3 lg:hidden">
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
                <h3 className="text-[14px] font-bold text-ink-strong mb-0.5 tracking-[-0.01em]">
                  {t('pushCardTitle')}
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-white/55">
                  {t('pushCardSubtitle')}
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

        {/* 콘텐츠 영역 — 첫 페이지 도착 전에는 detail의 미리보기 목록으로 채워
            탭 전환 시 빈 화면/스피너 플래시를 막는다 */}
        <div className="px-4 py-4">
          {activeTab === 'prayers' && (
            <>
              <MyPrayersList
                prayers={myPrayersQuery.data?.pages.flat() ?? my_prayers}
                onPrayerClick={handlePrayerClick}
              />
              <LoadMoreSentinel
                hasNextPage={myPrayersQuery.hasNextPage}
                isFetchingNextPage={myPrayersQuery.isFetchingNextPage}
                fetchNextPage={myPrayersQuery.fetchNextPage}
              />
            </>
          )}
          {activeTab === 'praying' && (
            <>
              <PrayingForList
                prayers={prayingForQuery.data?.pages.flat() ?? praying_for}
                onPrayerClick={handlePrayerClick}
              />
              <LoadMoreSentinel
                hasNextPage={prayingForQuery.hasNextPage}
                isFetchingNextPage={prayingForQuery.isFetchingNextPage}
                fetchNextPage={prayingForQuery.fetchNextPage}
              />
            </>
          )}
          {activeTab === 'replies' && (
            <>
              <MyRepliesList
                replies={myRepliesQuery.data?.pages.flat() ?? my_replies}
                onReplyClick={handlePrayerClick}
              />
              <LoadMoreSentinel
                hasNextPage={myRepliesQuery.hasNextPage}
                isFetchingNextPage={myRepliesQuery.isFetchingNextPage}
                fetchNextPage={myRepliesQuery.fetchNextPage}
              />
            </>
          )}
          {activeTab === 'notes' && <MyBookmarksList />}
        </div>
        
        {/* 레벨업 축하 모먼트 */}
        {levelUp && (
          <LevelUpMoment level={levelUp} onClose={() => setLevelUp(null)} />
        )}

        {/* 업적 모달 */}
        <AchievementModal
          achievement={selectedAchievement}
          achievements={achievements}
          celebrate={celebrateUnlock}
          onSelect={handleAchievementClick}
          onClose={handleCloseAchievementModal}
        />
      </div>

      {/* 우측 위젯 레일 (lg+) — 정체성·콘텐츠는 본문에 두고, 진입 카드와 설정을 옆에 고정.
          레일이 화면보다 길어질 수 있어 홈 사이드바와 같은 자체 스크롤을 준다 */}
      <aside className="hidden lg:block lg:w-[312px] lg:shrink-0 lg:sticky lg:top-[4.5rem] lg:self-start lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto scrollbar-hide">
        {/* 카드들은 자체 px-4 여백을 갖고 있어 레일 안에서도 같은 거터를 그대로 쓴다
            (음수 마진으로 상쇄하면 overflow-y-auto 컨테이너에 가로 스크롤이 생긴다) */}
        <div>
          <FaithInsightCard />
          <GrowthHook />
          <WeeklyStoryHook thisWeekCount={stats.activity.this_week_count} />

          <div className="px-4 py-3">
            <div className="relative overflow-hidden rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]">
              <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-[14px] font-bold text-ink-strong mb-0.5 tracking-[-0.01em]">
                  {t('pushCardTitle')}
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-white/55 mb-3">
                  {t('pushCardSubtitle')}
                </p>
                <PushNotificationButton />
              </div>
            </div>
          </div>
        </div>
      </aside>
      </div>
    </div>
  )
}

export default Profile
