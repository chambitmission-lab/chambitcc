/**
 * /dev/bulletin-desk — 디지털 주보 PC 편집기 미리 보기.
 *
 * 관리자 로그인 없이 편집기 배치·붙여넣기·미리보기를 확인하려고 기본 주보로 바로 띄운다.
 * 주의: '저장'은 진짜 PUT 이다(로컬 백엔드 .env 가 운영 DB) — 여기선 누르지 말 것.
 */
import { useState } from 'react'
import BulletinDeskEditor from '../News/components/BulletinDeskEditor'
import { DEFAULT_BULLETIN } from '../../hooks/useDigitalBulletin'
import { newExtraBlock } from '../News/components/bulletinExtras'
import type { BulletinData } from '../../types/digitalBulletin'

// 종이 주보 하단 요약을 옮긴 '추가 안내' 예시 — 세 종류(목록·표·안내 글)가 한 번에 보이게
const SAMPLE: BulletinData = {
  ...DEFAULT_BULLETIN,
  extras: [
    newExtraBlock('list', {
      title: '정기당회 결정사항(9월 20일)',
      items: [
        'ICRC 준비소위원회로부터 방문행사 세부일정 계획과 예산안에 대해 보고를 받다.',
        '주차장 확보 문제로 부천시 주차장 서류에 순행 중이며 약 1개월간 시범운행 후 구체적으로 시행하기로 하다.',
        '가을 정기노회(10/12) 총대로 송성규, 정승호, 한동석 장로를 파송하기로 하다.',
      ],
    }),
    newExtraBlock('table', {
      title: '다음 주 예배 기도 / 주방 봉사 선교회',
      columns: ['주일 아침예배', '주일 밤예배', '주일 열린예배', '수요예배', '주방봉사'],
      rows: [['원상운 집사', '윤영관 장로', '황재린 자매', '이정의 권사', '8여, 9남, 10남']],
    }),
    newExtraBlock('note', {
      title: '헌금 계좌 안내',
      content: '주정 / 농협 301-0270-5923-91\n감사 / 농협 301-0252-3538-91\n십일조 / 농협 301-0252-3534-41',
    }),
  ],
}

const BulletinDeskPreview = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="p-8">
      <button type="button" className="h-10 px-4 rounded-xl bg-brand text-white font-bold" onClick={() => setOpen(true)}>
        편집기 열기
      </button>
      {open && <BulletinDeskEditor initial={SAMPLE} onClose={() => setOpen(false)} />}
    </div>
  )
}

export default BulletinDeskPreview
