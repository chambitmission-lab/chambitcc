interface VerseDisplayProps {
  verse: {
    content: string
    reference: string
    id: number
  }
}

const VerseDisplay = ({ verse }: VerseDisplayProps) => {
  return (
    <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden border border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.1)] animate-fade-in">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-6 bg-pink-500/70"></div>
          <h3 className="text-pink-500/90 text-xs font-bold tracking-widest uppercase">오늘의 말씀</h3>
        </div>
        <p className="font-serif text-white/90 text-lg leading-relaxed mb-4 italic">
          "{verse.content}"
        </p>
        <p className="text-white/40 text-xs tracking-wide text-right">
          - {verse.reference}
        </p>
      </div>
    </div>
  )
}

export default VerseDisplay
