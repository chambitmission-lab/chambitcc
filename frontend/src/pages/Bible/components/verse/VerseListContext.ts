// VerseList → VerseItem 사이의 "목록 수준" 계약.
//
// 절마다 같은 콜백 10개(읽음·해석·듣기·선택·공유·수정…)를 props 로 내려보내면
// VerseItem 이 절 데이터와 무관한 인터페이스까지 떠안는다(ISP 위반). 목록 전체에
// 하나뿐인 액션은 컨텍스트로 제공하고, VerseItem props 에는 "이 절"에 관한 것만 남긴다.
//
// 두 컨텍스트로 나눈 이유: 액션은 useCallback 으로 고정돼 거의 바뀌지 않지만,
// 선택 모드 플래그는 켜고 끌 때마다 바뀐다. 함께 두면 플래그 하나에 memo 된
// 모든 절이 액션 변경까지 다시 계산한다.
import { createContext, useContext } from 'react'
import type { BibleVerse } from '../../../../types/bible'
import type { VerseCopyTarget } from '../verseCopy'

export interface VerseListActions {
  onReadSuccess: (verseId: number, similarity: number) => void
  onEdit?: (verse: BibleVerse) => void
  /** 음성 낭독 없이 읽음/읽음취소를 수동으로 처리 (로그인한 모든 사용자) */
  onToggleRead?: (verse: BibleVerse, nextRead: boolean) => void
  onShowCommentary?: (verse: BibleVerse) => void
  /** 오디오북을 이 절부터 재생 (절 메뉴 '여기부터 듣기') */
  onListenFrom?: (verse: BibleVerse) => void
  /**
   * 액션바 열림 상태는 목록이 관리한다 — 한 번에 한 절의 메뉴만 열려 다른 절을 탭하면
   * 이전 메뉴가 닫힌다. verseId 를 함께 받아 절마다 클로저를 만들지 않아도 된다(memo 유지).
   */
  onActionsOpenChange: (verseId: number, open: boolean) => void
  onToggleSelect?: (verseId: number) => void
  /** 액션바의 '여러 절' 버튼 — 이 절을 첫 선택으로 두고 선택 모드에 진입 */
  onEnterSelection?: (verse: BibleVerse) => void
  /** 공유 — 목록이 공유 시트를 띄운다. 없으면 네이티브 공유로 폴백 */
  onShare?: (target: VerseCopyTarget) => void
}

export interface VerseListSettings {
  /** 여러 절 선택 모드 — 켜지면 절을 탭할 때 액션바 대신 선택이 토글된다 */
  selectionMode: boolean
}

const noop = () => {}
const DEFAULT_ACTIONS: VerseListActions = { onReadSuccess: noop, onActionsOpenChange: noop }
const DEFAULT_SETTINGS: VerseListSettings = { selectionMode: false }

export const ActionsContext = createContext<VerseListActions>(DEFAULT_ACTIONS)
export const SettingsContext = createContext<VerseListSettings>(DEFAULT_SETTINGS)

export const useVerseListActions = () => useContext(ActionsContext)
export const useVerseListSettings = () => useContext(SettingsContext)
