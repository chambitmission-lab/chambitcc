/**
 * /dev/bulletin-desk — 디지털 주보 PC 편집기 미리 보기.
 *
 * 관리자 로그인 없이 편집기 배치·붙여넣기·미리보기를 확인하려고 기본 주보로 바로 띄운다.
 * 주의: '저장'은 진짜 PUT 이다(로컬 백엔드 .env 가 운영 DB) — 여기선 누르지 말 것.
 */
import { useState } from 'react'
import BulletinDeskEditor from '../News/components/BulletinDeskEditor'
import { DEFAULT_BULLETIN } from '../../hooks/useDigitalBulletin'

const BulletinDeskPreview = () => {
  const [open, setOpen] = useState(true)
  return (
    <div className="p-8">
      <button type="button" className="h-10 px-4 rounded-xl bg-brand text-white font-bold" onClick={() => setOpen(true)}>
        편집기 열기
      </button>
      {open && <BulletinDeskEditor initial={DEFAULT_BULLETIN} onClose={() => setOpen(false)} />}
    </div>
  )
}

export default BulletinDeskPreview
