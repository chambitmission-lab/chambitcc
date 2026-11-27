// 성장 기록 — 해결된 질문을 "참비가 배운 날" 타임라인으로. (해결 시각 = updated_at)
import type { ChatbotIntent, ChatbotUnanswered } from '../../../types/chatbot'
import { avatarJoy, tone } from './chatbotTheme'
import { fmtMD } from './chatbotAdminUtils'

interface Props {
  unanswered: ChatbotUnanswered[]
  intents: ChatbotIntent[]
  capLabel: (n: number) => string
  onDelete: (u: ChatbotUnanswered) => void
}

const GrowthLog = ({ unanswered, intents, capLabel, onDelete }: Props) => {
  const resolved = unanswered
    .filter((u) => u.status === 'resolved')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  const helped = resolved.reduce((s, u) => s + u.ask_count, 0)

  return (
    <div className="p-5 lg:p-7 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      <div className="text-center mb-8 lg:mb-0 lg:sticky lg:top-4 self-start">
        <img src={avatarJoy} alt="" className="mx-auto w-28 h-28 rounded-full shadow-xl" />
        <p className={`m-0 mt-4 text-[22px] font-extrabold ${tone.strong}`}>참비가 자란 기록</p>
        <p className={`m-0 mt-1 text-[14.5px] ${tone.body}`}>
          해결한 질문 <b className={tone.accentText}>{capLabel(resolved.length)}개</b>
          <br />그 질문을 한 사람 <b className={tone.accentText}>{helped}명</b>
          <br />지금 아는 말 <b className={tone.accentText}>{intents.length}가지</b>
        </p>
      </div>

      {resolved.length === 0 ? (
        <p className={`m-0 py-10 text-center text-[15px] ${tone.sub}`}>아직 해결한 질문이 없어요. 첫 질문을 가르쳐 볼까요?</p>
      ) : (
        <ol className="m-0 p-0 list-none relative">
          <span className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-200 dark:bg-white/10" />
          {resolved.map((u) => (
            <li key={u.id} className="relative pl-8 pb-6 group">
              <span className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-brand dark:bg-[#5aa2ff] ring-4 ring-[var(--brand-soft-strong)] dark:ring-[#5aa2ff]/20" />
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`m-0 text-[13px] font-bold ${tone.sub}`}>
                    {fmtMD(u.updated_at)} 배움 · {u.ask_count}명이 물었던 질문
                  </p>
                  <p className={`m-0 mt-0.5 text-[16.5px] font-bold break-words ${tone.strong}`}>“{u.text}”</p>
                  {u.answer && (
                    <p className={`m-0 mt-1 text-[14px] line-clamp-2 whitespace-pre-line ${tone.body}`}>→ {u.answer}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(u)}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-rose-500 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-400/10"
                >
                  지우기
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default GrowthLog
