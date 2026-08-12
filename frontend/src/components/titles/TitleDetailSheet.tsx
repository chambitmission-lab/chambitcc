// 칭호 상세 하단 시트 — 메달 탭 시 슬라이드업.
// 설명/획득 조건/진행률/획득일과 장착 CTA 를 여기로 모아 그리드는 메달만 남긴다.
import { createPortal } from 'react-dom'
import type { TitleStatus } from '../../api/titles'
import { useLanguage } from '../../contexts/LanguageContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { localizeTitle } from './titleI18n'
import { TIER_VISUALS, CATEGORY_META } from './titleVisuals'
import { TitleMedal } from './TitleMedal'
import './TitleDetailSheet.css'

interface TitleDetailSheetProps {
  title: TitleStatus
  onToggleEquip: (title: TitleStatus) => void
  busy?: boolean
  onClose: () => void
}

export const TitleDetailSheet: React.FC<TitleDetailSheetProps> = ({ title, onToggleEquip, busy, onClose }) => {
  const { t, language } = useLanguage()
  useModalBackButton(onClose)

  const tier = TIER_VISUALS[title.tier]
  const locked = !title.earned
  const concealed = locked && title.hidden
  const text = localizeTitle(title, language)

  const pct = title.progress && title.progress.target > 0
    ? Math.min(100, Math.round((title.progress.current / title.progress.target) * 100))
    : 0

  return createPortal(
    <div className="title-sheet-overlay" onClick={onClose}>
      <div
        className={`title-sheet title-sheet-tier-${title.tier}${locked ? ' is-locked' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="title-sheet-grabber" aria-hidden />
        <button type="button" className="title-sheet-close" onClick={onClose} aria-label={t('close')}>
          <span className="material-icons-round">close</span>
        </button>

        <div className="title-sheet-medal">
          <TitleMedal title={title} size="lg" />
        </div>

        <h3 className="title-sheet-name">{concealed ? t('titleConcealedName') : text.name}</h3>

        <div className="title-sheet-meta">
          <span
            className={`title-sheet-tier-chip${title.tier === 'legendary' ? ' is-legendary' : ''}`}
            style={title.tier === 'legendary' ? undefined : { background: tier.chipBg, color: tier.chipText }}
          >
            {title.tier === 'legendary' ? `★ ${t('titleTierLegendary')}` : t(tier.labelKey)}
          </span>
          <span className="title-sheet-cat">
            {CATEGORY_META[title.category] ? t(CATEGORY_META[title.category].labelKey) : title.category_label}
          </span>
          {title.equipped && <span className="title-sheet-equipped-chip">{t('titleEquippedChip')}</span>}
        </div>

        <p className="title-sheet-desc">{concealed ? t('titleConcealedDesc') : text.description}</p>

        {locked ? (
          <div className="title-sheet-locked-box">
            <div className="title-sheet-condition">
              <span className="material-icons-round">flag</span>
              <div>
                <span className="title-sheet-condition-label">{t('titleDetailCondition')}</span>
                <p className="title-sheet-condition-text">{concealed ? t('titleHiddenHint') : text.hint}</p>
              </div>
            </div>
            {title.progress && !concealed && (
              <div className="title-sheet-progress">
                <div className="title-sheet-progress-bar">
                  <div className="title-sheet-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="title-sheet-progress-text">
                  {title.progress.current} / {title.progress.target}
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className="title-sheet-earned-at">
            <span className="material-icons-round">verified</span>
            {title.earned_at
              ? (language === 'en' ? `Earned ${title.earned_at.slice(0, 10)}` : `${title.earned_at.slice(0, 10)} 획득`)
              : t('titleEarnedDone')}
          </span>
        )}

        <div className="title-sheet-actions">
          {locked ? (
            <button type="button" className="title-sheet-btn is-ghost" onClick={onClose}>
              {t('close')}
            </button>
          ) : (
            <button
              type="button"
              className={`title-sheet-btn${title.equipped ? ' is-ghost' : ' is-primary'}`}
              onClick={() => onToggleEquip(title)}
              disabled={busy}
            >
              {title.equipped ? t('titleUnequip') : t('titleEquip')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
