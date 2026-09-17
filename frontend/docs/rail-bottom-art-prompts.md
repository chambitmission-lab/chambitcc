# PC 좌측 레일 하단 삽화 프롬프트 (Gemini용)

`DesktopNavRail`(PC 왼쪽 세로 메뉴) **맨 아래 빈 공간**에 들어갈 그림. 라이트/다크 각 1장.

---

## ✅ 현재 상태 (2026-09-17 적용 완료)

2차 에셋으로 적용했다. `public/images/rail/bottom-{light,dark}.webp` (496×698, 8KB/11KB).
아래 프롬프트가 그 에셋을 만든 프롬프트다 — 다시 구울 일이 있으면 그대로 쓰면 된다.

### 1차에서 실패한 이유 (다시 밟지 말 것)

1차에는 "새벽/밤 언덕의 작은 예배당"을 **완성된 한 장면**으로 받았다(하늘·안개·달무리·별 포함).
연하게 깔았는데도 **레일 안에 사진 액자가 하나 생긴 모양**이었다 — 그림의 하늘이 레일 배경과
미묘하게 다른 데다, 레일 폭에서 좌우가·구분선에서 아래가 직각으로 끊겼다.

> **여기는 그림을 거는 자리가 아니라 배경이 스며드는 자리다.**
> 그래서 2차 프롬프트의 핵심은 예쁜 장면이 아니라 이 셋이다:
> **① 배경은 앱 배경색과 똑같은 완전 평면 단색 ② 하늘·달·별 없음 ③ 좌·우·위로 녹아 사라짐**

해 보고 버린 길 — 다시 시도할 필요 없다:
- 1차 원화에서 실루엣만 뽑기(포스터라이즈 + 그레인 제거 블러): 블러가 약하면 능선이
  자글자글, 세게 주면 예배당이 뭉개진다. **물감에서 깨끗한 실루엣은 안 나온다.**
- 형태를 직접 벡터로 그리기(인라인 SVG): 모양은 맞는데 앱의 수채 톤과 따로 놀아 클립아트가 된다.
- **투명 배경(알파) 에셋**: 최소 알파 키잉은 연한 워시에서 a=0.05~0.1 이 나오고 색을 1/a 로
  되돌리므로 노이즈가 수십 배로 증폭된다 → 같은 그림이 **8KB → 455KB**. 색 번짐 채우기·
  알파 바닥 처리·알파 증폭 다 해 봤지만 안 내려간다. **배경이 평면이고 그 색을 우리가
  정할 수 있으면 알파는 필요 없다** — 배경을 레일 색에 맞추는 쪽이 옳다.

## 요청 방법

1. 새 대화에서 **라이트 프롬프트를 먼저** 돌린다.
2. 마음에 드는 장이 나오면 **같은 대화에 이어서** 다크 프롬프트를 붙인다
   (같은 세션이어야 능선 배치가 같은 그림의 낮/밤으로 나온다).
3. 두 장을 `~/Downloads/1.png`(라이트), `2.png`(다크)로 저장하고 알려 주면 된다.
   ✦ 워터마크 제거·투명 배경 추출·webp 변환은 내가 한다(아래 「후처리」).

---

## 라이트 테마 프롬프트

```
A very soft watercolour SILHOUETTE for the bottom of a narrow vertical sidebar
in a church app. LIGHT MODE. This is not a picture in a frame — it is a mark that
dissolves into the app's background.

CANVAS: portrait, 496 x 694 px. The ENTIRE background must be ONE perfectly flat,
uniform colour: #F1F3F6. Edge to edge, absolutely nothing in it — no gradient, no
vignette, no paper texture, no sky, no clouds, no sun, no stars, no horizon line.
Only that exact flat colour behind the subject.

SUBJECT — bottom 55% of the canvas only: three overlapping layers of gently
rolling hills painted as soft watercolour washes, and on the crest of the nearest
hill one tiny simple chapel: pitched roof, a small arched window, a slender cross
on top. The chapel is small — about 12% of the image width — and sits slightly
right of centre. Nothing else: no trees, no path, no fence, no birds, no people.

DISSOLVE (most important): the hills must FADE OUT into the flat background.
Completely at the top — the highest ridge simply dissolves, there is no sky and
no horizon. Softly at the LEFT and RIGHT — nothing may touch the left or right
edge of the canvas; the washes thin out and disappear before they get there.
Only the very bottom edge may reach the canvas edge. There must be no rectangle,
no frame, no border, no box, no drop shadow, no visible edge anywhere.

TONE: extremely pale, like a 12% opacity watermark printed onto the background
colour. Palette: pale blue-greys only (#C9D8EC to #A6BFE2), nothing saturated,
nothing dark — the whole thing must be quieter than the menu text that sits above
it. The single exception is a tiny soft amber glow in the chapel window.

NO text, letters, numbers, logos, signatures or watermarks. No photograph, no 3D
render, no hard outlines, no ink linework.
```

## 다크 테마 프롬프트 (같은 대화에서 이어서)

