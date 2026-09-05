import '../styles/CommunityFeed.css'
import { type Post } from '../../../api/community'
import { useCommunityFeed } from '../../../hooks/useCommunityFeed'
import { useCommunityActions } from '../../../hooks/useCommunityActions'
import { PostComposer } from '../../../components/community/PostComposer'
import { PostItem } from '../../../components/community/PostItem'
import { toastFeedback } from '../../../utils/toast'
import { isApiError } from '../../../api/utils/request'

/**
 * 커뮤니티 피드 메인 컴포넌트
 * - React Query 기반 자동 캐싱 및 Optimistic Update
 * - UI 컴포넌트는 재사용 가능한 작은 컴포넌트로 분리
 */
const CommunityFeed = () => {
  const { posts, loading, error, addPost } = useCommunityFeed('latest', toastFeedback({ success: '게시물이 작성되었습니다.', error: '게시물 작성에 실패했습니다.' }))
  const { handleLike, handleRetweet } = useCommunityActions({
    feedback: {
      like: toastFeedback<{ message?: string }, number>({
        success: (data) => data.message || '좋아요!',
        error: (e) =>
          e.message.includes('already liked') ? '이미 좋아요를 누르셨습니다.'
            : isApiError(e, 401) ? '로그인이 필요합니다.'
              : '좋아요 처리 중 오류가 발생했습니다.',
      }),
      retweet: toastFeedback<{ message?: string }, number>({
        success: (data) => data.message || '리트윗 완료!',
        error: (e) =>
          e.message.includes('already') ? '이미 리트윗하셨습니다.'
            : isApiError(e, 401) ? '로그인이 필요합니다.'
              : '리트윗 처리 중 오류가 발생했습니다.',
      }),
    },
  })

  const handlePostCreated = async (content: string, image?: string) => {
    await addPost(content, image)
  }

  if (loading) {
    return <FeedContainer><div className="feed-loading">로딩 중...</div></FeedContainer>
  }

  if (error) {
    return <FeedContainer><div className="feed-error">{error}</div></FeedContainer>
  }

  return <FeedContainer posts={posts} onPostCreated={handlePostCreated} onLike={handleLike} onRetweet={handleRetweet} />
}

/**
 * 피드 컨테이너 컴포넌트 (프레젠테이션)
 */
const FeedContainer = ({ 
  posts, 
  onPostCreated, 
  onLike, 
  onRetweet,
  children 
}: { 
  posts?: Post[]
  onPostCreated?: (content: string, image?: string) => Promise<void>
  onLike?: (postId: number) => void
  onRetweet?: (postId: number) => void
  children?: React.ReactNode
}) => {
  return (
    <section className="community-feed">
      <div className="container">
        <div className="feed-header">
          <div className="feed-title-wrapper">
            <h2 className="section-title-main">우리 교회 소식</h2>
            <p className="section-subtitle">함께 나누는 이야기와 소식들</p>
          </div>
          {posts && <button className="btn-text">전체 보기 →</button>}
        </div>

        {children}

        {posts && onPostCreated && (
          <PostComposer onPostCreated={onPostCreated} />
        )}
        
        {posts && onLike && onRetweet && (
          <div className="feed-timeline">
            {posts.map((post) => (
              <PostItem 
                key={post.id} 
                post={post} 
                onLike={onLike}
                onRetweet={onRetweet}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default CommunityFeed
