import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { GLOW_LEVELS, type GlowLevel } from '../../../types/achievement'
import { useLanguage } from '../../../contexts/LanguageContext'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import './LevelUpMoment.css'

// 큰 숫자·레벨 이름은 주간 스토리와 같은 Black Han Sans — 이 화면 모듈이 로드될 때만 내려받는다
void ensureFontFamily('blackHanSans')

interface LevelUpMomentProps {
  level: GlowLevel
  /** 다음 등불까지 남은 점수. 최고 레벨이면 null */
  pointsToNext: number | null
  onClose: () => void
}

/**
 * 레벨마다 색면(face) 색. glowColor 는 후광용이라 그대로 깔면 6단계(흰색)처럼
 * 흰 글씨가 묻히거나 0단계(회색 30%)처럼 너무 옅다. 흰 글씨가 또렷한 중간 깊이로 고정.
 */
const LEVEL_FACE: Record<number, string> = {
  0: '#6b7684',
  1: '#d97706',
  2: '#ea580c',
  3: '#dc2626',
  4: '#9333ea',
  5: '#2563eb',
  6: '#4f6b9a',
  7: '#b7791f',
  8: '#ec4899',
  9: '#0891b2',
  10: '#059669',
}

/** 색면이 더 깊어지는 그림자(외곽선 두 번째 겹·띠 글자색) */
const LEVEL_DEEP: Record<number, string> = {
  0: '#3f4752',
  1: '#92400e',
  2: '#9a3412',
  3: '#991b1b',
  4: '#6b21a8',
  5: '#1e40af',
  6: '#2f4468',
  7: '#854d0e',
  8: '#b4145f',
  9: '#155e75',
  10: '#065f46',
}

/** PC 왼쪽 등불 목록 — 현재 레벨 앞 둘·뒤 하나(끝에서는 4칸 유지) */
const sideWindow = (level: number): GlowLevel[] => {
  const idx = GLOW_LEVELS.findIndex((l) => l.level === level)
  const start = Math.max(0, Math.min(idx - 2, GLOW_LEVELS.length - 4))
  return GLOW_LEVELS.slice(start, start + 4)
}

/**
 * 레벨업 축하 모먼트 — 등불이 한 단계 오르는 순간의 전면 연출(주간 스토리 "키네틱" 결).
 * 레벨 색면 위로 큰 숫자가 리소 인쇄처럼 흰 외곽선 두 겹과 어긋나게 찍히고,
 * 이름이 튀어오른 뒤 흰 띠가 사선으로 흐른다. 모바일은 화면 전체, PC(lg+)는
 * 흐려진 프로필 위에 9:16 카드 + 왼쪽 등불 목록. 아무 곳이나 탭하면 닫힘.
 */
const LevelUpMoment = ({ level, pointsToNext, onClose }: LevelUpMomentProps) => {
  const { t } = useLanguage()
  const face = LEVEL_FACE[level.level] ?? '#ec4899'
  const deep = LEVEL_DEEP[level.level] ?? '#b4145f'
  const name = t(level.nameKey)
  const tapeLine = `${name} ✦ LEVEL ${level.level} ✦ ${t('levelUpTapeLine')} ✦ `

  useBodyScrollLock()
  useModalBackButton(onClose)

  return (
    <div
      className="lum-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${t('levelUpKicker')} ${name}`}
      style={{ '--lum-face': face, '--lum-deep': deep } as React.CSSProperties}
      onClick={onClose}
    >
      {/* PC: 왼쪽 등불 목록 */}
      <aside className="lum-side" aria-label={t('lampTitle')} onClick={(e) => e.stopPropagation()}>
        <div className="lum-side-eye">{t('lampTitle')}</div>
        {sideWindow(level.level).map((l) => (
          <div key={l.level} className={`lum-side-row${l.level === level.level ? ' is-on' : ''}`}>
            <i aria-hidden="true" />
            {t(l.nameKey)}
          </div>
        ))}
        <button type="button" className="lum-side-close" onClick={onClose}>
          {t('close')}
        </button>
      </aside>

      <div className="lum-card">
        <div className="lum-bar" aria-hidden="true">
          <i />
        </div>
        <div className="lum-top">
          <span>{t('lampTitle')}</span>
          <button type="button" className="lum-x" aria-label={t('close')} onClick={onClose}>
            ×
          </button>
        </div>

        <div className="lum-scene">
          <div className="lum-kicker">{t('levelUpKicker')}</div>
          <div className="lum-big" data-n={level.level}>
            {level.level}
          </div>
          <div className="lum-lv">LEVEL UP</div>
          <div className="lum-name">{name}</div>
          <div className="lum-sub">{t('levelUpReached')}</div>
          <div className="lum-tape" aria-hidden="true">
            <span>{tapeLine}</span>
            <span>{tapeLine}</span>
          </div>
        </div>

        <div className="lum-pill">
          {pointsToNext === null ? (
            <span>{t('levelUpMax')}</span>
          ) : (
            <>
              <span>{t('levelUpNextLabel')}</span>
              <span>
                {pointsToNext.toLocaleString()}
                {t('levelUpPointUnit')}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="lum-side lum-side-r" aria-hidden="true" />
    </div>
  )
}

export default LevelUpMoment
