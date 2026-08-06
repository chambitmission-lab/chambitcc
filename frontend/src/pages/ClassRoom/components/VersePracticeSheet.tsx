// 가리고 외우기 — 암송요절 연습 시트
// 단계가 올라갈수록 단어가 더 많이 가려진다. 가린 단어는 탭하면 살짝 보여준다.
// 마지막 단계까지 가면 '암송 완료' 체크로 자연스럽게 이어진다.
import { useMemo, useState } from 'react'
import { useToggleClassPostRecite } from '../../../hooks/useClassRoom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { ClassPost } from '../../../types/classRoom'
import { showToast } from '../../../utils/toast'

// 단계별 가림 비율
const LEVELS = [
  { ratio: 0, label: '전체 보기' },
  { ratio: 0.3, label: '조금 가리기' },
  { ratio: 0.6, label: '많이 가리기' },
  { ratio: 1, label: '전부 가리기' },
]

// post.id 시드 고정 의사난수 — 단계를 오가도 같은 단어가 가려진다
const seededShuffle = (length: number, seed: number): number[] => {
  const arr = Array.from({ length }, (_, i) => i)
  let s = seed || 1
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const VersePracticeSheet = ({
  post,
  onClose,
}: {
  post: ClassPost
  onClose: () => void
}) => {
  const verse = post.verse!
  const toggleRecite = useToggleClassPostRecite(post.class_id)
  const [level, setLevel] = useState(0)
  const [peeked, setPeeked] = useState<Set<number>>(new Set())

  useModalBackButton(onClose)

  const words = useMemo(() => verse.text?.split(/\s+/).filter(Boolean) ?? [], [verse.text])
  // 가릴 순서(시드 고정) — 상위 ratio 비율만큼 가린다
  const maskOrder = useMemo(() => seededShuffle(words.length, post.id), [words.length, post.id])
  const maskedSet = useMemo(() => {
    const count = Math.round(words.length * LEVELS[level].ratio)
    return new Set(maskOrder.slice(0, count))
  }, [maskOrder, words.length, level])

  const changeLevel = (next: number) => {
    setLevel(next)
    setPeeked(new Set())
  }

  const togglePeek = (i: number) => {
    setPeeked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const handleComplete = async () => {
    if (post.recited_by_me) {
      onClose()
      return
    }
    try {
      await toggleRecite.mutateAsync(post.id)
      showToast('🌟 암송 완료! 별을 받았어요', 'success')
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '암송 체크에 실패했습니다', 'error')
    }
  }

  const allMasked = level === LEVELS.length - 1

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="relative w-full max-w-md overflow-y-auto rounded-t-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl"
        style={{ maxHeight: 'calc(var(--vvh, 100dvh) * 0.9)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-4" />
        <h3 className="text-[17px] font-bold text-ink-strong">🎯 가리고 외우기</h3>
        <p className="text-[12px] text-gray-400 dark:text-white/45 mt-0.5">
          {verse.reference} · 가려진 단어는 눌러서 살짝 볼 수 있어요
        </p>

        {/* 단계 선택 */}
        <div className="flex gap-1.5 mt-4">
          {LEVELS.map((l, i) => (
            <button
              key={l.label}
              type="button"
              onClick={() => changeLevel(i)}
              className={`flex-1 py-2 rounded-xl text-[11.5px] font-bold transition-all ${
                level === i
                  ? 'bg-amber-400/90 text-white shadow-[0_4px_12px_-4px_rgba(245,158,11,0.5)]'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* 본문 — 단어 단위 가림 */}
        <div className="mt-4 px-4 py-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-400/[0.08] dark:to-orange-400/[0.05] border border-amber-200/60 dark:border-amber-300/20">
          <p className="text-[16px] leading-[2] text-gray-800 dark:text-white/90 break-keep">
            {words.map((w, i) => {
              const masked = maskedSet.has(i) && !peeked.has(i)
              return (
                <span key={i}>
                  {maskedSet.has(i) ? (
                    <button
                      type="button"
                      onClick={() => togglePeek(i)}
                      className={`inline-block align-baseline rounded-md px-1 -mx-0.5 transition-colors ${
                        masked
                          ? 'bg-amber-300/50 dark:bg-amber-300/25 text-transparent select-none'
                          : 'bg-amber-200/40 dark:bg-amber-300/15 text-amber-700 dark:text-amber-200'
                      }`}
                    >
                      {w}
                    </button>
                  ) : (
                    w
                  )}
                  {i < words.length - 1 && ' '}
                </span>
              )
            })}
          </p>
          <p className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300 mt-3 text-right">
            — {verse.reference}
          </p>
        </div>

        {/* 다음 단계 / 완료 */}
        {!allMasked ? (
          <button
            type="button"
            onClick={() => changeLevel(level + 1)}
            className="w-full mt-5 py-3.5 rounded-2xl bg-amber-500 text-white text-[14.5px] font-bold shadow-[0_10px_28px_-8px_rgba(245,158,11,0.55)] active:scale-[0.98] transition-transform"
          >
            더 가리고 외워보기 →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={toggleRecite.isPending}
            className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[14.5px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {post.recited_by_me ? '이미 암송 완료! 닫기' : '🌟 다 외웠어요! 암송 완료'}
          </button>
        )}
        {allMasked && !post.recited_by_me && (
          <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-2">
            완료하면 별 ⭐ 을 받고 선생님께도 보여요
          </p>
        )}
      </div>
    </div>
  )
}

export default VersePracticeSheet
