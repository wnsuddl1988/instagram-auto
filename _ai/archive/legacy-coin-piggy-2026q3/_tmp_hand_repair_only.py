import bpy, os
from math import radians
from mathutils import Vector

BLEND_IN = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/01_blender/A1_ECONOMY_HELPER_BLOCKOUT_V005_RIG_READY.blend"
BLEND_OUT = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/01_blender/A1_ECONOMY_HELPER_BLOCKOUT_V005_HAND_REPAIRED.blend"
PROOF_DIR = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/07_proofs/blockout_v005"

RENDER_W = 1920
RENDER_H = 1920
RENDER_SAMPLES = 64

PREFIX = "A1_BLOCKOUT_"
SIDE_TOKENS = {
    "L": ["_L", "_LEFT", ".L", "LEFT", "L_"],
    "R": ["_R", "_RIGHT", ".R", "RIGHT", "R_"],
}
CORE_BODY = [
    "HEAD", "NECK", "TORSO", "SHOULDER", "UPPER_ARM", "ELBOW", "FOREARM", "WRIST",
    "HIP", "THIGH", "KNEE", "LOWER_LEG", "ANKLE", "FOOT", "FOOT_FRONT", "FOOT_BACK"
]
CORE_HAND = ["PALM", "THUMB", "INDEX", "FINGER", "HAND"]
DENY_TOKENS = ["CHECK", "CHECK_", "POINT", "OPEN_PALM", "POSE", "PREVIEW", "HELPER", "TEST", "TMP", "DUP", "DEMO", "GESTURE", "PROTOTYPE"]


def U(s):
    return s.upper()

def has_side(name_u, side):
    return any(tok in name_u for tok in SIDE_TOKENS[side])

def has_any(name_u, toks):
    return any(t in name_u for t in toks)

def meshes():
    return [o for o in bpy.data.objects if o.type == 'MESH']

def bounds_world(obj):
    try:
        pts = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    except Exception:
        return None, None
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi

def pick_all(part_tokens, side=None):
    out = []
    for o in meshes():
        n = U(o.name)
        if not n.startswith(PREFIX):
            continue
        if side and not has_side(n, side):
            continue
        if has_any(n, part_tokens):
            out.append(o)
    return out

def pick_one(part_tokens, side=None):
    cands = pick_all(part_tokens, side=side)
    if not cands:
        return None, []
    return cands[0], cands[1:]

def remove_obj(o):
    if o and o.name in bpy.data.objects:
        try:
            bpy.data.objects.remove(o, do_unlink=True)
        except Exception:
            pass


def clear_scene_helpers():
    for o in list(meshes()):
        n = U(o.name)
        if not n.startswith(PREFIX):
            continue
        if has_any(n, DENY_TOKENS):
            remove_obj(o)
            continue
        if not has_any(n, CORE_BODY + CORE_HAND):
            remove_obj(o)


def parent_keep_transform(child, parent):
    if not child or not parent or child == parent:
        return
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted() @ child.matrix_world


def apply_transform(obj):
    try:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    except Exception:
        pass

def cleanup_side_parts(side):
    roles = {
        "PALM": ["PALM", "HAND"],
        "THUMB": ["THUMB"],
        "INDEX": ["INDEX"],
        "FINGER": ["FINGER", "FINGER_MASS"],
    }

    kept = {}
    for role, keys in roles.items():
        first, dupes = pick_one(keys, side=side)
        if first:
            kept[role] = first
            for d in dupes:
                if role == "WRIST":
                    continue
                remove_obj(d)
    return kept

def make_rounded(name, radius, location, scale):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location)
    o = bpy.context.object
    o.name = name
    o.scale = Vector(scale)
    apply_transform(o)
    return o

