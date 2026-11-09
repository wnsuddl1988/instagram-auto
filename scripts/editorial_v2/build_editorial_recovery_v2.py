"""Local-only Blender rebuild for the Editorial Quality Contract V2.

Each invocation opens the locked Coin/R1 mouth foundation, keeps the character
hierarchy untouched, and authors a separate scene-specific set, acting pass and
camera move under coin-production-reentry-v2.  Audio and subtitles are composed
after rendering so their approved timing remains immutable.
"""

import math
import os
import sys

import bpy
from mathutils import Vector


ROOT = r"C:\Users\PC\jjy\instagram-auto"
OUT_ROOT = os.path.join(ROOT, "output", "editorial-v2", "coin-production-reentry-v2")
FONT = r"C:\Windows\Fonts\Daishin Title Extra Bold.TTF"

SCENES = {
    1: dict(frames=195, env="PAYMENT_PHONE_DESK", color=(0.035, 0.16, 0.22, 1), accent=(0.10, 0.86, 0.68, 1),
            title="결제 확인", cards=[("결제 완료", "#42D7A6"), ("남은 결제대금", "#FFB34C")],
            action="phone check → relief → balance discovery", start=(-1.8, -0.25), mid=(-1.45, 0.00), end=(-0.55, 0.10), camera=(44, 57)),
    2: dict(frames=180, env="CHECKOUT_CHOICE", color=(0.08, 0.12, 0.28, 1), accent=(0.39, 0.67, 1.0, 1),
            title="결제 선택", cards=[("전액 결제", "#49D398"), ("일부 결제", "#F7AA45"), ("다음 달", "#FA7867")],
            action="compare left/right → select → follow remaining amount", start=(0.0, 0.0), mid=(-1.55, 0.0), end=(1.35, 0.0), camera=(41, 52)),
    3: dict(frames=180, env="STATEMENT_INSPECTION", color=(0.17, 0.10, 0.25, 1), accent=(0.89, 0.53, 1.0, 1),
            title="명세서 확인", cards=[("남은 잔액", "#F5C55B"), ("수수료 발생", "#FF7070")],
            action="hold statement → inspect → point at fee", start=(1.55, 0.0), mid=(1.0, 0.10), end=(1.25, -0.10), camera=(54, 62)),
    4: dict(frames=299, env="CALCULATOR_NUMERIC_BOARD", color=(0.10, 0.20, 0.19, 1), accent=(0.30, 0.93, 0.75, 1),
            title="금액의 흐름", cards=[("100만 원", "#F8D25A"), ("− 20만 원", "#5FE5A6"), ("= 80만 원", "#FF9668")],
            action="tap calculator → follow 100 → 20 → 80", start=(-1.75, 0.0), mid=(-1.05, 0.10), end=(0.55, 0.0), camera=(49, 60)),
    5: dict(frames=278, env="CALENDAR_VS_LOOP", color=(0.18, 0.14, 0.08, 1), accent=(1.0, 0.73, 0.25, 1),
            title="두 구조 비교", cards=[("할부 · 종료", "#5DDEA7"), ("리볼빙 · 반복", "#FF6E73")],
            action="turn left endpoint → turn right loop → compare", start=(0.0, 0.0), mid=(-1.55, 0.0), end=(1.55, 0.0), camera=(39, 49)),
    6: dict(frames=195, env="PORTAL_RATE_CHECK", color=(0.05, 0.17, 0.30, 1), accent=(0.30, 0.80, 1.0, 1),
            title="내 수수료율 확인", cards=[("카드 대금명세서", "#8EC8FF"), ("적용 수수료율", "#FFD25C"), ("카드사 홈페이지", "#78E0BC")],
            action="open statement → check rate → point portal", start=(-1.45, 0.0), mid=(-0.85, 0.0), end=(1.15, 0.0), camera=(50, 61)),
    7: dict(frames=260, env="BUDGET_SLIDER_PLAN", color=(0.10, 0.24, 0.27, 1), accent=(0.25, 0.91, 0.85, 1),
            title="상환 계획", cards=[("새 결제 ↓", "#FFAA6E"), ("결제비율 ↑", "#70DFFF"), ("단기 목표", "#A8F071")],
            action="pull spending slider → raise ratio → present target", start=(1.35, 0.0), mid=(0.2, 0.0), end=(-1.25, 0.1), camera=(48, 58)),
    8: dict(frames=292, env="CHECKLIST_CONTACT", color=(0.20, 0.10, 0.20, 1), accent=(0.96, 0.55, 0.91, 1),
            title="확인하고 행동하기", cards=[("1  명세서 확인", "#7BE1F7"), ("2  비율 확인", "#A8ED84"), ("3  문의하기", "#FFCE70")],
            action="check 1 → check 2 → phone/contact → viewer conclusion", start=(-1.45, 0.0), mid=(0.0, 0.05), end=(1.20, 0.10), camera=(48, 55)),
}


