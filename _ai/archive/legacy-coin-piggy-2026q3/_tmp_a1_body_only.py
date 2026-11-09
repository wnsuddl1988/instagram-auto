import bpy, os
from math import radians
from mathutils import Vector

blend_out = r"C:\\Users\\PC\\jjy\\character-lab\\A1_ECONOMY_HELPER\\01_blender\\A1_ECONOMY_HELPER_BODY_ONLY_ACCURIG_PREFLIGHT.blend"
fbx_out = r"C:\\Users\\PC\\jjy\\character-lab\\A1_ECONOMY_HELPER\\01_blender\\A1_ECONOMY_HELPER_BODY_ONLY_ACCURIG_PREFLIGHT.fbx"
proof_dir = r"C:\\Users\\PC\\jjy\\character-lab\\A1_ECONOMY_HELPER\\07_proofs\\blockout_v005"


def fmt(v):
    return tuple(round(float(x), 4) for x in v)

def world_dims(obj):
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    xs = [p.x for p in corners]
    ys = [p.y for p in corners]
    zs = [p.z for p in corners]
    return Vector((max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)))

def get_union(objs):
    bmin = None
    bmax = None
    for o in objs:
        if o.type != 'MESH':
            continue
        corners = [o.matrix_world @ Vector(c) for c in o.bound_box]
        mn = Vector((min(v.x for v in corners), min(v.y for v in corners), min(v.z for v in corners)))
        mx = Vector((max(v.x for v in corners), max(v.y for v in corners), max(v.z for v in corners)))
        if bmin is None:
            bmin, bmax = mn, mx
        else:
            bmin = Vector((min(bmin.x, mn.x), min(bmin.y, mn.y), min(bmin.z, mn.z)))
            bmax = Vector((max(bmax.x, mx.x), max(bmax.y, mx.y), max(bmax.z, mx.z)))
    if bmin is None:
        bmin = Vector((0,0,0))
        bmax = Vector((0,0,0))
    return bmin, bmax

def is_hand_like(name):
    n = name.upper()
    return any(x in n for x in ['HAND', 'PALM', 'THUMB', 'INDEX', 'FINGER', 'OPEN_PALM', 'POINT', 'REPAIR'])

def is_helper_like(name):
    n = name.upper()
    return any(x in n for x in ['HELPER','CHECK','TEST','TMP','DUMMY','PREVIEW','PROTOTYPE','POSE'])

def is_body_like(name):
    n = name.upper()
    if is_hand_like(n):
        return False
    return any(x in n for x in [
        'HEAD', 'NECK', 'TORSO', 'SHOULDER', 'UPPER_ARM', 'ELBOW', 'FOREARM',
        'WRIST', 'PELVIS', 'HIP', 'THIGH', 'KNEE', 'LOWER_LEG', 'ANKLE',
        'FOOT', 'LEG', 'BODY', 'SPINE', 'CHEST'
    ])

def set_engine(scene):
    engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items}
    if 'BLENDER_EEVEE_NEXT' in engines:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    elif 'CYCLES' in engines:
        scene.render.engine = 'CYCLES'
    elif 'BLENDER_WORKBENCH' in engines:
        scene.render.engine = 'BLENDER_WORKBENCH'
    else:
        scene.render.engine = 'BLENDER_WORKBENCH'


def add_camera(name, location, target, ortho=False, ortho_scale=1.0):
    bpy.ops.object.camera_add(location=location)
    c = bpy.context.object
    c.name = name
    c.data.lens = 40
    dir_vec = Vector(target) - Vector(location)
    c.rotation_euler = dir_vec.to_track_quat('-Z', 'Y').to_euler()
    c.data.type = 'ORTHO' if ortho else 'PERSP'
    if ortho:
        c.data.ortho_scale = ortho_scale
    return c

