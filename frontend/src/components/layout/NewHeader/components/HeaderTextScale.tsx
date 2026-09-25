import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { FEED_TEXT_SCALES, setFeedTextScale, useFeedTextScale, type FeedTextScale } from '../../../../utils/feedTextScale'

// 버튼 글자 자체가 단계별로 커져서 "누르면 이만큼 커진다"가 설명 없이 보인다 (FeedTextScaleToggle 과 같은 문법)
const GLYPH_PX: Record<FeedTextScale, number> = { base: 16, large: 21, xlarge: 26 }

/**
 * PC(lg+) 우상단 '가' — 앱 전역 글씨 크기 3단계 (utils/feedTextScale.ts).
 * 헤더 가운데 메뉴와 부딪히지 않게 평소엔 버튼 하나로 접어 두고, 누르면 세 단계를 크게 펼친다.
 * 지금 단계가 '보통'이 아니면 버튼에 점을 찍어 "키워 둔 상태"임을 알린다.
 */
const HeaderTextScale = () => {
  const { language } = useLanguage()
  const scale = useFeedTextScale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const ko = language === 'ko'
  const names: Record<FeedTextScale, string> = ko
    ? { base: '보통', large: '크게', xlarge: '아주 크게' }
    : { base: 'Normal', large: 'Large', xlarge: 'Extra large' }
  const title = ko ? '글씨 크기' : 'Text size'

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${title} · ${names[scale]}`}
        title={title}
        className={`relative flex h-9 items-center gap-1 rounded-full px-2.5 transition-colors duration-150 ${
          open || scale !== 'base'
            ? 'bg-[var(--brand-soft)] text-brand'
            : 'text-gray-600 hover:bg-[var(--brand-soft)] hover:text-brand dark:text-white/75'
        }`}
      >
        {/* 작은 가 + 큰 가 — 글씨 크기 버튼임을 글자만으로 */}
        <span className="chrome-type-off flex items-baseline font-bold leading-none" aria-hidden>
          <span className="text-[12px]">가</span>
          <span className="text-[18px]">가</span>
        </span>
        <span className="hidden xl:inline text-[13px] font-semibold">{title}</span>
      </button>

      {open && (
        <div
          role="group"
          aria-label={title}
          className="chrome-type-off absolute right-0 top-[calc(100%_+_10px)] z-50 w-[300px] rounded-2xl border border-[var(--card-border)] bg-[var(--surface-container)] p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.28)]"
        >
          <p className="text-[15px] font-bold text-ink-strong">{title}</p>
          <p className="mt-1 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
            {ko ? '이 컴퓨터에서 글씨를 크게 봅니다' : 'Make text bigger on this computer'}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {FEED_TEXT_SCALES.map(s => {
              const active = scale === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFeedTextScale(s)}
                  aria-pressed={active}
                  className={`flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-colors duration-150 ${
                    active
                      ? 'border-brand bg-[var(--brand-soft)] text-brand'
                      : 'border-[var(--card-border)] text-gray-700 hover:border-brand hover:text-brand dark:text-white/80'
                  }`}
                >
                  <span className="font-bold leading-none" style={{ fontSize: GLYPH_PX[s] }}>
                    {ko ? '가' : 'A'}
                  </span>
                  <span className="text-[13px] font-semibold">{names[s]}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default HeaderTextScale
