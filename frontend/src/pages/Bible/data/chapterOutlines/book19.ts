import type { BookOutline } from './types'
import a from './book19a'
import b from './book19b'

// 시편 — 150편이라 두 파일(1~75, 76~150)로 나눠 관리한다
const outline: BookOutline = { ...a, ...b }

export default outline
