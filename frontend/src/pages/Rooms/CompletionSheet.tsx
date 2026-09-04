// 완주 기념 카드 시트 — 미리보기 + 공유/저장
import { useEffect, useState } from 'react'
import type { RoomDetail } from '../../types/meditationRoom'
import { showToast } from '../../utils/toast'
import { Sheet, SheetBody, SheetFooter } from './RoomBits'
import { PartyIcon } from './RoomIcons'
import { completionCardFile, drawCompletionCard } from './completionCard'

const CompletionSheet = ({ room, onClose }: { room: RoomDetail; onClose: () => void }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    !!navigator.canShare?.({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] })

  useEffect(() => {
    let alive = true
    drawCompletionCard(room)
      .then((c) => {
        if (alive) setPreview(c.toDataURL('image/jpeg', 0.85))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [room])

  const handleShare = async () => {
    if (busy) return
    setBusy(true)
    try {
      const file = await completionCardFile(room)
      if (!file) throw new Error('export')
      await navigator.share({ files: [file], title: `${room.title} 완주` })
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') showToast('공유에 실패했어요', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = async () => {
    if (busy) return
    setBusy(true)
    try {
      const file = await completionCardFile(room)
      if (!file) throw new Error('export')
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      showToast('기념 카드를 저장했어요', 'success')
    } catch {
      showToast('저장에 실패했어요', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} ariaLabel="완주 기념 카드">
      <SheetBody className="pt-3">
        <div className="flex items-center gap-2">
          <PartyIcon size={20} className="text-brand" />
          <h3 className="text-[19px] font-bold tracking-[-0.02em] text-ink-strong">완주를 축하해요</h3>
        </div>
        <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1 leading-[1.6]">
          함께한 사람들의 이름이 담긴 기념 카드예요. 방에 공유해 서로 축하해요.
        </p>
        <div className="mt-4 rounded-[20px] overflow-hidden bg-gray-100 dark:bg-white/[0.05] aspect-[4/5] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]">
          {preview ? (
            <img src={preview} alt="완주 기념 카드" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full animate-pulse" />
          )}
        </div>
      </SheetBody>
      <SheetFooter>
        <div className="flex gap-2">
          {canShareFiles && (
            <button
              type="button"
              onClick={handleShare}
              disabled={busy || !preview}
              className="flex-1 py-3.5 rounded-2xl bg-brand text-white text-[14.5px] font-bold disabled:opacity-50"
            >
              공유하기
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy || !preview}
            className={`flex-1 py-3.5 rounded-2xl text-[14.5px] font-bold disabled:opacity-50 ${
              canShareFiles
                ? 'bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-white/80'
                : 'bg-brand text-white'
            }`}
          >
            이미지 저장
          </button>
        </div>
      </SheetFooter>
    </Sheet>
  )
}

export default CompletionSheet
