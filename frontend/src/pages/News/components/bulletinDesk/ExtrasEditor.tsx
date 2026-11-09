import type { ExtraBlock, ExtraBlockKind } from '../../../../types/digitalBulletin'
import { EXTRA_KIND_LABEL, EXTRA_PRESETS, newExtraBlock, parseListItems } from '../bulletinExtras'
import { DeskIcon as Icon } from './DeskIcon'
import { ICON } from './deskIcons'
import { move } from './deskParsers'
import { chipCls, inputCls, textareaCls } from './deskStyles'
import { ExtraTableEditor } from './ExtraTableEditor'
import { RowActions } from './RowActions'

// ── 추가 안내 블록 편집 ──────────────────────────
const KINDS: ExtraBlockKind[] = ['list', 'table', 'note']

/** 종류만 바꿀 때 써 둔 글을 버리지 않는다 — 목록↔안내 글은 줄 단위로, 표는 첫 열로 옮긴다 */
const convertKind = (b: ExtraBlock, kind: ExtraBlockKind): ExtraBlock => {
  const lines =
    b.kind === 'list' ? b.items : b.kind === 'note' ? b.content.split('\n') : b.rows.map(r => r.filter(Boolean).join(' / '))
  const text = lines.filter(l => l.trim())
  if (kind === 'list') return { ...b, kind, items: text.length ? text : [''] }
  if (kind === 'note') return { ...b, kind, content: text.join('\n') }
  return { ...b, kind, columns: b.columns.length ? b.columns : ['내용'], rows: b.rows.length ? b.rows : (text.length ? text : ['']).map(l => [l]) }
}

export const ExtrasEditor = ({ blocks, onChange }: { blocks: ExtraBlock[]; onChange: (blocks: ExtraBlock[]) => void }) => {
  const setBlock = (i: number, next: ExtraBlock) => onChange(blocks.map((b, j) => (j === i ? next : b)))
  return (
    <div>
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <div key={i} className="group rounded-xl border border-gray-200/70 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02] p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="shrink-0 inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-white/[0.05]">
                {KINDS.map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => k !== block.kind && setBlock(i, convertKind(block, k))}
                    className={[
                      'h-8 px-2.5 rounded-md text-[12.5px] font-bold transition-colors',
                      block.kind === k
                        ? 'bg-white dark:bg-white/[0.12] text-brand shadow-sm'
                        : 'text-gray-500 dark:text-white/55 hover:text-brand',
                    ].join(' ')}
                  >
                    {EXTRA_KIND_LABEL[k]}
                  </button>
                ))}
              </div>
              <input
                className={inputCls + ' font-semibold'}
                value={block.title}
                placeholder="제목 (예: 정기당회 결정사항)"
                onChange={e => setBlock(i, { ...block, title: e.target.value })}
              />
              <div className="shrink-0">
                <RowActions
                  index={i}
                  count={blocks.length}
                  onMove={to => onChange(move(blocks, i, to))}
                  onDuplicate={() => onChange([...blocks.slice(0, i + 1), structuredClone(block), ...blocks.slice(i + 1)])}
                  onRemove={() => onChange(blocks.filter((_, j) => j !== i))}
                />
              </div>
            </div>

            {block.kind === 'list' && <ListItemsInput items={block.items} onChange={items => setBlock(i, { ...block, items })} />}
            {block.kind === 'table' && <ExtraTableEditor tableId={`extra${i}`} block={block} onChange={next => setBlock(i, next)} />}
            {block.kind === 'note' && (
              <textarea
                className={textareaCls}
                rows={3}
                value={block.content}
                placeholder={'예) 십일조 / 농협 301-0270-5923-91\n감사 / 농협 301-0252-3538-91'}
                onChange={e => setBlock(i, { ...block, content: e.target.value })}
              />
            )}
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="px-2 py-4 text-center text-[13.5px] text-gray-400 dark:text-white/40">
            아직 추가 안내가 없어요. 아래 틀에서 골라 시작해 보세요.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {KINDS.map(k => (
          <button key={k} type="button" className={chipCls} onClick={() => onChange([...blocks, newExtraBlock(k)])}>
            <Icon d={ICON.plus} size={14} />
            {EXTRA_KIND_LABEL[k]}
          </button>
        ))}
        <span className="mx-1 w-px h-5 bg-gray-200 dark:bg-white/[0.1]" />
        <span className="text-[12.5px] text-gray-400 dark:text-white/40">자주 쓰는 틀</span>
        {EXTRA_PRESETS.map(p => (
          <button key={p.label} type="button" className={chipCls} onClick={() => onChange([...blocks, p.make()])}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** 한 줄 = 한 항목. 원고를 붙여넣으면 "1." "①" "-" 머리표는 떼고 줄바꿈으로 끊긴 문장은 이어 붙인다 */
const ListItemsInput = ({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) => {
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text.includes('\n')) return
    e.preventDefault()
    const el = e.currentTarget
    const before = el.value.slice(0, el.selectionStart)
    const after = el.value.slice(el.selectionEnd)
    onChange((before + parseListItems(text).join('\n') + after).split('\n'))
  }
  return (
    <div>
      <textarea
        className={textareaCls + ' min-h-[110px]'}
        rows={4}
        value={items.join('\n')}
        placeholder={'한 줄에 한 항목씩 적어요. 번호는 자동으로 붙어요.\n예) ICRC 준비소위원회로부터 방문행사 계획과 예산안에 대해 보고를 받다.'}
        onChange={e => onChange(e.target.value.split('\n'))}
        onPaste={onPaste}
      />
      <p className="mt-1 text-[12px] text-gray-400 dark:text-white/40">
        {items.filter(s => s.trim()).length}개 항목 · 원고를 붙여넣으면 앞 번호는 떼고 정리돼요
      </p>
    </div>
  )
}
