import { useState } from 'react'
import { APOSTLE_BY_ID, type ApostleId } from '../apostles'
import { CARD, DetailSheet } from './twelveShared'
import { useMediaQuery } from '../../../../hooks/useMediaQuery'
import ApostleMap from './apostles/ApostleMap'
import ApostleListFlow from './apostles/ApostleListFlow'
import ApostleStory from './apostles/ApostleStory'
import ApostlePeek from './apostles/ApostlePeek'

// /bible/genealogy?view=apostles — 열두 제자.
// 관계도(ApostleMap) + 네 목록 순서 흐름(ApostleListFlow) + 인물 이야기(ApostleStory).
// 선택 상태는 selectedId 하나(URL ?apostle=)를 세 곳이 함께 쓴다.
// PC: 왼쪽 2/3 관계도·순서 흐름, 오른쪽 1/3 sticky 이야기 패널.
// 모바일: 노드 → 요약 시트(ApostlePeek) → "이야기 보기" → 전체 시트. 성경 사전 칩으로 들어오면 바로 이야기.

interface Props {
  selectedId: ApostleId | null
  onSelect: (id: ApostleId | null) => void
}

const ApostlesView = ({ selectedId, onSelect }: Props) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)') // lg — PC 패널 / 모바일 시트 분기
  // 주소에 ?apostle= 가 있으면(성경 사전 칩 "카드 보기") 모바일에서도 이야기부터 연다
  const [storyOpen, setStoryOpen] = useState(() => !!selectedId)
  const selected = selectedId ? APOSTLE_BY_ID.get(selectedId) ?? null : null

  const pickFromChart = (id: ApostleId) => {
    if (isDesktop) {
      onSelect(id === selectedId ? null : id)
      return
    }
    setStoryOpen(false)
    onSelect(id)
  }
  const close = () => {
    setStoryOpen(false)
    onSelect(null)
  }

  return (
    <>
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 ${selected && !isDesktop ? 'pb-64' : ''}`}>
        <div className="lg:col-span-2 min-w-0 flex flex-col gap-4">
          <ApostleMap selectedId={selectedId} onSelect={pickFromChart} />
          <ApostleListFlow selectedId={selectedId} onSelect={pickFromChart} wide={isDesktop} />
        </div>
        <aside className="hidden lg:block lg:col-span-1 min-w-0">
          <div className="sticky lg:top-[4.5rem]">
            {selected ? (
              <div className={`${CARD} overflow-hidden max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain`}>
                <ApostleStory key={selected.id} apostle={selected} onSelect={onSelect} onClose={close} />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.12] px-5 py-10 text-center">
                <span className="material-icons-round text-brand" style={{ fontSize: 28 }}>groups</span>
                <p className="mt-2 text-[13.5px] text-gray-500 dark:text-white/55 leading-[1.6] break-keep">
                  관계도나 목록에서 제자를 누르면
                  <br />
                  부르심과 성경에 기록된 장면을 볼 수 있어요.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {selected && !isDesktop && !storyOpen && (
        <ApostlePeek apostle={selected} onOpenStory={() => setStoryOpen(true)} onClose={close} />
      )}
      {selected && !isDesktop && storyOpen && (
        <DetailSheet onClose={() => setStoryOpen(false)} scrollKey={selected.id}>
          <ApostleStory apostle={selected} onSelect={onSelect} onClose={() => setStoryOpen(false)} onNavigate={close} />
        </DetailSheet>
      )}
    </>
  )
}

export default ApostlesView
