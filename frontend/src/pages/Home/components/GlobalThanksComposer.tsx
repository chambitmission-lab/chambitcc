// FAB 스피드 다이얼에서 여는 감사 한 줄 작성 모달.
// useThanks가 ticker//thanks 페이지와 같은 쿼리 캐시를 쓰므로
// 여기서 등록한 감사도 홈 티커에 즉시 반영된다.
// 시트 본체는 ThanksComposerLazy(티커와 공유 청크) — 홈 idle 때 preload 되어 첫 탭에 바로 열린다.
import ThanksComposer from './ThanksThread/ThanksComposerLazy'
import { useThanks } from './ThanksThread/useThanks'

const GlobalThanksComposer = ({ onClose }: { onClose: () => void }) => {
  const { add } = useThanks({ limit: 20 })
  return <ThanksComposer onClose={onClose} onSubmit={add} />
}

export default GlobalThanksComposer
