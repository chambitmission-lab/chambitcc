// 작성자 정보 컴포넌트
// 번역 버튼은 이 줄 오른쪽에 — 제목 줄에 두면 긴 제목이 버튼을 피해 꺾이고
// 번역 시 제목 길이 변화로 버튼이 튄다. "번역" 라벨이 붙은 필 버튼이라
// 작성자 국적으로 오인될 여지도 없다.
import LangFlag from '../../../../components/common/LangFlag'
import { getLanguageName } from '../../../../utils/languageFlags'

interface PrayerAuthorInfoProps {
  displayName: string
  avatarUrl?: string | null
  timeAgo: string
  isOwner: boolean
  hasTranslation: boolean
  showTranslation: boolean
  nextLanguage: string
  onTranslationToggle: () => void
}

const PrayerAuthorInfo = ({
  displayName,
  avatarUrl = null,
  timeAgo,
  isOwner,
  hasTranslation,
  showTranslation,
  nextLanguage,
  onTranslationToggle,
}: PrayerAuthorInfoProps) => {
  // 익명 기도는 아바타를 튀지 않게(뉴트럴) 처리 — 보랏빛 글로우 미사용
  const isAnonymous = displayName === '익명'
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {/* 피드 PrayerHeader와 동일한 보랏빛 글로우 아바타 — 화면 간 일관성 */}
        <div className="relative shrink-0">
          {isAnonymous ? (
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <span className="material-icons-outlined text-[20px]">person</span>
            </div>
          ) : (
            <>
          <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-purple-500/40 blur-md animate-pulse"></div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/70 dark:border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.6)] dark:shadow-[0_0_25px_rgba(168,85,247,0.4)] relative z-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-purple-400/50 dark:via-purple-500/30 dark:to-purple-600/20 border-2 border-purple-500/70 dark:border-purple-400/50 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(168,85,247,0.4),inset_0_1px_3px_rgba(255,255,255,0.3)] relative z-10">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
            </>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <p className={`text-sm leading-none mb-1 flex items-center gap-1.5 ${
            isAnonymous
              ? 'font-medium text-gray-500 dark:text-gray-400'
              : 'font-semibold text-gray-900 dark:text-white'
          }`}>
            <span className="truncate">{displayName}</span>
            {isOwner && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-purple-500/[0.12] dark:bg-purple-400/[0.16] text-[10px] font-bold leading-none text-purple-600 dark:text-purple-300">
                내 기도
              </span>
            )}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{timeAgo}</p>
        </div>
      </div>

      {hasTranslation && (
        <button
          onClick={onTranslationToggle}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-light dark:bg-white/[0.05] border border-border-light dark:border-white/[0.08] rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-colors duration-300"
          aria-label={
            showTranslation ? '원문 보기' : `${getLanguageName(nextLanguage)}로 번역`
          }
        >
          <LangFlag code={nextLanguage} className="rounded-[2px]" />
          <span>{showTranslation ? '원문 보기' : '번역'}</span>
        </button>
      )}
    </div>
  )
}

export default PrayerAuthorInfo
