// 응답의 전당 배너 컴포넌트
import { useNavigate } from 'react-router-dom'
import './AnsweredPrayersBanner.css'

const AnsweredPrayersBanner = () => {
  const navigate = useNavigate()
  
  return (
    <div 
      className="answered-prayers-banner"
      onClick={() => navigate('/answered-prayers')}
    >
      <div className="banner-content">
        <div className="banner-icon">✨</div>
        <div className="banner-text">
          <h3>응답의 전당</h3>
          <p>하나님께서 응답하신 기도들</p>
        </div>
        <div className="banner-arrow">→</div>
      </div>
    </div>
  )
}

export default AnsweredPrayersBanner
