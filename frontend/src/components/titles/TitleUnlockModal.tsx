// 칭호 해금 팝업 — B1 풀아트 칭호 카드.
// 뒷면으로 날아온 카드가 한 번 뒤집히며 칭호 그림(퍼즐 칭호) 위에 이름이 얹힌 카드가 드러난다.
// 등급은 카드 테두리 재질, 홀로그램·반사광은 손가락(포인터)을 따라 흐른다.
// 뒤집기는 3D 앞·뒷면(backface-visibility)에 기대지 않는다 — 홀로그램의 mix-blend 가 3D 를 평면으로 눌러
// 뒷면이 그림을 가리는 문제가 있어, 90° 에서 앞·뒷면을 바꿔 끼우는 2단 회전으로 만든다(CSS tuc-flip).
import { useRef } from 'react'
import { motion } from 'framer-motion'
import type { TitleStatus, TitleTier } from '../../api/titles'
import { PUZZLE_IMAGES } from '../../api/puzzles'
import { useLanguage } from '../../contexts/LanguageContext'
import { localizeTitle } from './titleI18n'
import { CATEGORY_META, TIER_VISUALS } from './titleVisuals'
import { TitleGlyph } from './TitleGlyph'
import './TitleUnlockModal.css'

interface TitleUnlockModalProps {
  title: TitleStatus
  remaining: number      // 뒤에 더 대기 중인 해금 수
  onEquip: (title: TitleStatus) => void
  onClose: () => void
}

/** 카드 전용 등급 토큰 — 테두리 재질·어두운 면 위 글자색·후광·홀로그램 세기 */
const CARD_TIER: Record<TitleTier, { frame: string; text: string; glow: string; holo: number }> = {
  bronze: {
    frame: 'linear-gradient(135deg, #8d5524, #cd7f32 30%, #f0b27a 52%, #cd7f32 72%, #a05f2c)',
    text: '#f0b27a', glow: 'rgba(240, 178, 122, 0.4)', holo: 0.22,
  },
  silver: {
    frame: 'linear-gradient(135deg, #64748b, #94a3b8 30%, #eef2f7 52%, #94a3b8 72%, #7c8aa0)',
    text: '#d3dce7', glow: 'rgba(200, 214, 230, 0.45)', holo: 0.32,
  },
  gold: {
    frame: 'linear-gradient(135deg, #b45309, #f59e0b 30%, #fde68a 52%, #f59e0b 72%, #d97706)',
    text: '#f6c453', glow: 'rgba(246, 196, 83, 0.5)', holo: 0.45,
  },
  legendary: {
    frame: 'conic-gradient(from 210deg, #fde68a, #93c5fd, #c4b5fd, #fbcfe8, #a7f3d0, #fde68a)',
    text: '#ffe39a', glow: 'rgba(255, 227, 154, 0.6)', holo: 0.75,
  },
}

const PUZZLE_KEYS = Object.keys(PUZZLE_IMAGES)
const PUZZLE_PREFIX = 'puzzle_'
const MASTER_KEY = 'puzzle_master'

