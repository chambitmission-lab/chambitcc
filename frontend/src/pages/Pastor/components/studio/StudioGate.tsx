// 설교 준비실 문 — 로비(/pastor/studio)와 방(/pastor/studio/:id)이 같은 순서로 거친다.
//   목회자 권한 없음 → 홈으로(usePastorGate) · 확인 중 → 스피너 · 확인 실패 → 다시 시도 · 담임목사 아님 → 잠금 화면.
import type { ReactNode } from 'react'
import { StatSpinner } from '../../../Admin/components/StatCards'
import PastorShell from '../PastorShell'
import { usePastorGate } from '../pastorUtils'
import StudioLocked from './StudioLocked'
import { useStudioAccess } from './useStudioAccess'

const StudioGate = ({ children }: { children: ReactNode }) => {
  const pastor = usePastorGate()
  const { allowed, checking, failed, retry } = useStudioAccess()
  if (!pastor) return null
  if (checking) {
    return (
      <PastorShell>
        <StatSpinner label="준비실 문을 여는 중..." />
      </PastorShell>
    )
  }
  if (failed) {
    return (
      <PastorShell>
        <div className="px-4 py-16 flex flex-col items-center text-center gap-3">
          <span className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 flex items-center justify-center">
            <span className="material-icons-outlined text-[28px]">wifi_off</span>
          </span>
          <h1 className="text-[19px] lg:text-[22px] font-bold tracking-[-0.02em] text-ink-strong">준비실 문을 열지 못했습니다</h1>
          <p className="max-w-[420px] text-[13.5px] lg:text-[15px] leading-relaxed text-gray-600 dark:text-white/60">
            권한을 확인하는 요청이 닿지 않았습니다. 연결을 확인하고 다시 시도해 주세요.
          </p>
          <button type="button" onClick={retry} className="mt-2 px-4 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold">
            다시 시도
          </button>
        </div>
      </PastorShell>
    )
  }
  if (!allowed) return <StudioLocked />
  return <>{children}</>
}

export default StudioGate
