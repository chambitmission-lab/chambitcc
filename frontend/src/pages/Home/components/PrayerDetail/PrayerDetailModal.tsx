// 모달 래퍼 컴포넌트
import type { ReactNode } from 'react'

interface PrayerDetailModalProps {
  children: ReactNode
}

const PrayerDetailModal = ({ children }: PrayerDetailModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-background-light dark:bg-background-dark rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {children}
      </div>
    </div>
  )
}

export default PrayerDetailModal
