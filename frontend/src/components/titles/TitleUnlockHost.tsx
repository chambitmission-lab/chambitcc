// 칭호 해금 팝업 호스트 — 앱 루트에 1개 마운트.
// titleUnlockBus 를 구독해 새로 획득한 칭호를 큐로 쌓고, 하나씩 팝업으로 축하한다.
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeTitleUnlocks } from '../../utils/titleUnlockBus'
import { equipTitle, type TitleStatus } from '../../api/titles'
import { titleKeys } from '../../hooks/useTitles'
import { TitleUnlockModal } from './TitleUnlockModal'

export const TitleUnlockHost: React.FC = () => {
  const qc = useQueryClient()
  const [queue, setQueue] = useState<TitleStatus[]>([])

  useEffect(() => {
    const unsub = subscribeTitleUnlocks((titles) => {
      if (titles.length === 0) return
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

  return (
    <AnimatePresence>
      {current && (
        <TitleUnlockModal
          key={current.key}
          title={current}
          remaining={queue.length - 1}
          onEquip={handleEquip}
          onClose={handleClose}
        />
      )}
    </AnimatePresence>
  )
}