```
Now the SAME composition at night — same hills in the same positions, same chapel
on the same crest, same silhouette. DARK MODE.

CANVAS: portrait, 496 x 694 px. The ENTIRE background must be ONE perfectly flat,
uniform colour: #131313. Edge to edge, nothing in it — no night sky, NO MOON, NO
STARS, no mist, no glow, no gradient. Only that exact flat colour.

SUBJECT: the same three layers of hills, now as muted slate blue-grey washes that
are LIGHTER than the background so they read against the dark (roughly #2E3947 to
#56677E). The chapel's small arched window is the only warm light in the image — a
soft amber glow (#F0C98A) spilling just a little onto the hill around it, like a
single candle. It must read as a quiet ember, never a lamp or a flare.

DISSOLVE: identical rule — the hills fade out completely at the top and softly at
the left and right, touching neither side edge. Only the bottom edge may reach the
canvas edge. No rectangle, frame, border, box or visible edge anywhere.

TONE: even lower contrast than the light version — on a dark screen a pale shape
reads much stronger than it does on a light one. It should look like something you
notice only when you look for it.

NO text, letters, numbers, logos, signatures or watermarks.
```

### 잘 안 나올 때 덧붙일 말

- 하늘·달·별이 자꾸 들어오면: `Remove the sky entirely. The area above the hills must be
  the flat background colour #F1F3F6 (or #131313) and nothing else.`
- 그림이 캔버스를 꽉 채우면: `The subject must occupy only the bottom 55% of the canvas.
  The top 45% is empty flat background.`
- 좌우가 끊겨 보이면: `The washes must fade to nothing before reaching the left and right
  edges — leave at least 12% of the width empty on each side.`
- 너무 진하면: `Make it three times paler. It is a watermark, not an illustration.`

---

## 후처리 (적용된 파이프라인)

```sh
# 1. ✦ 워터마크 제거 — ★밝은 그림은 단차가 3밖에 안 돼 기본 문턱(12)에 걸린다
python docs/gemini-unwatermark.py ~/Downloads/1.png 1-clean.png --min-step=2
python docs/gemini-unwatermark.py ~/Downloads/2.png 2-clean.png

# 2. 평면 배경을 레일 배경색(--desktop-chrome)과 같은 값으로 옮기고 폭 496 으로 축소
python docs/rail-bottom-process.py 1-clean.png fit-light.png f1f3f6 496
python docs/rail-bottom-process.py 2-clean.png fit-dark.png  131313 496

# 3. webp
cwebp -q 92 fit-light.png -o public/images/rail/bottom-light.webp
cwebp -q 92 fit-dark.png  -o public/images/rail/bottom-dark.webp
```

- 2차 에셋 실측: ✦ 단차 라이트 3 / 다크 70, 링 잔차 라이트 +0.84→+0.08 · 다크 +17.37→+0.36.
- 배경 실측: 라이트 (240,241,245) → #f1f3f6 로 이동, 다크 (19,19,19) 는 이미 #131313 과 동일.
- ★webp 손실 압축(4:2:0)이 평면 배경을 1레벨쯤 민다(#f1f3f6 → #f2f3f7). 사전 보정으로는
  못 맞춘다(크로마 양자화로 값이 진동) → 남은 1레벨은 **CSS 마스크가 네 변을 녹여서** 지운다.

## 붙일 자리 (현재 코드)

| 파일 | 역할 |
|---|---|
| `DesktopNavRail.tsx` | 나누기 버튼과 하단 유틸 사이의 `.rail-bottom-art` 칸 |
| `DesktopNavRail.css` | 보이는 조건 · 네 변 마스크 |
| `themeAssets.ts` | `RAIL_BOTTOM` 테마 쌍 |

- **보이는 조건**: `xl(1280px+)` × 높이 티어 `tall`(실측 780px 초과) × `/bible/atlas` 아님.
  ★폭 조건을 Tailwind `hidden xl:block`(0,1,0)에 맡기면 안 된다 —
  `:root[data-vh-tier='tall'] .rail-bottom-art`(0,2,0)가 이겨서 76px 아이콘 바에도 나온다.
- **네 변 마스크**: 세로 0→40% / 93→100%, 가로 0→8% / 92→100%.
  그림이 실제로 그려진 구간(세로 48~87%, 좌우 6~94%)은 건드리지 않는 범위다.
- **상단 페이드를 에셋에 굽지 않는 이유**: 남는 세로가 190~490px 로 변해 잘리는 위치가
  매번 다르다. 마스크는 항상 박스 기준이라 어긋날 수 없다.
- **톤 조정**은 `.rail-bottom-art` 에 `opacity` 한 줄이면 된다(다크가 세다 싶으면 0.8 부터).

## 손글씨 한 줄 — 이미지에 굽지 말 것 ⚠️

레퍼런스의 "하나님과 함께하는 더 좋은 오늘" 손글씨는 **그림에 넣지 말고 웹 텍스트로 얹는다.**
제미나이는 한글을 거의 항상 깨뜨리고, 앱에는 이미 **Nanum Pen Script** 가 지연 로드로 붙어 있다
(`deferredFonts.ts` 의 `ensureFontFamily('nanumPen')` — 타임캡슐·인사말 편지가 쓰는 그 필체).
텍스트로 두면 라이트/다크 잉크 색만 바꾸면 되고 영어 로케일도 대응된다.

| | 문구 후보 |
|---|---|
| 1 | 하나님과 함께하는 더 좋은 오늘 |
| 2 | 오늘도 참 좋은 하루 되세요 |
| 3 | 여기까지 오게 하신 분이 계십니다 |
| 4 | 말씀 한 절, 기도 한 줄이면 충분해요 |
| 5 | 오늘도 당신 편입니다 |
