import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleBooks } from '../../../hooks/useBible'
import { useDailyVerse } from '../../../hooks/useDailyVerse'
import { ensureFontFamily } from '../../../utils/deferredFonts'

// 카드 전용 서체(붓글씨·손글씨·날짜 스탬프)는 이 화면 청크가 로드될 때 받기 시작한다
ensureFontFamily('nanumBrush')
ensureFontFamily('nanumPen')
ensureFontFamily('orbitron')
import VersePickerSheet from './VersePickerSheet'
import { compactReference, getTodayRecommended } from './recommendedVerses'
import type { PickedVerse } from './recommendedVerses'
import { CARD_PRESETS } from './cardPresets'
import type { CardPreset } from './cardPresets'
import { BACKGROUNDS, CARD_LAYOUTS, DEFAULT_CARD_STYLE, LOCK_SAFE, backgroundCss, cropRect, createBackgroundImage, createCardCanvas, drawVerseCard, ensureCardFonts, getSeasonStamp, measureImageLuminance } from './photoVerseCanvas'
import type { CardRatioId, CardTextBg, CardTextureId, VerseBackground, VerseCardStyle } from './photoVerseCanvas'
import { FilterStrip, PresetStrip } from './components/StyleStrips'
import { IntroSamples } from './components/IntroSamples'
import { LayoutGlyph } from './components/LayoutGlyph'
import LockScreenGuide from './components/LockScreenGuide'
import MotionCardSheet from './components/MotionCardSheet'
import VerseEditSheet from './components/VerseEditSheet'
import { pickMotionMime } from './motionCard'
import { MAX_SLIDES, canSplit, splitIntoSlides, suggestedSlideCount } from './slides'
import { verseLinkFromRef } from './verseLink'
import { isResumable, loadDraft, saveDraft } from './draft'
import { GREETING_MAX, OCCASIONS, findOccasion } from './occasions'
import type { CardOccasion } from './occasions'
import { passageLabel, useRecentSermonPassage } from './churchVerses'
import type { SermonPassage } from './churchVerses'
import './PhotoVerse.css'

// 미리보기는 화면용으로 캡, 저장본은 원본 해상도(최대 2048px)로 다시 그린다
const PREVIEW_MAX_SIDE = 1280
const EXPORT_MAX_SIDE = 2048
// 잠금화면은 요즘 폰 세로 해상도(2556~2400px)에 맞춰 더 크게 — 원본보다 키우지는 않는다
const EXPORT_MAX_SIDE_LOCK = 2560

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

// 우리 교회 말씀(설교 본문·올해의 말씀)으로 시작할 때의 룩 — 종이 배경 + 절기 에디션 프레임
const CHURCH_BG_ID = 'cream'
const CHURCH_PRESET_ID = 'season'