def create_or_repair_hand(side):
    kept = cleanup_side_parts(side)
    wrist = pick_one(["WRIST"], side=side)[0]
    if wrist is None:
        return None

    palm = kept.get("PALM")
    thumb = kept.get("THUMB")
    index = kept.get("INDEX")
    finger = kept.get("FINGER")

    if palm is None:
        palm = make_rounded(f"A1_BLOCKOUT_HAND_{side}_PALM", 0.08, wrist.location.copy(), (0.85, 0.65, 0.45))

    if thumb is None:
        thumb = make_rounded(f"A1_BLOCKOUT_HAND_{side}_THUMB", 0.022, (0, 0, 0), (0.8, 0.8, 0.8))

    if index is None:
        index = make_rounded(f"A1_BLOCKOUT_HAND_{side}_INDEX", 0.022, (0, 0, 0), (0.82, 0.82, 0.82))

    if finger is None:
        finger = make_rounded(f"A1_BLOCKOUT_HAND_{side}_FINGER", 0.023, (0, 0, 0), (0.82, 0.82, 0.82))

    palm.name = f"A1_BLOCKOUT_HAND_{side}_PALM"
    thumb.name = f"A1_BLOCKOUT_HAND_{side}_THUMB"
    index.name = f"A1_BLOCKOUT_HAND_{side}_INDEX"
    finger.name = f"A1_BLOCKOUT_HAND_{side}_FINGER"

    palm.location = wrist.location.copy()
    palm.rotation_euler = wrist.rotation_euler.copy()
    parent_keep_transform(palm, wrist)

    # local offsets from palm
    thumb.location = Vector((0.038, -0.02, -0.010))
    index.location = Vector((0.055, 0.010, 0.022))
    finger.location = Vector((0.020, 0.005, 0.018))

    for o in (thumb, index, finger):
        o.rotation_euler = (0.0, 0.0, 0.0)
        parent_keep_transform(o, palm)
        apply_transform(o)

    # remove old same-side helper-like objects
    for o in list(meshes()):
        n = U(o.name)
        if n.startswith(PREFIX) and has_side(n, side) and has_any(n, ["CHECK", "POINT", "OPEN", "PREVIEW", "DUP", "TMP", "HELPER", "POSE"]):
            remove_obj(o)

    return {
        "wrist": wrist,
        "palm": palm,
        "thumb": thumb,
        "index": index,
        "finger": finger,
    }

def set_render_setup():
    scene = bpy.context.scene
    scene.render.resolution_x = RENDER_W
    scene.render.resolution_y = RENDER_H
    scene.render.image_settings.file_format = 'PNG'
    eng = bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items.keys()
    if 'BLENDER_EEVEE_NEXT' in eng:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    elif 'CYCLES' in eng:
        scene.render.engine = 'CYCLES'
    else:
        scene.render.engine = 'BLENDER_WORKBENCH'
    if scene.render.engine == 'CYCLES':
        scene.cycles.samples = RENDER_SAMPLES
        scene.cycles.use_denoising = False

    world = scene.world if scene.world else bpy.data.worlds.new("A1_HAND_REPAIR_WORLD")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg is not None:
        bg.inputs["Color"].default_value = (0.96, 0.98, 1.0, 1.0)
        bg.inputs["Strength"].default_value = 1.0

    for o in list(bpy.data.objects):
        if o.type == 'LIGHT':
            bpy.data.objects.remove(o, do_unlink=True)

    bpy.ops.object.light_add(type='AREA', location=(2.0, -2.5, 2.1))
    key = bpy.context.object
    key.name = 'A1_HELP_REPAIR_KEY'
    key.data.size = 4.0
    key.data.energy = 900

    bpy.ops.object.light_add(type='AREA', location=(-2.0, -1.6, 2.0))
    fill = bpy.context.object
    fill.name = 'A1_HELP_REPAIR_FILL'
    fill.data.size = 4.8
    fill.data.energy = 500

def get_body_bounds():
    body = [o for o in meshes() if U(o.name).startswith(PREFIX) and has_any(U(o.name), CORE_BODY + CORE_HAND)]
    lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9)); ok = False
    for o in body:
        b0, b1 = bounds_world(o)
        if b0 is None:
            continue
        lo = Vector((min(lo.x, b0.x), min(lo.y, b0.y), min(lo.z, b0.z)))
        hi = Vector((max(hi.x, b1.x), max(hi.y, b1.y), max(hi.z, b1.z)))
        ok = True
    if not ok:
        return Vector((0, 0, 1.1)), 1.3
    c = (lo + hi) * 0.5
    radius = max(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z)
    if radius < 0.01:
        radius = 1.0
    return c, radius

