import hadan1 from '../../../assets/hadan1.jpg'
import hadan2 from '../../../assets/hadan2.jpg'
import hadan3 from '../../../assets/hadan3.jpg'

const CommunityFeed = () => {
  return (
    <section className="community-feed">
      <div className="container">
        <div className="feed-header">
          <h2 className="section-title">교회 소식</h2>
          <button className="btn-text">전체 보기 →</button>
        </div>
        <div className="feed-grid">
          <article className="feed-card">
            <div className="card-image" style={{ backgroundImage: `url(${hadan1})` }}></div>
            <div className="card-content">
              <span className="card-category">공지사항</span>
              <h3>2025년 새해 감사예배 안내</h3>
              <p>새해를 맞이하여 감사예배를 드립니다.</p>
              <span className="card-date">2025.01.20</span>
            </div>
          </article>
          <article className="feed-card">
            <div className="card-image" style={{ backgroundImage: `url(${hadan2})` }}></div>
            <div className="card-content">
              <span className="card-category">행사</span>
              <h3>청년부 겨울 수련회</h3>
              <p>청년들의 영적 성장을 위한 시간</p>
              <span className="card-date">2025.01.18</span>
            </div>
          </article>
          <article className="feed-card">
            <div className="card-image" style={{ backgroundImage: `url(${hadan3})` }}></div>
            <div className="card-content">
              <span className="card-category">선교</span>
              <h3>해외 선교 후원의 밤</h3>
              <p>선교지 소식과 간증을 나누는 시간</p>
              <span className="card-date">2025.01.15</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default CommunityFeed
