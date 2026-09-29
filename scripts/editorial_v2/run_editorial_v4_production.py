"""Runtime wrapper that preserves V4 shot cuts and adds the CTA bridge wave."""

from __future__ import annotations

import importlib.util
import os
import sys

import bpy


BASE_PATH = os.path.join(os.path.dirname(__file__), "build_editorial_v4_production.py")
SPEC = importlib.util.spec_from_file_location("editorial_v4_base", BASE_PATH)
BASE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BASE)


ORIGINAL_ANIMATE_ACTOR = BASE.animate_actor


def animate_actor_with_cta_wave(scene_no, cfg):
    ORIGINAL_ANIMATE_ACTOR(scene_no, cfg)
    if scene_no != 8:
        return
    right = bpy.data.objects.get("motion_right_explain_control")
    if not right:
        return
    end = cfg["frames"]
    BASE.key(right, end - 34, rotation=(0.18, -0.12, 0.54))
    BASE.key(right, end - 22, rotation=(0.18, 0.10, -0.18))
    BASE.key(right, end - 10, rotation=(0.18, -0.08, 0.42))


def preserve_camera_cuts(objects=None):
    targets = objects or bpy.data.objects
    for obj in targets:
        if obj.name == "V4_EDITORIAL_CAMERA":
            continue
        if obj.animation_data and obj.animation_data.action:
            for curve in obj.animation_data.action.fcurves:
                for point in curve.keyframe_points:
                    point.interpolation = "BEZIER"


BASE.animate_actor = animate_actor_with_cta_wave
BASE.set_constant_keys = preserve_camera_cuts


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(args) != 1 or not args[0].isdigit() or int(args[0]) not in BASE.SCENES:
        raise SystemExit("usage: blender -b FOUNDATION.blend --python run_editorial_v4_production.py -- <scene 1..8>")
    BASE.render(int(args[0]))
