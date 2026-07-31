import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import BibleVersesModal from '../BibleVersesModal'
import { usePrayerComposer } from './usePrayerComposer'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useMyGroups } from '../../../../hooks/useGroups'
import { useSpeechRecognition } from '../../../../hooks/useSpeechRecognition'
import { showToast } from '../../../../utils/toast'
import type { PrayerEmotion } from '../../../../types/prayer'
import type { PrayerComposerProps } from './types'
import '../ThanksThread/thanks.css'

const MAX_LEN = 1000
const TITLE_MAX = 100

/* 헤더 부제 — 열 때마다 바뀌는 한 줄. "이런 것도 기도해도 되나?"를 미리 풀어준다 */
const SUBTITLES = {
  ko: [
    '혼자 들고 있지 않아도 괜찮아요',
    '짧아도 괜찮아요. 하나님은 다 아세요',
    '적는 순간, 이미 기도가 시작돼요',
    '어떤 마음이든 그대로 꺼내놓아도 돼요',
    '무거운 건 여기 내려놓고 가세요',
  ],
  en: [
    'You don’t have to carry it alone',
    'Short is fine — God knows the rest',
    'The moment you write, prayer has begun',
    'Bring your heart just as it is',
    'Set the heavy things down here',
  ],
}

/* 예시 문장 — "아, 이 정도로 써도 되네" 하게 만드는 것들 */
const PLACEHOLDERS = {
  ko: [
    '예: 이번 주 면접이 있어요. 담대한 마음을 주시길…',
    '예: 아버지 수술이 잘 되도록 함께 기도해주세요',
    '예: 요즘 마음이 자꾸 조급해져요. 평안을 구합니다',
    '예: 아이가 새 학교에 잘 적응하게 해주세요',
    '예: 말로 다 못 해도 괜찮아요. 지금 마음 그대로면 돼요',
    '예: 무엇을 구해야 할지 모르겠어요. 그래도 함께해주세요',
  ],
  en: [
    'e.g., I have an interview this week. Praying for courage…',
    'e.g., Please pray for my father’s surgery to go well',
    'e.g., My heart keeps rushing lately. I’m asking for peace',
    'e.g., Help my child settle into the new school',
    'e.g., Words don’t have to be perfect — just as you are',
    'e.g., I don’t know what to ask. Please pray with me anyway',
  ],
}

/* 기도 씨앗 — 첫 문장이 안 떠오를 때 눌러서 시작하는 문장 머리 */
const SEEDS = {
  ko: [
    '하나님, 요즘 ',
    '솔직히 말하면 ',
    '함께 기도해주세요. ',
    '감사하게도 ',
    '두렵지만 ',
    '가족을 위해 ',
    '지혜가 필요해요. ',
    '이 마음을 맡깁니다. ',
    '건강을 위해 ',
  ],
  en: [
    'God, lately ',
    'Honestly, ',
    'Please pray with me. ',
    'Gratefully, ',
    'I’m afraid, but ',
    'For my family, ',
    'I need wisdom. ',
    'I leave this with You. ',
    'For health, ',
  ],
}

/* 마음 타일 — 주간 기도 스토리용 감정 태그에 색과 한 줄 힌트를 입힌다 */
const EMOTIONS: Array<{
  key: PrayerEmotion
  emoji: string
  label: string
  labelEn: string
  hue: string
  hint: string
  hintEn: string
}> = [
  { key: 'anxious', emoji: '😟', label: '불안', labelEn: 'Anxious', hue: '#a06ff0', hint: '마음이 자꾸 두근거릴 때', hintEn: 'When your heart won’t settle' },
  { key: 'tired', emoji: '😮‍💨', label: '지침', labelEn: 'Weary', hue: '#7d8fa5', hint: '기댈 곳이 필요한 하루', hintEn: 'A day that needs a place to lean' },
  { key: 'sad', emoji: '😢', label: '슬픔', labelEn: 'Sad', hue: '#4593fc', hint: '눈물이 나도 괜찮아요', hintEn: 'Tears are welcome here' },
  { key: 'lonely', emoji: '🥺', label: '외로움', labelEn: 'Lonely', hue: '#8f7ff2', hint: '혼자라고 느껴지는 요즘', hintEn: 'When it feels like just you' },
  { key: 'angry', emoji: '😠', label: '분노', labelEn: 'Angry', hue: '#ef6f5e', hint: '삭이기 힘든 마음 그대로', hintEn: 'Bring it just as it burns' },
  { key: 'confused', emoji: '😵‍💫', label: '혼란', labelEn: 'Lost', hue: '#2fa8a0', hint: '길이 잘 안 보일 때', hintEn: 'When the road is hard to see' },
  { key: 'hopeful', emoji: '🌱', label: '소망', labelEn: 'Hopeful', hue: '#35b183', hint: '작은 빛을 붙들고 싶을 때', hintEn: 'Holding on to a small light' },
  { key: 'grateful', emoji: '🙏', label: '감사', labelEn: 'Grateful', hue: '#f2a13c', hint: '감사가 스며든 기도', hintEn: 'A prayer soaked in thanks' },
]

