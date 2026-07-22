// 칭호 해금 팝업 애니메이션 레이어.
// framer-motion(+confetti)을 쓰는 부분만 이 파일로 분리해 lazy 로드한다 —
// 앱 시작 시가 아니라 실제로 칭호가 해금되는 순간에만 모션 라이브러리를 받는다.
import { AnimatePresence } from 'framer-motion'
import type { TitleStatus } from '../../api/titles'
import { TitleUnlockModal } from './TitleUnlockModal'

interface TitleUnlockOverlayProps {
  current: TitleStatus | undefined
  remaining: number
  onEquip: (title: TitleStatus) => void
  onClose: () => void
}

const TitleUnlockOverlay: React.FC<TitleUnlockOverlayProps> = ({
  current, remaining, onEquip, onClose,
}) => (
  <AnimatePresence>
    {current && (
      <TitleUnlockModal
        key={current.key}
        title={current}
        remaining={remaining}
        onEquip={onEquip}
        onClose={onClose}
      />
    )}
  </AnimatePresence>
)

export default TitleUnlockOverlay
