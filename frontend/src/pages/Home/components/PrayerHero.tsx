// Hero Section - 인스타그램 심플 스타일
interface PrayerHeroProps {
  onCreateClick: () => void
}

const PrayerHero = ({ onCreateClick }: PrayerHeroProps) => {
  return (
    <section className="prayer-hero">
      <div className="hero-content">
        <div className="hero-label">PRAYER REQUEST</div>
        <h1 className="hero-title">
          익명 기도 요청
        </h1>
        <p className="hero-subtitle">
          혼자가 아닙니다. 함께 기도합니다.
        </p>
        <button className="hero-cta" onClick={onCreateClick}>
          <span className="cta-text">기도 요청 작성</span>
          <span className="cta-arrow">+</span>
        </button>
      </div>
      
      <div className="hero-stats">
        <div className="stat-item">
          <div className="stat-number">∞</div>
          <div className="stat-label">익명 보장</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">언제나 함께</div>
        </div>
      </div>
    </section>
  )
}

export default PrayerHero