const BURST_EMOJIS = ['🙏', '🕊️', '✨', '💛', '🌱', '💗', '☁️', '🌟']

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

const PrayerComposer = ({ onClose, onSuccess, sort = 'popular', groupId }: PrayerComposerProps) => {
  const { t, language } = useLanguage()
  const ko = language === 'ko'
  const {
    title,
    content,
    isAnonymous,
    selectedGroupId,
    emotion,
    error,
    recommendedVerses,
    showVersesModal,
    celebrating,
    isCreating,
    isLoggedIn,
    displayName,
    avatarUrl,
    setTitle,
    setContent,
    setIsAnonymous,
    setSelectedGroupId,
    setEmotion,
    handleSubmit,
    handleVersesModalClose,
  } = usePrayerComposer({ onClose, onSuccess, sort, groupId })

  const { data: groupsData } = useMyGroups()
  const groups = groupsData?.data.items || []

  const [showTitle, setShowTitle] = useState(false)
  const [seeds, setSeeds] = useState(() => pickSeeds(SEEDS[ko ? 'ko' : 'en']))
  const [rolling, setRolling] = useState(false)
  const [burst, setBurst] = useState<BurstPiece[] | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const voiceActiveRef = useRef(false)

  // 열릴 때 한 번만 뽑는다 — 타이핑 중에 문구가 바뀌면 정신없다
  const subtitle = useMemo(() => pickRandom(SUBTITLES[ko ? 'ko' : 'en']), [ko])
  const placeholder = useMemo(() => pickRandom(PLACEHOLDERS[ko ? 'ko' : 'en']), [ko])

  const meta = emotion ? EMOTIONS.find((e) => e.key === emotion) ?? null : null
  const accent = meta?.hue ?? 'var(--brand)'

  // 음성 입력 — 제목·본문 각각. 한쪽을 켜면 다른 쪽은 끈다 (마이크는 하나)
  const contentVoice = useSpeechRecognition({
    onResult: (transcript: string) => setContent(transcript),
    onError: (msg: string) => showToast(msg, 'error'),
    continuous: true,
  })
  const titleVoice = useSpeechRecognition({
    onResult: (transcript: string) => setTitle(transcript.slice(0, TITLE_MAX)),
    onError: (msg: string) => showToast(msg, 'error'),
    continuous: true,
  })

  const toggleVoice = () => {
    if (contentVoice.isListening) {
      contentVoice.stopListening()
      voiceActiveRef.current = false
    } else {
      if (titleVoice.isListening) titleVoice.stopListening()
      voiceActiveRef.current = true
      contentVoice.startListening(content)
    }
  }

  const toggleTitleVoice = () => {
    if (titleVoice.isListening) {
      titleVoice.stopListening()
    } else {
      if (contentVoice.isListening) {
        contentVoice.stopListening()
        voiceActiveRef.current = false
      }
      titleVoice.startListening(title)
    }
  }

  const handleManualContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (voiceActiveRef.current && contentVoice.isListening) return
    setContent(e.target.value.slice(0, MAX_LEN))
  }

  const handleManualTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (titleVoice.isListening) return
    setTitle(e.target.value.slice(0, TITLE_MAX))
  }

  // 등록 성공 → 폭죽 + 토스트 (닫기는 훅이 780ms 뒤에 처리)
  useEffect(() => {
    if (!celebrating) return
    if (contentVoice.isListening) contentVoice.stopListening()
    if (titleVoice.isListening) titleVoice.stopListening()
    setBurst(makeBurst(meta?.emoji ?? '🙏'))
    showToast(ko ? '기도가 올라갔어요 🙏' : 'Your prayer is up 🙏', 'success')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrating])

  const rollSeeds = () => {
    setSeeds(pickSeeds(SEEDS[ko ? 'ko' : 'en']))
    setRolling(true)
    window.setTimeout(() => setRolling(false), 500)
  }

  const applySeed = (seed: string) => {
    const base = content.trim() ? `${content.trimEnd()} ${seed}` : seed
    setContent(base.slice(0, MAX_LEN))
    textareaRef.current?.focus()
  }

  const handleRemoveTitle = () => {
    if (titleVoice.isListening) titleVoice.stopListening()
    setTitle('')
    setShowTitle(false)
  }

  const ratio = Math.min(1, content.length / MAX_LEN)
  const nearLimit = MAX_LEN - content.length <= 50
  const canSubmit = content.trim().length > 0 && !isCreating && !celebrating

  const RING_R = 9
  const RING_C = 2 * Math.PI * RING_R

  const anonymousName = t('anonymousDisplayName')
  const previewName = isAnonymous ? anonymousName : displayName

  return (
    <>
      {/* 성경 구절 모달 */}
      {showVersesModal && recommendedVerses && (
        <BibleVersesModal verses={recommendedVerses} onClose={handleVersesModalClose} />
      )}

      <div
        className="thanks-backdrop fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:p-4 overflow-hidden"
        onClick={onClose}
      >
        <div
          className="thanks-sheet relative w-full sm:max-w-[440px] max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-t-[28px] sm:rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-container)] shadow-[0_-18px_50px_rgba(0,0,0,0.30)] sm:shadow-[var(--card-shadow)]"
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
                {ko ? '오늘, 기도 한 조각' : 'One piece of prayer'}
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

          <form onSubmit={handleSubmit}>
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
                    {title.trim() && (
                      <p className="text-[14.5px] font-bold leading-snug text-ink-strong break-words line-clamp-1 mb-0.5">
                        {title}
                      </p>
                    )}
                    {content.trim() ? (
                      <p className="text-[14.5px] leading-[1.6] text-ink-strong break-words whitespace-pre-wrap line-clamp-3">
                        {content}
                      </p>
                    ) : (
                      <p className="text-[14px] leading-[1.6] text-ink-muted">
                        {ko ? '여기에 오늘의 기도가 담겨요' : 'Your prayer will show up here'}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                      {isAnonymous || !avatarUrl ? (
                        <span
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px]"
                          style={{
                            background: isAnonymous
                              ? 'var(--surface-container-high)'
                              : 'var(--brand)',
                            color: isAnonymous ? 'var(--text-muted)' : 'var(--on-brand)',
                            fontWeight: 700,
                            fontSize: isAnonymous ? '12px' : '10px',
                          }}
                        >
                          {isAnonymous ? '🤫' : previewName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="shrink-0 w-5 h-5 rounded-full object-cover"
                        />
                      )}
                      <span key={previewName} className="thanks-swap truncate font-semibold">
                        {previewName}
                      </span>
                      <span className="opacity-60">·</span>
                      <span>{ko ? '방금' : 'just now'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 골방 기도자 토글 + 공개 범위 — 누구에게 어떻게 보일지 한 자리에서 */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    aria-pressed={isAnonymous}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all active:scale-95 ${
                      isAnonymous
                        ? 'border-transparent bg-brand text-[var(--on-brand)] shadow-[0_4px_12px_var(--brand-glow)]'
                        : 'text-ink-muted hover:text-brand'
                    }`}
                    style={
                      isAnonymous
                        ? undefined
                        : { borderColor: 'var(--card-border)', background: 'var(--surface-inset)' }
                    }
                  >
                    <span className="material-icons-outlined text-[14px]">
                      {isAnonymous ? 'lock' : 'lock_open'}
                    </span>
                    {t('prayerComposerAnonymous')}
                  </button>
                )}

                {groups.map((group) => {
                  const active = selectedGroupId === group.id
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(active ? null : group.id)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all active:scale-95 ${
                        active
                          ? 'border-transparent bg-brand text-[var(--on-brand)] shadow-[0_4px_12px_var(--brand-glow)]'
                          : 'text-ink-muted hover:text-brand'
                      }`}
                      style={
                        active
                          ? undefined
                          : { borderColor: 'var(--card-border)', background: 'var(--surface-inset)' }
                      }
                    >
                      <span>{group.icon}</span>
                      {group.name}
                    </button>
                  )
                })}
              </div>

              <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
                {selectedGroupId
                  ? ko
                    ? '이 소그룹에만 보여요'
                    : 'Visible to this group only'
                  : isAnonymous
                    ? t('anonymousNotice')
                    : t('realNameNotice')}
              </p>
            </div>

            {/* 오늘의 마음 */}
            <div className="px-5 pt-4">
              <div className="flex items-baseline justify-between mb-2.5">
                <label className="text-[12.5px] font-bold tracking-[-0.01em] text-ink-strong">
                  {ko ? '지금 마음은 어떠세요?' : 'How is your heart?'}
                </label>
                <span className="text-[11px] text-ink-muted">
                  {ko ? '골라도 되고 안 골라도 돼요' : 'optional'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {EMOTIONS.map((item) => {
                  const active = emotion === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setEmotion(active ? null : item.key)}
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
                        className={`text-[22px] leading-none transition-all ${
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
                    ? '골라두면 주간 기도 스토리에 마음의 흐름이 담겨요'
                    : 'Pick one — it shapes your weekly prayer story'}
              </p>
            </div>

            {/* 기도 내용 */}
            <div className="px-5 pt-4">
              <div
                className="rounded-2xl border px-4 pt-3.5 pb-2.5 transition-colors focus-within:border-brand"
                style={{ background: 'var(--surface-inset)', borderColor: 'var(--card-border)' }}
              >
                {/* 제목은 선택 — 기본은 숨기고 칩으로 필요할 때만 펼친다 */}
                {showTitle ? (
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-[var(--card-border)]">
                    <input
                      type="text"
                      value={title}
                      onChange={handleManualTitleChange}
                      placeholder={t('prayerComposerTitlePlaceholder')}
                      maxLength={TITLE_MAX}
                      autoFocus
                      className={`flex-1 min-w-0 bg-transparent outline-none text-[15.5px] font-bold tracking-[-0.015em] text-ink-strong placeholder:text-[13px] placeholder:font-normal placeholder:text-ink-muted ${
                        titleVoice.isListening ? 'animate-pulse' : ''
                      }`}
                    />
                    {titleVoice.isSupported && (
                      <button
                        type="button"
                        onClick={toggleTitleVoice}
                        aria-label={
                          titleVoice.isListening ? t('stopVoiceInput') : t('startVoiceInput')
                        }
                        className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                          titleVoice.isListening
                            ? 'text-red-500 bg-red-500/10 animate-pulse'
                            : 'text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)]'
                        }`}
                      >
                        <span className="material-icons-outlined text-[16px]">
                          {titleVoice.isListening ? 'stop_circle' : 'mic'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveTitle}
                      aria-label={t('prayerComposerRemoveTitle')}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
                    >
                      <span className="material-icons-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTitle(true)}
                    className="inline-flex items-center gap-0.5 mb-1 -ml-1 px-2 py-1 rounded-full text-[11.5px] font-semibold text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
                  >
                    <span className="material-icons-outlined text-[13px]">add</span>
                    {t('prayerComposerAddTitle')} {t('prayerComposerTitleOptional')}
                  </button>
                )}

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleManualContentChange}
                  rows={4}
                  maxLength={MAX_LEN}
                  placeholder={placeholder}
                  className={`w-full bg-transparent resize-none outline-none text-[15px] leading-[1.65] text-ink-strong placeholder:text-[13.5px] placeholder:text-ink-muted ${
                    contentVoice.isListening ? 'animate-pulse' : ''
                  }`}
                />

                <div className="flex items-center justify-between pt-1">
                  {contentVoice.isSupported ? (
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`inline-flex items-center gap-1 -ml-1 px-2 py-1 rounded-full text-[11.5px] font-semibold transition-colors ${
                        contentVoice.isListening
                          ? 'text-red-500 bg-red-500/10 animate-pulse'
                          : 'text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)]'
                      }`}
                    >
                      <span className="material-icons-outlined text-[15px]">
                        {contentVoice.isListening ? 'stop_circle' : 'mic'}
                      </span>
                      {contentVoice.isListening
                        ? ko
                          ? '듣고 있어요…'
                          : 'Listening…'
                        : ko
                          ? '말로 하기'
                          : 'Speak'}
                    </button>
                  ) : (
                    <span className="text-[11.5px] text-ink-muted">
                      {ko ? '길게 써도, 한 줄만 써도 돼요' : 'Long or short — both are fine'}
                    </span>
                  )}
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

            {/* 기도 씨앗 — 첫 문장 도우미 */}
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

            {/* 에러 */}
            {error && (
              <div className="px-5 pt-3">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                  <p className="text-[12.5px] leading-snug text-red-500">{error}</p>
                </div>
              </div>
            )}

            {/* 액션 */}
            <div
              className="sticky bottom-0 mt-5 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2 border-t border-[var(--card-border)]"
              style={{ background: 'var(--surface-container)' }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="px-5 py-3 rounded-2xl text-[14px] font-semibold text-ink border border-[var(--card-border)] hover:text-brand hover:border-brand transition-colors disabled:opacity-50"
              >
                {ko ? '다음에' : 'Later'}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 py-3 rounded-2xl bg-brand text-[var(--on-brand)] text-[15px] font-extrabold tracking-[-0.01em] shadow-[0_8px_20px_var(--brand-glow)] hover:bg-brand-dim active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-1.5"
              >
                <span className="text-[16px] leading-none">{meta?.emoji ?? '🙏'}</span>
                {isCreating || celebrating
                  ? ko
                    ? '올리는 중…'
                    : 'Sharing…'
                  : ko
                    ? '기도 올리기'
                    : 'Share prayer'}
              </button>
            </div>
          </form>
        </div>

        {/* 등록 성공 — 이모지 폭죽 */}
        {burst && (
          <div className="thanks-burst pointer-events-none fixed inset-0 z-[120] flex items-center justify-center">
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
    </>
  )
}

export default PrayerComposer
