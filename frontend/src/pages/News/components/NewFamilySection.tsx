// 새가족 등록 앨범 섹션 (/news 의 '새가족' 탭 본문)
// Single Responsibility: 새가족 피드/그리드 구성과 모달 상태 관리
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import NewFamilyPostCard from './NewFamilyPostCard'
import NewFamilyCommentSheet from './NewFamilyCommentSheet'
import NewFamilyViewer from './NewFamilyViewer'
import { useNewFamilyPosts, useNewFamilyStats, useToggleWelcome } from '../../../hooks/useNewFamily'
import { deleteNewFamilyPost } from '../../../api/newFamily'
import { isAdmin } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import type { NewFamilyPost } from '../../../types/newFamily'

type ViewMode = 'feed' | 'grid'

const NewFamilySection = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isLoggedIn = !!localStorage.getItem('access_token')
  const admin = isAdmin()

  const [viewMode, setViewMode] = useState<ViewMode>('feed')
  const [commentPost, setCommentPost] = useState<NewFamilyPost | null>(null)
  const [viewer, setViewer] = useState<{ post: NewFamilyPost; index: number } | null>(null)

  const { posts, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, error } =
    useNewFamilyPosts(10, isLoggedIn)
  const { data: stats } = useNewFamilyStats(isLoggedIn)
  const { toggleWelcome } = useToggleWelcome()

  // 시트가 열려 있는 동안 목록이 갱신되면 최신 카운트로 따라가게 한다
  const activeCommentPost = commentPost
    ? posts.find((p) => p.id === commentPost.id) ?? commentPost
    : null

  const handleDelete = async (post: NewFamilyPost) => {
    if (
      !window.confirm(
        `${post.member_name} 소식을 삭제할까요?\n등록된 사진과 환영 댓글도 함께 삭제됩니다.`,
      )
    )
      return
    try {
      await deleteNewFamilyPost(post.id)
      showToast('삭제되었습니다', 'success')
      queryClient.invalidateQueries({ queryKey: ['new-family'] })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  // ── 비로그인: 초상권 보호를 위해 목록 자체를 가린다 ──
  if (!isLoggedIn) {
    return (
      <div className="px-4 pt-3 pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-6 py-12 text-center">
          <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-3">
              <span className="text-[28px]">🔒</span>
            </div>
            <p className="text-gray-900 dark:text-white text-[15px] font-bold mb-1.5">
              성도님만 볼 수 있어요
            </p>
            <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.65] mb-5">
              새가족 앨범에는 실명과 사진이 담겨 있어
              <br />
              로그인한 성도에게만 공개됩니다
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] active:scale-[0.98] transition-all"
            >
              로그인하고 보기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-3 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)] p-5 mb-4">
        <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/10 dark:from-purple-500/20 dark:to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[20px] shadow-[0_6px_18px_-6px_rgba(168,85,247,0.7)]">
              🌱
            </div>
            <div>
              <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.12em] uppercase">
                NEW FAMILY
              </p>
              <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
                새가족 등록 앨범
              </h2>
            </div>
          </div>

          <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6] mb-4">
            참빛교회 가족이 된 분들을 소개합니다. 따뜻한 환영 인사를 남겨주세요.
          </p>

          <div className="flex items-center gap-5">
            <HeroStat label="이번 달" value={stats?.this_month ?? 0} />
            <HeroStat label="올해" value={stats?.this_year ?? 0} />
            <HeroStat label="전체" value={stats?.total ?? 0} />

            {/* 뷰 전환 */}
            <div className="ml-auto inline-flex p-0.5 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.06]">
              <ViewToggle active={viewMode === 'feed'} onClick={() => setViewMode('feed')} label="피드로 보기">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="8" rx="2" />
                  <rect x="3" y="13" width="18" height="8" rx="2" />
                </svg>
              </ViewToggle>
              <ViewToggle active={viewMode === 'grid'} onClick={() => setViewMode('grid')} label="그리드로 보기">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </ViewToggle>
            </div>
          </div>
        </div>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <SkeletonFeed />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : '불러오지 못했습니다'} />
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setViewer({ post, index: 0 })}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.04] active:scale-[0.97] transition-transform"
            >
              {post.cover_url ? (
                <img
                  src={post.cover_url}
                  alt={post.member_name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[22px]">
                  🌱
                </span>
              )}
              {post.photo_count > 1 && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold flex items-center justify-center">
                  {post.photo_count}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/75 to-transparent text-white text-[10px] font-bold truncate text-left">
                {post.member_name}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <NewFamilyPostCard
              key={post.id}
              post={post}
              isAdmin={admin}
              onToggleWelcome={(emoji) => toggleWelcome({ postId: post.id, emoji })}
              onOpenComments={() => setCommentPost(post)}
              onOpenViewer={(index) => setViewer({ post, index })}
              onDelete={() => handleDelete(post)}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-5">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 h-10 rounded-full text-[12.5px] font-bold text-[var(--brand)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? '불러오는 중...' : '지난 새가족 더 보기'}
          </button>
        </div>
      )}

      {activeCommentPost && (
        <NewFamilyCommentSheet post={activeCommentPost} onClose={() => setCommentPost(null)} />
      )}
      {viewer && (
        <NewFamilyViewer
          post={viewer.post}
          initialIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}

// ── 작은 컴포넌트들 ────────────────────────────────────
const HeroStat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <p className="text-[10.5px] font-semibold text-gray-400 dark:text-white/40 mb-0.5">{label}</p>
    <p className="text-[20px] font-bold leading-none bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent tabular-nums">
      {value}
    </p>
  </div>
)

const ViewToggle = ({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    className={[
      'w-8 h-8 rounded-full flex items-center justify-center transition-all',
      active
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_3px_10px_-3px_rgba(168,85,247,0.7)]'
        : 'text-gray-500 dark:text-white/50 hover:text-purple-500 dark:hover:text-purple-300',
    ].join(' ')}
  >
    {children}
  </button>
)

const SkeletonFeed = () => (
  <div className="space-y-4">
    {Array.from({ length: 2 }).map((_, i) => (
      <div
        key={i}
        className="rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] overflow-hidden animate-pulse"
      >
        <div className="h-16" />
        <div className="aspect-[4/5] bg-gray-200/60 dark:bg-white/[0.05]" />
        <div className="h-20" />
      </div>
    ))}
  </div>
)

const EmptyState = () => (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-3">
      <span className="text-[28px]">🌱</span>
    </div>
    <p className="text-gray-900 dark:text-white text-[14.5px] font-bold mb-1">
      아직 등록된 새가족이 없어요
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      새 가족이 등록되면 이곳에서 만나볼 수 있어요
    </p>
  </div>
)

const ErrorState = ({ message }: { message: string }) => (
  <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 py-8 px-6 text-center">
    <p className="text-red-600 dark:text-red-300 text-[13px] font-semibold">{message}</p>
  </div>
)

export default NewFamilySection
