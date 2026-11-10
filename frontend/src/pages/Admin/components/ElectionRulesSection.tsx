// 당선 기준 — 평소에는 "지금 기준이 무엇인지" 한눈에 읽히는 요약만 보여 주고, 고칠 때만 펼친다.
//
// 직분마다 기준이 다를 수 있어서(장로·권사·안수집사 …) 한 번 정한 기준을 직분 이름으로 저장해 두고
// 칩 하나로 불러온다. 저장한 기준은 새 선거의 출발값일 뿐 — 선거에는 그때의 사본이 들어가므로
// 나중에 저장한 기준을 고쳐도 이미 만든 선거는 바뀌지 않는다.
// 기준의 기본값·검증은 서버(election_rules.py)에 있다. 이 화면에는 숫자를 박아 두지 않는다.
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useDeleteRulePreset, useSaveRulePreset } from '../../../hooks/useElections'
import { confirmDialog, promptDialog } from '../../../utils/confirmDialog'
import { showToast } from '../../../utils/toast'
import type {
  ElectionRulePreset,
  ElectionRules,
  ElectionSummary,
  ResultVisibility,
  RunoffRule,
} from '../../../types/election'
import {
  RUNOFF_META,
  THRESHOLD_PRESETS,
  VISIBILITY_META,
  chipBtn,
  labelCls,
  matchPreset,
  rulesKey,
  rulesSummary,
  thresholdText,
} from '../../Election/electionShared'
import { Stepper } from './SeatEventComposer'

const QUORUM_PRESETS: { key: string; label: string; num: number; den: number }[] = [
  { key: 'none', label: '확인 안 함', num: 0, den: 2 },
  { key: 'half', label: '재적 1/2 이상', num: 1, den: 2 },
  { key: 'two-thirds', label: '재적 2/3 이상', num: 2, den: 3 },
]

