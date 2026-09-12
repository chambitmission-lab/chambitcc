// 레일 위젯 공용 섹션 라벨.

import { type ReactNode } from 'react'

// "함께 나누는 은혜" 헤더와 같은 문법의 섹션 라벨
const RailLabel = ({ children }: { children: ReactNode }) => (
  <p className="px-1 mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
    {children}
  </p>
)

export { RailLabel }
