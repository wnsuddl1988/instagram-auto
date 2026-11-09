"""Local deterministic glyph-coverage preflight for Editorial V2 visible text."""
import argparse
import json
import sys

from fontTools.ttLib import TTFont


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--font", required=True)
    parser.add_argument("--text-json", required=True)
    args = parser.parse_args()
    required_text = json.loads(args.text_json)
    font = TTFont(args.font, lazy=True)
    cmap = set().union(*(table.cmap.keys() for table in font["cmap"].tables))
    missing = sorted({ord(char) for text in required_text for char in text if ord(char) not in cmap})
    result = {"font": args.font, "textCount": len(required_text), "missingCodepoints": ["U+%04X" % codepoint for codepoint in missing], "overall": "PASS" if not missing else "FAIL"}
    print("EDITORIAL_V2_GLYPH_COVERAGE_RESULT=" + json.dumps(result, ensure_ascii=True, sort_keys=True))
    if missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
