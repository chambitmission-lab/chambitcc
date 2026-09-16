// 감사 작성 시트의 lazy 진입점 — 홈 티커·FAB 스피드 다이얼·전역 레일이 같은 청크를 공유한다.
// React.lazy + 바깥 Suspense(fallback null) 조합은 청크가 브라우저 캐시에 있어도 첫 열기에
// 폴백 스로틀(약 300ms)을 한 번 거쳐 "한 박자 쉬고 열리는" 느낌을 만든다.
// lazyModal 은 preload 가 끝나면 Suspense 없이 곧장 그리므로 홈 idle 때 미리 받아 둔다(NewHome).
import { lazyModal } from '../../../../utils/lazyModal'

const ThanksComposerLazy = lazyModal(() => import('./ThanksComposer'))

export default ThanksComposerLazy
