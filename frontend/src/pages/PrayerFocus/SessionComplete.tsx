import { useLanguage } from '../../contexts/LanguageContext'

interface SessionCompleteProps {
  duration: number
  onRestart: () => void
  onClose: () => void
}

const SessionComplete = ({ duration, onRestart, onClose }: SessionCompleteProps) => {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in text-center">
        {/* 완료 아이콘 */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-scale-in">
            <span className="material-icons-outlined text-7xl">check_circle</span>
          </div>
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-purple-500/50 rounded-full animate-ping"></div>
        </div>

        {/* 완료 메시지 */}
        <div className="space-y-4">
          <h2 className="text-4xl font-bold">{t('prayerComplete') || '기도 완료!'}</h2>
          <p className="text-xl text-white/70">
            {duration}분 동안 집중하여 기도하셨습니다
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-bold text-purple-300">{duration}</div>
              <div className="text-sm text-white/60">분</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-300">1</div>
              <div className="text-sm text-white/60">세션</div>
            </div>
          </div>
        </div>

        {/* 격려 메시지 */}
        <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <p className="text-white/80 leading-relaxed">
            "쉬지 말고 기도하라" - 데살로니가전서 5:17
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            {t('startAgain') || '다시 시작하기'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 bg-white/10 backdrop-blur-sm rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all"
          >
            {t('close') || '닫기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionComplete
