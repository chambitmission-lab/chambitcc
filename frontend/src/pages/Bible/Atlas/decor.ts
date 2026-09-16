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
 * 규칙 세 가지
 * 1. 지점 핀이 있는 자리를 피한다 — 여기 좌표는 여덟 여정의 어느 지점과도
 *    150km 이상 떨어진 빈 땅·빈 바다다(유다 권역 넷은 예외, 아래 참고).
 *    새 좌표를 넣을 땐 data/places*.ts 를 먼저 확인할 것.
 * 2. 크기는 지도 단위가 아니라 화면 px 다(핀·글자와 같은 규약). 확대했을 때
 *    낙타가 도시만큼 커지면 지도가 아니라 그림책이 된다.
 * 3. 단, 제 자리(span)를 넘지는 않는다. 2번만 있으면 지도를 줄일수록 그림이
 *    덮는 땅이 넓어져 — 모바일 기본 배율에서 돛단배가 해안을 넘어 육지에
 *    올라앉았다. span 을 넘는 순간부터는 그림도 지도와 같이 작아지고,
 *    알아볼 수 없을 만큼 작아지면 아예 사라진다(MapCanvas 의 DECOR_MIN_PX).
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
  /**
   * 이 그림이 덮어도 되는 땅의 폭(지도 단위, 1단위 ≈ 3.9km).
   *
   * 자기 자리(배는 열린 바다, 천막은 빈 사막)를 벗어나지 않는 한계다.
   * 눈대중이 아니라 해안선(data/landPath.ts)까지의 실제 거리로 잡았다 —
   * 그 점에서 물가까지 r 단위라면 그림의 대각 반지름이 r 을 넘지 않는 폭,
   * 즉 대략 span ≈ 1.45 × r 까지다. 사막처럼 사방이 트인 곳은 그보다
   * 훨씬 커질 수 있지만 150 정도에서 끊는다(그 이상은 그림책이 된다).
   */
  span: number
}

export const MAP_DECOR: MapDecorItem[] = [
  // 바다 — 돛단배. 전부 해안에서 100km 넘게 떨어진 열린 바다에 띄운다.
  // (예전엔 나일 삼각주 코앞·에게해 섬 사이·메시나 해협에 있었다. 해안까지
  //  3~9km 라 조금만 줄여도 배가 뭍으로 올라왔다.)
  { id: 'ship-cyprus', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 33.26, lng: 31.5, px: 74, span: 70 },
  { id: 'ship-crete', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 33.32, lng: 26.94, px: 70, span: 74 },
  { id: 'ship-sicily', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 35.2, lng: 18.44, px: 70, span: 90 },
  // 에게해·욥바 앞바다는 물이 좁다 — 가까이 당겨 봤을 때만 나오는 배들이다
  { id: 'ship-aegean', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 38.44, lng: 25.2, px: 64, span: 22 },
  { id: 'ship-joppa', src: shipUrl, night: shipNightUrl, ratio: 0.948, lat: 31.85, lng: 34.15, px: 62, span: 15 },
  // 이집트
  { id: 'pyramids', src: pyramidsUrl, night: pyramidsNightUrl, ratio: 0.430, lat: 29.4, lng: 30.9, px: 74, span: 62 },
  { id: 'palms-nile', src: palmsUrl, night: palmsNightUrl, ratio: 1.019, lat: 26.2, lng: 32.8, px: 42, span: 42 },
  // 아라비아·시리아 사막
  { id: 'camels', src: camelsUrl, night: camelsNightUrl, ratio: 0.329, lat: 31.2, lng: 41.2, px: 88, span: 150 },
  { id: 'tent', src: tentUrl, night: tentNightUrl, ratio: 0.609, lat: 30.0, lng: 37.4, px: 42, span: 90 },
  { id: 'olive', src: oliveUrl, night: oliveNightUrl, ratio: 0.967, lat: 35.6, lng: 36.9, px: 44, span: 36 },
  // 유다·네게브 — 여정이 좁은 길(다윗·예수님)은 지도가 가까이 당겨져,
  // 멀리 둔 삽화가 전부 화면 밖으로 나가 종이만 남는다. 그 자리를 위한 것들이라
  // 지점과 36~62km 로 가깝다(지도에서는 손가락 두어 개 거리). 그만큼 span 도
  // 작다 — 여정 전체를 보는 배율에서는 조용히 사라진다.
  { id: 'palms-negev', src: palmsUrl, night: palmsNightUrl, ratio: 1.019, lat: 30.95, lng: 34.92, px: 38, span: 28 },
  { id: 'camels-negev', src: camelsUrl, night: camelsNightUrl, ratio: 0.329, lat: 30.92, lng: 35.5, px: 72, span: 56 },
  { id: 'tent-moab', src: tentUrl, night: tentNightUrl, ratio: 0.609, lat: 31.4, lng: 36.05, px: 38, span: 58 },
  // 메소포타미아
  { id: 'city', src: cityUrl, night: cityNightUrl, ratio: 0.522, lat: 34.6, lng: 43.2, px: 64, span: 140 },
]
