interface VerseDisplayProps {
  verse: {
    content: string
    reference: string
    id: number
  }
}

const VerseDisplay = ({ verse }: VerseDisplayProps) => {
  return (
    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons-outlined text-yellow-400">auto_stories</span>
        <span className="text-sm text-white/70">오늘의 말씀</span>
      </div>
      <p className="text-lg text-white/90 leading-relaxed mb-4">
        {verse.content}
      </p>
      <p className="text-sm text-white/60 text-right">
        - {verse.reference}
      </p>
    </div>
  )
}

export default VerseDisplay
