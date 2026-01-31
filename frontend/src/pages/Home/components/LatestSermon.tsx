const LatestSermon = () => {
  return (
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
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="sermon-video"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LatestSermon
