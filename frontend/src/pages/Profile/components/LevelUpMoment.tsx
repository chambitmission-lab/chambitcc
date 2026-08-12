import { useEffect } from 'react'
import type { GlowLevel } from '../../../types/achievement'
import { getReadableTextStyle, toOpaqueColor } from '../../../utils/contrastText'
import { useLanguage } from '../../../contexts/LanguageContext'
import './LevelUpMoment.css'

interface LevelUpMomentProps {
  level: GlowLevel
  onClose: () => void
}

/**
 * 레벨업 축하 모먼트 — 신앙의 온도가 한 단계 오르는 순간의 전면 연출.
 * 로그인 마중 모먼트와 같은 결: 새 레벨의 glow 색이 화면 중앙에서 번지고,
 * 뱃지 → 이름 → 문구가 순차로 떠오른다. 아무 곳이나 탭하면 닫힘.
 */
const LevelUpMoment = ({ level, onClose }: LevelUpMomentProps) => {
  const { t } = useLanguage()
  const badgeText = getReadableTextStyle(level.glowColor)

  // 배경 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div
      className="lum-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('levelUpHeadline')}
      onClick={onClose}
    >
      <div
        className="lum-glow"
        style={{
          background: `radial-gradient(circle, ${level.glowColor} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
      <div className="lum-content">
        <span className="lum-eyebrow">{t('levelTitle')}</span>
        <div
          className="lum-badge"
          style={{
            backgroundColor: toOpaqueColor(level.glowColor),
            boxShadow: `0 0 32px ${level.glowColor}`,
            color: badgeText.color,
            textShadow: badgeText.textShadow,
          }}
        >
          Lv.{level.level}
        </div>
        <div className="lum-name">{t(level.nameKey)}</div>
        <p className="lum-headline">{t('levelUpHeadline')}</p>
        <p className="lum-sub">{t('levelUpSub')}</p>
        <span className="lum-hint">{t('levelUpTap')}</span>
      </div>
    </div>
  )
}

export default LevelUpMoment
