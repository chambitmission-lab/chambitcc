// 플랜 상세 숫자 자간 — 숫자가 흔들리지 않게 tabular-nums.

import type { CSSProperties } from 'react'

// 통계 숫자 — 자릿수가 바뀌어도 흔들리지 않게 고정폭 숫자
const numStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums' }

// ── 분리 전 같은 파일에 있던 형제 모듈이 쓴다 ──
export { numStyle }
