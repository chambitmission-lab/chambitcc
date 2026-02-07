import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerComposerHeaderProps {
  onClose: () => void
}

const PrayerComposerHeader = ({ onClose }: PrayerComposerHeaderProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="sticky top-0 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        {t('prayerComposerTitle')}
      </h2>
      <button
        onClick={onClose}
        className="relative group w-10 h-10 flex items-center justify-center"
      >
        {/* 가장 바깥 빛 확산 */}
        <div className="absolute inset-0 rounded-full bg-purple-500/20 dark:bg-yellow-400/20 blur-2xl scale-150 group-hover:scale-[2] animate-pulse transition-transform duration-500"></div>
        
        {/* 중간 빛 레이어 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-purple-500/50 dark:from-yellow-300/50 dark:via-orange-300/50 dark:to-yellow-400/50 blur-xl scale-125 group-hover:scale-150 animate-pulse transition-transform duration-300"></div>
        
        {/* 강한 빛 레이어 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/70 to-pink-500/70 dark:from-yellow-400/70 dark:to-orange-400/70 blur-lg group-hover:blur-xl animate-pulse"></div>
        
        {/* 내부 빛나는 원 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-pink-300 to-purple-400 dark:from-yellow-300 dark:via-orange-300 dark:to-yellow-400 opacity-60 blur-md group-hover:opacity-80 animate-pulse"></div>
        
        {/* 반짝이는 효과 */}
        <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/50 blur-sm animate-ping"></div>
        
        {/* X 아이콘 배경 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 dark:from-yellow-400 dark:to-orange-400 opacity-80 group-hover:opacity-100 shadow-[0_0_30px_rgba(168,85,247,0.8)] dark:shadow-[0_0_40px_rgba(250,204,21,0.9)] group-hover:shadow-[0_0_50px_rgba(168,85,247,1)] dark:group-hover:shadow-[0_0_60px_rgba(250,204,21,1)] transition-all"></div>
        
        {/* X 아이콘 */}
        <span className="material-icons-outlined relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)] transition-all group-hover:scale-110 group-hover:rotate-90 duration-300 font-bold">
          close
        </span>
      </button>
    </div>
  )
}

export default PrayerComposerHeader
