// 홈 '누군가의 기도' 카드의 문지기 — 운영이 열려 있을 때만 카드 청크(intercessionUi·intercession.css)를 받는다.
// 카드 본체(IntercessionCard)는 등불·불꽃 조각과 CSS 를 /intercession 화면과 공유하므로 엔트리 번들에서
// 떼어 두고, 운영이 닫힌 교회(대부분의 첫 로드)에서는 요청 자체가 없다. 열려 있으면 캐시된 쿼리로 곧장 그린다.
import { lazy, Suspense } from 'react'
import { useMyIntercession } from '../../../hooks/useIntercession'

const IntercessionCard = lazy(() => import('./IntercessionCard'))

const IntercessionCardGate = () => {
  const { data } = useMyIntercession()
  if (!data?.open) return null
  return (
    <Suspense fallback={null}>
      <IntercessionCard />
    </Suspense>
  )
}

export default IntercessionCardGate
