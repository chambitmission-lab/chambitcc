import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import VersePickerSheet from './VersePickerSheet'
import type { PickedVerse } from './VersePickerSheet'
import {
  BACKGROUNDS,
  CARD_FILTERS,
  DEFAULT_CARD_STYLE,
  backgroundCss,
  createBackgroundImage,
  createCardCanvas,
  drawFilterThumb,
  drawVerseCard,
  ensureCardFonts,
} from './photoVerseCanvas'
import type { VerseBackground, VerseCardStyle } from './photoVerseCanvas'
import './PhotoVerse.css'

// 미리보기는 화면용으로 캡, 저장본은 원본 해상도(최대 2048px)로 다시 그린다
const PREVIEW_MAX_SIDE = 1280
const EXPORT_MAX_SIDE = 2048

const COLOR_SWATCHES = [
  '#ffffff',
  '#fff3d6', // 아이보리
  '#ffd166', // 앰버
  '#a7d8ff', // 하늘
  '#b9f0c9', // 연두
  '#ffb3c1', // 로즈
  '#111111',
]

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

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

const PhotoVerse = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const [photo, setPhoto] = useState<{ url: string; img: HTMLImageElement } | null>(null)
  const [bgId, setBgId] = useState<string | null>(null)
  const [verse, setVerse] = useState<PickedVerse | null>(null)
  const [style, setStyle] = useState<VerseCardStyle>(DEFAULT_CARD_STYLE)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; origin: { x: number; y: number } } | null>(null)

  const texts = {
    ko: {
      title: '말씀 사진 카드',
      introHeadline: '내 사진 위에\n말씀을 담아보세요',
      introBody: '갤러리에서 사진을 고르고 마음에 새기고 싶은 말씀을 올려 나만의 말씀 카드를 만들 수 있어요.',
      privacy: '사진은 서버로 전송되지 않고 내 기기 안에서만 처리돼요.',
      pickPhoto: '사진 선택하기',
      noPhotoTitle: '사진이 없어도 괜찮아요',
      noPhotoBody: '감성 배경을 골라 바로 시작해보세요',
      changePhoto: '사진 바꾸기',
      changeVerse: '말씀 바꾸기',
      pickVerse: '말씀 고르기',
      dragHint: '사진을 드래그해 말씀 위치를 옮길 수 있어요',
      save: '저장',
      share: '공유',
      saving: '만드는 중…',
      saved: '이미지가 저장되었습니다',
      saveFailed: '저장에 실패했어요. 다시 시도해주세요.',
      photoFailed: '사진을 불러오지 못했어요. 다른 사진으로 시도해주세요.',
      size: '글자 크기',
      font: { serif: '명조', sans: '고딕', hand: '손글씨' },
      alignLabel: '정렬',
      scrim: '배경',
      ref: '출처',
      frameLabel: '프레임',
      frame: { none: '기본', polaroid: '폴라로이드', film: '필름' },
      bgTitle: '감성 배경',
      back: '뒤로',
    },
    en: {
      title: 'Verse Photo Card',
      introHeadline: 'Put the Word\non your photo',
      introBody: 'Pick a photo from your gallery and overlay a Bible verse to keep as your own verse card.',
      privacy: 'Photos never leave your device — everything happens locally.',
      pickPhoto: 'Choose Photo',
      noPhotoTitle: 'No photo? No problem',
      noPhotoBody: 'Start right away with a mood background',
      changePhoto: 'Change photo',
      changeVerse: 'Change verse',
      pickVerse: 'Choose verse',
      dragHint: 'Drag the photo to move the text',
      save: 'Save',
      share: 'Share',
      saving: 'Creating…',
      saved: 'Image saved',
      saveFailed: 'Failed to save. Please try again.',
      photoFailed: 'Could not load the photo. Please try another one.',
      size: 'Text size',
      font: { serif: 'Serif', sans: 'Sans', hand: 'Hand' },
      alignLabel: 'Align',
      scrim: 'Backdrop',
      ref: 'Reference',
      frameLabel: 'Frame',
      frame: { none: 'None', polaroid: 'Polaroid', film: 'Film' },
      bgTitle: 'Backgrounds',
      back: 'Back',
    },
  }
  const t = texts[language]

  // 웹폰트(명조/손글씨)가 로드되기 전에 그리면 시스템 폰트로 그려지므로 먼저 로드해둔다
  useEffect(() => {
    ensureCardFonts().then(() => setFontsReady(true))
  }, [])

  // 선택 해제된 objectURL 정리 (배경의 dataURL revoke는 무해한 no-op)
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url)
    }
  }, [photo])

  // 상태가 바뀔 때마다 미리보기 다시 그리기
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !photo) return
    drawVerseCard(canvas, photo.img, verse?.text ?? '', verse?.refLabel ?? '', style)
  }, [photo, verse, style, fontsReady])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2500)
  }

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 사진 재선택도 동작하게
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    try {
      await img.decode()
    } catch {
      URL.revokeObjectURL(url)
      showToast(t.photoFailed)
      return
    }
    setPhoto({ url, img })
    setBgId(null)
    if (!verse) setPickerOpen(true)
  }

  // 감성 배경으로 시작/교체 — 그라데이션을 이미지로 만들어 사진과 같은 파이프라인을 탄다
  const pickBackground = async (bg: VerseBackground) => {
    try {
      const img = await createBackgroundImage(bg)
      setPhoto({ url: img.src, img })
      setBgId(bg.id)
      // 밝은 배경에서는 어두운 글자로 시작해야 읽힌다
      setStyle((s) => ({ ...s, color: bg.textColor }))
      if (!verse) setPickerOpen(true)
    } catch {
      showToast(t.photoFailed)
    }
  }

  // 미리보기 canvas 크기는 사진/프레임이 바뀔 때 맞춘다
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !photo) return
    const sized = createCardCanvas(photo.img, PREVIEW_MAX_SIDE, style.frame)
    if (canvas.width !== sized.width || canvas.height !== sized.height) {
      canvas.width = sized.width
      canvas.height = sized.height
      drawVerseCard(canvas, photo.img, verse?.text ?? '', verse?.refLabel ?? '', style)
    }
  }, [photo, verse, style])

  // ── 텍스트 드래그 — 사진 어느 곳을 잡아도 텍스트 블록이 손가락을 따라온다 ──
  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!verse) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...style.pos },
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - drag.startX) / rect.width
    const dy = (e.clientY - drag.startY) / rect.height
    setStyle((s) => ({
      ...s,
      pos: {
        x: clamp(drag.origin.x + dx, 0.05, 0.95),
        y: clamp(drag.origin.y + dy, 0.05, 0.95),
      },
    }))
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  // ── 저장/공유 — 원본 해상도로 다시 그려 JPEG 파일 생성 ──
  const buildCardFile = useCallback(async () => {
    if (!photo || !verse) return null
    await ensureCardFonts()
    const canvas = createCardCanvas(photo.img, EXPORT_MAX_SIDE, style.frame)
    drawVerseCard(canvas, photo.img, verse.text, verse.refLabel, style)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    )
    if (!blob) return null
    const filename = `말씀카드_${verse.refLabel.replace(/[\s:]/g, '_')}.jpg`
    return new File([blob], filename, { type: 'image/jpeg' })
  }, [photo, verse, style])

  // 저장 — 파일 다운로드 (모바일은 다운로드 폴더/파일 앱, 데스크톱은 다운로드 폴더)
  const handleDownload = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const file = await buildCardFile()
      if (!file) throw new Error('export failed')
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
      showToast(t.saved)
    } catch {
      showToast(t.saveFailed)
    } finally {
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildCardFile, saving])

  // 공유 — OS 공유 시트 (아이폰에서는 여기의 "이미지 저장"으로 갤러리 저장)
  const handleShare = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const file = await buildCardFile()
      if (!file) throw new Error('export failed')
      await navigator.share({ files: [file], title: verse?.refLabel })
    } catch (err) {
      // 공유 시트를 사용자가 닫은 경우는 실패가 아니다
      if ((err as DOMException)?.name !== 'AbortError') showToast(t.saveFailed)
    } finally {
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildCardFile, verse, saving])

  // 파일 공유를 지원하는 환경에서만 공유 버튼 노출
  const [canShareFile] = useState(() => {
    try {
      return !!navigator.canShare?.({
        files: [new File([], 'card.jpg', { type: 'image/jpeg' })],
      })
    } catch {
      return false
    }
  })

  const setPartial = (patch: Partial<VerseCardStyle>) => setStyle((s) => ({ ...s, ...patch }))

  const bgStrip = (
    <div className="pv-bg-row">
      {BACKGROUNDS.map((bg) => (
        <button
          key={bg.id}
          type="button"
          className={`pv-bg-dot${bgId === bg.id ? ' pv-bg-dot--active' : ''}`}
          aria-label={language === 'ko' ? bg.nameKo : bg.nameEn}
          onClick={() => pickBackground(bg)}
        >
          <span className="pv-bg-dot__swatch" style={{ background: backgroundCss(bg) }} />
          <span className="pv-bg-dot__name">{language === 'ko' ? bg.nameKo : bg.nameEn}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div className="photo-verse bg-gray-50 dark:bg-background-dark min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => navigate('/bible')}
              aria-label={t.back}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 rounded-full transition-colors"
            >
              <span className="material-icons-round text-[22px]">arrow_back</span>
            </button>
            <h1 className="text-[17px] font-bold text-ink-strong flex-1">
              {t.title}
            </h1>
            {photo && verse && (
              <div className="flex items-center gap-2">
                {canShareFile && (
                  <button
                    type="button"
                    className="pv-share-button"
                    onClick={handleShare}
                    disabled={saving}
                    aria-label={t.share}
                  >
                    <span className="material-icons-round text-[20px]">ios_share</span>
                  </button>
                )}
                <button
                  type="button"
                  className="pv-save-button brand-gradient"
                  onClick={handleDownload}
                  disabled={saving}
                >
                  <span className="material-icons-round text-[18px]">
                    {saving ? 'hourglass_top' : 'download'}
                  </span>
                  {saving ? t.saving : t.save}
                </button>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        {/* 사진 선택 전 — 인트로 */}
        {!photo && (
          <div className="pv-intro">
            <div className="pv-intro__icon">
              <span className="material-icons-round">photo_filter</span>
            </div>
            <h2 className="pv-intro__headline">
              {t.introHeadline.split('\n').map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </h2>
            <p className="pv-intro__body">{t.introBody}</p>
            <button
              type="button"
              className="pv-intro__cta brand-gradient"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-icons-round">add_photo_alternate</span>
              {t.pickPhoto}
            </button>
            <div className="pv-intro__bg">
              <p className="pv-intro__bg-title">{t.noPhotoTitle}</p>
              <p className="pv-intro__bg-body">{t.noPhotoBody}</p>
              {bgStrip}
            </div>
            <p className="pv-intro__privacy">
              <span className="material-icons-round text-[14px]">lock</span>
              {t.privacy}
            </p>
          </div>
        )}

        {/* 편집 화면 */}
        {photo && (
          <div className="pv-editor">
            <div className="pv-canvas-wrap">
              <canvas
                ref={canvasRef}
                className="pv-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>
            {verse && <p className="pv-drag-hint">{t.dragHint}</p>}

            {/* 현재 말씀 + 사진/말씀 교체 */}
            <div className="pv-source-row">
              <button type="button" className="pv-source-chip" onClick={() => setPickerOpen(true)}>
                <span className="material-icons-round text-[16px]">menu_book</span>
                {verse ? verse.refLabel : t.pickVerse}
                <span className="pv-source-chip__action">{verse ? t.changeVerse : ''}</span>
              </button>
              <button
                type="button"
                className="pv-source-chip"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-icons-round text-[16px]">image</span>
                {t.changePhoto}
              </button>
            </div>

            {/* 스타일 컨트롤 */}
            {verse && (
              <div className="pv-controls">
                <FilterStrip
                  img={photo.img}
                  active={style.filter}
                  language={language}
                  onSelect={(filter) => setPartial({ filter })}
                />

                <div className="pv-swatches" role="radiogroup" aria-label="색상">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={style.color === c}
                      className={`pv-swatch${style.color === c ? ' pv-swatch--active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setPartial({ color: c })}
                    />
                  ))}
                </div>

                <div className="pv-control-row">
                  <div className="pv-seg" role="radiogroup" aria-label="서체">
                    {(['serif', 'sans', 'hand'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        role="radio"
                        aria-checked={style.fontFamily === f}
                        className={`pv-seg__item${style.fontFamily === f ? ' pv-seg__item--active' : ''}`}
                        onClick={() => setPartial({ fontFamily: f })}
                      >
                        {t.font[f]}
                      </button>
                    ))}
                  </div>

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
                        onClick={() => setPartial({ align: a })}
                      >
                        <span className="material-icons-round text-[18px]">{icon}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    aria-pressed={style.scrim}
                    className={`pv-toggle${style.scrim ? ' pv-toggle--active' : ''}`}
                    onClick={() => setPartial({ scrim: !style.scrim })}
                  >
                    {t.scrim}
                  </button>
                  <button
                    type="button"
                    aria-pressed={style.showRef}
                    className={`pv-toggle${style.showRef ? ' pv-toggle--active' : ''}`}
                    onClick={() => setPartial({ showRef: !style.showRef })}
                  >
                    {t.ref}
                  </button>
                </div>

                {/* 프레임 — 폴라로이드는 손글씨 출처, 필름은 날짜 스탬프가 함께 찍힌다 */}
                <div className="pv-control-row">
                  <div className="pv-seg" role="radiogroup" aria-label={t.frameLabel}>
                    {(['none', 'polaroid', 'film'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        role="radio"
                        aria-checked={style.frame === f}
                        className={`pv-seg__item${style.frame === f ? ' pv-seg__item--active' : ''}`}
                        onClick={() => setPartial({ frame: f })}
                      >
                        {t.frame[f]}
                      </button>
                    ))}
                  </div>
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
                    onChange={(e) => setPartial({ fontScale: Number(e.target.value) })}
                    className="pv-slider"
                  />
                  <span className="pv-slider-label pv-slider-label--big">가</span>
                </div>

                <div className="pv-bg-section">
                  <p className="pv-bg-section__title">{t.bgTitle}</p>
                  {bgStrip}
                </div>
              </div>
            )}
          </div>
        )}

        {toast && <div className="pv-toast">{toast}</div>}

        {pickerOpen && (
          <VersePickerSheet
            onPick={(picked) => {
              setVerse(picked)
              setPickerOpen(false)
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default PhotoVerse
