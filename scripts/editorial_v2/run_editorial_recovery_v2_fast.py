"""Local render launcher: deterministic Eevee samples suitable for the V2 batch."""

import os

SOURCE = os.path.join(os.path.dirname(__file__), "build_editorial_recovery_v2.py")
with open(SOURCE, "r", encoding="utf-8") as handle:
    code = handle.read()
code = code.replace('scene.render.image_settings.color_mode = "RGBA"', 'scene.render.image_settings.color_mode = "RGB"')
code = code.replace('scene.render.engine = "BLENDER_EEVEE_NEXT"', 'scene.render.engine = "BLENDER_EEVEE_NEXT"\n    scene.eevee.taa_render_samples = 12')
exec(compile(code, SOURCE, "exec"), {"__name__": "__main__", "__file__": SOURCE})
