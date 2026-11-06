// /garden 히어로 왼쪽 "칭호 퀘스트" 카드 — 듀오링고 일일 퀘스트 카드를 벤치마킹(2026-11-06 4차 시안 2).
// 배너 그림이 오른쪽에만 있어 비어 보이던 왼쪽을, 곧 받을 칭호를 할 일 문장 + 굵은 진행 막대로 채운다.
// 데이터는 아래 TitleCollection 과 같은 GET /titles 캐시를 공유한다(요청 추가 없음).
import { useMemo, useState } from 'react'
import type { TitleStatus } from '../../api/titles'
import { useTitles, useEquipTitle } from '../../hooks/useTitles'
import { useLanguage } from '../../contexts/LanguageContext'
import { TitleMedal } from '../../components/titles/TitleMedal'
import { TitleDetailSheet } from '../../components/titles/TitleDetailSheet'
import { localizeTitle } from '../../components/titles/titleI18n'
import { parseApiDate, isValidDate } from '../../utils/date'

const MAX_ROWS = 3
/** 막 받은 칭호를 '완료' 줄로 보여 주는 기간 */
const RECENT_DONE_MS = 7 * 24 * 60 * 60 * 1000

const pctOf = (title: TitleStatus): number =>
  title.progress && title.progress.target > 0
    ? Math.min(100, Math.round((title.progress.current / title.progress.target) * 100))
    : 0

/** 획득 조건 문장 → 할 일 문장. "…을(를) 완성하면 획득" → "… 완성", "성경을 읽으면 획득" → "성경 읽기" */
const toQuest = (hint: string): string =>
  hint
    .replace(/\s*(을\(를\)|을|를) 완성하면 획득$/, ' 완성')
    .replace(/을 읽으면 획득$/, ' 읽기')
    .replace(/\s*획득$/, '')
    .trim()

interface QuestRow {
  title: TitleStatus
  done: boolean
}

const pickQuests = (titles: TitleStatus[]): QuestRow[] => {
  // 진행 중: 숨김 아닌 미획득. 진행률이 있는 칭호를 높은 순으로 먼저, 진행률 없는 칭호는 뒤로.
  const open = titles
    .filter((it) => !it.earned && !it.hidden)
    .sort((a, b) => {
      const ap = a.progress ? 1 : 0
      const bp = b.progress ? 1 : 0
      if (ap !== bp) return bp - ap
      return pctOf(b) - pctOf(a)
    })

  // 최근 7일 안에 받은 칭호 하나는 금빛 '완료' 줄로 — 해냈다는 기분을 카드 안에 남긴다
  const now = Date.now()
  const recent = titles
    .filter((it) => it.earned && it.earned_at)
    .map((it) => ({ it, at: parseApiDate(it.earned_at as string) }))
    .filter(({ at }) => isValidDate(at) && now - at.getTime() < RECENT_DONE_MS)
    .sort((a, b) => b.at.getTime() - a.at.getTime())[0]?.it

  const rows: QuestRow[] = open.slice(0, recent ? MAX_ROWS - 1 : MAX_ROWS).map((title) => ({ title, done: false }))
  if (recent) rows.push({ title: recent, done: true })
  return rows
}

export const GardenHeroQuests: React.FC = () => {
  const { data, isLoading } = useTitles()
  const equipMut = useEquipTitle()
  const { t, language } = useLanguage()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const rows = useMemo(() => pickQuests(data?.titles ?? []), [data])
  const selected = selectedKey ? data?.titles.find((it) => it.key === selectedKey) ?? null : null

  // 로딩 — 같은 틀(줄 3개)을 먼저 그려 데이터가 와도 히어로 높이가 흔들리지 않게 한다
  if (isLoading) {
    return (
      <div className="garden-quest-card" aria-busy="true">
        <div className="garden-quest-head">
          <span className="garden-quest-skel garden-quest-skel--head" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="garden-quest-row" aria-hidden="true">
            <span className="garden-quest-skel garden-quest-skel--medal" />
            <div className="garden-quest-body">
              <span className="garden-quest-skel garden-quest-skel--text" />
              <span className="garden-quest-bar" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  const { summary } = data
  const rate = summary.total > 0 ? Math.round((summary.earned / summary.total) * 100) : 0

  return (
    <>
      <div className="garden-quest-card">
        <div className="garden-quest-head">
          <b>{t('gardenQuestHeader')}</b>
          <span>
            {t('titleStatRate')} {rate}%
          </span>
        </div>

        {rows.length === 0 ? (
          <p className="garden-quest-empty">{t('gardenQuestAllDone')}</p>
        ) : (
          rows.map(({ title, done }) => {
            const text = localizeTitle(title, language)
            const pct = done ? 100 : pctOf(title)
            const quest = language === 'en' ? text.hint : toQuest(text.hint)
            return (
              <button
                type="button"
                key={title.key}
                className={`garden-quest-row${done ? ' is-done' : ''}`}
                onClick={() => setSelectedKey(title.key)}
                aria-label={`${quest} — ${text.name}`}
              >
                <TitleMedal title={title} size="sm" />
                <div className="garden-quest-body">
                  <div className="garden-quest-line">
                    <span className="garden-quest-name">{quest}</span>
                    <em>
                      {done
                        ? t('gardenQuestDone')
                        : title.progress
                          ? `${title.progress.current}/${title.progress.target}`
                          : ''}
                    </em>
                  </div>
                  <span className="garden-quest-bar">
                    <i style={{ width: `${pct}%` }} />
                  </span>
                  <span className="garden-quest-reward">{text.name}</span>
                </div>
                {done && (
                  <span className="garden-quest-check" aria-hidden>
                    <span className="material-icons-round">check</span>
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>

      {selected && (
        <TitleDetailSheet
          title={selected}
          onToggleEquip={(it) => {
            if (!equipMut.isPending) equipMut.mutate(it.equipped ? null : it.key)
          }}
          busy={equipMut.isPending}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </>
  )
}
