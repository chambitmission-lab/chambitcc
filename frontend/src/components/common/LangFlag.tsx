import { getLanguageCountryCode } from '../../utils/languageFlags'

interface LangFlagProps {
  // 언어 코드(ko/en/vi/ja/fr/zh) 또는 국가 코드(kr/us/vn/jp/cn)
  code?: string
  className?: string
}

/**
 * flag-icons SVG 국기.
 * OS 이모지 폰트에 베트남 등 일부 국기 글리프가 없어 깨지는 문제를 방지하기 위해
 * 모든 국기를 SVG로 통일 렌더링한다.
 */
const LangFlag = ({ code, className = '' }: LangFlagProps) => {
  const country = getLanguageCountryCode(code)
  return <span className={`fi fi-${country} ${className}`.trim()} aria-hidden="true" />
}

export default LangFlag
