#!/usr/bin/env python3
"""
AutoShorts AI v2 renderer
- 1080x1920 vertical editorial reel
- PIL-rendered Korean title/captions to avoid ImageMagick dependency
- Ken Burns style image motion
- FFmpeg-only video encoding path for reliable local/server execution
"""

import json
import os
import sys
import subprocess
from typing import Dict, List, Tuple

from PIL import Image, ImageDraw, ImageFont


W, H = 1080, 1920

# ── 자막 타이밍 환경변수 ──────────────────────────────────────────────────────
# 모두 .env.local 또는 시스템 환경변수로 오버라이드 가능.
# 기본값은 Codex 프레임 QA(frame_005.png=자막없음, frame_055.png=자막있음) 검증 기준.
#
# CAPTION_FADE_IN_DELAY_RATIO  : 씬 시작 후 자막 등장까지 대기 비율 (duration×ratio)
#                                기본 0.10 → 4s 씬이면 0.40s 대기 (max로 0.28s 클램프)
#                                너무 늦으면 0.06으로 낮추기
# CAPTION_FADE_IN_DELAY_MAX    : 위 계산값 상한 (초). 기본 0.28
# CAPTION_FADE_IN_DURATION_RATIO : fade-in 길이 비율. 기본 0.05 (max 0.16s)
# CAPTION_FADE_OUT_DURATION_RATIO: fade-out 길이 비율. 기본 0.06 (max 0.18s)
_CAPTION_DELAY_RATIO   = float(os.environ.get("CAPTION_FADE_IN_DELAY_RATIO",       "0.10"))
_CAPTION_DELAY_MAX     = float(os.environ.get("CAPTION_FADE_IN_DELAY_MAX",         "0.28"))
_CAPTION_FIN_RATIO     = float(os.environ.get("CAPTION_FADE_IN_DURATION_RATIO",    "0.05"))
_CAPTION_FIN_MAX       = float(os.environ.get("CAPTION_FADE_IN_DURATION_MAX",      "0.16"))
_CAPTION_FOUT_RATIO    = float(os.environ.get("CAPTION_FADE_OUT_DURATION_RATIO",   "0.06"))
_CAPTION_FOUT_MAX      = float(os.environ.get("CAPTION_FADE_OUT_DURATION_MAX",     "0.18"))


def _font_path(name: str) -> str:
    candidates = [
        os.path.join("assets", "fonts", name),
        os.path.join(os.getcwd(), "assets", "fonts", name),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return ""


FONT_BLACK = _font_path("BlackHanSans.ttf")
FONT_DOHYEON = _font_path("DoHyeon.ttf")


def _font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = FONT_BLACK if bold and FONT_BLACK else FONT_DOHYEON
    if path:
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> List[str]:
    if not text:
        return []
    words = list(text) if " " not in text else text.split(" ")
    lines: List[str] = []
    current = ""
    joiner = "" if " " not in text else " "
    for word in words:
        candidate = word if not current else current + joiner + word
        box = draw.textbbox((0, 0), candidate, font=font, stroke_width=3)
        if box[2] - box[0] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:3]


def _draw_text_center(
    draw: ImageDraw.ImageDraw,
    y: int,
    text: str,
    font,
    fill: Tuple[int, int, int],
    stroke_width: int = 5,
    stroke_fill: Tuple[int, int, int] = (0, 0, 0),
):
    box = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    x = (W - (box[2] - box[0])) // 2
    draw.text(
        (x, y),
        text,
        font=font,
        fill=fill,
        stroke_width=stroke_width,
        stroke_fill=stroke_fill,
    )


