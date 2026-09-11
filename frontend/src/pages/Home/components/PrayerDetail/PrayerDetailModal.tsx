// 모달 래퍼 컴포넌트
// 오버레이 블러는 3px — 홈 피드 전체에 16px(blur-lg) 블러를 걸면 모바일 GPU에서 열릴 때
// 한 박자 걸리는 "무거운" 체감의 주범이라 작성 모달(2px)과 같은 수준으로 맞춘다.
// sheet-backdrop/sheet-rise 로 짧게 페이드·떠오르게 해 "툭" 뜨는 느낌도 없앤다.
import type { ReactNode } from 'react'

interface PrayerDetailModalProps {
  children: ReactNode
}

const PrayerDetailModal = ({ children }: PrayerDetailModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-[3px] sheet-backdrop z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4">
      <div className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-2xl md:h-auto md:max-h-[85vh] overflow-hidden md:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)] md:border md:border-border-light md:dark:border-border-dark flex flex-col sheet-rise">
        {children}
      </div>
    </div>
  )
}

export default PrayerDetailModal
