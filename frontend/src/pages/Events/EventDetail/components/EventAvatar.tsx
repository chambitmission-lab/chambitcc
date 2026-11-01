import { avatarTone } from '../utils/eventDisplay'

interface EventAvatarProps {
  name: string
  /** 크기·테두리 등 추가 클래스 (기본 32px) */
  className?: string
}

/** 이름 첫 글자 아바타 — 이름마다 고정된 파스텔 톤 */
export const EventAvatar = ({ name, className = 'w-8 h-8 text-[13px]' }: EventAvatarProps) => (
  <span
    aria-hidden="true"
    className={`inline-flex items-center justify-center rounded-full font-extrabold shrink-0 ${avatarTone(name)} ${className}`}
  >
    {name.charAt(0)}
  </span>
)

/** 카드 공통 껍데기 + 제목 */
export const SectionCard = ({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: React.ReactNode
}) => (
  <section className="rounded-[22px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-5 lg:p-7">
    <h2 className="flex items-center gap-2 mb-4 text-ink-strong text-[17px] lg:text-[19px] font-extrabold tracking-[-0.025em]">
      {title}
      {count !== undefined && (
        <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-extrabold">
          {count}
        </span>
      )}
    </h2>
    {children}
  </section>
)
