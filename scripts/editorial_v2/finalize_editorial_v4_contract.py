"""Close explicit V4 technical-contract evidence gaps in the final manifest.

This validator is local-only. It verifies overlay chronology against declared
semantic beats and proves ordered scene/CTA frame accounting at the master seam.
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
from pathlib import Path


ROOT = Path(r"C:\Users\PC\jjy\instagram-auto")
ASSEMBLER = ROOT / "scripts" / "editorial_v2" / "assemble_editorial_v4.py"
FINAL = ROOT / "output" / "editorial-v2" / "coin-production-reentry-v4" / "final"
MANIFEST = FINAL / "V4_MASTER_MANIFEST.json"
CTA = FINAL / "POST_CANONICAL_CTA_OUTRO_V4.mp4"


def load_assembler():
    spec = importlib.util.spec_from_file_location("assemble_editorial_v4", ASSEMBLER)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load V4 assembler")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def probe(path: Path) -> dict:
    output = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-count_frames",
            "-show_entries",
            "format=duration:stream=codec_type,nb_read_frames",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    ).stdout
    return json.loads(output)


def video_frames(media_probe: dict) -> int:
    stream = next(item for item in media_probe["streams"] if item["codec_type"] == "video")
    return int(stream["nb_read_frames"])


def main() -> None:
    assembler = load_assembler()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    chronology = []
    window_evidence = []
    for scene_number, scene in assembler.SCENES.items():
        beat_windows = {int(label[1:]): (start, end) for label, _, start, end in scene["beats"]}
        previous_start = -1.0
        previous_beat = 0
        unique_beats = []
        for item in scene["events"]:
            beat = int(item["beat"])
            start = float(item["start"])
            end = float(item["end"])
            if start < previous_start or beat < previous_beat or end <= start:
                raise AssertionError(f"non-monotonic overlay event in Scene{scene_number:02d}")
            beat_start, beat_end = beat_windows[beat]
            if start < beat_start - 0.001 or end > beat_end + 0.001:
                raise AssertionError(f"stale/future overlay window in Scene{scene_number:02d} beat {beat}")
            if end > scene["frames"] / 30.0 + 0.001:
                raise AssertionError(f"overlay extends beyond Scene{scene_number:02d}")
            previous_start = start
            previous_beat = beat
            if not unique_beats or unique_beats[-1] != beat:
                unique_beats.append(beat)
        if unique_beats != [1, 2, 3, 4]:
            raise AssertionError(f"missing or reordered semantic beat in Scene{scene_number:02d}")
        chronology.append({"scene": scene_number, "eventBeatOrder": unique_beats, "result": "PASS"})
        window_evidence.append({"scene": scene_number, "events": len(scene["events"]), "result": "PASS"})

    scene_numbers = [int(item["scene"]) for item in manifest["scenes"]]
    if scene_numbers != list(range(1, 9)):
        raise AssertionError("master scene order is not Scene01 through Scene08")

    scene_frames = sum(video_frames(item["probe"]) for item in manifest["scenes"])
    cta_probe = probe(CTA)
    cta_frames = video_frames(cta_probe)
    master_frames = video_frames(manifest["master"]["probe"])
    frame_delta = master_frames - (scene_frames + cta_frames)
    if abs(frame_delta) > 1:
        raise AssertionError(f"master seam frame drift {frame_delta} frames")

    component_duration = sum(float(item["probe"]["format"]["duration"]) for item in manifest["scenes"])
    component_duration += float(cta_probe["format"]["duration"])
    master_duration = float(manifest["master"]["probe"]["format"]["duration"])
    duration_delta = abs(component_duration - master_duration)
    if duration_delta > 0.05:
        raise AssertionError(f"master seam duration drift {duration_delta:.6f}s")

    technical = manifest["TECHNICAL_GLOBAL_CONTRACT"]
    technical["SEMANTIC_MONOTONICITY_WHERE_RELEVANT"] = "PASS_BEAT_ORDER_1_TO_4_PER_SCENE"
    technical["NO_STALE_OR_FUTURE_UI"] = "PASS_EVENT_WINDOWS_BOUND_TO_CURRENT_BEAT"
    technical["SCENE_SEAM_QA"] = "PASS_ORDERED_CONCAT_WITHIN_ONE_ENCODER_BOUNDARY_FRAME"
    manifest["technicalSupplementalQa"] = {
        "semanticChronology": chronology,
        "staleFutureUiWindows": window_evidence,
        "sceneOrder": scene_numbers,
        "sceneFrames": scene_frames,
        "ctaFrames": cta_frames,
        "masterFrames": master_frames,
        "encoderBoundaryFrameDelta": frame_delta,
        "componentDurationSeconds": round(component_duration, 6),
        "masterDurationSeconds": round(master_duration, 6),
        "durationDeltaSeconds": round(duration_delta, 6),
        "result": "PASS",
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest["technicalSupplementalQa"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
