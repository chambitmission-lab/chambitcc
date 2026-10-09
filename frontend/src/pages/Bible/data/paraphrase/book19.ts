import type { BookParaphrase } from './types'
import p1 from './psalms/part1'
import p2 from './psalms/part2'
import p3 from './psalms/part3'
import p4 from './psalms/part4'

// 시편 — 150편이라 네 파일(1~38, 39~75, 76~113, 114~150)로 나눠 관리한다
const paraphrase: BookParaphrase = { ...p1, ...p2, ...p3, ...p4 }

export default paraphrase
