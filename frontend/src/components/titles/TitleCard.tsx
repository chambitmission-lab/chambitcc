// 칭호 카드 — 획득(풀컬러+티어 글로우+장착) / 미획득(그레이+진척/힌트) / 히든
import type { TitleStatus } from '../../api/titles'
import { useLanguage } from '../../contexts/LanguageContext'
import { localizeTitle } from './titleI18n'
import { TIER_VISUALS, CATEGORY_META } from './titleVisuals'
import './TitleCard.css'

interface TitleCardProps {
  title: TitleStatus
  onToggleEquip: (title: TitleStatus) => void
  busy?: boolean
}

export const TitleCard: React.FC<TitleCardProps> = ({ title, onToggleEquip, busy }) => {
  const { t, language } = useLanguage()
  const tier = TIER_VISUALS[title.tier]
  const locked = !title.earned
  const concealed = locked && title.hidden
  const text = localizeTitle(title, language)

  const displayName = concealed ? t('titleConcealedName') : text.name
  const displayDesc = concealed ? t('titleConcealedDesc') : text.description

  const pct = title.progress && title.progress.target > 0
    ? Math.min(100, Math.round((title.progress.current / title.progress.target) * 100))
    : 0

  return (
    <div
      className={`title-card title-tier-${title.tier}${locked ? ' is-locked' : ' is-earned'}${title.equipped ? ' is-equipped' : ''}`}
      style={!locked ? ({ ['--tier-ring' as string]: tier.ring }) : undefined}
    >
      <div className="title-card-top">
        <div className="title-card-emblem" aria-hidden>
          <span className="title-card-icon">{concealed ? '🔒' : title.icon}</span>
        </div>
        <div className="title-card-headings">
          <div className="title-card-name-row">
            <h3 className="title-card-name">{displayName}</h3>
            {title.equipped && <span className="title-card-equipped-chip">{t('titleEquippedChip')}</span>}
          </div>
          <div className="title-card-meta">
            <span
              className={`title-card-tier${title.tier === 'legendary' ? ' is-legendary' : ''}`}
              style={title.tier === 'legendary' ? undefined : { background: tier.chipBg, color: tier.chipText }}
            >
              {title.tier === 'legendary' ? `★ ${t('titleTierLegendary')}` : t(tier.labelKey)}
            </span>
            <span className="title-card-cat">
              {CATEGORY_META[title.category] ? t(CATEGORY_META[title.category].labelKey) : title.category_label}
            </span>
          </div>
        </div>
      </div>

      <p className="title-card-desc">{displayDesc}</p>

      {locked ? (
        <div className="title-card-locked-foot">
          <p className="title-card-hint">{concealed ? t('titleHiddenHint') : text.hint}</p>
          {title.progress && !concealed && (
            <div className="title-card-progress">
              <div className="title-card-progress-bar">
                <div className="title-card-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="title-card-progress-text">
                {title.progress.current} / {title.progress.target}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="title-card-earned-foot">
          <span className="title-card-earned-at">
            {title.earned_at
              ? (language === 'en'
                  ? `Earned ${title.earned_at.slice(0, 10)}`
                  : `${title.earned_at.slice(0, 10)} 획득`)
              : t('titleEarnedDone')}
          </span>
          <button
            type="button"
            className={`title-card-equip-btn${title.equipped ? ' is-on' : ''}`}
            onClick={() => onToggleEquip(title)}
            disabled={busy}
          >
            {title.equipped ? t('titleUnequip') : t('titleEquip')}
          </button>
        </div>
      )}
    </div>
  )
}
