import type { AgendaGroup } from '../utils/dateGrouping'
import AgendaCard from './AgendaCard'

interface AgendaSectionProps {
  group: AgendaGroup
}

const AgendaSection = ({ group }: AgendaSectionProps) => {
  return (
    <section className="px-4 mb-5">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <h3 className="text-gray-900 dark:text-white text-[14px] font-bold tracking-[-0.01em]">
          {group.label}
        </h3>
        <span className="text-gray-400 dark:text-white/45 text-[11.5px] font-semibold">
          {group.events.length}건
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {group.events.map(ev => (
          <AgendaCard key={ev.id} event={ev} />
        ))}
      </div>
    </section>
  )
}

export default AgendaSection