/** 작은 숫자 입력 — 비율의 분자·분모처럼 Stepper 로 누르기엔 범위가 넓은 값 */
const NumberBox = ({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) => (
  <input
    value={value}
    inputMode="numeric"
    onChange={(e) => {
      const n = Number(e.target.value.replace(/\D/g, ''))
      onChange(Math.max(min, Math.min(max, n || min)))
    }}
    className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-center text-[14px] font-bold text-ink-strong tabular-nums focus:outline-none focus:border-brand"
  />
)

const linkBtn = 'text-[12.5px] font-bold text-brand underline underline-offset-2 disabled:opacity-50'

interface Props {
  header: ReactNode
  rules: ElectionRules
  /** 사람이 직접 고르거나 고친 기준 */
  onChange: (next: ElectionRules) => void
  presets: ElectionRulePreset[]
  /** 선거 이름을 보고 자동으로 불러온 기준의 이름 (안내 한 줄에만 쓴다) */
  autoNote: string | null
  seats: number
  /** 예시 계산의 분모 — 재적 기준이면 선거인 수, 아니면 100명 */
  exampleBase: number
  pastElections: ElectionSummary[]
  hasOpenRound: boolean
}

const ElectionRulesSection = ({ header, rules, onChange, presets, autoNote, seats, exampleBase, pastElections, hasOpenRound }: Props) => {
  const [open, setOpen] = useState(false)
  // 프리셋과 값이 같아도 '직접 입력' 칸을 열어 둘 수 있게
  const [customThreshold, setCustomThreshold] = useState(false)

  const patch = (p: Partial<ElectionRules>) => onChange({ ...rules, ...p })
  const apply = (next: ElectionRules) => {
    setCustomThreshold(false)
    onChange({ ...next })
  }

  const key = rulesKey(rules)
  const active = presets.find((p) => rulesKey(p.rules) === key) ?? null
  const presetKey = customThreshold ? 'custom' : matchPreset(rules)

  const savePreset = useSaveRulePreset({
    onSuccess: (saved) => showToast(`'${saved.name}' 기준으로 저장했어요. 다음 선거부터 한 번에 불러올 수 있어요`, 'success'),
    onError: (e) => showToast(e.message, 'error'),
  })
  const removePreset = useDeleteRulePreset({
    onSuccess: () => showToast('저장한 기준을 지웠어요', 'success'),
    onError: (e) => showToast(e.message, 'error'),
  })

  const askSave = async () => {
    const name = await promptDialog({
      title: '이 기준을 저장할까요?',
      message: '직분 이름으로 저장해 두면 다음 선거에서 한 번에 불러와요.',
      description: '같은 이름이 이미 있으면 지금 기준으로 바뀌어요. 이미 만든 선거는 바뀌지 않아요.',
      confirmText: '저장',
      tone: 'brand',
      input: { placeholder: '예) 장로', maxLength: 50 },
    })
    if (name) savePreset.mutate({ name, rules })
  }

  const askRemove = async (preset: ElectionRulePreset) => {
    const ok = await confirmDialog({
      title: '저장한 기준을 지울까요?',
      message: `'${preset.name}' 기준`,
      description: '이미 만든 선거의 기준은 그대로예요.',
      confirmText: '지우기',
      tone: 'danger',
    })
    if (ok) removePreset.mutate(preset.id)
  }

  const needed =
    rules.threshold_comparison === 'gt'
      ? Math.floor((exampleBase * rules.threshold_num) / rules.threshold_den) + 1
      : Math.ceil((exampleBase * rules.threshold_num) / rules.threshold_den)

  return (
    <section className="space-y-3">
      {header}

      {presets.length ? (
        <div>
          <label className={labelCls}>저장한 기준 불러오기</label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button key={p.id} type="button" onClick={() => apply(p.rules)} className={chipBtn(active?.id === p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 지금 기준 — 읽기만 해도 되는 요약 */}
      <div className="rounded-2xl bg-[var(--brand-soft)] px-3.5 py-3">
        <p className="text-[11.5px] font-bold text-brand">{active ? `'${active.name}' 기준` : '지금 기준'}</p>
        <p className="mt-0.5 text-[15.5px] font-extrabold text-ink-strong leading-snug break-keep">
          {thresholdText(rules)} 득표하면 당선
        </p>
        {exampleBase > 0 ? (
          <p className="mt-0.5 text-[12.5px] text-ink break-keep">
            {rules.threshold_basis === 'voters' ? `재적 ${exampleBase}명이면` : `${exampleBase}명이 투표하면`}{' '}
            <b className="tabular-nums">{needed}표</b>가 필요해요.
          </p>
        ) : null}
        <dl className="mt-2.5 space-y-1 border-t border-[var(--brand-soft-strong)] pt-2.5">
          {rulesSummary(rules).map((line) => (
            <div key={line.label} className="flex gap-2 text-[12.5px] leading-relaxed">
              <dt className="shrink-0 w-[76px] font-bold text-ink-muted">{line.label}</dt>
              <dd className="min-w-0 text-ink break-keep">{line.text}</dd>
            </div>
          ))}
        </dl>
        {autoNote && active?.name === autoNote ? (
          <p className="mt-2 text-[12px] font-semibold text-brand break-keep">
            선거 이름에 &lsquo;{autoNote}&rsquo;가 들어 있어 저장해 둔 기준을 불러왔어요.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-bold text-ink hover:border-brand hover:text-brand transition-colors"
        >
          {open ? '기준 고치기 접기' : '기준 고치기'}
        </button>
        {!active ? (
          <button type="button" onClick={() => void askSave()} disabled={savePreset.isPending} className={linkBtn}>
            이 기준을 이름 붙여 저장
          </button>
        ) : null}
      </div>

      {hasOpenRound ? (
        <p className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed break-keep">
          지금 투표가 진행 중이에요. 표가 한 장이라도 들어온 회차의 당선 기준은 바뀌지 않고, 고친 기준은 다음 회차부터 적용돼요. (결과 공개 범위는 바로 적용)
        </p>
      ) : null}

      {open ? (
        <div className="space-y-4 rounded-2xl border border-gray-200/70 dark:border-white/[0.06] px-3.5 py-3.5">
          {pastElections.length ? (
            <div>
              <label className={labelCls}>지난 선거 기준 가져오기</label>
              <div className="flex flex-wrap gap-1.5">
                {pastElections.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      apply(e.rules)
                      showToast(`'${e.title}'의 기준을 가져왔어요`, 'success')
                    }}
                    className={chipBtn(false)}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label className={labelCls}>득표 기준</label>
            <div className="flex flex-wrap gap-1.5">
              {THRESHOLD_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setCustomThreshold(false)
                    patch(p.rules)
                  }}
                  className={chipBtn(presetKey === p.key)}
                >
                  {p.label}
                </button>
              ))}
              <button type="button" onClick={() => setCustomThreshold(true)} className={chipBtn(presetKey === 'custom')}>
                직접 입력
              </button>
            </div>
            {presetKey === 'custom' ? (
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <NumberBox value={rules.threshold_num} min={1} max={100} onChange={(v) => patch({ threshold_num: v })} />
                <span className="text-[15px] font-bold text-ink-muted">/</span>
                <NumberBox value={rules.threshold_den} min={1} max={100} onChange={(v) => patch({ threshold_den: v })} />
                <div className="flex gap-1.5 ml-1">
                  <button type="button" onClick={() => patch({ threshold_comparison: 'gte' })} className={chipBtn(rules.threshold_comparison === 'gte')}>이상</button>
                  <button type="button" onClick={() => patch({ threshold_comparison: 'gt' })} className={chipBtn(rules.threshold_comparison === 'gt')}>초과</button>
                </div>
                <p className="w-full text-[11.5px] text-ink-muted">예) 100명 중 90표 이상 → 9 / 10 이상</p>
              </div>
            ) : null}
          </div>

          <div>
            <label className={labelCls}>무엇의 비율인가요</label>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => patch({ threshold_basis: 'ballots' })} className={chipBtn(rules.threshold_basis === 'ballots')}>투표수 (투표한 사람)</button>
              <button type="button" onClick={() => patch({ threshold_basis: 'voters' })} className={chipBtn(rules.threshold_basis === 'voters')}>재적 선거인 전체</button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink-strong">한 표에 고를 수 있는 인원</p>
              <p className="text-[11.5px] text-ink-muted break-keep">
                {rules.max_select == null ? '남은 자리 수만큼 (1차는 선출 인원, 2차는 남은 자리)' : '정한 인원까지'}
              </p>
            </div>
            {rules.max_select == null ? (
              <button type="button" onClick={() => patch({ max_select: Math.max(1, seats) })} className={chipBtn(false)}>직접 정하기</button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Stepper value={rules.max_select} min={1} max={50} onChange={(v) => patch({ max_select: v })} suffix="명" />
                <button type="button" onClick={() => patch({ max_select: null })} className="text-[12px] font-semibold text-ink-muted hover:text-brand">자동</button>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>자리가 남으면 — 다음 회차 후보</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(RUNOFF_META) as RunoffRule[]).map((k) => (
                <button key={k} type="button" onClick={() => patch({ runoff_rule: k })} className={chipBtn(rules.runoff_rule === k)}>
                  {RUNOFF_META[k].label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] text-ink-muted break-keep">
              {RUNOFF_META[rules.runoff_rule].hint}. 회차를 열 때 후보를 직접 고칠 수도 있어요.
            </p>
            {rules.runoff_rule === 'top_multiple' ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[12.5px] text-ink">남은 자리의</span>
                <Stepper value={rules.runoff_multiple} min={1} max={10} onChange={(v) => patch({ runoff_multiple: v })} suffix="배" />
              </div>
            ) : rules.runoff_rule === 'min_share' ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[12.5px] text-ink">투표수의</span>
                <NumberBox value={rules.runoff_min_num} min={0} max={100} onChange={(v) => patch({ runoff_min_num: v })} />
                <span className="text-[15px] font-bold text-ink-muted">/</span>
                <NumberBox value={rules.runoff_min_den} min={1} max={100} onChange={(v) => patch({ runoff_min_den: v })} />
                <span className="text-[12.5px] text-ink">이상</span>
              </div>
            ) : null}
          </div>

          <div>
            <label className={labelCls}>성원 (정족수)</label>
            <div className="flex flex-wrap gap-1.5">
              {QUORUM_PRESETS.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => patch({ quorum_num: q.num, quorum_den: q.den })}
                  className={chipBtn(q.num === 0 ? rules.quorum_num === 0 : rules.quorum_num === q.num && rules.quorum_den === q.den)}
                >
                  {q.label}
                </button>
              ))}
            </div>
            {rules.quorum_num > 0 && !QUORUM_PRESETS.some((q) => q.num === rules.quorum_num && q.den === rules.quorum_den) ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[12.5px] text-ink">재적의</span>
                <NumberBox value={rules.quorum_num} min={1} max={100} onChange={(v) => patch({ quorum_num: v })} />
                <span className="text-[15px] font-bold text-ink-muted">/</span>
                <NumberBox value={rules.quorum_den} min={1} max={100} onChange={(v) => patch({ quorum_den: v })} />
                <span className="text-[12.5px] text-ink">이상</span>
              </div>
            ) : null}
            <p className="mt-1.5 text-[11.5px] text-ink-muted break-keep">
              투표에 참여한 인원으로 셈해요. 미달이면 마감 전에 경고하고 결과서에 &lsquo;성원 미달&rsquo;로 남겨요(판정은 그대로).
            </p>
          </div>

          <div>
            <label className={labelCls}>기권 · 무효표</label>
            <label className="flex items-center gap-2.5 text-[13px] font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={rules.allow_abstain}
                onChange={(e) => patch({ allow_abstain: e.target.checked })}
                className="w-[18px] h-[18px] accent-[var(--brand)]"
              />
              앱에서 &lsquo;기권&rsquo; 표를 낼 수 있게 하기
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => patch({ blank_in_base: true })} className={chipBtn(rules.blank_in_base)}>
                투표수에 넣기
              </button>
              <button type="button" onClick={() => patch({ blank_in_base: false })} className={chipBtn(!rules.blank_in_base)}>
                투표수에서 빼기
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-ink-muted break-keep">
              {rules.blank_in_base
                ? '기권·무효표도 당선 기준의 분모(투표수)에 들어가요 — 기준이 더 엄격해져요.'
                : '기권·무효표를 뺀 유효표로 당선 기준을 계산해요.'}{' '}
              교회 규정에 맞춰 골라 주세요.
            </p>
          </div>

          <div>
            <label className={labelCls}>성도 화면에 결과 공개</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(VISIBILITY_META) as ResultVisibility[]).map((k) => (
                <button key={k} type="button" onClick={() => patch({ result_visibility: k })} className={chipBtn(rules.result_visibility === k)}>
                  {VISIBILITY_META[k].label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] text-ink-muted break-keep">
              {VISIBILITY_META[rules.result_visibility].hint}. 현황판에서는 진행 중 득표가 기본으로 가려져 있어요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-200/70 dark:border-white/[0.06] pt-3">
            <button type="button" onClick={() => void askSave()} disabled={savePreset.isPending} className={linkBtn}>
              {savePreset.isPending ? '저장하는 중…' : '이 기준을 이름 붙여 저장'}
            </button>
            {active ? (
              <button
                type="button"
                onClick={() => void askRemove(active)}
                disabled={removePreset.isPending}
                className="text-[12.5px] font-semibold text-ink-muted underline underline-offset-2 hover:text-red-500 disabled:opacity-50"
              >
                저장한 &lsquo;{active.name}&rsquo; 기준 지우기
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ElectionRulesSection
