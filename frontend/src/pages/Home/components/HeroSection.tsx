import { useEffect } from 'react'
import mainBackground from '../../../assets/main_1.jpg'

const HeroSection = () => {
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
        </div>
      </div>
      
      <div className="scroll-indicator">
        <span className="scroll-text">Scroll Down</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}

export default HeroSection
