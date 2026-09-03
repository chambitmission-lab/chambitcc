# 홈 공지 배너 배경 이미지 프롬프트 (Gemini용)

홈(기도 목록) 상단 **공지 배너**(`Home/components/HomeNotice.tsx`, `.notice-banner`) 뒤에 깔 배경.
라이트/다크 각 1장. 컨셉은 칭호·이어읽기·교육 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"마을 알림판에 공지를 붙이는 양"**. 배너에 이미 쓰는 아이콘이 lucide `pin`(압정)이라
**압정·펄럭이는 종이·작은 종**을 그대로 이어받는다. 유머는 "키가 안 닿는다"에서 나온다.
라이트는 맑은 아침, 다크는 **밤인데도 등불 켜고 굳이 공지를 붙이는** 밤.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/notice/banner-light.webp`
   - 다크:   `frontend/public/images/notice/banner-dark.webp`
3. 규격: **2:1 가로**, 최종 `640×320` 로 줄여서 `cwebp -q 78 원본.png -o banner-light.webp`,
   한 장 **25KB 이하**(배너는 홈 최상단 = LCP 근처라 여기서 무겁게 만들면 안 된다).
   Gemini 워터마크(우하단 ✦)가 **주인공 위에 얹히는 자리**라 인페인트가 위험하다 →
   프롬프트대로 **아래 8%를 빈 바닥으로** 그리게 한 뒤 워터마크 띠만 잘라내고
   `magick in.png -resize 640x320^ -gravity center -extent 640x320 out.png`.

## 레이아웃 제약 (프롬프트의 핵심)

배너는 **가로가 극단적으로 변한다**. 실측(높이는 항상 ≈81px 고정):

| | 배너 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×81 | **4.4 : 1** |
| PC 2컬럼(1024~1439) | 약 848×81 | **10.5 : 1** |
| PC 3컬럼(1440+) | 약 1192×81 | **14.7 : 1** |

→ `cover`를 쓰면 PC에서 그림이 미친 듯이 확대된다. **`cover` 금지.**
**카드색 바탕 + 오른쪽에 높이맞춤(`auto 100%`)으로 얹는 작은 삽화** 두 겹으로 간다.
즉 이 이미지는 "배경 전체"가 아니라 **배너 오른쪽 끝에 서 있는 작은 무대**다.

- 그림은 **81px 높이로 축소되어 폭 약 160px**만 차지한다. 디테일을 넣어도 안 보인다 →
  **실루엣 3개(게시판·큰 양·새끼양) 안에서 승부**. 잔가지·잔풀·작은 점은 다 뭉개진다.
- **왼쪽 1/4은 완전히 카드색 단색**으로 끝나야 한다(라이트 `#ffffff`, 다크 `#201f1f`).
  CSS 가로 페이드로 한 번 더 녹이지만, 원본부터 그 색이어야 경계선이 안 생긴다.
- **오른쪽 끝 12%는 비워 둔다** — 거기 `>` 셰브런(17px)이 올라간다.
  주인공은 셰브런 바로 왼쪽에 서서 **오른쪽을 향해** 있어야 시선이 화살표로 흐른다(클릭 유도).
- 모바일에선 이 그림 위로 **제목·본문 텍스트가 지나간다**(truncate라 끝까지 늘어남).
  그래서 전체가 **아주 저채도·저대비**여야 한다. 라이트는 거의 흰색에 가까운 파스텔,
  다크는 차콜 + 앰버 한 점. 진한 덩어리가 있으면 제목이 읽히지 않는다.
- 글자·숫자·로고 금지(**공지 종이에도 글씨 대신 낙서** — 물결선 세 줄, 하트, 작은 별).
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리는 CSS가 처리한다.
- 다크 카드 바탕은 남색이 아니라 **따뜻한 차콜 `#201f1f`**. 남색 밤하늘로 그리면 카드에서 뜬다.
- **입에 무는 소품 금지**(다크). 어두운 배경에선 압정 색이 안 살아 입 모양과 한 덩어리로
  뭉개지고 **혀처럼 보인다**. 여분 압정은 나이트캡 챙에 꽂거나 게시판 틀에 박아 둘 것.
  라이트는 `tongue poking out with effort` 로 혀를 따로 명시해서 분리돼 그려진 케이스다.

---

