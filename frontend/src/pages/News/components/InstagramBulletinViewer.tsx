import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Bulletin, BulletinPage } from '../../../types/bulletin'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { safeStorage } from '../../../utils/safeStorage'
import { SEASON_LABEL, fill, issueDateText, pageSrc, pageThumb, toIssue } from './bulletinIssue'
import { prefetchPageFile, shareBulletinLink, shareBulletinPage } from './bulletinShare'
import { isWarm, warmImage, warmPagesAround } from './bulletinWarm'
import './InstagramBulletinViewer.css'

interface InstagramBulletinViewerProps {
  bulletin: Bulletin
  onClose: () => void
  /** 처음 펼칠 쪽(0부터) — 목록의 쪽 띠에서 고른 쪽부터 바로 연다 */
  initialPage?: number
  /** 마무리 카드의 '지난 주 주보' — 목록에서 바로 앞 주 */
  olderBulletin?: Bulletin
  onOpenBulletin?: (bulletin: Bulletin) => void
  /** 지난 주 주보를 여는 중 */
  opening?: boolean
}

/** s = 전체 맞춤 크기 대비 배율(1 = 한 쪽이 화면에 다 들어옴), x·y = 무대 기준 그림 왼쪽 위 위치(px) */
interface View {
  s: number
  x: number
  y: number
}

/** 쪽을 넘겨도 이어지는 보기 방식 — 폭 맞춤으로 읽던 사람은 다음 쪽도 폭 맞춤 맨 위에서 시작 */
type FitMode = 'contain' | 'width'

const HINT_KEY = 'bulletin-viewer-hint-v1'
const DOUBLE_TAP_MS = 300
const DRAG_THRESHOLD = 6
/** 넘김 미끄러짐 시간(ms) — CSS .bv-rail.is-sliding 과 맞춘다 */
const SLIDE_MS = 320
/** 옆 쪽 사이 틈(px) */
const PEEK_GAP = 12

/**
 * 옆 쪽 그림 — 읽기용 원본이 아직 안 왔으면 목록에서 이미 받아 둔 480px 썸네일을 먼저 세운다.
 * 옆 쪽은 0.9배·반투명이라 썸네일로도 티가 안 나고, 원본이 도착하면 같은 자리에서 또렷해진다.
 * (처음 여는 주보에서 다음 쪽이 빈 채로 있다가 뒤늦게 끼어들던 것의 해결)
 *
 * 원본은 썸네일 위에 겹쳐 올리고 opacity 로 스며들게 한다 — 한 <img> 의 src 를 바꿔 끼우면
 * decoding=async 와 만나 한 프레임 비었다가 다시 그려져서 '툭 새로고침'처럼 보였다.
 */
const PeekImage = ({ page }: { page: BulletinPage }) => {
  const full = pageSrc(page)
  const thumb = pageThumb(page)
  // 이 세션에서 이미 받아 둔 그림이면 썸네일 단계 없이 원본만 — 처음부터 또렷하게
  const [warmAtMount] = useState(() => isWarm(full))
  // 썸네일이 따로 없는 옛 주보는 겹칠 게 없으니 바로 보이게
  const [ready, setReady] = useState(warmAtMount || thumb === full)
  useEffect(() => {
    // 뷰어 쪽 미리 받기 명단에도 올려 두어 다음부턴 처음부터 원본으로 선다
    warmImage(full)
  }, [full])
  const markReady = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.naturalWidth > 0) setReady(true)
  }
  return (
    <>
      {!warmAtMount && thumb !== full && <img src={thumb} alt="" draggable={false} decoding="async" />}
      <img
        className={`bv-peek-full ${ready ? 'is-ready' : ''}`}
        src={full}
        alt=""
        draggable={false}
        decoding="async"
        onLoad={markReady}
        // 캐시에서 바로 오면 onLoad 가 붙기 전에 끝나 있을 수 있다
        ref={el => {
          if (el?.complete && el.naturalWidth > 0) setReady(true)
        }}
      />
    </>
  )
}

