"""Build the local-only Editorial Architecture V4 visual layers.

The script opens the locked CANDIDATE_COIN / R1 mouth foundation and creates a
new scene-specific production set.  It never mutates V1/V2/V3 assets.  Exact
Korean data overlays, Golden Subtitles, and approved audio are composed later
by ``assemble_editorial_v4.py`` so the Blender render remains replaceable.
"""

from __future__ import annotations

import math
import os
import struct
import sys
import wave

import bpy
from mathutils import Vector


ROOT = r"C:\Users\PC\jjy\instagram-auto"
OUT = os.path.join(ROOT, "output", "editorial-v2", "coin-production-reentry-v4")
V1 = os.path.join(ROOT, "output", "editorial-v2", "coin-production-reentry-v1")
FONT = r"C:\Windows\Fonts\Daishin Title Extra Bold.TTF"

AUDIO = {
    1: "scene01/audio/SCENE01_COIN_FINAL_DELIVERY_MASTER.wav",
    2: "scene02/audio/SCENE02_COIN_FINAL_DELIVERY_MASTER.wav",
    3: "scene03/audio/SCENE03_COIN_FINAL_DELIVERY_MASTER.wav",
    4: "scene04/audio/SCENE04_COIN_FINAL_DELIVERY_MASTER.wav",
    5: "scene05/audio/SCENE05_COIN_FINAL_DELIVERY_MASTER.wav",
    6: "scene06/audio/SCENE06_COIN_FINAL_DELIVERY_MASTER.wav",
    7: "scene07/audio/SCENE07_COIN_FINAL_DELIVERY_MASTER.wav",
    8: "scene08/audio/SCENE08_COIN_FINAL_DELIVERY_MASTER_R3_LOUDNESS_MATCHED.wav",
}

# Coin scale is deliberately constant within every scene.  Editorial movement
# is carried by body orientation, steps, arms, gaze, props, and shot grammar.
SCENES = {
    1: dict(
        frames=195,
        env="PAYMENT_PHONE_DESK",
        palette=((0.025, 0.095, 0.14, 1), (0.10, 0.88, 0.70, 1), (1.00, 0.68, 0.24, 1)),
        beats=(1, 58, 91, 132, 195),
        actor_x=(-2.05, -1.72, -1.95, -1.55),
        gaze=((0.12, -0.10), (0.14, -0.04), (0.03, 0.10), (0.14, 0.04)),
        pose=((0.08, -0.12), (-0.08, 0.20), (0.12, -0.18), (-0.04, 0.38)),
    ),
    2: dict(
        frames=180,
        env="CHECKOUT_PAYMENT_CHOICE",
        palette=((0.035, 0.055, 0.16, 1), (0.26, 0.66, 1.00, 1), (1.00, 0.34, 0.25, 1)),
        beats=(1, 48, 91, 132, 180),
        actor_x=(0.0, -1.15, 1.05, 1.52),
        gaze=((-0.12, 0.02), (0.13, 0.02), (0.15, 0.02), (0.0, 0.02)),
        pose=((-0.10, -0.32), (0.08, 0.44), (-0.08, 0.56), (0.02, 0.18)),
    ),
    3: dict(
        frames=180,
        env="STATEMENT_INSPECTION_DESK",
        palette=((0.11, 0.035, 0.14, 1), (0.78, 0.36, 1.00, 1), (1.00, 0.27, 0.30, 1)),
        beats=(1, 47, 87, 128, 180),
        actor_x=(1.95, 1.72, 1.58, 1.90),
        gaze=((-0.13, -0.08), (-0.14, 0.03), (-0.13, 0.08), (0.0, 0.04)),
        pose=((0.08, -0.18), (-0.08, -0.46), (0.12, -0.56), (-0.03, -0.16)),
    ),
    4: dict(
        frames=299,
        env="CALCULATOR_NUMBER_WORKBENCH",
        palette=((0.025, 0.13, 0.105, 1), (0.20, 0.90, 0.62, 1), (1.00, 0.68, 0.20, 1)),
        beats=(1, 54, 126, 205, 299),
        actor_x=(-2.05, -1.82, -1.62, -1.75),
        gaze=((0.14, 0.04), (0.14, -0.10), (0.14, 0.03), (0.07, 0.10)),
        pose=((0.05, 0.34), (-0.10, 0.58), (0.08, 0.46), (0.12, 0.12)),
    ),
    5: dict(
        frames=278,
        env="INSTALLMENT_VS_REVOLVING_SPLIT_SET",
        palette=((0.14, 0.075, 0.025, 1), (0.22, 0.85, 0.60, 1), (1.00, 0.28, 0.26, 1)),
        beats=(1, 75, 154, 221, 278),
        actor_x=(0.05, -1.10, 1.10, 0.0),
        gaze=((-0.14, 0.05), (0.14, 0.05), (-0.14, 0.05), (0.0, 0.02)),
        pose=((0.02, -0.40), (-0.05, 0.44), (0.05, -0.48), (-0.02, 0.12)),
    ),
    6: dict(
        frames=195,
        env="STATEMENT_TO_CARD_PORTAL",
        palette=((0.02, 0.10, 0.20, 1), (0.18, 0.72, 1.00, 1), (1.00, 0.76, 0.24, 1)),
        beats=(1, 53, 104, 151, 195),
        actor_x=(-1.78, -1.58, -1.20, -1.45),
        gaze=((-0.13, -0.08), (-0.13, 0.02), (0.14, 0.06), (0.12, 0.04)),
        pose=((0.08, -0.24), (-0.06, -0.42), (0.08, 0.50), (-0.02, 0.38)),
    ),
    7: dict(
        frames=260,
        env="REPAYMENT_PLANNING_DESK",
        palette=((0.02, 0.15, 0.17, 1), (0.18, 0.90, 0.82, 1), (0.95, 0.62, 0.22, 1)),
        beats=(1, 91, 166, 220, 260),
        actor_x=(1.95, 1.72, 1.56, 1.82),
        gaze=((-0.14, -0.08), (-0.14, 0.08), (-0.12, 0.08), (0.0, 0.04)),
        pose=((0.08, -0.42), (-0.10, -0.58), (0.08, -0.38), (-0.02, -0.14)),
    ),
    8: dict(
        frames=292,
        env="CHECKLIST_AND_CONTACT_DESK",
        palette=((0.13, 0.035, 0.12, 1), (0.94, 0.42, 0.78, 1), (1.00, 0.76, 0.22, 1)),
        beats=(1, 91, 122, 198, 292),
        actor_x=(1.92, 1.72, 1.58, 1.80),
        gaze=((-0.14, 0.08), (-0.14, 0.03), (-0.14, -0.04), (-0.02, 0.03)),
        pose=((0.06, -0.44), (-0.06, -0.54), (0.08, -0.44), (-0.02, -0.12)),
    ),
}


