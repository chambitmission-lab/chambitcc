import { EditableText } from '../../../components/AboutEditor'
import { useAboutContent } from '../../../hooks/useAboutContent'
import type { AboutFieldKey } from '../../../types/aboutContent'
import { ChevronRightIcon } from '../../About/icons'
import { Reveal } from './shared'

// 솔직히, 걱정되는 것들 — 처음 오는 사람의 불안을 먼저 꺼내 웃기고, 바로 뒤에 진짜 답을 준다.
// 웃기는 대상은 항상 "우리"(교회 다니는 사람의 경험)이지 신앙이 아니다.
// 잡지 각주처럼: 짙은 면 위 번호 + 명조 질문 + 답. 아코디언으로 접지 않고 전부 펼쳐 읽히게 한다.

const ITEMS: { q: AboutFieldKey; a: AboutFieldKey }[] = [
  { q: 'landingFaq1Q', a: 'landingFaq1A' },
  { q: 'landingFaq2Q', a: 'landingFaq2A' },
  { q: 'landingFaq3Q', a: 'landingFaq3A' },
  { q: 'landingFaq4Q', a: 'landingFaq4A' },
  { q: 'landingFaq5Q', a: 'landingFaq5A' },
]

const FaqSection = ({ isAdmin, ko, onAsk }: { isAdmin: boolean; ko: boolean; onAsk: () => void }) => {
  const { tx } = useAboutContent()

  return (
    <section className="ld-worry">
      <div className="ld-worry-in">
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#8fb8ff]">
              <EditableText fieldKey="landingFaqKicker" isAdmin={isAdmin}>
                <span>{tx('landingFaqKicker')}</span>
              </EditableText>
            </p>
            <h2 className="ld-worry-title mt-3">
              <EditableText fieldKey="landingWorryTitle" isAdmin={isAdmin} multiline>
                <span>{tx('landingWorryTitle')}</span>
              </EditableText>
            </h2>
          </div>
        </Reveal>

        <ol className="ld-worry-list">
          {ITEMS.map((item, i) => (
            <Reveal key={item.q} as="li" delay={i * 60}>
              <span className="ld-worry-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <p className="ld-worry-q">
                  <EditableText fieldKey={item.q} isAdmin={isAdmin}>
                    <span>{tx(item.q)}</span>
                  </EditableText>
                </p>
                <p className="ld-worry-a">
                  <EditableText fieldKey={item.a} isAdmin={isAdmin} multiline>
                    <span>{tx(item.a)}</span>
                  </EditableText>
                </p>
              </div>
            </Reveal>
          ))}
          {/* 마지막 줄 — 더 궁금한 건 참비에게 (체험 섹션으로 스크롤) */}
          <Reveal as="li" delay={ITEMS.length * 60}>
            <span className="ld-worry-num" aria-hidden="true">+</span>
            <button type="button" onClick={onAsk} className="ld-worry-ask">
              <span>
                <span className="block">{ko ? '더 궁금한 건 참비에게' : 'Anything else? Ask Chambi'}</span>
                <span className="block mt-1 text-[14px] font-normal text-white/55">
                  {ko ? '아래에서 직접 물어보세요. 진짜로 대답합니다.' : 'Ask below — it actually answers.'}
                </span>
              </span>
              <ChevronRightIcon size={18} className="shrink-0" />
            </button>
          </Reveal>
        </ol>
      </div>
    </section>
  )
}

export default FaqSection
