// 설교 준비실 — 담임목사님이 아닌 교역자가 주소로 들어왔을 때
import { Link } from 'react-router-dom'
import PastorShell from '../PastorShell'

const StudioLocked = () => (
  <PastorShell>
    <div className="px-4 py-16 flex flex-col items-center text-center gap-3">
      <span className="w-14 h-14 rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
        <span className="material-icons-outlined text-[28px]">lock</span>
      </span>
      <h1 className="text-[19px] lg:text-[22px] font-bold tracking-[-0.02em] text-ink-strong">담임목사님 전용 준비실입니다</h1>
      <p className="max-w-[420px] text-[13.5px] lg:text-[15px] leading-relaxed text-gray-600 dark:text-white/60">
        설교 준비실은 담임목사님의 주일 설교 준비를 위한 공간입니다. 다른 교역자분은 설교 준비 화면의 본문 작업대·메모·개요를 그대로 쓰실 수 있습니다.
      </p>
      <Link to="/pastor/sermon" className="mt-2 px-4 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold">
        설교 준비로 가기
      </Link>
    </div>
  </PastorShell>
)

export default StudioLocked