def material(name, color, metallic=0.0, roughness=0.45, emission=None):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = 0.3
    return mat


def cube(name, loc, scale, mat, bevel=0.12):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel_mod = obj.modifiers.new("soft_edges", "BEVEL")
    bevel_mod.width = bevel
    bevel_mod.segments = 3
    obj.data.materials.append(mat)
    return obj


def cyl(name, loc, radius, depth, mat, rot=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def text(name, body, loc, size, mat, align="CENTER"):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = body
    curve.align_x = align
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.012
    curve.bevel_depth = 0.006
    curve.bevel_resolution = 2
    if os.path.exists(FONT):
        curve.font = bpy.data.fonts.load(FONT, check_existing=True)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (math.pi / 2, 0, 0)
    obj.data.materials.append(mat)
    return obj


def key(obj, frame, location=None, rotation=None, scale=None):
    if location is not None:
        obj.location = location
        obj.keyframe_insert(data_path="location", frame=frame)
    if rotation is not None:
        obj.rotation_euler = rotation
        obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    if scale is not None:
        obj.scale = scale
        obj.keyframe_insert(data_path="scale", frame=frame)


def pop(obj, frame, scale=(1, 1, 1)):
    key(obj, max(1, frame - 7), scale=(0.01, 0.01, 0.01))
    key(obj, frame, scale=(1.10 * scale[0], 1.10 * scale[1], 1.10 * scale[2]))
    key(obj, frame + 5, scale=scale)


def look_at(cam, target, frame, lens):
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam.keyframe_insert(data_path="rotation_euler", frame=frame)
    cam.data.lens = lens
    cam.data.keyframe_insert(data_path="lens", frame=frame)


def set_mouth(state, frames):
    states = ("REST_SMILE", "CLOSED", "SMALL_OPEN", "WIDE_OPEN", "ROUND_OPEN", "SMILE_OPEN")
    for frame, active in frames:
        for candidate in states:
            obj = bpy.data.objects.get("r1_trace_state_" + candidate)
            if obj:
                obj.hide_render = candidate != active
                obj.keyframe_insert(data_path="hide_render", frame=frame)


def clean_non_coin():
    root = bpy.data.objects.get("coin_finalist_root")
    keep = {root}
    if root:
        keep.update(root.children_recursive)
    for obj in list(bpy.data.objects):
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)


def make_camera(cfg):
    bpy.ops.object.camera_add(location=(0, -19, 0.2))
    cam = bpy.context.object
    cam.name = "EDITORIAL_V2_CAMERA"
    cam.data.lens = cfg["camera"][0]
    bpy.context.scene.camera = cam
    return cam


def make_lights(accent):
    bpy.ops.object.light_add(type="AREA", location=(-5, -5, 6))
    key_light = bpy.context.object
    key_light.name = "V2_WARM_KEY"
    key_light.data.energy = 1100
    key_light.data.shape = "DISK"
    key_light.data.size = 6
    key_light.data.color = (1.0, 0.78, 0.47)
    key_light.rotation_euler = (math.radians(30), 0, math.radians(-35))
    bpy.ops.object.light_add(type="AREA", location=(5, 1, 4))
    rim = bpy.context.object
    rim.name = "V2_ACCENT_RIM"
    rim.data.energy = 900
    rim.data.size = 5
    rim.data.color = accent[:3]
    rim.rotation_euler = (math.radians(75), 0, math.radians(140))


