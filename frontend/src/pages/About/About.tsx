import { useLanguage } from '../../contexts/LanguageContext'
import './About.css'

const About = () => {
  const { t } = useLanguage()
  
  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-badge">✨ {t('aboutWelcome')}</div>
            <h1 className="hero-title">{t('aboutChurchName')}</h1>
            <p className="hero-subtitle">{t('aboutTagline')}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* Intro Section */}
          <section className="intro-section">
            <div className="section-badge">💫 {t('aboutOurStory')}</div>
            <h2 className="section-title" style={{ whiteSpace: 'pre-line' }}>
              {t('aboutMainTitle')}
            </h2>
            <p className="intro-text" style={{ whiteSpace: 'pre-line' }}>
              {t('aboutMainText')}
            </p>
            
            <div className="quote-card">
              <div className="quote-icon">"</div>
              <p className="quote-text" style={{ whiteSpace: 'pre-line' }}>
                {t('aboutPromiseQuote')}
              </p>
              <div className="quote-author">{t('aboutPromiseAuthor')}</div>
            </div>
          </section>

          {/* Meeting Types */}
          <section className="meeting-section">
            <h3 className="meeting-title">{t('aboutMeetingTitle')}</h3>
            <div className="meeting-grid">
              <div className="meeting-card bad">
                <span className="meeting-emoji">🐟</span>
                <p>{t('aboutMeetingBad1')}</p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">🌸</span>
                <p>{t('aboutMeetingBad2')}</p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">🔋</span>
                <p>{t('aboutMeetingBad3')}</p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">✏️</span>
                <p>{t('aboutMeetingBad4')}</p>
              </div>
              <div className="meeting-card good">
                <span className="meeting-emoji">🤍</span>
                <p className="good-text" style={{ whiteSpace: 'pre-line' }}>
                  {t('aboutMeetingGood')}
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <div className="cta-card">
              <h3 className="cta-title">{t('aboutCtaTitle')}</h3>
              <p className="cta-text" style={{ whiteSpace: 'pre-line' }}>
                {t('aboutCtaText')}
              </p>
              <div className="cta-badge">{t('aboutCtaBadge')}</div>
            </div>
          </section>

          {/* Pastor Section */}
          <section className="pastor-section">
            <div className="section-badge">👨‍🏫 {t('aboutPastorBadge')}</div>
            <h2 className="section-title">{t('aboutPastorName')}</h2>
            <div className="pastor-nickname">{t('aboutPastorNickname')}</div>
            
            <div className="pastor-intro">
              <p className="pastor-text" style={{ whiteSpace: 'pre-line' }}>
                {t('aboutPastorIntro1')}
              </p>
              <p className="pastor-text" style={{ whiteSpace: 'pre-line' }}>
                {t('aboutPastorIntro2')}
              </p>
              <p className="pastor-text highlight" style={{ whiteSpace: 'pre-line' }}>
                {t('aboutPastorIntro3')}
              </p>
            </div>

            {/* Credentials */}
            <div className="credentials">
              <div className="credential-item">
                <span className="credential-icon">🎓</span>
                <div>
                  <div className="credential-label">{t('aboutEducationLabel')}</div>
                  <div className="credential-value" style={{ whiteSpace: 'pre-line' }}>
                    {t('aboutEducationValue')}
                  </div>
                </div>
              </div>
              <div className="credential-item">
                <span className="credential-icon">💼</span>
                <div>
                  <div className="credential-label">{t('aboutCareerLabel')}</div>
                  <div className="credential-value" style={{ whiteSpace: 'pre-line' }}>
                    {t('aboutCareerValue')}
                  </div>
                </div>
              </div>
              <div className="credential-item">
                <span className="credential-icon">🏆</span>
                <div>
                  <div className="credential-label">{t('aboutAwardLabel')}</div>
                  <div className="credential-value" style={{ whiteSpace: 'pre-line' }}>
                    {t('aboutAwardValue')}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Message */}
          <section className="footer-message">
            <p className="footer-text" style={{ whiteSpace: 'pre-line' }}>
              {t('aboutFooterMessage')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default About
