import { useLanguage } from '../../contexts/LanguageContext'

interface VerseDisplayProps {
  verse: {
    content: string
    reference: string
    id: number
  }
}

// 설정 화면 하단의 오늘의 말씀 — 촛불 톤에 맞춘 따뜻하고 조용한 카드
const VerseDisplay = ({ verse }: VerseDisplayProps) => {
  const { t } = useLanguage()
  return (
    <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden border border-white/10 animate-fade-in">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-6 bg-amber-300/50"></div>
          <h3 className="text-amber-200/80 text-xs font-medium tracking-wide">{t('todayVerse')}</h3>
        </div>
        <p className="font-serif-kr text-white/90 text-[16px] leading-relaxed mb-3">
          "{verse.content}"
        </p>
        <p className="text-white/40 text-xs tracking-wide text-right">
          — {verse.reference}
        </p>
      </div>
    </div>
  )
}

export default VerseDisplay