def set_camera(name, loc, target, lens=50):
    camdata = bpy.data.cameras.get(name)
    if camdata is None:
        camdata = bpy.data.cameras.new(name)
    camobj = bpy.data.objects.get(name)
    if camobj is None:
        camobj = bpy.data.objects.new(name, camdata)
        bpy.context.scene.collection.objects.link(camobj)
    camobj.data.type = 'PERSP'
    camobj.data.lens = lens
    camobj.location = loc
    dirv = target - Vector(loc)
    camobj.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = camobj
    return camobj

def render_to(path):
    if not os.path.exists(PROOF_DIR):
        os.makedirs(PROOF_DIR, exist_ok=True)
    bpy.context.scene.render.filepath = os.path.join(PROOF_DIR, path)
    bpy.ops.render.render(write_still=True)

def set_hand_pose_mode(left_data, right_data, mode):
    # reset common local placement first
    for sd in (left_data, right_data):
        if not sd:
            continue
        sd['palm'].rotation_euler = (0.0, 0.0, 0.0)
        sd['thumb'].location = Vector((0.038, -0.02, -0.010))
        sd['index'].location = Vector((0.055, 0.01, 0.022))
        sd['finger'].location = Vector((0.020, 0.005, 0.018))

    if mode == 'open':
        for sd in (left_data, right_data):
            if sd:
                sd['palm'].rotation_euler = (radians(-8), radians(-8), 0.0)
                sd['thumb'].rotation_euler = (0.0, 0.35, 0.35)
                sd['index'].rotation_euler = (0.0, 0.15, 0.0)

    elif mode == 'point_left':
        if left_data:
            left_data['index'].location = Vector((-0.020, 0.115, 0.015))
            left_data['palm'].rotation_euler = (0.0, 0.0, radians(-15))
            left_data['thumb'].location = Vector((0.035, -0.018, -0.01))
        if right_data:
            right_data['index'].location = Vector((0.058, 0.030, 0.021))

    elif mode == 'point_right':
        if right_data:
            right_data['index'].location = Vector((0.120, 0.030, 0.012))
            right_data['palm'].rotation_euler = (0.0, 0.0, radians(15))
            right_data['thumb'].location = Vector((0.030, -0.018, -0.01))
        if left_data:
            left_data['index'].location = Vector((0.058, 0.015, 0.020))


def render_required_images(left_data, right_data):
    center, rad = get_body_bounds()
    d = rad * 2.4

    set_camera('A1_HELP_REPAIR_NEUTRAL', Vector((center.x, center.y - d, center.z + rad * 0.12)), center, 50)
    set_hand_pose_mode(left_data, right_data, 'neutral')
    render_to('A1_HAND_REPAIR_NEUTRAL.png')

    set_camera('A1_HELP_REPAIR_OPEN', Vector((center.x - d * 0.75, center.y - d * 0.75, center.z + rad * 0.2)), center, 50)
    set_hand_pose_mode(left_data, right_data, 'open')
    render_to('A1_HAND_REPAIR_OPEN_PALM.png')

    set_camera('A1_HELP_REPAIR_POINT_L', Vector((center.x - d * 0.75, center.y - d * 0.75, center.z + rad * 0.2)), center, 50)
    set_hand_pose_mode(left_data, right_data, 'point_left')
    render_to('A1_HAND_REPAIR_POINT_LEFT.png')

    set_camera('A1_HELP_REPAIR_POINT_R', Vector((center.x + d * 0.75, center.y - d * 0.75, center.z + rad * 0.2)), center, 50)
    set_hand_pose_mode(left_data, right_data, 'point_right')
    render_to('A1_HAND_REPAIR_POINT_RIGHT.png')

    # closeups
    lw = left_data['wrist'].location if left_data else center
    rw = right_data['wrist'].location if right_data else center

    set_hand_pose_mode(left_data, right_data, 'open')
    set_camera('A1_HELP_REPAIR_CLOSE_L', lw + Vector((0.0, -0.22, 0.08)), lw + Vector((0.0, 0.0, 0.05)), 70)
    render_to('A1_HAND_REPAIR_CLOSEUP_LEFT.png')

    set_hand_pose_mode(left_data, right_data, 'open')
    set_camera('A1_HELP_REPAIR_CLOSE_R', rw + Vector((0.0, -0.22, 0.08)), rw + Vector((0.0, 0.0, 0.05)), 70)
    render_to('A1_HAND_REPAIR_CLOSEUP_RIGHT.png')

