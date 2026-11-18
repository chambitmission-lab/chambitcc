// 기도 삭제 확인 — 공통 확인창(ConfirmDialogHost)과 같은 생김새에 '삭제 중' 상태만 더했다.
import { createPortal } from 'react-dom'
import '../../../../components/common/confirmDialog.css'

interface DeleteConfirmModalProps {
  isAdminDelete?: boolean
  isDeleting: boolean
  /** 함께 기도한 사람 수 — 있으면 문구에 넣는다 */
  prayerCount?: number
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmModal = ({ isAdminDelete = false, isDeleting, prayerCount = 0, onConfirm, onCancel }: DeleteConfirmModalProps) => {
  const gone = '지우면 다시 못 불러와요.'
  return createPortal(
    <div className="cdl-overlay z-[1100]" role="presentation" onClick={() => !isDeleting && onCancel()}>
      <div role="alertdialog" aria-modal="true" className="cdl-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cdl-grab" aria-hidden />
        {/* 다른 성도의 기도를 지우는 관리자에게는 농담 없이 또렷하게 */}
        <h3 className="cdl-title">{isAdminDelete ? '이 기도 요청을 지울까요?' : '잠깐만요, 이 기도 지워요?'}</h3>
        {isAdminDelete && <p className="cdl-highlight is-danger">관리자 권한으로 다른 성도의 기도 요청을 지웁니다.</p>}
        <p className="cdl-sub">
          {!isAdminDelete && prayerCount > 0 ? `${prayerCount}명이 같이 손 모은 기도예요. ${gone}` : gone}
        </p>
        <div className="cdl-actions">
          <button onClick={onCancel} disabled={isDeleting} className="cdl-btn is-keep">
            {isAdminDelete ? '취소' : '아직 둘게요'}
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="cdl-btn is-danger">
            {isDeleting ? (
              <>
                <span className="cdl-spin" />
                지우는 중...
              </>
            ) : isAdminDelete ? (
              '지울게요'
            ) : (
              '네, 지울게요'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default DeleteConfirmModal
