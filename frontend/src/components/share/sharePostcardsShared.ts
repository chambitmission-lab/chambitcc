import { ensureFontFamily } from '../../utils/deferredFonts'

// SharePostcards 의 타입·헬퍼 — 컴포넌트 파일이 컴포넌트만 내보내야 Fast Refresh 가 산다

export type PostcardKey = 'prayer' | 'thanks' | 'verse-card'

/** 손글씨(Gaegu)를 다이얼이 열리기 전에 미리 붙인다 — 열린 뒤 받으면 서체가 툭 바뀐다 */
export const prewarmPostcardFont = (): void => {
  void ensureFontFamily('gaegu')
}