/** 칭호 그림 — 퍼즐 칭호는 퍼즐 그림, 마스터는 아홉 퍼즐 모자이크, 나머지는 null(선화 기본 카드) */
const artFor = (key: string): { src?: string; mosaic?: string[]; index?: number } | null => {
  if (key === MASTER_KEY) return { mosaic: PUZZLE_KEYS.slice(0, 9).map((k) => PUZZLE_IMAGES[k]) }
  if (!key.startsWith(PUZZLE_PREFIX)) return null
  const pk = key.slice(PUZZLE_PREFIX.length)
  const src = PUZZLE_IMAGES[pk]
  return src ? { src, index: PUZZLE_KEYS.indexOf(pk) } : null
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const todayDots = () => {
  const d = new Date()
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
}

export const TitleUnlockModal: React.FC<TitleUnlockModalProps> = ({
  title, remaining, onEquip, onClose,
}) => {
  const { t, language } = useLanguage()
  const text = localizeTitle(title, language)
  const tierLabel = t(TIER_VISUALS[title.tier].labelKey)
  const card = CARD_TIER[title.tier]
  const art = artFor(title.key)
  const categoryLabel = t(CATEGORY_META[title.category]?.labelKey ?? 'titleCatPuzzle')
  const total = PUZZLE_KEYS.length
  const serial = title.key === MASTER_KEY
    ? `${categoryLabel} ${total} / ${total}`
    : art?.index !== undefined && art.index >= 0
      ? `${categoryLabel} ${pad2(art.index + 1)} / ${pad2(total)}`
      : categoryLabel
  // 배경 분위기 — 그림이 있으면 그 그림을 흐리게, 없으면 등급 재질을 흐리게
  const ambient = art?.src ?? art?.mosaic?.[art.mosaic.length - 1]

  // 기울이기 — 리렌더 없이 CSS 변수만 바꾼다
  const tiltRef = useRef<HTMLDivElement>(null)
  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    el.classList.remove('is-idle')
    el.style.setProperty('--tuc-ry', `${(x - 0.5) * 30}deg`)
    el.style.setProperty('--tuc-rx', `${(0.5 - y) * 24}deg`)
    el.style.setProperty('--tuc-px', `${x * 100}%`)
    el.style.setProperty('--tuc-py', `${y * 100}%`)
  }
  const handleLeave = () => {
    const el = tiltRef.current
    if (!el) return
    el.style.setProperty('--tuc-ry', '0deg')
    el.style.setProperty('--tuc-rx', '0deg')
  }

  const tierStyle = {
    '--tuc-frame': card.frame,
    '--tuc-tier-text': card.text,
    '--tuc-glow': card.glow,
    '--tuc-holo': card.holo,
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
      aria-label={`${tierLabel} ${t('titleUnlockCardEyebrow')}: ${text.name}`}
    >
      <div
        className={`tuc-ambient${ambient ? '' : ' is-plain'}`}
        style={ambient ? { backgroundImage: `url(${ambient})` } : undefined}
        aria-hidden
      />

      <div className="tuc-stage" onClick={(e) => e.stopPropagation()}>
        <p className="tuc-eyebrow tuc-fu" style={{ '--tuc-d': '1.5s' } as React.CSSProperties}>
          <b>{tierLabel}</b> {t('titleUnlockCardEyebrow')}
        </p>

        <div
          ref={tiltRef}
          className="tuc-tilt is-idle"
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
        >
          <div className="tuc-tilt-inner">
            <div className="tuc-flip">
              <div className="tuc-face tuc-back" aria-hidden>
                <svg viewBox="0 0 48 48" className="tuc-back-mark">
                  <path d="M24 6v36M10 18h28" />
                  <circle cx="24" cy="18" r="13" opacity=".5" />
                </svg>
              </div>

              <div className="tuc-face tuc-front">
                <div className="tuc-front-in">
                  {art?.src && <img className="tuc-art" src={art.src} alt="" draggable={false} />}
                  {art?.mosaic && (
                    <div className="tuc-mosaic">
                      {art.mosaic.map((src) => <img key={src} src={src} alt="" draggable={false} />)}
                    </div>
                  )}
                  {!art && (
                    <div className="tuc-plain">
                      <TitleGlyph titleKey={title.key} fallback={title.icon} className="tuc-plain-glyph" />
                    </div>
                  )}
                  <div className="tuc-shade" />
                  <span className="tuc-serial">{serial}</span>
                  <span className="tuc-tier">{tierLabel}</span>
                  <div className="tuc-text">
                    <h2 className="tuc-name">{text.name}</h2>
                    <span className="tuc-meta">{todayDots()}</span>
                  </div>
                  <div className="tuc-holo" />
                  <div className="tuc-glare" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="tuc-desc tuc-fu" style={{ '--tuc-d': '1.75s' } as React.CSSProperties}>
          {text.description}
        </p>

        <div className="tuc-actions tuc-fu" style={{ '--tuc-d': '1.95s' } as React.CSSProperties}>
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