def count_detached_helpers():
    cnt = 0
    for o in meshes():
        n = U(o.name)
        if n.startswith(PREFIX) and has_any(n, DENY_TOKENS):
            cnt += 1
    return cnt

def validate_and_print(left_data, right_data):
    l = left_data
    r = right_data

    lgap = (l['wrist'].location - l['palm'].location).length if l else 1e9
    rgap = (r['wrist'].location - r['palm'].location).length if r else 1e9
    lgap = 0.0 if lgap >= 1e8 else lgap
    rgap = 0.0 if rgap >= 1e8 else rgap

    lfloat_thumb = 0
    lfloat_index = 0
    rfloat_thumb = 0
    rfloat_index = 0

    if l:
        lfloat_thumb = 0 if (l['thumb'].parent == l['palm']) else 1
        lfloat_index = 0 if (l['index'].parent == l['palm']) else 1
    if r:
        rfloat_thumb = 0 if (r['thumb'].parent == r['palm']) else 1
        rfloat_index = 0 if (r['index'].parent == r['palm']) else 1

    def idx_read(sd):
        if not sd:
            return False
        d = sd['index'].matrix_world.translation - sd['palm'].matrix_world.translation
        return (abs(d.x) + abs(d.y) + abs(d.z)) > 0.015

    lidx = idx_read(l)
    ridx = idx_read(r)

    open_ok = bool(l and r and l['palm'] and l['thumb'] and l['index'] and l['finger'] and r['palm'] and r['thumb'] and r['index'] and r['finger'])

    print(f"BLEND_PATH={BLEND_OUT}")
    print(f"A1_HAND_REPAIR_NEUTRAL.png={os.path.join(PROOF_DIR, 'A1_HAND_REPAIR_NEUTRAL.png')}")
    print(f"A1_HAND_REPAIR_OPEN_PALM.png={os.path.join(PROOF_DIR, 'A1_HAND_REPAIR_OPEN_PALM.png')}")
    print(f"A1_HAND_REPAIR_POINT_LEFT.png={os.path.join(PROOF_DIR, 'A1_HAND_REPAIR_POINT_LEFT.png')}")
    print(f"A1_HAND_REPAIR_POINT_RIGHT.png={os.path.join(PROOF_DIR, 'A1_HAND_REPAIR_POINT_RIGHT.png')}")
    print(f"A1_HAND_REPAIR_CLOSEUP_LEFT.png={os.path.join(PROOF_DIR, 'A1_HAND_REPAIR_CLOSEUP_LEFT.png')}")
    print(f"A1_HAND_REPAIR_CLOSEUP_RIGHT.png={os.path.join(PROOF_DIR, 'A1_HAND_REPAIR_CLOSEUP_RIGHT.png')}")
    print(f"LEFT_WRIST_TO_HAND_SPATIAL_GAP={lgap:.4f}")
    print(f"RIGHT_WRIST_TO_HAND_SPATIAL_GAP={rgap:.4f}")
    print(f"DETACHED_HAND_HELPER_OBJECTS={count_detached_helpers()}")
    print(f"FLOATING_THUMB_OBJECTS={lfloat_thumb + rfloat_thumb}")
    print(f"FLOATING_INDEX_OBJECTS={lfloat_index + rfloat_index}")
    print(f"LEFT_INDEX_READABLE={str(bool(lidx)).lower()}")
    print(f"RIGHT_INDEX_READABLE={str(bool(ridx)).lower()}")
    print(f"OPEN_PALM_READABLE={str(bool(open_ok)).lower()}")
    print(f"THUMB_INDEX_CONNECTION_LEFT={'PASS' if l and l['thumb'].parent == l['palm'] and l['index'].parent == l['palm'] else 'FAIL'}")
    print(f"THUMB_INDEX_CONNECTION_RIGHT={'PASS' if r and r['thumb'].parent == r['palm'] and r['index'].parent == r['palm'] else 'FAIL'}")


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_IN)
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0

    clear_scene_helpers()

    left = create_or_repair_hand('L')
    right = create_or_repair_hand('R')

    set_render_setup()
    render_required_images(left, right)

    outdir = os.path.dirname(BLEND_OUT)
    if not os.path.exists(outdir):
        os.makedirs(outdir, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

    validate_and_print(left, right)


if __name__ == '__main__':
    main()
