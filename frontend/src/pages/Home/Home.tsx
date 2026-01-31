import './Home.css'
import mainBackground from '../../assets/main_1.jpg'
import hadan1 from '../../assets/hadan1.jpg'
import hadan2 from '../../assets/hadan2.jpg'
import hadan3 from '../../assets/hadan3.jpg'
import { useEffect, useState } from 'react'

const Home = () => {
  const [activeTab, setActiveTab] = useState<'sunday' | 'weekday'>('sunday')

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const home = document.querySelector('.home') as HTMLElement
      if (home) {
        home.style.setProperty('--mouse-x', `${e.clientX}px`)
        home.style.setProperty('--mouse-y', `${e.clientY}px`)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <div className="hero-pattern"></div>
          <img 
            src={mainBackground}
            alt="참빛교회"
            className="hero-image"
          />
          <div className="hero-glow hero-glow-left"></div>
          <div className="hero-glow hero-glow-right"></div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-line">너희 마른 뼈들아,</span>
            <span className="title-line shimmer-text">이제 살아나리라!</span>
          </h1>
          <p className="hero-verse">
            에스겔 37장 5,10절
          </p>
          <div className="hero-actions">
            <button className="btn-primary">예배 안내</button>
            <button className="btn-glass">온라인 예배</button>
          </div>
        </div>
        
        <div className="scroll-indicator">
          <span className="scroll-text">Scroll Down</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* Info Cards Section */}
      <section className="info-cards">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <span className="info-label">Sunday Service</span>
              <h3 className="info-title">주일 예배 시간</h3>
              <p className="info-description">
                1부 오전 9:00 | 2부 오전 11:30 | 3부 오후 2:00
              </p>
            </div>
            
            <div className="info-card">
              <span className="info-label">Community</span>
              <h3 className="info-title">나눔과 교제</h3>
              <p className="info-description">
                함께 성장하고 위로하는 참빛 공동체에 당신을 초대합니다.
              </p>
            </div>
            
            <div className="info-card">
              <span className="info-label">Location</span>
              <h3 className="info-title">오시는 길</h3>
              <p className="info-description">
                지하철 2호선 역 인근 현대적인 예배당에서 만나요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Worship Times */}
      <section className="worship-times">
        <div className="container">
          <h2 className="section-title center">예배 시간</h2>
          
          {/* 모바일 탭 네비게이션 */}
          <div className="worship-tabs">
            <button 
              className={`worship-tab ${activeTab === 'sunday' ? 'active' : ''}`}
              onClick={() => setActiveTab('sunday')}
            >
              주일예배
            </button>
            <button 
              className={`worship-tab ${activeTab === 'weekday' ? 'active' : ''}`}
              onClick={() => setActiveTab('weekday')}
            >
              주중예배
            </button>
          </div>

          <div className={`worship-section ${activeTab === 'sunday' ? 'mobile-active' : 'mobile-hidden'}`}>
            <h3 className="worship-section-title">주일예배</h3>
            <div className="worship-grid">
              <div className="worship-card">
                <div className="card-icon">1부</div>
                <h3>주일 1부</h3>
                <p className="time">오전 7:30</p>
                <p className="location">오르엘홀</p>
              </div>
              <div className="worship-card">
                <div className="card-icon">2부</div>
                <h3>주일 2부</h3>
                <p className="time">오전 9:20</p>
                <p className="location">본당</p>
              </div>
              <div className="worship-card">
                <div className="card-icon">3부</div>
                <h3>주일 3부</h3>
                <p className="time">오전 11:20</p>
                <p className="location">본당</p>
              </div>
              <div className="worship-card">
                <div className="card-icon">4부</div>
                <h3>주일 4부</h3>
                <p className="time">오후 1:30</p>
                <p className="location">본당</p>
              </div>
            </div>
          </div>

          <div className={`worship-section ${activeTab === 'weekday' ? 'mobile-active' : 'mobile-hidden'}`}>
            <h3 className="worship-section-title">주중예배</h3>
            <div className="worship-grid">
              <div className="worship-card">
                <div className="card-icon-text">새벽</div>
                <h3>새벽기도회</h3>
                <p className="time">오전 5:30</p>
                <p className="location">오르엘홀</p>
              </div>
              <div className="worship-card">
                <div className="card-icon-text">수요</div>
                <h3>수요기도회</h3>
                <p className="time">오전 10:30 / 오후 7:30</p>
                <p className="location">오르엘홀 / 본당</p>
              </div>
              <div className="worship-card">
                <div className="card-icon-text">금요</div>
                <h3>금요기도회</h3>
                <p className="time">오후 8:30</p>
                <p className="location">본당</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Sermon */}
      <section className="latest-sermon">
        <div className="container">
          <div className="sermon-content">
            <div className="sermon-info">
              <span className="section-label">Latest Sermon</span>
              <h2 className="section-title">최근 설교</h2>
              <h3 className="sermon-title">하나님은 왜 우리를 돌아가게 하실까?</h3>
              <p className="sermon-verse">출애굽기 13장 17~22절</p>
              <div className="sermon-meta">
                <span>안동철 목사</span>
                <span>•</span>
                <span>2026.01.31</span>
              </div>
              <div className="sermon-actions">
                <a 
                  href="https://www.youtube.com/watch?v=VGBjHz1qSK4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  유튜브에서 보기
                </a>
              </div>
            </div>
            <div className="sermon-thumbnail">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/VGBjHz1qSK4"
                title="최근 설교"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="sermon-video"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Community Feed */}
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

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>함께 예배하고 싶으신가요?</h2>
            <p>참빛교회는 언제나 여러분을 환영합니다</p>
            <div className="cta-actions">
              <button className="btn-primary large">오시는 길</button>
              <button className="btn-secondary large">온라인 예배</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