def _draw_caption(draw: ImageDraw.ImageDraw, scene: Dict):
    caption_font = _font(82, True)
    caption = scene.get("caption") or ""
    emphasis = scene.get("emphasis") or ""
    caption_lines = _wrap_text(draw, caption, caption_font, 860)
    base_y = 1300 if len(caption_lines) == 1 else 1240
    for line_idx, line in enumerate(caption_lines):
        y_line = base_y + line_idx * 96
        if emphasis and emphasis in line:
            before, after = line.split(emphasis, 1)
            parts = [(before, (255, 255, 255)), (emphasis, (255, 223, 45)), (after, (255, 255, 255))]
            widths = [
                draw.textbbox((0, 0), p[0], font=caption_font, stroke_width=6)[2]
                - draw.textbbox((0, 0), p[0], font=caption_font, stroke_width=6)[0]
                for p in parts
            ]
            x = (W - sum(widths)) // 2
            for text, color in parts:
                draw.text(
                    (x, y_line),
                    text,
                    font=caption_font,
                    fill=color,
                    stroke_width=6,
                    stroke_fill=(0, 0, 0),
                )
                box = draw.textbbox((0, 0), text, font=caption_font, stroke_width=6)
                x += box[2] - box[0]
        else:
            _draw_text_center(draw, y_line, line, caption_font, (255, 255, 255), stroke_width=6)


def _make_base_overlay(plan: Dict, scene: Dict, index: int, duration: float, out_path: str):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Subtle top and bottom readability gradients.
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(0, 430):
        alpha = int(190 * (1 - y / 430))
        gd.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    for y in range(H - 520, H):
        alpha = int(165 * ((y - (H - 520)) / 520))
        gd.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, grad)
    draw = ImageDraw.Draw(img)

    title_font = _font(62, True)
    subtitle_font = _font(40, False)
    small_font = _font(34, False)

    top_title = plan.get("topTitle") or plan.get("title") or ""
    title_lines = _wrap_text(draw, top_title, title_font, 920)
    y = 88
    for line in title_lines:
        color = (255, 235, 72) if any(k in line for k in ["비밀", "돈", "기회", "건강"]) else (255, 255, 255)
        _draw_text_center(draw, y, line, title_font, color, stroke_width=6)
        y += 76

    subtitle = plan.get("subtitle")
    if subtitle and index == 0:
        _draw_text_center(draw, y + 8, subtitle, subtitle_font, (210, 255, 245), stroke_width=4)

    # Minimal production mark / pacing cue.
    draw.rounded_rectangle((424, 1740, 656, 1796), radius=28, fill=(0, 0, 0, 130))
    _draw_text_center(draw, 1750, f"{index + 1}/{plan.get('scenes') and len(plan.get('scenes')) or ''}", small_font, (215, 215, 215), stroke_width=2)

    img.save(out_path)


def _make_caption_overlay(scene: Dict, out_path: str):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    _draw_caption(draw, scene)
    img.save(out_path)


def _cover_image(src: str, out_path: str):
    img = Image.open(src).convert("RGB")
    iw, ih = img.size
    scale = max(W / iw, H / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - W) // 2)
    top = max(0, (nh - H) // 2)
    img = img.crop((left, top, left + W, top + H))
    img.save(out_path, quality=95)


def _make_fallback_image(scene: Dict, out_path: str):
    img = Image.new("RGB", (W, H), (20, 24, 31))
    draw = ImageDraw.Draw(img)
    for y in range(H):
        r = 22 + int(35 * y / H)
        g = 24 + int(18 * y / H)
        b = 34 + int(42 * y / H)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    font = _font(74, True)
    lines = _wrap_text(draw, scene.get("caption", "AutoShorts"), font, 820)
    y = 760
    for line in lines:
        _draw_text_center(draw, y, line, font, (255, 235, 72), stroke_width=6)
        y += 90
    img.save(out_path, quality=95)


def _run(cmd: List[str]):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout or "ffmpeg command failed")


