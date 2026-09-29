"""Fail-closed raster proof for burned-in narration subtitles.

Uses Pillow when locally available and FFmpeg's difference/blackframe filter
otherwise, so the shared gate does not silently disappear on Blender's Python.
"""
import argparse
import re
import subprocess
from pathlib import Path


def pixel_difference_with_pillow(raw_path, burned_path, bounds):
    from PIL import Image, ImageChops
    raw = Image.open(raw_path).convert("RGB").crop(bounds)
    burned = Image.open(burned_path).convert("RGB").crop(bounds)
    if raw.size != burned.size:
        raise SystemExit("SUBTITLE_RENDER_EVIDENCE_SIZE_MISMATCH")
    return sum(pixel != (0, 0, 0) for pixel in ImageChops.difference(raw, burned).getdata()), "PIL"


def pixel_difference_with_ffmpeg(raw_path, burned_path, bounds):
    left, top, right, bottom = bounds
    width, height = right - left, bottom - top
    graph = (
        "[0:v]crop=%d:%d:%d:%d[a];"
        "[1:v]crop=%d:%d:%d:%d[b];"
        "[a][b]blend=all_mode=difference,blackframe=amount=1:threshold=16"
    ) % (width, height, left, top, width, height, left, top)
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(raw_path), "-i", str(burned_path), "-filter_complex", graph, "-frames:v", "1", "-f", "null", "-"],
        check=False,
        capture_output=True,
        text=True,
    )
    match = re.search(r"pblack:([0-9.]+)", result.stderr)
    if result.returncode != 0 or not match:
        raise SystemExit("SUBTITLE_RENDER_EVIDENCE_FFMPEG_FAILED")
    changed_percent = 100.0 - float(match.group(1))
    return changed_percent, "FFMPEG_BLACKFRAME_PERCENT"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("raw")
    parser.add_argument("burned")
    parser.add_argument("--crop", default="600,1040,1080,1420")
    parser.add_argument("--minimum-changed-pixels", type=int, default=100)
    parser.add_argument("--minimum-changed-percent", type=float, default=1.0)
    args = parser.parse_args()
    bounds = tuple(int(value) for value in args.crop.split(","))
    if len(bounds) != 4:
        raise SystemExit("SUBTITLE_RENDER_EVIDENCE_INVALID_CROP")
    try:
        changed, method = pixel_difference_with_pillow(Path(args.raw), Path(args.burned), bounds)
        status = "PASS" if changed >= args.minimum_changed_pixels else "FAIL"
        print("SUBTITLE_RENDERED_PIXEL_PRESENCE=%s changedPixels=%d method=%s" % (status, changed, method))
    except ModuleNotFoundError:
        changed, method = pixel_difference_with_ffmpeg(Path(args.raw), Path(args.burned), bounds)
        status = "PASS" if changed >= args.minimum_changed_percent else "FAIL"
        print("SUBTITLE_RENDERED_PIXEL_PRESENCE=%s changedPercent=%.2f method=%s" % (status, changed, method))
    if status != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
