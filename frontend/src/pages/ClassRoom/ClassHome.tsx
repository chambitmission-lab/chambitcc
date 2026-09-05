import { Lock } from '../../components/icons/phosphor'
// 우리반 알림장 홈 (/classes/:classId)
// 반 정보 · 초대 공유 · 유형 필터 · 알림 피드 (확인체크/암송/RSVP/댓글)
import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClassDetail, useClassPosts, useLeaveClass } from '../../hooks/useClassRoom'
import type { ClassDetail, ClassPost, ClassPostType } from '../../types/classRoom'
import { isAuthenticated } from '../../utils/auth'
import { classInviteUrl } from '../../utils/inviteLink'
import { showToast } from '../../utils/toast'
import ClassPostCard from './components/ClassPostCard'
import { Avatar, DeptBadge, Shell } from './classUi'
import {
  BallotIcon,
  CalendarIcon,
  CameraIcon,
  ChartIcon,
  ClipboardIcon,
  EnvelopeIcon,
  MailboxIcon,
  MegaphoneIcon,
  OpenBookIcon,
  SchoolIcon,
  SproutIcon,
  StarIcon,
  type IconFn,
} from './ClassIcons'
import { confirmDialog } from '../../utils/confirmDialog'

// 시트들은 열기 전엔 한 줄도 쓰이지 않는데, 정적 import면 첫 진입에 같이 받는다.
// (작성 시트가 DatePicker·TimePicker·useBible·imageResize를, 상태 시트가
//  MemberSearchInput을, 댓글 시트가 EmojiPickerPanel·ReplyList를 끌고 온다)
// → lazy로 떼어내 첫 진입 페이로드를 줄이고, 아래 useEffect에서 idle에 데워둔다.
const loadStatusSheets = () => import('./components/ClassStatusSheets')
const ClassComposerSheet = lazy(() => import('./components/ClassComposerSheet'))
const ClassCommentSheet = lazy(() => import('./components/ClassCommentSheet'))
const MembersSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.MembersSheet })))
const CheckStatusSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.CheckStatusSheet })))
const RecitationSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.RecitationSheet })))
const RsvpDetailSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.RsvpDetailSheet })))
const PollDetailSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.PollDetailSheet })))
const StarsSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.StarsSheet })))
const GrowthSheet = lazy(() => loadStatusSheets().then((m) => ({ default: m.GrowthSheet })))

// 멤버 아바타 겹침 — 목록 캐시로 먼저 그릴 때는 members가 비어 있으므로
// member_count 만큼 회색 자리를 채워 아바타가 뒤늦게 들어와도 줄이 밀리지 않게 한다
const AvatarStack = ({
  members,
  memberCount,
  max,
  size,
}: {
  members: ClassDetail['members']
  memberCount: number
  max: number
  size: number
}) => (
  <div className="flex -space-x-2">
    {members.length > 0
      ? members.slice(0, max).map((m) => (
          <span key={m.user_id} title={m.name} className="inline-block">
            <Avatar name={m.name} avatarUrl={m.avatar_url} size={size} />
          </span>
        ))
      : Array.from({ length: Math.min(memberCount, max) }).map((_, i) => (
          <span
            key={i}
            className="inline-block rounded-full bg-gray-100 dark:bg-white/[0.06] ring-2 ring-white dark:ring-[#15151d]"
            style={{ width: size, height: size }}
          />
        ))}
  </div>
)

const FILTER_TABS: { value: ClassPostType | undefined; label: string; icon?: IconFn }[] = [
  { value: undefined, label: '전체' },
  { value: 'notice', label: '공지', icon: MegaphoneIcon },
  { value: 'verse', label: '암송', icon: OpenBookIcon },
  { value: 'event', label: '일정', icon: CalendarIcon },
  { value: 'photo', label: '사진', icon: CameraIcon },
  { value: 'poll', label: '투표', icon: BallotIcon },
]

