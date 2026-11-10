import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { markPostcardSent } from '../../../components/share/sharePostcardsShared'
import type { ChangeEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleBooks } from '../../../hooks/useBible'
import { useDailyVerse } from '../../../hooks/useDailyVerse'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import { KST_OFFSET_MS } from '../../../utils/kstTime'

// 카드 전용 서체(붓글씨·손글씨·날짜 스탬프)는 이 화면 청크가 로드될 때 받기 시작한다
ensureFontFamily('nanumBrush')
ensureFontFamily('nanumPen')
ensureFontFamily('orbitron')
import VersePickerSheet from './VersePickerSheet'
import { compactReference, getTodayRecommended } from './recommendedVerses'
import type { PickedVerse } from './recommendedVerses'
import { CARD_PRESETS } from './cardPresets'
import type { CardPreset } from './cardPresets'
import { BACKGROUNDS, DEFAULT_CARD_STYLE, backgroundCss, createBackgroundImage, createCardCanvas, drawVerseCard, ensureCardFonts, measureImageLuminance } from './photoVerseCanvas'
import type { CardRatioId, CardTextBg, CardTextureId, VerseBackground, VerseCardStyle } from './photoVerseCanvas'
import { PresetStrip } from './components/StyleStrips'
import DetailControls from './components/DetailControls'
import IntroScreen from './components/IntroScreen'
import LockScreenGuide from './components/LockScreenGuide'
import MotionCardSheet from './components/MotionCardSheet'
import OccasionSection from './components/OccasionSection'
import PrintOverlay from './components/PrintOverlay'
import VerseEditSheet from './components/VerseEditSheet'
import { pickMotionMime } from './motionCard'
import { MAX_SLIDES, canSplit, splitIntoSlides, suggestedSlideCount } from './slides'
import { verseLinkFromRef } from './verseLink'
import { isResumable, loadDraft, saveDraft } from './draft'
import { findOccasion } from './occasions'
import type { CardOccasion } from './occasions'
import { useRecentSermonPassage } from './churchVerses'
import type { SermonPassage } from './churchVerses'
import { PHOTO_VERSE_TEXTS } from './texts'
import { usePhotoGesture } from './usePhotoGesture'
import './PhotoVerse.css'

// 미리보기는 화면용으로 캡, 저장본은 원본 해상도(최대 2048px)로 다시 그린다
const PREVIEW_MAX_SIDE = 1280
const EXPORT_MAX_SIDE = 2048
// 잠금화면은 요즘 폰 세로 해상도(2556~2400px)에 맞춰 더 크게 — 원본보다 키우지는 않는다
const EXPORT_MAX_SIDE_LOCK = 2560

// 우리 교회 말씀(설교 본문·올해의 말씀)으로 시작할 때의 룩 — 종이 배경 + 절기 에디션 프레임
const CHURCH_BG_ID = 'cream'
const CHURCH_PRESET_ID = 'season'

/** 한국 시간 기준 날짜 번호 — 상황별 말씀을 하루 단위로 돌려 쓴다 */
const kstDayNumber = (ms: number) => Math.floor((ms + KST_OFFSET_MS) / 86_400_000)


