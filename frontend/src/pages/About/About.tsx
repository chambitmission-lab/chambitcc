import './About.css'

const About = () => {
  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-badge">✨ Welcome</div>
            <h1 className="hero-title">참빛교회</h1>
            <p className="hero-subtitle">인생은 만남입니다</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* Intro Section */}
          <section className="intro-section">
            <div className="section-badge">💫 Our Story</div>
            <h2 className="section-title">당신의 인생을 바꿀<br/>특별한 만남</h2>
            <p className="intro-text">
              누구를 만나느냐가 우리 인생을 바꿉니다.<br/>
              참빛이신 예수님과의 만남은<br/>
              당신의 인생 궤도를 완전히 바꿀 것입니다.
            </p>
            
            <div className="quote-card">
              <div className="quote-icon">"</div>
              <p className="quote-text">
                힘들 때는 땀을 닦아주고,<br/>
                슬플 때는 눈물을 닦아주는<br/>
                손수건 같은 교회
              </p>
              <div className="quote-author">- 참빛교회의 약속</div>
            </div>
          </section>

          {/* Meeting Types */}
          <section className="meeting-section">
            <h3 className="meeting-title">어떤 만남을 원하시나요?</h3>
            <div className="meeting-grid">
              <div className="meeting-card bad">
                <span className="meeting-emoji">🐟</span>
                <p>비린내 나는 만남</p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">🌸</span>
                <p>시들면 버리는 만남</p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">🔋</span>
                <p>힘 닳으면 버리는 만남</p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">✏️</span>
                <p>필요없으면 지우는 만남</p>
              </div>
              <div className="meeting-card good">
                <span className="meeting-emoji">🤍</span>
                <p className="good-text">땀과 눈물을 닦아주는<br/>손수건 같은 만남</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <div className="cta-card">
              <h3 className="cta-title">함께 하실래요?</h3>
              <p className="cta-text">
                영광스러운 하나님 나라를<br/>
                함께 만들어가는 멋진 여정에<br/>
                당신을 초대합니다
              </p>
              <div className="cta-badge">✝️ 참빛교회가 함께합니다</div>
            </div>
          </section>

          {/* Pastor Section */}
          <section className="pastor-section">
            <div className="section-badge">👨‍🏫 Pastor</div>
            <h2 className="section-title">안동철 담임목사</h2>
            <div className="pastor-nickname">"복있는 사람"</div>
            
            <div className="pastor-intro">
              <p className="pastor-text">
                하나님을 뜨겁게 사랑하는 목사님.<br/>
                진실하고 겸손하며, 한 영혼의 소중함을 아는 분.
              </p>
              <p className="pastor-text">
                15년간 총회교육원에서 다음세대 부흥을 위해 헌신하며<br/>
                '클릭 바이블', '그랜드스토리' 등 베스트셀러 교재 개발을 이끌었습니다.
              </p>
              <p className="pastor-text highlight">
                '복있는 사람' 편집장으로 말씀 묵상 사역에 헌신하며<br/>
                진리의 빛이신 주님을 드러내는 데 최선을 다하고 있습니다.
              </p>
            </div>

            {/* Credentials */}
            <div className="credentials">
              <div className="credential-item">
                <span className="credential-icon">🎓</span>
                <div>
                  <div className="credential-label">학력</div>
                  <div className="credential-value">고신대 · 고려신학대학원<br/>Liberty Seminary (S.T.M.)</div>
                </div>
              </div>
              <div className="credential-item">
                <span className="credential-icon">💼</span>
                <div>
                  <div className="credential-label">주요 경력</div>
                  <div className="credential-value">총회교육원 수석연구원<br/>복있는사람 편집장</div>
                </div>
              </div>
              <div className="credential-item">
                <span className="credential-icon">🏆</span>
                <div>
                  <div className="credential-label">수상</div>
                  <div className="credential-value">교육발전 유공자 총회장상<br/>지역사회 발전 유공자 시장 포상</div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Message */}
          <section className="footer-message">
            <p className="footer-text">
              참빛교회 홈페이지를 방문해주신<br/>
              모든 분들께 감사드립니다 🙏
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default About
