import { useState } from 'react'

/* 비밀번호 칸의 Caps Lock 감지 — PC 키보드에서 로그인이 "이유 없이" 실패하는 가장 흔한 원인.
   비밀번호는 가려져 보이지 않으니, 켜져 있으면 치는 동안 칸 아래에서 바로 알려준다.
   키 입력 때마다 getModifierState 로 다시 읽어 칸 밖에서 Caps Lock 을 바꿔도 따라간다.
   칸을 떠나면 경고를 거둔다(다른 칸에서까지 떠 있으면 무슨 경고인지 헷갈린다). */
export const useCapsLock = () => {
  const [capsOn, setCapsOn] = useState(false)
  const read = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 모바일 가상 키보드 등 getModifierState 가 없는 환경은 조용히 넘어간다
    if (typeof e.getModifierState === 'function') setCapsOn(e.getModifierState('CapsLock'))
  }
  return {
    capsOn,
    capsLockProps: {
      onKeyDown: read,
      onKeyUp: read,
      onBlur: () => setCapsOn(false),
    },
  }
}
