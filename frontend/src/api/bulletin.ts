// 주보 API
import type { Bulletin, BulletinUpdatePayload } from '../types/bulletin'
import { request, requestRaw, type UntypedJson } from './utils/request'

/**
 * 주보 목록 조회
 *
 * fresh=true 는 관리자 화면용 — 목록 응답에 60초 공개 캐시가 붙어 있어서,
 * 방금 수정/삭제한 결과가 그대로 안 보이면 "수정이 안 된다"로 읽힌다.
 */
export const getBulletins = async (skip = 0, limit = 10, fresh = false): Promise<Bulletin[]> => {
  const data = await request<UntypedJson>(`/bulletins?skip=${skip}&limit=${limit}`, {
    cache: fresh ? 'no-store' : undefined,
    errorMessage: '주보 목록을 불러오는데 실패했습니다',
  })
  
  // 응답이 배열 형식
  if (Array.isArray(data)) {
    return data
  }
  
  return []
}

/** 판 연도(3월~이듬해 2월) 한 해의 공개 주보 전체 — 최신순. 지난 주보 연도 보기용 */
export const getBulletinsByYear = (year: number): Promise<Bulletin[]> =>
  request<Bulletin[]>(`/bulletins?year=${year}`, {
    errorMessage: '주보 목록을 불러오는데 실패했습니다',
  }).then(data => (Array.isArray(data) ? data : []))

/** 공개 주보가 있는 판 연도 목록(최신 먼저) */
export const getBulletinYears = (): Promise<{ year: number; count: number }[]> =>
  request<{ year: number; count: number }[]>('/bulletins/years', {
    errorMessage: '주보 연도를 불러오는데 실패했습니다',
  }).then(data => (Array.isArray(data) ? data : []))

/**
 * 주보 상세 조회
 *
 * countView=false 는 관리자 수정 화면처럼 페이지 목록만 필요한 조회 —
 * 조회수를 올리지 않는다.
 */
export const getBulletinDetail = async (id: number, countView = true): Promise<Bulletin> => {
  return request<Bulletin>(`/bulletins/${id}${countView ? '' : '?count_view=false'}`, {
    cache: countView ? undefined : 'no-store',
    errorMessage: '주보를 불러오는데 실패했습니다',
  })
}

/** 카톡 피드 카드 재료 — /w/{id} 미리보기와 같은 제목·설명·카드 그림 (백엔드 bulletin_share.share_card) */
export interface BulletinShareCard {
  title: string
  description: string
  image_url: string
  image_width: number
  image_height: number
  /** 카드를 누르면 열리는 공유 주소 */
  url: string
}

/** 비공개·없음·카드를 못 그릴 때는 404 — 부른 쪽은 스크랩 경로로 돌아간다 */
export const getBulletinShareCard = (id: number): Promise<BulletinShareCard> =>
  request<BulletinShareCard>(`/bulletins/${id}/share`, { errorMessage: '주보 카드를 불러오지 못했어요' })

/**
 * 주보 생성 (관리자 전용) - multipart/form-data 사용
 */
export const createBulletin = async (
  title: string,
  bulletinDate: string,
  description: string,
  files: File[]
): Promise<Bulletin> => {
  
  const formData = new FormData()
  formData.append('title', title)
  formData.append('bulletin_date', bulletinDate)
  if (description) {
    formData.append('description', description)
  }
  
  // 파일들 추가
  files.forEach((file) => {
    formData.append('files', file)
  })
  
  return request<Bulletin>('/bulletins', {
    method: 'POST',
    body: formData,
    errorMessage: '주보 생성에 실패했습니다',
  })
}

/**
 * 주보 정보 수정 (관리자 전용) — 제목·날짜·설명
 *
 * 페이지 이미지는 별도 엔드포인트(추가/삭제/순서)로 다룬다.
 */
export const updateBulletin = async (
  id: number,
  payload: BulletinUpdatePayload
): Promise<Bulletin> => {
  return request<Bulletin>(`/bulletins/${id}`, {
    method: 'PUT',
    json: payload,
    errorMessage: '주보 수정에 실패했습니다',
  })
}

/**
 * 주보 페이지 추가 (관리자 전용)
 * pageNumber 를 생략하면 마지막 페이지 뒤에 붙는다. 새 페이지 id 를 돌려준다.
 */
export const addBulletinPage = async (
  bulletinId: number,
  file: File,
  pageNumber?: number
): Promise<number> => {
  const formData = new FormData()
  formData.append('file', file)
  if (pageNumber !== undefined) {
    formData.append('page_number', String(pageNumber))
  }

  const data = await request<UntypedJson>(`/bulletins/${bulletinId}/pages`, {
    method: 'POST',
    body: formData,
    errorMessage: '페이지 추가에 실패했습니다',
  })
  return data.page_id as number
}

/**
 * 주보 페이지 삭제 (관리자 전용)
 */
export const deleteBulletinPage = async (pageId: number): Promise<void> => {
  await requestRaw(`/bulletins/pages/${pageId}`, { method: 'DELETE', errorMessage: '페이지 삭제에 실패했습니다' })
}

/**
 * 주보 페이지 순서 변경 (관리자 전용)
 * 최종 순서의 page id 를 전부 보내야 한다.
 */