## 라이트 테마 프롬프트

```
A small 2:1 side illustration that will sit at the RIGHT END of a very wide, very
short announcement banner in a mobile church app, LIGHT MODE. It will be displayed
only about 160 pixels wide and 80 pixels tall, so keep it extremely simple and
readable at thumbnail size — three clear silhouettes and nothing else. Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: almost-white. Pure white background (#ffffff) washing into the palest
sky blue and warm cream; the deepest tone anywhere is a soft #3182f6 blue used only
in a couple of tiny accents. Very low contrast and high-key overall, because dark
bold text will be laid across this image and must stay perfectly readable. Nothing
heavy, nothing saturated, no dark outlines.

Composition is critical:
- The LEFT QUARTER of the frame must be FLAT PURE WHITE with absolutely nothing in
  it, dissolving seamlessly into the white card it sits on.
- The RIGHT 12% must also stay empty and calm (a small chevron arrow will be drawn
  on top of it).
- The whole scene therefore lives in the middle-right, standing on the bottom edge.
- Leave the BOTTOM 8% as plain empty ground with no detail.

Scene: a little village NOTICE BOARD — a small weathered honey-wood board with a
tiny pitched roof on one post, standing on soft pale grass. Two sheets of paper are
pinned to it, and they carry only childish DOODLES: three wavy scribble lines, a
small heart, a tiny star — absolutely no letters or numbers. One sheet is held by a
single pushpin at one corner so it flutters loose, curling in the breeze.

In front of the board the chubby white sheep stands upright on its hind legs on
TIPTOE, stretching one front hoof way up to pin the flapping corner — and it is
comically too short to reach, tongue poking out with effort, a spare red pushpin
held in its mouth. A second tiny lamb crouches underneath as a step stool, cheeks
squashed flat, eyes crossed, thoroughly regretting this. A small brass hand bell
hangs from the post with two tiny motion arcs, as if it just rang.

One loose sheet of paper has already escaped and is tumbling away toward the RIGHT
edge, and the big sheep glances after it — the whole scene leans and looks to the
right.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The left edge must be flat #ffffff.
```

## 다크 테마 프롬프트

```
A small 2:1 side illustration that will sit at the RIGHT END of a very wide, very
short announcement banner in a mobile church app, DARK MODE. It will be displayed
only about 160 pixels wide and 80 pixels tall, so keep it extremely simple and
readable at thumbnail size — three clear silhouettes and nothing else. Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, warm rim lighting. Use the SAME small chubby white
sheep character as the attached reference image: stubby legs, tiny round black
hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (#201f1f) — NOT navy blue, NOT black. The only bright
thing in the entire image is a small AMBER lantern glow, plus a faint cool
#4593fc blue rim on one edge. The mood is "it is the middle of the night and
somebody is STILL out there putting up a notice". Keep everything muted and
low-contrast, because light text will be laid across this image; the sheep's wool
should read as soft warm grey, never bright white.

Composition is critical:
- The LEFT QUARTER of the frame must be FLAT #201f1f charcoal with absolutely
  nothing in it, dissolving seamlessly into the dark card it sits on.
- The RIGHT 12% must also stay empty and calm (a small chevron arrow will be drawn
  on top of it).
- The whole scene therefore lives in the middle-right, standing on the bottom edge.
- Leave the BOTTOM 8% as plain empty ground with no detail.

Scene: the same little village NOTICE BOARD at night — a small weathered wood board
with a tiny pitched roof on one post. A little amber lantern hangs from the roof,
pooling warm light over the board. Two sheets of paper are pinned up, glowing faint
cream in the lantern light, carrying only childish DOODLES: three wavy scribble
lines, a small heart, a tiny star — absolutely no letters or numbers. One sheet
hangs by a single pushpin and flutters loose.

In front of the board the same chubby sheep stands upright on TIPTOE, stretching one
front hoof up to pin the flapping corner, still comically too short, wearing a tiny
knitted nightcap that has flopped over one eye with a spare pushpin stuck through
its brim. Its muzzle is just a simple closed contented smile — nothing in its mouth,
no tongue, no object touching the face. The
second tiny lamb crouching underneath as a step stool has given up and fallen fast
asleep on its hooves, with one small round snore bubble. A small brass bell on the
post catches one amber highlight.

One loose sheet has escaped and tumbles away toward the RIGHT edge, catching the
lantern light, and the big sheep glances after it — the whole scene leans and looks
to the right.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The only bright areas are the lantern, the glowing
papers and the bell highlight; the left edge must be flat #201f1f charcoal.
```

