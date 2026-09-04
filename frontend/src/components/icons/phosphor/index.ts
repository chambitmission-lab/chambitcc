// Phosphor 아이콘은 이 모듈에서만 import 한다 (eslint no-restricted-imports 로 강제).
//   import { Sparkle, type Icon } from '.../components/icons/phosphor'
// 목록에 없는 아이콘은 소스에 import 를 먼저 적고 `node scripts/gen-phosphor-icons.mjs` 실행.
export type { Icon, IconProps, IconWeight } from './IconBase'
export * from './generated'
