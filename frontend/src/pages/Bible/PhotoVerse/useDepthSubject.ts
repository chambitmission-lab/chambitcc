// 글자 뒤로 숨기 — 사진에서 누른 대상을 오려 글자 앞으로 내보낸다.
// 대상 고르기 상태와 마스크를 들고 있고, 화면을 떠나면 분할 모델을 내려놓는다.

import { useCallback, useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { smoothScrollToElement } from '../../../utils/scrollTo'
import { cropRect, layoutFromCanvas } from './photoVerseCanvas'
import type { VerseCardStyle } from './photoVerseCanvas'
import { disposeSegmenter, preloadSegmenter, segmentSubjectAt } from './subjectSegmenter'
import type { PhotoVerseTexts } from './texts'

interface DepthSubjectInput {
  /** 지금 편집 중인 사진 — 감성 배경이면 isBackground 로 구분한다 */
  img: HTMLImageElement | null
  /** 감성 배경에는 오려낼 대상이 없다 */
  isBackground: boolean
  style: VerseCardStyle
  canvasWrapRef: RefObject<HTMLDivElement | null>
  t: PhotoVerseTexts
  showToast: (msg: string) => void
}

export const useDepthSubject = ({ img, isBackground, style, canvasWrapRef, t, showToast }: DepthSubjectInput) => {
  // 누른 대상의 마스크(그 사진에만 유효), 대상 고르는 중, 찾는 중, 모델을 한 번이라도 돌렸는지
  const [subject, setSubject] = useState<{ img: HTMLImageElement; mask: HTMLCanvasElement } | null>(null)
  const [depthPicking, setDepthPicking] = useState(false)
  const [depthBusy, setDepthBusy] = useState(false)
  const [depthReady, setDepthReady] = useState(false)

  // 사진을 바꾸면 이전 사진의 마스크는 버린다
  const subjectMask = !isBackground && subject && img && subject.img === img ? subject.mask : null

  // 새 사진이면 고르던 중이던 것도 접는다
  useEffect(() => {
    setDepthPicking(false)
  }, [img])

  // 화면을 떠나면 모델(수십 MB)을 내려놓는다 — 다시 들어와 쓰면 브라우저 캐시에서 금방 올라온다
  useEffect(() => disposeSegmenter, [])

  const startDepthPick = useCallback(() => {
    preloadSegmenter()
    setDepthPicking(true)
    // 모바일은 컨트롤이 캔버스 아래 — 누를 사진이 화면 밖이면 끌어올린다
    const el = canvasWrapRef.current
    if (el && el.getBoundingClientRect().top < 56) smoothScrollToElement(el, { offset: 72 })
  }, [canvasWrapRef])

  const cancelDepthPick = useCallback(() => setDepthPicking(false), [])
  const clearSubject = useCallback(() => setSubject(null), [])

  // 캔버스에서 누른 자리 → 원본 사진 좌표(0~1) → 그 대상을 오려낸다
  const pickSubjectAt = async (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!img || depthBusy) return
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width) * canvas.width
    const cy = ((e.clientY - rect.top) / rect.height) * canvas.height
    const l = layoutFromCanvas(canvas.width, canvas.height, style.frame)
    const pu = (cx - l.px) / l.pw
    const pv = (cy - l.py) / l.ph
    if (pu < 0 || pu > 1 || pv < 0 || pv > 1) return
    const crop = cropRect(img, style.ratio, style.focus)
    const u = (crop.sx + pu * crop.sw) / img.naturalWidth
    const v = (crop.sy + pv * crop.sh) / img.naturalHeight
    setDepthBusy(true)
    try {
      // 분할은 메인 스레드를 잠깐 붙잡는다 — '찾는 중'이 먼저 그려지게 한 프레임 양보
      await new Promise<void>((r) => requestAnimationFrame(() => window.setTimeout(r, 0)))
      const mask = await segmentSubjectAt(img, u, v)
      if (mask) {
        setSubject({ img, mask })
        setDepthPicking(false)
      } else {
        showToast(t.depthNotFound)
      }
    } catch {
      showToast(t.depthFailed)
    } finally {
      setDepthBusy(false)
      setDepthReady(true)
    }
  }

  return {
    subjectMask,
    depthPicking,
    depthBusy,
    depthReady,
    startDepthPick,
    cancelDepthPick,
    clearSubject,
    pickSubjectAt,
  }
}
