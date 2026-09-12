// 인트로 예시 카드 — 감성 배경 위에 오늘의 말씀을 실제로 그려 보여준다.

import { useEffect, useRef } from 'react'
import type { PickedVerse } from '../recommendedVerses'
import { CARD_PRESETS, INTRO_SAMPLES } from '../cardPresets'
import type { CardPreset } from '../cardPresets'
import { BACKGROUNDS, backgroundCss, createBackgroundImage, createCardCanvas, drawVerseCard } from '../photoVerseCanvas'
import type { VerseBackground, VerseCardStyle } from '../photoVerseCanvas'
import { DEFAULT_CARD_STYLE } from '../photoVerseCanvas'

// 인트로 예시 카드 — CSS 156px 폭에 2배 해상도
const SAMPLE_SIDE = 390

/** 인트로 예시 카드 — 감성 배경 위에 오늘의 말씀을 실제로 그려 "이런 카드가 나온다"를 보여준다 */
const IntroSamples = ({
  verse,
  lang,
  fontsReady,
  onPick,
}: {
  verse: PickedVerse
  lang: 'ko' | 'en'
  fontsReady: number
  onPick: (bg: VerseBackground, preset: CardPreset) => void
}) => {
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({})

  useEffect(() => {
    let cancelled = false
    for (const s of INTRO_SAMPLES) {
      const bg = BACKGROUNDS.find((b) => b.id === s.bgId)
      const preset = CARD_PRESETS.find((p) => p.id === s.presetId)
      if (!bg || !preset) continue
      createBackgroundImage(bg)
        .then((img) => {
          if (cancelled) return
          const canvas = refs.current[`${s.bgId}-${s.presetId}`]
          if (!canvas) return
          const style: VerseCardStyle = {
            ...DEFAULT_CARD_STYLE,
            ...preset.style,
            color: preset.style.color ?? bg.textColor,
            lang,
            ratio: '4:5',
          }
          const sized = createCardCanvas(img, SAMPLE_SIDE, style.frame, '4:5')
          if (canvas.width !== sized.width || canvas.height !== sized.height) {
            canvas.width = sized.width
            canvas.height = sized.height
          }
          drawVerseCard(canvas, img, verse.text, verse.refLabel, style)
          canvas.classList.add('pv-sample__thumb--ready')
        })
        .catch(() => {
          /* 배경 생성 실패 — 예시 카드 하나가 비어 보일 뿐 */
        })
    }
    return () => {
      cancelled = true
    }
  }, [verse, lang, fontsReady])

  return (
    <div className="pv-samples">
      {INTRO_SAMPLES.map((s) => {
        const bg = BACKGROUNDS.find((b) => b.id === s.bgId)
        const preset = CARD_PRESETS.find((p) => p.id === s.presetId)
        if (!bg || !preset) return null
        return (
          <button
            key={`${s.bgId}-${s.presetId}`}
            type="button"
            className="pv-sample"
            aria-label={`${lang === 'ko' ? bg.nameKo : bg.nameEn} · ${lang === 'ko' ? preset.nameKo : preset.nameEn}`}
            onClick={() => onPick(bg, preset)}
          >
            <span className="pv-sample__frame" style={{ background: backgroundCss(bg) }}>
              <canvas
                ref={(el) => {
                  refs.current[`${s.bgId}-${s.presetId}`] = el
                }}
                className="pv-sample__thumb"
              />
            </span>
            <span className="pv-sample__name">{lang === 'ko' ? preset.nameKo : preset.nameEn}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { IntroSamples }
