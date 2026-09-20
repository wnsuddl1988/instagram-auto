import bpy
import os
from math import radians
from mathutils import Vector, Matrix

blend_out = r"C:\\Users\\PC\\jjy\\character-lab\\A1_ECONOMY_HELPER\\01_blender\\A1_ECONOMY_HELPER_BLOCKOUT_V005_HAND_REPAIRED_V2.blend"
proof_dir = r"C:\\Users\\PC\\jjy\\character-lab\\A1_ECONOMY_HELPER\\07_proofs\\blockout_v005"


def fmt(v):
    return tuple(round(float(x), 4) for x in v)


def world_dims(obj):
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    xs = [v.x for v in corners]
    ys = [v.y for v in corners]
    zs = [v.z for v in corners]
    return Vector((max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs)))


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
        bmin = Vector((0, 0, 0))
        bmax = Vector((0, 0, 0))
    return bmin, bmax


def nearest_wrist(o, wrists):
    nearest = None
    nearest_d = 1e9
    p = o.matrix_world.translation
    for w in wrists:
        d = (p - w.matrix_world.translation).length
        if d < nearest_d:
            nearest_d = d
            nearest = w
    return nearest, nearest_d


def set_render_engine(scene):
    enum_items = bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items
    names = [it.identifier for it in enum_items]
    if 'BLENDER_EEVEE_NEXT' in names:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    elif 'CYCLES' in names:
        scene.render.engine = 'CYCLES'
    else:
        scene.render.engine = 'BLENDER_WORKBENCH'


def add_sphere(name, parent, local_pos, local_scale, radius):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=12, ring_count=8, location=(0,0,0))
    obj = bpy.context.object
    obj.name = name
    obj.scale = Vector(local_scale)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.parent = parent
    obj.matrix_world = parent.matrix_world @ Matrix.Translation(local_pos)
    obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def add_finger(name, parent, local_pos, local_scale, radius, depth):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, vertices=16, location=(0,0,0))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = (radians(90), 0.0, 0.0)
    obj.scale = Vector(local_scale)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.parent = parent
    obj.matrix_world = parent.matrix_world @ Matrix.Translation(local_pos)
    obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def add_camera(name, location, target, ortho=False, ortho_scale=0.6):
    bpy.ops.object.camera_add(location=location)
    cam = bpy.context.object
    cam.name = name
    cam.data.lens = 40
    v = Vector(target) - Vector(location)
    cam.rotation_euler = v.to_track_quat('-Z', 'Y').to_euler()
    if ortho:
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = ortho_scale
    else:
        cam.data.type = 'PERSP'
    return cam


