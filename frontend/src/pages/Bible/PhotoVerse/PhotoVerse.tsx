import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import VersePickerSheet from './VersePickerSheet'
import { getTodayRecommended } from './recommendedVerses'
import type { PickedVerse } from './recommendedVerses'
import { CARD_PRESETS } from './cardPresets'
import type { CardPreset } from './cardPresets'
import { BACKGROUNDS, CARD_LAYOUTS, DEFAULT_CARD_STYLE, backgroundCss, createBackgroundImage, createCardCanvas, drawVerseCard, ensureCardFonts, getSeasonStamp, measureImageLuminance } from './photoVerseCanvas'
import type { CardRatioId, CardTextBg, CardTextureId, VerseBackground, VerseCardStyle } from './photoVerseCanvas'
import { FilterStrip, PresetStrip } from './components/StyleStrips'
import { IntroSamples } from './components/IntroSamples'
import { LayoutGlyph } from './components/LayoutGlyph'
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


const PhotoVerse = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const lang: 'ko' | 'en' = language === 'en' ? 'en' : 'ko'

  // 다른 화면(예: 기도 완료)에서 말씀을 미리 실어 보낼 수 있다
  const presetVerse = (location.state as { presetVerse?: PickedVerse } | null)?.presetVerse

  const [photo, setPhoto] = useState<{ url: string; img: HTMLImageElement } | null>(null)
  const [bgId, setBgId] = useState<string | null>(null)
  const [verse, setVerse] = useState<PickedVerse | null>(
    presetVerse && presetVerse.text && presetVerse.refLabel ? presetVerse : null,
  )
  // 인트로 예시 카드에 쓰는 오늘의 말씀 — 피커의 피처드 카드와 같은 절
  const [todayVerse] = useState(() => getTodayRecommended(Date.now()))
  const [style, setStyle] = useState<VerseCardStyle>(() => ({
    ...DEFAULT_CARD_STYLE,
    lang,
  }))
  // 사진/배경에 맞춘 기본 글자색 — 프리셋을 바꿔도 형광펜처럼 룩이 요구하지 않는 한 이 색으로 돌아온다
  const [baseColor, setBaseColor] = useState(DEFAULT_CARD_STYLE.color)
  const [activePreset, setActivePreset] = useState<string | null>(CARD_PRESETS[0].id)
  const [showDetails, setShowDetails] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  // 폰트 로드 세대 — 구절이 바뀌어 새 서브셋 조각이 로드될 때마다 올라가 다시 그리게 한다
  const [fontsReady, setFontsReady] = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // 저장 인화 연출 — 다운로드 후 카드가 폴라로이드처럼 서서히 현상된다
  const [printed, setPrinted] = useState<string | null>(null)
  const [printDeveloped, setPrintDeveloped] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; origin: { x: number; y: number } } | null>(null)
  // 예시 카드에서 고른 프리셋 — 배경 이미지가 준비된 뒤 적용한다
  const pendingPresetRef = useRef<CardPreset | null>(null)

  const texts = {
    ko: {
      title: '말씀 사진 카드',
      introHeadline: '내 사진 위에\n말씀을 담아보세요',
      introBody: '갤러리에서 사진을 고르고 마음에 새기고 싶은 말씀을 올려 나만의 말씀 카드를 만들 수 있어요.',
      privacy: '사진은 서버로 전송되지 않고 내 기기 안에서만 처리돼요.',
      pickPhoto: '사진 선택하기',
      samplesTitle: '이런 카드가 만들어져요',
      samplesBody: '탭하면 그 스타일로 바로 시작해요',
      noPhotoTitle: '사진이 없어도 괜찮아요',
      noPhotoBody: '감성 배경을 골라 바로 시작해보세요',
      changePhoto: '사진 바꾸기',
      changeVerse: '말씀 바꾸기',
      pickVerse: '말씀 고르기',
      dragHint: '사진을 드래그해 말씀 위치를 옮길 수 있어요',
      presetTitle: '스타일',
      details: '세부 조정',
      save: '저장',
      share: '공유',
      saving: '만드는 중…',
      saved: '이미지가 저장되었습니다',
      saveFailed: '저장에 실패했어요. 다시 시도해주세요.',
      photoFailed: '사진을 불러오지 못했어요. 다른 사진으로 시도해주세요.',
      size: '글자 크기',
      font: { serif: '명조', sans: '고딕', hand: '손글씨', brush: '붓' },
      alignLabel: '정렬',
      ref: '출처',
      signature: '서명',
      layoutTitle: '레이아웃',
      textBgLabel: '글 배경',
      textBg: { none: '없음', soft: '은은', scrim: '박스', marker: '형광펜' },
      frameLabel: '프레임',
      frame: { none: '기본', season: '절기', polaroid: '폴라로이드', film: '필름' },
      ratioLabel: '비율',
      ratio: { original: '원본', '1:1': '1:1', '4:5': '4:5', '9:16': '9:16' },
      textureLabel: '질감',
      texture: { grain: '그레인', leak: '빛샘', vignette: '비네트', stamp: '날짜' },
      printedHint: '이미지가 저장되었어요 · 탭해서 닫기',
      bgTitle: '감성 배경',
      back: '뒤로',
    },
    en: {
      title: 'Verse Photo Card',
      introHeadline: 'Put the Word\non your photo',
      introBody: 'Pick a photo from your gallery and overlay a Bible verse to keep as your own verse card.',
      privacy: 'Photos never leave your device — everything happens locally.',
      pickPhoto: 'Choose Photo',
      samplesTitle: 'Cards you can make',
      samplesBody: 'Tap one to start in that style',
      noPhotoTitle: 'No photo? No problem',
      noPhotoBody: 'Start right away with a mood background',
      changePhoto: 'Change photo',
      changeVerse: 'Change verse',
      pickVerse: 'Choose verse',
      dragHint: 'Drag the photo to move the text',
      presetTitle: 'Style',
      details: 'Fine-tune',
      save: 'Save',
      share: 'Share',
      saving: 'Creating…',
      saved: 'Image saved',
      saveFailed: 'Failed to save. Please try again.',
      photoFailed: 'Could not load the photo. Please try another one.',
      size: 'Text size',
      font: { serif: 'Serif', sans: 'Sans', hand: 'Hand', brush: 'Brush' },
      alignLabel: 'Align',
      ref: 'Reference',
      signature: 'Signature',
      layoutTitle: 'Layout',
      textBgLabel: 'Text backdrop',
      textBg: { none: 'None', soft: 'Soft', scrim: 'Box', marker: 'Marker' },
      frameLabel: 'Frame',
      frame: { none: 'None', season: 'Season', polaroid: 'Polaroid', film: 'Film' },
      ratioLabel: 'Ratio',
      ratio: { original: 'Original', '1:1': '1:1', '4:5': '4:5', '9:16': '9:16' },
      textureLabel: 'Texture',
      texture: { grain: 'Grain', leak: 'Light leak', vignette: 'Vignette', stamp: 'Date' },
      printedHint: 'Image saved · tap to close',
      bgTitle: 'Backgrounds',
      back: 'Back',
    },
  }
  const t = texts[language]

  // 웹폰트(명조/손글씨)가 로드되기 전에 그리면 시스템 폰트로 그려진다.
  // 한글 폰트는 서브셋 조각으로 나뉘어 있어 구절 텍스트를 넘겨 해당 글자의
  // 조각까지 받아오고, 로드가 끝나면 세대를 올려 canvas를 다시 그린다.
  // 인트로 예시 카드도 오늘의 말씀을 그리므로 구절이 없을 땐 그 글자로 받아온다.
  useEffect(() => {
    let cancelled = false
    const v = verse ?? todayVerse
    ensureCardFonts(`${v.text} ${v.refLabel}`).then(() => {
      if (!cancelled) setFontsReady((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [verse, todayVerse])

  // 절기 스탬프·서명 언어를 앱 언어와 맞춘다
  useEffect(() => {
    setStyle((s) => (s.lang === lang ? s : { ...s, lang }))
  }, [lang])

  // 인화 연출 — 오버레이가 뜨고 잠깐 뒤 현상이 시작된다
  useEffect(() => {
    if (!printed) return
    const id = window.setTimeout(() => setPrintDeveloped(true), 80)
    return () => window.clearTimeout(id)
  }, [printed])

  const closePrint = useCallback(() => {
    if (printed) URL.revokeObjectURL(printed)
    setPrinted(null)
    setPrintDeveloped(false)
  }, [printed])

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

  // 프리셋 적용 — 비율·언어·위치·글자 크기는 그대로, 룩(레이아웃·필터·서체·질감·프레임)만 바꾼다
  const applyPreset = useCallback(
    (p: CardPreset, color = baseColor) => {
      setStyle((s) => ({ ...s, ...p.style, color: p.style.color ?? color }))
      setActivePreset(p.id)
    },
    [baseColor],
  )

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
    // 사진 밝기에 맞춘 기본 글자색 — 눈밭·하늘처럼 밝은 사진은 어두운 잉크로 시작해야 읽힌다.
    // 형광펜처럼 어두운 글자가 필요한 룩은 그대로 둔다
    const color = measureImageLuminance(img) > 0.7 ? '#1f1d1a' : '#ffffff'
    setBaseColor(color)
    setStyle((s) => ({ ...s, color: s.textBg === 'marker' ? s.color : color }))
    if (!verse) setPickerOpen(true)
  }

  // 감성 배경으로 시작/교체 — 장면을 이미지로 만들어 사진과 같은 파이프라인을 탄다
  const pickBackground = async (bg: VerseBackground, preset?: CardPreset, hasVerse = !!verse) => {
    try {
      const img = await createBackgroundImage(bg)
      setPhoto({ url: img.src, img })
      setBgId(bg.id)
      // 밝은 배경에서는 어두운 글자로 시작해야 읽힌다
      setBaseColor(bg.textColor)
      const p = preset ?? pendingPresetRef.current
      pendingPresetRef.current = null
      if (p) {
        applyPreset(p, bg.textColor)
      } else {
        setStyle((s) => ({ ...s, color: s.textBg === 'marker' ? s.color : bg.textColor }))
      }
      if (!hasVerse) setPickerOpen(true)
    } catch {
      showToast(t.photoFailed)
    }
  }

  // 인트로 예시 카드 — 그 배경·프리셋·오늘의 말씀으로 곧바로 시작한다
  const startFromSample = (bg: VerseBackground, preset: CardPreset) => {
    if (!verse) setVerse(todayVerse)
    void pickBackground(bg, preset, true)
  }

  // 미리보기 canvas 크기는 사진/프레임이 바뀔 때 맞춘다
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !photo) return
    const sized = createCardCanvas(photo.img, PREVIEW_MAX_SIDE, style.frame, style.ratio)
    if (canvas.width !== sized.width || canvas.height !== sized.height) {
      canvas.width = sized.width
      canvas.height = sized.height
      drawVerseCard(canvas, photo.img, verse?.text ?? '', verse?.refLabel ?? '', style)
    }
  }, [photo, verse, style])

  // ── 텍스트 드래그 — 사진 어느 곳을 잡아도 텍스트 블록이 손가락을 따라온다 ──
  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    // 텍스트 드래그는 자유 레이아웃에서만 — 프리셋 레이아웃은 구도가 완성되어 있다
    if (!verse || style.layout !== 'classic') return
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
    await ensureCardFonts(`${verse.text} ${verse.refLabel}`)
    const canvas = createCardCanvas(photo.img, EXPORT_MAX_SIDE, style.frame, style.ratio)
    drawVerseCard(canvas, photo.img, verse.text, verse.refLabel, style)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.94)
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
      // 다운로드 직후 인화 연출 — URL은 오버레이를 닫을 때 해제한다
      setPrintDeveloped(false)
      setPrinted(url)
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

  // 세부 조정 — 프리셋에서 벗어난 '나만의 조합'이 된다
  const setPartial = (patch: Partial<VerseCardStyle>) => {
    setStyle((s) => ({ ...s, ...patch }))
    setActivePreset(null)
  }

  const toggleTexture = (id: CardTextureId) => {
    setStyle((s) => ({
      ...s,
      textures: s.textures.includes(id) ? s.textures.filter((x) => x !== id) : [...s.textures, id],
    }))
    setActivePreset(null)
  }

  // 형광펜은 밝은 글자와 겹치면 안 읽혀 어두운 글자로 함께 바꿔준다
  const pickTextBg = (textBg: CardTextBg) => {
    setStyle((s) => ({
      ...s,
      textBg,
      color: textBg === 'marker' && s.color !== '#111111' ? '#111111' : s.color,
    }))
    setActivePreset(null)
  }

  const seasonStamp = getSeasonStamp(lang)

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

  const textBgOptions: CardTextBg[] =
    style.layout === 'classic' ? ['none', 'soft', 'scrim', 'marker'] : ['none', 'soft']

  return (
    <div className="photo-verse bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen">
      {/* lg+: 좁은 폰 프레임을 풀어 편집기 폭을 확보한다.
          캔버스(좌) / 컨트롤(우) 2단 분할은 .pv-editor 미디어쿼리가 담당 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen flex flex-col lg:max-w-none lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden">
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

            {/* 예시 카드 — 만들어 보기 전에는 재미를 알 수 없으니 결과물을 먼저 보여준다 */}
            <div className="pv-intro__samples">
              <p className="pv-intro__bg-title">{t.samplesTitle}</p>
              <p className="pv-intro__bg-body">{t.samplesBody}</p>
              <IntroSamples
                verse={verse ?? todayVerse}
                lang={lang}
                fontsReady={fontsReady}
                onPick={startFromSample}
              />
            </div>

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
            {verse && style.layout === 'classic' && <p className="pv-drag-hint">{t.dragHint}</p>}

            {/* lg+에서 우측 컨트롤 열이 되는 묶음 (그 아래 폭에서는 display:contents) */}
            <div className="pv-side">
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
                {/* 스타일 프리셋 — 내 사진으로 그린 실사 썸네일. 한 탭에 완성된 룩 */}
                <div className="pv-section">
                  <p className="pv-section__title">{t.presetTitle}</p>
                  <PresetStrip
                    img={photo.img}
                    verse={verse}
                    baseColor={baseColor}
                    lang={lang}
                    language={language}
                    active={activePreset}
                    fontsReady={fontsReady}
                    onSelect={(p) => applyPreset(p)}
                  />
                </div>

                {/* 세부 조정 — 접혀 있다. 프리셋으로 충분한 사람에게는 보이지 않아야 화면이 차분하다 */}
                <button
                  type="button"
                  className={`pv-details-toggle${showDetails ? ' pv-details-toggle--open' : ''}`}
                  aria-expanded={showDetails}
                  onClick={() => setShowDetails((v) => !v)}
                >
                  <span className="material-icons-round text-[18px]">tune</span>
                  {t.details}
                  <span className="material-icons-round pv-details-toggle__chevron">expand_more</span>
                </button>

                {showDetails && (
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
                      onClick={() => setPartial({ layout: lay.id })}
                    >
                      <span className="pv-layout__thumb">
                        <LayoutGlyph id={lay.id} />
                      </span>
                      <span className="pv-layout__name">
                        {language === 'ko' ? lay.nameKo : lay.nameEn}
                      </span>
                    </button>
                  ))}
                </div>

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
                    {(['serif', 'sans', 'hand', 'brush'] as const).map((f) => (
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
                          onClick={() => setPartial({ align: a })}
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
                    onClick={() => setPartial({ showRef: !style.showRef })}
                  >
                    {t.ref}
                  </button>

                  <button
                    type="button"
                    aria-pressed={style.signature}
                    className={`pv-toggle${style.signature ? ' pv-toggle--active' : ''}`}
                    onClick={() => setPartial({ signature: !style.signature })}
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
                        onClick={() => pickTextBg(b)}
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
                        onClick={() => setPartial({ frame: f })}
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
                        onClick={() => setStyle((s) => ({ ...s, ratio: r }))}
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
                      onClick={() => toggleTexture(tx)}
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
                    onChange={(e) => setStyle((s) => ({ ...s, fontScale: Number(e.target.value) }))}
                    className="pv-slider"
                  />
                  <span className="pv-slider-label pv-slider-label--big">가</span>
                </div>
                  </div>
                )}

                <div className="pv-bg-section">
                  <p className="pv-section__title">{t.bgTitle}</p>
                  {bgStrip}
                </div>
              </div>
            )}
            </div>{/* /pv-side */}
          </div>
        )}

        {toast && <div className="pv-toast">{toast}</div>}

        {/* 저장 인화 연출 — 방금 만든 카드가 폴라로이드처럼 서서히 현상된다 */}
        {printed && (
          <div className="pv-print-overlay" onClick={closePrint}>
            <div className={`pv-print${printDeveloped ? ' pv-print--developed' : ''}`}>
              <div className="pv-print__img-wrap">
                <img src={printed} alt="" className="pv-print__img" />
              </div>
              <p className="pv-print__caption">{verse?.refLabel}</p>
            </div>
            <p className="pv-print__hint">{t.printedHint}</p>
          </div>
        )}

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
    </div>
  )
}

export default PhotoVerse
