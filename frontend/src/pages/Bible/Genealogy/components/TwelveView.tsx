import TribesView from './TribesView'
import ApostlesView from './ApostlesView'
import { TwelveSwitch, type TwelveSide } from './twelveShared'
import type { ApostleId, TribeId } from '../twelveIds'

// 열두 지파·열두 제자 보기 — 가계도 화면(Genealogy.tsx)이 lazy 로 받는 별도 청크.
// 카드 데이터(tribes.ts, apostles.ts)와 배치도·관계도·이야기 컴포넌트가 전부 여기 묶인다.
// 가계도·시대순 보기만 쓰는 사람은 이 청크를 받지 않는다.

interface Props {
  side: TwelveSide
  onChangeSide: (s: TwelveSide) => void
  selectedTribe: TribeId | null
  onSelectTribe: (id: TribeId | null) => void
  selectedApostle: ApostleId | null
  onSelectApostle: (id: ApostleId | null) => void
}

const TwelveView = ({ side, onChangeSide, selectedTribe, onSelectTribe, selectedApostle, onSelectApostle }: Props) => (
  <div className="flex flex-col gap-4">
    <TwelveSwitch side={side} onChange={onChangeSide} />
    {side === 'tribes' ? (
      <TribesView selectedId={selectedTribe} onSelect={onSelectTribe} />
    ) : (
      <ApostlesView selectedId={selectedApostle} onSelect={onSelectApostle} />
    )}
  </div>
)

export default TwelveView
