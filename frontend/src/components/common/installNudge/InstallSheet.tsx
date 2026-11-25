// 설치 안내 시트 — "홈 화면에 이렇게 놓여요"를 먼저 보여 주고 설치를 권한다.
// 안드로이드·PC 크롬은 버튼 한 번으로 브라우저 설치 창을 띄우고,
// iOS 는 설치 프롬프트가 없어 같은 자리에 "공유 → 홈 화면에 추가" 순서를 그려 준다.
import { useState, type ReactNode } from 'react'
import type { InstallReason } from '../../../utils/installNudge'
import { BottomSheet, SheetBody, SheetFooter } from '../BottomSheet'
import { NUDGE_COPY, place } from './copy'

/* 앱 전역 아이콘 문법 — 인라인 SVG, stroke 1.8 */
const Glyph = ({ children }: { children: ReactNode }) => (
  <svg
    className="w-[18px] h-[18px]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
)

const ShareGlyph = () => (
  <Glyph>
    <path d="M12 15V3" />
    <path d="M8 7l4-4 4 4" />
    <path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" />
  </Glyph>
)

const AddBoxGlyph = () => (
  <Glyph>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8.5v7M8.5 12h7" />
  </Glyph>
)

const BENEFITS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: '한 번에 열려요',
    body: place('주소창 없이, 홈 화면에서 앱처럼'),
    icon: (
      <Glyph>
        <rect x="6" y="3" width="12" height="18" rx="3" />
        <path d="M10.5 17.5h3" />
      </Glyph>
    ),
  },
  {
    title: '알림이 와요',
    body: '말씀 알람 · 함께한 기도 · 새 주보',
    icon: (
      <Glyph>
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z" />
        <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
      </Glyph>
    ),
  },
  {
    title: '스토어가 필요 없어요',
    body: '내려받는 시간 없이 몇 초면 끝',
    icon: (
      <Glyph>
        <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />
      </Glyph>
    ),
  },
]

/** 홈 화면 미리보기 — 빈 앱 칸 사이로 참빛 아이콘이 내려앉는다 */
const HomePreview = () => (
  <div className="inz-phone" aria-hidden>
    <div className="inz-grid">
      {Array.from({ length: 8 }, (_, i) =>
        i === 5 ? (
          <div key={i} className="inz-slot">
            <img src="/pwa-192x192.png" alt="" className="inz-app" />
            <span className="inz-app-name">참빛교회</span>
          </div>
        ) : (
          <div key={i} className="inz-slot">
            <span className="inz-tile" />
            <span className="inz-tile-name" />
          </div>
        ),
      )}
    </div>
  </div>
)

const IOS_STEPS: { text: ReactNode; icon: ReactNode }[] = [
  {
    text: (
      <>
        브라우저의 <strong>공유</strong> 버튼을 눌러요
        <span className="block text-[12px] text-ink-muted mt-0.5">Safari 는 화면 아래, Chrome 은 주소창 오른쪽</span>
      </>
    ),
    icon: <ShareGlyph />,
  },
  {
    text: (
      <>
        목록을 내려 <strong>홈 화면에 추가</strong>를 골라요
      </>
    ),
    icon: <AddBoxGlyph />,
  },
  {
    text: (
      <>
        오른쪽 위 <strong>추가</strong>를 누르면 끝이에요
      </>
    ),
    icon: (
      <Glyph>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </Glyph>
    ),
  },
]

export const InstallSheet = ({
  reason,
  ios,
  onInstall,
  onClose,
}: {
  reason: InstallReason
  /** iOS 손 안내 모드 (설치 프롬프트가 없는 브라우저) */
  ios: boolean
  /** 브라우저 설치 창을 띄운다 — 수락했으면 true */
  onInstall: () => Promise<boolean>
  onClose: () => void
}) => {
  const [installing, setInstalling] = useState(false)

  const handleInstall = async () => {
    setInstalling(true)
    try {
      if (await onInstall()) onClose()
    } finally {
      setInstalling(false)
    }
  }

  return (
    <BottomSheet onClose={onClose} ariaLabel="참빛 앱 설치 안내">
      <SheetBody className="pt-2">
        <HomePreview />

        <h2 className="mt-5 text-[20px] font-bold text-ink-strong leading-snug">{place('홈 화면에 참빛 한 자리')}</h2>
        <p className="mt-1.5 text-[14px] text-ink-muted leading-relaxed">{place(NUDGE_COPY[reason].sheet)}</p>

        {ios ? (
          <ol className="mt-5 space-y-2.5">
            {IOS_STEPS.map((step, i) => (
              <li key={i} className="inz-step">
                <span className="inz-step-no">{i + 1}</span>
                <span className="flex-1 min-w-0 text-[14px] text-ink-strong leading-snug">{step.text}</span>
                <span className="inz-step-icon">{step.icon}</span>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="mt-5 space-y-3.5">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex items-center gap-3">
                <span className="inz-benefit-icon">{b.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-ink-strong leading-tight">{b.title}</span>
                  <span className="block text-[12.5px] text-ink-muted leading-tight mt-1">{b.body}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </SheetBody>

      <SheetFooter>
        {ios ? (
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl bg-brand text-brand-on text-[15px] font-semibold active:scale-[0.98] transition-transform duration-150"
          >
            알겠어요
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="shrink-0 h-12 px-4 rounded-2xl text-[14px] font-medium text-ink-muted hover:bg-[var(--surface-inset)] transition-colors duration-150"
            >
              다음에
            </button>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 h-12 rounded-2xl bg-brand text-brand-on text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-150 disabled:opacity-60"
            >
              {installing && (
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              )}
              {place('홈 화면에 추가')}
            </button>
          </div>
        )}
      </SheetFooter>
    </BottomSheet>
  )
}
