#!/usr/bin/env python3
"""Gmarket Sans 서브셋 생성기 — `npm run gen:gmarket-sans`

왜: PC 크롬(상단 헤더 + 좌측 레일)에만 G마켓 산스를 쓴다. 원본은 한 벌에 600KB
    (한글 완성형 전부)라 그대로 쓰면 장식 하나에 본문 폰트보다 큰 값을 치른다.
    헤더·레일에 실제로 뜨는 글자는 200자 남짓이라, 그 글자만 남기면 두 벌 합쳐
    수십 KB로 끝난다.

어떻게:
  1. 헤더·레일 컴포넌트의 문자열 리터럴 + 거기서 쓰는 t('key') 의 모든 언어 번역값
     + src/locales/*/navigation.ts 전체(메뉴 어휘는 통째로 넣어 여유를 둔다)를 모아
     문자 집합을 만든다. 과포함은 글리프당 100~300B 라 무해하고, 누락만 아프다.
  2. fontTools 서브셋(--text)으로 woff2 두 벌(Medium/Bold)을 굽는다.
     원본 폰트에 없는 글자(베트남어 성조 등)는 조용히 빠지고 Pretendard 로 폴백한다.
  3. manifest 에 담긴 글자 목록은 dev 경고(utils/gmarketSansCheck.ts)가 다시 쓴다 —
     서브셋에 없는 글자가 헤더·레일에 나오면 콘솔에서 잡힌다.

메뉴 문구를 바꾸거나 새 메뉴를 추가하면 반드시 이 스크립트를 다시 돌릴 것.
빠진 글자는 그 글자만 Pretendard 로 떨어져 한 단어 안에서 서체가 섞인다.

원본 폰트(GmarketSansMedium/Bold.woff)는 scripts/gmarket-sans/ 에 캐시한다.
없으면 자동으로 내려받는다(커밋하지 않는다 — .gitignore).
G마켓 산스: 지마켓 제공, 무료 배포·상업적 사용 가능(폰트 파일 자체의 유료 판매만 금지).

필요: python3 + `pip3 install fonttools brotli`
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

try:
    from fontTools import subset
except ImportError:  # pragma: no cover
    sys.exit("fontTools 가 필요합니다: pip3 install fonttools brotli")

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src"
FONT_SRC = ROOT / "scripts" / "gmarket-sans"
OUT_DIR = ROOT / "src" / "assets" / "fonts"
MANIFEST = ROOT / "src" / "styles" / "gmarket-sans.manifest.json"

CDN = "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/"
WEIGHTS = {
    # 출력 이름: (원본 파일, CSS font-weight 범위 주석용)
    "medium": "GmarketSansMedium.woff",
    "bold": "GmarketSansBold.woff",
}

# 서체를 입히는 화면 — 여기 글자가 곧 서브셋이다
SCAN_DIRS = [
    SRC_DIR / "components" / "layout" / "NewHeader",
    SRC_DIR / "components" / "layout" / "DesktopNavRail",
]
# 메뉴 어휘는 통째로 — 나중에 항목을 늘려도 글리프가 비지 않게
LOCALE_FILES = sorted((SRC_DIR / "locales").glob("*/navigation.ts"))
ALL_LOCALE_FILES = sorted((SRC_DIR / "locales").rglob("*.ts"))

# 숫자·영문·기호는 어차피 몇 글리프 안 되므로 통으로 깐다
ALWAYS = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "·—–…‘’“”₩％·「」〈〉°"
)

STRING_RE = re.compile(r"""'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\]*)`""")
T_KEY_RE = re.compile(r"\bt\(\s*'([A-Za-z0-9_]+)'")
# locales/**.ts 의 `key: '값'` — 값 안의 이스케이프는 거의 없으므로 단순 매칭으로 충분
LOCALE_ENTRY_RE = re.compile(r"""([A-Za-z0-9_]+)\s*:\s*(?:'([^'\n]*)'|"([^"\n]*)")""")
# 서브셋에 넣을 값어치가 있는 글자만 — 한글·라틴·숫자·기호
KEEP_RE = re.compile(r"[가-힣ㄱ-ㅎㅏ-ㅣ -~ -ɏ·—–…‘’“”₩°]")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def locale_table() -> dict[str, set[str]]:
    """모든 언어 파일의 key → 번역값들. 한 키가 언어마다 다른 값을 가지므로 set."""
    table: dict[str, set[str]] = {}
    for path in ALL_LOCALE_FILES:
        for m in LOCALE_ENTRY_RE.finditer(read(path)):
            value = m.group(2) if m.group(2) is not None else m.group(3)
            if value:
                table.setdefault(m.group(1), set()).add(value)
    return table


