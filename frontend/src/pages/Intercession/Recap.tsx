// 누군가의 기도 — 지난달 마무리 (주기가 끝나고 두 주 동안 페이지 맨 위)
//
// 받은 쪽: 지난달 등불 + 도착한 편지 + 얼굴 모르는 기도자에게 고마움 한마디(한 번)
// 기도한 쪽: 내가 기도한 날 수 + 내가 기도한 분이 보낸 고마움
// 모두: 교회 전체 합계 + 내 기도제목을 타임캡슐에 봉인해 1년 뒤 돌아보기
//
// 등불이 하나도 켜지지 않은 달도 있다. 그 사실을 크게 말하지 않고, 새 달로 시선을 돌린다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IntercessionRecap } from '../../api/intercession'
import { useSendIntercessionThanks } from '../../hooks/useIntercession'
import { toastFeedback } from '../../utils/toast'
import { cycleMonthLabel } from './intercessionDates'
import { FlameGlyph, Lamp } from './intercessionUi'

const THANKS_MAX = 100
const THANKS_PRESETS = [
  '고마워요. 큰 힘이 됐어요',
  '기도 덕분에 한 달을 잘 지냈어요',
  '저도 누군가를 위해 기도할게요',
]

/** 오늘로부터 1년 뒤 'YYYY-MM-DD' (캡슐 개봉일) */
const oneYearLater = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const ThanksComposer = ({ month }: { month: string }) => {
  const [text, setText] = useState('')
  const send = useSendIntercessionThanks(
    toastFeedback({ success: '고마움이 조용히 전해졌어요', error: '고마움을 전하지 못했습니다' }),
  )
  const body = text.trim()
  return (
    <div className="mt-4 rounded-xl border border-gray-100 dark:border-white/[0.06] p-3.5">
      <p className="text-[13px] font-bold text-ink-strong">얼굴 모르는 기도자에게 고마움 전하기</p>
      <p className="mt-0.5 text-[12px] text-[var(--text-muted)] break-keep">
        {month}에 당신을 위해 기도한 분께 이름 없이 전해져요. 한 번만 보낼 수 있어요.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {THANKS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setText(preset)}
            className={`px-3 h-8 rounded-full text-[12.5px] font-semibold border transition-colors ${
              text === preset
                ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-brand'
                : 'border-gray-200 dark:border-white/10 text-[var(--text-body)]'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, THANKS_MAX))}
          placeholder="직접 한마디 적기"
          className="flex-1 min-w-0 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] px-3 text-[13.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-[var(--brand)]"
        />
        <button
          type="button"
          disabled={!body || send.isPending}
          onClick={() => send.mutate(body)}
          className="shrink-0 h-10 px-4 rounded-xl bg-[var(--brand)] text-[var(--on-brand)] text-[13.5px] font-bold disabled:opacity-50"
        >
          전하기
        </button>
      </div>
    </div>
  )
}

export const RecapCard = ({ recap }: { recap: IntercessionRecap }) => {
  const navigate = useNavigate()
  const month = cycleMonthLabel(recap.start_date)
  const anyLit = recap.weeks.some((w) => w.lit)

  const sealCapsule = () => {
    const params = new URLSearchParams({
      from: 'intercession',
      intercessionCycleId: String(recap.cycle_id),
      title: `누군가 함께 기도해 준 ${month}`,
      openDate: oneYearLater(),
      openLabel: '1년 뒤',
    })
    navigate(`/capsule/new?${params.toString()}`)
  }

  return (
    <section className="relative overflow-hidden mx-4 mt-5 rounded-[26px] px-5 pt-6 pb-5 bg-white dark:bg-card-dark ring-1 ring-[var(--brand-soft-strong)] shadow-[0_10px_30px_-18px_rgba(49,130,246,0.5)]">
      <span className="flex items-center gap-1.5 text-[12px] font-bold text-brand">
        <FlameGlyph size={14} />
        {month}의 기도를 마무리해요
      </span>

      {recap.was_receiver ? (
        <>
          <h2 className="mt-2 text-[20px] font-extrabold tracking-[-0.02em] leading-[1.35] text-ink-strong whitespace-pre-line break-keep">
            {anyLit ? `${month}, 누군가 당신을 위해\n기도했어요` : `새 달, 새로운 누군가가\n당신을 위해 기도해요`}
          </h2>
          {anyLit ? (
            <div className="mt-4">
              <Lamp weeks={recap.weeks} />
            </div>
          ) : null}
          {recap.letters_received > 0 ? (
            <p className="mt-3 text-center text-[12.5px] font-semibold text-brand">
              아래에 {recap.letters_received > 1 ? `편지 ${recap.letters_received}통이` : '편지 한 통이'} 도착해 있어요
            </p>
          ) : null}

          {recap.thanks_sent ? (
            <p className="mt-4 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3 text-[13px] leading-relaxed text-ink-strong break-keep">
              고마움을 전했어요 · “{recap.thanks_sent}”
            </p>
          ) : recap.can_thank ? (
            <ThanksComposer month={month} />
          ) : null}
        </>
      ) : (
        <h2 className="mt-2 text-[20px] font-extrabold tracking-[-0.02em] leading-[1.35] text-ink-strong break-keep">
          {month}에도 함께해 주셔서 고마워요
        </h2>
      )}

      {recap.was_giver ? (
        <div className="mt-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-3.5 py-3">
          <p className="text-[13px] text-[var(--text-body)] break-keep">
            {recap.my_prayed_days > 0 ? (
              <>
                당신도 {month}에 <strong className="text-brand tabular-nums">{recap.my_prayed_days}</strong>일 기도했어요
              </>
            ) : (
              `${month}에 기도했던 분을 이번 달에도 마음에 품어 주세요`
            )}
          </p>
          {recap.thanks_received.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {recap.thanks_received.map((t, i) => (
                <li key={i} className="text-[13px] leading-relaxed text-ink-strong break-keep">
                  기도한 분이 보낸 고마움 · “{t}”
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-center text-[12px] text-[var(--text-muted)] break-keep">
        {month} 우리 교회는 서로를 위해{' '}
        <strong className="text-brand tabular-nums">{recap.church_prayers.toLocaleString()}</strong>번 기도했어요
      </p>

      {recap.was_receiver ? (
        <button
          type="button"
          onClick={sealCapsule}
          className="mt-4 w-full rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-3 text-left hover:border-[var(--brand-soft-strong)] transition-colors"
        >
          <span className="block text-[13.5px] font-bold text-ink-strong">
            {recap.request_line ? '이 기도제목을 타임캡슐에 봉인하기' : `${month}의 기도를 타임캡슐에 봉인하기`}
          </span>
          <span className="mt-0.5 block text-[12px] text-[var(--text-muted)] break-keep">
            {recap.request_line ? `“${recap.request_line}” — ` : ''}1년 뒤 열어 보며 어떻게 응답되었는지 돌아봐요
          </span>
        </button>
      ) : null}
    </section>
  )
}
