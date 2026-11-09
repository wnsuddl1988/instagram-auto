"""Local-only post-canonical CTA with a single Coin point/wave acting beat."""

import math
import os

import bpy

ROOT = r"C:\Users\PC\jjy\instagram-auto"
OUT = os.path.join(ROOT, "output", "editorial-v2", "coin-production-reentry-v2", "final")
SOURCE = os.path.join(ROOT, "scripts", "editorial_v2", "build_editorial_recovery_v2.py")
scope = {"__name__": "editorial_v2_base", "__file__": SOURCE}
with open(SOURCE, "r", encoding="utf-8") as handle:
    exec(compile(handle.read(), SOURCE, "exec"), scope)

clean_non_coin = scope["clean_non_coin"]
material = scope["material"]
cube = scope["cube"]
text = scope["text"]
key = scope["key"]
make_lights = scope["make_lights"]
make_camera = scope["make_camera"]
look_at = scope["look_at"]
set_mouth = scope["set_mouth"]

clean_non_coin()
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 30
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples = 12
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "FFMPEG"
scene.render.image_settings.color_mode = "RGB"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.fps = 30
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.025, 0.12, 0.16, 1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .35

bg = material("CTA_BG", (0.025, .12, .16, 1), roughness=.55)
panel = material("CTA_PANEL", (.04, .23, .29, 1), metallic=.12, roughness=.3)
accent = material("CTA_ACCENT", (.20, .95, .74, 1), roughness=.25, emission=(.20, .95, .74, 1))
white = material("CTA_WHITE", (.98, .98, .94, 1), roughness=.35)
ink = material("CTA_INK", (.015, .035, .045, 1), roughness=.35)
cube("CTA_BACKDROP", (0, 3.5, 0), (6.2, .12, 9.2), bg, .22)
cube("CTA_FLOOR", (0, 1.4, -4.4), (6.2, 2.1, .2), panel, .16)
cube("CTA_MAIN_PANEL", (1.15, 1.2, .65), (3.45, .14, 2.3), panel, .35)
cube("CTA_SUBSCRIBE_CHIP", (1.15, .9, -.65), (1.7, .08, .45), accent, .22)
text("CTA_PRIMARY", "다음 경제 이슈도\n짧고 쉽게", (1.15, .92, 1.25), .60, white)
text("CTA_ACTION", "구독 · 좋아요", (1.15, .73, -.65), .42, ink)
text("CTA_CONTINUATION", "다음 쇼츠도 이어서", (1.15, .92, -1.55), .28, accent)
make_lights((.20, .95, .74, 1))
cam = make_camera({"camera": (48, 54)})
root = bpy.data.objects["coin_finalist_root"]
right = bpy.data.objects.get("motion_right_explain_control")
key(root, 1, location=(-2.35, 0, -.08), rotation=(0, -.05, -.06), scale=(.85, .85, .85))
key(root, 14, location=(-1.72, 0, .08), rotation=(0, .10, .10), scale=(.92, .92, .92))
key(root, 30, location=(-1.85, 0, .05), rotation=(0, 0, -.03), scale=(.90, .90, .90))
if right:
    key(right, 1, rotation=(0, 0, -.10))
    key(right, 11, rotation=(0, -.24, .55))
    key(right, 18, rotation=(0, .08, .10))
    key(right, 25, rotation=(0, -.18, .48))
    key(right, 30, rotation=(0, 0, .06))
cam.location = (0, -19, .25)
look_at(cam, (0, 0, .0), 1, 47)
cam.location = (-.25, -18.2, .35)
look_at(cam, (-.15, 0, .1), 15, 55)
cam.location = (0, -18.8, .2)
look_at(cam, (0, 0, 0), 30, 50)
set_mouth("REST_SMILE", [(1, "REST_SMILE"), (30, "REST_SMILE")])
set_mouth("SMILE_OPEN", [(10, "SMILE_OPEN"), (19, "SMILE_OPEN")])
os.makedirs(OUT, exist_ok=True)
scene.render.filepath = os.path.join(OUT, "POST_CANONICAL_CTA_OUTRO_V2.mp4")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "POST_CANONICAL_CTA_OUTRO_V2.blend"))
bpy.ops.render.render(animation=True)