def _probe_duration(media_path: str) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            media_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return 0.0
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def _select_bgm(bgm_type: str = "emotional"):
    """BGM 파일 선택.

    emotional_story 전용 정책:
      - bgm_type이 emotional 계열이면 warm/sentimental 파일만 허용
      - dramatic / mystery / upbeat / funny 는 emotional_story에서 절대 사용 금지
      - 허용 파일이 없으면 None 반환 → _add_audio 에서 나레이션만 붙임 (무음 BGM)

    BGM을 추가하려면:
      assets/bgm/emotional_warm.mp3  ← 따뜻한 sentimental 계열 MP3 배치
    """
    bgm_dir = os.path.join("assets", "bgm")
    # emotional 계열에서 절대 사용 금지 목록
    EMOTIONAL_BLACKLIST = {"mystery", "dramatic", "upbeat", "funny"}
    is_emotional = bgm_type in ("emotional", "emotional_warm", "sentimental", "warm")

    # 1단계: 우선순위 이름 순서로 탐색
    preferred_names: list[str]
    if is_emotional:
        preferred_names = ["emotional_warm", "emotional", "sentimental", "warm"]
    else:
        preferred_names = [bgm_type]
    for name in preferred_names:
        candidate = os.path.join(bgm_dir, f"{name}.mp3")
        if os.path.exists(candidate):
            return candidate

    # 2단계: 폴더에서 허용 파일 탐색
    # emotional 계열이면 blacklist 파일은 완전히 건너뜀 → 없으면 None (무음)
    if os.path.exists(bgm_dir):
        for fname in sorted(os.listdir(bgm_dir)):
            if not fname.endswith(".mp3"):
                continue
            stem = os.path.splitext(fname)[0].lower()
            if is_emotional and stem in EMOTIONAL_BLACKLIST:
                # dramatic/mystery/upbeat/funny — emotional_story에서 사용 금지
                continue
            return os.path.join(bgm_dir, fname)

    # 허용 파일 없음 → 무음 처리 (_add_audio가 나레이션만 붙임)
    return None


def _escape_filter_path(path: str) -> str:
    # FFmpeg filter paths on Windows need forward slashes and escaped colons.
    return path.replace("\\", "/").replace(":", "\\:")


def _build_motion_filters(motion: str, frames: int, duration: float) -> tuple:
    """
    Returns (zoom_expr, x_expr, y_expr, extra_vf) for the given motion type.

    Design constraints (to avoid dizziness / low-quality feel):
      - Max zoom deviation from 1.0 : ±4 % for sine motions
      - Max x/y displacement        : ±22 px
      - Sine periods kept > 0.9 s so motion reads as intentional, not jitter
      - double_pop uses abs(sin) so both peaks land in the first second
    """
    fps = 30
    PI = "3.14159"

    # ── helpers ──────────────────────────────────────────────────────
    cx = "iw/2-(iw/zoom/2)"   # centered x
    cy = "ih/2-(ih/zoom/2)"   # centered y

    extra_vf = ""              # additional vf filters after zoompan (comma-separated, no trailing comma)

    # ── per-motion definitions ────────────────────────────────────────
    if motion == "slow_zoom_out":
        # calm exit: starts slightly zoomed, slowly pulls back
        zoom  = "1.060-0.00040*on"
        x_expr = cx
        y_expr = cy

    elif motion == "hold":
        zoom  = "1.015"
        x_expr = cx
        y_expr = cy

    elif motion in ("alive", "character_breathe"):
        # Cinematic presence: mostly depth breathing, only a tiny drift.
        # Emotional-story videos felt too shaky with larger x/y offsets.
        pb = fps * 2.4          # breathe
        ps = fps * 5.0          # slow drift
        zoom   = f"1.032+0.006*sin(2*{PI}*on/{pb:.1f})"
        x_expr = f"{cx}+4*sin(2*{PI}*on/{ps:.1f})"
        y_expr = f"{cy}+3*sin(2*{PI}*on/{ps:.1f})"

    elif motion == "character_pulse":
        # Mid-scene emphasis: double-pop zoom (two bumps in first ~1 s),
        # then settles into gentle sway.
        # abs(sin) gives two symmetric peaks per period.
        pp = fps * 0.9          # pop period — two peaks in ~0.9 s
        ps = fps * 4.0          # very slow drift
        zoom   = f"1.035+0.014*abs(sin(2*{PI}*on/{pp:.1f}))"
        x_expr = f"{cx}+3*sin(2*{PI}*on/{ps:.1f})"
        y_expr = f"{cy}-3*cos(2*{PI}*on/{ps:.1f})"
        # Brightness flash synced to the zoom pop (peaks at same phase)
        extra_vf = f"eq=brightness='0.030*abs(sin(2*{PI}*t/{0.9:.2f}))'"

    elif motion == "character_nod":
        # Emotional-story nod: depth-forward camera breath, not visible shaking.
        pn = fps * 2.8
        zoom   = f"1.028+0.004*sin(2*{PI}*on/{pn:.1f})"
        x_expr = cx
        y_expr = f"{cy}+4*sin(2*{PI}*on/{pn:.1f})"

    elif motion == "character_talk":
        # "Talking" feel: rapid small vertical bob (mouth-open rhythm ~4x/s)
        # + very slow lateral drift so the character isn't static
        # bob period  = 30/4 ≈ 7.5 frames  (4 bobs per second)
        # sway period = fps * 3.0           (slow left-right drift)
        pb = fps / 4.0          # fast bob ≈ 7.5 frames
        ps = fps * 3.0          # slow sway
        # zoom: base 1.025 + tiny breath (period 1.8s) so it doesn't feel frozen
        pz = fps * 1.8
        zoom   = f"1.025+0.005*sin(2*{PI}*on/{pz:.1f})"
        # x: gentle sway, ±8px
        x_expr = f"{cx}+8*sin(2*{PI}*on/{ps:.1f})"
        # y: fast bob ±6px — simulates jaw/body talking motion
        y_expr = f"{cy}+6*sin(2*{PI}*on/{pb:.1f})"
        # Tiny brightness flicker synced to bob (very subtle: 0.02 max)
        extra_vf = f"eq=brightness='0.02*abs(sin(2*{PI}*t/{fps/4.0:.2f}))'"

    elif motion == "pan_left":
        zoom   = f"1.025+0.00050*on"
        x_expr = f"{cx}+30-(60*on/{frames})"
        y_expr = cy

    elif motion == "pan_right":
        zoom   = f"1.025+0.00050*on"
        x_expr = f"{cx}-30+(60*on/{frames})"
        y_expr = cy

    elif motion == "slow_zoom_in":
        zoom   = "1.020+0.00060*on"
        x_expr = cx
        y_expr = cy

    else:
        # default: very gentle slow zoom-in
        zoom   = "1.020+0.00050*on"
        x_expr = cx
        y_expr = cy

    return zoom, x_expr, y_expr, extra_vf


