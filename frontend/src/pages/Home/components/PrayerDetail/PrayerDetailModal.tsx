// 모달 래퍼 컴포넌트
import type { ReactNode } from 'react'

interface PrayerDetailModalProps {
  children: ReactNode
}

const PrayerDetailModal = ({ children }: PrayerDetailModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4">
      <div className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-2xl md:h-auto md:max-h-[85vh] overflow-hidden md:shadow-[0_30px_80px_-20px_rgba(168,85,247,0.25),0_0_0_1px_rgba(255,255,255,0.04)] md:border md:border-border-light md:dark:border-border-dark flex flex-col">
        {children}
      </div>
    </div>
  )
}

export default PrayerDetailModal
