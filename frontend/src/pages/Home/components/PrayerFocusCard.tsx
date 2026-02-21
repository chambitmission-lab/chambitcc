import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'

const PrayerFocusCard = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="px-4 py-3">
      <button
        onClick={() => navigate('/prayer-focus')}
        className="w-full p-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
      >
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative flex items-center gap-4">
          {/* 아이콘 */}
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
            <span className="material-icons-outlined text-3xl text-white">self_improvement</span>
          </div>
          
          {/* 텍스트 */}
          <div className="flex-1 text-left">
            <h3 className="text-lg font-bold text-white mb-1">
              {t('prayerFocusMode')}
            </h3>
            <p className="text-sm text-white/80">
              {t('focusedPrayerDescription')}
            </p>
          </div>
          
          {/* 화살표 */}
          <span className="material-icons-outlined text-white text-2xl group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </div>
      </button>
    </div>
  )
}

export default PrayerFocusCard
