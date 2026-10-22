import type { ReactNode } from 'react'
import './ChapterGuidePanel.css'

/**
 * PC 넓은 화면(1680px+) 오른쪽 "이 장 안내" 패널 (cgp-).
 *
 * 본문 위에 쌓이던 권 개관·오늘의 길잡이를 오른쪽으로 옮겨, 본문이 첫 화면에 바로 보이게 한다.
 * 카드 자체(BookIntroCard·ChapterBriefCard)는 부모가 children 으로 넘긴다 — 같은 카드를
 * 본문 칼럼과 패널 중 "한 곳에만" 마운트해야 하므로, 어디에 둘지는 BibleStudy 가 정한다.
 *
 * 해석 패널(BibleCommentaryPanel, z 110)과 같은 자리에 조금 좁은 폭(--guide-dock-w)으로 붙고
 * 그보다 아래 층(z 30)이라, 해석을 열면 그 위를 덮고 닫으면 다시 드러난다.
 */
export const ChapterGuidePanel = ({
  children,
  onClose,
}: {
  children: ReactNode
  onClose: () => void
}) => (
  <aside className="cgp" aria-label="이 장 안내">
    <div className="cgp-head">
      <h2 className="cgp-title">이 장 안내</h2>
      <button type="button" className="cgp-close" onClick={onClose} aria-label="이 장 안내 접기" title="접기">
        <span className="material-icons-round" aria-hidden>chevron_right</span>
      </button>
    </div>
    <div className="cgp-body">
      {/* 카드가 둘 다 데이터 없음(null)이면 비어 있다 — 아래 안내가 대신 보인다 */}
      <div className="cgp-cards">{children}</div>
      <p className="cgp-empty">이 책은 아직 안내가 준비 중이에요.</p>
    </div>
  </aside>
)

/** 패널을 접어 두었을 때 오른쪽 가장자리에 붙는 열기 손잡이 */
export const ChapterGuideTab = ({ onOpen }: { onOpen: () => void }) => (
  <button type="button" className="cgp-tab" onClick={onOpen} aria-label="이 장 안내 펼치기" title="이 장 안내 펼치기">
    <span className="material-icons-round" aria-hidden>chevron_left</span>
    <span className="cgp-tab-label">이 장 안내</span>
  </button>
)
