import type { BookBriefs } from './types'
import a from './book19a'
import b from './book19b'

// 시편 — 분량이 커서 전·후반 두 파일로 나눠 관리한다 (chapterOutlines 의 book19a/b 와 같은 방식)
const briefs: BookBriefs = { ...a, ...b }

// 시편은 각 편이 독립된 시 — 서사형 라벨 대신 시에 맞는 줄 이름을 쓴다
export const labels = ['배경', '이 시에서', '눈여겨보기'] as const

export default briefs
