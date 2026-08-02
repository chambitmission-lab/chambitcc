// 우리반 알림장 홈 (/classes/:classId)
// 반 정보 · 초대 공유 · 유형 필터 · 알림 피드 (확인체크/암송/RSVP/댓글)
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClassDetail, useClassPosts, useLeaveClass } from '../../hooks/useClassRoom'
import type { ClassPost, ClassPostType } from '../../types/classRoom'
import { isAuthenticated } from '../../utils/auth'
import { classInviteUrl } from '../../utils/inviteLink'
import { showToast } from '../../utils/toast'
import ClassCommentSheet from './components/ClassCommentSheet'
import ClassComposerSheet from './components/ClassComposerSheet'
import ClassPostCard from './components/ClassPostCard'
import {
  CheckStatusSheet,
  MembersSheet,
  RecitationSheet,
  RsvpDetailSheet,
} from './components/ClassStatusSheets'
import { Avatar, DeptBadge, Shell } from './classUi'

const FILTER_TABS: { value: ClassPostType | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'notice', label: '📢 공지' },
  { value: 'verse', label: '📖 암송' },
  { value: 'event', label: '📅 일정' },
  { value: 'photo', label: '📷 사진' },
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
  const [commentPost, setCommentPost] = useState<ClassPost | null>(null)
  const [checkPost, setCheckPost] = useState<ClassPost | null>(null)
  const [recitePost, setRecitePost] = useState<ClassPost | null>(null)
  const [rsvpPost, setRsvpPost] = useState<ClassPost | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/classes/${id}`)
      navigate('/login')
    }
  }, [id, navigate])

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
    if (!confirm('이 반에서 나가시겠어요?')) return
    try {
      await leaveClass.mutateAsync(id)
      showToast('반에서 나왔어요', 'success')
      navigate('/classes')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  if (isLoading || !cls) {
    return (
      <Shell onBack={() => navigate('/classes')} title="우리반 알림장">
        {error ? (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">🔒</span>
            <p className="text-[13px] text-gray-500 dark:text-white/55">
              {error instanceof Error ? error.message : '반을 불러오지 못했습니다'}
            </p>
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-3">
            <div className="h-36 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          </div>
        )}
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
    >
      {/* 반 헤더 */}
      <section className="relative overflow-hidden rounded-3xl mx-4 mt-4 p-5 border border-blue-200/60 dark:border-white/[0.08] bg-gradient-to-br from-blue-50 to-sky-50 dark:from-[#172554]/60 dark:to-[#1e3a8a]/35">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-12 h-12 rounded-2xl bg-white/70 dark:bg-white/[0.08] flex items-center justify-center text-[24px]">
            🏫
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
            <div className="flex -space-x-2">
              {cls.members.slice(0, 6).map((m) => (
                <span key={m.user_id} title={m.name} className="inline-block">
                  <Avatar name={m.name} avatarUrl={m.avatar_url} size={30} />
                </span>
              ))}
            </div>
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

      {/* 혼자면 초대 넛지 */}
      {cls.member_count <= 1 && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-[var(--brand-soft)] text-[12.5px] text-gray-600 dark:text-white/70 leading-[1.6]">
          💌 아직 혼자예요. <b className="text-brand">초대하기</b>를 눌러 카톡 반 단톡방에
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
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                active
                  ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
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
      />

      {/* 교사 전용 글쓰기 FAB */}
      {cls.is_teacher && (
        <button
          type="button"
          onClick={() => setShowComposer(true)}
          className="fixed bottom-20 z-30 inline-flex items-center gap-1.5 px-5 py-3.5 rounded-full bg-brand text-white text-[14px] font-bold shadow-[0_12px_32px_-8px_var(--brand-glow)] active:scale-95 transition-transform"
          style={{ right: 'max(16px, calc(50% - 13rem))' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.4 3.6Z" />
          </svg>
          알림 쓰기
        </button>
      )}

      {/* 시트들 */}
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
        <RecitationSheet post={recitePost} onClose={() => setRecitePost(null)} />
      )}
      {rsvpPost && <RsvpDetailSheet post={rsvpPost} onClose={() => setRsvpPost(null)} />}
    </Shell>
  )
}

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
}: {
  classId: number
  postType: ClassPostType | undefined
  isTeacher: boolean
  memberCount: number
  onOpenComments: (post: ClassPost) => void
  onOpenChecks: (post: ClassPost) => void
  onOpenRecitations: (post: ClassPost) => void
  onOpenRsvps: (post: ClassPost) => void
}) => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useClassPosts(classId, postType)
  const posts = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <section className="px-4 pt-4 pb-24 space-y-3">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        ))
      ) : posts.length === 0 ? (
        <div className="text-center py-14 px-6">
          <span className="text-4xl block mb-3">📮</span>
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
