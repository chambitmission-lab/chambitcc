// 칭호 메달 — 도감 그리드의 기본 단위.
// 티어 = 링 재질(브론즈/실버/골드/홀로그램), 미획득 = 실루엣 + 메달 둘레 진행률 링.
import type { TitleStatus } from '../../api/titles'
import { useLanguage } from '../../contexts/LanguageContext'
import { localizeTitle } from './titleI18n'
import { TIER_VISUALS } from './titleVisuals'
import './TitleMedal.css'

export type MedalSize = 'sm' | 'md' | 'lg'

interface TitleMedalProps {
  title: TitleStatus
  size?: MedalSize
}

/** 메달 오브제만 렌더 — 상세 시트/통계 카드에서도 재사용 */
export const TitleMedal: React.FC<TitleMedalProps> = ({ title, size = 'md' }) => {
  const tier = TIER_VISUALS[title.tier]
  const locked = !title.earned
  const concealed = locked && title.hidden

  const pct = title.progress && title.progress.target > 0
    ? Math.min(100, Math.round((title.progress.current / title.progress.target) * 100))
    : 0

  return (
    <div
      className={[
        'title-medal',
        `title-medal-${size}`,
        `title-medal-tier-${title.tier}`,
        locked ? 'is-locked' : 'is-earned',
        title.equipped ? 'is-equipped' : '',
      ].join(' ')}
      style={
        locked
          ? ({ ['--medal-pct' as string]: pct })
          : ({ ['--medal-material' as string]: tier.medal })
      }
    >
      <div className="title-medal-face">
        <span className="title-medal-icon" aria-hidden>
          {concealed ? '🔒' : title.icon}
        </span>
      </div>
      {title.equipped && (
        <span className="title-medal-equipped-dot" aria-hidden>
          <span className="material-icons-round">check</span>
        </span>
      )}
    </div>
  )
}

interface TitleMedalTileProps {
  title: TitleStatus
  onSelect: (title: TitleStatus) => void
}

/** 그리드 타일 — 메달 + 이름 + (티어 or 진행률) 한 줄 */
export const TitleMedalTile: React.FC<TitleMedalTileProps> = ({ title, onSelect }) => {
  const { t, language } = useLanguage()
  const tier = TIER_VISUALS[title.tier]
  const locked = !title.earned
  const concealed = locked && title.hidden
  const text = localizeTitle(title, language)

  const displayName = concealed ? t('titleConcealedName') : text.name

  return (
    <button type="button" className="title-medal-tile" onClick={() => onSelect(title)}>
      <TitleMedal title={title} />
      <span className={`title-medal-tile-name${locked ? ' is-locked' : ''}`}>{displayName}</span>
      {locked ? (
        concealed ? (
          <span className="title-medal-tile-sub is-muted">???</span>
        ) : title.progress ? (
          <span className="title-medal-tile-sub is-progress">
            {title.progress.current}/{title.progress.target}
          </span>
        ) : (
          <span className="title-medal-tile-sub is-muted">{t(tier.labelKey)}</span>
        )
      ) : (
        <span
          className="title-medal-tile-sub"
          style={{ color: tier.chipText }}
        >
          {title.tier === 'legendary' ? `★ ${t('titleTierLegendary')}` : t(tier.labelKey)}
        </span>
      )}
    </button>
  )
}
