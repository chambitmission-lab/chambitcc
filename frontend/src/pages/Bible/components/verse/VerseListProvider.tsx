// VerseList 가 절 목록 전체를 감싸 목록 수준 액션·설정을 제공한다 (계약은 VerseListContext.ts)
import type { ReactNode } from 'react'
import { ActionsContext, SettingsContext, type VerseListActions, type VerseListSettings } from './VerseListContext'

export const VerseListProvider = ({
  actions,
  settings,
  children,
}: {
  actions: VerseListActions
  settings: VerseListSettings
  children: ReactNode
}) => (
  <ActionsContext.Provider value={actions}>
    <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
  </ActionsContext.Provider>
)