def collect_text() -> tuple[set[str], dict[str, int]]:
    table = locale_table()
    chars: set[str] = set(ALWAYS)
    stats = {"literals": 0, "keys": 0, "navEntries": 0}

    for base in SCAN_DIRS:
        for path in sorted(base.rglob("*")):
            if path.suffix not in {".ts", ".tsx"}:
                continue
            text = read(path)
            # 1) 파일 안의 문자열 리터럴(하드코딩된 한글 라벨·로고 등)
            for m in STRING_RE.finditer(text):
                literal = next((g for g in m.groups() if g), "")
                if literal:
                    chars.update(literal)
                    stats["literals"] += 1
            # 2) JSX 텍스트 노드의 한글 (>참빛교회< 같은 형태)
            for m in re.finditer(r">([^<>{}\n]*[가-힣][^<>{}\n]*)<", text):
                chars.update(m.group(1))
            # 3) t('key') 의 모든 언어 번역값
            for m in T_KEY_RE.finditer(text):
                stats["keys"] += 1
                for value in table.get(m.group(1), ()):  # 없는 키는 조용히 건너뜀
                    chars.update(value)

    # 4) 메뉴 어휘 전체(navigation.ts)
    for path in LOCALE_FILES:
        for m in LOCALE_ENTRY_RE.finditer(read(path)):
            value = m.group(2) if m.group(2) is not None else m.group(3)
            if value:
                stats["navEntries"] += 1
                chars.update(value)

    return {c for c in chars if KEEP_RE.match(c)}, stats


def ensure_source(name: str) -> Path:
    path = FONT_SRC / name
    if path.exists():
        return path
    FONT_SRC.mkdir(parents=True, exist_ok=True)
    print(f"원본 내려받는 중: {name}")
    with urllib.request.urlopen(CDN + name) as res, path.open("wb") as out:
        out.write(res.read())
    return path


def build(key: str, chars: str) -> tuple[Path, int, int]:
    src = ensure_source(WEIGHTS[key])
    out = OUT_DIR / f"gmarket-sans-{key}.woff2"
    subset.main([
        str(src),
        f"--text={chars}",
        "--flavor=woff2",
        "--layout-features=",  # 한글엔 리가처가 필요 없다
        "--no-hinting",
        "--desubroutinize",
        "--name-IDs=*",  # 라이선스·저작자 이름 테이블은 남긴다
        f"--output-file={out}",
    ])
    from fontTools.ttLib import TTFont

    glyphs = len(TTFont(out).getGlyphOrder())
    return out, out.stat().st_size, glyphs


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    chars, stats = collect_text()
    if len(chars) < 50:
        sys.exit("글자를 거의 찾지 못했습니다 — 스캔 경로/정규식을 확인하세요")

    text = "".join(sorted(chars))
    report: dict[str, object] = {
        "chars": text,
        "charCount": len(chars),
        "scannedLiterals": stats["literals"],
        "scannedKeys": stats["keys"],
        "navEntries": stats["navEntries"],
    }
    for key in WEIGHTS:
        out, size, glyphs = build(key, text)
        report[key] = {"file": out.name, "bytes": size, "glyphs": glyphs}
        print(f"{key:7s} {size / 1024:6.1f} KB  ({glyphs} glyphs) → {out.relative_to(ROOT)}")

    MANIFEST.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"manifest → {MANIFEST.relative_to(ROOT)} ({len(chars)} chars)")


if __name__ == "__main__":
    main()
