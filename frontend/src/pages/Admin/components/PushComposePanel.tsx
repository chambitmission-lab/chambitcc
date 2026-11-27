// 푸시 알림 — 데스크 오른쪽 '새 알림' 패널(2026-11-27)
// 템플릿 → 제목·내용 → 누르면 갈 곳 → 기기 미리보기 → 받는 사람(AudiencePicker) 순서로 한 줄로 내려가고,
// 보내기는 위 막대에 늘 보인다. 상태(입력값·결과)는 PushNotificationManagement 가 쥔다.
import { useState, type ReactNode } from 'react'
import type { SendPushResult } from '../../../api/push'
import type { AudiencePickerState } from '../../../hooks/useAudiencePicker'
import AudiencePicker from './AudiencePicker'
import { BODY_MAX, DEFAULT_ICON, NOTIFICATIONS_URL, PRESETS, TITLE_MAX, URL_OPTIONS, type PushPreset } from './pushDeskUtils'

export type PushResult =
  | { ok: true; data: SendPushResult; audienceLabel: string }
  | { ok: 'pending'; audienceLabel: string }
  | { ok: false; message: string }
  | null

export interface PushDraft {
  title: string
  body: string
  url: string
  tag: string
  icon: string
}

const I = ({ d, size = 16, className = '' }: { d: ReactNode; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
)
const IC = {
  send: <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></>,
  back: <path d="M15 18l-6-6 6-6" />,
  down: <path d="M6 9l6 6 6-6" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
}

const inputCls =
  'w-full px-3.5 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:border-brand transition-colors'

const Count = ({ n, max }: { n: number; max: number }) => (
  <span className={`text-[12.5px] font-semibold tabular-nums ${n >= max ? 'text-red-500' : n >= max * 0.85 ? 'text-amber-600' : 'text-gray-400 dark:text-white/40'}`}>
    {n}/{max}
  </span>
)

const Section = ({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) => (
  <section>
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/55">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
)

/** 휴대폰 잠금화면 알림 한 장 */
export const DevicePreview = ({ title, body, icon }: { title: string; body: string; icon: string }) => (
  <div className="rounded-3xl bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 dark:from-slate-700 dark:via-slate-800 dark:to-indigo-950 p-4 lg:p-5">
    <p className="text-center text-[34px] font-bold tabular-nums text-white/90 drop-shadow-sm leading-none">
      {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
    </p>
    <div className="mt-4 rounded-2xl bg-white/85 dark:bg-black/45 backdrop-blur-md p-3 flex items-start gap-3 shadow-sm">
      <span className="shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-brand flex items-center justify-center text-white">
        <img
          src={icon || DEFAULT_ICON}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-gray-500 dark:text-white/60">참빛교회</span>
          <span className="text-[12px] text-gray-400 dark:text-white/45">지금</span>
        </span>
        <span className="block text-[14.5px] font-bold text-gray-900 dark:text-white truncate">{title}</span>
        <span className="block text-[13.5px] text-gray-700 dark:text-white/80 leading-snug line-clamp-3 break-words">{body}</span>
      </span>
    </div>
  </div>
)

export interface PushComposePanelProps {
  draft: PushDraft
  onChange: (patch: Partial<PushDraft>) => void
  onApplyPreset: (p: PushPreset) => void
  picker: AudiencePickerState
  sending: boolean
  result: PushResult
  canSend: boolean
  onSend: () => void
  onReset: () => void
  onClose?: () => void
}

const PushComposePanel = ({ draft, onChange, onApplyPreset, picker, sending, result, canSend, onSend, onReset, onClose }: PushComposePanelProps) => {
  const [advanced, setAdvanced] = useState(false)
  const { audienceLabel, audienceCount } = picker

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <span className="text-[15px] font-bold text-ink-strong">새 알림</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onReset}
          disabled={sending}
          className="h-9 px-3 rounded-xl text-[13.5px] font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.07] disabled:opacity-50 transition"
        >
          비우기
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap disabled:opacity-40 transition"
        >
          {sending ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              보내는 중…
            </>
          ) : (
            <>
              <I d={IC.send} size={15} />
              {audienceLabel}에게 보내기
            </>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-5 pb-10 max-w-[760px] space-y-6">
          {/* 결과 — 보낸 직후에만 */}
          {result &&
            (result.ok === 'pending' ? (
              <div className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3.5 flex items-start gap-3">
                <span className="mt-0.5 w-[18px] h-[18px] shrink-0 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
                <p className="text-[14px] leading-[1.6] text-gray-700 dark:text-white/80 break-keep">
                  <b className="font-bold text-ink-strong">{result.audienceLabel}에게 보내는 중이에요.</b> 이 화면을 닫아도 계속 보내지고, 결과는 왼쪽 기록에 남아요.
                </p>
              </div>
            ) : result.ok ? (
              <div className={`rounded-2xl px-4 py-3.5 ${result.data.sent === 0 ? 'bg-red-50 dark:bg-red-500/10' : result.data.failed > 0 ? 'bg-amber-50 dark:bg-amber-400/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
                <p className="text-[14.5px] font-bold text-ink-strong">
                  {result.data.sent === 0 ? '아무에게도 닿지 않았어요' : `${result.audienceLabel}에게 보냈어요`}
                </p>
                <p className="mt-0.5 text-[14px] text-gray-700 dark:text-white/75">
                  성공 <b className="tabular-nums">{result.data.sent}</b> · 실패 <b className="tabular-nums">{result.data.failed}</b> · 구독자 <b className="tabular-nums">{result.data.users_notified}</b>
                </p>
                <p className="mt-1 text-[13px] leading-[1.55] text-gray-600 dark:text-white/60 break-keep">
                  {result.data.failed > 0 && '실패는 알림 구독이 끝났거나 안 켠 분이에요 — 프로필에서 알림을 다시 켜도록 안내해 주세요. '}
                  {(result.data.recorded ?? 0) > 0 ? '알림함에도 남아 푸시를 놓친 분도 알림 벨에서 다시 볼 수 있어요.' : '알림함 기록은 실패했어요 — 푸시는 갔지만 알림 벨에는 남지 않아요.'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3.5">
                <p className="text-[14.5px] font-bold text-red-700 dark:text-red-300">보내지 못했어요</p>
                <p className="mt-0.5 text-[13.5px] text-gray-700 dark:text-white/75 break-keep">{result.message}</p>
              </div>
            ))}

          <Section title="자주 보내는 알림">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onApplyPreset(p)}
                  className="text-left rounded-2xl bg-gray-50 dark:bg-white/[0.04] hover:bg-[var(--brand-soft)] px-3 py-2.5 transition"
                >
                  <span className="block text-[18px] leading-none" aria-hidden="true">
                    {p.emoji}
                  </span>
                  <span className="mt-1.5 block text-[13.5px] font-bold text-ink-strong truncate">{p.title}</span>
                  <span className="block text-[12px] text-gray-500 dark:text-white/50 truncate">{p.hint}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="제목" aside={<Count n={draft.title.length} max={TITLE_MAX} />}>
            <input
              id="push-title"
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value.slice(0, TITLE_MAX) })}
              placeholder="예) 이번 주일은 연합 예배로 드려요"
              className={`${inputCls} h-12 text-[16px] font-semibold`}
            />
          </Section>

          <Section title="내용" aside={<Count n={draft.body.length} max={BODY_MAX} />}>
            <textarea
              value={draft.body}
              onChange={(e) => onChange({ body: e.target.value.slice(0, BODY_MAX) })}
              placeholder="알림에 보일 한두 문장"
              rows={3}
              className={`${inputCls} py-3 text-[15px] leading-[1.6] resize-none`}
            />
          </Section>

          <Section title="누르면 갈 곳">
            <div className="flex flex-wrap gap-1.5">
              {URL_OPTIONS.map((o) => {
                const on = draft.url === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange({ url: o.value })}
                    aria-pressed={on}
                    className={`h-9 px-3.5 rounded-full text-[13.5px] font-semibold transition ${
                      on ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
            <input value={draft.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="/news" className={`${inputCls} mt-2 h-10 text-[13.5px] font-mono`} aria-label="앱 안 경로" />
            <p className="mt-1.5 text-[13px] text-gray-500 dark:text-white/50 break-keep">
              {draft.url === NOTIFICATIONS_URL ? '갈 화면이 따로 없는 인사·안내용 — 앱을 열고 알림함을 펼쳐 받은 내용을 다시 보여 줘요' : '알림을 누르면 이 화면으로 바로 가요'}
            </p>

            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              aria-expanded={advanced}
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80"
            >
              더 보기 · 태그·아이콘
              <I d={IC.down} size={15} className={`transition-transform ${advanced ? 'rotate-180' : ''}`} />
            </button>
            {advanced && (
              <div className="mt-2.5 grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block mb-1 text-[13px] font-semibold text-gray-600 dark:text-white/65">태그</span>
                  <input value={draft.tag} onChange={(e) => onChange({ tag: e.target.value })} placeholder="notification" className={`${inputCls} h-10 text-[13.5px] font-mono`} />
                  <span className="block mt-1 text-[12.5px] text-gray-500 dark:text-white/50">같은 태그의 이전 알림은 새 알림으로 바뀌어요</span>
                </label>
                <label className="block">
                  <span className="block mb-1 text-[13px] font-semibold text-gray-600 dark:text-white/65">아이콘 주소</span>
                  <input value={draft.icon} onChange={(e) => onChange({ icon: e.target.value })} placeholder={DEFAULT_ICON} className={`${inputCls} h-10 text-[13.5px] font-mono`} />
                </label>
              </div>
            )}
          </Section>

          <Section title="휴대폰에 이렇게 떠요">
            <div className="max-w-[420px]">
              <DevicePreview title={draft.title || '알림 제목'} body={draft.body || '알림 내용이 여기에 보여요'} icon={draft.icon} />
            </div>
          </Section>

          <Section
            title="받는 사람"
            aside={
              <span className="text-[13px] font-bold text-brand">
                {audienceLabel}
                {audienceCount > 0 && picker.audienceMode !== 'all' && ` · ${audienceCount}명`}
              </span>
            }
          >
            <AudiencePicker picker={picker} />
            <p className="mt-2 inline-flex items-start gap-1.5 text-[13px] text-gray-500 dark:text-white/50 break-keep">
              <I d={IC.bell} size={14} className="mt-0.5 shrink-0" />
              프로필에서 알림을 켠 분에게만 푸시가 가고, 알림함(알림 벨)에는 모두에게 남아요.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

export default PushComposePanel
