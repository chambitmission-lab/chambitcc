// 앱 공통 확인/안내 모달의 명령형 API — 브라우저 기본 confirm()/alert() 대체
//
//   if (!(await confirmDialog({ message: '이 알람을 삭제할까요?' }))) return
//   await alertDialog({ message: '임시 비밀번호: 1234' })
//
// 실제 화면은 <ConfirmDialogHost />(App에 한 번만 마운트)가 그린다.
// 호출은 큐에 쌓여 순서대로 하나씩 표시된다.

export type ConfirmTone = 'danger' | 'warning' | 'brand'

export interface ConfirmOptions {
  /** 모달 제목 — 생략 시 '확인' */
  title?: string
  /** 본문. `\n` 은 줄바꿈으로 렌더된다 */
  message: string
  /** 본문 아래 보조 설명 (예: "삭제된 내용은 복구할 수 없습니다.") */
  description?: string
  /** 본문 위에 강조되는 경고 한 줄 (예: 관리자 권한 안내) */
  highlight?: string
  confirmText?: string
  cancelText?: string
  /** 기본값: confirm은 danger, alert은 brand */
  tone?: ConfirmTone
  /** material-icons-outlined 아이콘 이름 — 생략 시 톤별 기본값 */
  icon?: string
}

export type DialogRequest = ConfirmOptions & {
  id: number
  /** 취소 버튼 없이 확인만 노출 (alert 대체) */
  alertOnly: boolean
  resolve: (result: boolean) => void
}

let seq = 0
let emit: ((req: DialogRequest) => void) | null = null

/** 호스트가 마운트되기 전에 들어온 호출을 잠시 담아 둔다 */
export const bufferedRequests: DialogRequest[] = []

/** 호스트 전용 — 큐 도착 알림 등록. 반환값은 해제 함수 */
export const setDialogEmitter = (fn: ((req: DialogRequest) => void) | null) => {
  emit = fn
}

const enqueue = (
  options: ConfirmOptions,
  alertOnly: boolean,
): Promise<boolean> =>
  new Promise((resolve) => {
    const req: DialogRequest = { ...options, id: ++seq, alertOnly, resolve }
    if (emit) emit(req)
    else bufferedRequests.push(req)
  })

/** 확인/취소 모달. 확인을 누르면 true */
export const confirmDialog = (options: ConfirmOptions | string) =>
  enqueue(typeof options === 'string' ? { message: options } : options, false)

/** 확인 버튼 하나짜리 안내 모달 (브라우저 alert 대체) */
export const alertDialog = (options: ConfirmOptions | string) =>
  enqueue(typeof options === 'string' ? { message: options } : options, true)