def _render_segment(
    image_path: str,
    base_overlay_path: str,
    caption_overlay_path: str,
    duration: float,
    motion: str,
    out_path: str,
):
    frames = max(1, int(duration * 30))

    zoom, x_expr, y_expr, extra_vf = _build_motion_filters(motion, frames, duration)

    # Fade durations scale with clip length so short clips don't go dark too long.
    # Rule: fade_in + fade_out ≤ 30% of duration, each capped at 0.12s.
    max_fade = min(0.12, duration * 0.13)
    fade_in_d  = max_fade
    fade_out_d = max_fade
    fade_out_start = max(0.0, duration - fade_out_d)

    # Build the zoompan → optional eq → format chain
    zp = (
        f"zoompan=z='{zoom}':x='{x_expr}':y='{y_expr}'"
        f":d={frames}:s={W}x{H}:fps=30"
    )
    post_zp = f",{extra_vf}" if extra_vf else ""
    caption_in_start  = min(_CAPTION_DELAY_MAX, max(0.05, duration * _CAPTION_DELAY_RATIO))
    caption_in_d      = min(_CAPTION_FIN_MAX,   max(0.04, duration * _CAPTION_FIN_RATIO))
    caption_out_d     = min(_CAPTION_FOUT_MAX,  max(0.05, duration * _CAPTION_FOUT_RATIO))
    caption_out_start = max(caption_in_start + caption_in_d, duration - caption_out_d)

    filter_complex = (
        f"[0:v]{zp}{post_zp},"
        "format=rgba[bg];"
        "[1:v]format=rgba[base];"
        "[2:v]format=rgba,"
        f"fade=t=in:st={caption_in_start:.3f}:d={caption_in_d:.3f}:alpha=1,"
        f"fade=t=out:st={caption_out_start:.3f}:d={caption_out_d:.3f}:alpha=1[cap];"
        "[bg][base]overlay=0:0:format=auto[tmp];"
        "[tmp][cap]overlay=0:0:format=auto,"
        f"fade=t=in:st=0:d={fade_in_d:.3f},"
        f"fade=t=out:st={fade_out_start:.3f}:d={fade_out_d:.3f},"
        "format=yuv420p[v]"
    )

    _run(
        [
            "ffmpeg",
            "-y",
            "-loop", "1", "-i", image_path,
            "-loop", "1", "-i", base_overlay_path,
            "-loop", "1", "-i", caption_overlay_path,
            "-t", f"{duration:.3f}",
            "-filter_complex", filter_complex,
            "-map", "[v]",
            "-an",
            "-c:v", "libx264",
            "-preset", "medium",
            "-b:v", "6500k",
            "-r", "30",
            out_path,
        ]
    )


