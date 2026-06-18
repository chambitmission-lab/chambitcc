// 프로필에 표시되는 "장착한 칭호" 칩 — 텍스트 주변으로 반짝이는 파티클이 가볍게 튄다.
// 클릭하면 성경 칭호 페이지(/garden)로 이동해 칭호를 바꿀 수 있다.
import { useNavigate } from 'react-router-dom'
import { useEquippedTitle } from '../../hooks/useTitles'
import './TitleEquippedChip.css'

const SPARKLES = [0, 1, 2, 3, 4, 5]

export const TitleEquippedChip: React.FC = () => {
  const navigate = useNavigate()
  const { data: equipped, isLoading } = useEquippedTitle()

  // 첫 로드(캐시 없음)에는 equipped 가 undefined 라 "칭호 달기" 빈 상태가 잠깐 떴다가
  // 실제 칭호로 바뀌는 플래시가 생긴다. 로딩 중에는 같은 크기의 스켈레톤을 보여 깜빡임을 막는다.
  if (isLoading && !equipped) {
    return <div className="title-chip title-chip-skeleton" aria-hidden />
  }

  if (!equipped) {
    return (
      <button
        type="button"
        className="title-chip title-chip-empty"
        onClick={() => navigate('/garden')}
      >
        <span className="material-icons-round title-chip-empty-icon">military_tech</span>
        칭호 달기
      </button>
    )
  }

  return (
    <button
      type="button"
      className="title-chip"
      onClick={() => navigate('/garden')}
      aria-label={`장착한 칭호 ${equipped.name} — 변경하기`}
    >
      <span className="title-chip-icon">{equipped.icon}</span>
      <span className="title-chip-name">[{equipped.name}]</span>
      <span className="title-chip-sparkles" aria-hidden>
        {SPARKLES.map((i) => (
          <span key={i} className={`title-chip-sparkle s${i}`}>✦</span>
        ))}
      </span>
    </button>
  )
}
