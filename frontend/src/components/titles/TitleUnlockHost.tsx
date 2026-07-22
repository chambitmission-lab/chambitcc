// 칭호 해금 팝업 호스트 — 앱 루트에 1개 마운트.
// titleUnlockBus 를 구독해 새로 획득한 칭호를 큐로 쌓고, 하나씩 팝업으로 축하한다.
// 팝업 UI(framer-motion)는 첫 해금이 발생할 때 lazy 로드해 메인 번들에서 제외한다.
import { lazy, Suspense, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeTitleUnlocks } from '../../utils/titleUnlockBus'
import { equipTitle, type TitleStatus } from '../../api/titles'
import { titleKeys } from '../../hooks/useTitles'

const TitleUnlockOverlay = lazy(() => import('./TitleUnlockOverlay'))

export const TitleUnlockHost: React.FC = () => {
  const qc = useQueryClient()
  const [queue, setQueue] = useState<TitleStatus[]>([])
  // 한 번이라도 해금이 발생하면 오버레이를 마운트 상태로 유지해
  // 마지막 팝업이 닫힐 때의 exit 애니메이션이 정상 재생되게 한다.
  const [overlayLoaded, setOverlayLoaded] = useState(false)

  useEffect(() => {
    const unsub = subscribeTitleUnlocks((titles) => {
      if (titles.length === 0) return
      setOverlayLoaded(true)
      setQueue((prev) => {
        // 이미 큐에 있는 키는 중복 추가 방지
        const have = new Set(prev.map((t) => t.key))
        const fresh = titles.filter((t) => !have.has(t.key))
        return fresh.length ? [...prev, ...fresh] : prev
      })
      // 컬렉션/장착 캐시 갱신
      qc.invalidateQueries({ queryKey: titleKeys.all })
    })
    return unsub
  }, [qc])

  const current = queue[0]

  const handleClose = () => setQueue((prev) => prev.slice(1))

  const handleEquip = async (title: TitleStatus) => {
    try {
      await equipTitle(title.key)
      qc.invalidateQueries({ queryKey: titleKeys.all })
    } catch {
      // 장착 실패해도 팝업은 닫는다
    } finally {
      handleClose()
    }
  }

  if (!overlayLoaded) return null

  return (
    <Suspense fallback={null}>
      <TitleUnlockOverlay
        current={current}
        remaining={queue.length - 1}
        onEquip={handleEquip}
        onClose={handleClose}
      />
    </Suspense>
  )
}