def add_environment(scene_no, cfg, mats):
    bg = cube("ENV_BACKDROP_" + cfg["env"], (0, 3.5, 0), (6.2, 0.12, 9.2), mats["bg"], 0.22)
    floor = cube("ENV_FLOOR", (0, 1.4, -4.4), (6.2, 2.1, 0.2), mats["floor"], 0.16)
    # Distinct semantic set silhouettes, not merely a recolored wall.
    if scene_no == 1:
        cube("PHONE_DESK", (2.55, 1.05, -0.3), (1.25, 0.15, 2.2), mats["panel"], 0.28)
        cube("PHONE_SCREEN", (2.55, 0.86, -0.25), (0.98, 0.04, 1.7), mats["screen"], 0.16)
        cyl("PAYMENT_CHECK", (2.55, 0.72, 0.65), 0.36, 0.08, mats["accent"])
    elif scene_no == 2:
        for x in (-2.55, 2.55):
            cube("CHECKOUT_PILLAR", (x, 1.7, 1.1), (0.42, 0.3, 3.8), mats["panel"], 0.18)
    elif scene_no == 3:
        cube("STATEMENT_SHEET", (-2.55, 1.8, 0.2), (1.55, 0.08, 3.1), mats["paper"], 0.14)
        for z in (1.4, 0.8, 0.2, -0.4):
            cube("STATEMENT_LINE", (-2.55, 1.63, z), (1.05, 0.02, 0.07), mats["accent"], 0.04)
    elif scene_no == 4:
        cube("NUMERIC_BOARD", (1.85, 1.7, 0.55), (2.45, 0.14, 3.4), mats["panel"], 0.22)
        for x in (0.7, 1.85, 3.0):
            cyl("CALC_KEY", (x, 1.48, -1.65), 0.3, 0.08, mats["accent"])
    elif scene_no == 5:
        cyl("ENDPOINT_CALENDAR", (-2.7, 1.6, 0.3), 1.6, 0.15, mats["panel"])
        cyl("REPEATING_LOOP", (2.7, 1.6, 0.3), 1.6, 0.15, mats["warning"])
    elif scene_no == 6:
        cube("PORTAL_MONITOR", (2.45, 1.7, 0.3), (1.75, 0.16, 2.55), mats["panel"], 0.22)
        cube("PORTAL_SCREEN", (2.45, 1.48, 0.3), (1.42, 0.03, 2.15), mats["screen"], 0.16)
    elif scene_no == 7:
        cube("PLANNING_RAIL", (0, 1.75, -0.45), (4.7, 0.15, 0.22), mats["panel"], 0.12)
        for x in (-3.0, 0.0, 3.0):
            cyl("SLIDER_NODE", (x, 1.44, -0.45), 0.36, 0.08, mats["accent"])
    elif scene_no == 8:
        cube("CHECKLIST_BOARD", (-1.9, 1.75, 0.3), (2.25, 0.14, 3.3), mats["paper"], 0.18)
        cube("CONTACT_PHONE", (2.9, 1.35, -0.2), (1.05, 0.15, 2.1), mats["panel"], 0.22)
        cube("CONTACT_SCREEN", (2.9, 1.14, -0.2), (0.8, 0.03, 1.65), mats["screen"], 0.12)


def add_info(cfg, mats):
    title_obj = text("DATA_TITLE", cfg["title"], (0, 1.35, 3.75), 0.66, mats["white"])
    pop(title_obj, 10)
    cards = []
    total = len(cfg["cards"])
    for i, (label, color_hex) in enumerate(cfg["cards"]):
        # Create a single dominant data object at a time on the information side.
        x = 2.45 if i % 2 == 0 else -2.45
        if total == 3 and i == 1:
            x = 0.0
        z = 1.45 - (i * 1.55)
        color = tuple(int(color_hex[k:k+2], 16) / 255 for k in (1, 3, 5)) + (1,)
        card_mat = material("DATA_CARD_%s" % i, color, roughness=0.32, emission=color)
        card = cube("DATA_CARD_%s" % i, (x, 1.18, z), (1.55, 0.14, 0.56), card_mat, 0.18)
        label_obj = text("DATA_LABEL_%s" % i, label, (x, 0.95, z), 0.42 if len(label) < 11 else 0.34, mats["ink"])
        start = int(25 + i * (cfg["frames"] - 60) / max(1, total - 1)) if total > 1 else 35
        pop(card, start)
        pop(label_obj, start)
        cards.append((card, label_obj, start))
    return cards


