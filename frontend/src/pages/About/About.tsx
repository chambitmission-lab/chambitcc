import type { CSSProperties } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
import { useAboutContent } from '../../hooks/useAboutContent'
import { EditableText, HeroEditButton } from '../../components/AboutEditor'
import './styles/index.css'

const About = () => {
  const { language } = useLanguage()
  const { tx, heroBackgroundUrl } = useAboutContent()
  const isAdminUser = isAdmin()

  const heroStyle: CSSProperties | undefined = heroBackgroundUrl
    ? {
        backgroundImage: `url(${heroBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Hero Section */}
        <div className="about-hero" style={heroStyle}>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-badge">
              ✨{' '}
              <EditableText fieldKey="aboutWelcome" isAdmin={isAdminUser}>
                {tx('aboutWelcome')}
              </EditableText>
            </div>
            <h1 className="hero-title">
              <EditableText fieldKey="aboutChurchName" isAdmin={isAdminUser}>
                {tx('aboutChurchName')}
              </EditableText>
            </h1>
            <p className="hero-subtitle">
              <EditableText fieldKey="aboutTagline" isAdmin={isAdminUser}>
                {tx('aboutTagline')}
              </EditableText>
            </p>
          </div>
          <HeroEditButton isAdmin={isAdminUser} />
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* Intro Section */}
          <section className="intro-section">
            <div className="section-badge">
              💫{' '}
              <EditableText fieldKey="aboutOurStory" isAdmin={isAdminUser}>
                {tx('aboutOurStory')}
              </EditableText>
            </div>
            <h2 className="section-title" style={{ whiteSpace: 'pre-line' }}>
              <EditableText fieldKey="aboutMainTitle" multiline isAdmin={isAdminUser}>
                {tx('aboutMainTitle')}
              </EditableText>
            </h2>
            <p className="intro-text" style={{ whiteSpace: 'pre-line' }}>
              <EditableText fieldKey="aboutMainText" multiline isAdmin={isAdminUser}>
                {tx('aboutMainText')}
              </EditableText>
            </p>

            <div className="quote-card">
              <div className="quote-icon">"</div>
              <p className="quote-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutPromiseQuote" multiline isAdmin={isAdminUser}>
                  {tx('aboutPromiseQuote')}
                </EditableText>
              </p>
              <div className="quote-author">
                <EditableText fieldKey="aboutPromiseAuthor" isAdmin={isAdminUser}>
                  {tx('aboutPromiseAuthor')}
                </EditableText>
              </div>
            </div>
          </section>

          {/* Meeting Types */}
          <section className="meeting-section">
            <h3 className="meeting-title">
              <EditableText fieldKey="aboutMeetingTitle" isAdmin={isAdminUser}>
                {tx('aboutMeetingTitle')}
              </EditableText>
            </h3>
            <div className="meeting-grid">
              <div className="meeting-card bad">
                <span className="meeting-emoji">🐟</span>
                <p>
                  <EditableText fieldKey="aboutMeetingBad1" isAdmin={isAdminUser}>
                    {tx('aboutMeetingBad1')}
                  </EditableText>
                </p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">🌸</span>
                <p>
                  <EditableText fieldKey="aboutMeetingBad2" isAdmin={isAdminUser}>
                    {tx('aboutMeetingBad2')}
                  </EditableText>
                </p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">🔋</span>
                <p>
                  <EditableText fieldKey="aboutMeetingBad3" isAdmin={isAdminUser}>
                    {tx('aboutMeetingBad3')}
                  </EditableText>
                </p>
              </div>
              <div className="meeting-card bad">
                <span className="meeting-emoji">✏️</span>
                <p>
                  <EditableText fieldKey="aboutMeetingBad4" isAdmin={isAdminUser}>
                    {tx('aboutMeetingBad4')}
                  </EditableText>
                </p>
              </div>
              <div className="meeting-card good">
                <span className="meeting-emoji">🤍</span>
                <p className="good-text" style={{ whiteSpace: 'pre-line' }}>
                  <EditableText fieldKey="aboutMeetingGood" multiline isAdmin={isAdminUser}>
                    {tx('aboutMeetingGood')}
                  </EditableText>
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <div className="cta-card">
              <h3 className="cta-title">
                <EditableText fieldKey="aboutCtaTitle" isAdmin={isAdminUser}>
                  {tx('aboutCtaTitle')}
                </EditableText>
              </h3>
              <p className="cta-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutCtaText" multiline isAdmin={isAdminUser}>
                  {tx('aboutCtaText')}
                </EditableText>
              </p>
              <div className="cta-badge">
                <EditableText fieldKey="aboutCtaBadge" isAdmin={isAdminUser}>
                  {tx('aboutCtaBadge')}
                </EditableText>
              </div>
            </div>
          </section>

          {/* Pastor Section */}
          <section className="pastor-section">
            <div className="section-badge">
              👨‍🏫{' '}
              <EditableText fieldKey="aboutPastorBadge" isAdmin={isAdminUser}>
                {tx('aboutPastorBadge')}
              </EditableText>
            </div>
            <h2 className="section-title">
              <EditableText fieldKey="aboutPastorName" isAdmin={isAdminUser}>
                {tx('aboutPastorName')}
              </EditableText>
            </h2>
            <div className="pastor-nickname">
              <EditableText fieldKey="aboutPastorNickname" isAdmin={isAdminUser}>
                {tx('aboutPastorNickname')}
              </EditableText>
            </div>

            <div className="pastor-intro">
              <p className="pastor-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutPastorIntro1" multiline isAdmin={isAdminUser}>
                  {tx('aboutPastorIntro1')}
                </EditableText>
              </p>
              <p className="pastor-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutPastorIntro2" multiline isAdmin={isAdminUser}>
                  {tx('aboutPastorIntro2')}
                </EditableText>
              </p>
              <p className="pastor-text highlight" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutPastorIntro3" multiline isAdmin={isAdminUser}>
                  {tx('aboutPastorIntro3')}
                </EditableText>
              </p>
            </div>

            {/* Credentials */}
            <div className="credentials">
              <div className="credential-item">
                <span className="credential-icon">🎓</span>
                <div>
                  <div className="credential-label">
                    <EditableText fieldKey="aboutEducationLabel" isAdmin={isAdminUser}>
                      {tx('aboutEducationLabel')}
                    </EditableText>
                  </div>
                  <div className="credential-value" style={{ whiteSpace: 'pre-line' }}>
                    <EditableText fieldKey="aboutEducationValue" multiline isAdmin={isAdminUser}>
                      {tx('aboutEducationValue')}
                    </EditableText>
                  </div>
                </div>
              </div>
              <div className="credential-item">
                <span className="credential-icon">💼</span>
                <div>
                  <div className="credential-label">
                    <EditableText fieldKey="aboutCareerLabel" isAdmin={isAdminUser}>
                      {tx('aboutCareerLabel')}
                    </EditableText>
                  </div>
                  <div className="credential-value" style={{ whiteSpace: 'pre-line' }}>
                    <EditableText fieldKey="aboutCareerValue" multiline isAdmin={isAdminUser}>
                      {tx('aboutCareerValue')}
                    </EditableText>
                  </div>
                </div>
              </div>
              <div className="credential-item">
                <span className="credential-icon">🏆</span>
                <div>
                  <div className="credential-label">
                    <EditableText fieldKey="aboutAwardLabel" isAdmin={isAdminUser}>
                      {tx('aboutAwardLabel')}
                    </EditableText>
                  </div>
                  <div className="credential-value" style={{ whiteSpace: 'pre-line' }}>
                    <EditableText fieldKey="aboutAwardValue" multiline isAdmin={isAdminUser}>
                      {tx('aboutAwardValue')}
                    </EditableText>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Message */}
          <section className="footer-message">
            <p className="footer-text" style={{ whiteSpace: 'pre-line' }}>
              <EditableText fieldKey="aboutFooterMessage" multiline isAdmin={isAdminUser}>
                {tx('aboutFooterMessage')}
              </EditableText>
            </p>
          </section>

          {isAdminUser && (
            <div className="about-admin-hint">
              {language === 'ko'
                ? '✏️ 아이콘을 눌러 텍스트와 배경을 바로 수정할 수 있습니다.'
                : 'Click the ✏️ icon to edit text and backgrounds inline.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default About