ENV_OBJECTS: list[bpy.types.Object] = []
ACTOR_PROPS: list[bpy.types.Object] = []


def mat(name, color, metallic=0.0, roughness=0.42, emission=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = emission
    return material


def tag_env(obj):
    obj["v4_layer"] = "ENVIRONMENT_OR_WORLD_PROP"
    ENV_OBJECTS.append(obj)
    return obj


def cube(name, loc, scale, material, bevel=0.12, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("V4_SOFT_EDGES", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    obj.data.materials.append(material)
    return tag_env(obj)


def cylinder(name, loc, radius, depth, material, rotation=(math.pi / 2, 0, 0), vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return tag_env(obj)


def torus(name, loc, major, minor, material, rotation=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=64,
        minor_segments=16,
        location=loc,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return tag_env(obj)


def sphere(name, loc, scale, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    return tag_env(obj)


def text3d(name, body, loc, size, material, align="CENTER", rotation=(math.pi / 2, 0, 0)):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = body
    curve.align_x = align
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.012
    curve.bevel_depth = 0.005
    if os.path.exists(FONT):
        curve.font = bpy.data.fonts.load(FONT, check_existing=True)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    return tag_env(obj)


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


def key_visibility(obj, frame, visible):
    obj.hide_render = not visible
    obj.keyframe_insert(data_path="hide_render", frame=frame)


def set_constant_keys(objects=None):
    targets = objects or bpy.data.objects
    for obj in targets:
        if obj.animation_data and obj.animation_data.action:
            for curve in obj.animation_data.action.fcurves:
                for point in curve.keyframe_points:
                    point.interpolation = "BEZIER"


def clean_foundation():
    root = bpy.data.objects.get("coin_finalist_root")
    keep = {root}
    if root:
        keep.update(root.children_recursive)
    for obj in list(bpy.data.objects):
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)


def make_camera():
    bpy.ops.object.camera_add(location=(0, -20.5, 0.25))
    camera = bpy.context.object
    camera.name = "V4_EDITORIAL_CAMERA"
    bpy.context.scene.camera = camera
    return camera


def camera_key(camera, frame, loc, target, lens, interpolation="CONSTANT"):
    camera.location = loc
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = lens
    camera.keyframe_insert(data_path="location", frame=frame)
    camera.keyframe_insert(data_path="rotation_euler", frame=frame)
    camera.data.keyframe_insert(data_path="lens", frame=frame)
    for datablock in (camera, camera.data):
        if datablock.animation_data and datablock.animation_data.action:
            for curve in datablock.animation_data.action.fcurves:
                for point in curve.keyframe_points:
                    if point.co.x == frame:
                        point.interpolation = interpolation


def make_lights(accent):
    bpy.ops.object.light_add(type="AREA", location=(-5.8, -5.5, 6.8))
    key_light = bpy.context.object
    key_light.name = "V4_WARM_KEY"
    key_light.data.energy = 1250
    key_light.data.shape = "DISK"
    key_light.data.size = 5.5
    key_light.data.color = (1.0, 0.74, 0.43)
    key_light.rotation_euler = (math.radians(30), 0, math.radians(-35))
    bpy.ops.object.light_add(type="AREA", location=(5.5, 0.5, 4.5))
    rim = bpy.context.object
    rim.name = "V4_COOL_RIM"
    rim.data.energy = 980
    rim.data.size = 4.5
    rim.data.color = accent[:3]
    rim.rotation_euler = (math.radians(72), 0, math.radians(145))
    bpy.ops.object.light_add(type="AREA", location=(0, 3.0, 7.2))
    top = bpy.context.object
    top.name = "V4_SET_TOP_LIGHT"
    top.data.energy = 620
    top.data.size = 4.0
    top.data.color = (0.70, 0.84, 1.0)
    top.rotation_euler = (0, 0, 0)


def base_set(cfg, materials):
    bg, accent, secondary = cfg["palette"]
    cube("V4_BACKDROP", (0, 3.8, 0.2), (6.4, 0.16, 9.4), materials["bg"], 0.28)
    cube("V4_FLOOR", (0, 1.7, -4.35), (6.4, 2.25, 0.22), materials["floor"], 0.16)
    # Asymmetric foreground framing gives every lens change real depth/parallax.
    cube("V4_FOREGROUND_RAIL_L", (-5.55, -0.2, -0.45), (0.32, 0.38, 4.7), materials["ink"], 0.16)
    cube("V4_FOREGROUND_RAIL_R", (5.55, 0.8, 0.35), (0.32, 0.38, 4.1), materials["ink"], 0.16)
    text3d("V4_ENV_ID", cfg["env"].replace("_", " "), (0, 3.56, -3.72), 0.19, materials["muted"])


def build_environment(scene_no, cfg, m):
    base_set(cfg, m)
    beats = cfg["beats"]
    if scene_no == 1:
        # Desk, phone cradle, receipt roll, and a separate carryover tray.
        cube("S01_DESK_TOP", (1.9, 0.65, -1.8), (3.45, 1.05, 0.18), m["wood"], 0.18)
        cube("S01_PHONE", (2.45, 0.10, 0.20), (1.15, 0.16, 2.05), m["ink"], 0.30, rotation=(0.08, 0, -0.10))
        screen = cube("S01_PHONE_SCREEN", (2.45, -0.10, 0.22), (0.88, 0.035, 1.65), m["screen"], 0.16, rotation=(0.08, 0, -0.10))
        cylinder("S01_RECEIPT_ROLL", (0.45, 0.10, -1.15), 0.55, 0.80, m["paper"], rotation=(0, math.pi / 2, 0))
        tray = cube("S01_CARRYOVER_TRAY", (3.45, 0.35, -2.65), (1.45, 0.55, 0.28), m["secondary"], 0.22)
        key(tray, beats[2] - 1, location=(3.45, 0.35, -3.20))
        key(tray, beats[2] + 10, location=(3.45, 0.35, -2.65))
        key(screen, beats[1], scale=(0.88, 0.035, 1.65))
        key(screen, beats[2], scale=(0.98, 0.035, 1.78))
    elif scene_no == 2:
        # A true spatial choice: two checkout islands and a conveyor/tunnel.
        cube("S02_CHECKOUT_BASE_L", (-3.05, 1.2, -1.15), (1.75, 1.0, 0.25), m["accent"], 0.25)
        cube("S02_CHECKOUT_BASE_R", (2.15, 1.2, -1.15), (1.75, 1.0, 0.25), m["secondary"], 0.25)
        torus("S02_FULL_ARCH", (-3.05, 1.8, 1.05), 1.35, 0.18, m["accent"], rotation=(math.pi / 2, 0, 0))
        torus("S02_NEXT_MONTH_TUNNEL", (3.55, 2.25, 1.00), 1.35, 0.22, m["secondary"], rotation=(math.pi / 2, 0, 0))
        cube("S02_CONVEYOR", (1.35, 1.65, -0.20), (3.0, 0.62, 0.18), m["ink"], 0.16)
        token = cylinder("S02_REMAINING_TOKEN", (0.10, 0.88, 0.05), 0.48, 0.18, m["warning"])
        key(token, beats[1], location=(0.10, 0.88, 0.05))
        key(token, beats[2] + 22, location=(3.45, 1.55, 0.65))
    elif scene_no == 3:
        cube("S03_INSPECTION_DESK", (-1.15, 1.0, -1.9), (4.1, 1.35, 0.20), m["wood"], 0.20)
        sheet = cube("S03_STATEMENT", (-2.35, 0.05, 0.15), (1.85, 0.05, 3.05), m["paper"], 0.18, rotation=(0.04, 0, -0.10))
        for i, z in enumerate((1.70, 1.15, 0.60, 0.05, -0.50)):
            cube(f"S03_LINE_{i}", (-2.35, -0.04, z), (1.32, 0.015, 0.055), m["muted"], 0.02, rotation=(0.04, 0, -0.10))
        cylinder("S03_MAGNIFIER", (-0.05, -0.15, -0.70), 0.78, 0.12, m["accent"])
        fee = cylinder("S03_FEE_TAG", (-1.25, -0.22, 0.15), 0.72, 0.15, m["warning"])
        key(fee, beats[1] - 2, scale=(0.01, 0.01, 0.01))
        key(fee, beats[2] + 8, scale=(1.0, 1.0, 1.0))
        key(sheet, beats[0], rotation=(0.04, 0, -0.10))
        key(sheet, beats[1], rotation=(-0.02, 0, 0.04))
    elif scene_no == 4:
        cube("S04_WORKBENCH", (1.45, 1.1, -1.9), (3.85, 1.20, 0.22), m["wood"], 0.22)
        cube("S04_CALCULATOR", (1.55, 0.0, 0.00), (1.55, 0.14, 2.65), m["ink"], 0.30, rotation=(0.04, 0, 0.08))
        for row in range(3):
            for col in range(3):
                cylinder(f"S04_KEY_{row}_{col}", (0.70 + col * 0.82, -0.20, -0.55 - row * 0.66), 0.22, 0.08, m["accent"])
        cube("S04_PROCESS_RAIL", (2.05, 1.10, 2.95), (2.95, 0.28, 0.16), m["ink"], 0.12)
        tokens = []
        for idx, color in enumerate((m["gold"], m["accent"], m["secondary"])):
            tok = cylinder(f"S04_VALUE_TOKEN_{idx}", (0.25 + idx * 1.75, 0.65, 2.95), 0.60, 0.18, color)
            tokens.append(tok)
        key(tokens[0], beats[0], location=(0.25, 0.65, 2.95))
        key(tokens[0], beats[1], location=(1.05, 0.65, 2.95))
        key(tokens[2], beats[2], location=(3.75, 0.65, 2.95))
        key(tokens[2], beats[3], location=(4.55, 0.65, 2.95))
    elif scene_no == 5:
        # Left calendar stair and right revolving loop are different systems.
        cube("S05_SPLIT_SPINE", (0, 2.6, 0.15), (0.08, 0.16, 5.05), m["paper"], 0.04)
        for i in range(4):
            cube(f"S05_CALENDAR_STEP_{i}", (-3.45 + i * 0.55, 1.55, -1.75 + i * 0.70), (0.78, 0.20, 0.32), m["accent"], 0.12)
        cube("S05_FIXED_FLAG", (-1.85, 1.45, 1.50), (0.12, 0.12, 1.55), m["paper"], 0.06)
        torus("S05_REVOLVING_LOOP", (3.00, 1.85, 0.55), 1.82, 0.22, m["secondary"])
        loop_token = cylinder("S05_LOOP_TOKEN", (3.00, 0.90, 2.35), 0.38, 0.16, m["warning"])
        key(loop_token, beats[1], location=(3.00, 0.90, 2.35))
        key(loop_token, beats[2], location=(4.65, 1.20, 0.55))
        key(loop_token, beats[3], location=(3.00, 0.90, -1.25))
    elif scene_no == 6:
        cube("S06_STATEMENT_TABLE", (-2.65, 1.15, -1.95), (2.1, 1.1, 0.20), m["wood"], 0.18)
        cube("S06_STATEMENT", (-2.75, 0.05, 0.15), (1.55, 0.05, 2.75), m["paper"], 0.16, rotation=(0.03, 0, -0.06))
        for i, z in enumerate((1.25, 0.70, 0.15, -0.40)):
            cube(f"S06_RATE_LINE_{i}", (-2.75, -0.03, z), (1.10, 0.015, 0.055), m["muted"], 0.02)
        torus("S06_PORTAL_ARCH", (3.05, 2.00, 0.25), 1.85, 0.24, m["accent"], rotation=(math.pi / 2, 0, 0))
        cube("S06_PORTAL_SCREEN", (3.05, 1.55, 0.25), (1.35, 0.18, 2.25), m["screen"], 0.22)
        target = cube("S06_RATE_TARGET", (3.05, 1.28, 0.35), (0.85, 0.04, 0.28), m["gold"], 0.10)
        key(target, beats[1], scale=(0.01, 0.01, 0.01))
        key(target, beats[2] + 8, scale=(1.0, 1.0, 1.0))
    elif scene_no == 7:
        cube("S07_PLAN_DESK", (-1.65, 1.0, -1.95), (3.75, 1.20, 0.20), m["wood"], 0.20)
        rails = []
        knobs = []
        for idx, x in enumerate((-3.25, -1.05)):
            rails.append(cube(f"S07_SLIDER_RAIL_{idx}", (x, 0.25, 0.45), (0.16, 0.10, 2.75), m["ink"], 0.09))
            knobs.append(cylinder(f"S07_SLIDER_KNOB_{idx}", (x, -0.05, 1.55 if idx == 0 else -0.75), 0.45, 0.16, m["secondary" if idx == 0 else "accent"]))
        key(knobs[0], beats[0], location=(-3.25, -0.05, 1.55))
        key(knobs[0], beats[1], location=(-3.25, -0.05, -0.70))
        key(knobs[1], beats[1], location=(-1.05, -0.05, -0.75))
        key(knobs[1], beats[2], location=(-1.05, -0.05, 1.45))
        target = torus("S07_TARGET_RING", (0.75, 0.35, 0.55), 1.05, 0.16, m["gold"])
        key(target, beats[2] - 1, scale=(0.01, 0.01, 0.01))
        key(target, beats[2] + 10, scale=(1.0, 1.0, 1.0))
    elif scene_no == 8:
        cube("S08_CHECKLIST_PEGBOARD", (-2.65, 1.45, 0.10), (2.00, 0.14, 3.35), m["paper"], 0.22)
        checks = []
        for idx, z in enumerate((1.55, 0.25, -1.05)):
            check = torus(f"S08_CHECK_{idx+1}", (-3.80, 1.12, z), 0.38, 0.10, m["accent"])
            cube(f"S08_ITEM_BAR_{idx+1}", (-2.15, 1.12, z), (0.92, 0.06, 0.12), m["muted"], 0.05)
            checks.append(check)
            key(check, max(1, beats[idx] - 1), scale=(0.01, 0.01, 0.01))
            key(check, beats[idx] + 10, scale=(1.0, 1.0, 1.0))
        cube("S08_CONTACT_DESK", (2.70, 1.20, -2.00), (1.75, 1.05, 0.20), m["wood"], 0.20)
        cube("S08_CONTACT_PHONE", (3.10, 0.12, 0.20), (0.92, 0.14, 1.65), m["ink"], 0.26, rotation=(0.04, 0, 0.08))
        cylinder("S08_PHONE_SIGNAL", (3.10, -0.08, 1.10), 0.30, 0.08, m["gold"])


def hide_translation_pad(scene_no):
    if scene_no not in (1, 2, 4, 5, 7):
        for name in (
            "pad_amber_status_light",
            "pad_strap_attachment_tab",
            "pad_strap_attachment_tab.001",
            "translation_pad_inset_screen",
            "translation_pad_outer_frame",
        ):
            obj = bpy.data.objects.get(name)
            if obj:
                obj.hide_render = True


def attach_actor_prop(scene_no, m, cfg):
    control = bpy.data.objects.get("motion_translation_pad_control")
    if not control or scene_no not in (3, 6, 8):
        return
    # Start at the locked pad world transform and inherit all root/control motion.
    loc = tuple(control.matrix_world.translation)
    if scene_no in (3, 6):
        prop = cube(f"S{scene_no:02d}_HELD_STATEMENT", loc, (0.95, 0.07, 1.30), m["paper"], 0.10, rotation=(0.02, 0, -0.08))
        for idx, z in enumerate((0.55, 0.12, -0.31)):
            line = cube(f"S{scene_no:02d}_HELD_LINE_{idx}", (loc[0], loc[1] - 0.09, loc[2] + z), (0.63, 0.015, 0.035), m["muted"], 0.01, rotation=(0.02, 0, -0.08))
            ACTOR_PROPS.append(line)
    else:
        prop = cube("S08_HELD_PHONE", loc, (0.66, 0.09, 1.05), m["ink"], 0.18, rotation=(0.02, 0, -0.08))
        screen = cube("S08_HELD_PHONE_SCREEN", (loc[0], loc[1] - 0.11, loc[2]), (0.49, 0.015, 0.80), m["screen"], 0.10, rotation=(0.02, 0, -0.08))
        ACTOR_PROPS.append(screen)
        key_visibility(prop, cfg["beats"][2] - 1, False)
        key_visibility(prop, cfg["beats"][2] + 6, True)
        key_visibility(screen, cfg["beats"][2] - 1, False)
        key_visibility(screen, cfg["beats"][2] + 6, True)
    for obj in ENV_OBJECTS[-4:]:
        if obj.name.startswith(f"S{scene_no:02d}_HELD"):
            if obj not in ACTOR_PROPS:
                ACTOR_PROPS.append(obj)
    for obj in ACTOR_PROPS:
        if obj.name.startswith(f"S{scene_no:02d}_HELD"):
            obj["v4_layer"] = "CANDIDATE_COIN_ACTOR_PROP"
            if obj in ENV_OBJECTS:
                ENV_OBJECTS.remove(obj)
            world = obj.matrix_world.copy()
            obj.parent = control
            obj.matrix_parent_inverse = control.matrix_world.inverted()
            obj.matrix_world = world


def animate_world_props(scene_no, cfg):
    # Give semantic objects physical response without relying on character scale.
    for obj in ENV_OBJECTS:
        if "TOKEN" in obj.name or "KNOB" in obj.name or "TRAY" in obj.name or "TARGET" in obj.name:
            obj.rotation_mode = "XYZ"


def animate_actor(scene_no, cfg):
    root = bpy.data.objects["coin_finalist_root"]
    right = bpy.data.objects.get("motion_right_explain_control")
    left = bpy.data.objects.get("motion_left_pad_control")
    pad = bpy.data.objects.get("motion_translation_pad_control")
    leg_l = bpy.data.objects.get("integrated_navy_leg")
    leg_r = bpy.data.objects.get("integrated_navy_leg.001")
    brow_l = bpy.data.objects.get("asymmetrical_soft_brow")
    brow_r = bpy.data.objects.get("asymmetrical_soft_brow.001")
    irises = (bpy.data.objects.get("navy_iris"), bpy.data.objects.get("navy_iris.001"))
    catches = (bpy.data.objects.get("eye_catchlight"), bpy.data.objects.get("eye_catchlight.001"))
    beat_starts = cfg["beats"][:-1]
    for idx, frame in enumerate(beat_starts):
        x = cfg["actor_x"][idx]
        lean, turn = cfg["pose"][idx]
        key(root, frame, location=(x, 0, 0.03 + (0.08 if idx == 2 else 0.0)), rotation=(lean, turn, -lean * 0.55), scale=(0.76, 0.76, 0.76))
        if right:
            right_z = (-0.24, 0.62, 0.36, 0.18)[idx]
            if scene_no in (2, 5):
                right_z = (-0.52, 0.58, -0.58, 0.20)[idx]
            if scene_no == 7:
                right_z = (-0.44, -0.62, 0.52, 0.18)[idx]
            key(right, frame, rotation=(0.16 + idx * 0.03, -0.18 if idx % 2 else 0.06, right_z))
        if left:
            left_z = (0.06, -0.42, 0.34, 0.10)[idx]
            if scene_no in (2, 5):
                left_z = (0.50, -0.50, 0.48, 0.06)[idx]
            key(left, frame, rotation=(-0.04, 0.18 if idx % 2 else -0.06, left_z))
        if pad:
            key(pad, frame, rotation=(0.02, 0.04 * (-1 if idx % 2 else 1), -0.08 + idx * 0.05))
        # Alternate actual leg poses for stepping and settle into the viewer close.
        if leg_l and leg_r:
            step = 0.20 if idx in (1, 2) else 0.04
            key(leg_l, frame, rotation=(0, step, -step * (1 if idx % 2 else -1)))
            key(leg_r, frame, rotation=(0, -step, step * (1 if idx % 2 else -1)))
        if brow_l and brow_r:
            concern = 0.16 if (scene_no in (1, 3, 4, 5) and idx == 2) else 0.02
            key(brow_l, frame, rotation=(0, 0, concern))
            key(brow_r, frame, rotation=(0, 0, -concern))
        dx, dz = cfg["gaze"][idx]
        for obj in irises:
            if obj:
                base_x = -0.78 if obj.name == "navy_iris" else 0.78
                key(obj, frame, location=(base_x + dx, -0.575, 0.48 + dz))
        for obj in catches:
            if obj:
                base_x = -0.87 if obj.name == "eye_catchlight" else 0.69
                key(obj, frame, location=(base_x + dx, -0.61, 0.69 + dz))
    # End in a stable rest smile without changing the locked geometry family.
    end = cfg["frames"]
    key(root, end, location=(cfg["actor_x"][-1], 0, 0.03), rotation=(0, cfg["pose"][-1][1], 0), scale=(0.76, 0.76, 0.76))
    if leg_l and leg_r:
        key(leg_l, end, rotation=(0, 0, 0))
        key(leg_r, end, rotation=(0, 0, 0))


def set_mouth_frame(frame, state):
    states = ("REST_SMILE", "CLOSED", "SMALL_OPEN", "WIDE_OPEN", "ROUND_OPEN", "SMILE_OPEN")
    for candidate in states:
        obj = bpy.data.objects.get("r1_trace_state_" + candidate)
        if obj:
            obj.hide_render = candidate != state
            obj.keyframe_insert(data_path="hide_render", frame=frame)


def audio_driven_lipsync(scene_no, cfg):
    """Drive only the locked R1 mouth-state visibility from actual PCM energy."""
    audio_path = os.path.join(V1, AUDIO[scene_no])
    with wave.open(audio_path, "rb") as wav:
        rate = wav.getframerate()
        channels = wav.getnchannels()
        width = wav.getsampwidth()
        samples = wav.readframes(wav.getnframes())
    if width != 2:
        raise RuntimeError(f"Unsupported approved PCM width: {width}")
    values = struct.unpack("<%dh" % (len(samples) // 2), samples)
    if channels > 1:
        values = values[::channels]
    window = max(1, int(rate * 0.075))
    energies = []
    for frame in range(1, cfg["frames"] + 1, 2):
        center = int((frame - 1) / 30.0 * rate)
        chunk = values[center:center + window]
        rms = math.sqrt(sum(sample * sample for sample in chunk) / max(1, len(chunk))) if chunk else 0.0
        energies.append(rms)
    active = sorted(value for value in energies if value > 120)
    low = active[int(len(active) * 0.35)] if active else 500
    high = active[int(len(active) * 0.78)] if active else 1800
    prev = None
    for idx, frame in enumerate(range(1, cfg["frames"] + 1, 2)):
        energy = energies[idx]
        if energy < 120:
            state = "CLOSED" if frame < cfg["frames"] - 8 else "REST_SMILE"
        elif energy < low:
            state = "SMALL_OPEN"
        elif energy < high:
            state = "ROUND_OPEN" if (frame // 4) % 2 else "SMALL_OPEN"
        else:
            state = "WIDE_OPEN" if (frame // 3) % 2 else "SMILE_OPEN"
        if state != prev:
            set_mouth_frame(frame, state)
            prev = state
    set_mouth_frame(cfg["frames"] - 3, "REST_SMILE")
    set_mouth_frame(cfg["frames"], "REST_SMILE")


def direct_camera(scene_no, cfg, camera):
    b = cfg["beats"]
    x = cfg["actor_x"]
    # Wide context -> action medium -> information insert -> reaction/explain.
    camera_key(camera, b[0], (0, -20.7, 0.25), (0, 0.8, 0.10), 44)
    target2 = (x[1] * 0.42, 0.4, 0.15)
    camera_key(camera, b[1], (x[1] * 0.10, -18.7, 0.32), target2, 55)
    insert_target = (2.25 if scene_no in (1, 2, 4, 6) else -2.25, 0.9, 0.35)
    camera_key(camera, b[2], (insert_target[0] * 0.10, -17.9, 0.42), insert_target, 62)
    camera_key(camera, b[3], (x[3] * 0.08, -19.2, 0.25), (x[3] * 0.34, 0.3, 0.18), 52)
    camera_key(camera, cfg["frames"], (x[3] * 0.08, -19.4, 0.22), (x[3] * 0.32, 0.3, 0.18), 50, interpolation="LINEAR")


def setup_scene(scene_no, cfg):
    clean_foundation()
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = cfg["frames"]
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples = 16
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.ffmpeg.ffmpeg_preset = "GOOD"
    scene.render.film_transparent = False
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = cfg["palette"][0]
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.26
    bg, accent, secondary = cfg["palette"]
    m = {
        "bg": mat("V4_BG", bg, roughness=0.70),
        "floor": mat("V4_FLOOR", tuple(min(1, v * 1.75) for v in bg[:3]) + (1,), roughness=0.42),
        "ink": mat("V4_INK", (0.012, 0.026, 0.045, 1), metallic=0.18, roughness=0.28),
        "wood": mat("V4_WOOD", (0.20, 0.105, 0.055, 1), roughness=0.48),
        "paper": mat("V4_PAPER", (0.93, 0.92, 0.84, 1), roughness=0.72),
        "muted": mat("V4_MUTED", (0.38, 0.48, 0.55, 1), roughness=0.52),
        "screen": mat("V4_SCREEN", accent, metallic=0.08, roughness=0.22, emission=0.65),
        "accent": mat("V4_ACCENT", accent, metallic=0.12, roughness=0.25, emission=0.40),
        "secondary": mat("V4_SECONDARY", secondary, metallic=0.10, roughness=0.28, emission=0.35),
        "warning": mat("V4_WARNING", (1.0, 0.16, 0.20, 1), roughness=0.24, emission=0.45),
        "gold": mat("V4_GOLD", (1.0, 0.78, 0.22, 1), metallic=0.30, roughness=0.24, emission=0.28),
    }
    build_environment(scene_no, cfg, m)
    hide_translation_pad(scene_no)
    attach_actor_prop(scene_no, m, cfg)
    animate_world_props(scene_no, cfg)
    animate_actor(scene_no, cfg)
    audio_driven_lipsync(scene_no, cfg)
    make_lights(accent)
    camera = make_camera()
    direct_camera(scene_no, cfg, camera)
    set_constant_keys()
    return scene


def actor_objects():
    root = bpy.data.objects.get("coin_finalist_root")
    objects = {root}
    if root:
        objects.update(root.children_recursive)
    objects.update(ACTOR_PROPS)
    return {obj for obj in objects if obj}


def render_qa_stills(scene_no, cfg, scene):
    qa_dir = os.path.join(OUT, f"scene{scene_no:02d}", "qa")
    os.makedirs(qa_dir, exist_ok=True)
    actor_set = actor_objects()
    saved = {obj: obj.hide_render for obj in bpy.data.objects}
    saved_world = scene.render.film_transparent
    saved_resolution = (scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage)
    saved_format = scene.render.image_settings.file_format
    saved_mode = scene.render.image_settings.color_mode
    scene.render.resolution_x = 270
    scene.render.resolution_y = 480
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    # Environment-only opening frame for distinct-set evidence.
    for obj in actor_set:
        obj.hide_render = True
    scene.render.film_transparent = False
    scene.frame_set(1)
    scene.render.filepath = os.path.join(qa_dir, f"SCENE{scene_no:02d}_ENVIRONMENT_270x480.png")
    bpy.ops.render.render(write_still=True)
    # Actual alpha actor masks at one representative point per semantic beat.
    for obj, state in saved.items():
        obj.hide_render = state
    for obj in ENV_OBJECTS:
        obj.hide_render = True
    scene.render.film_transparent = True
    mids = []
    for start, end in zip(cfg["beats"][:-1], cfg["beats"][1:]):
        mids.append(int((start + end - 1) / 2))
    for idx, frame in enumerate(mids, 1):
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(qa_dir, f"SCENE{scene_no:02d}_ACTOR_BEAT{idx}_270x480.png")
        bpy.ops.render.render(write_still=True)
    for obj, state in saved.items():
        obj.hide_render = state
    scene.render.film_transparent = saved_world
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = saved_resolution
    scene.render.image_settings.file_format = saved_format
    scene.render.image_settings.color_mode = saved_mode


def render(scene_no):
    cfg = SCENES[scene_no]
    scene = setup_scene(scene_no, cfg)
    scene_dir = os.path.join(OUT, f"scene{scene_no:02d}")
    render_dir = os.path.join(scene_dir, "render")
    blend_dir = os.path.join(scene_dir, "blender")
    os.makedirs(render_dir, exist_ok=True)
    os.makedirs(blend_dir, exist_ok=True)
    blend_path = os.path.join(blend_dir, f"SCENE{scene_no:02d}_V4_DIRECTED_PRODUCTION.blend")
    video_path = os.path.join(render_dir, f"SCENE{scene_no:02d}_V4_DIRECTED_VISUAL_SILENT.mp4")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    scene.render.filepath = video_path
    bpy.ops.render.render(animation=True)
    render_qa_stills(scene_no, cfg, scene)
    print(f"V4_SCENE_RENDER_COMPLETE|scene={scene_no:02d}|frames={cfg['frames']}|video={video_path}")


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if len(args) != 1 or not args[0].isdigit() or int(args[0]) not in SCENES:
        raise SystemExit("usage: blender -b COIN_MOUTH_SYSTEM_FOUNDATION.blend --python build_editorial_v4_production.py -- <scene 1..8>")
    render(int(args[0]))
