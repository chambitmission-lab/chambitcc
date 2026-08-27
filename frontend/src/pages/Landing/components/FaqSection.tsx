import { useState } from 'react'
import { EditableText } from '../../../components/AboutEditor'
import { useAboutContent } from '../../../hooks/useAboutContent'
import type { AboutFieldKey } from '../../../types/aboutContent'
import { ChevronDownIcon } from '../../About/icons'
import { Reveal, SectionHeader } from './shared'
import { MicIcon, SneakerIcon, OpenBookIcon, MoneyIcon, SleepIcon } from './LandingIcons'

// 유머 FAQ — 처음 오는 사람의 불안을 먼저 꺼내 웃기고, 바로 뒤에 진짜 답을 준다.
// 웃기는 대상은 항상 "우리"(교회 다니는 사람의 경험)이지 신앙이 아니다.

const ITEMS: {
  q: AboutFieldKey
  a: AboutFieldKey
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
}[] = [
  { q: 'landingFaq1Q', a: 'landingFaq1A', Icon: MicIcon },
  { q: 'landingFaq2Q', a: 'landingFaq2A', Icon: SneakerIcon },
  { q: 'landingFaq3Q', a: 'landingFaq3A', Icon: OpenBookIcon },
  { q: 'landingFaq4Q', a: 'landingFaq4A', Icon: MoneyIcon },
  { q: 'landingFaq5Q', a: 'landingFaq5A', Icon: SleepIcon },
]

const FaqSection = ({ isAdmin, ko }: { isAdmin: boolean; ko: boolean }) => {
  const { tx } = useAboutContent()
  const [open, setOpen] = useState<number>(0)

  return (
    <section className="mt-14">
      <Reveal>
        <SectionHeader
          kicker={tx('landingFaqKicker')}
          title={
            <EditableText fieldKey="landingFaqTitle" isAdmin={isAdmin} multiline>
              <span>{tx('landingFaqTitle')}</span>
            </EditableText>
          }
        />
      </Reveal>
      <ul className="grid gap-2.5">
        {ITEMS.map((item, i) => {
          const isOpen = open === i
          return (
            <Reveal key={item.q} as="li" delay={i * 50}>
              <div
                className={`feed-card rounded-2xl overflow-hidden transition-[border-color,box-shadow] duration-200 ${
                  isOpen ? 'border-[var(--brand-glow)] shadow-[0_8px_22px_-10px_var(--brand-glow)]' : ''
                }`}
              >
                {/* EditableText 가 <button> 을 렌더하므로 행 자체는 button 이 아닌 div 로 */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setOpen(isOpen ? -1 : i)
                    }
                  }}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer select-none"
                >
                  <span className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center shrink-0">
                    <item.Icon width={18} height={18} />
                  </span>
                  <span className="flex-1 min-w-0 text-[15px] font-bold text-ink-strong leading-snug">
                    <span className="text-brand mr-1.5">Q.</span>
                    <EditableText fieldKey={item.q} isAdmin={isAdmin}>
                      <span>{tx(item.q)}</span>
                    </EditableText>
                  </span>
                  <ChevronDownIcon
                    size={18}
                    className={`text-ink-muted shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                <div className={`ld-faq-body ${isOpen ? 'is-open' : ''}`}>
                  <div>
                    <div className="px-4 pb-4 pl-[64px] text-[14px] leading-relaxed text-ink whitespace-pre-line">
                      <span className="text-ink-muted font-bold mr-1.5">A.</span>
                      <EditableText fieldKey={item.a} isAdmin={isAdmin} multiline>
                        <span>{tx(item.a)}</span>
                      </EditableText>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </ul>
      <p className="mt-3 text-[12.5px] text-ink-muted">
        {ko ? '더 궁금한 건 아래에서 참비에게 직접 물어보세요. 진짜로 대답합니다.' : 'Anything else? Ask Chambi below — it actually answers.'}
      </p>
    </section>
  )
}

export default FaqSection
