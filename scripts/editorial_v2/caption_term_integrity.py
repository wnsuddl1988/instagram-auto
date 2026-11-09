"""Semi-automated check that a supplied critical term stays in one ASS event."""
import argparse
import json
import re
from pathlib import Path


def normalize(value):
    value = re.sub(r"\{[^}]*\}", "", value)
    value = value.replace("\\N", "")
    return re.sub(r"[^0-9A-Za-z가-힣]", "", value)


def dialogue_texts(path):
    texts = []
    for line in Path(path).read_text(encoding="utf-8-sig").splitlines():
        if line.startswith("Dialogue:"):
            parts = line.split(",", 9)
            if len(parts) == 10:
                texts.append(parts[9])
    return texts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("ass")
    parser.add_argument("--term", action="append")
    parser.add_argument("--terms-file")
    args = parser.parse_args()
    terms = list(args.term or [])
    if args.terms_file:
        terms.extend(json.loads(Path(args.terms_file).read_text(encoding="utf-8")))
    if not terms:
        raise SystemExit("CRITICAL_FINANCIAL_TERM_METADATA_REQUIRED")
    events = [normalize(text) for text in dialogue_texts(args.ass)]
    missing = [term for term in terms if not any(normalize(term) in event for event in events)]
    status = "PASS" if not missing else "FAIL"
    print("CRITICAL_FINANCIAL_TERM_SPLIT_ACROSS_CAPTION_EVENTS=%s checkedTermCount=%d" % (status, len(terms)))
    if missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
