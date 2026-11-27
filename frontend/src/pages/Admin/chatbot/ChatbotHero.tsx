// 참비 관제실 머리 — 참비 상태(남색 판, 라이트·다크 공통) + 최근 7일 새 질문 막대.
// 백엔드엔 "답한 질문" 기록이 없어서, 지어낸 비율 대신 미답변함에 실제로 쌓인 것만 보여 준다.
import type { ChatbotIntent, ChatbotUnanswered } from '../../../types/chatbot'
import { avatarJoy, avatarThinking, tone } from './chatbotTheme'
import { lastSevenDays } from './chatbotAdminUtils'

interface Props {
  unanswered: ChatbotUnanswered[]
  intents: ChatbotIntent[]
}

const ChatbotHero = ({ unanswered, intents }: Props) => {
  const waiting = unanswered.filter((u) => u.status !== 'resolved')
  const people = waiting.reduce((s, u) => s + u.ask_count, 0)
  const learned = unanswered.filter((u) => u.status === 'resolved').length
  const active = intents.filter((i) => i.is_active).length
  const days = lastSevenDays(unanswered)
  const max = Math.max(1, ...days.map((d) => d.open + d.weak + d.resolved))
  const weekTotal = days.reduce((s, d) => s + d.open + d.weak + d.resolved, 0)
  const calm = waiting.length === 0

  return (
    <section className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16264a] to-[#0f1830] text-white border border-white/10 p-5 lg:p-6 flex items-center gap-4 lg:gap-5">
        <div className="pointer-events-none absolute -right-20 -top-24 w-72 h-72 rounded-full bg-[#3182f6]/25 blur-3xl" />
        <div className="relative shrink-0">
          <img
            src={calm ? avatarJoy : avatarThinking}
            alt=""
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full ring-4 ring-[#5aa2ff]/40"
          />
          <span
            className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full ring-4 ring-[#16264a] ${calm ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <p className={`m-0 text-[13px] font-bold ${calm ? 'text-emerald-300' : 'text-amber-300'}`}>
            {calm ? '● 모든 질문에 답하는 중' : `● 가르쳐 줄 질문 ${waiting.length}개`}
          </p>
          <p className="m-0 mt-1 text-[22px] lg:text-[26px] font-extrabold leading-tight tracking-tight">
            {calm ? (
              <>참비가 막힘없이 답하고 있어요</>
            ) : (
              <>
                <span className="text-[#8fc0ff]">{people}명</span>이 참비의 답을 기다려요
              </>
            )}
          </p>
          <p className="m-0 mt-1.5 text-[14px] text-white/65">
            아는 말 {intents.length}가지(켜짐 {active}) · 지금까지 {learned}개 질문을 해결했어요
          </p>
        </div>
      </div>

      <div className={`rounded-3xl ${tone.panel} p-5`}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className={`m-0 text-[14px] font-bold ${tone.strong}`}>
            최근 7일 새 질문 <span className={tone.accentText}>{weekTotal}</span>
          </p>
          <span className={`flex gap-2.5 text-[12px] ${tone.sub}`}>
            <span className="inline-flex items-center gap-1">
              <i className="w-2 h-2 rounded-full bg-rose-400" />
              못 답함
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="w-2 h-2 rounded-full bg-amber-400" />
              애매
            </span>
            <span className="inline-flex items-center gap-1">
              <i className={`w-2 h-2 rounded-full ${tone.accentBg}`} />
              해결
            </span>
          </span>
        </div>
        <div className="flex items-end gap-2 h-[96px]">
          {days.map((d) => {
            const t = d.open + d.weak + d.resolved
            return (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1" title={`${d.label} ${t}개`}>
                <span className={`text-[11px] font-bold ${t ? tone.body : 'text-transparent'}`}>{t}</span>
                <div
                  className="w-full flex flex-col justify-end rounded-md overflow-hidden bg-gray-100 dark:bg-white/[0.05]"
                  style={{ height: 56 }}
                >
                  {t > 0 && (
                    <div className="flex flex-col" style={{ height: `${(t / max) * 100}%` }}>
                      <div className="bg-rose-400" style={{ flex: d.open }} />
                      <div className="bg-amber-400" style={{ flex: d.weak }} />
                      <div className={tone.accentBg} style={{ flex: d.resolved }} />
                    </div>
                  )}
                </div>
                <span className={`text-[12px] ${d.label === '오늘' ? `font-bold ${tone.strong}` : tone.sub}`}>{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ChatbotHero