const PhotoVerse = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const lang: 'ko' | 'en' = language === 'en' ? 'en' : 'ko'

  // 다른 화면(예: 기도 완료)에서 말씀을, 설교 화면에서 본문을 미리 실어 보낼 수 있다
  const routeState = location.state as { presetVerse?: PickedVerse; sermonPassage?: SermonPassage } | null
  const presetVerse = routeState?.presetVerse
  const routeSermon = routeState?.sermonPassage

  const [photo, setPhoto] = useState<{ url: string; img: HTMLImageElement } | null>(null)
  const [bgId, setBgId] = useState<string | null>(null)
  const [verse, setVerse] = useState<PickedVerse | null>(
    presetVerse && presetVerse.text && presetVerse.refLabel ? presetVerse : null,
  )
  // 인트로 예시 카드에 쓰는 오늘의 말씀 — 피커의 피처드 카드와 같은 절
  const [todayVerse] = useState(() => getTodayRecommended(Date.now()))
  // 지난번에 만들던 카드 — 스타일은 곧바로 이어 쓰고, 말씀·배경은 '이어서 만들기'로 권한다
  const [draft] = useState(() => loadDraft())
  const [resumeOffer, setResumeOffer] = useState(() =>
    !presetVerse && !routeSermon && isResumable(draft, Date.now()) ? draft : null,
  )
  // 상황별 카드 — 맨 위 손글씨 인사말과, '다른 말씀'으로 돌려 볼 상황의 말씀 순번
  const [greeting, setGreeting] = useState('')
  const [greetingEditing, setGreetingEditing] = useState(false)
  const [occasionId, setOccasionId] = useState<string | null>(null)
  const [occasionVerseIdx, setOccasionVerseIdx] = useState(0)
  const occasion = findOccasion(occasionId)
  // 우리 교회 말씀 — 최근 주일 설교 본문(설교 화면에서 실어 보냈으면 그 본문)과 올해의 말씀
  const recentSermon = useRecentSermonPassage(lang)
  const sermon = routeSermon ?? recentSermon
  const { data: themeVerseData } = useDailyVerse()
  const themeText = themeVerseData?.verse_text?.trim() ?? ''
  const themeRef = themeVerseData?.verse_reference ? compactReference(themeVerseData.verse_reference) : ''
  // 피커를 설교 본문 목록이 펼쳐진 채로 열지
  const [pickerPassage, setPickerPassage] = useState(false)
  const [style, setStyle] = useState<VerseCardStyle>(() => ({
    ...DEFAULT_CARD_STYLE,
    ...(draft?.style ?? {}),
    // 사진마다 다른 값 — 새 사진은 가운데에서 시작한다
    focus: DEFAULT_CARD_STYLE.focus,
    lang,
  }))
  // 사진/배경에 맞춘 기본 글자색 — 프리셋을 바꿔도 형광펜처럼 룩이 요구하지 않는 한 이 색으로 돌아온다
  const [baseColor, setBaseColor] = useState(DEFAULT_CARD_STYLE.color)
  const [activePreset, setActivePreset] = useState<string | null>(() =>
    draft ? draft.activePreset : CARD_PRESETS[0].id,
  )
  // 여러 장으로 나누기 — 1이면 한 장, 2~4면 캐러셀. previewSlide 는 미리보기 중인 장
  const [slideCount, setSlideCount] = useState(1)
  const [previewSlide, setPreviewSlide] = useState(0)
  // 캔버스 드래그가 옮길 대상 — 자유 레이아웃은 글, 그 밖엔 사진(크롭된 경우)
  const [dragTarget, setDragTarget] = useState<'text' | 'photo'>('text')
  const [showLockGuide, setShowLockGuide] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [motionOpen, setMotionOpen] = useState(false)
  // 잠금화면으로 바꾸기 전 비율 — 카드로 돌아올 때 되살린다
  const cardRatioRef = useRef<CardRatioId>(draft?.style.ratio && draft.style.ratio !== 'lock' ? draft.style.ratio : 'original')
  const [canRecordMotion] = useState(() => !!pickMotionMime())
  const { data: bibleBooks } = useBibleBooks()
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
  // 예시 카드에서 고른 프리셋 — 배경 이미지가 준비된 뒤 적용한다
  const pendingPresetRef = useRef<CardPreset | null>(null)

  const t = PHOTO_VERSE_TEXTS[language]

  // 웹폰트(명조/손글씨)가 로드되기 전에 그리면 시스템 폰트로 그려진다.
  // 한글 폰트는 서브셋 조각으로 나뉘어 있어 구절 텍스트를 넘겨 해당 글자의
  // 조각까지 받아오고, 로드가 끝나면 세대를 올려 canvas를 다시 그린다.
  // 인트로 예시 카드도 오늘의 말씀을 그리므로 구절이 없을 땐 그 글자로 받아온다.
  useEffect(() => {
    let cancelled = false
    const v = verse ?? todayVerse
    ensureCardFonts(`${v.text} ${v.refLabel} ${greeting}`).then(() => {
      if (!cancelled) setFontsReady((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [verse, todayVerse, greeting])

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

  // 여러 장으로 나누기 — 미리보기·저장·영상이 같은 조각을 쓴다
  // 인사말은 첫 장에만 — 넘겨 보는 카드의 표지처럼. 타이핑 중엔 프리셋 썸네일까지 다시 그리니 한 박자 늦춘다
  const drawnGreeting = useDeferredValue(greeting.trim())
  const slides = useMemo(() => {
    if (!verse) return []
    const list = splitIntoSlides(verse, slideCount)
    return drawnGreeting ? list.map((sl, i) => (i === 0 ? { ...sl, greeting: drawnGreeting } : sl)) : list
  }, [verse, slideCount, drawnGreeting])
  const slideIdx = Math.min(previewSlide, Math.max(0, slides.length - 1))
  const current = slides[slideIdx]
  const isLock = style.ratio === 'lock'

  // 말씀 교체 — 나누기는 한 장으로 돌아간다 (조각 수가 말씀마다 다르다)
  const chooseVerse = useCallback((v: PickedVerse) => {
    setVerse(v)
    setSlideCount(1)
    setPreviewSlide(0)
  }, [])

  // 카드 공유에 곁들일 말씀 링크 — 받은 사람이 카드를 보고 곧바로 그 절을 연다
  const shareText = useMemo(() => {
    if (!verse) return undefined
    const link = verseLinkFromRef(verse.refLabel, bibleBooks)
    return link ? `${verse.refLabel}\n${link}` : undefined
  }, [verse, bibleBooks])

  // 상태가 바뀔 때마다 미리보기 다시 그리기
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !photo) return
    drawVerseCard(canvas, photo.img, current?.text ?? '', current?.refLabel ?? '', style, { greeting: current?.greeting })
  }, [photo, current, style, fontsReady])

  // 만들던 카드 기억 — 드래그 중 매 프레임 쓰지 않게 잠깐 모았다가 저장한다
  useEffect(() => {
    if (!verse && !photo) return
    const id = window.setTimeout(
      () => saveDraft({ style, activePreset, verse, bgId, slideCount, greeting, occasionId }),
      400,
    )
    return () => window.clearTimeout(id)
  }, [style, activePreset, verse, bgId, slideCount, photo, greeting, occasionId])

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
    setResumeOffer(null)
    // 사진 밝기에 맞춘 기본 글자색 — 눈밭·하늘처럼 밝은 사진은 어두운 잉크로 시작해야 읽힌다.
    // 형광펜처럼 어두운 글자가 필요한 룩은 그대로 둔다. 새 사진은 가운데 구도에서 시작한다
    const color = measureImageLuminance(img) > 0.7 ? '#1f1d1a' : '#ffffff'
    setBaseColor(color)
    setStyle((s) => ({ ...s, focus: DEFAULT_CARD_STYLE.focus, color: s.textBg === 'marker' ? s.color : color }))
    if (!verse) setPickerOpen(true)
  }

  // 감성 배경으로 시작/교체 — 장면을 이미지로 만들어 사진과 같은 파이프라인을 탄다.
  // 잠금화면이면 세로로 긴 장면을 따로 그린다 (4:5 장면을 잘라 쓰면 흐릿해진다)
  const pickBackground = async (
    bg: VerseBackground,
    preset?: CardPreset,
    hasVerse = !!verse,
    tall = style.ratio === 'lock',
  ) => {
    try {
      const img = await createBackgroundImage(bg, tall)
      setPhoto({ url: img.src, img })
      setBgId(bg.id)
      setResumeOffer(null)
      // 밝은 배경에서는 어두운 글자로 시작해야 읽힌다
      setBaseColor(bg.textColor)
      const p = preset ?? pendingPresetRef.current
      pendingPresetRef.current = null
      if (p) {
        applyPreset(p, bg.textColor)
      } else {
        setStyle((s) => ({ ...s, focus: DEFAULT_CARD_STYLE.focus, color: s.textBg === 'marker' ? s.color : bg.textColor }))
      }
      if (!hasVerse) setPickerOpen(true)
    } catch {
      showToast(t.photoFailed)
    }
  }

  // 인트로 예시 카드 — 그 배경·프리셋·오늘의 말씀으로 곧바로 시작한다
  const startFromSample = (bg: VerseBackground, preset: CardPreset) => {
    if (!verse) chooseVerse(todayVerse)
    void pickBackground(bg, preset, true)
  }

  // 상황별 카드 — 말씀·인사말·스타일을 한 번에. 내 사진이면 사진은 두고 룩만, 아니면 상황의 배경으로
  const startOccasion = (o: CardOccasion) => {
    const idx = kstDayNumber(Date.now()) % o.verses.length
    setOccasionId(o.id)
    setOccasionVerseIdx(idx)
    chooseVerse(o.verses[idx])
    setGreeting(lang === 'en' ? o.greetingEn : o.greetingKo)
    setGreetingEditing(false)
    setResumeOffer(null)
    const preset = CARD_PRESETS.find((p) => p.id === o.presetId)
    // 잠금화면에는 인사말이 들어가지 않으니 카드로 돌아간다
    if (isLock) setStyle((s) => ({ ...s, ratio: cardRatioRef.current }))
    if (photo && !bgId) {
      if (preset) applyPreset(preset)
      return
    }
    const bg = BACKGROUNDS.find((b) => b.id === o.bgId)
    if (bg) void pickBackground(bg, preset, true, false)
    else if (preset) applyPreset(preset)
  }

  // 같은 상황의 다음 말씀으로 — 인사말은 그대로
  const nextOccasionVerse = () => {
    if (!occasion) return
    const n = (occasionVerseIdx + 1) % occasion.verses.length
    setOccasionVerseIdx(n)
    chooseVerse(occasion.verses[n])
  }

  // 우리 교회 말씀으로 시작 — 말씀이 정해져 있으면(올해의 말씀) 곧바로, 설교면 본문에서 고르게 한다
  const startChurchVerse = (v?: PickedVerse) => {
    setOccasionId(null)
    setGreeting('')
    setResumeOffer(null)
    if (v) chooseVerse(v)
    const bg = BACKGROUNDS.find((b) => b.id === CHURCH_BG_ID)
    const preset = CARD_PRESETS.find((p) => p.id === CHURCH_PRESET_ID)
    if (bg) void pickBackground(bg, preset, true)
    if (!v) {
      setPickerPassage(true)
      setPickerOpen(true)
    }
  }

  // 설교 화면 '말씀 카드로 담기'로 들어오면 곧바로 본문 고르기부터
  const routeSermonStarted = useRef(false)
  useEffect(() => {
    if (!routeSermon || routeSermonStarted.current) return
    routeSermonStarted.current = true
    startChurchVerse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSermon])

  // 이어서 만들기 — 지난 말씀·나누기를 되살리고, 배경이었으면 그 배경으로 바로, 사진이었으면 사진부터 고른다
  const resumeDraft = () => {
    const d = resumeOffer
    if (!d?.verse) return
    setResumeOffer(null)
    setVerse(d.verse)
    setSlideCount(d.slideCount)
    setPreviewSlide(0)
    setGreeting(d.greeting ?? '')
    const o = findOccasion(d.occasionId)
    setOccasionId(o ? o.id : null)
    setOccasionVerseIdx(o ? Math.max(0, o.verses.findIndex((v) => v.refLabel === d.verse.refLabel)) : 0)
    const bg = d.bgId ? BACKGROUNDS.find((b) => b.id === d.bgId) : undefined
    if (bg) void pickBackground(bg, undefined, true)
    else fileInputRef.current?.click()
  }

  // 카드 ↔ 잠금화면 — 잠금화면은 9:19.5 세로 비율 + 시계·버튼을 피한 글 자리.
  // 폴라로이드 여백은 배경화면에 어울리지 않아 기본 프레임으로 바꾼다
  const setLockMode = (lock: boolean) => {
    if (lock === isLock) return
    if (lock) cardRatioRef.current = style.ratio
    setStyle((s) => ({
      ...s,
      ratio: lock ? 'lock' : cardRatioRef.current,
      frame: lock && s.frame === 'polaroid' ? 'none' : s.frame,
    }))
    const bg = bgId ? BACKGROUNDS.find((b) => b.id === bgId) : undefined
    if (bg) {
      createBackgroundImage(bg, lock)
        .then((img) => setPhoto({ url: img.src, img }))
        .catch(() => undefined)
    }
  }

  // 세부 조정의 비율 — 잠금화면이었으면 카드로 돌아가며 그 비율을 쓴다
  const pickCardRatio = (r: CardRatioId) => {
    cardRatioRef.current = r
    if (isLock) setLockMode(false)
    else setStyle((s) => ({ ...s, ratio: r }))
  }

  // 미리보기 canvas 크기는 사진/프레임이 바뀔 때 맞춘다
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !photo) return
    const sized = createCardCanvas(photo.img, PREVIEW_MAX_SIDE, style.frame, style.ratio)
    if (canvas.width !== sized.width || canvas.height !== sized.height) {
      canvas.width = sized.width
      canvas.height = sized.height
      drawVerseCard(canvas, photo.img, current?.text ?? '', current?.refLabel ?? '', style, { greeting: current?.greeting })
    }
  }, [photo, current, style])

  // 캔버스 제스처 — 글/사진 끌기와 두 손가락 글자 크기 (usePhotoGesture)
  const { canPan, dragMode, onPointerDown, onPointerMove, onPointerUp } = usePhotoGesture({
    hasVerse: !!verse,
    photo: photo?.img ?? null,
    style,
    setStyle,
    dragTarget,
  })

  // ── 저장/공유 — 원본 해상도로 다시 그려 JPEG 파일 생성 (나누기면 장마다 한 장씩) ──
  const buildCardFiles = useCallback(async (): Promise<File[]> => {
    if (!photo || !verse || !slides.length) return []
    await ensureCardFonts(`${verse.text} ${verse.refLabel} ${greeting}`)
    const maxSide = style.ratio === 'lock' ? EXPORT_MAX_SIDE_LOCK : EXPORT_MAX_SIDE
    const prefix = style.ratio === 'lock' ? '잠금화면' : '말씀카드'
    const base = `${prefix}_${verse.refLabel.replace(/[\s:]/g, '_')}`
    const files: File[] = []
    for (let i = 0; i < slides.length; i++) {
      const canvas = createCardCanvas(photo.img, maxSide, style.frame, style.ratio)
      drawVerseCard(canvas, photo.img, slides[i].text, slides[i].refLabel, style, { greeting: slides[i].greeting })
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94))
      if (!blob) return []
      const name = slides.length > 1 ? `${base}_${i + 1}.jpg` : `${base}.jpg`
      files.push(new File([blob], name, { type: 'image/jpeg' }))
    }
    return files
  }, [photo, verse, slides, style, greeting])

  // 저장 — 파일 다운로드 (모바일은 다운로드 폴더/파일 앱, 데스크톱은 다운로드 폴더)
  const handleDownload = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const files = await buildCardFiles()
      if (!files.length) throw new Error('export failed')
      const urls = files.map((f) => URL.createObjectURL(f))
      files.forEach((f, i) => {
        const a = document.createElement('a')
        a.href = urls[i]
        a.download = f.name
        a.click()
      })
      // 첫 장 말고는 인화 연출에 쓰지 않으니 다운로드가 시작된 뒤 해제한다
      window.setTimeout(() => urls.slice(1).forEach((u) => URL.revokeObjectURL(u)), 4000)
      if (files.length > 1) showToast(t.savedMany(files.length))
      // 다운로드 직후 인화 연출 — URL은 오버레이를 닫을 때 해제한다
      setPrintDeveloped(false)
      setPrinted(urls[0])
      markPostcardSent()
    } catch {
      showToast(t.saveFailed)
    } finally {
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildCardFiles, saving])

  // 공유 — OS 공유 시트 (아이폰에서는 여기의 "이미지 저장"으로 갤러리 저장).
  // 말씀 링크를 문구로 곁들인다 — 문구를 받지 않는 앱(인스타 등)은 조용히 이미지만 올라간다
  const handleShare = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const files = await buildCardFiles()
      if (!files.length) throw new Error('export failed')
      await navigator.share({ files, title: verse?.refLabel, text: shareText })
      markPostcardSent()
    } catch (err) {
      // 공유 시트를 사용자가 닫은 경우는 실패가 아니다
      if ((err as DOMException)?.name !== 'AbortError') showToast(t.saveFailed)
    } finally {
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildCardFiles, verse, saving, shareText])

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
    <div className="photo-verse bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen">
      {/* lg+: 좁은 폰 프레임을 풀어 편집기 폭을 확보한다.
          캔버스(좌) / 컨트롤(우) 2단 분할은 .pv-editor 미디어쿼리가 담당 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen flex flex-col lg:max-w-none lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:shadow-2xl lg:overflow-clip">
        {/* Header */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              // 홈 나누기·FAB 등 어디서 들어왔든 온 곳으로 돌아간다 — 링크 직접 진입(히스토리 없음)만 /bible로
              onClick={() => (location.key === 'default' ? navigate('/bible') : navigate(-1))}
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
          <IntroScreen
            t={t}
            language={language}
            lang={lang}
            sampleVerse={verse ?? todayVerse}
            fontsReady={fontsReady}
            resumeOffer={resumeOffer}
            sermon={sermon}
            themeText={themeText}
            themeRef={themeRef}
            bgStrip={bgStrip}
            onPickPhoto={() => fileInputRef.current?.click()}
            onResume={resumeDraft}
            onDismissResume={() => setResumeOffer(null)}
            onStartOccasion={startOccasion}
            onStartChurchVerse={startChurchVerse}
            onStartSample={startFromSample}
          />
        )}

        {/* 편집 화면 */}
        {photo && (
          <div className="pv-editor">
            <div className="pv-canvas-wrap">
              {/* 캔버스 + 잠금화면 겹침 — 겹침이 캔버스 크기를 정확히 따라가도록 한 상자에 묶는다 */}
              <div className={`pv-canvas-stage${isLock ? ' pv-canvas-stage--lock' : ''}`}>
                <canvas
                  ref={canvasRef}
                  className="pv-canvas"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
                {isLock && showLockGuide && <LockScreenGuide language={language} />}
                {isLock && (
                  <button
                    type="button"
                    className="pv-lock-toggle"
                    aria-pressed={showLockGuide}
                    onClick={() => setShowLockGuide((v) => !v)}
                  >
                    <span className="material-icons-round text-[16px]">
                      {showLockGuide ? 'visibility_off' : 'visibility'}
                    </span>
                    {showLockGuide ? t.lockGuideHide : t.lockGuideShow}
                  </button>
                )}
              </div>
            </div>

            {/* 나눈 장 넘겨 보기 */}
            {slides.length > 1 && (
              <div className="pv-pager" role="tablist" aria-label={t.slidesTitle}>
                <button
                  type="button"
                  className="pv-pager__arrow"
                  aria-label="prev"
                  disabled={slideIdx === 0}
                  onClick={() => setPreviewSlide(slideIdx - 1)}
                >
                  <span className="material-icons-round">chevron_left</span>
                </button>
                {slides.map((s, i) => (
                  <button
                    key={s.refLabel + i}
                    type="button"
                    role="tab"
                    aria-selected={i === slideIdx}
                    aria-label={t.slideOf(i + 1, slides.length)}
                    className={`pv-pager__dot${i === slideIdx ? ' pv-pager__dot--active' : ''}`}
                    onClick={() => setPreviewSlide(i)}
                  />
                ))}
                <button
                  type="button"
                  className="pv-pager__arrow"
                  aria-label="next"
                  disabled={slideIdx === slides.length - 1}
                  onClick={() => setPreviewSlide(slideIdx + 1)}
                >
                  <span className="material-icons-round">chevron_right</span>
                </button>
              </div>
            )}

            {/* 끌기 대상 — 자유 레이아웃이면서 사진이 잘렸을 때만 고른다. 나머지는 알아서 정해진다 */}
            {verse && dragMode && (
              <div className="pv-drag-row">
                {style.layout === 'classic' && canPan ? (
                  <div className="pv-seg pv-seg--small" role="radiogroup" aria-label={t.dragText}>
                    {(['text', 'photo'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={dragTarget === d}
                        className={`pv-seg__item${dragTarget === d ? ' pv-seg__item--active' : ''}`}
                        onClick={() => setDragTarget(d)}
                      >
                        <span className="material-icons-round text-[15px]">{d === 'text' ? 'text_fields' : 'pan_tool'}</span>
                        {d === 'text' ? t.dragText : t.dragPhoto}
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="pv-drag-hint">
                  {dragMode === 'text' ? t.dragHint : t.photoDragHint}
                  <span className="pv-drag-hint__sub">{t.pinchHint}</span>
                </p>
              </div>
            )}

            {/* lg+에서 우측 컨트롤 열이 되는 묶음 (그 아래 폭에서는 display:contents) */}
            <div className="pv-side">
            {/* 카드 ↔ 잠금화면 — 요즘 가장 많이 쓰는 모양이라 세부 조정에 숨기지 않고 맨 위에 둔다 */}
            <div className="pv-mode" role="radiogroup" aria-label={t.ratioLabel}>
              {([false, true] as const).map((lock) => (
                <button
                  key={String(lock)}
                  type="button"
                  role="radio"
                  aria-checked={isLock === lock}
                  className={`pv-mode__item${isLock === lock ? ' pv-mode__item--active' : ''}`}
                  onClick={() => setLockMode(lock)}
                >
                  <span className="material-icons-round text-[18px]">{lock ? 'smartphone' : 'crop_portrait'}</span>
                  {lock ? t.modeLock : t.modeCard}
                </button>
              ))}
            </div>

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
            {verse && (
              <button type="button" className="pv-edit-chip" onClick={() => setEditOpen(true)}>
                <span className="material-icons-round text-[16px]">edit_note</span>
                {t.editText}
                {verse.originalText && <span className="pv-edit-chip__badge">{t.edited}</span>}
              </button>
            )}

            {/* 스타일 컨트롤 */}
            {verse && (
              <div className="pv-controls">
                <OccasionSection
                  t={t}
                  language={language}
                  occasionId={occasionId}
                  occasion={occasion}
                  greeting={greeting}
                  greetingEditing={greetingEditing}
                  isLock={isLock}
                  onStartOccasion={startOccasion}
                  onGreetingChange={setGreeting}
                  onGreetingEditing={setGreetingEditing}
                  onNextVerse={nextOccasionVerse}
                />

                {/* 스타일 프리셋 — 내 사진으로 그린 실사 썸네일. 한 탭에 완성된 룩 */}
                <div className="pv-section">
                  <p className="pv-section__title">{t.presetTitle}</p>
                  <PresetStrip
                    img={photo.img}
                    verse={current ?? verse}
                    baseColor={baseColor}
                    lang={lang}
                    language={language}
                    active={activePreset}
                    fontsReady={fontsReady}
                    greeting={current?.greeting}
                    onSelect={(p) => applyPreset(p)}
                  />
                </div>

                {/* 여러 장으로 나누기 — 긴 말씀일 때만. 캐러셀로 넘겨 보는 카드 */}
                {canSplit(verse) && (
                  <div className="pv-section">
                    <p className="pv-section__title">{t.slidesTitle}</p>
                    <div className="pv-seg pv-seg--wide" role="radiogroup" aria-label={t.slidesTitle}>
                      {Array.from(
                        { length: (verse.parts && !verse.originalText ? Math.min(MAX_SLIDES, verse.parts.length) : MAX_SLIDES) },
                        (_, i) => i + 1,
                      ).map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={slideCount === n}
                          className={`pv-seg__item${slideCount === n ? ' pv-seg__item--active' : ''}${n === suggestedSlideCount(verse) && slideCount === 1 ? ' pv-seg__item--hint' : ''}`}
                          onClick={() => {
                            setSlideCount(n)
                            setPreviewSlide(0)
                          }}
                        >
                          {n === 1 ? t.slidesOne : t.slidesN(n)}
                        </button>
                      ))}
                    </div>
                    <p className="pv-section__note">{t.slidesHint}</p>
                  </div>
                )}

                {/* 움직이는 카드 — 녹화를 지원하는 브라우저에서만 */}
                {canRecordMotion && (
                  <button type="button" className="pv-motion-cta" onClick={() => setMotionOpen(true)}>
                    <span className="pv-motion-cta__icon">
                      <span className="material-icons-round">movie</span>
                    </span>
                    <span className="pv-motion-cta__text">
                      <span className="pv-motion-cta__title">{t.motion}</span>
                      <span className="pv-motion-cta__body">{t.motionHint}</span>
                    </span>
                    <span className="material-icons-round pv-motion-cta__chevron">chevron_right</span>
                  </button>
                )}

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
                  <DetailControls
                    t={t}
                    language={language}
                    lang={lang}
                    img={photo.img}
                    style={style}
                    onPartial={setPartial}
                    onToggleTexture={toggleTexture}
                    onPickTextBg={pickTextBg}
                    onPickRatio={pickCardRatio}
                    onFontScale={(fontScale) => setStyle((s) => ({ ...s, fontScale }))}
                  />
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

        {/* 저장 인화 연출 */}
        {printed && (
          <PrintOverlay
            t={t}
            src={printed}
            developed={printDeveloped}
            caption={verse?.refLabel}
            isLock={isLock}
            onClose={closePrint}
          />
        )}

        {pickerOpen && (
          <VersePickerSheet
            sermon={sermon}
            startInPassage={pickerPassage}
            onPick={(picked) => {
              chooseVerse(picked)
              // 직접 고른 말씀은 상황의 '다른 말씀' 순환에서 벗어난다 (인사말은 그대로)
              setOccasionId(null)
              setPickerOpen(false)
              setPickerPassage(false)
            }}
            onClose={() => {
              setPickerOpen(false)
              setPickerPassage(false)
            }}
          />
        )}

        {editOpen && verse && (
          <VerseEditSheet
            text={verse.text}
            originalText={verse.originalText}
            language={language}
            onApply={(text) => {
              if (text !== verse.text) {
                setVerse({ ...verse, text, originalText: verse.originalText ?? verse.text })
                setSlideCount(1)
                setPreviewSlide(0)
              }
              setEditOpen(false)
            }}
            onReset={() => {
              if (verse.originalText) setVerse({ ...verse, text: verse.originalText, originalText: undefined })
              setSlideCount(1)
              setPreviewSlide(0)
              setEditOpen(false)
            }}
            onClose={() => setEditOpen(false)}
          />
        )}

        {motionOpen && photo && verse && slides.length > 0 && (
          <MotionCardSheet
            img={photo.img}
            slides={slides}
            style={style}
            filenameBase={`말씀영상_${verse.refLabel.replace(/[\s:]/g, '_')}`}
            shareText={shareText}
            language={language}
            onClose={() => setMotionOpen(false)}
          />
        )}
      </div>
      </div>
    </div>
  )
}

export default PhotoVerse
