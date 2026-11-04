import { motion } from 'framer-motion'
import { relationsOf, type Apostle } from '../../apostles'
import { useModalBackButton } from '../../../../../hooks/useModalBackButton'
import { SheetGrabber } from '../../../../../components/common/SheetGrabber'
import { ApostleIcon } from './ApostleIcon'
import { TONE_COLOR, initialOf, shortName, toneOf } from './apostleTheme'

// 모바일 요약 시트 — 관계도에서 사람을 누르면 아래에서 낮게 올라온다.
// 배경을 가리지 않아 관계도의 진해진 선을 같이 본다. "이야기 보기"로 전체 시트(ApostleStory).
// 뒤로가기 한 번에 이 시트만 닫힌다(useModalBackButton 스택).

interface Props {
  apostle: Apostle
  onOpenStory: () => void
  onClose: () => void
}

const ApostlePeek = ({ apostle: a, onOpenStory, onClose }: Props) => {
  useModalBackButton(onClose)
  const tone = toneOf(a.id)
  const rels = relationsOf(a.id).slice(0, 2)
  return (
    <motion.div
      key={a.id}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
    >
      <div className="rounded-t-[24px] bg-white dark:bg-card-dark border-t border-x border-gray-200 dark:border-white/[0.08] shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.25)] px-4 pt-2 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
        <div className="flex justify-center py-1.5">
          <SheetGrabber onClose={onClose} className="w-10 h-1.5 bg-black/15 dark:bg-white/20 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white"
            style={{ background: TONE_COLOR[tone] }}
            aria-hidden
          >
            <ApostleIcon icon={a.icon} size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-bold text-brand truncate">{a.badge}</p>
            <p className="text-ink-strong text-[19px] font-bold tracking-[-0.02em] leading-tight">{a.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            <span className="material-icons-round" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <p className="mt-2 text-[13px] text-gray-600 dark:text-white/65 break-keep">{a.tagline}</p>
        {rels.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {rels.map((r) => {
              const other = r.a === a.id ? r.b : r.a
              return (
                <li key={`${r.a}-${r.b}`} className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-white/[0.04] px-2.5 py-2 text-[12.5px] text-ink break-keep">
                  <span
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10.5px] font-extrabold"
                    style={{ background: TONE_COLOR[toneOf(other)] }}
                    aria-hidden
                  >
                    {initialOf(other)}
                  </span>
                  <span className="min-w-0">
                    <b className="text-ink-strong">{shortName(other)}</b> · {r.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={onOpenStory}
          className="mt-3 w-full h-12 rounded-xl bg-brand text-white text-[14.5px] font-bold active:scale-[0.99] transition-transform"
        >
          {a.name} 이야기 보기 · 장면 {a.scenes.length}
        </button>
      </div>
    </motion.div>
  )
}

export default ApostlePeek
