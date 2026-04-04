import { useLanguage } from '../../contexts/LanguageContext'

interface SessionCompleteProps {
  duration: number
  onRestart: () => void
  onClose: () => void
}

const SessionComplete = ({ duration, onRestart, onClose }: SessionCompleteProps) => {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-purple-700/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-pink-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md space-y-8 animate-fade-in text-center relative z-10">
        {/* 완료 아이콘 */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-scale-in shadow-[0_10px_15px_-3px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_6px_rgba(0,0,0,0.2)]">
            <span className="material-icons-outlined text-7xl">check_circle</span>
          </div>
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-purple-500/50 rounded-full animate-ping"></div>
        </div>

        {/* 완료 메시지 */}
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-white/80">
            {t('prayerComplete')}
          </h2>
          <p className="text-xl text-white/70">
            {duration}분 동안 집중하여 기도하셨습니다
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-6 border border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
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
        <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-4 border border-white/8">
          <p className="text-white/80 leading-relaxed font-serif italic">
            "쉬지 말고 기도하라" - 데살로니가전서 5:17
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-[0_10px_25px_-5px_rgba(168,85,247,0.4)] transition-all"
          >
            {t('startAgain')}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 bg-white/10 backdrop-blur-md rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionComplete
