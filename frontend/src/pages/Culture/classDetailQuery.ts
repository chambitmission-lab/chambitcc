// 강좌 한 건(상세 전체) 조회 설정 — 상세 시트와 카드 미리 받기가 같은 키·주기를 쓴다.
// 공개 목록은 카드에 쓰는 칸만 싣고, 수업 계획표·자유 꼭지·강사 소개는 여기서 받는다.
import { getCultureClass } from '../../api/culture'
import { cultureKeys } from '../../hooks/queryKeys'

export const classDetailQuery = (id: number) => ({
  queryKey: cultureKeys.classDetail(id),
  queryFn: () => getCultureClass(id),
  staleTime: 1000 * 60,
  retry: false,
})
