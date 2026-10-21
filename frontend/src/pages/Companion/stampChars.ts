/** 이름 도장에 새길 두 글자 — 첫 글자가 같으면(김희식·김은혜처럼 성이 같은 짝) 처음 갈라지는 글자를 쓴다.
 *  동행 화면 발자국 길(FootprintPath)과 우정 카드(friendshipCard)가 같이 쓴다. */
export const stampChars = (me: string, you: string): [string, string] => {
  const a = Array.from(me.trim())
  const b = Array.from(you.trim())
  let k = 0
  while (k < a.length && k < b.length && a[k] === b[k]) k++
  if (k >= a.length || k >= b.length) k = 0
  return [a[k] ?? '·', b[k] ?? '·']
}
