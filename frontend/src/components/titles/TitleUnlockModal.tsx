// 칭호 해금 팝업 — E안 '기록 카드' (2026-11-21, 옛 B1 풀아트 게임 카드 교체).
// 벤치마킹: Strava·나이키 런 클럽 업적(기록으로 축하), 스팀 희귀 업적(몇 % 가 받았나), 디스코드 프로필 미리보기.
// 위: 칭호 커버 삽화(title-bg, 프로필 배너와 같은 그림) + 등급 테두리 배지
// 가운데: 받은 시각 · 몇 번째 · 받은 성도 비율(rarity, 구버전 백엔드면 등급·분류로 대신) + 설명
// 아래: "프로필에 달면 이렇게 보여요" 미리보기 → 프로필에 달기
import { motion } from 'framer-motion'
import type { TitleRarity, TitleStatus, TitleTier } from '../../api/titles'
import { useLanguage } from '../../contexts/LanguageContext'
import { useMyIdentity } from '../../hooks/useProfile'
import { parseApiDate } from '../../utils/date'
import { localizeTitle } from './titleI18n'
import { CATEGORY_META, TIER_VISUALS } from './titleVisuals'
import { TitleGlyph } from './TitleGlyph'
import { titleBackdropPosition, titleBackdropSrc } from './TitleBackdrop'
import './TitleUnlockModal.css'

interface TitleUnlockModalProps {
  title: TitleStatus
  remaining: number      // 뒤에 더 대기 중인 해금 수
  onEquip: (title: TitleStatus) => void
  onClose: () => void
}

/** 기록 카드 등급 토큰 — 배지 테두리 재질·어두운 면 위 글자색 */
const CARD_TIER: Record<TitleTier, { c: string; soft: string; ring: string }> = {
  bronze: { c: '#cd7f32', soft: '#f0b27a', ring: 'linear-gradient(135deg, #8d5524, #cd7f32 35%, #f0b27a 55%, #a05f2c)' },
  silver: { c: '#94a3b8', soft: '#dbe3ee', ring: 'linear-gradient(135deg, #64748b, #94a3b8 35%, #eef2f7 55%, #7c8aa0)' },
  gold: { c: '#f59e0b', soft: '#fcd77a', ring: 'linear-gradient(135deg, #b45309, #f59e0b 35%, #fde68a 55%, #d97706)' },
  legendary: { c: '#e7b54a', soft: '#ffe39a', ring: 'conic-gradient(from 210deg, #fde68a, #93c5fd, #fbcfe8, #a7f3d0, #fde68a)' },
}

const rarityPercent = (r: TitleRarity | undefined): number | null => {
  if (!r || r.member_count <= 0) return null
  return Math.min(100, Math.max(1, Math.round((r.holder_count / r.member_count) * 100)))
}

export const TitleUnlockModal: React.FC<TitleUnlockModalProps> = ({
  title, remaining, onEquip, onClose,
}) => {
  const { t, language } = useLanguage()
  const { avatarUrl, displayName } = useMyIdentity()
  const text = localizeTitle(title, language)
  const tierLabel = t(TIER_VISUALS[title.tier].labelKey)
  const categoryLabel = t(CATEGORY_META[title.category]?.labelKey ?? 'titleCatPattern')
  const tier = CARD_TIER[title.tier]
  const art = titleBackdropSrc(title.key)
  const artPos = titleBackdropPosition(title.key)
  const ko = language === 'ko'

  const earnedAt = title.earned_at ? parseApiDate(title.earned_at) : new Date()
  const timeText = earnedAt.toLocaleTimeString(ko ? 'ko-KR' : 'en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' })
  const pct = rarityPercent(title.rarity)
  const stats: Array<{ label: string; value: string }> = [
    { label: t('titleUnlockStatTime'), value: timeText },
    title.rarity
      ? { label: t('titleUnlockStatRank'), value: t('titleUnlockRankValue').replace('{n}', String(title.rarity.holder_rank)) }
      : { label: t('titleUnlockStatTier'), value: tierLabel },
    pct !== null
      ? { label: t('titleUnlockStatHolders'), value: `${pct}%` }
      : { label: t('titleUnlockStatCategory'), value: categoryLabel },
  ]
  const eyebrow = title.hidden ? t('titleUnlockHiddenEyebrow') : t('titleUnlockNewEyebrow')
  const name = displayName || t('titleUnlockPreviewYou')

  const tierStyle = {
    '--tuc-c': tier.c,
    '--tuc-soft': tier.soft,
    '--tuc-ring': tier.ring,
    ...(artPos ? { '--tuc-pos': artPos } : null),
  } as React.CSSProperties

  return (
    <motion.div
      className="tuc-overlay"
      style={tierStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${eyebrow} · ${tierLabel}: ${text.name}`}
    >
      <div className={`tuc-sheet${title.tier === 'legendary' ? ' is-legendary' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="tuc-scroll">
          <div className={`tuc-hero${art ? '' : ' is-plain'}`}>
            {art ? (
              <img className="tuc-hero-img" src={art} alt="" draggable={false} decoding="async" />
            ) : (
              <TitleGlyph titleKey={title.key} fallback={title.icon} className="tuc-hero-glyph" />
            )}
            <div className="tuc-badge" aria-hidden>
              <div className="tuc-badge-in">
                {art
                  ? <img src={art} alt="" draggable={false} />
                  : <TitleGlyph titleKey={title.key} fallback={title.icon} className="tuc-badge-glyph" />}
              </div>
            </div>
          </div>

          <div className="tuc-body">
            <p className="tuc-eyebrow tuc-fu" style={{ '--tuc-d': '0.75s' } as React.CSSProperties}>
              <span>{eyebrow}</span> · <span>{tierLabel}</span>
            </p>
            <h2 className="tuc-name tuc-fu" style={{ '--tuc-d': '0.85s' } as React.CSSProperties}>{text.name}</h2>

            <dl className="tuc-stats">
              {stats.map((s, i) => (
                <div key={s.label} className="tuc-fu" style={{ '--tuc-d': `${1 + i * 0.1}s` } as React.CSSProperties}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>

            <p className="tuc-desc tuc-fu" style={{ '--tuc-d': '1.35s' } as React.CSSProperties}>{text.description}</p>

            <div className="tuc-preview tuc-fu" style={{ '--tuc-d': '1.5s' } as React.CSSProperties}>
              <div className="tuc-pv-avatar" aria-hidden>
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{name.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="tuc-pv-main">
                <div className="tuc-pv-name">{name}</div>
                <span className="tuc-pv-chip">
                  <TitleGlyph titleKey={title.key} fallback={title.icon} className="tuc-pv-glyph" />
                  {text.name}
                </span>
              </div>
              <span className="tuc-pv-label">{t('titleUnlockPreviewLabel')}</span>
            </div>
          </div>
        </div>

        <div className="tuc-actions tuc-fu" style={{ '--tuc-d': '1.6s' } as React.CSSProperties}>
          <button type="button" className="tuc-later" onClick={onClose}>
            {remaining > 0 ? `${t('titleUnlockNext')} (${remaining})` : t('titleUnlockLater')}
          </button>
          <button type="button" className="tuc-equip" onClick={() => onEquip(title)}>
            {t('titleUnlockEquipNow')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
