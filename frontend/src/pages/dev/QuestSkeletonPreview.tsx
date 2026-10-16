import JourneySkeleton from '../Bluemarble/journey/JourneySkeleton'
import BmIcon from '../Bluemarble/components/BluemarbleIcons'
import '../Bluemarble/Bluemarble.css'
import '../Bluemarble/quest.css'

/**
 * /#/dev/quest-skeleton — 바이블 퀘스트 첫 진입 "준비 중" 화면(JourneySkeleton).
 * 로그인·백엔드 없이 지도 배경 위 틀(탭·상단 띠·장 칩·옆 패널)을 본다. ?error=1 이면 실패 상태.
 */
export default function QuestSkeletonPreview() {
  const error = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('error') === '1'
  const tabs = (
    <div className="quest-tabs is-on-map" role="tablist" aria-label="바이블 퀘스트">
      <button type="button" role="tab" aria-selected className="is-on">
        <BmIcon name="footprints" size={16} /> 발자취 여행
      </button>
      <button type="button" role="tab" aria-selected={false}>
        <BmIcon name="bolt" size={16} /> 말씀 리그
      </button>
    </div>
  )
  return (
    <div className="quest quest--journey">
      <JourneySkeleton
        header={tabs}
        error={error ? { message: '발자취 칸을 불러오지 못했습니다', onRetry: () => undefined } : null}
      />
    </div>
  )
}
