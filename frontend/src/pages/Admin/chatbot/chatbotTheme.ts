// 참비 관제실 톤·참비 얼굴 — 컴포넌트 파일과 나눠 둔다(fast refresh).
export { default as avatarDefault } from '../../../components/chatbot/img/default.webp'
export { default as avatarSorry } from '../../../components/chatbot/img/sorry.webp'
export { default as avatarThinking } from '../../../components/chatbot/img/thinking.webp'
export { default as avatarJoy } from '../../../components/chatbot/img/joy.webp'
export { default as avatarTalking } from '../../../components/chatbot/img/talking.webp'

// 라이트 = 흰 판, 다크 = C1 남색 관제실. 한 곳에서 톤을 정해 둔다.
export const tone = {
  panel: 'bg-white dark:bg-[#0f1830] border border-gray-200/80 dark:border-white/10',
  line: 'border-gray-100 dark:border-white/[0.07]',
  soft: 'bg-gray-50 dark:bg-white/[0.03]',
  sunk: 'bg-[var(--app-canvas)] dark:bg-black/30',
  sub: 'text-gray-500 dark:text-white/55',
  body: 'text-gray-700 dark:text-white/75',
  strong: 'text-ink-strong dark:text-white',
  // 다크에선 brand 보다 한 단계 밝은 하늘색이 남색 위에서 또렷하다
  accentBg: 'bg-brand dark:bg-[#5aa2ff]',
  accentText: 'text-brand dark:text-[#8fc0ff]',
  input:
    'w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3.5 py-2.5 text-[15px] text-ink-strong dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:border-brand dark:focus:border-[#5aa2ff] transition-colors',
  ghostBtn:
    'rounded-xl border border-gray-200 dark:border-white/15 px-4 py-2.5 text-[14px] font-semibold text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors',
  primaryBtn:
    'rounded-2xl bg-brand hover:bg-brand-dim text-white font-bold shadow-[0_8px_20px_-8px_var(--brand-glow)] transition-colors disabled:opacity-50',
}
