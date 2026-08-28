import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { ExpandIcon, MapIcon } from '../icons'

/**
 * 카카오맵 — 레거시 홈페이지가 주던 "여기 어디쯤이구나"의 안심을 되돌려 놓는다.
 *
 * 탐색용 지도가 아니라 확인용 지도라서 드래그·확대를 모두 잠가 둔다.
 * (모바일에서 지도가 페이지 스크롤을 가로채는 문제도 이걸로 함께 사라진다)
 * 실제 탐색은 지도 표면 전체를 덮은 버튼 → 카카오맵 앱/웹에 넘긴다.
 */

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined

type KakaoNamespace = {
  maps: {
    load: (cb: () => void) => void
    LatLng: new (lat: number, lng: number) => unknown
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
      setDraggable: (v: boolean) => void
      setZoomable: (v: boolean) => void
    }
    Marker: new (opts: Record<string, unknown>) => unknown
    CustomOverlay: new (opts: Record<string, unknown>) => unknown
  }
}

let sdkPromise: Promise<KakaoNamespace> | null = null

/** SDK 는 앱 전체에서 한 번만 로드한다 (다시 방문해도 script 태그가 늘지 않는다) */
const loadKakaoSdk = (key: string): Promise<KakaoNamespace> => {
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise<KakaoNamespace>((resolve, reject) => {
    const win = window as unknown as { kakao?: KakaoNamespace }
    if (win.kakao?.maps?.LatLng) {
      resolve(win.kakao)
      return
    }

    const ID = 'kakao-maps-sdk'
    const existing = document.getElementById(ID) as HTMLScriptElement | null
    const script = existing ?? document.createElement('script')

    script.addEventListener(
      'load',
      () => {
        // autoload=false 라 여기서 명시적으로 maps 모듈을 깨운다
        win.kakao?.maps.load(() => resolve(win.kakao as KakaoNamespace))
      },
      { once: true },
    )
    script.addEventListener('error', () => reject(new Error('kakao sdk load failed')), {
      once: true,
    })

    if (!existing) {
      script.id = ID
      script.async = true
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
      document.head.appendChild(script)
    }
  })

  return sdkPromise
}

interface ChurchMapProps {
  /** 교회 좌표 — 없으면 지도 대신 안내 카드를 보여준다 */
  coords: { lat: number; lng: number } | null
  /** 마커 옆에 붙는 짧은 이름 */
  pinLabel: string
  /** 지도를 눌렀을 때 (카카오맵 열기) */
  onOpen: () => void
}

const ChurchMap = ({ coords, pinLabel, onOpen }: ChurchMapProps) => {
  const { t } = useLanguage()
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<'idle' | 'ready' | 'failed'>('idle')

  // 키나 좌표가 없으면 지도를 시도조차 하지 않는다 — 렌더 시점에 결론이 나는 값이라
  // 상태로 끌어들이지 않고 그대로 쓴다
  const mappable = Boolean(KAKAO_JS_KEY && coords)
  const view = mappable ? status : 'failed'

  useEffect(() => {
    if (!KAKAO_JS_KEY || !coords) return

    let alive = true
    loadKakaoSdk(KAKAO_JS_KEY)
      .then((kakao) => {
        const box = boxRef.current
        if (!alive || !box) return

        const center = new kakao.maps.LatLng(coords.lat, coords.lng)
        const map = new kakao.maps.Map(box, { center, level: 4 })
        // 확인용 지도 — 손가락으로 움직이지 않게 잠근다
        map.setDraggable(false)
        map.setZoomable(false)

        new kakao.maps.Marker({ map, position: center })

        if (pinLabel) {
          const label = document.createElement('div')
          label.className = 'visit-map-pin'
          label.textContent = pinLabel
          new kakao.maps.CustomOverlay({
            map,
            position: center,
            content: label,
            yAnchor: 2.4,
          })
        }

        setStatus('ready')
      })
      .catch(() => {
        if (alive) setStatus('failed')
      })

    return () => {
      alive = false
    }
  }, [coords, pinLabel])

  return (
    <div className={`visit-map${view === 'ready' ? ' is-ready' : ''}`}>
      <div className="visit-map-canvas" ref={boxRef} aria-hidden="true" />

      {view !== 'ready' && (
        <div className="visit-map-placeholder">
          <MapIcon size={26} />
          {view === 'failed' && <span>{t('visitMapUnavailable')}</span>}
        </div>
      )}

      <button
        type="button"
        className="visit-map-tap"
        onClick={onOpen}
        aria-label={t('visitOpenBigMap')}
      >
        <span className="visit-map-chip">
          <ExpandIcon size={14} />
          <span>{t('visitOpenBigMap')}</span>
        </span>
      </button>
    </div>
  )
}

export default ChurchMap