---

## 적용 상태 (2026-09-03)

두 장 모두 적용 완료. CSS는 `HomeNotice.tsx` 안의 인라인 `<style>` 블록에 있다.

- **에셋**: `public/images/notice/banner-{light,dark}.webp` (480×310, 각 12KB).
  원본 1456×720 에서 `(420, 50)-(1425, 700)` 크롭 → **사방 알파 페이드**(왼쪽 300px 램프,
  오른쪽 55px, 위 40px, 아래 30px) → `cwebp -q 82 -alpha_q 92`.
  다크는 **전체 알파 ×0.86** 으로 카드색에 한 단계 눌러 앉혔다(흰 글씨가 양 위를 지나가므로).
- **알파로 페이드했기 때문에 카드색 맞춤이 필요 없다.** 배경색을 카드색에 맞추는 방식은
  라이트 하늘이 연파랑, 다크 바탕이 `#1e1e1a`(카드는 `#201f1f`)라 어차피 어긋난다.
- **제거한 것 2가지**:
  - 제미나이 워터마크 ✦ — 두 장 모두 `(1313,573)-(1364,627)`. **인페인트 금지**(별의 글로우를
    경계에서 빨아들여 뿌연 얼룩이 남는다). `(1292,548)-(1388,652)` 를 **좌우 깨끗한 기둥의
    행별 중앙값 사이 선형보간**으로 되메웠다 — 그 구간 배경이 가로로 평평해서 흔적이 없다.
  - **라이트에만 제미나이가 그려 넣은 파란 셰브런 `>`** `(1372,327)-(1413,395)`. 그대로 두면
    CSS 셰브런과 화살표가 두 개가 된다. 같은 방식으로 `(1352,300)-(1434,420)` 되메움.
- **배치**: `cover` 금지. 카드색 가로 워시 + 높이맞춤 삽화 두 겹.
  ```css
  background-image:
    linear-gradient(90deg, var(--surface-container) 0%, var(--surface-container) 34%, rgba(255,255,255,0) 100%),
    url('/images/notice/banner-light.webp');
  background-position: left center, right 26px center;
  background-size: 100% 100%, auto 86%;      /* lg+ 에서 auto 100% */
  ```
  - `right 26px` — 셰브런(오른쪽 12~29px) 자리를 비켜 세우는 오프셋. 이걸 줄이면
    날아가는 종이 끄트머리가 화살표와 겹친다.
  - 모바일만 `86%` — 배너가 좁아 제목·미리보기가 삽화 위를 지나가기 때문. lg+ 는 배너가
    848~1192px 라 텍스트가 삽화 근처까지 오지 않는다.
  - 가로 워시가 **모바일에서 저절로 세지고 PC에서 약해진다**(정지점이 % 라서). 의도된 것 —
    좁을수록 삽화를 더 눌러 글씨를 살린다.
- **클릭 유도**: 배너에 hover 시 브랜드 테두리+그림자, 셰브런 `translate-x-0.5` 를 추가했다.
  삽화의 "오른쪽으로 날아가는 종이"가 그 화살표 쪽을 가리킨다.

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

이미 잘 나온 장면을 통째로 다시 뽑으면 구도가 바뀐다. Gemini에 **그 이미지를 첨부**하고
"한 군데만 고쳐라"로 가는 편이 빠르다.

**얼굴/입이 이상할 때**

```
Keep this image exactly as it is — same composition, same lighting, same colors,
same wool texture, same nightcap, same board and papers. Change ONE thing only:

Remove the object in the sheep's mouth completely. Redraw the muzzle as a simple
closed, contented little smile — a soft curved line with two small rounded cheek
blushes, exactly like the reference sheep character. No tongue, no pushpin, no
object of any kind touching the face. Everything else must stay pixel-identical.
```

**왼쪽 가장자리가 카드색과 안 맞을 때** — 고쳐 그리게 하지 말고 이미지 편집으로
왼쪽 1/4을 `--surface-container` 단색으로 덮은 뒤 경계만 깃털링하는 게 확실하다.
