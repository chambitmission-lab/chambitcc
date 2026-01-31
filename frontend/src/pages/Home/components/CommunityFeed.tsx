import '../styles/CommunityFeed.css'
import hadan1 from '../../../assets/hadan1.jpg'
import hadan2 from '../../../assets/hadan2.jpg'

interface FeedPost {
  id: number
  author: {
    name: string
    username: string
    avatar: string
  }
  content: string
  image?: string
  timestamp: string
  likes: number
  retweets: number
  replies: number
  isLiked?: boolean
  isRetweeted?: boolean
}

const CommunityFeed = () => {
  const feedPosts: FeedPost[] = [
    {
      id: 1,
      author: {
        name: '김은혜',
        username: '@grace_kim',
        avatar: '👩'
      },
      content: '오늘 새벽기도회 너무 은혜로웠어요! 시편 23편 말씀이 마음에 깊이 와닿았습니다. 주님이 나의 목자시니 내게 부족함이 없으리로다 🙏✨',
      timestamp: '2시간 전',
      likes: 24,
      retweets: 5,
      replies: 8
    },
    {
      id: 2,
      author: {
        name: '이성도',
        username: '@faithful_lee',
        avatar: '👨'
      },
      content: '청년부 모임에서 찍은 사진 공유합니다! 함께 찬양하고 기도하는 시간이 정말 좋았어요 😊 다음 주에도 많이 참석해주세요!',
      image: hadan1,
      timestamp: '5시간 전',
      likes: 42,
      retweets: 12,
      replies: 15,
      isLiked: true
    },
    {
      id: 3,
      author: {
        name: '박사랑',
        username: '@love_park',
        avatar: '👩‍🦰'
      },
      content: '기도 제목 나눕니다 🙏\n다음 주 월요일 면접이 있어요. 하나님의 인도하심을 구합니다. 함께 기도해주시면 감사하겠습니다!',
      timestamp: '8시간 전',
      likes: 67,
      retweets: 8,
      replies: 23
    },
    {
      id: 4,
      author: {
        name: '최믿음',
        username: '@faith_choi',
        avatar: '🧑'
      },
      content: '오늘 목사님 설교 말씀 정리해봤어요.\n\n"두려워하지 말라 내가 너와 함께 함이라"\n\n어려운 상황 속에서도 하나님이 함께하신다는 확신을 갖게 되었습니다 💪',
      timestamp: '12시간 전',
      likes: 89,
      retweets: 34,
      replies: 19,
      isRetweeted: true
    },
    {
      id: 5,
      author: {
        name: '정소망',
        username: '@hope_jung',
        avatar: '👧'
      },
      content: '주일학교 아이들과 함께한 시간 ❤️ 아이들의 순수한 믿음을 보면서 오히려 제가 더 많이 배웁니다. 하나님 감사합니다!',
      image: hadan2,
      timestamp: '1일 전',
      likes: 56,
      retweets: 7,
      replies: 12
    },
    {
      id: 6,
      author: {
        name: '강감사',
        username: '@thanks_kang',
        avatar: '👴'
      },
      content: '오늘로 금식기도 21일을 마쳤습니다. 하나님께서 응답해주신 것들이 너무 많아서 감사의 눈물이 납니다. 기도는 응답됩니다! 🙌',
      timestamp: '1일 전',
      likes: 134,
      retweets: 45,
      replies: 31,
      isLiked: true,
      isRetweeted: true
    },
    {
      id: 7,
      author: {
        name: '윤평안',
        username: '@peace_yoon',
        avatar: '👨‍🦳'
      },
      content: '이번 주 토요일 무료 급식 봉사 함께하실 분 계신가요? 오전 10시부터 오후 2시까지입니다. 많은 참여 부탁드려요! 🍚',
      timestamp: '2일 전',
      likes: 38,
      retweets: 28,
      replies: 16
    },
    {
      id: 8,
      author: {
        name: '한기쁨',
        username: '@joy_han',
        avatar: '👩‍🦱'
      },
      content: '찬양팀 연습 중입니다 🎵 이번 주 특송 준비하고 있어요. 주님께 영광 돌리는 찬양이 되길 기도합니다!',
      timestamp: '2일 전',
      likes: 45,
      retweets: 6,
      replies: 9
    }
  ]

  return (
    <section className="community-feed">
      <div className="container">
        <div className="feed-header">
          <div className="feed-title-wrapper">
            <h2 className="section-title-main">우리 교회 소식</h2>
            <p className="section-subtitle">함께 나누는 이야기와 소식들</p>
          </div>
          <button className="btn-text">전체 보기 →</button>
        </div>
        
        <div className="feed-timeline">
          {feedPosts.map((post) => (
            <article key={post.id} className="feed-post">
              <div className="post-avatar">
                <span className="avatar-emoji">{post.author.avatar}</span>
              </div>
              
              <div className="post-content">
                <div className="post-header">
                  <div className="post-author">
                    <span className="author-name">{post.author.name}</span>
                    <span className="author-username">{post.author.username}</span>
                    <span className="post-dot">·</span>
                    <span className="post-time">{post.timestamp}</span>
                  </div>
                </div>
                
                <div className="post-text">{post.content}</div>
                
                {post.image && (
                  <div className="post-image">
                    <img src={post.image} alt="게시물 이미지" />
                  </div>
                )}
                
                <div className="post-actions">
                  <button className="action-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/>
                    </svg>
                    <span>{post.replies}</span>
                  </button>
                  
                  <button className={`action-btn ${post.isRetweeted ? 'retweeted' : ''}`}>
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                    </svg>
                    <span>{post.retweets}</span>
                  </button>
                  
                  <button className={`action-btn ${post.isLiked ? 'liked' : ''}`}>
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
                    </svg>
                    <span>{post.likes}</span>
                  </button>
                  
                  <button className="action-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CommunityFeed
