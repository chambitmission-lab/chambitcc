# /bible 이어 읽기 카드 배경 이미지 프롬프트 (Gemini용)

`/bible` 나의 서재 맨 위 **이어 읽기 카드**(`ResumeReadingCard.tsx`, `.dash-card--resume`) 뒤에 깔 배경.
라이트/다크 각 1장. 컨셉은 칭호 배경(`title-bg-prompts.md`)과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 "그 양이 성경을 읽고 있는 모습". 라이트는 맑은 대낮 하늘빛, 다크는 **어둡지만 불이 켜진** 밤.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/bible/resume-light.webp`
   - 다크:   `frontend/public/images/bible/resume-dark.webp`
3. 규격: **3:1 가로 (1536×512 권장)**, `cwebp -q 78 원본.png -o resume-light.webp`, 한 장 60KB 이하.
   더 크게 뽑았으면 `magick in.png -resize 1536x512^ -gravity east -extent 1536x512 out.png` 로 오른쪽 기준 크롭.

## 레이아웃 제약 (프롬프트의 핵심)

- 카드는 모바일에서 약 3.5:1, PC에서 5:1 이상으로 늘어난다 → `object-fit: cover; object-position: right center`.
  **주인공과 건물은 오른쪽 1/3 안에**, 왼쪽 2/3는 하늘·안개 같은 단순 그라데이션.
- 왼쪽 위~중간에 라벨·제목·본문 텍스트가 올라간다. 왼쪽은 카드 바탕색으로 녹여 사라진다.
- 글자·숫자·로고·펼친 책의 본문 글씨 금지. 테두리·비네트 금지.
- 라이트: 흰 카드 위 → 밝고 대비 약하게(high-key). 다크: 남색 위 → 어둡되 **창문·등불의 앰버 불빛**이 포인트.

---

## 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for a "continue reading" banner
card in a mobile Bible app, LIGHT MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
gentle airy lighting. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly
smug smile. Palette: pale high-key sky blues and soft white (the deepest tone around
#3182f6, used sparingly), warm cream sunlight, fluffy white clouds, light morning
haze. Overall bright and low-contrast so dark text stays readable on top.

Composition is critical: everything interesting sits in the RIGHT THIRD of the
frame. The LEFT TWO-THIRDS must be nearly empty — just a smooth pale sky-blue to
white gradient with maybe a faint distant cloud, no detail at all, because text
will be overlaid there and the left edge fades into a white card.

Scene (right third): a sunlit white limestone building in the style of ancient
Jerusalem — flat rooftop terrace, small arched doorway, a few olive trees and
little round cypress trees at its base, a couple of tiny birds in the sky. On the
rooftop terrace the sheep sits comfortably, upright on its two hind legs, both
front hooves holding a large open book on its lap, reading with a peaceful
contented smile. The pages of the book are blank, glowing softly white in the
sunlight — no writing on them. A gentle warm sunbeam falls on the sheep. Rolling
soft blue-green hills fade into haze at the bottom right.

No text, no letters, no numbers, no logos, no readable writing of any kind. No
frames, no borders, no vignette. Nothing dark or heavy.
```

## 다크 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for a "continue reading" banner
card in a mobile Bible app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
gentle rim lighting. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly
smug smile. Palette: deep navy night-blue base (around #0A1428, lifting to a
slightly lighter indigo #1a2550 near the horizon), a thin crescent moon and tiny
sparkling blue-white stars, and WARM AMBER LIGHT glowing from inside the building —
the mood is "dark outside, but the lights are on and someone is still up reading".
Keep the overall image muted and low-contrast so white text stays readable.

Composition is critical: everything interesting sits in the RIGHT THIRD of the
frame. The LEFT TWO-THIRDS must be nearly empty — just a smooth deep-navy night sky
gradient with a few faint stars and soft dark hill silhouettes along the very
bottom, no detail at all, because text will be overlaid there and the left edge
fades into a dark navy card.

Scene (right third): the same white limestone building as the light version —
ancient Jerusalem style, flat rooftop terrace, small arched doorway — now at night.
Every window glows warm amber from within, and the arched doorway spills a pool of
golden light onto the ground. A crescent moon hangs above the roof. On the rooftop
terrace the sheep sits upright on its two hind legs beside a small warm oil lamp,
both front hooves holding a large open book on its lap, its face and wool softly
lit by the amber lamplight and the gentle white glow of the blank pages — reading
late into the night, peaceful and content. A few olive trees and little cypress
trees stand as dark silhouettes at the building's base, one tiny window-light
reflecting on them.

No text, no letters, no numbers, no logos, no readable writing of any kind. No
frames, no borders, no vignette. The only bright areas are the amber windows, the
lamp, the moon and the book pages — everything else stays deep navy.
```

## 적용 상태 (2026-09-02)

- 두 장 모두 `public/images/bible/` 에 적용 완료. Gemini 워터마크(우하단 ✦)는 OpenCV inpaint로 제거, 둥근 모서리는 안쪽 14px 크롭.
- `dashboard.css` `.dash-card--resume` 가 `linear-gradient(좌측 페이드) + url(...) right 42% / cover` 두 겹으로 깐다. 다크는 `[data-theme="dark"]` 에서 이미지·페이드 색만 교체.
- 본문은 `padding-right: 16%` 로 주인공 영역을 피하고, 우측 화살표는 건물과 겹쳐 숨김(카드 전체가 버튼).
- 이미지를 다시 뽑을 때는 왼쪽 가장자리 색이 페이드 색(라이트 `#f3f8ff`, 다크 `#091128`)과 맞는지 확인할 것.
