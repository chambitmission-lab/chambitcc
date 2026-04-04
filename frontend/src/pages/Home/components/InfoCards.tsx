const InfoCards = () => {
  return (
    <section className="info-cards">
      <div className="container">
        <div className="info-grid">
          <div className="info-card">
            <span className="info-label">Sunday Service</span>
            <h3 className="info-title">주일 예배 시간</h3>
            <p className="info-description">
              1부 오전 7:30 | 2부 오전 9:20 | 3부 오전 11:20 | 4부 오후 1:30
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
              지하철 7호선 상동역 인근 예배장에서 만나요.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InfoCards
