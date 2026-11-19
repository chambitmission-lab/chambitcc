// 말씀 카드 내보내기 — 저장(다운로드)·공유 시트·카카오톡 엽서와 저장 직후 인화 연출.
// 세 길 모두 renderSlideCanvas 한 곳에서 그린다(해상도만 다르다).

import { useCallback, useEffect, useState } from 'react'
import { markPostcardSent } from '../../../components/share/sharePostcardsShared'
import { canKakaoShare } from '../../../utils/kakaoShare'
import { ensureCardFonts, renderSlideCanvas } from './photoVerseCanvas'
import type { VerseCardStyle } from './photoVerseCanvas'
import type { PickedVerse } from './recommendedVerses'
import type { CardSlide } from './slides'
import type { PhotoVerseTexts } from './texts'

// 저장본은 원본 해상도(최대 2048px)로 다시 그린다
const EXPORT_MAX_SIDE = 2048
// 잠금화면은 요즘 폰 세로 해상도(2556~2400px)에 맞춰 더 크게 — 원본보다 키우지는 않는다
const EXPORT_MAX_SIDE_LOCK = 2560
// 카톡 엽서 안의 인화지는 400px 남짓으로 줄어든다 — 그 두 배면 충분하다
const POSTCARD_CARD_MAX_SIDE = 1080

interface CardExportInput {
  img: HTMLImageElement | null
  verse: PickedVerse | null
  /** 나눈 장 전체 — 저장·공유는 모두 내보낸다 */
  slides: CardSlide[]
  /** 지금 미리보기 중인 장 — 카카오 엽서는 이 한 장만 */
  current: CardSlide | undefined
  style: VerseCardStyle
  greeting: string
  subjectMask: HTMLCanvasElement | null
  shareText: string | undefined
  t: PhotoVerseTexts
  showToast: (msg: string) => void
}

export const useCardExport = ({
  img,
  verse,
  slides,
  current,
  style,
  greeting,
  subjectMask,
  shareText,
  t,
  showToast,
}: CardExportInput) => {
  const [saving, setSaving] = useState(false)
  // 저장 인화 연출 — 다운로드 후 카드가 폴라로이드처럼 서서히 현상된다
  const [printed, setPrinted] = useState<string | null>(null)
  const [printDeveloped, setPrintDeveloped] = useState(false)
  // 카카오톡 말씀 엽서 — 시트를 열 때 지금 보이는 장을 그려 둔 캔버스
  const [kakaoCard, setKakaoCard] = useState<HTMLCanvasElement | null>(null)
  const [kakaoEnabled] = useState(() => canKakaoShare())
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

  // 원본 해상도로 다시 그려 JPEG 파일 생성 (나누기면 장마다 한 장씩)
  const buildCardFiles = useCallback(async (): Promise<File[]> => {
    if (!img || !verse || !slides.length) return []
    await ensureCardFonts(`${verse.text} ${verse.refLabel} ${greeting}`)
    const lock = style.ratio === 'lock'
    const maxSide = lock ? EXPORT_MAX_SIDE_LOCK : EXPORT_MAX_SIDE
    const base = `${lock ? '잠금화면' : '말씀카드'}_${verse.refLabel.replace(/[\s:]/g, '_')}`
    const files: File[] = []
    for (let i = 0; i < slides.length; i++) {
      const canvas = renderSlideCanvas(img, slides[i], style, maxSide, subjectMask)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94))
      if (!blob) return []
      const name = slides.length > 1 ? `${base}_${i + 1}.jpg` : `${base}.jpg`
      files.push(new File([blob], name, { type: 'image/jpeg' }))
    }
    return files
  }, [img, verse, slides, style, greeting, subjectMask])

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
  }, [buildCardFiles, saving, showToast, t])

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
  }, [buildCardFiles, verse, saving, shareText, showToast, t])

  // 카카오톡 말씀 엽서 — 지금 미리보기 중인 장을 엽서용으로 그려 시트에 넘긴다
  const openKakaoPostcard = useCallback(async () => {
    if (!img || !verse || !current) return
    await ensureCardFonts(`${verse.text} ${verse.refLabel} ${greeting}`)
    setKakaoCard(renderSlideCanvas(img, current, style, POSTCARD_CARD_MAX_SIDE, subjectMask))
  }, [img, verse, current, style, greeting, subjectMask])

  const closeKakaoPostcard = useCallback(() => setKakaoCard(null), [])

  return {
    saving,
    printed,
    printDeveloped,
    closePrint,
    handleDownload,
    handleShare,
    canShareFile,
    kakaoEnabled,
    kakaoCard,
    openKakaoPostcard,
    closeKakaoPostcard,
  }
}
