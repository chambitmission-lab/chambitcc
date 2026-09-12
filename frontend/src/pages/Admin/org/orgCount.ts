// 조직 단위 재귀 개수 세기.

import { type OrgUnit } from '../../../types/organization'

const countAll = (unit: OrgUnit): number =>
  1 + unit.children.reduce((total, child) => total + countAll(child), 0)

// ── 분리 전 같은 파일에 있던 형제 모듈이 쓴다 ──
export { countAll }