/** 한국 시간 기준 날짜 번호 — 상황별 말씀을 하루 단위로 돌려 쓴다 */
const kstDayNumber = (ms: number) => Math.floor((ms + 9 * 60 * 60 * 1000) / 86_400_000)


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
  // 캔버스 위 손가락들과 진행 중인 제스처 (끌기: 글/사진, 벌리기: 글자 크기)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const gestureRef = useRef<
    | { kind: 'text' | 'photo'; startX: number; startY: number; origin: { x: number; y: number } }
    | { kind: 'pinch'; dist: number; scale: number }
    | null
  >(null)
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
      ratio: { original: '원본', '1:1': '1:1', '4:5': '4:5', '9:16': '9:16', lock: '잠금화면' },
      textureLabel: '질감',
      texture: { grain: '그레인', leak: '빛샘', vignette: '비네트', stamp: '날짜' },
      printedHint: '이미지가 저장되었어요 · 탭해서 닫기',
      bgTitle: '감성 배경',
      back: '뒤로',
      modeCard: '카드',
      modeLock: '잠금화면',
      lockGuideHide: '시계 가리기',
      lockGuideShow: '시계 보기',
      lockSavedHint: '저장한 이미지를 사진첩에서 배경화면으로 설정해보세요',
      dragText: '글 옮기기',
      dragPhoto: '사진 옮기기',
      photoDragHint: '사진을 드래그해 보일 부분을 고를 수 있어요',
      pinchHint: '두 손가락으로 글자 크기를 바꿀 수 있어요',
      editText: '문구 다듬기',
      edited: '다듬음',
      slidesTitle: '여러 장으로 나누기',
      slidesOne: '한 장',
      slidesN: (n: number) => `${n}장`,
      slidesHint: '인스타 캐러셀처럼 넘겨 보는 카드로 나눠 담아요',
      slideOf: (i: number, n: number) => `${i} / ${n}`,
      motion: '움직이는 카드',
      motionHint: '사진이 천천히 다가오고 말씀이 스며드는 짧은 영상',
      resumeTitle: '이어서 만들기',
      resumeBody: '지난번 만들던 말씀 카드가 있어요',
      resumeDismiss: '새로 시작',
      savedMany: (n: number) => `${n}장의 이미지가 저장되었어요`,
      occasionTitle: '누구에게 보내요?',
      occasionBody: '고르면 말씀과 인사말이 함께 채워져요',
      churchTitle: '이번 주 우리 교회 말씀',
      churchBody: '온 교회가 함께 붙잡는 말씀으로 만들어요',
      themeBadge: `${new Date().getFullYear()} 올해의 말씀`,
      sermonPick: '본문에서 고르기',
      greetingAdd: '인사말 넣기',
      greetingPlaceholder: '예) 김○○ 집사님, 생일 축하해요',
      greetingHint: '받는 분 이름을 넣으면 더 따뜻해요',
      greetingLockNote: '잠금화면에는 인사말이 들어가지 않아요',
      greetingRemove: '인사말 지우기',
      otherVerse: '다른 말씀',
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
      ratio: { original: 'Original', '1:1': '1:1', '4:5': '4:5', '9:16': '9:16', lock: 'Lock screen' },
      textureLabel: 'Texture',
      texture: { grain: 'Grain', leak: 'Light leak', vignette: 'Vignette', stamp: 'Date' },
      printedHint: 'Image saved · tap to close',
      bgTitle: 'Backgrounds',
      back: 'Back',
      modeCard: 'Card',
      modeLock: 'Lock screen',
      lockGuideHide: 'Hide clock',
      lockGuideShow: 'Show clock',
      lockSavedHint: 'Set the saved image as your wallpaper from Photos',
      dragText: 'Move text',
      dragPhoto: 'Move photo',
      photoDragHint: 'Drag the photo to choose what stays in frame',
      pinchHint: 'Pinch with two fingers to resize the text',
      editText: 'Edit text',
      edited: 'Edited',
      slidesTitle: 'Split into slides',
      slidesOne: 'One',
      slidesN: (n: number) => `${n}`,
      slidesHint: 'Split a long passage into a swipeable carousel',
      slideOf: (i: number, n: number) => `${i} / ${n}`,
      motion: 'Moving card',
      motionHint: 'A short video: the photo drifts in as the Word appears',
      resumeTitle: 'Pick up where you left off',
      resumeBody: 'You have a verse card in progress',
      resumeDismiss: 'Start new',
      savedMany: (n: number) => `${n} images saved`,
      occasionTitle: 'Who is it for?',
      occasionBody: 'Pick one and the verse and greeting are filled in',
      churchTitle: "Our church's word this week",
      churchBody: 'Make a card with the word the whole church is holding',
      themeBadge: `${new Date().getFullYear()} Theme Verse`,
      sermonPick: 'Pick from passage',
      greetingAdd: 'Add a greeting',
      greetingPlaceholder: 'e.g. Happy birthday, Grace',
      greetingHint: 'Add their name to make it personal',
      greetingLockNote: 'Greetings are left off lock screens',
      greetingRemove: 'Remove greeting',
      otherVerse: 'Another verse',
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

  // ── 캔버스 제스처 — 한 손가락: 글(자유 레이아웃) 또는 사진 크롭 이동, 두 손가락: 글자 크기 ──
  // 사진 옮기기는 비율로 잘렸을 때만 의미가 있다
  const canPan = style.ratio !== 'original'
  const dragMode: 'text' | 'photo' | null = !verse
    ? null
    : style.layout === 'classic' && (dragTarget === 'text' || !canPan)
      ? 'text'
      : canPan
        ? 'photo'
        : null

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!verse) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const pts = pointersRef.current
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]
      gestureRef.current = { kind: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: style.fontScale }
      return
    }
    if (pts.size !== 1 || !dragMode) return
    gestureRef.current = {
      kind: dragMode,
      startX: e.clientX,
      startY: e.clientY,
      origin: dragMode === 'text' ? { ...style.pos } : { ...style.focus },
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const pts = pointersRef.current
    if (!pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gestureRef.current
    if (!g) return
    if (g.kind === 'pinch') {
      if (pts.size < 2) return
      const [a, b] = [...pts.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      setStyle((s) => ({ ...s, fontScale: clamp(g.scale * (d / g.dist), 0.03, 0.09) }))
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - g.startX) / rect.width
    const dy = (e.clientY - g.startY) / rect.height
    if (g.kind === 'text') {
      // 잠금화면은 글 자리가 가운데 띠라 같은 손가락 이동이 더 큰 비율 변화다
      const band = isLock ? LOCK_SAFE.bottom - LOCK_SAFE.top : 1
      setStyle((s) => ({
        ...s,
        pos: {
          x: clamp(g.origin.x + dx, 0.05, 0.95),
          y: clamp(g.origin.y + dy / band, 0.05, 0.95),
        },
      }))
      return
    }
    if (!photo) return
    // 사진 옮기기 — 손가락을 오른쪽으로 끌면 사진의 왼쪽이 드러난다 (손가락에 붙어 움직이는 느낌)
    const img = photo.img
    const crop = cropRect(img, style.ratio)
    const spareX = img.naturalWidth - crop.sw
    const spareY = img.naturalHeight - crop.sh
    setStyle((s) => ({
      ...s,
      focus: {
        x: spareX > 1 ? clamp(g.origin.x - (dx * crop.sw) / spareX, 0, 1) : 0.5,
        y: spareY > 1 ? clamp(g.origin.y - (dy * crop.sh) / spareY, 0, 1) : 0.5,
      },
    }))
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const pts = pointersRef.current
    pts.delete(e.pointerId)
    // 두 손가락 중 하나를 떼면 크기 조절 끝 — 남은 손가락으로 끌려가지 않게 제스처를 비운다
    if (pts.size === 0 || gestureRef.current?.kind === 'pinch') gestureRef.current = null
  }

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
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen flex flex-col lg:max-w-none lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-clip">
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

            {/* 이어서 만들기 — 지난번 말씀과 스타일이 남아 있을 때만 */}
            {resumeOffer?.verse && (
              <div className="pv-resume">
                <button type="button" className="pv-resume__main" onClick={resumeDraft}>
                  <span className="material-icons-round pv-resume__icon">history</span>
                  <span className="pv-resume__text">
                    <span className="pv-resume__title">{t.resumeTitle}</span>
                    <span className="pv-resume__ref">{resumeOffer.verse.refLabel}</span>
                  </span>
                  <span className="material-icons-round pv-resume__chevron">chevron_right</span>
                </button>
                <button type="button" className="pv-resume__dismiss" onClick={() => setResumeOffer(null)}>
                  {t.resumeDismiss}
                </button>
              </div>
            )}

            {/* 상황별 카드 — 카드를 만드는 이유는 대개 누군가에게 마음을 보내는 것이다 */}
            <div className="pv-intro__occasions">
              <p className="pv-intro__bg-title">{t.occasionTitle}</p>
              <p className="pv-intro__bg-body">{t.occasionBody}</p>
              <div className="pv-occasions">
                {OCCASIONS.map((o) => (
                  <button key={o.id} type="button" className="pv-occasion" onClick={() => startOccasion(o)}>
                    <span className="material-icons-round pv-occasion__icon" aria-hidden="true">{o.icon}</span>
                    <span className="pv-occasion__name">{language === 'ko' ? o.nameKo : o.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 우리 교회 말씀 — 이번 주 설교 본문과 올해의 말씀. 온 교회가 같은 말씀으로 카드를 만든다 */}
            {(sermon || themeText) && (
              <div className="pv-intro__church">
                <p className="pv-intro__bg-title">{t.churchTitle}</p>
                <p className="pv-intro__bg-body">{t.churchBody}</p>
                {sermon && (
                  <button type="button" className="pv-today pv-today--theme" onClick={() => startChurchVerse()}>
                    <span className="pv-today__badge">
                      <span className="material-icons-round text-[13px]">church</span>
                      {sermon.badge ?? (lang === 'en' ? 'Sermon passage' : '설교 본문')}
                    </span>
                    {sermon.title && <span className="pv-today__text">「{sermon.title}」</span>}
                    <span className="pv-today__ref">
                      {passageLabel(sermon.ref)} · {t.sermonPick}
                      <span className="material-icons-round text-[15px] align-[-3px]">chevron_right</span>
                    </span>
                  </button>
                )}
                {themeText && (
                  <button
                    type="button"
                    className="pv-today pv-today--theme"
                    onClick={() => startChurchVerse({ text: themeText, refLabel: themeRef || t.themeBadge })}
                  >
                    <span className="pv-today__badge">
                      <span className="material-icons-round text-[13px]">workspace_premium</span>
                      {t.themeBadge}
                    </span>
                    <span className="pv-today__text">{themeText}</span>
                    {themeRef && <span className="pv-today__ref">{themeRef}</span>}
                  </button>
                )}
              </div>
            )}

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
              {/* 캔버스 + 잠금화면 겹침 — 겹침이 캔버스 크기를 정확히 따라가도록 한 상자에 묶는다 */}
              <div className={`pv-canvas-stage${isLock ? ' pv-canvas-stage--lock' : ''}`}>
                <canvas
                  ref={canvasRef}
                  className="pv-canvas"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
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
                {/* 상황 · 인사말 — 상황을 고르면 말씀·인사말·룩이 함께 바뀐다. 인사말은 직접 고칠 수 있다 */}
                <div className="pv-section">
                  <p className="pv-section__title">{t.occasionTitle}</p>
                  <div className="pv-occasion-row" role="radiogroup" aria-label={t.occasionTitle}>
                    {OCCASIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={occasionId === o.id}
                        className={`pv-occasion-chip${occasionId === o.id ? ' pv-occasion-chip--active' : ''}`}
                        onClick={() => startOccasion(o)}
                      >
                        <span className="material-icons-round text-[16px]" aria-hidden="true">{o.icon}</span>
                        {language === 'ko' ? o.nameKo : o.nameEn}
                      </button>
                    ))}
                  </div>
                  <div className="pv-greeting">
                    {greetingEditing ? (
                      <input
                        type="text"
                        className="pv-greeting__input"
                        value={greeting}
                        maxLength={GREETING_MAX}
                        placeholder={t.greetingPlaceholder}
                        enterKeyHint="done"
                        autoFocus
                        onChange={(e) => setGreeting(e.target.value)}
                        onBlur={() => setGreetingEditing(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setGreetingEditing(false)
                        }}
                      />
                    ) : (
                      <button type="button" className="pv-greeting__chip" onClick={() => setGreetingEditing(true)}>
                        <span className="material-icons-round text-[16px]">draw</span>
                        <span className="pv-greeting__text">{greeting.trim() || t.greetingAdd}</span>
                      </button>
                    )}
                    {greeting && !greetingEditing && (
                      <button
                        type="button"
                        className="pv-greeting__remove"
                        aria-label={t.greetingRemove}
                        onClick={() => setGreeting('')}
                      >
                        <span className="material-icons-round text-[16px]">close</span>
                      </button>
                    )}
                    {occasion && occasion.verses.length > 1 && (
                      <button type="button" className="pv-greeting__chip pv-greeting__chip--plain" onClick={nextOccasionVerse}>
                        <span className="material-icons-round text-[16px]">autorenew</span>
                        {t.otherVerse}
                      </button>
                    )}
                  </div>
                  {greeting.trim() && (
                    <p className="pv-section__note">{isLock ? t.greetingLockNote : t.greetingHint}</p>
                  )}
                </div>

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
                        onClick={() => pickCardRatio(r)}
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
            {isLock && <p className="pv-print__hint pv-print__hint--strong">{t.lockSavedHint}</p>}
            <p className="pv-print__hint">{t.printedHint}</p>
          </div>
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
