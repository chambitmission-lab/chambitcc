// 모달 래퍼 컴포넌트
import type { ReactNode } from 'react'

interface PrayerDetailModalProps {
  children: ReactNode
}

const PrayerDetailModal = ({ children }: PrayerDetailModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4">
      <div className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-2xl md:max-w-2xl md:h-auto md:max-h-[85vh] overflow-hidden md:shadow-2xl flex flex-col">
        {children}
      </div>
    </div>
  )
}

export default PrayerDetailModal
