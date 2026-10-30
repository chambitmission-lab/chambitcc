import { useState, type CSSProperties, type ReactNode } from 'react'
import { HeavenLetterIcon } from '../icons/HeavenLetterIcon'
// 기도 작성 모달과 같은 Phosphor duotone 세트 — 컬러 이모지는 OS 폰트마다 생김새가 달라 톤이 흔들렸다
import { ImageIcon, PrayIcon, ThanksHandIcon } from '../../pages/Home/components/EmotionIcons'
import { useLanguage } from '../../contexts/LanguageContext'
import './SharePostcards.css'

// 나누기 다이얼 '하늘 우체국' — 기도·감사·말씀 카드를 우표 붙은 엽서로 고른다.
// PC 레일(DesktopNavRail)은 세로 엽서 부채, 모바일 도크(BottomNavigation)는 가로 엽서 더미.
// 모양은 SharePostcards.css 가 variant 로 나누고, 내용·고르기·날아가기는 여기 한 곳에 둔다.

import type { PostcardKey } from './sharePostcardsShared'

export type { PostcardKey }

// 색은 각 화면의 액센트를 그대로 가져온다(기도=브랜드, 감사=감사 스레드 핑크, 말씀 카드=우측 레일 타일의 라벤더)
const POSTCARDS = {
  prayer: {
    icon: <PrayIcon size={20} />,
    labelKey: 'railSharePrayer',
    titleKey: 'railSharePostPrayer',
    handKey: 'railSharePostPrayerHand',
    toKey: 'railSharePostPrayerTo',
    accentClass: '[--pc-accent:var(--brand)]',
  },
  thanks: {
    icon: <ThanksHandIcon size={20} />,
    labelKey: 'railShareThanks',
    titleKey: 'railSharePostThanks',
    handKey: 'railSharePostThanksHand',
    toKey: 'railSharePostThanksTo',
    accentClass: '[--pc-accent:#ec5f8f] dark:[--pc-accent:#f38cb2]',
  },
  'verse-card': {
    icon: <ImageIcon size={20} />,
    labelKey: 'railShareVerseCard',
    titleKey: 'railSharePostVerse',
    handKey: 'railSharePostVerseHand',
    toKey: 'railSharePostVerseTo',
    accentClass: '[--pc-accent:#7c66d9] dark:[--pc-accent:#b7a8f2]',
  },
} as const satisfies Record<
  PostcardKey,
  { icon: ReactNode; labelKey: string; titleKey: string; handKey: string; toKey: string; accentClass: string }
>

// PC 는 왼쪽부터 주 액션(기도), 모바일은 엄지에 가까운 맨 아래가 주 액션
const ORDER: Record<'rail' | 'dock', PostcardKey[]> = {
  rail: ['prayer', 'thanks', 'verse-card'],
  dock: ['verse-card', 'thanks', 'prayer'],
}

/** 엽서 날아가는 시간 — SharePostcards.css `share-post-fly(-up)` 과 맞춘다 */
const POSTCARD_FLY_MS = 420

interface SharePostcardsProps {
  variant: 'rail' | 'dock'
  /** 엽서가 날아간 뒤 호출 — 호출부가 다이얼을 닫고 작성 창을 연다 */
  onSend: (key: PostcardKey) => void
  /** 말씀 카드 엽서에 마우스를 올렸을 때(PC) — 라우트 청크 선요청용 */
  onVerseCardIntent?: () => void
  /** 위치 지정(absolute 등)은 호출부가 */
  className?: string
}

const SharePostcards = ({ variant, onSend, onVerseCardIntent, className = '' }: SharePostcardsProps) => {
  const { t } = useLanguage()
  // 방금 부친 엽서 — 날아가는 동안 다른 엽서는 못 누른다
  const [sentKey, setSentKey] = useState<PostcardKey | null>(null)
  // 소인 날짜 — 다이얼을 열 때마다 마운트되므로 자정을 넘겨도 맞는다
  const today = new Date()
  const postmarkDate = `${today.getMonth() + 1}.${today.getDate()}`
  const order = ORDER[variant]

  const send = (key: PostcardKey) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSend(key)
      return
    }
    navigator.vibrate?.(8)
    setSentKey(key)
    window.setTimeout(() => onSend(key), POSTCARD_FLY_MS)
  }

  return (
    <div
      role="menu"
      aria-label={t('railShareMenuAria')}
      className={`share-post share-post--${variant} ${className}`}
    >
      <p className="share-post__head">
        <HeavenLetterIcon />
        {t('railSharePostHead')}
      </p>
      {order.map((key, i) => {
        const card = POSTCARDS[key]
        return (
          <button
            key={key}
            type="button"
            role="menuitem"
            aria-label={t(card.labelKey)}
            disabled={sentKey !== null}
            onClick={() => send(key)}
            onMouseEnter={key === 'verse-card' ? onVerseCardIntent : undefined}
            className={`share-post__card ${card.accentClass}${sentKey === key ? ' is-sent' : ''}`}
            // --pc-i: 부채 자리(PC) / --pc-d: 등장 순서 — 도크는 엄지 쪽(아래)부터 올라온다
            style={{ '--pc-i': i, '--pc-d': order.length - 1 - i } as CSSProperties}
          >
            <span className="share-post__stamp" aria-hidden>
              <span className="share-post__stamp-face">{card.icon}</span>
            </span>
            <span className="share-post__postmark" aria-hidden>
              <span>{t('railSharePostmark')}</span>
              <b>{postmarkDate}</b>
            </span>
            <span className="share-post__title">{t(card.titleKey)}</span>
            <span className="share-post__hand">{t(card.handKey)}</span>
            <span className="share-post__to">{t(card.toKey)}</span>
          </button>
        )
      })}
    </div>
  )
}

export default SharePostcards