const InstagramBulletinViewer = ({
  bulletin,
  onClose,
  initialPage = 0,
  olderBulletin,
  onOpenBulletin,
  opening = false,
}: InstagramBulletinViewerProps) => {
  const { t, language } = useLanguage()
  const ko = language !== 'en'
  const [currentPage, setCurrentPage] = useState(() =>
    Math.min(Math.max(initialPage, 0), Math.max((bulletin.pages?.length ?? 1) - 1, 0)),
  )
  const [showControls, setShowControls] = useState(true)
  // PC(lg+)는 마우스로 넘기는 자리라 버튼이 3초 뒤 사라지면 어르신이 넘기는 법을 잃는다 — 늘 보인다
  const isLg = useMediaQuery('(min-width: 1024px)')
  const controlsOn = showControls || isLg

  const pages = [...(bulletin.pages ?? [])].sort((a, b) => a.page_number - b.page_number)
  const totalPages = pages.length
  // 마지막 쪽 다음 칸(= totalPages)은 '다 읽었어요' 마무리 카드
  const onEnd = totalPages > 0 && currentPage === totalPages
  const issue = toIssue(bulletin)
  const issueLabel = fill(t('newsBulletinIssue'), { vol: issue.vol, no: issue.no })
  const dateText = issueDateText(issue, language)

  // ── 확대 엔진 상태 ──────────────────────────────────────────
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [view, setViewState] = useState<View>({ s: 1, x: 0, y: 0 })
  // 버튼·더블클릭처럼 "한 번에 이동"할 때만 부드럽게 — 끌기·휠·핀치 중에 transition 이 걸리면 손을 늦게 따라온다
  const [animate, setAnimate] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [fitMode, setFitMode] = useState<FitMode>('contain')
  const [showHint, setShowHint] = useState(() => safeStorage.get(HINT_KEY) !== '1')
  const viewRef = useRef(view)

  // 위·아래는 머리말·쪽 표시 자리, PC 좌우는 넘기기 버튼 자리, 모바일 좌우는 옆 쪽이 살짝 보이는 자리 —
  // 맞춤 크기는 이 안쪽에서 잡는다
  const side = isLg ? 120 : Math.round(stage.w * 0.08)
  const inset = isLg ? { t: 104, b: 116, l: side, r: side } : { t: 68, b: 124, l: side, r: side }
  // 확대해서 끌 때 모바일은 좌우 끝까지 쓴다(옆 쪽 자리는 맞춤 상태에서만 필요)
  const panL = isLg ? inset.l : 0
  const panR = isLg ? inset.r : 0
  const availW = Math.max(stage.w - inset.l - inset.r, 1)
  const availH = Math.max(stage.h - inset.t - inset.b, 1)
  const ratio = natural.w && natural.h ? Math.min(availW / natural.w, availH / natural.h) : 0
  const baseW = natural.w * ratio
  const baseH = natural.h * ratio
  const ready = baseW > 0 && stage.w > 0
  const widthScale = ready ? Math.max(availW / baseW, 1) : 1
  // 원본 화소 2배까지는 볼 수 있게 — 작은 글씨도 끝까지 키울 수 있어야 한다
  const maxScale = ready ? Math.max(4, widthScale * 2.5, (natural.w / baseW) * 2) : 4

  const clamp = useCallback(
    (v: View): View => {
      const s = Math.min(Math.max(v.s, 1), maxScale)
      const w = baseW * s
      const h = baseH * s
      // 화면보다 작으면 가운데, 크면 가장자리가 머리말·버튼 자리를 넘어 숨지 않을 만큼만 움직인다
      const axis = (pos: number, size: number, full: number, a: number, b: number, pa = a, pb = b) => {
        const room = full - a - b
        if (size <= room) return a + (room - size) / 2
        return Math.min(Math.max(pos, full - pb - size), pa)
      }
      return {
        s,
        x: axis(v.x, w, stage.w, inset.l, inset.r, panL, panR),
        y: axis(v.y, h, stage.h, inset.t, inset.b),
      }
    },
    [baseW, baseH, maxScale, stage.w, stage.h, inset.l, inset.r, inset.t, inset.b, panL, panR],
  )

  const setView = useCallback(
    (next: View, smooth = false) => {
      const v = clamp(next)
      viewRef.current = v
      setAnimate(smooth)
      setViewState(v)
    },
    [clamp],
  )

  /** (cx, cy) 무대 좌표에 있는 그림 위의 점을 그 자리에 붙든 채 배율만 바꾼다 */
  const zoomAt = useCallback(
    (nextS: number, cx: number, cy: number, smooth = false) => {
      const cur = viewRef.current
      const s = Math.min(Math.max(nextS, 1), maxScale)
      const px = (cx - cur.x) / cur.s
      const py = (cy - cur.y) / cur.s
      setView({ s, x: cx - px * s, y: cy - py * s }, smooth)
    },
    [maxScale, setView],
  )

  const applyFit = useCallback(
    (mode: FitMode, smooth = false) => {
      if (mode === 'width') setView({ s: widthScale, x: 0, y: inset.t }, smooth)
      else setView({ s: 1, x: 0, y: 0 }, smooth)
    },
    [setView, widthScale, inset.t],
  )

  const zoomBy = (factor: number) => zoomAt(viewRef.current.s * factor, stage.w / 2, stage.h / 2, true)

  // 무대 크기 — 창 크기를 바꾸면 맞춤도 다시
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 새 쪽이 뜨거나 화면 크기가 바뀌면 지금 보기 방식으로 다시 맞춘다
  useLayoutEffect(() => {
    if (ready) applyFit(fitMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, baseW, baseH, stage.w, stage.h, currentPage])

  // 앞뒤 쪽 미리 받아 두기 — 넘길 때 빈 화면 없이. 지금 쪽도 함께 적어 두어야 뒤로 넘겼을 때
  // 옆 쪽으로 물러난 그 쪽이 썸네일 단계를 건너뛴다
  useEffect(() => {
    warmPagesAround(pages, currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages])

  const dismissHint = useCallback(() => {
    setShowHint(prev => {
      if (prev) safeStorage.set(HINT_KEY, '1')
      return false
    })
  }, [])

  useEffect(() => {
    if (!showHint) return
    const id = window.setTimeout(dismissHint, 5000)
    return () => window.clearTimeout(id)
  }, [showHint, dismissHint])

  // 뒤로가기 → 뷰어만 닫기
  useModalBackButton(onClose)

  // 컨트롤 자동 숨김(모바일)
  useEffect(() => {
    if (!showControls) return
    const id = window.setTimeout(() => setShowControls(false), 3000)
    return () => window.clearTimeout(id)
  }, [showControls, currentPage])

  // 크기(natural)는 일부러 비우지 않는다 — 쪽마다 거의 같은 판형이라 앞 쪽 크기로 바로 그리고,
  // 새 쪽이 뜨면 onLoad 가 맞춰 준다(비우면 넘길 때마다 한 번 깜빡인다)
  const goToPage = useCallback(
    (next: number) => {
      if (next < 0 || next > totalPages) return
      setCurrentPage(next)
    },
    [totalPages],
  )

  // ── 손가락을 따라오는 넘김 ─────────────────────────────────
  // 맞춤 상태에서 가로로 끌면 레일(지금 쪽 + 양옆 쪽)이 손을 따라 움직이고, 놓으면 한 칸 미끄러진 뒤 쪽이 바뀐다
  const [swipe, setSwipe] = useState(0)
  const [sliding, setSliding] = useState(false)
  const slideTimer = useRef<number | undefined>(undefined)
  const slideStep = baseW + PEEK_GAP

  const slideTo = useCallback(
    (dir: 1 | -1) => {
      const next = currentPage + dir
      if (next < 0 || next > totalPages || slideTimer.current !== undefined) return
      setSliding(true)
      setSwipe(-dir * slideStep)
      slideTimer.current = window.setTimeout(() => {
        slideTimer.current = undefined
        setSliding(false)
        setSwipe(0)
        goToPage(next)
      }, SLIDE_MS)
    },
    [currentPage, totalPages, slideStep, goToPage],
  )

  const springBack = () => {
    setSliding(true)
    setSwipe(0)
    window.setTimeout(() => setSliding(false), SLIDE_MS)
  }

  /** 버튼·키보드 넘기기 — 맞춤 상태면 미끄러지게, 확대 중이면 바로 */
  const turnPage = (dir: 1 | -1) => {
    if (ready && !isZoomed()) slideTo(dir)
    else goToPage(currentPage + dir)
  }

  // ── 휠 · 트랙패드 핀치: 커서가 가리키는 곳을 중심으로 ──────────────
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (onEnd) return
      const rect = el.getBoundingClientRect()
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      // 트랙패드 핀치는 ctrlKey 가 붙고 delta 가 잘다 — 같은 손동작이 같은 만큼 커지게 감도를 나눈다
      const k = e.ctrlKey ? 0.01 : 0.0022
      const factor = Math.exp(-Math.max(Math.min(dy, 120), -120) * k)
      zoomAt(viewRef.current.s * factor, e.clientX - rect.left, e.clientY - rect.top)
      dismissHint()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt, dismissHint, onEnd])

  // ── 포인터(마우스·손가락 공통): 끌어서 이동 · 두 손가락 핀치 · 더블탭 · 스와이프 ──
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef({
    startX: 0,
    startY: 0,
    startView: view,
    pinchDist: 0,
    pinchMid: { x: 0, y: 0 },
    moved: false,
    pinched: false,
    axis: null as 'x' | 'y' | null,
  })
  const lastTap = useRef({ t: 0, x: 0, y: 0 })
  const tapTimer = useRef<number | undefined>(undefined)
  const velocity = useRef({ vx: 0, vy: 0, t: 0, x: 0, y: 0 })
  const inertiaRaf = useRef<number | undefined>(undefined)

  const stopInertia = () => {
    if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current)
    inertiaRaf.current = undefined
  }

  const local = (e: { clientX: number; clientY: number }) => {
    const rect = stageRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const isZoomed = () => {
    if (onEnd) return false
    const v = viewRef.current
    return baseW * v.s > stage.w - inset.l - inset.r + 1 || baseH * v.s > stage.h - inset.t - inset.b + 1
  }

  const beginPinch = () => {
    const [a, b] = [...pointers.current.values()]
    gesture.current.pinchDist = Math.hypot(a.x - b.x, a.y - b.y) || 1
    gesture.current.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    gesture.current.startView = viewRef.current
    gesture.current.pinched = true
  }

  const beginPan = (p: { x: number; y: number }) => {
    gesture.current.startX = p.x
    gesture.current.startY = p.y
    gesture.current.startView = viewRef.current
    velocity.current = { vx: 0, vy: 0, t: performance.now(), x: p.x, y: p.y }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    stopInertia()
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size === 1) {
      gesture.current.moved = false
      gesture.current.pinched = false
      beginPan(p)
    } else if (pointers.current.size === 2) {
      beginPinch()
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    const g = gesture.current

    if (pointers.current.size >= 2) {
      g.moved = true
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const sv = g.startView
      const s = Math.min(Math.max((sv.s * dist) / g.pinchDist, 1), maxScale)
      // 처음 집은 점이 두 손가락 가운데를 따라오게 — 집으면서 옮기기도 된다
      const px = (g.pinchMid.x - sv.x) / sv.s
      const py = (g.pinchMid.y - sv.y) / sv.s
      setView({ s, x: mid.x - px * s, y: mid.y - py * s })
      return
    }

    const dx = p.x - g.startX
    const dy = p.y - g.startY
    if (!g.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!g.moved) {
      g.moved = true
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      // 캡처는 끌기 임계치를 넘은 뒤에만 — 처음부터 잡으면 자식 click 이 죽는다(frontend-pitfalls)
      const el = e.currentTarget as HTMLElement
      if (!el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId)
    }
    if (isZoomed()) {
      setDragging(true)
      setView({ s: g.startView.s, x: g.startView.x + dx, y: g.startView.y + dy })
      const now = performance.now()
      const dt = Math.max(now - velocity.current.t, 1)
      velocity.current = {
        vx: (p.x - velocity.current.x) / dt,
        vy: (p.y - velocity.current.y) / dt,
        t: now,
        x: p.x,
        y: p.y,
      }
    } else if (g.axis === 'x' && slideTimer.current === undefined) {
      // 처음·마지막 칸에서 바깥쪽으로 끌면 고무줄처럼 덜 따라온다
      const edge = (currentPage === 0 && dx > 0) || (currentPage === totalPages && dx < 0)
      setSwipe(edge ? dx * 0.3 : dx)
    }
  }

  const handleTap = (p: { x: number; y: number }, isMouse: boolean) => {
    const now = Date.now()
    const lt = lastTap.current
    if (!onEnd && now - lt.t < DOUBLE_TAP_MS && Math.hypot(p.x - lt.x, p.y - lt.y) < 40) {
      // 두 번 누름: 누른 그 자리를 크게, 이미 커져 있으면 원래대로
      window.clearTimeout(tapTimer.current)
      lastTap.current = { t: 0, x: 0, y: 0 }
      const fitS = fitMode === 'width' ? widthScale : 1
      if (Math.abs(viewRef.current.s - fitS) < 0.05) zoomAt(Math.max(2.5, fitS * 1.6), p.x, p.y, true)
      else applyFit(fitMode, true)
      dismissHint()
      return
    }
    lastTap.current = { t: now, x: p.x, y: p.y }
    // 한 번 누름(모바일): 컨트롤 토글 — 두 번 누름과 겹치지 않게 잠깐 기다린다
    if (!isMouse) {
      window.clearTimeout(tapTimer.current)
      tapTimer.current = window.setTimeout(() => setShowControls(v => !v), DOUBLE_TAP_MS)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    const p = local(e)
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    setDragging(false)

    if (pointers.current.size === 1) {
      // 핀치하다 한 손가락을 떼면 남은 손가락으로 이어서 끌기
      beginPan([...pointers.current.values()][0])
      return
    }
    if (pointers.current.size > 0) return

    if (!g.moved) {
      handleTap(p, e.pointerType === 'mouse')
      return
    }
    if (g.pinched) return

    const dx = p.x - g.startX
    if (!isZoomed()) {
      // 맞춤 상태의 가로 스와이프 = 쪽 넘기기 — 한 칸의 18% 넘게 끌었으면 넘기고, 아니면 제자리로
      if (slideTimer.current !== undefined) return
      const dir = dx < 0 ? 1 : -1
      const target = currentPage + dir
      if (g.axis === 'x' && Math.abs(dx) > Math.max(50, slideStep * 0.18) && target >= 0 && target <= totalPages) {
        slideTo(dir)
      } else if (swipe !== 0) {
        springBack()
      }
      return
    }

    // 손을 놓은 속도로 조금 더 미끄러지기
    let { vx, vy } = velocity.current
    if (performance.now() - velocity.current.t > 80) return
    const step = () => {
      vx *= 0.92
      vy *= 0.92
      if (Math.hypot(vx, vy) < 0.02) return stopInertia()
      const cur = viewRef.current
      setView({ s: cur.s, x: cur.x + vx * 16, y: cur.y + vy * 16 })
      inertiaRaf.current = requestAnimationFrame(step)
    }
    inertiaRaf.current = requestAnimationFrame(step)
  }

  const handlePointerCancel = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    setDragging(false)
    if (swipe !== 0 && slideTimer.current === undefined) springBack()
  }

  useEffect(() => () => {
    stopInertia()
    window.clearTimeout(tapTimer.current)
    window.clearTimeout(slideTimer.current)
  }, [])

  // ── 키보드: ←→ 쪽 · ↑↓ 확대 중 이동 · + − 확대 · 0 맞춤 · Esc 닫기 ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cur = viewRef.current
      if (e.key === 'ArrowLeft') turnPage(-1)
      else if (e.key === 'ArrowRight') turnPage(1)
      else if (e.key === 'ArrowUp') setView({ ...cur, y: cur.y + 160 }, true)
      else if (e.key === 'ArrowDown') setView({ ...cur, y: cur.y - 160 }, true)
      else if (e.key === '+' || e.key === '=') zoomAt(cur.s * 1.4, stage.w / 2, stage.h / 2, true)
      else if (e.key === '-' || e.key === '_') zoomAt(cur.s / 1.4, stage.w / 2, stage.h / 2, true)
      else if (e.key === '0') applyFit(fitMode, true)
      else if (e.key === 'Escape') onClose()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, goToPage, setView, zoomAt, applyFit, fitMode, stage.w, stage.h, onClose, slideTo, ready])

  // ── 표지 색 배경: 주보 한 부 동안 고정 — 쪽마다 바꾸면 넘길 때 화면 전체가 출렁여 멀미가 난다 ──
  const bgUrl = pages[0] ? pageThumb(pages[0]) : bulletin.thumbnail_url

  // ── 이 쪽 보내기: 쪽이 자리 잡으면 공유용 파일을 미리 받아 둔다(누른 뒤 받으면 iOS 가 공유 시트를 막는다) ──
  const shareFiles = useRef(new Map<number, File>())
  const pageUrl = onEnd || !pages[currentPage] ? undefined : pageSrc(pages[currentPage])
  useEffect(() => {
    if (!pageUrl || shareFiles.current.has(currentPage)) return
    let alive = true
    const page = currentPage
    const id = window.setTimeout(() => {
      prefetchPageFile(pageUrl, `bulletin-${issue.y}${String(issue.m).padStart(2, '0')}${String(issue.d).padStart(2, '0')}-p${page + 1}`).then(
        file => {
          if (alive && file) shareFiles.current.set(page, file)
        },
      )
    }, 600)
    return () => {
      alive = false
      window.clearTimeout(id)
    }
  }, [pageUrl, currentPage, issue.y, issue.m, issue.d])

  const shareTitle = ko ? `${dateText} 주보 · ${issueLabel}` : `${dateText} bulletin · ${issueLabel}`
  const sharePage = () =>
    shareBulletinPage(
      shareFiles.current.get(currentPage),
      ko ? `${shareTitle} ${currentPage + 1}쪽` : `${shareTitle} p.${currentPage + 1}`,
      bulletin.id,
      ko,
    )

  // ── 미니맵: 확대 중 지금 보는 자리를 작은 쪽 위에 표시, 누르거나 끌면 그리로 ──
  const mapW = isLg ? 168 : 96
  const mapH = ready ? (mapW * baseH) / baseW : 0
  const zoomed = ready && isZoomed()
  const w = baseW * view.s
  const h = baseH * view.s
  const rect = ready
    ? {
        left: Math.max(0, -view.x / w),
        top: Math.max(0, -view.y / h),
        right: Math.min(1, (stage.w - view.x) / w),
        bottom: Math.min(1, (stage.h - view.y) / h),
      }
    : { left: 0, top: 0, right: 1, bottom: 1 }

  const moveToMapPoint = (e: React.PointerEvent<HTMLDivElement>, smooth: boolean) => {
    const r = e.currentTarget.getBoundingClientRect()
    const fx = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
    const fy = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1)
    const cur = viewRef.current
    setView({ s: cur.s, x: stage.w / 2 - fx * baseW * cur.s, y: stage.h / 2 - fy * baseH * cur.s }, smooth)
  }

  if (totalPages === 0) {
    return createPortal(
      <div className="instagram-viewer">
        <div className="viewer-error">{t('newsViewerPageFailed')}</div>
      </div>,
      document.body,
    )
  }

  const pct = Math.round(view.s * 100)
  const nextFit: FitMode = fitMode === 'width' ? 'contain' : 'width'

  // 맞춤 상태에서 한 쪽이 놓이는 칸 — 옆 쪽·마무리 카드도 이 칸 크기로 양옆에 선다
  const fit = {
    left: inset.l + (availW - baseW) / 2,
    top: inset.t + (availH - baseH) / 2,
    width: baseW,
    height: baseH,
  }
  // 끄는 만큼 들어오는 옆 쪽이 0.9 → 1 로 커지며 밝아진다 — 다 넘어온 순간 지금 쪽과 크기가 같아 이음새가 없다
  const progress = slideStep > 0 ? Math.min(Math.abs(swipe) / slideStep, 1) : 0
  const peekStyle = (dir: 1 | -1): React.CSSProperties => {
    const incoming = swipe !== 0 && Math.sign(-swipe) === dir ? progress : 0
    return {
      ...fit,
      left: fit.left + dir * slideStep,
      transform: `scale(${0.9 + 0.1 * incoming})`,
      opacity: 0.55 + 0.45 * incoming,
    }
  }
  const outgoing = swipe !== 0 || sliding
  const prevPage = pages[currentPage - 1]
  const nextPage = pages[currentPage + 1]
  const showPeeks = ready && !zoomed

  const endCard = (interactive: boolean) => (
    <div className="bv-end" {...(interactive ? {} : { 'aria-hidden': true, inert: true })}>
      <div className="bv-end-seal" aria-hidden="true">
        {ko ? `${issue.no}호` : `No.${issue.no}`}
        <br />
        {ko ? '완독' : 'Done'}
      </div>
      <p className="bv-end-title">
        {ko ? (
          <>
            {dateText} 주보,
            <br />다 읽었어요
          </>
        ) : (
          <>
            You’ve read the
            <br />
            {dateText} bulletin
          </>
        )}
      </p>
      <p className="bv-end-desc">
        {ko ? (
          <>
            이번 주도 함께해 주셔서 감사해요.
            <br />
            주일에 교회에서 만나요.
          </>
        ) : (
          'Thanks for reading. See you on Sunday.'
        )}
      </p>
      <div className="bv-end-actions">
        <button type="button" className="bv-end-primary" onClick={() => shareBulletinLink(bulletin.id, ko)}>
          <ShareIcon />
          {ko ? '주보 보내기' : 'Share bulletin'}
        </button>
        {olderBulletin && onOpenBulletin && (
          <button
            type="button"
            className="bv-end-secondary"
            onClick={() => onOpenBulletin(olderBulletin)}
            disabled={opening}
          >
            {olderBulletin.thumbnail_url && <img src={olderBulletin.thumbnail_url} alt="" loading="lazy" />}
            {ko
              ? `지난 주 ${toIssue(olderBulletin).no}호 보기`
              : `Last week · No.${toIssue(olderBulletin).no}`}
          </button>
        )}
        <button type="button" className="bv-end-ghost" onClick={() => goToPage(0)}>
          {ko ? '처음부터 다시' : 'Read again'}
        </button>
      </div>
    </div>
  )

  // 라우트 최상위에 붙는 PC 글씨 크기 zoom(--az) 밖으로 꺼낸다 — zoom 안에선 포인터 좌표와 화면 좌표가 어긋난다
  return createPortal(
    <div className={`instagram-viewer bv-${issue.season}`}>
      {/* 표지 색이 번진 배경 — 목록 히어로와 같은 색이라 열어도 같은 자리에 있는 느낌 */}
      <div className="bv-amb" aria-hidden="true">
        {bgUrl && <div className="bv-amb-layer" style={{ backgroundImage: `url("${bgUrl}")` }} />}
      </div>

      {/* 무대 — 그림을 끌고 키우는 자리 */}
      <div
        ref={stageRef}
        className={`image-container ${zoomed ? (dragging ? 'is-grabbing' : 'is-pannable') : 'is-fit'} ${onEnd ? 'is-end' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          className={`bv-rail ${sliding ? 'is-sliding' : ''}`}
          style={swipe !== 0 ? { transform: `translate3d(${swipe}px, 0, 0)` } : undefined}
        >
          {showPeeks && prevPage && (
            <div className="bv-peek" style={peekStyle(-1)} aria-hidden="true">
              <PeekImage page={prevPage} />
            </div>
          )}

          {onEnd ? (
            ready && (
              <div className="bv-end-slot" style={fit}>
                {endCard(true)}
              </div>
            )
          ) : (
            <div
              className="bv-current"
              style={
                outgoing && ready
                  ? {
                      transform: `scale(${1 - 0.1 * progress})`,
                      transformOrigin: `${fit.left + fit.width / 2}px ${fit.top + fit.height / 2}px`,
                      opacity: 1 - 0.45 * progress,
                    }
                  : undefined
              }
            >
              <img
                key={pages[currentPage]?.id}
                src={pages[currentPage] && pageSrc(pages[currentPage])}
                alt={t('newsViewerPageNth').replace('{n}', String(currentPage + 1))}
                className={`bulletin-image ${animate ? 'is-animating' : ''} ${ready ? 'is-ready' : ''} ${zoomed ? '' : 'is-card'}`}
                style={
                  ready
                    ? {
                        width: baseW,
                        height: baseH,
                        transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`,
                      }
                    : undefined
                }
                onLoad={e => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                onTransitionEnd={() => setAnimate(false)}
                draggable={false}
              />
            </div>
          )}

          {showPeeks &&
            (nextPage ? (
              <div className="bv-peek" style={peekStyle(1)} aria-hidden="true">
                <PeekImage page={nextPage} />
              </div>
            ) : (
              !onEnd && (
                <div className="bv-peek" style={peekStyle(1)}>
                  {endCard(false)}
                </div>
              )
            ))}
        </div>
      </div>

      {/* 머리말 */}
      <div className={`instagram-header ${controlsOn || onEnd ? 'visible' : 'hidden'}`}>
        <button onClick={onClose} className="close-button" aria-label={t('newsClose')} title={t('newsClose')}>
          <span className="material-icons-outlined">close</span>
        </button>
        <div className="header-info">
          <h2>{fill(t('newsBulletinHeroTitle'), { date: dateText })}</h2>
          <p>
            {issueLabel} · {t(SEASON_LABEL[issue.season])}
          </p>
        </div>
      </div>

      {/* 하단 — 쪽 점 · 몇 쪽 · 이 쪽 보내기 */}
      <div className={`bv-bottom ${controlsOn || onEnd ? 'visible' : 'hidden'}`}>
        {totalPages <= 14 && (
          <div className="bv-dots" aria-hidden="true">
            {Array.from({ length: totalPages + 1 }, (_, i) => (
              <i key={i} className={`${i === currentPage ? 'is-on' : ''} ${i === totalPages ? 'is-end' : ''}`} />
            ))}
          </div>
        )}
        <div className="bv-bar">
          <span className="bv-count" aria-live="polite">
            {onEnd
              ? ko
                ? '다 읽었어요'
                : 'All read'
              : ko
                ? `${currentPage + 1} / ${totalPages}쪽`
                : `${currentPage + 1} / ${totalPages}`}
          </span>
          {!onEnd && (
            <button type="button" className="bv-share" onClick={sharePage}>
              <ShareIcon />
              {ko ? '이 쪽 보내기' : 'Share page'}
            </button>
          )}
        </div>
      </div>

      {/* 네비게이션 버튼 — 확대 중에도 PC 는 그대로 넘길 수 있다 */}
      {(isLg || !zoomed) && (
        <>
          {currentPage > 0 && (
            <button
              className={`nav-button prev ${controlsOn ? 'visible' : 'hidden'}`}
              onClick={() => turnPage(-1)}
              aria-label={ko ? '이전 쪽' : 'Previous page'}
            >
              <span className="material-icons-outlined">chevron_left</span>
              <span className="nav-label">{ko ? '이전' : 'Prev'}</span>
            </button>
          )}
          {currentPage < totalPages && (
            <button
              className={`nav-button next ${controlsOn ? 'visible' : 'hidden'}`}
              onClick={() => turnPage(1)}
              aria-label={ko ? '다음 쪽' : 'Next page'}
            >
              <span className="material-icons-outlined">chevron_right</span>
              <span className="nav-label">{ko ? '다음' : 'Next'}</span>
            </button>
          )}
        </>
      )}

      {/* 미니맵 */}
      {ready && !onEnd && (
        <div
          className={`zoom-minimap ${zoomed && controlsOn ? 'visible' : 'hidden'}`}
          style={{ width: mapW, height: mapH }}
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId)
            moveToMapPoint(e, true)
          }}
          onPointerMove={e => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) moveToMapPoint(e, false)
          }}
          aria-hidden="true"
        >
          {pages[currentPage] && <img src={pageThumb(pages[currentPage])} alt="" draggable={false} />}
          <div
            className="zoom-minimap-rect"
            style={{
              left: `${rect.left * 100}%`,
              top: `${rect.top * 100}%`,
              width: `${(rect.right - rect.left) * 100}%`,
              height: `${(rect.bottom - rect.top) * 100}%`,
            }}
          />
        </div>
      )}

      {/* 줌 컨트롤 */}
      <div className={`zoom-controls ${controlsOn && !onEnd ? 'visible' : 'hidden'}`}>
        <button
          onClick={() => zoomBy(1.4)}
          disabled={view.s >= maxScale - 0.01}
          aria-label={ko ? '크게' : 'Zoom in'}
          title={ko ? '크게 (+)' : 'Zoom in (+)'}
        >
          <span className="material-icons-outlined">add</span>
        </button>
        <span className="zoom-level">{pct}%</span>
        <button
          onClick={() => zoomBy(1 / 1.4)}
          disabled={view.s <= 1.01}
          aria-label={ko ? '작게' : 'Zoom out'}
          title={ko ? '작게 (−)' : 'Zoom out (−)'}
        >
          <span className="material-icons-outlined">remove</span>
        </button>
        <span className="zoom-divider" aria-hidden="true" />
        <button
          className="zoom-fit"
          onClick={() => {
            setFitMode(nextFit)
            applyFit(nextFit, true)
          }}
          aria-label={nextFit === 'width' ? (ko ? '폭 맞춤' : 'Fit width') : (ko ? '한 쪽 전체 보기' : 'Fit page')}
          title={nextFit === 'width' ? (ko ? '폭 맞춤' : 'Fit width') : (ko ? '한 쪽 전체 보기 (0)' : 'Fit page (0)')}
        >
          {nextFit === 'width' ? <FitWidthIcon /> : <FitPageIcon />}
          <span className="zoom-fit-label">
            {nextFit === 'width' ? (ko ? '폭 맞춤' : 'Width') : (ko ? '전체' : 'Page')}
          </span>
        </button>
      </div>

      {/* 첫 사용 안내 — 한 번 보고 손을 대면 다시 안 뜬다 */}
      {showHint && ready && !onEnd && (
        <div className="viewer-hint" onClick={dismissHint}>
          {isLg
            ? ko
              ? '마우스 휠로 크게 · 끌어서 이동 · 두 번 누르면 그 부분 확대'
              : 'Scroll to zoom · Drag to move · Double-click to zoom there'
            : ko
              ? '옆으로 넘기기 · 두 손가락으로 벌려 크게 · 두 번 톡 누르면 확대'
              : 'Swipe to turn · Pinch to zoom · Double-tap to zoom there'}
        </div>
      )}
    </div>,
    document.body,
  )
}

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
)

const FitWidthIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M2 12h6M22 12h-6M4.5 9.5 2 12l2.5 2.5M19.5 9.5 22 12l-2.5 2.5" />
  </svg>
)

const FitPageIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="6.5" y="5.5" width="11" height="13" rx="1.6" />
    <path d="M3 8V4.5A1.5 1.5 0 0 1 4.5 3H8M16 3h3.5A1.5 1.5 0 0 1 21 4.5V8M21 16v3.5a1.5 1.5 0 0 1-1.5 1.5H16M8 21H4.5A1.5 1.5 0 0 1 3 19.5V16" />
  </svg>
)

export default InstagramBulletinViewer
