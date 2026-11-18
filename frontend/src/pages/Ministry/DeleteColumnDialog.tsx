import { useModalBackButton } from '../../hooks/useModalBackButton'
import '../../components/common/confirmDialog.css'

interface DeleteColumnDialogProps {
  language: string
  onConfirm: () => void
  onClose: () => void
}

/** 컬럼 삭제 확인 — 공통 확인창(ConfirmDialogHost)과 같은 생김새 */
const DeleteColumnDialog = ({ language, onConfirm, onClose }: DeleteColumnDialogProps) => {
  // 모바일 뒤로가기 → 페이지 이탈 대신 이 다이얼로그만 닫기
  useModalBackButton(onClose)
  const ko = language === 'ko'

  return (
    <div className="cdl-overlay z-[120]" role="presentation" onClick={onClose}>
      <div role="alertdialog" aria-modal="true" className="cdl-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cdl-grab" aria-hidden />
        <h3 className="cdl-title">{ko ? '이 컬럼을 지울까요?' : 'Delete this column?'}</h3>
        <p className="cdl-sub">{ko ? '지우면 다시 불러올 수 없어요.' : 'This cannot be undone.'}</p>
        <div className="cdl-actions">
          <button onClick={onClose} className="cdl-btn is-keep">
            {ko ? '취소' : 'Cancel'}
          </button>
          <button onClick={onConfirm} className="cdl-btn is-danger">
            {ko ? '지울게요' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteColumnDialog
