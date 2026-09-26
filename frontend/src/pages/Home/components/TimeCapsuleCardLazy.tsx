// 홈 타임캡슐 카드의 지연 로드 껍데기 — 카드 CSS(밤하늘·별·삽화, 17KB)가 엔트리 번들에 실리지 않게 한다.
// 카드는 항상 뜨므로 청크가 오기 전엔 같은 크기·같은 밤하늘 바탕의 자리표시자를 그려 레이아웃이 밀리지 않는다.
import { lazy, Suspense } from 'react'

const TimeCapsuleCard = lazy(() => import('./TimeCapsuleCard'))

// .tc-card 의 min-height·radius·바탕 그라데이션(라이트 하늘/다크 밤하늘)·테두리와 같은 값 (TimeCapsuleCard.css)
const placeholder = (
  <section className="px-4 mt-3" aria-hidden>
    <div className="min-h-[124px] rounded-[20px] border border-[rgba(49,130,246,0.16)] bg-[linear-gradient(165deg,#cfe2f5_0%,#d9e6f4_55%,#e3ebf4_100%)] dark:border-[rgba(165,175,235,0.16)] dark:bg-[linear-gradient(165deg,#101932_0%,#171e40_55%,#1f2248_100%)]" />
  </section>
)

const TimeCapsuleCardLazy = () => (
  <Suspense fallback={placeholder}>
    <TimeCapsuleCard />
  </Suspense>
)

export default TimeCapsuleCardLazy
