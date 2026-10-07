// 목록(장) 수준에서 하나만 떠 있는 시트·모달 — 구절 수정(관리자)과 공유.
// 절마다 시트를 두면 여러 개가 겹쳐 뜨고 뒤로가기 스택도 꼬여서, 단일 절(VerseItem)과
// 여러 절 선택 바가 같은 시트 하나를 공유한다. 어떤 절을 띄울지(target)는 목록이 들고,
// 띄우고 닫고 저장하는 일은 전부 여기서 끝낸다.
// (절 하나 안에서 열리는 북마크·단어·사전·노트 시트는 VerseSheets.tsx)
import { useQueryClient } from '@tanstack/react-query'
import type { BibleVerse } from '../../../../types/bible'
import { useOptimisticUpdateVerse } from '../../../../hooks/useBibleAdmin'
import { bibleKeys } from '../../../../hooks/queryKeys'
import { lazyModal } from '../../../../utils/lazyModal'
import { showToast } from '../../../../utils/toast'
import type { VerseCopyTarget } from '../verseCopy'
// 열 때만 받는 모달·시트 — 읽기 화면 청크에서 분리 (공유 시트는 캔버스 렌더러까지 끌어온다)
const VerseEditModal = lazyModal(() => import('../../../../components/bible/VerseEditModal'))
const VerseShareSheet = lazyModal(() => import('../VerseShareSheet'))

interface VerseListSheetsProps {
  bookNumber: number
  chapter: number
  /** 관리자 구절 수정 모달 — 수정 중인 절. null 이면 닫힘 */
  editingVerse: BibleVerse | null
  onCloseEdit: () => void
  /** 공유 시트 — 보내기 전 미리보기(텍스트/이미지 카드/링크). null 이면 닫힘 */
  shareTarget: VerseCopyTarget | null
  onCloseShare: () => void
}

const VerseListSheets = ({
  bookNumber,
  chapter,
  editingVerse,
  onCloseEdit,
  shareTarget,
  onCloseShare,
}: VerseListSheetsProps) => {
  const queryClient = useQueryClient()
  const updateVerseMutation = useOptimisticUpdateVerse()

  const handleSaveVerse = async (verseId: number, newText: string) => {
    try {
      // 낙관적 업데이트로 즉시 반영
      await updateVerseMutation.mutateAsync({ verseId, newText, bookNumber, chapter })
      // 안전장치 — 잠시 뒤 활성 장 캐시를 서버 값으로 맞춘다
      setTimeout(() => {
        void queryClient.refetchQueries({
          queryKey: bibleKeys.chapterInfinite(bookNumber, chapter),
          type: 'active',
        })
      }, 100)
      showToast('성경 구절이 수정되었습니다', 'success')
    } catch (error) {
      console.error('Failed to update verse:', error)
      showToast('구절 수정에 실패했습니다', 'error')
      throw error
    }
  }

  return (
    <>
      {editingVerse && <VerseEditModal verse={editingVerse} onSave={handleSaveVerse} onClose={onCloseEdit} />}
      {shareTarget && <VerseShareSheet target={shareTarget} onClose={onCloseShare} />}
    </>
  )
}

export default VerseListSheets
