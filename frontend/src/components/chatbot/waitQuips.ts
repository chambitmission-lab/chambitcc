/* 참비 대기 문구 — 회색 시머 대신 참비의 상황극 한 줄로 기다림을 채운다.
 *
 * WAKE : 첫 열기(인사 API·웰컴 청크 대기). "참비를 깨우는 중" 서사 — 처음 만나는 순간이라 캐릭터 애착을 만든다.
 * THINK: 답변 대기(TypingDots). 질문마다 뜨니 짧고 반복 피로가 적어야 한다.
 *
 * 홈 묵상 카드(WaitingQuipLoader)와 같은 규칙:
 *  - 마운트마다 다음 순번(저장소)이라 같은 농담이 연달아 나오지 않는다.
 *  - 문구는 CSS animation-delay 뒤에 드러나므로 빨리 채워지면 보이기 전에 끝난다.
 * 챗봇 UI 는 한국어 전용이라 문구도 한국어만 둔다. */

export const WAKE_QUIPS: string[] = [
  '어젯밤 늦게까지 창세기 읽었대요. 살살 깨우는 중…',
  '눈 비비는 중… 잠깐 기도하고 온대요.',
  '이불 개는 중… 양이 이불을 갠다니 좀 이상하지만요.',
  '양털 정리하는 중… 첫인상이 중요하니까요.',
  '세수하는 중… 물은 요단강에서 떠왔대요.',
  '알람을 세 번째 끄는 중… 이번엔 진짜 일어난대요.',
  '기지개 켜는 중… 뿔이 없어서 어디 걸릴 일은 없어요.',
  '99마리 세다가 잠들었대요. 한 마리 빠졌는지 확인 중…',
  '오늘의 말씀 한 번 훑고 오는 중… 준비된 인사가 좋으니까요.',
  '아침 커피 대신 시편 한 편 마시는 중…',
]

export const THINK_QUIPS: string[] = [
  '성경 1,189장 뒤적이는 중…',
  '목사님께 여쭤보고 오는 중… 농담이에요, 혼자 찾을게요.',
  '"음…" 하고 턱 괴는 중…',
  '색인 사전 넘기는 중… 종이 냄새 나요.',
  '답은 찾았는데 맞춤법 확인 중…',
  '창세기부터 훑다가 요한계시록에서 돌아오는 중…',
  '신학교 노트 펼치는 중… 글씨가 좀 삐뚤어요.',
  '양털 속에 넣어 둔 메모 꺼내는 중…',
  '히브리어 사전은 덮고 한국어로 정리하는 중…',
  '좋은 답을 위해 잠깐 묵상하는 중…',
]

const KEYS = { wake: 'chambit:cb-wake-quip', think: 'chambit:cb-think-quip' } as const

/* 마운트마다 다음 순번 — 저장소가 막혀도 무작위로 하나는 보여 준다 */
export const nextQuip = (kind: keyof typeof KEYS): string => {
  const list = kind === 'wake' ? WAKE_QUIPS : THINK_QUIPS
  try {
    const prev = Number(localStorage.getItem(KEYS[kind]))
    const next = Number.isFinite(prev) ? (prev + 1) % list.length : 0
    localStorage.setItem(KEYS[kind], String(next))
    return list[next]
  } catch {
    return list[Math.floor(Math.random() * list.length)]
  }
}