const ClassHome = () => {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const id = Number(classId)

  const { data: cls, isLoading, error } = useClassDetail(id, isAuthenticated())
  const leaveClass = useLeaveClass()

  const [postType, setPostType] = useState<ClassPostType | undefined>(undefined)
  const [showComposer, setShowComposer] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showStars, setShowStars] = useState(false)
  const [showGrowth, setShowGrowth] = useState(false)
  const [commentPost, setCommentPost] = useState<ClassPost | null>(null)
  const [checkPost, setCheckPost] = useState<ClassPost | null>(null)
  const [recitePost, setRecitePost] = useState<ClassPost | null>(null)
  const [rsvpPost, setRsvpPost] = useState<ClassPost | null>(null)
  const [pollPost, setPollPost] = useState<ClassPost | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/classes/${id}`)
      navigate('/login')
    }
  }, [id, navigate])

  // 피드가 그려진 뒤 한가할 때 시트 청크를 데워둔다 — 첫 진입은 가볍게,
  // 정작 시트를 열 때는 기다림이 없게 (BibleBottomNav와 같은 문법)
  useEffect(() => {
    const warm = () => {
      void loadStatusSheets()
      void import('./components/ClassCommentSheet')
      void import('./components/ClassComposerSheet')
    }
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(warm, { timeout: 3000 })
      return () => window.cancelIdleCallback(handle)
    }
    const handle = window.setTimeout(warm, 1500)
    return () => window.clearTimeout(handle)
  }, [])

  // '알림 쓰기' FAB가 떠 있는 동안 전역 챗봇 버튼을 위로 밀어 우하단 겹침을 막는다.
  // (VerseList·BookJourneyPath와 같은 --chat-fab-lift 문법 — 챗봇 쪽은 변수만 읽는다)
  const writeFabVisible = !!cls?.is_teacher
  useEffect(() => {
    if (!writeFabVisible) return
    document.documentElement.style.setProperty('--chat-fab-lift', '3rem')
    return () => {
      document.documentElement.style.removeProperty('--chat-fab-lift')
    }
  }, [writeFabVisible])

  const handleShare = async () => {
    if (!cls?.invite_code) return
    const url = classInviteUrl(cls.invite_code)
    const text = `🏫 '${cls.name}' 알림장에 초대해요!\n공지 확인·암송요절·일정 참석을 알림장 하나로 함께해요.\n\n${url}\n\n앱을 설치했다면 [우리반 알림장 → 초대 코드로 참여]에 코드 ${cls.invite_code} 를 입력해도 돼요.`
    if (navigator.share) {
      try {
        await navigator.share({ title: cls.name, text, url })
        return
      } catch {
        /* 사용자가 취소 — 폴백 없이 종료 */
        return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('초대 링크를 복사했어요. 카톡 반 단톡방에 붙여넣어 보내주세요!', 'success')
    } catch {
      showToast('복사에 실패했어요. 초대 코드를 직접 알려주세요: ' + cls.invite_code, 'error')
    }
  }

  const handleLeave = async () => {
    if (
      !(await confirmDialog({
        title: '반 나가기',
        message: '이 반에서 나가시겠어요?',
        description: '다시 들어오려면 초대 코드가 필요해요.',
        confirmText: '나가기',
        icon: 'logout',
      }))
    )
      return
    try {
      await leaveClass.mutateAsync(id)
      showToast('반에서 나왔어요', 'success')
      navigate('/classes')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  // 목록 캐시로 먼저 그리는 경우 cls가 있어도 요청은 실패할 수 있다 — 에러를 먼저 본다
  if (error) {
    return (
      <Shell onBack={() => navigate('/classes')} title="우리반 알림장">
        <div className="text-center py-16 px-6">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3"><Lock size={26} weight="duotone" color="currentColor" aria-hidden="true" /></span>
          <p className="text-[13px] text-gray-500 dark:text-white/55">
            {error instanceof Error ? error.message : '반을 불러오지 못했습니다'}
          </p>
        </div>
      </Shell>
    )
  }

  if (isLoading || !cls) {
    return (
      <Shell onBack={() => navigate('/classes')} title="우리반 알림장">
        <div className="px-4 pt-4 space-y-3">
          <div className="h-36 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        </div>
      </Shell>
    )
  }

  return (
    <Shell
      onBack={() => navigate('/classes')}
      title={cls.name}
      actions={
        <button
          type="button"
          onClick={handleLeave}
          className="text-[12px] font-semibold text-gray-400 dark:text-white/40 hover:text-red-500"
        >
          나가기
        </button>
      }
      rail={
        /* lg+ 우측 레일 — 본문 헤더·퀵액션·글쓰기 FAB(모두 lg:hidden)를 대신한다.
           어느 만큼 스크롤해도 반 정체성과 진입점이 옆에 남는다 */
        <>
          <section className="relative overflow-hidden rounded-3xl p-5 border border-blue-200/60 dark:border-white/[0.08] bg-gradient-to-br from-blue-50 to-sky-50 dark:from-[#172554]/60 dark:to-[#1e3a8a]/35">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/70 dark:bg-white/[0.08] flex items-center justify-center text-brand">
                <SchoolIcon width={22} height={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <DeptBadge department={cls.department} />
                  {cls.is_teacher && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[11px] font-bold leading-none">
                      교사
                    </span>
                  )}
                </div>
                <h2 className="text-[17px] font-bold tracking-[-0.015em] leading-[1.3] text-ink-strong mt-1 break-keep">
                  {cls.name}
                </h2>
              </div>
            </div>

            {cls.description && (
              <p className="text-[12.5px] text-gray-600 dark:text-white/65 mt-2.5 leading-[1.6]">
                {cls.description}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowMembers(true)}
              className="mt-4 flex items-center active:scale-95 transition-transform"
            >
              <AvatarStack
                members={cls.members}
                memberCount={cls.member_count}
                max={5}
                size={28}
              />
              <span className="ml-2.5 text-[12px] font-semibold text-gray-500 dark:text-white/55">
                {cls.member_count}명 →
              </span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-brand text-white text-[12.5px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-[0.98] transition-transform"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              초대하기
            </button>
          </section>

          {cls.is_teacher && (
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-brand text-white text-[14px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.4 3.6Z" />
              </svg>
              알림 쓰기
            </button>
          )}

          <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none">
            <p className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
              바로가기
            </p>
            <div className="flex flex-col -mx-1">
              {cls.is_teacher && (
                <>
                  <RailAction icon={ChartIcon} label="리포트" onClick={() => navigate(`/classes/${id}/report`)} />
                  <RailAction icon={ClipboardIcon} label="출석부" onClick={() => navigate(`/classes/${id}/attendance`)} />
                </>
              )}
              <RailAction icon={CameraIcon} label="앨범" onClick={() => navigate(`/classes/${id}/album`)} />
              <RailAction icon={StarIcon} label="암송 별" onClick={() => setShowStars(true)} />
              {!cls.is_teacher && (
                <RailAction icon={SproutIcon} label="성장 카드" onClick={() => setShowGrowth(true)} />
              )}
            </div>
          </section>
        </>
      }
    >
      {/* 반 헤더 — lg에선 우측 레일의 같은 카드가 대신한다 */}
      <section className="lg:hidden relative overflow-hidden rounded-3xl mx-4 mt-4 p-5 border border-blue-200/60 dark:border-white/[0.08] bg-gradient-to-br from-blue-50 to-sky-50 dark:from-[#172554]/60 dark:to-[#1e3a8a]/35">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-12 h-12 rounded-2xl bg-white/70 dark:bg-white/[0.08] flex items-center justify-center text-brand">
            <SchoolIcon width={24} height={24} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <DeptBadge department={cls.department} />
              {cls.is_teacher && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[11px] font-bold leading-none">
                  교사
                </span>
              )}
            </div>
            <h2 className="text-[19px] font-bold tracking-[-0.015em] leading-[1.3] text-ink-strong mt-1 break-keep">
              {cls.name}
            </h2>
            {cls.description && (
              <p className="text-[12.5px] text-gray-600 dark:text-white/65 mt-1">
                {cls.description}
              </p>
            )}
          </div>
        </div>

        {/* 멤버 + 초대 */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowMembers(true)}
            className="flex items-center active:scale-95 transition-transform"
          >
            <AvatarStack
              members={cls.members}
              memberCount={cls.member_count}
              max={6}
              size={30}
            />
            <span className="ml-2.5 text-[12px] font-semibold text-gray-500 dark:text-white/55">
              {cls.member_count}명 →
            </span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-95 transition-transform"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            초대하기
          </button>
        </div>
      </section>

      {/* 퀵 액션 — 리포트·출석부(교사) / 앨범·별·성장카드 (lg에선 레일의 '바로가기') */}
      <div className="lg:hidden flex gap-2 overflow-x-auto px-4 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cls.is_teacher && (
          <>
            <QuickAction icon={ChartIcon} label="리포트" onClick={() => navigate(`/classes/${id}/report`)} />
            <QuickAction icon={ClipboardIcon} label="출석부" onClick={() => navigate(`/classes/${id}/attendance`)} />
          </>
        )}
        <QuickAction icon={CameraIcon} label="앨범" onClick={() => navigate(`/classes/${id}/album`)} />
        <QuickAction icon={StarIcon} label="암송 별" onClick={() => setShowStars(true)} />
        {!cls.is_teacher && (
          <QuickAction icon={SproutIcon} label="성장 카드" onClick={() => setShowGrowth(true)} />
        )}
      </div>

      {/* 혼자면 초대 넛지 */}
      {cls.member_count <= 1 && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-[var(--brand-soft)] text-[12.5px] text-gray-600 dark:text-white/70 leading-[1.6]">
          <EnvelopeIcon width={13} height={13} className="inline-block align-[-2px] mr-1 text-brand" />
          아직 혼자예요. <b className="text-brand">초대하기</b>를 눌러 카톡 반 단톡방에
          링크를 공유하면 학부모님들이 바로 들어올 수 있어요.
        </div>
      )}

      {/* 유형 필터 */}
      <div className="flex gap-2 overflow-x-auto px-4 pt-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTER_TABS.map((tab) => {
          const active = postType === tab.value
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setPostType(tab.value)}
              className={`shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                active
                  ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              {tab.icon && <tab.icon width={13} height={13} className="shrink-0" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 피드 */}
      <Feed
        classId={id}
        postType={postType}
        isTeacher={cls.is_teacher}
        memberCount={cls.member_count}
        onOpenComments={setCommentPost}
        onOpenChecks={setCheckPost}
        onOpenRecitations={setRecitePost}
        onOpenRsvps={setRsvpPost}
        onOpenPollDetail={setPollPost}
      />

      {/* 교사 전용 글쓰기 FAB */}
      {cls.is_teacher && (
        <button
          type="button"
          onClick={() => setShowComposer(true)}
          className="lg:hidden fixed bottom-20 z-30 inline-flex items-center gap-1.5 px-5 py-3.5 rounded-full bg-brand text-white text-[14px] font-bold shadow-[0_12px_32px_-8px_var(--brand-glow)] active:scale-95 transition-transform"
          style={{ right: 'max(16px, calc(50% - 13rem))' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.4 3.6Z" />
          </svg>
          알림 쓰기
        </button>
      )}

      {/* 시트들 — lazy 청크. idle에 데워두므로 대개 fallback 없이 바로 뜬다 */}
      <Suspense fallback={null}>
        {showComposer && (
          <ClassComposerSheet classId={id} onClose={() => setShowComposer(false)} />
        )}
        {showMembers && <MembersSheet cls={cls} onClose={() => setShowMembers(false)} />}
        {commentPost && (
          <ClassCommentSheet
            post={commentPost}
            isTeacher={cls.is_teacher}
            onClose={() => setCommentPost(null)}
          />
        )}
        {checkPost && <CheckStatusSheet post={checkPost} onClose={() => setCheckPost(null)} />}
        {recitePost && (
          <RecitationSheet
            post={recitePost}
            isTeacher={cls.is_teacher}
            memberCount={cls.member_count}
            onClose={() => setRecitePost(null)}
          />
        )}
        {rsvpPost && <RsvpDetailSheet post={rsvpPost} onClose={() => setRsvpPost(null)} />}
        {pollPost && <PollDetailSheet post={pollPost} onClose={() => setPollPost(null)} />}
        {showStars && <StarsSheet classId={id} onClose={() => setShowStars(false)} />}
        {showGrowth && <GrowthSheet classId={id} onClose={() => setShowGrowth(false)} />}
      </Suspense>
    </Shell>
  )
}

