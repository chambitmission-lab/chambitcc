import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { showToast } from '../../../../utils/toast'
import { getCurrentUser } from '../../../../utils/auth'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { useProfileDetail } from '../../../../hooks/useProfile'
import { THANKS_EMOTIONS, type ThanksEmotion } from '../../../../types/thanks'
import ThanksAvatar from './ThanksAvatar'
import './thanks.css'

const MAX_LEN = 100
const EMOTION_KEYS = Object.keys(THANKS_EMOTIONS) as ThanksEmotion[]

/* 헤더 부제 — 열 때마다 바뀌는 한 줄. "이거 별거 아닌데 써도 되나?"를 미리 풀어준다 */
const SUBTITLES = {
  ko: [
    '작아도 괜찮아요. 진짜 작아도요 🙂',
    '오늘 하루 중 1%쯤 좋았던 순간은요?',
    '거창하지 않아도 하나님은 다 아세요',
    '자랑해도 됩니다. 여긴 그런 곳이에요',
    '별일 없었던 것도, 사실 큰 감사예요',
  ],
  en: [
    'Small counts. Really, the tiny ones count 🙂',
    'What was 1% good about today?',
    'It doesn’t have to be grand — God knows it all',
    'Brag a little. This is that kind of place',
    'Even “nothing happened” is a big thanks',
  ],
}

/* 예시 문장 — 웃으면서 읽고 "아, 이 정도면 되네" 하게 만드는 것들 */
const PLACEHOLDERS = {
  ko: [
    '예: 지각인 줄 알았는데 신호등이 전부 초록불이었어요 🚦',
    '예: 냉장고 마지막 요구르트, 아무도 안 건드렸습니다',
    '예: 엘리베이터가 문을 잡고 저를 기다려줬어요',
    '예: 오늘 커피가 유난히 맛있었어요 ☕',
    '예: 비 왔는데 가방에 우산이 들어있었어요 ☔',
    '예: 아이가 먼저 와서 안아줬어요',
    '예: 오늘 별일 없었어요. 그게 감사예요',
  ],
  en: [
    'e.g., I thought I was late — every light was green 🚦',
    'e.g., The last yogurt in the fridge was still mine',
    'e.g., Someone held the elevator for me',
    'e.g., Today’s coffee tasted unusually good ☕',
    'e.g., It rained, and my umbrella was already in my bag ☔',
    'e.g., My kid hugged me first today',
    'e.g., Nothing happened today. That’s the thanks',
  ],
}

/* 감사 씨앗 — 첫 문장이 안 떠오를 때 눌러서 시작하는 문장 머리 */
const SEEDS = {
  ko: [
    '오늘 감사한 건, ',
    '사소하지만 ',
    '덕분에 ',
    '그래도 ',
    '하나님, 오늘 ',
    '웃겼던 건 ',
    '무사히 ',
    '작지만 ',
    '뜻밖에 ',
  ],
  en: [
    'Today I’m thankful for ',
    'It’s small, but ',
    'Thanks to ',
    'Even so, ',
    'God, today ',
    'What made me laugh: ',
    'Safely ',
    'A little thing: ',
    'Unexpectedly ',
  ],
}

const BURST_EMOJIS = ['🙏', '💛', '✨', '😊', '🕊️', '💗', '🎉', '😄']

const pickRandom = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

