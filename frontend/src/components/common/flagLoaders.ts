/* 국기 SVG 경로 표 — CountryFlag 가 국기를 실제로 그릴 때만 동적 import 한다.
   glob 은 271개국의 로더 스텁을 만들어 30kB 가까이 되므로, 이 표를 화면 청크에 같이
   넣으면 국기 한 장 안 쓰는 방문자도 그 무게를 받는다(선교사 탭에만 필요하다). */
const FLAG_LOADERS = import.meta.glob('../../../node_modules/flag-icons/flags/4x3/*.svg', {
  // no-inline — 작은 SVG 를 base64 로 청크에 박아 넣지 않게 한다
  query: '?url&no-inline',
  import: 'default',
}) as Record<string, () => Promise<string>>

/** ISO 3166-1 alpha-2 소문자 코드 → 국기 URL. 모르는 나라면 null */
export const flagUrl = async (code: string): Promise<string | null> => {
  const key = Object.keys(FLAG_LOADERS).find((path) => path.endsWith(`/${code}.svg`))
  if (!key) return null
  return FLAG_LOADERS[key]()
}
