// 단축키 표기 — 목사님 PC 는 윈도우라 ⌘ 대신 Ctrl 로 보여야 한다.
// (실제 키 처리는 Tiptap 의 Mod·모달의 metaKey||ctrlKey 가 이미 두 OS 를 다 받는다)

import { isMacLike } from '../../components/command/commandEvents'

const isMac = isMacLike()

/** "S" → 맥 "⌘S", 윈도우 "Ctrl+S" */
export const modKey = (key: string): string => (isMac ? `⌘${key}` : `Ctrl+${key}`)

/** 다시 하기 — 맥 ⇧⌘Z, 윈도우는 손에 익은 Ctrl+Y (Tiptap 이 둘 다 받는다) */
export const redoKey = isMac ? '⇧⌘Z' : 'Ctrl+Y'
