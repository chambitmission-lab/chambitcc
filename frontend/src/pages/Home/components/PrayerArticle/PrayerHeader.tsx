import { useState, type CSSProperties } from 'react'
import type { GroupColorTheme } from '../../../../utils/groupColors'
import { useLanguage } from '../../../../contexts/LanguageContext'
import AvatarZoomModal from '../../../../components/AvatarZoomModal'
import './PrayerHeader.css'

interface PrayerHeaderProps {
  prayerId: number
  displayName: string
  avatarUrl?: string | null
  timeAgo: string
  groupName?: string
  colorTheme: GroupColorTheme
}

const PrayerHeader = ({
  prayerId,
  displayName,
  avatarUrl = null,
  timeAgo,
  groupName,
  colorTheme
}: PrayerHeaderProps) => {
  const { t } = useLanguage()
  const [showAvatarZoom, setShowAvatarZoom] = useState(false)
  // 익명 기도는 아바타를 튀지 않게(뉴트럴) 처리 — 브랜드/그룹 색 미사용
  const isAnonymous = displayName === '익명' || displayName === 'Anonymous'
  // 익명 표시 이름 — "익명" 대신 마 6:6의 골방 기도자 (데이터 값은 그대로 둔다)
  const shownName = isAnonymous ? t('anonymousDisplayName') : displayName
  // 익명 아바타 링 컬러 — 기도별로 고정되도록 id 기반, 골든앵글로 색상 분산
  const anonRing = `hsl(${Math.round((prayerId * 137.508) % 360)} 62% 58%)`
  // 그룹이 없으면 기존 브랜드 스타일 사용
  const useGroupColor = !!groupName && !isAnonymous

  // 인스타그램 피드 헤더 벤치마크 — "이름 · 시간" 한 줄 메타.
  // 아바타는 굵은 링 대신 1px 헤어라인 + 숨 쉬는 후광(PrayerHeader.css)으로
  // 은은하게 주인공 스포트라이트를 준다. 그룹 기도는 그룹 컬러 후광.
  return (
    <>
    <div className="px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0">
          {isAnonymous ? (
            <div
              className="anon-avatar w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500"
              style={{ '--anon-ring': anonRing } as CSSProperties}
            >
              <span className="material-icons-outlined text-[18px]">person</span>
            </div>
          ) : avatarUrl ? (
            // 실제 업로드 사진만 탭하면 확대(인스타그램식). 카드 전체 클릭
            // (상세 이동)과 겹치므로 전파를 막고 라이트박스를 연다.
            <span
              className="feed-avatar cursor-zoom-in"
              role="button"
              tabIndex={0}
              aria-label={`${shownName} 프로필 사진 보기`}
              onClick={(e) => {
                e.stopPropagation()
                setShowAvatarZoom(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowAvatarZoom(true)
                }
              }}
              style={
                useGroupColor
                  ? ({ '--avatar-glow': colorTheme.glow } as CSSProperties)
                  : undefined
              }
            >
              <img
                src={avatarUrl}
                alt=""
                loading="lazy"
                className="feed-avatar-img"
              />
            </span>
          ) : useGroupColor ? (
            <div
              className="w-9 h-9 rounded-full backdrop-blur-md border-2 flex items-center justify-center text-xs font-bold"
              style={{
                background: colorTheme.gradient,
                borderColor: colorTheme.primary,
                boxShadow: colorTheme.shadow,
                color: '#5D4E37'
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-xs font-bold shadow-[0_2px_10px_var(--brand-glow)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className={`text-[14.5px] tracking-[-0.01em] truncate ${
            isAnonymous
              ? 'font-medium text-gray-500 dark:text-gray-400'
              : 'font-semibold text-gray-900 dark:text-white'
          }`}>
            {shownName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            · {timeAgo}
          </span>
          {groupName && (
            <span
              className="text-xs font-semibold truncate"
              style={{ color: colorTheme.accent }}
            >
              · {groupName}
            </span>
          )}
        </div>
      </div>
    </div>

    {showAvatarZoom && avatarUrl && (
      <AvatarZoomModal
        src={avatarUrl}
        name={shownName}
        onClose={() => setShowAvatarZoom(false)}
      />
    )}
   </>
  )
}

export default PrayerHeader
