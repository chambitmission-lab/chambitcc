import type { ChurchSite } from '../../../../hooks/useChurchSite'

/* 일정 장소 문구 → 지도·주소.
 * 주보에서 가져온 일정은 장소가 "3층 본당", "교육관", "참빛교회"처럼 교회 안 자리로만 적혀 있다.
 * 이 문구를 카카오맵 검색에 그대로 넘기면 다른 지역의 엉뚱한 곳이 나오므로,
 * 교회 안 자리로 보이면 우리 교회 좌표·주소로 보낸다. 바깥 장소(캠퍼스·수양관·다른 교회·
 * 도로명 주소 등)는 전처럼 문구 검색으로 둔다. */

/** 교회 건물 안을 가리키는 낱말 — 층·호수 포함 */
const CHURCH_ROOM_RE =
  /(본당|예배당|예배실|교육관|친교실|식당|당회실|기도실|로비|카페|새가족실|세미나실|강당|비전홀|사무실|목양실|주차장|옥상|지하|[0-9０-９]+\s*층|[0-9０-９]+\s*호|영아부|유아부|유치부|유년부|초등부|중등부|고등부|중고등부|청년부|장년부|교회)/

/** 바깥 장소 흔적 — 다른 교회 이름, 행정구역, 도로명+번지, 외부 시설 */
const EXTERNAL_RE =
  /([가-힣A-Za-z]+\s*교회|특별시|광역시|[가-힣]{1,5}(시|군|구)\s|[가-힣]{2,}(로|길)\s*[0-9]|수양관|기도원|캠퍼스|공원|센터|호텔|병원|학교|묘원|추모|납골|경기도|강원도|충청|전라|경상|제주)/

const CHURCH_NAME_RE = /참\s*빛\s*교회|참빛/g

/** 장소 문구가 우리 교회 안을 가리키는지 */
export const isChurchSiteLocation = (location: string): boolean => {
  const text = location.trim()
  if (!text) return false
  if (/참\s*빛/.test(text)) return true
  if (!CHURCH_ROOM_RE.test(text)) return false
  return !EXTERNAL_RE.test(text.replace(CHURCH_NAME_RE, ''))
}

export interface ResolvedEventPlace {
  atChurch: boolean
  /** 카카오맵 링크 — 교회 안이면 좌표 핀, 아니면 문구 검색 */
  mapUrl: string
  /** 장소명 아래 작은 줄 — 교회 안이면 도로명 주소 */
  addressLine: string | null
  /** 주소 복사·캘린더 LOCATION — 교회 안이면 "(우편번호) 주소 (…) 3층 본당" */
  fullAddress: string
}

export const buildMapSearchUrl = (location: string): string =>
  `https://map.kakao.com/link/search/${encodeURIComponent(location)}`

/** 좌표가 있으면 핀 링크(검색 결과 화면이 아니라 교회가 중심에 온다), 없으면 교회 이름 검색 */
export const buildChurchMapUrl = (site: ChurchSite): string =>
  site.coords
    ? `https://map.kakao.com/link/map/${encodeURIComponent(site.name)},${site.coords.lat},${site.coords.lng}`
    : buildMapSearchUrl(site.mapQuery || site.name)

export const resolveEventPlace = (location: string, site: ChurchSite): ResolvedEventPlace => {
  const text = location.trim()
  if (!isChurchSiteLocation(text) || !site.address) {
    return { atChurch: false, mapUrl: buildMapSearchUrl(text), addressLine: null, fullAddress: text }
  }
  const postal = site.postcode ? `(${site.postcode}) ` : ''
  // "참빛교회"만 적혀 있으면 주소에 이미 교회 이름이 있으니 자리 문구는 덧붙이지 않는다
  const room = text.replace(CHURCH_NAME_RE, '').replace(/\s+/g, ' ').trim()
  return {
    atChurch: true,
    mapUrl: buildChurchMapUrl(site),
    addressLine: site.address.replace(/\s*[(（][^()（）]*[)）]\s*$/, ''),
    fullAddress: room ? `${postal}${site.address} ${room}` : `${postal}${site.address}`,
  }
}