const pickSeeds = (pool: string[], count = 3): string[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

interface BurstPiece {
  emoji: string
  style: CSSProperties
}

const makeBurst = (accent: string): BurstPiece[] =>
  Array.from({ length: 14 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4
    const distance = 90 + Math.random() * 110
    return {
      emoji: i % 3 === 0 ? accent : pickRandom(BURST_EMOJIS),
      style: {
        '--bx': `${Math.cos(angle) * distance}px`,
        '--by': `${Math.sin(angle) * distance - 40}px`,
        '--bs': `${0.9 + Math.random() * 0.8}`,
        '--br': `${Math.round((Math.random() - 0.5) * 120)}deg`,
        animationDelay: `${i * 18}ms`,
      } as CSSProperties,
    }
  })

interface ThanksComposerProps {
  onClose: () => void
  onSubmit: (payload: { content: string; emotion?: ThanksEmotion | null }) => Promise<void>
}

const ThanksComposer = ({ onClose, onSubmit }: ThanksComposerProps) => {
  const { language } = useLanguage()
  const ko = language === 'ko'
  const [content, setContent] = useState('')
  const [emotion, setEmotion] = useState<ThanksEmotion | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [burst, setBurst] = useState<BurstPiece[] | null>(null)
  const [rolling, setRolling] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 열릴 때 한 번만 뽑는다 — 타이핑 중에 문구가 바뀌면 정신없다
  const subtitle = useMemo(() => pickRandom(SUBTITLES[ko ? 'ko' : 'en']), [ko])
  const placeholder = useMemo(() => pickRandom(PLACEHOLDERS[ko ? 'ko' : 'en']), [ko])
  const [seeds, setSeeds] = useState(() => pickSeeds(SEEDS[ko ? 'ko' : 'en']))

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  const meta = emotion ? THANKS_EMOTIONS[emotion] : null
  const accent = meta?.hue ?? 'var(--brand)'

  // 미리보기에 쓸 내 프로필 — 이름은 프로필 상세 우선(로그인 응답에 없을 수 있음)
  const { data: profileDetail } = useProfileDetail()
  const authorName =
    profileDetail?.stats.full_name ||
    getCurrentUser().fullName ||
    getCurrentUser().username ||
    (ko ? '나' : 'Me')
  const authorAvatar = profileDetail?.stats.avatar_url ?? null

  const rollSeeds = () => {
    setSeeds(pickSeeds(SEEDS[ko ? 'ko' : 'en']))
    setRolling(true)
    window.setTimeout(() => setRolling(false), 500)
  }

  const applySeed = (seed: string) => {
    setContent((prev) => {
      const next = prev.trim() ? `${prev.trimEnd()} ${seed}` : seed
      return next.slice(0, MAX_LEN)
    })
    textareaRef.current?.focus()
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) {
      showToast(
        ko ? '한 줄만 적어주세요, 정말 한 줄이면 돼요' : 'Just one line is enough',
        'error',
      )
      return
    }
    if (trimmed.length > MAX_LEN) {
      showToast(
        ko ? `최대 ${MAX_LEN}자까지 담을 수 있어요` : `Max ${MAX_LEN} characters`,
        'error',
      )
      return
    }
    try {
      setSubmitting(true)
      await onSubmit({ content: trimmed, emotion })
      // 폭죽 한 번 터뜨리고 닫는다
      setBurst(makeBurst(meta?.emoji ?? '🙏'))
      showToast(ko ? '감사가 도착했어요 🙏' : 'Your thanks is in 🙏', 'success')
      window.setTimeout(onClose, 780)
    } catch (e) {
      setSubmitting(false)
      showToast(
        e instanceof Error
          ? e.message
          : ko
            ? '등록에 실패했어요. 잠시 후 다시 시도해주세요'
            : 'Failed to submit',
        'error',
      )
    }
  }

  const ratio = Math.min(1, content.length / MAX_LEN)
  const nearLimit = MAX_LEN - content.length <= 15
  const canSubmit = content.trim().length > 0 && !submitting && !burst

  const RING_R = 9
  const RING_C = 2 * Math.PI * RING_R

  return (
    <div
      className="thanks-backdrop fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="thanks-sheet relative w-full sm:max-w-[420px] max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-t-[28px] sm:rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-container)] shadow-[0_-18px_50px_rgba(0,0,0,0.30)] sm:shadow-[var(--card-shadow)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* 손잡이 — 시트라는 걸 알려주는 표시 */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'var(--text-muted)', opacity: 0.35 }}
          />
        </div>

        {/* 헤더 */}
        <div className="px-5 pt-2.5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-ink-strong">
              {ko ? '오늘, 감사 한 조각' : 'One piece of thanks'}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={ko ? '닫기' : 'Close'}
            className="shrink-0 w-9 h-9 -mr-1 flex items-center justify-center rounded-full text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
          >
            <span className="material-icons-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* 미리보기 — 지금 쓰는 게 피드에 어떻게 보일지 실시간으로 */}
        <div className="px-5">
          <div
            className="relative overflow-hidden rounded-2xl border p-4 transition-colors duration-300"
            style={{
              borderColor: meta
                ? `color-mix(in srgb, ${accent} 32%, transparent)`
                : 'var(--card-border)',
              background: meta
                ? `color-mix(in srgb, ${accent} 8%, var(--surface-inset))`
                : 'var(--surface-inset)',
            }}
          >
            <span className="absolute right-3 top-3 text-[9.5px] font-bold tracking-[0.1em] text-ink-muted">
              {ko ? '미리보기' : 'PREVIEW'}
            </span>

            <div className="flex items-start gap-3">
              <div
                className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-[22px] transition-all duration-300"
                style={{
                  background: meta
                    ? `color-mix(in srgb, ${accent} 18%, transparent)`
                    : 'var(--surface-container-high)',
                  boxShadow: meta
                    ? `0 6px 16px color-mix(in srgb, ${accent} 22%, transparent)`
                    : 'none',
                }}
              >
                {meta ? (
                  <span key={emotion} className="thanks-swap leading-none">
                    {meta.emoji}
                  </span>
                ) : (
                  <span className="thanks-nudge leading-none opacity-45">🫥</span>
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                {content.trim() ? (
                  <p className="text-[14.5px] leading-[1.6] text-ink-strong break-words whitespace-pre-wrap line-clamp-3">
                    {content}
                  </p>
                ) : (
                  <p className="text-[14px] leading-[1.6] text-ink-muted">
                    {ko
                      ? '여기에 오늘의 감사가 담겨요'
                      : 'Your thanks will show up here'}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                  <ThanksAvatar name={authorName} avatarUrl={authorAvatar} size={20} />
                  <span className="truncate font-semibold">{authorName}</span>
                  <span className="opacity-60">·</span>
                  <span>{ko ? '방금' : 'just now'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 오늘의 마음 */}
        <div className="px-5 pt-5">
          <div className="flex items-baseline justify-between mb-2.5">
            <label className="text-[12.5px] font-bold tracking-[-0.01em] text-ink-strong">
              {ko ? '오늘의 마음' : 'Today’s heart'}
            </label>
            <span className="text-[11px] text-ink-muted">
              {ko ? '골라도 되고 안 골라도 돼요' : 'optional'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {EMOTION_KEYS.map((key) => {
              const item = THANKS_EMOTIONS[key]
              const active = emotion === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEmotion(active ? null : key)}
                  aria-pressed={active}
                  className="group flex flex-col items-center gap-1 py-2.5 rounded-2xl border transition-all active:scale-95"
                  style={
                    active
                      ? {
                          borderColor: `color-mix(in srgb, ${item.hue} 55%, transparent)`,
                          background: `color-mix(in srgb, ${item.hue} 14%, transparent)`,
                          boxShadow: `0 6px 16px color-mix(in srgb, ${item.hue} 22%, transparent)`,
                        }
                      : {
                          borderColor: 'var(--card-border)',
                          background: 'var(--surface-inset)',
                        }
                  }
                >
                  <span
                    className={`text-[23px] leading-none transition-all ${
                      active
                        ? 'thanks-pop'
                        : 'grayscale opacity-55 group-hover:grayscale-0 group-hover:opacity-100'
                    }`}
                  >
                    {item.emoji}
                  </span>
                  <span
                    className="text-[10.5px] font-bold"
                    style={{ color: active ? item.hue : 'var(--text-muted)' }}
                  >
                    {ko ? item.label : item.labelEn}
                  </span>
                </button>
              )
            })}
          </div>

          <p
            key={emotion ?? 'none'}
            className="thanks-swap mt-2 text-[12px] leading-snug"
            style={{ color: meta ? accent : 'var(--text-muted)' }}
          >
            {meta
              ? ko
                ? meta.hint
                : meta.hintEn
              : ko
                ? '마음을 고르면 카드에 색이 입혀져요'
                : 'Pick one and your card gets its color'}
          </p>
        </div>

        {/* 감사 내용 */}
        <div className="px-5 pt-4">
          <div
            className="rounded-2xl border px-4 pt-3.5 pb-2.5 transition-colors focus-within:border-brand"
            style={{ background: 'var(--surface-inset)', borderColor: 'var(--card-border)' }}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              rows={3}
              maxLength={MAX_LEN}
              autoFocus
              placeholder={placeholder}
              className="w-full bg-transparent resize-none outline-none text-[15px] leading-[1.65] text-ink-strong placeholder:text-ink-muted"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11.5px] text-ink-muted">
                {ko ? '한 줄이면 충분해요' : 'One line is plenty'}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: nearLimit ? 'var(--amber)' : 'var(--text-muted)' }}
                >
                  {content.length}/{MAX_LEN}
                </span>
                <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90">
                  <circle
                    cx="11"
                    cy="11"
                    r={RING_R}
                    fill="none"
                    strokeWidth="2.5"
                    stroke="var(--card-border)"
                  />
                  <circle
                    cx="11"
                    cy="11"
                    r={RING_R}
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    stroke={nearLimit ? 'var(--amber-icon)' : 'var(--brand)'}
                    strokeDasharray={RING_C}
                    strokeDashoffset={RING_C * (1 - ratio)}
                    style={{ transition: 'stroke-dashoffset 0.2s ease-out' }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 감사 씨앗 — 첫 문장 도우미 */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-ink-strong">
              {ko ? '막막할 땐, 이렇게 시작해봐요' : 'Stuck? Start like this'}
            </span>
            <button
              type="button"
              onClick={rollSeeds}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[11.5px] font-semibold text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
            >
              <span className={rolling ? 'thanks-roll inline-block' : 'inline-block'}>🎲</span>
              {ko ? '다른 문장' : 'Shuffle'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {seeds.map((seed) => (
              <button
                key={seed}
                type="button"
                onClick={() => applySeed(seed)}
                className="px-3 py-1.5 rounded-full border border-dashed text-[12.5px] text-ink hover:text-brand hover:border-brand active:scale-95 transition-all"
                style={{ borderColor: 'var(--card-border)', background: 'transparent' }}
              >
                {seed.trim()}
              </button>
            ))}
          </div>
        </div>

        {/* 액션 */}
        <div
          className="sticky bottom-0 mt-5 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 border-t border-[var(--card-border)]"
          style={{ background: 'var(--surface-container)' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-3 rounded-2xl text-[14px] font-semibold text-ink border border-[var(--card-border)] hover:text-brand hover:border-brand transition-colors disabled:opacity-50"
          >
            {ko ? '다음에' : 'Later'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 rounded-2xl bg-brand text-[var(--on-brand)] text-[15px] font-extrabold tracking-[-0.01em] shadow-[0_8px_20px_var(--brand-glow)] hover:bg-brand-dim active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-1.5"
          >
            <span className="text-[16px] leading-none">{meta?.emoji ?? '🙏'}</span>
            {submitting || burst
              ? ko
                ? '남기는 중…'
                : 'Sharing…'
              : ko
                ? '감사 남기기'
                : 'Share thanks'}
          </button>
        </div>
      </div>

      {/* 등록 성공 — 이모지 폭죽 */}
      {burst && (
        <div className="thanks-burst pointer-events-none fixed inset-0 z-[210] flex items-center justify-center">
          {burst.map((piece, i) => (
            <span
              key={i}
              className="thanks-burst-piece absolute text-[26px]"
              style={piece.style}
            >
              {piece.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default ThanksComposer
