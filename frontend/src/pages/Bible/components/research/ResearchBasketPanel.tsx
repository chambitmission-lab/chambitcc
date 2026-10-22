import { useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createNote } from '../../../../api/pastor'
import { invalidateNoteQueries } from '../../../Pastor/components/sermonNoteUtils'
import { showToast } from '../../../../utils/toast'
import { confirmDialog } from '../../../../utils/confirmDialog'
import {
  basketPassage,
  basketToText,
  clearBasket,
  getBasket,
  moveInBasket,
  removeFromBasket,
  subscribeBasket,
} from '../../data/researchBasket'
import './research.css'

/** 메모장에서 바구니로 만든 메모를 알아볼 수 있게 붙이는 표시 */
const NOTE_SOURCE = '성경 읽기 · 말씀 바구니'
/** 설교 메모 한 장의 최대 길이 — 서버 NoteCreate.body(max_length=4000)와 같게 */
const NOTE_BODY_MAX = 4000

/**
 * 연구 모드 오른쪽 "말씀 바구니" 패널 (PC 전용, 목회자).
 * 담은 절을 순서대로 모아 두었다가 설교 메모장에 메모 한 장으로 저장한다.
 * 개요에 넣는 일은 기존 개요 보드의 메모 붙이기를 그대로 쓴다.
 */
const ResearchBasketPanel = () => {
  const basket = useSyncExternalStore(subscribeBasket, getBasket)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const passage = basketPassage(basket)
  const tooLong = basketToText(basket).length > NOTE_BODY_MAX

  const save = useMutation({
    mutationFn: () =>
      createNote({ kind: 'quote', body: basketToText(basket), passage, source: NOTE_SOURCE, tags: ['말씀 바구니'] }),
    onSuccess: () => {
      invalidateNoteQueries(qc)
      showToast('설교 메모장에 저장했어요. 개요 보드에서 칸에 붙일 수 있어요', 'success')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(basketToText(basket))
      showToast('바구니 말씀을 복사했어요', 'success')
    } catch {
      showToast('복사하지 못했어요', 'error')
    }
  }

  const clear = async () => {
    if (
      !(await confirmDialog({
        title: '바구니 비우기',
        message: `담아 둔 말씀 ${basket.length}개를 모두 뺄까요?`,
        description: '저장한 설교 메모는 그대로 남아요.',
        confirmText: '비우기',
        icon: 'delete_outline',
      }))
    )
      return
    clearBasket()
  }

  return (
    <aside className="rsb" aria-label="말씀 바구니">
      <div className="rsb-head">
        <h2 className="rsb-title">
          말씀 바구니 <span>{basket.length}</span>
        </h2>
        {basket.length > 0 && (
          <button type="button" className="rsb-link" onClick={clear}>
            비우기
          </button>
        )}
      </div>

      <div className="rsb-body">
        {basket.length === 0 ? (
          <p className="rsb-empty">
            왼쪽 절 번호 옆 <b>+</b> 를 누르면 여기에 모여요.
            <br />
            다른 장·다른 책으로 옮겨 가도 바구니는 그대로예요.
          </p>
        ) : (
          <ol className="rsb-list">
            {basket.map((v, i) => (
              <li key={v.key} className="rsb-item">
                <div className="rsb-item__main">
                  <span className="rsb-item__ref">{v.ref}</span>
                  <span className="rsb-item__text">{v.text}</span>
                </div>
                <div className="rsb-item__acts">
                  <button
                    type="button"
                    aria-label="위로"
                    title="위로"
                    disabled={i === 0}
                    onClick={() => moveInBasket(v.key, -1)}
                  >
                    <span className="material-icons-round" aria-hidden>arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    aria-label="아래로"
                    title="아래로"
                    disabled={i === basket.length - 1}
                    onClick={() => moveInBasket(v.key, 1)}
                  >
                    <span className="material-icons-round" aria-hidden>arrow_downward</span>
                  </button>
                  <button type="button" aria-label="빼기" title="빼기" onClick={() => removeFromBasket(v.key)}>
                    <span className="material-icons-round" aria-hidden>close</span>
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rsb-foot">
        {passage && <p className="rsb-passage">메모 본문 칸: {passage}</p>}
        {tooLong && <p className="rsb-passage rsb-passage--warn">메모 한 장(4,000자)을 넘어요. 몇 절을 빼고 나눠 저장해 주세요.</p>}
        <div className="rsb-actions">
          <button
            type="button"
            className="rsb-btn rsb-btn--primary"
            disabled={basket.length === 0 || tooLong || save.isPending}
            onClick={() => save.mutate()}
          >
            <span className="material-icons-round" aria-hidden>edit_note</span>
            {save.isPending ? '저장 중…' : '설교 메모로 저장'}
          </button>
          <button type="button" className="rsb-btn" disabled={basket.length === 0} onClick={copy}>
            <span className="material-icons-round" aria-hidden>content_copy</span>
            복사
          </button>
        </div>
        <div className="rsb-actions">
          <button type="button" className="rsb-btn rsb-btn--ghost" onClick={() => navigate('/pastor/sermon/notes')}>
            설교 메모장
          </button>
          <button type="button" className="rsb-btn rsb-btn--ghost" onClick={() => navigate('/pastor/sermon/outlines')}>
            설교 개요 보드
          </button>
        </div>
      </div>
    </aside>
  )
}

export default ResearchBasketPanel
