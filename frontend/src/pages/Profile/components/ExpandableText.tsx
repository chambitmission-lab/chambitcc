import { useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'

interface ExpandableTextProps {
  text: string
  /** 접힌 상태에서 보여줄 줄 수 */
  lines?: 2 | 3 | 4
  /** 본문 <p> 에 적용할 클래스 (크기/색상/행간) */
  textClassName?: string
  className?: string
}

const LINE_CLAMP: Record<number, string> = {
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
}

/**
 * 긴 본문을 N줄로 제한하고, 넘칠 때만 우측 하단에 '…더보기'를 노출.
 * 카드 전체가 클릭 영역인 경우를 위해 토글 클릭은 전파를 막는다.
 */
const ExpandableText = ({
  text,
  lines = 3,
  textClassName = '',
  className = '',
}: ExpandableTextProps) => {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    if (expanded) return
    const el = ref.current
    if (!el) return
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text, lines, expanded])

  const showToggle = overflows || expanded

  return (
    <div className={className}>
      <p
        ref={ref}
        className={`m-0 ${textClassName} ${expanded ? '' : LINE_CLAMP[lines]}`}
      >
        {text}
      </p>
      {showToggle && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            onKeyDown={(e) => e.stopPropagation()}
            className="mt-1 text-[12px] font-semibold text-purple-500 dark:text-purple-300 transition-colors hover:text-purple-700 dark:hover:text-purple-200"
            aria-expanded={expanded}
          >
            {expanded ? t('achievementCollapse') : `…${t('viewMore')}`}
          </button>
        </div>
      )}
    </div>
  )
}

export default ExpandableText
