// 모달 래퍼 컴포넌트
// 오버레이 블러는 3px — 홈 피드 전체에 16px(blur-lg) 블러를 걸면 모바일 GPU에서 열릴 때
// 한 박자 걸리는 "무거운" 체감의 주범이라 작성 모달(2px)과 같은 수준으로 맞춘다.
// sheet-backdrop/sheet-rise 로 짧게 페이드·떠오르게 해 "툭" 뜨는 느낌도 없앤다.
import type { ReactNode } from 'react'
import { useFeedTextScale } from '../../../../utils/feedTextScale'

interface PrayerDetailModalProps {
  children: ReactNode
  /**
   * PC(lg+) 넓은 화면 모드 — 화면 가장자리 24px만 남기고 창을 꽉 채운다(최대 1280px).
   * 본문(좌)·댓글(우) 2단은 index.tsx 가 그린다. 로딩·에러·나만 보기(댓글 없음)는 기존 중앙 모달.
   */
  wide?: boolean
}

const PrayerDetailModal = ({ children, wide = false }: PrayerDetailModalProps) => {
  // PC 글씨 크기 — 피드와 같은 설정을 따른다 (common.css `[data-feed-scale]`)
  const textScale = useFeedTextScale()
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-[3px] sheet-backdrop z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4 lg:p-6">
      <div
        className={`bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-2xl md:h-auto md:max-h-[85vh] overflow-hidden md:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)] md:border md:border-border-light md:dark:border-border-dark flex flex-col sheet-rise ${
          // zoom 화면(기도방 등) 안에 뜨면 vh 도 커지므로 배율로 나눈다 — 그 밖에선 --az 가 없어 1
          wide ? 'lg:max-w-[1280px] lg:h-full lg:max-h-none lg:rounded-[28px]' : 'lg:max-h-[calc(85vh/var(--az,1))]'
        }`}
        data-feed-scale={textScale}
      >
        {children}
      </div>
    </div>
  )
}

export default PrayerDetailModal
