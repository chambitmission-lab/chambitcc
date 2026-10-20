// 동행 상세 — 서로를 위한 기도: 짝에게만 보이는 이번 주 기도제목 + "오늘 너를 위해 기도했어" 한 번
import { useState } from 'react'
import { useCheerCompanion, useUpdateCompanionTopic } from '../../hooks/useCompanion'
import type { CompanionDetail } from '../../types/companion'
import { showToast } from '../../utils/toast'
import { Sheet } from './CompanionParts'

const TOPIC_MAX = 200

const CompanionPrayer = ({ c }: { c: CompanionDetail }) => {
  const cheer = useCheerCompanion(c.id)
  const [topicOpen, setTopicOpen] = useState(false)
  const name = c.partner.name
  const prayedToday = !!c.cheer?.by_me_today

  const handleCheer = () => {
    if (prayedToday) return
    cheer.mutate(undefined, {
      onSuccess: () => showToast(`${name}님에게 기도를 전했어요`, 'success'),
      onError: (e) => showToast(e.message, 'error'),
    })
  }

  return (
    <section className="px-4 lg:px-0 pt-8">
      <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-3 px-0.5">서로를 위한 기도</h3>
      <div className="rounded-2xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark p-4">
        {c.cheer?.by_partner_today && (
          <p className="mb-3 rounded-xl bg-[var(--brand-soft)] px-3.5 py-2.5 text-[13px] font-semibold text-ink-strong">
            {name}님이 오늘 당신을 위해 기도했어요
          </p>
        )}

        <div className="text-[12px] font-bold text-gray-500 dark:text-white/55">{name}님의 이번 주 기도제목</div>
        <p className="mt-1.5 text-[14.5px] leading-[1.65] text-ink-strong whitespace-pre-wrap break-words">
          {c.partner_topic ?? (
            <span className="text-gray-400 dark:text-white/40 font-normal">아직 나누지 않았어요. 이름을 부르며 기도해 주세요.</span>
          )}
        </p>

        <button
          type="button"
          onClick={handleCheer}
          disabled={prayedToday || cheer.isPending}
          aria-pressed={prayedToday}
          className={`mt-4 w-full py-3 rounded-xl text-[14px] font-bold transition-colors ${
            prayedToday
              ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55'
              : 'bg-[var(--brand-soft)] text-brand active:scale-[0.99]'
          }`}
        >
          {prayedToday ? '오늘 기도를 전했어요' : `🙏 오늘 ${name}님을 위해 기도했어요`}
        </button>
        {prayedToday && (
          <p className="mt-2 text-center text-[11.5px] text-gray-400 dark:text-white/40">내일 또 전할 수 있어요</p>
        )}

        <div className="mt-5 pt-4 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] font-bold text-gray-500 dark:text-white/55">내 기도제목 · {name}님에게만 보여요</div>
            <button type="button" onClick={() => setTopicOpen(true)} className="shrink-0 text-[12.5px] font-bold text-brand">
              {c.my_topic ? '고치기' : '나누기'}
            </button>
          </div>
          {c.my_topic && (
            <p className="mt-1.5 text-[13.5px] leading-[1.65] text-gray-600 dark:text-white/70 whitespace-pre-wrap break-words">
              {c.my_topic}
            </p>
          )}
        </div>
      </div>

      {topicOpen && <TopicSheet c={c} onClose={() => setTopicOpen(false)} />}
    </section>
  )
}

const TopicSheet = ({ c, onClose }: { c: CompanionDetail; onClose: () => void }) => {
  const update = useUpdateCompanionTopic(c.id)
  const [text, setText] = useState(c.my_topic ?? '')

  const save = (content: string) =>
    update.mutate(content, {
      onSuccess: () => {
        showToast(content.trim() ? `${c.partner.name}님에게 나눴어요` : '기도제목을 내렸어요', 'success')
        onClose()
      },
      onError: (e) => showToast(e.message, 'error'),
    })

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-[17px] font-bold text-ink-strong">이번 주 기도제목</h3>
      <p className="text-[12.5px] text-gray-500 dark:text-white/55 mt-1 mb-4 leading-[1.6]">
        {c.partner.name}님에게만 보여요. 다음 주가 되면 새로 나눌 수 있어요.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, TOPIC_MAX))}
        rows={4}
        autoFocus
        placeholder="예) 이번 주 면접이 있어요. 떨지 않게 기도해 주세요"
        className="w-full resize-none px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14.5px] leading-[1.6] focus:outline-none focus:border-brand placeholder:text-gray-400 dark:placeholder:text-white/35"
      />
      <div className="mt-1 text-right text-[11.5px] text-gray-400 dark:text-white/40 tabular-nums">
        {text.length}/{TOPIC_MAX}
      </div>
      <div className="mt-4 flex gap-2">
        {c.my_topic && (
          <button
            type="button"
            onClick={() => save('')}
            disabled={update.isPending}
            className="px-4 py-3.5 rounded-2xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-bold text-gray-600 dark:text-white/70"
          >
            내리기
          </button>
        )}
        <button
          type="button"
          onClick={() => save(text)}
          disabled={update.isPending || !text.trim()}
          className="flex-1 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40"
        >
          {c.partner.name}님에게 나누기
        </button>
      </div>
    </Sheet>
  )
}

export default CompanionPrayer