def _concat_segments(segment_paths: List[str], out_path: str):
    list_path = os.path.join(os.path.dirname(out_path), "segments.txt")
    with open(list_path, "w", encoding="utf-8") as f:
        for segment in segment_paths:
            safe_segment = os.path.abspath(segment).replace("\\", "/")
            f.write(f"file '{safe_segment}'\n")

    _run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            list_path,
            "-c",
            "copy",
            out_path,
        ]
    )


def _add_audio(video_path: str, narration_path: str, output_path: str):
    if not narration_path or not os.path.exists(narration_path):
        os.replace(video_path, output_path)
        return

    video_duration = _probe_duration(video_path)
    bgm_path = _select_bgm("emotional")
    if bgm_path:
        print(f"[render_v2] BGM selected: {bgm_path}")
    else:
        print("[render_v2] WARNING: No BGM found in assets/bgm/. Add assets/bgm/emotional_warm.mp3 for warm sentimental BGM.")
    if bgm_path and os.path.exists(bgm_path):
        _run(
            [
                "ffmpeg",
                "-y",
                "-i",
                video_path,
                "-i",
                narration_path,
                "-stream_loop",
                "-1",
                "-i",
                bgm_path,
                "-filter_complex",
                "[1:a]volume=1.0[a1];[2:a]volume=0.075[a2];[a1][a2]amix=inputs=2:duration=longest:dropout_transition=0[a]",
                "-map",
                "0:v",
                "-map",
                "[a]",
                "-t",
                f"{video_duration:.3f}",
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                output_path,
            ]
        )
    else:
        _run(
            [
                "ffmpeg",
                "-y",
                "-i",
                video_path,
                "-i",
                narration_path,
                "-map",
                "0:v",
                "-map",
                "1:a",
                "-t",
                f"{video_duration:.3f}",
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                output_path,
            ]
        )


def render(plan_path: str, output_path: str):
    with open(plan_path, "r", encoding="utf-8") as f:
        plan = json.load(f)

    temp_dir = os.path.dirname(plan_path)
    scenes = plan.get("scenes", [])
    if not scenes:
        raise RuntimeError("No scenes provided")

    segment_paths: List[str] = []
    for i, scene in enumerate(scenes):
        duration = float(scene.get("durationSec") or 4.5)
        src = scene.get("localImagePath")
        image_path = os.path.join(temp_dir, f"cover_{i + 1}.jpg")
        base_overlay_path = os.path.join(temp_dir, f"overlay_base_{i + 1}.png")
        caption_overlay_path = os.path.join(temp_dir, f"overlay_caption_{i + 1}.png")
        segment_path = os.path.join(temp_dir, f"segment_{i + 1}.mp4")

        if src and os.path.exists(src):
            _cover_image(src, image_path)
        else:
            raise RuntimeError(
                f"씬 {i + 1} 이미지 없음: fallback 금지. imageProvider={scene.get('imageProvider')}"
            )

        _make_base_overlay(plan, scene, i, duration, base_overlay_path)
        _make_caption_overlay(scene, caption_overlay_path)
        _render_segment(
            image_path,
            base_overlay_path,
            caption_overlay_path,
            duration,
            scene.get("motion", "slow_zoom_in"),
            segment_path,
        )
        segment_paths.append(segment_path)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    silent_path = os.path.join(temp_dir, "silent_concat.mp4")
    _concat_segments(segment_paths, silent_path)
    _add_audio(silent_path, plan.get("narrationPath"), output_path)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"success": False, "error": "Usage: render_v2.py <plan.json> <output.mp4>"}))
        sys.exit(1)

    try:
        render(sys.argv[1], sys.argv[2])
        print(json.dumps({"success": True, "output": os.path.abspath(sys.argv[2])}))
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}))
        sys.exit(1)