def render_to(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


print('=== PHASE 1: SCENE DIAGNOSTIC ===')
all_objs = list(bpy.data.objects)
wrists = [o for o in all_objs if 'WRIST' in o.name.upper()]
left_wrist = next((o for o in wrists if '_L_' in o.name.upper() or o.name.upper().endswith('_L_WRIST')), None)
right_wrist = next((o for o in wrists if '_R_' in o.name.upper() or o.name.upper().endswith('_R_WRIST')), None)
print('WRISTS=', [o.name for o in wrists])

hand_related = [o for o in all_objs if any(x in o.name.upper() for x in ['HAND', 'PALM', 'THUMB', 'INDEX', 'FINGER', 'REPAIR', 'V005'])]
for o in sorted(hand_related, key=lambda v: v.name):
    if o.type != 'MESH':
        continue
    _, d = nearest_wrist(o, wrists)
    print(o.name, 'parent=', o.parent.name if o.parent else 'NONE', 'loc=', fmt(o.matrix_world.translation), 'rot=', fmt(o.rotation_euler), 'scale=', fmt(o.scale), 'dims=', fmt(world_dims(o)), 'nearest_wrist=', round(float(d), 6))

# Character-size baseline
char_mesh = [o for o in all_objs if o.type=='MESH' and o.name.startswith('A1_BLOCKOUT_') and 'CAM' not in o.name.upper() and 'HAND_' not in o.name.upper()]
bmn, bmx = get_union(char_mesh)
char_size = float(max((bmx-bmn).x, (bmx-bmn).y, (bmx-bmn).z, 1e-6))

candidates = []
for o in hand_related:
    if o.type != 'MESH':
        continue
    dims = world_dims(o)
    if max(dims) > char_size * 0.65:
        candidates.append(o.name)
print('OFFENDING_CANDIDATES=', candidates)

# Remove only old hand helpers
remove = []
remove_names = []
remove_patterns = ['A1_BLOCKOUT_HAND_L_', 'A1_BLOCKOUT_HAND_R_']
for o in list(bpy.data.objects):
    if o.type != 'MESH':
        continue
    name_u = o.name.upper()
    if any(p in name_u for p in remove_patterns):
        if any(t in name_u for t in ['HAND', 'PALM', 'THUMB', 'INDEX', 'FINGER']):
            remove.append(o)
            remove_names.append(o.name)

if remove:
    bpy.ops.object.select_all(action='DESELECT')
    for o in remove:
        o.select_set(True)
    bpy.ops.object.delete()
print('REMOVED_HAND_OBJECTS=', remove_names)

all_objs = list(bpy.data.objects)
wrists = [o for o in all_objs if 'WRIST' in o.name.upper()]
left_wrist = next((o for o in wrists if '_L_' in o.name.upper() or o.name.upper().endswith('_L_WRIST')), None)
right_wrist = next((o for o in wrists if '_R_' in o.name.upper() or o.name.upper().endswith('_R_WRIST')), None)
if left_wrist is None or right_wrist is None:
    raise RuntimeError('WRIST_MISSING')


def build_hand(side, wrist):
    sign = -1.0 if side == 'L' else 1.0
    palm = add_sphere('A1_BLOCKOUT_' + side + '_PALM', wrist, Vector((0.0, 0.0, 0.0)), (0.22, 0.16, 0.12), radius=1.0)
    thumb = add_sphere('A1_BLOCKOUT_' + side + '_THUMB', palm, Vector((0.035 * sign, -0.012, -0.008)), (0.72, 0.68, 0.68), radius=0.16)
    index = add_finger('A1_BLOCKOUT_' + side + '_INDEX', palm, Vector((0.0, 0.055, 0.024)), (1.0, 1.0, 1.55), radius=0.022, depth=0.17)
    mass = add_sphere('A1_BLOCKOUT_' + side + '_OTHER_FINGER_MASS', palm, Vector((-0.02 * sign, 0.03, -0.006)), (0.95, 0.90, 1.02), radius=0.10)
    return {'wrist': wrist, 'palm': palm, 'thumb': thumb, 'index': index, 'mass': mass}

hands = {
    'L': build_hand('L', left_wrist),
    'R': build_hand('R', right_wrist),
}

# Post-fix diagnostics
all_objs = list(bpy.data.objects)
hand_parts = [o for o in all_objs if o.type=='MESH' and ('_PALM' in o.name.upper() or '_THUMB' in o.name.upper() or '_INDEX' in o.name.upper() or '_OTHER_FINGER_MASS' in o.name.upper()) and (o.name.startswith('A1_BLOCKOUT_L_') or o.name.startswith('A1_BLOCKOUT_R_'))]

body_mesh = [o for o in all_objs if o.type == 'MESH' and o.name.startswith('A1_BLOCKOUT_') and '_PALM' not in o.name.upper() and '_INDEX' not in o.name.upper() and '_THUMB' not in o.name.upper() and '_OTHER_FINGER_MASS' not in o.name.upper()]
bmn2, bmx2 = get_union(body_mesh)
body_size2 = float(max((bmx2-bmn2).x, (bmx2-bmn2).y, (bmx2-bmn2).z, 1e-6))

giant_objs = []
for o in hand_parts:
    dims = world_dims(o)
    if max(dims) > body_size2 * 0.55 or (dims.x*dims.y*dims.z) > 0.06*(body_size2**3):
        giant_objs.append(o.name)

detached = []
for o in hand_parts:
    _, d = nearest_wrist(o, [left_wrist, right_wrist])
    if d > 0.12:
        detached.append(o.name)

left_palm = hands['L']['palm']
right_palm = hands['R']['palm']
left_dist = (left_palm.matrix_world.translation - left_wrist.matrix_world.translation).length
right_dist = (right_palm.matrix_world.translation - right_wrist.matrix_world.translation).length

dup_left = len([o for o in hand_parts if o.name.upper().endswith('_L_PALM')])
dup_right = len([o for o in hand_parts if o.name.upper().endswith('_R_PALM')])

l_fore = next((o for o in all_objs if 'L_FOREARM' in o.name.upper()), None)
r_fore = next((o for o in all_objs if 'R_FOREARM' in o.name.upper()), None)
lfd = max(world_dims(l_fore)) if l_fore else 0.5
rfd = max(world_dims(r_fore)) if r_fore else 0.5
lscale = float(max(world_dims(left_palm)) / max(lfd,1e-6))
rscale = float(max(world_dims(right_palm)) / max(rfd,1e-6))

print('=== PHASE 3: VALIDATION ===')
print('GIANT_MISPLACED_HAND_OBJECTS=', len(giant_objs))
print('DETACHED_HAND_HELPERS=', len(detached))
print('DUPLICATE_PALMS=', int((dup_left>1) or (dup_right>1)))
print('LEFT_HAND_DISTANCE_FROM_LEFT_WRIST=', round(float(left_dist), 6))
print('RIGHT_HAND_DISTANCE_FROM_RIGHT_WRIST=', round(float(right_dist), 6))
print('LEFT_HAND_SCALE=', round(lscale, 6))
print('RIGHT_HAND_SCALE=', round(rscale, 6))
print('GIANT_HAND_LIST=', giant_objs)
print('DETACHED_LIST=', detached)
print('PHASE3_PASS=', len(giant_objs)==0 and len(detached)==0 and dup_left==1 and dup_right==1)

# Require strict clean-up before rendering
if not (len(giant_objs)==0 and len(detached)==0 and dup_left==1 and dup_right==1):
    raise RuntimeError('VALIDATION_FAIL')

# baseline pose save
baseline = {}
for side, pack in hands.items():
    for k in ['palm','thumb','index','mass']:
        baseline[pack[k].name] = pack[k].matrix_world.copy()

scene = bpy.context.scene
set_render_engine(scene)
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.resolution_x = 1600
scene.render.resolution_y = 1600
scene.render.resolution_percentage = 100
if scene.render.engine == 'CYCLES':
    scene.cycles.samples = 64

os.makedirs(proof_dir, exist_ok=True)

if not any(o for o in bpy.data.objects if o.type == 'LIGHT'):
    bpy.ops.object.light_add(type='AREA', location=(0.0, -2.0, 2.2))
    l = bpy.context.object
    l.name = 'A1_V005_V2_KEY'
    l.data.energy = 900
    l.data.size = 1.5
    l.rotation_euler = (radians(55), 0.0, radians(18))

all_vis = [o for o in all_objs if o.type=='MESH']
mn, mx = get_union(all_vis)
center = (mn + mx) * 0.5
size = float(max((mx-mn).x, (mx-mn).y, (mx-mn).z, 1e-6))

cam_front = add_camera('A1_V005_V2_FRONT', (center.x, center.y - size*2.15, center.z + size*0.55), center, ortho=False)
cam_left_close = add_camera('A1_V005_V2_LEFT_CLOSE', (center.x - 0.16, center.y + 0.05, center.z + 0.12), center + Vector((0,0,0.05)), ortho=True, ortho_scale=max(size*0.38,0.15))
cam_right_close = add_camera('A1_V005_V2_RIGHT_CLOSE', (center.x + 0.16, center.y + 0.05, center.z + 0.12), center + Vector((0,0,0.05)), ortho=True, ortho_scale=max(size*0.38,0.15))
cam_side = add_camera('A1_V005_V2_SIDE', (center.x + 0.05, center.y - size*1.2, center.z + 0.35), center, ortho=False)

path_map = {
    'FULL_FRONT': os.path.join(proof_dir, 'A1_HAND_REPAIR_V2_FULL_FRONT.png'),
    'LEFT_CLOSE': os.path.join(proof_dir, 'A1_HAND_REPAIR_V2_LEFT_WRIST_CLOSEUP.png'),
    'RIGHT_CLOSE': os.path.join(proof_dir, 'A1_HAND_REPAIR_V2_RIGHT_WRIST_CLOSEUP.png'),
    'OPEN_PALM': os.path.join(proof_dir, 'A1_HAND_REPAIR_V2_OPEN_PALM.png'),
    'POINT_LEFT': os.path.join(proof_dir, 'A1_HAND_REPAIR_V2_POINT_LEFT.png'),
    'POINT_RIGHT': os.path.join(proof_dir, 'A1_HAND_REPAIR_V2_POINT_RIGHT.png'),
}

# 1) full neutral
scene.camera = cam_front
render_to(path_map['FULL_FRONT'])

# 2) closeups
scene.camera = cam_left_close
render_to(path_map['LEFT_CLOSE'])
scene.camera = cam_right_close
render_to(path_map['RIGHT_CLOSE'])

# 3) open palm check
hands['L']['palm'].rotation_euler = (0.0, 0.0, radians(15.0))
hands['R']['palm'].rotation_euler = (0.0, 0.0, radians(-15.0))
hands['L']['thumb'].rotation_euler = (0.0, 0.0, radians(20.0))
hands['R']['thumb'].rotation_euler = (0.0, 0.0, radians(-20.0))
scene.camera = cam_side
render_to(path_map['OPEN_PALM'])

# 4) point left
for key in ['index', 'palm']:
    hands['L'][key].matrix_world = baseline[hands['L'][key].name]

hands['L']['index'].location += Vector((-0.028, 0.006, 0.0))
hands['L']['index'].rotation_euler = (0.0, 0.0, radians(-60.0))
hands['L']['palm'].rotation_euler = (0.0, 0.0, radians(20.0))
scene.camera = cam_side
render_to(path_map['POINT_LEFT'])

# 5) point right
for key in ['index', 'palm']:
    hands['R'][key].matrix_world = baseline[hands['R'][key].name]

hands['R']['index'].location += Vector((0.028, 0.006, 0.0))
hands['R']['index'].rotation_euler = (0.0, 0.0, radians(60.0))
hands['R']['palm'].rotation_euler = (0.0, 0.0, radians(-20.0))
scene.camera = cam_side
render_to(path_map['POINT_RIGHT'])

# restore baseline
for name, m in baseline.items():
    if name in bpy.data.objects:
        bpy.data.objects[name].matrix_world = m

# save
bpy.ops.wm.save_as_mainfile(filepath=blend_out)

print('=== PHASE 4: FINAL ===')
print('ROOT_CAUSE=giant misplaced mesh came from A1_BLOCKOUT_HAND_L_FINGER and A1_BLOCKOUT_HAND_R_FINGER being reused as palm roots with huge effective scale/world transform and children attached to them, causing oversized geometry and apparent detachment')
print('OFFENDING_OBJECTS=["A1_BLOCKOUT_HAND_L_FINGER","A1_BLOCKOUT_HAND_R_FINGER"]')
print('LEFT_TRANSFORM_SUMMARY=' + str(fmt(hands['L']['palm'].matrix_world.translation))
)
print('RIGHT_TRANSFORM_SUMMARY=' + str(fmt(hands['R']['palm'].matrix_world.translation))
)
print('LEFT_WRIST_TO_HAND_ATTACHMENT=', round(float((hands['L']['palm'].matrix_world.translation - hands['L']['wrist'].matrix_world.translation).length), 6))
print('RIGHT_WRIST_TO_HAND_ATTACHMENT=', round(float((hands['R']['palm'].matrix_world.translation - hands['R']['wrist'].matrix_world.translation).length), 6))
print('DETACHED_HELPER_COUNT=', len(detached))
print('DUPLICATE_HAND_OBJECT_COUNT=', (dup_left + dup_right - 2))
for k, v in path_map.items():
    print(k, '=', v)
print('BLEND_PATH=', blend_out)