export const reorderBulletinPages = async (
  bulletinId: number,
  pageIds: number[]
): Promise<void> => {
  await requestRaw(`/bulletins/${bulletinId}/pages/order`, {
    method: 'PUT',
    json: { page_ids: pageIds },
    errorMessage: '페이지 순서 변경에 실패했습니다',
  })
}

/**
 * 주보 삭제 (관리자 전용)
 */
export const deleteBulletin = async (id: number): Promise<void> => {
  await requestRaw(`/bulletins/${id}`, { method: 'DELETE', errorMessage: '주보 삭제에 실패했습니다' })
}

export interface BulletinNewsImportResult {
  found: boolean
  events: number
  skipped_duplicates: number
}

export interface BulletinDigitalImportResult {
  found: boolean
  announcements: number
  extras: number
  schedule: number
}

/**
 * AI 읽기 요청(서버 대기열) — '다시 만들기'는 1~2분을 응답에서 기다리지 않고 job 으로 돌아온다.
 * queued → running → done(result) / failed(error). 서버가 재시작되면 목록이 비어 404.
 */
export interface BulletinImportJob {
  job_id: string
  state: 'queued' | 'running' | 'done' | 'failed'
  bulletin_id: number | null
  readers: string[]
  force: boolean
  result: { news?: BulletinNewsImportResult; digital?: BulletinDigitalImportResult; column?: { column_id: number } }
  error: string | null
}

/**
 * 주보 '소식' 쪽 → 일정 초안 다시 가져오기 (관리자 전용). 대기열에 넣고 바로 job 을 돌려준다.
 * 같은 날·같은 제목 일정은 서버가 건너뛰어 여러 번 눌러도 쌓이지 않는다.
 */
export const importBulletinNews = (id: number): Promise<BulletinImportJob> =>
  request<BulletinImportJob>(`/bulletins/${id}/import-news`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '주보 소식 읽기를 시작하지 못했어요',
  })

/**
 * 주보 전체 → 디지털 주보 초안 다시 만들기 (관리자 전용). 대기열에 넣고 바로 job 을 돌려준다.
 * 초안은 공개되지 않고 /news?tab=bulletin 의 관리자 배너에서 검토 후 적용한다. 있던 초안은 덮어쓴다.
 */
export const importBulletinDigital = (id: number): Promise<BulletinImportJob> =>
  request<BulletinImportJob>(`/bulletins/${id}/import-digital`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '주보 읽기를 시작하지 못했어요',
  })

/** 주보 하나의 AI 읽기(칼럼·소식·디지털) 상태 — 관리자 목록의 "눌러야 하나" 표시용 */
/** idle = 자동 회수 범위(앞뒤 14일) 밖의 옛 주보 — 저절로 읽히지 않고 '다시 만들기'로만 */
export type BulletinAiReaderState = 'done' | 'queued' | 'running' | 'pending' | 'gave_up' | 'idle'
export interface BulletinAiReaderStatus {
  state: BulletinAiReaderState
  done_at: string | null
  attempts: number
}
export type BulletinAiStatus = Record<'column' | 'news' | 'digital', BulletinAiReaderStatus>

/**
 * 주보별 AI 읽기 상태 (관리자 전용). 자동·수동 등록 모두 서버가 알아서 읽으므로
 * 관리자가 '다시 만들기'를 눌러야 하는 건 gave_up(3번 실패)뿐이다.
 */
export const getBulletinAiStatus = (ids: number[]): Promise<Record<string, BulletinAiStatus>> =>
  ids.length === 0
    ? Promise.resolve({})
    : request<Record<string, BulletinAiStatus>>(`/bulletins/ai-status?ids=${ids.join(',')}`, {
        auth: 'required',
        cache: 'no-store',
        errorMessage: '주보 읽기 상태를 확인하지 못했어요',
      })

export const getBulletinImportJob = (jobId: string): Promise<BulletinImportJob> =>
  request<BulletinImportJob>(`/bulletins/import-jobs/${jobId}`, {
    auth: 'required',
    cache: 'no-store',
    errorMessage: '읽기 진행 상태를 확인하지 못했어요',
  })

const IMPORT_POLL_MS = 5000
const IMPORT_WAIT_MS = 5 * 60 * 1000

/**
 * job 이 끝날 때까지 몇 초마다 묻는다(최대 5분 — 읽기 하나는 2분 상한, 앞에 줄 선 것이 있을 수 있다).
 * failed 면 서버가 남긴 error 로 던지고, 시간을 넘기면 안내 문구로 던진다.
 */
export const waitForBulletinImportJob = async (
  jobId: string,
  onTick?: (job: BulletinImportJob) => void,
): Promise<BulletinImportJob> => {
  const deadline = Date.now() + IMPORT_WAIT_MS
  for (;;) {
    const job = await getBulletinImportJob(jobId)
    onTick?.(job)
    if (job.state === 'done') return job
    if (job.state === 'failed') throw new Error(job.error || '주보를 읽지 못했어요. 잠시 후 다시 시도해 주세요.')
    if (Date.now() > deadline) throw new Error('읽기가 아직 끝나지 않았어요. 끝나면 관리자 알림으로 알려드려요.')
    await new Promise(resolve => setTimeout(resolve, IMPORT_POLL_MS))
  }
}
