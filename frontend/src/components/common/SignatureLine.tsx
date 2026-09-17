import { SIGNATURE_INK } from '../../pages/Greeting/components/signatureInk'

/* 서명 문장 안의 이름만 손글씨 잉크로 바꿔 "참빛교회 담임목사 [사인] 올림" 으로 읽히게 한다.
   등록된 이름이 아니면 텍스트 그대로.
   인사말(/greeting)과 교회 소개(/about) 편지가 같은 사인을 쓴다 — 두 화면이
   같은 목사님의 같은 편지라는 인상을 주는 건 사인의 필체가 같을 때다. */
export function SignatureLine({
  text,
  name,
  className = 'gr-signature-ink',
}: {
  text: string
  name: string
  /** 잉크 <img> 에 붙일 클래스 — 화면마다 크기·정렬이 달라 바깥에서 준다 */
  className?: string
}) {
  const ink = name ? SIGNATURE_INK[name] : undefined
  const at = ink && name ? text.indexOf(name) : -1
  if (!ink || at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      {/* CSS mask 가 아니라 <img> — WebKit 은 마스크 이미지 적용 전 요소를 마스크 없이
          통째로 칠하고 다시 그리지 않을 때가 있어 사인 자리가 네모 박스로 남았다.
          투명 PNG(검정 잉크)를 그대로 그리고 다크 테마는 CSS filter 로 반전한다. */}
      <img className={className} src={ink} alt={name} decoding="async" draggable={false} />
      {text.slice(at + name.length)}
    </>
  )
}

export default SignatureLine