// ── 레일 바로가기 행 (lg+) — 가로 칩 대신 세로 목록 ──
const RailAction = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: IconFn
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2.5 px-1 py-2 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors"
  >
    <span className="w-5 flex justify-center text-brand">
      <Icon width={15} height={15} />
    </span>
    <span className="flex-1 min-w-0 truncate text-[12.5px] font-bold text-ink-strong">{label}</span>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400 dark:text-white/35">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>
)

// ── 퀵 액션 칩 ──
const QuickAction = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: IconFn
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[12.5px] font-bold text-gray-700 dark:text-white/75 shadow-sm active:scale-95 transition-transform"
  >
    <Icon width={14} height={14} className="shrink-0 text-brand" />
    {label}
  </button>
)

// ── 피드 ──
const Feed = ({
  classId,
  postType,
  isTeacher,
  memberCount,
  onOpenComments,
  onOpenChecks,
  onOpenRecitations,
  onOpenRsvps,
  onOpenPollDetail,
}: {
  classId: number
  postType: ClassPostType | undefined
  isTeacher: boolean
  memberCount: number
  onOpenComments: (post: ClassPost) => void
  onOpenChecks: (post: ClassPost) => void
  onOpenRecitations: (post: ClassPost) => void
  onOpenRsvps: (post: ClassPost) => void
  onOpenPollDetail: (post: ClassPost) => void
}) => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useClassPosts(classId, postType)
  const posts = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <section className="px-4 pt-4 pb-24 space-y-3 lg:max-w-[640px] lg:mx-auto lg:w-full">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        ))
      ) : posts.length === 0 ? (
        <div className="text-center py-14 px-6">
          <MailboxIcon width={36} height={36} className="mx-auto mb-3 text-gray-400 dark:text-white/40" />
          <p className="text-[13px] text-gray-500 dark:text-white/55 leading-[1.7]">
            {isTeacher
              ? '아직 알림이 없어요. 첫 공지나 이번 주 암송요절을 올려보세요!'
              : '아직 알림이 없어요. 선생님의 첫 알림을 기다리고 있어요.'}
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <ClassPostCard
              key={post.id}
              post={post}
              isTeacher={isTeacher}
              memberCount={memberCount}
              onOpenComments={onOpenComments}
              onOpenChecks={onOpenChecks}
              onOpenRecitations={onOpenRecitations}
              onOpenRsvps={onOpenRsvps}
              onOpenPollDetail={onOpenPollDetail}
            />
          ))}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-50"
              >
                {isFetchingNextPage ? '불러오는 중...' : '지난 알림 더보기'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default ClassHome
