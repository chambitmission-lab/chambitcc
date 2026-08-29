import { useState } from 'react'
import { EditableText } from '../../../components/AboutEditor'
import { useAboutContent } from '../../../hooks/useAboutContent'
import type { AboutFieldKey } from '../../../types/aboutContent'
import { ChevronDownIcon } from '../../About/icons'
import { Reveal, SectionHeader } from './shared'
import { MicIcon, SneakerIcon, OpenBookIcon, MoneyIcon, SleepIcon, SparkleIcon } from './LandingIcons'
import { ChevronRightIcon } from '../../About/icons'

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
      {/* md+: 2열 벤토(2×3) — 질문 5개 + 마지막 칸은 참비 CTA 타일. 열린 카드만 유리 질감 + 포인트 테두리 */}
      <ul className="grid gap-2.5 md:grid-cols-2 md:gap-3 md:items-start">
        {ITEMS.map((item, i) => {
          const isOpen = open === i
          return (
            <Reveal key={item.q} as="li" delay={i * 50}>
              <div className={`ld-faq-card feed-card rounded-2xl overflow-hidden${isOpen ? ' is-open' : ''}`}>
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

        {/* 6번째 칸 — 더 궁금한 건 참비에게 (데모 섹션으로 스크롤) */}
        <Reveal as="li" delay={ITEMS.length * 50}>
          <button
            type="button"
            className="ld-faq-cta w-full h-full min-h-[76px] rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left"
            onClick={() => document.getElementById('tour')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <span className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <SparkleIcon width={18} height={18} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-bold leading-snug">
                {ko ? '더 궁금한 건 참비에게' : 'Anything else? Ask Chambi'}
              </span>
              <span className="block text-[12.5px] opacity-85 mt-0.5">
                {ko ? '아래에서 직접 물어보세요. 진짜로 대답합니다.' : 'Ask below — it actually answers.'}
              </span>
            </span>
            <ChevronRightIcon size={16} className="shrink-0 opacity-90" />
          </button>
        </Reveal>
      </ul>
    </section>
  )
}

export default FaqSection
