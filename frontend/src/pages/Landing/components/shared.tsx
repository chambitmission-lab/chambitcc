import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/** 스크롤로 화면에 들어올 때 .is-in 을 붙여 등장시키는 래퍼 */
export const Reveal = ({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li'
}) => {
  const ref = useRef<HTMLElement | null>(null)
  // IntersectionObserver 가 없는 환경(구형 웹뷰)에선 처음부터 보이게
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const Comp = Tag as 'div'
  return (
    <Comp
      ref={ref as never}
      className={`ld-reveal min-w-0 ${inView ? 'is-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Comp>
  )
}

export const SectionHeader = ({
  kicker,
  title,
  action,
  align = 'left',
}: {
  kicker?: string
  title: ReactNode
  action?: ReactNode
  align?: 'left' | 'center'
}) => (
  <div className={`mb-5 flex items-end justify-between gap-3 ${align === 'center' ? 'text-center flex-col items-center' : ''}`}>
    <div>
      {kicker && (
        <p className="mb-1.5 text-[12px] font-bold tracking-[0.14em] uppercase text-brand">{kicker}</p>
      )}
      <h2 className="text-[22px] lg:text-[26px] leading-[1.25] font-extrabold tracking-tight text-ink-strong whitespace-pre-line">
        {title}
      </h2>
    </div>
    {action}
  </div>
)

