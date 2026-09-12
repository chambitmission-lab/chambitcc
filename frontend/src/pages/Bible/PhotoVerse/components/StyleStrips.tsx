// 필터·프리셋 선택 스트립 — 내 사진과 말씀으로 실제로 그린 썸네일.

import { useEffect, useRef } from 'react'
import type { PickedVerse } from '../recommendedVerses'
import { CARD_PRESETS } from '../cardPresets'
import type { CardPreset } from '../cardPresets'
import { CARD_FILTERS, createCardCanvas, drawFilterThumb, drawVerseCard } from '../photoVerseCanvas'
import type { VerseCardStyle } from '../photoVerseCanvas'
import { DEFAULT_CARD_STYLE } from '../photoVerseCanvas'

// 프리셋 썸네일 — CSS 84px 폭에 2배 해상도. 카드 구도가 그대로 축소돼 보인다
const PRESET_THUMB_SIDE = 210

/** 필터 선택 스트립 — 내 사진에 각 필터를 입힌 실제 미리보기 썸네일 */
const FilterStrip = ({
  img,
  active,
  language,
  onSelect,
}: {
  img: HTMLImageElement
  active: VerseCardStyle['filter']
  language: string
  onSelect: (id: VerseCardStyle['filter']) => void
}) => {
  const thumbRefs = useRef<Record<string, HTMLCanvasElement | null>>({})

  useEffect(() => {
    for (const f of CARD_FILTERS) {
      const canvas = thumbRefs.current[f.id]
      if (canvas) drawFilterThumb(canvas, img, f.id)
    }
  }, [img])

  return (
    <div className="pv-filters" role="radiogroup" aria-label="필터">
      {CARD_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="radio"
          aria-checked={active === f.id}
          className={`pv-filter${active === f.id ? ' pv-filter--active' : ''}`}
          onClick={() => onSelect(f.id)}
        >
          <canvas
            ref={(el) => {
              thumbRefs.current[f.id] = el
            }}
            width={96}
            height={96}
            className="pv-filter__thumb"
          />
          <span className="pv-filter__name">{language === 'ko' ? f.nameKo : f.nameEn}</span>
        </button>
      ))}
    </div>
  )
}

/** 프리셋 스트립 — 내 사진과 말씀으로 각 룩을 실제로 그린 썸네일. 한 탭에 완성된 카드가 나온다 */
const PresetStrip = ({
  img,
  verse,
  baseColor,
  lang,
  language,
  active,
  fontsReady,
  onSelect,
}: {
  img: HTMLImageElement
  verse: PickedVerse
  baseColor: string
  lang: 'ko' | 'en'
  language: string
  active: string | null
  fontsReady: number
  onSelect: (preset: CardPreset) => void
}) => {
  const thumbRefs = useRef<Record<string, HTMLCanvasElement | null>>({})

  useEffect(() => {
    for (const p of CARD_PRESETS) {
      const canvas = thumbRefs.current[p.id]
      if (!canvas) continue
      const style: VerseCardStyle = {
        ...DEFAULT_CARD_STYLE,
        ...p.style,
        color: p.style.color ?? baseColor,
        lang,
        ratio: '4:5',
      }
      const sized = createCardCanvas(img, PRESET_THUMB_SIDE, style.frame, '4:5')
      if (canvas.width !== sized.width || canvas.height !== sized.height) {
        canvas.width = sized.width
        canvas.height = sized.height
      }
      drawVerseCard(canvas, img, verse.text, verse.refLabel, style)
    }
  }, [img, verse, baseColor, lang, fontsReady])

  return (
    <div className="pv-presets" role="radiogroup" aria-label="스타일">
      {CARD_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={active === p.id}
          className={`pv-preset${active === p.id ? ' pv-preset--active' : ''}`}
          onClick={() => onSelect(p)}
        >
          <span className="pv-preset__frame">
            <canvas
              ref={(el) => {
                thumbRefs.current[p.id] = el
              }}
              className="pv-preset__thumb"
            />
          </span>
          <span className="pv-preset__name">{language === 'ko' ? p.nameKo : p.nameEn}</span>
        </button>
      ))}
    </div>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { FilterStrip, PresetStrip }
