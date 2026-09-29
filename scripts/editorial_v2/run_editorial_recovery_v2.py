"""Compatibility launcher for Blender 4.5 RGB-only FFmpeg image settings."""

import os

SOURCE = os.path.join(os.path.dirname(__file__), "build_editorial_recovery_v2.py")
with open(SOURCE, "r", encoding="utf-8") as handle:
    code = handle.read().replace('scene.render.image_settings.color_mode = "RGBA"', 'scene.render.image_settings.color_mode = "RGB"')
exec(compile(code, SOURCE, "exec"), {"__name__": "__main__", "__file__": SOURCE})