def actor(scene_no, cfg, camera):
    root = bpy.data.objects["coin_finalist_root"]
    right = bpy.data.objects.get("motion_right_explain_control")
    left = bpy.data.objects.get("motion_left_pad_control")
    pad = bpy.data.objects.get("motion_translation_pad_control")
    f = cfg["frames"]
    p1 = (cfg["start"][0], 0, cfg["start"][1])
    p2 = (cfg["mid"][0], 0, cfg["mid"][1])
    p3 = (cfg["end"][0], 0, cfg["end"][1])
    key(root, 1, location=p1, rotation=(0, -0.06, -0.04), scale=(0.84, 0.84, 0.84))
    key(root, int(f * .45), location=p2, rotation=(0, 0.10 if scene_no % 2 else -0.12, 0.10), scale=(0.91, 0.91, 0.91))
    key(root, f - 12, location=p3, rotation=(0, -0.04, -0.07), scale=(0.88, 0.88, 0.88))
    # Camera is semantically motivated: contextual start, action/reaction close-in.
    camera.location = (0, -19.5, 0.2)
    look_at(camera, (0, 0, 0.25), 1, cfg["camera"][0])
    camera.location = ((p2[0] * .2), -18.3, 0.35)
    look_at(camera, (p2[0] * .3, 0, .2), int(f * .48), cfg["camera"][1])
    camera.location = ((p3[0] * .15), -19.0, .15)
    look_at(camera, (p3[0] * .25, 0, .1), f - 8, cfg["camera"][0] + 3)
    if right:
        key(right, 1, rotation=(0, 0.0, -0.22))
        key(right, int(f * .48), rotation=(0, -0.18, 0.48))
        key(right, f - 10, rotation=(0, 0.04, 0.12))
    if left:
        key(left, 1, rotation=(0, 0.05, 0.08))
        key(left, int(f * .52), rotation=(0, -0.15, -0.34))
        key(left, f - 10, rotation=(0, 0.02, 0.04))
    if pad:
        key(pad, 1, rotation=(0, 0.0, -0.15))
        key(pad, int(f * .44), rotation=(0, 0.0, 0.18))
        key(pad, f - 10, rotation=(0, 0.0, 0.0))
    # Fixed mouth geometries, only state selection/timing changes.
    set_mouth("REST_SMILE", [(1, "REST_SMILE"), (f - 3, "REST_SMILE")])
    set_mouth("SMALL_OPEN", [(16, "SMALL_OPEN"), (int(f*.26), "SMALL_OPEN"), (int(f*.65), "SMALL_OPEN")])
    set_mouth("ROUND_OPEN", [(int(f*.38), "ROUND_OPEN")])
    set_mouth("WIDE_OPEN", [(int(f*.52), "WIDE_OPEN")])
    set_mouth("SMILE_OPEN", [(int(f*.78), "SMILE_OPEN")])
    set_mouth("REST_SMILE", [(f - 3, "REST_SMILE")])


def render(scene_no):
    cfg = SCENES[scene_no]
    clean_non_coin()
    for collection in list(bpy.data.collections):
        if collection.name != "Collection":
            bpy.data.collections.remove(collection)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = cfg["frames"]
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.ffmpeg_preset = "REALTIME"
    scene.render.fps = 30
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.world.color = cfg["color"][:3]
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = cfg["color"]
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.32
    mats = {
        "bg": material("V2_ENV_BG", cfg["color"], roughness=.62),
        "floor": material("V2_ENV_FLOOR", tuple(min(1, x * 1.35) for x in cfg["color"][:3]) + (1,), roughness=.42),
        "panel": material("V2_PANEL", (0.045, .075, .11, 1), metallic=.18, roughness=.32),
        "screen": material("V2_SCREEN", cfg["accent"], metallic=.1, roughness=.24, emission=cfg["accent"]),
        "accent": material("V2_ACCENT", cfg["accent"], metallic=.25, roughness=.25, emission=cfg["accent"]),
        "paper": material("V2_PAPER", (.91, .92, .87, 1), roughness=.70),
        "warning": material("V2_WARNING", (1.0, .22, .24, 1), roughness=.28, emission=(1.0, .08, .08, 1)),
        "white": material("V2_WHITE", (.98, .98, .95, 1), roughness=.35),
        "ink": material("V2_INK", (.018, .03, .055, 1), roughness=.35),
    }
    add_environment(scene_no, cfg, mats)
    make_lights(cfg["accent"])
    camera = make_camera(cfg)
    cards = add_info(cfg, mats)
    actor(scene_no, cfg, camera)
    # Each information event receives a short character-facing beat via root motion/arms above.
    text("ENV_TAG", cfg["env"].replace("_", " "), (0, 1.4, -3.65), .19, mats["accent"])
    out = os.path.join(OUT_ROOT, "scene%02d" % scene_no, "render")
    os.makedirs(out, exist_ok=True)
    scene.render.filepath = os.path.join(out, "SCENE%02d_EDITORIAL_V2_SILENT.mp4" % scene_no)
    blend_dir = os.path.join(OUT_ROOT, "scene%02d" % scene_no, "blender")
    os.makedirs(blend_dir, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, "SCENE%02d_EDITORIAL_V2.blend" % scene_no))
    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not args or int(args[0]) not in SCENES:
        raise SystemExit("usage: blender -b FOUNDATION.blend --python build_editorial_recovery_v2.py -- <scene 1..8>")
    render(int(args[0]))
