// 작성자 정보 컴포넌트
// 번역 버튼은 이 줄 오른쪽에 — 제목 줄에 두면 긴 제목이 버튼을 피해 꺾이고
// 번역 시 제목 길이 변화로 버튼이 튄다. "번역" 라벨이 붙은 필 버튼이라
// 작성자 국적으로 오인될 여지도 없다.
import type { CSSProperties } from 'react'
import LangFlag from '../../../../components/common/LangFlag'
import { getLanguageName } from '../../../../utils/languageFlags'
import { useLanguage } from '../../../../contexts/LanguageContext'
// 피드 카드와 동일한 아바타 스타일(feed-avatar/anon-avatar) — 목록↔상세 일관성
import '../PrayerArticle/PrayerHeader.css'

interface PrayerAuthorInfoProps {
  prayerId: number
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
  prayerId,
  displayName,
  avatarUrl = null,
  timeAgo,
  isOwner,
  hasTranslation,
  showTranslation,
  nextLanguage,
  onTranslationToggle,
}: PrayerAuthorInfoProps) => {
  const { t } = useLanguage()
  // 익명 기도는 아바타를 튀지 않게(뉴트럴) 처리 — 브랜드 색 미사용
  const isAnonymous = displayName === '익명' || displayName === 'Anonymous'
  // 익명 표시 이름 — "익명" 대신 마 6:6의 골방 기도자 (데이터 값은 그대로 둔다)
  const shownName = isAnonymous ? t('anonymousDisplayName') : displayName
  // 익명 아바타 링 컬러 — 피드와 같은 공식(id 기반 골든앵글)이라 목록↔상세 색이 일치
  const anonRing = `hsl(${Math.round((prayerId * 137.508) % 360)} 62% 58%)`
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {/* 피드 PrayerHeader와 동일한 아바타 — 화면 간 일관성 */}
        <div className="shrink-0">
          {isAnonymous ? (
            <div
              className="anon-avatar w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500"
              style={{ '--anon-ring': anonRing } as CSSProperties}
            >
              <span className="material-icons-outlined text-[18px]">person</span>
            </div>
          ) : avatarUrl ? (
            <span className="feed-avatar">
              <img src={avatarUrl} alt="" className="feed-avatar-img" />
            </span>
          ) : (
            <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-xs font-bold shadow-[0_2px_10px_var(--brand-glow)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <p className={`text-sm leading-none mb-1 flex items-center gap-1.5 ${
            isAnonymous
              ? 'font-medium text-gray-500 dark:text-gray-400'
              : 'font-semibold text-gray-900 dark:text-white'
          }`}>
            <span className="truncate">{shownName}</span>
            {isOwner && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] text-[10px] font-bold leading-none text-[var(--brand)]">
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
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-light dark:bg-white/[0.05] border border-border-light dark:border-white/[0.08] rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-[var(--brand-soft)] transition-colors duration-300"
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
