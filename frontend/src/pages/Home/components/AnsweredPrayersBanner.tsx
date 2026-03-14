// 응답의 전당 배너 컴포넌트
import { useNavigate } from 'react-router-dom'
import './AnsweredPrayersBanner.css'

const AnsweredPrayersBanner = () => {
  const navigate = useNavigate()
  
  return (
    <div 
      className="answered-prayers-banner mx-4 my-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.25) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.5)',
        boxShadow: '0 0 20px rgba(168, 85, 247, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={() => navigate('/answered-prayers')}
    >
      <div className="flex items-center gap-3">
        <div 
          className="text-2xl"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))',
            animation: 'sparkle 2s ease-in-out infinite'
          }}
        >
          ✨
        </div>
        <div className="flex-1">
          <h3 
            className="m-0 text-sm font-extrabold mb-0.5"
            style={{
              color: '#ffffff',
              textShadow: '0 0 10px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)'
            }}
          >
            응답의 전당
          </h3>
          <p 
            className="m-0 text-xs font-medium"
            style={{
              color: '#e5e7eb',
              textShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
            }}
          >
            하나님께서 응답하신 기도들
          </p>
        </div>
        <div 
          className="text-xl font-bold transition-transform duration-200"
          style={{
            color: 'rgba(168, 85, 247, 0.9)',
            filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.6))'
          }}
        >
          →
        </div>
      </div>
      
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.9));
          }
        }
        
        .answered-prayers-banner:hover {
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.15) !important;
          border-color: rgba(168, 85, 247, 0.6) !important;
        }
        
        .answered-prayers-banner:hover > div > div:last-child {
          transform: translateX(4px);
          filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.8));
        }
      `}</style>
    </div>
  )
}

export default AnsweredPrayersBanner