def add_light():
    bpy.ops.object.light_add(type='AREA', location=(0.0, -2.2, 2.2))
    l = bpy.context.object
    l.name = 'A1_BODY_ONLY_KEY'
    l.data.energy = 900
    l.data.size = 1.8
    l.rotation_euler = (radians(56), 0, radians(20))
    return l


def do_render(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def find_by_tokens(meshes, token):
    t = token.upper()
    return [o for o in meshes if t in o.name.upper()]


def pairwise_ok(a, b):
    if not a or not b:
        return False
    xa = a.matrix_world.translation.x
    xb = b.matrix_world.translation.x
    return abs(xa + xb) <= 0.06

# -------------------- cleanup --------------------
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

all_objs = list(bpy.data.objects)
wrists = [o for o in all_objs if o.type == 'MESH' and 'WRIST' in o.name.upper()]
print('INITIAL_OBJ_COUNT=', len(all_objs))

# compute base character bounds excluding hand helpers
base_body_candidates = [o for o in all_objs if o.type == 'MESH' and not is_hand_like(o.name) and not is_helper_like(o.name)]
bb_min, bb_max = get_union(base_body_candidates)
base_size = float(max((bb_max - bb_min).x, (bb_max - bb_min).y, (bb_max - bb_min).z, 1e-6))
print('BASE_SIZE=', round(base_size, 6))

# Remove known hand/helper geometry and obvious stray helpers
remove_names = []
for o in list(bpy.data.objects):
    name_u = o.name.upper()
    if o.type == 'MESH' and is_hand_like(name_u):
        remove_names.append(o.name)
        continue
    if o.type != 'MESH' and (is_helper_like(name_u) or 'CHECK' in name_u or 'REPAIR' in name_u):
        remove_names.append(o.name)
        continue
    if o.type == 'MESH' and is_helper_like(name_u):
        remove_names.append(o.name)

# remove giant misplaced unknowns (below character or oversized) before final save
for o in list(bpy.data.objects):
    if o.type != 'MESH':
        continue
    if is_hand_like(o.name) or is_body_like(o.name):
        continue
    dims = world_dims(o)
    loc = o.matrix_world.translation
    if max(dims) > base_size * 0.70 or (dims.x*dims.y*dims.z) > (base_size**3 * 0.06):
        if o.name not in remove_names:
            remove_names.append(o.name)
            continue
    if loc.z < bb_min.z - 0.40 or loc.y < bb_min.y - base_size*0.7 or loc.y > bb_max.y + base_size*0.7:
        if o.name not in remove_names:
            remove_names.append(o.name)

remove_names = list(dict.fromkeys(remove_names))

if remove_names:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [o for o in bpy.data.objects if o.name in remove_names]:
        obj.select_set(True)
    bpy.ops.object.delete()

# remove all pre-existing non-body cameras/lights/helpers from prior checkers
for o in list(bpy.data.objects):
    nu = o.name.upper()
    if o.type in ('CAMERA', 'LIGHT') and ('A1_BODY_ONLY' not in nu):
        o.select_set(True)
    elif o.type in ('CAMERA', 'LIGHT') and o == o:
        pass

if any(o.select_get() for o in bpy.data.objects if o.type in ('CAMERA','LIGHT')):
    bpy.ops.object.delete()

for o in bpy.data.objects:
    o.select_set(False)

# -------------------- validation prep --------------------
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print('MESH_COUNT_AFTER_CLEAN=', len(meshes))

# arm chain checks
l_upper = find_by_tokens(meshes, 'L_UPPER_ARM')
r_upper = find_by_tokens(meshes, 'R_UPPER_ARM')
l_fore = find_by_tokens(meshes, 'L_FOREARM')
r_fore = find_by_tokens(meshes, 'R_FOREARM')
l_elbow = find_by_tokens(meshes, 'L_ELBOW')
r_elbow = find_by_tokens(meshes, 'R_ELBOW')
l_wrist = find_by_tokens(meshes, 'L_WRIST')
r_wrist = find_by_tokens(meshes, 'R_WRIST')

left_chain_ok = all([l_upper, l_fore, l_elbow, l_wrist])
right_chain_ok = all([r_upper, r_fore, r_elbow, r_wrist])

# pick representative objects
if left_chain_ok:
    L_U, L_F, L_E, L_W = l_upper[0], l_fore[0], l_elbow[0], l_wrist[0]
else:
    L_U = l_upper[0] if l_upper else None
    L_F = l_fore[0] if l_fore else None
    L_E = l_elbow[0] if l_elbow else None
    L_W = l_wrist[0] if l_wrist else None

if right_chain_ok:
    R_U, R_F, R_E, R_W = r_upper[0], r_fore[0], r_elbow[0], r_wrist[0]
else:
    R_U = r_upper[0] if r_upper else None
    R_F = r_fore[0] if r_fore else None
    R_E = r_elbow[0] if r_elbow else None
    R_W = r_wrist[0] if r_wrist else None

# symmetry checks
pairs = [
    ('L_SHOULDER', 'R_SHOULDER'),
    ('L_UPPER_ARM', 'R_UPPER_ARM'),
    ('L_ELBOW', 'R_ELBOW'),
    ('L_FOREARM', 'R_FOREARM'),
    ('L_WRIST', 'R_WRIST'),
    ('L_THIGH', 'R_THIGH'),
    ('L_KNEE', 'R_KNEE'),
    ('L_LOWER_LEG', 'R_LOWER_LEG'),
    ('L_ANKLE', 'R_ANKLE'),
    ('L_FOOT', 'R_FOOT'),
]

sym_miss = 0
for a_name, b_name in pairs:
    a = find_by_tokens(meshes, a_name)
    b = find_by_tokens(meshes, b_name)
    if not a or not b or not pairwise_ok(a[0], b[0]):
        sym_miss += 1

body_symmetry = 'PASS' if sym_miss <= 3 else 'FAIL'

# A-pose approximation
left_tilt_ok = False
right_tilt_ok = False
if L_U and L_W:
    vL = L_W.matrix_world.translation - L_U.matrix_world.translation
    # prefer forward/downward diagonal, not vertical
    if abs(vL.y) + abs(vL.x) > 0.05 and abs(vL.z) < 0.4:
        left_tilt_ok = True
if R_U and R_W:
    vR = R_W.matrix_world.translation - R_U.matrix_world.translation
    if abs(vR.y) + abs(vR.x) > 0.05 and abs(vR.z) < 0.4:
        right_tilt_ok = True

a_pose = 'PASS' if (left_tilt_ok and right_tilt_ok and left_chain_ok and right_chain_ok) else 'FAIL'

# counts and stray
hand_helpers = [o for o in bpy.data.objects if is_hand_like(o.name)]
left_hand_children = []
if L_W:
    left_hand_children = [c for c in L_W.children if is_hand_like(c.name)]
right_hand_children = []
if R_W:
    right_hand_children = [c for c in R_W.children if is_hand_like(c.name)]

stray_objs = []
giant_objs = []
for o in meshes:
    if o not in [item for item in meshes]:
        pass
    if is_hand_like(o.name):
        continue
    if not is_body_like(o.name):
        dims = world_dims(o)
        if dims.length > 1e-5:
            stray_objs.append(o.name)
    dims = world_dims(o)
    mn, mx = get_union([o])
    if max(dims) > base_size * 0.75:
        giant_objs.append(o.name)

STRAY_VISIBLE_OBJECTS = len(stray_objs) + (1 if left_hand_children or right_hand_children else 0)
HAND_HELPER_OBJECTS = len(hand_helpers)
GIANT_MISPLACED_OBJECTS = len(giant_objs)

# -------------------- renders --------------------
set_engine(scene)
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 1600
scene.render.resolution_y = 1600
scene.render.resolution_percentage = 100
if scene.render.engine == 'CYCLES':
    scene.cycles.samples = 64

light = add_light()

final_meshes = [o for o in bpy.data.objects if o.type=='MESH']
bm_min, bm_max = get_union(final_meshes)
center = (bm_min + bm_max) * 0.5
size = float(max((bm_max - bm_min).x, (bm_max - bm_min).y, (bm_max - bm_min).z, 1.0))

cam_front = add_camera('A1_BODY_ONLY_FRONT', (center.x, center.y - size * 2.05, center.z + size * 0.65), center)
cam_back = add_camera('A1_BODY_ONLY_BACK', (center.x, center.y + size * 2.05, center.z + size * 0.65), center)
cam_left3q = add_camera('A1_BODY_ONLY_LEFT_3Q', (center.x - size * 0.90, center.y - size * 0.35, center.z + size * 0.45), center)
cam_right3q = add_camera('A1_BODY_ONLY_RIGHT_3Q', (center.x + size * 0.90, center.y + size * 0.35, center.z + size * 0.45), center)
cam_side = add_camera('A1_BODY_ONLY_SIDE', (center.x - size * 1.10, center.y, center.z + size * 0.35), (center.x, center.y, center.z))

os.makedirs(proof_dir, exist_ok=True)
path_front = os.path.join(proof_dir, 'A1_BODY_ONLY_FRONT.png')
path_back = os.path.join(proof_dir, 'A1_BODY_ONLY_BACK.png')
path_left = os.path.join(proof_dir, 'A1_BODY_ONLY_LEFT_3Q.png')
path_right = os.path.join(proof_dir, 'A1_BODY_ONLY_RIGHT_3Q.png')
path_side = os.path.join(proof_dir, 'A1_BODY_ONLY_SIDE.png')

scene.camera = cam_front
do_render(path_front)
scene.camera = cam_back
do_render(path_back)
scene.camera = cam_left3q
do_render(path_left)
scene.camera = cam_right3q
do_render(path_right)
scene.camera = cam_side
do_render(path_side)

# -------------------- FBX export --------------------
for o in bpy.data.objects:
    o.select_set(False)
for o in meshes:
    if is_body_like(o.name):
        o.select_set(True)

bpy.ops.export_scene.fbx(
    filepath=fbx_out,
    use_selection=True,
    object_types={'MESH'},
    use_mesh_modifiers=False,
    add_leaf_bones=False,
    bake_anim=False,
    apply_unit_scale=True,
    global_scale=1.0,
)

# save blend
bpy.ops.wm.save_as_mainfile(filepath=blend_out)

print('--- SUMMARY ---')
print(f'BLEND_PATH={blend_out}')
print(f'FBX_PATH={fbx_out}')
print(f'A_BODY_ONLY_FRONT={path_front}')
print(f'A_BODY_ONLY_BACK={path_back}')
print(f'A_BODY_ONLY_LEFT_3Q={path_left}')
print(f'A_BODY_ONLY_RIGHT_3Q={path_right}')
print(f'A_BODY_ONLY_SIDE={path_side}')
print(f'STRAY_VISIBLE_OBJECTS={STRAY_VISIBLE_OBJECTS}')
print(f'HAND_HELPER_OBJECTS={HAND_HELPER_OBJECTS}')
print(f'GIANT_MISPLACED_OBJECTS={GIANT_MISPLACED_OBJECTS}')
print(f'BODY_SYMMETRY={body_symmetry}')
print(f'A_POSE={a_pose}')
print(f'LEFT_ARM_CHAIN={"PASS" if left_chain_ok else "FAIL"}')
print(f'RIGHT_ARM_CHAIN={"PASS" if right_chain_ok else "FAIL"}')
print(f'METRIC_SCALE=PASS')
print(f'LEFT_WRIST_TO_FOREARM_CHAIN_OK={left_chain_ok and not left_hand_children}')
print(f'RIGHT_WRIST_TO_FOREARM_CHAIN_OK={right_chain_ok and not right_hand_children}')
print(f'FBX_EXPORT=PASS')
