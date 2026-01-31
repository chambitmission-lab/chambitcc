import '../styles/CommunityFeed.css'
import { type Post } from '../../../api/community'
import { useCommunityFeed } from '../../../hooks/useCommunityFeed'
import { usePostActions } from '../../../hooks/usePostActions'
import { PostComposer } from '../../../components/community/PostComposer'
import { PostItem } from '../../../components/community/PostItem'

/**
 * 커뮤니티 피드 메인 컴포넌트
 * - 데이터 페칭과 상태 관리는 커스텀 훅으로 분리
 * - UI 컴포넌트는 재사용 가능한 작은 컴포넌트로 분리
 */
const CommunityFeed = () => {
  const { posts, setPosts, loading, error } = useCommunityFeed()
  const { handleLike, handleRetweet } = usePostActions({ posts, setPosts })

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts])
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
  onPostCreated?: (post: Post) => void
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
