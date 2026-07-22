import { getLanguageCountryCode } from '../../utils/languageFlags'
// 전체 flag-icons CSS(600KB+) 대신 실제 지원 언어의 국기 SVG만 개별 로드
import krFlag from 'flag-icons/flags/4x3/kr.svg'
import usFlag from 'flag-icons/flags/4x3/us.svg'
import vnFlag from 'flag-icons/flags/4x3/vn.svg'
import jpFlag from 'flag-icons/flags/4x3/jp.svg'
import frFlag from 'flag-icons/flags/4x3/fr.svg'
import cnFlag from 'flag-icons/flags/4x3/cn.svg'
import thFlag from 'flag-icons/flags/4x3/th.svg'
import mmFlag from 'flag-icons/flags/4x3/mm.svg'
import './LangFlag.css'

const FLAG_SRC: Record<string, string> = {
  kr: krFlag,
  us: usFlag,
  vn: vnFlag,
  jp: jpFlag,
  fr: frFlag,
  cn: cnFlag,
  th: thFlag,
  mm: mmFlag,
}

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
  const src = FLAG_SRC[country] ?? FLAG_SRC.kr
  return (
    <span
      className={`fi ${className}`.trim()}
      style={{ backgroundImage: `url("${src}")` }}
      aria-hidden="true"
    />
  )
}

export default LangFlag
