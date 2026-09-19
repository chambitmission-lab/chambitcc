// 프로필 본문 도착 전 자리표시자.
//
// 실제 섹션과 "같은 카드 틀(여백·반경·테두리)·같은 순서·거의 같은 높이"로 그린다 — 뼈대만
// 대충 늘어놓으면 데이터가 오는 순간 카드가 커지며 자리를 바꿔 화면이 자라나는 것처럼 보인다.
// 각 블록 옆 주석의 실제 컴포넌트 마크업이 바뀌면 여기 치수도 같이 맞춘다.

const BONE = 'bg-gray-200/80 dark:bg-white/[0.08]'
// 실제 카드들과 같은 틀 (LevelProgress·FaithInsightCard·AchievementBadges 공통)
const CARD =
  'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm'

const Bone = ({ className }: { className: string }) => <div className={`${BONE} ${className}`} />

// FaithInsightCard / GrowthHook / WeeklyStoryHook — 라벨 + 헤드라인 + 한 줄(칩·스트릭·요일 트레이)
const HookCards = () => (
  <>
    <div className="px-4 py-3">
      <div className={`${CARD} px-5 py-4`}>
        <Bone className="h-[11px] w-16 rounded-full mb-2.5" />
        <Bone className="h-[18px] w-3/4 rounded-full" />
        <div className="mt-3.5 flex gap-1.5">
          <Bone className="h-[26px] w-[72px] rounded-full" />
          <Bone className="h-[26px] w-[72px] rounded-full" />
          <Bone className="h-[26px] w-[72px] rounded-full" />
        </div>
      </div>
    </div>
    <div className="px-4 py-3">
      <div className={`${CARD} px-5 py-4`}>
        <Bone className="h-[11px] w-16 rounded-full mb-2.5" />
        <Bone className="h-[18px] w-2/3 rounded-full" />
        <Bone className="mt-2.5 h-[12px] w-1/2 rounded-full" />
        <div className="mt-3.5 flex gap-1">
          {Array.from({ length: 14 }, (_, i) => (
            <Bone key={i} className="h-[14px] flex-1 rounded-[4px]" />
          ))}
        </div>
      </div>
    </div>
    <div className="px-4 py-3">
      <div className={`${CARD} px-5 py-4`}>
        <Bone className="h-[16px] w-24 rounded-full mb-2.5" />
        <Bone className="h-[19px] w-3/4 rounded-full" />
        <div className="mt-3.5 flex justify-between">
          {Array.from({ length: 7 }, (_, i) => (
            <Bone key={i} className="h-9 w-9 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  </>
)

// 푸시 알림 카드
const PushCard = () => (
  <div className="px-4 py-3">
    <div className={`${CARD} p-4 flex items-center justify-between gap-3`}>
      <div className="flex-1">
        <Bone className="h-[14px] w-24 rounded-full mb-2" />
        <Bone className="h-[12px] w-40 max-w-full rounded-full" />
      </div>
      <Bone className="h-9 w-20 rounded-full" />
    </div>
  </div>
)

interface ProfileSkeletonProps {
  isDesktop: boolean
  /** 커버 배너(장착 칭호 배경) 자리를 잡을지 — 칭호 응답이 왔으면 그 값, 아니면 지난번 기억 */
  withCover: boolean
}

const ProfileSkeleton = ({ isDesktop, withCover }: ProfileSkeletonProps) => (
  <div className="animate-pulse" aria-hidden="true">
    {/* ProfileHeader — 라운드 카드 안 16:9(lg 21:9) 커버, 아바타가 커버 하단에 걸친다 */}
    <div className="px-4 pt-3">
      <div className="relative flex flex-col items-center overflow-hidden rounded-2xl pb-5 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
        {withCover && <Bone className="w-full aspect-video lg:aspect-[21/9]" />}
        <div className={`relative z-[1] rounded-full bg-white dark:bg-card-dark p-[3px] ${withCover ? '-mt-14' : 'mt-7'}`}>
          <Bone className="h-[81px] w-[81px] rounded-full" />
        </div>
        <Bone className="h-[21px] w-[68px] rounded-full" />
        <Bone className="mt-3 h-[22px] w-40 rounded-full" />
        <Bone className="mt-2.5 mb-1 h-[13px] w-20 rounded-full" />
      </div>
    </div>

    {/* LevelProgress ① 등불 카드 — 헤더 / 등잔(96px)+단계 이름·말씀·채움률 / 점선 아래 포인트 줄 */}
    <div className="px-4 py-3">
      <div className={`${CARD} p-5`}>
        <div className="flex items-center justify-between">
          <Bone className="h-[16px] w-24 rounded-full" />
          <Bone className="h-[24px] w-12 rounded-full" />
        </div>
        <div className="mt-3 flex items-center gap-4">
          <Bone className="h-[104px] w-24 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <Bone className="h-[22px] w-28 rounded-full" />
            <Bone className="mt-2.5 h-[12px] w-full rounded-full" />
            <Bone className="mt-1.5 h-[12px] w-2/3 rounded-full" />
            <Bone className="mt-3.5 h-[28px] w-20 rounded-full" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-white/[0.1]">
          <Bone className="h-[13px] w-16 rounded-full" />
          <Bone className="h-[13px] w-28 rounded-full" />
        </div>
      </div>
    </div>

    {/* LevelProgress ② 성장 카드 — 헤더 / 등불 계단 / 한 줄 / 스탯 타일 3 / 포인트 안내 행 */}
    <div className="px-4 py-1">
      <div className={`${CARD} p-5`}>
        <div className="flex items-center justify-between">
          <Bone className="h-[16px] w-24 rounded-full" />
          <Bone className="h-[13px] w-14 rounded-full" />
        </div>
        <Bone className="mt-4 h-[84px] w-full rounded-xl" />
        <Bone className="mt-3 h-[12px] w-1/2 rounded-full" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Bone className="h-[74px] rounded-xl" />
          <Bone className="h-[74px] rounded-xl" />
          <Bone className="h-[74px] rounded-xl" />
        </div>
        <Bone className="mt-3 h-[60px] w-full rounded-xl" />
      </div>
    </div>

    {/* 인사이트·여정·주간 스토리 — lg 에선 우측 레일 몫 */}
    {!isDesktop && <HookCards />}

    {/* AchievementBadges — 헤더 + 대표 배지 한 줄 */}
    <div className="px-4 py-3">
      <div className={`${CARD} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <Bone className="h-[14px] w-24 rounded-full" />
          <Bone className="h-[12px] w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <Bone key={i} className="h-11 w-11 shrink-0 rounded-full" />
          ))}
          <Bone className="h-11 w-32 shrink-0 rounded-full" />
        </div>
      </div>
    </div>

    {!isDesktop && <PushCard />}

    {/* ContentTabs + 목록 */}
    <div className="mt-1 flex gap-1.5 border-b border-border-light px-4 pb-3 dark:border-border-dark">
      {Array.from({ length: 4 }, (_, i) => (
        <Bone key={i} className="h-[52px] flex-1 rounded-xl" />
      ))}
    </div>
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 3 }, (_, i) => (
        <Bone key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  </div>
)

/** PC 우측 레일 자리표시자 — 레일이 비어 있다가 나타나면 본문 폭이 줄며 전체가 다시 짜인다 */
export const ProfileRailSkeleton = () => (
  <div className="animate-pulse" aria-hidden="true">
    <HookCards />
    <PushCard />
  </div>
)

export default ProfileSkeleton
