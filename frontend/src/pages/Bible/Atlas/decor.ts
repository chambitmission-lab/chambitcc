import shipUrl from '../../../assets/atlas/deco/ship.webp'
import pyramidsUrl from '../../../assets/atlas/deco/pyramids.webp'
import palmsUrl from '../../../assets/atlas/deco/palms.webp'
import camelsUrl from '../../../assets/atlas/deco/camels.webp'
import tentUrl from '../../../assets/atlas/deco/tent.webp'
import cityUrl from '../../../assets/atlas/deco/city.webp'
import oliveUrl from '../../../assets/atlas/deco/olive.webp'
import shipNightUrl from '../../../assets/atlas/deco/ship-night.webp'
import pyramidsNightUrl from '../../../assets/atlas/deco/pyramids-night.webp'
import palmsNightUrl from '../../../assets/atlas/deco/palms-night.webp'
import camelsNightUrl from '../../../assets/atlas/deco/camels-night.webp'
import tentNightUrl from '../../../assets/atlas/deco/tent-night.webp'
import cityNightUrl from '../../../assets/atlas/deco/city-night.webp'
import oliveNightUrl from '../../../assets/atlas/deco/olive-night.webp'

/**
 * 지도 여백에 그려 넣는 그림 — 옛 지도의 삽화 자리.
 *
 * 지도가 "정보 그림"이 아니라 "여행하는 땅"으로 읽히게 하는 장치다. 그래서
 * 위치는 전부 실제 경위도이고(사막엔 낙타, 바다엔 배), 지도를 옮기면 땅에
 * 붙어 같이 움직인다.
 *
 * 규칙 두 가지
 * 1. 지점 핀이 있는 자리를 피한다 — 여기 좌표는 여덟 여정의 어느 지점과도
 *    150km 이상 떨어진 빈 땅·빈 바다다. 새 좌표를 넣을 땐 data/places*.ts 를
 *    먼저 확인할 것.
 * 2. 크기는 지도 단위가 아니라 화면 px 다(핀·글자와 같은 규약). 확대했을 때
 *    낙타가 도시만큼 커지면 지도가 아니라 그림책이 된다.
 *
 * 같은 그림을 여러 곳에 재사용한다 — 여정마다 보이는 땅이 다르므로(아브라함은
 * 메소포타미아, 바울은 에게해) 각 권역에 하나씩은 놓여 있어야 빈 화면이 없다.
 */
export interface MapDecorItem {
  id: string
  src: string
  /** 다크용 — 같은 그림을 달빛 톤으로 구운 것 */
  night: string
  lat: number
  lng: number
  /** 화면 기준 가로 크기(px) */
  px: number
  /** 세로/가로 비 — SVG <image> 는 한쪽만 주면 브라우저마다 다르게 늘어난다 */
  ratio: number
}

export const MAP_DECOR: MapDecorItem[] = [
  // 바다 — 돛단배
  { id: 'ship-levant', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 32.4, lng: 32.2, px: 74 },
  { id: 'ship-aegean', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 36.6, lng: 25.3, px: 70 },
  { id: 'ship-ionian', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 38.2, lng: 15.6, px: 70 },
  // 이집트
  { id: 'pyramids', src: pyramidsUrl, night: pyramidsNightUrl, ratio: 0.430, lat: 29.4, lng: 30.9, px: 74 },
  { id: 'palms-nile', src: palmsUrl, night: palmsNightUrl, ratio: 1.019, lat: 26.2, lng: 32.8, px: 42 },
  // 아라비아·시리아 사막
  { id: 'camels', src: camelsUrl, night: camelsNightUrl, ratio: 0.329, lat: 31.2, lng: 41.2, px: 88 },
  { id: 'tent', src: tentUrl, night: tentNightUrl, ratio: 0.609, lat: 30.0, lng: 37.4, px: 42 },
  { id: 'olive', src: oliveUrl, night: oliveNightUrl, ratio: 0.967, lat: 35.6, lng: 36.9, px: 44 },
  // 유다·네게브 — 여정이 좁은 길(다윗·예수님)은 지도가 가까이 당겨져,
  // 멀리 둔 삽화가 전부 화면 밖으로 나가 종이만 남는다. 그 자리를 위한 것들이라
  // 지점과 36~62km 로 가깝다(지도에서는 손가락 두어 개 거리).
  { id: 'ship-joppa', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 31.85, lng: 34.15, px: 62 },
  { id: 'palms-negev', src: palmsUrl, night: palmsNightUrl, ratio: 1.019, lat: 30.95, lng: 34.92, px: 38 },
  { id: 'camels-negev', src: camelsUrl, night: camelsNightUrl, ratio: 0.329, lat: 30.92, lng: 35.5, px: 72 },
  { id: 'tent-moab', src: tentUrl, night: tentNightUrl, ratio: 0.609, lat: 31.4, lng: 36.05, px: 38 },
  // 메소포타미아
  { id: 'city', src: cityUrl, night: cityNightUrl, ratio: 0.522, lat: 34.6, lng: 43.2, px: 64 },
]
