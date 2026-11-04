import type { Language } from '../../../../locales'
import { FilterStrip } from './StyleStrips'
import { LayoutGlyph } from './LayoutGlyph'
import { CARD_LAYOUTS, getSeasonStamp } from '../photoVerseCanvas'
import type { CardRatioId, CardTextBg, CardTextureId, VerseCardStyle } from '../photoVerseCanvas'
import type { PhotoVerseTexts } from '../texts'

const COLOR_SWATCHES = [
  '#ffffff',
  '#fff3d6', // 아이보리
  '#ffd166', // 앰버
  '#a7d8ff', // 하늘
  '#b9f0c9', // 연두
  '#ffb3c1', // 로즈
  '#111111',
]

interface DetailControlsProps {
  t: PhotoVerseTexts
  language: Language
  lang: 'ko' | 'en'
  img: HTMLImageElement
  style: VerseCardStyle
  /** 프리셋에서 벗어난 '나만의 조합'이 되는 부분 변경 */
  onPartial: (patch: Partial<VerseCardStyle>) => void
  onToggleTexture: (id: CardTextureId) => void
  onPickTextBg: (bg: CardTextBg) => void
  onPickRatio: (r: CardRatioId) => void
  /** 글자 크기 슬라이더 — 프리셋 상태는 건드리지 않는다 */
  onFontScale: (scale: number) => void
}

/** 세부 조정 패널 — 레이아웃·필터·색·서체·정렬·글 배경·프레임·비율·질감·글자 크기 */
const DetailControls = ({
  t,
  language,
  lang,
  img,
  style,
  onPartial,
  onToggleTexture,
  onPickTextBg,
  onPickRatio,
  onFontScale,
}: DetailControlsProps) => {
  const seasonStamp = getSeasonStamp(lang)
  const textBgOptions: CardTextBg[] =
    style.layout === 'classic' ? ['none', 'soft', 'scrim', 'marker'] : ['none', 'soft']

  return (
    <div className="pv-details">
      {/* 레이아웃 — 옵션 조합이 아니라 디자이너가 완성한 구도를 고른다 */}
      <div className="pv-layouts" role="radiogroup" aria-label={t.layoutTitle}>
        {CARD_LAYOUTS.map((lay) => (
          <button
            key={lay.id}
            type="button"
            role="radio"
            aria-checked={style.layout === lay.id}
            className={`pv-layout${style.layout === lay.id ? ' pv-layout--active' : ''}`}
            onClick={() => onPartial({ layout: lay.id })}
          >
            <span className="pv-layout__thumb">
              <LayoutGlyph id={lay.id} />
            </span>
            <span className="pv-layout__name">{language === 'ko' ? lay.nameKo : lay.nameEn}</span>
          </button>
        ))}
      </div>

      <FilterStrip img={img} active={style.filter} language={language} onSelect={(filter) => onPartial({ filter })} />

      <div className="pv-swatches" role="radiogroup" aria-label="색상">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={style.color === c}
            className={`pv-swatch${style.color === c ? ' pv-swatch--active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onPartial({ color: c })}
          />
        ))}
      </div>

      <div className="pv-control-row">
        <div className="pv-seg" role="radiogroup" aria-label="서체">
          {(['serif', 'sans', 'hand', 'brush'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={style.fontFamily === f}
              className={`pv-seg__item${style.fontFamily === f ? ' pv-seg__item--active' : ''}`}
              onClick={() => onPartial({ fontFamily: f })}
            >
              {t.font[f]}
            </button>
          ))}
        </div>

        {style.layout === 'classic' && (
          <div className="pv-seg" role="radiogroup" aria-label={t.alignLabel}>
            {(
              [
                ['left', 'format_align_left'],
                ['center', 'format_align_center'],
                ['right', 'format_align_right'],
              ] as const
            ).map(([a, icon]) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={style.align === a}
                className={`pv-seg__item${style.align === a ? ' pv-seg__item--active' : ''}`}
                onClick={() => onPartial({ align: a })}
              >
                <span className="material-icons-round text-[18px]">{icon}</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          aria-pressed={style.showRef}
          className={`pv-toggle${style.showRef ? ' pv-toggle--active' : ''}`}
          onClick={() => onPartial({ showRef: !style.showRef })}
        >
          {t.ref}
        </button>

        <button
          type="button"
          aria-pressed={style.signature}
          className={`pv-toggle${style.signature ? ' pv-toggle--active' : ''}`}
          onClick={() => onPartial({ signature: !style.signature })}
        >
          {t.signature}
        </button>
      </div>

      {/* 글 배경 — 은은한 스크림 / 반투명 박스 / 성경 밑줄 긋듯 형광펜(자유 레이아웃 전용) */}
      <div className="pv-control-row">
        <div className="pv-seg" role="radiogroup" aria-label={t.textBgLabel}>
          {textBgOptions.map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={style.textBg === b}
              className={`pv-seg__item${style.textBg === b ? ' pv-seg__item--active' : ''}`}
              onClick={() => onPickTextBg(b)}
            >
              {t.textBg[b]}
            </button>
          ))}
        </div>
      </div>

      {/* 프레임 — 절기는 교회력 스탬프, 폴라로이드는 손글씨 출처, 필름은 날짜 스탬프 */}
      <div className="pv-control-row">
        <div className="pv-seg" role="radiogroup" aria-label={t.frameLabel}>
          {(['none', 'season', 'polaroid', 'film'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={style.frame === f}
              className={`pv-seg__item${style.frame === f ? ' pv-seg__item--active' : ''}`}
              onClick={() => onPartial({ frame: f })}
            >
              {t.frame[f]}
            </button>
          ))}
        </div>
      </div>
      {/* 지금 이 절기에만 찍히는 스탬프 — 한정판의 이유를 알려준다 */}
      {style.frame === 'season' && (
        <p className="pv-season-note">
          <span className="material-icons-round text-[13px]">auto_awesome</span>
          {seasonStamp.label} · {seasonStamp.year}
        </p>
      )}

      {/* 비율 — 공유할 곳에 맞춘 센터 크롭 */}
      <div className="pv-control-row">
        <div className="pv-seg" role="radiogroup" aria-label={t.ratioLabel}>
          {(['original', '1:1', '4:5', '9:16'] as const).map((r: CardRatioId) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={style.ratio === r}
              className={`pv-seg__item${style.ratio === r ? ' pv-seg__item--active' : ''}`}
              onClick={() => onPickRatio(r)}
            >
              {t.ratio[r]}
            </button>
          ))}
        </div>
      </div>

      {/* 질감 — 필름의 물성. 여러 개를 겹칠 수 있다 */}
      <div className="pv-control-row" role="group" aria-label={t.textureLabel}>
        {(['grain', 'leak', 'vignette', 'stamp'] as const).map((tx) => (
          <button
            key={tx}
            type="button"
            aria-pressed={style.textures.includes(tx)}
            className={`pv-toggle${style.textures.includes(tx) ? ' pv-toggle--active' : ''}`}
            onClick={() => onToggleTexture(tx)}
          >
            {t.texture[tx]}
          </button>
        ))}
      </div>

      <div className="pv-slider-row">
        <span className="pv-slider-label pv-slider-label--small">가</span>
        <input
          type="range"
          min={0.03}
          max={0.09}
          step={0.002}
          value={style.fontScale}
          aria-label={t.size}
          onChange={(e) => onFontScale(Number(e.target.value))}
          className="pv-slider"
        />
        <span className="pv-slider-label pv-slider-label--big">가</span>
      </div>
    </div>
  )
}

export default DetailControls
