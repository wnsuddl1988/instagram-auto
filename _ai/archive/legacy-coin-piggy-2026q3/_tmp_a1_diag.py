import bpy, bmesh, math
from mathutils import Vector

blend_path = r"C:\\Users\\PC\\jjy\\character-lab\\A1_ECONOMY_HELPER\\01_blender\\A1_ECONOMY_HELPER_BLOCKOUT_V005_HAND_REPAIRED.blend"

# Load blend fresh in this script context
# (Blender already opens blend file via --background <file>, so this script runs inside it)

print('--- DIAGNOSIS START ---')
scene = bpy.context.scene

# helper functions

def safe_loc_rot_scale(o):
    return [tuple(round(v, 4) for v in o.location), tuple(round(v, 4) for v in o.rotation_euler), tuple(round(v, 4) for v in o.scale)]

def obj_bbox_world_dims(obj):
    mw = obj.matrix_world
    # world-space bbox corners
    corners = [mw @ Vector(corner) for corner in obj.bound_box]
    xs = [c.x for c in corners]; ys = [c.y for c in corners]; zs = [c.z for c in corners]
    return (max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))

def has_dup_name(obj_name, names_set):
    return names_set.get(obj_name, 0) > 1

# all object names and duplicate count
name_counts = {}
for o in bpy.data.objects:
    name_counts[o.name] = name_counts.get(o.name,0)+1

keywords = ['HAND','PALM','THUMB','INDEX','FINGER','WRIST','FOREARM','ELBOW']

print('TOTAL_OBJECTS=', len(bpy.data.objects))

# collect candidate hand/limb objects
hand_related = []
for o in bpy.data.objects:
    up = o.name.upper()
    if any(k in up for k in keywords):
        hand_related.append(o)

# body scale for comparison
body_candidates = [o for o in bpy.data.objects if o.type == 'MESH' and 'BODY' in o.name.upper()]
body_max_dim = 0.0
for o in body_candidates:
    dims = obj_bbox_world_dims(o)
    body_max_dim = max(body_max_dim, max(dims))
if not body_candidates:
    # fallback: all mesh
    for o in bpy.data.objects:
        if o.type=='MESH':
            dims = obj_bbox_world_dims(o)
            body_max_dim = max(body_max_dim, max(dims))
body_ref = max(body_max_dim, 1e-6)
print('BODY_REF_MAX_DIM=', round(body_ref,4))

# wrists
wrists = [o for o in bpy.data.objects if 'WRIST' in o.name.upper()]
print('WRISTS=', [o.name for o in wrists])

# classify hand objects by side
sides = {'L':('LEFT','L_','L '), 'R':('RIGHT','R_','R ')}

print('\n--- HAND-RELATED OBJECT DETAIL ---')
for o in sorted(hand_related, key=lambda x:x.name):
    up = o.name.upper()
    loc, rot, scl = safe_loc_rot_scale(o)
    dims = obj_bbox_world_dims(o)
    vol = dims[0]*dims[1]*dims[2]
    # applied transforms check
    eps = 1e-4
    applied_rot = (abs(rot[0])<eps and abs(rot[1])<eps and abs(rot[2])<eps)
    applied_scale = all(abs(v-1.0)<1e-4 for v in scl)
    hidden = o.hide_viewport or o.hide_render
    dup = (name_counts.get(o.name,0) > 1)
    parent = o.parent.name if o.parent else 'NONE'
    is_hand_related = any(k in up for k in ['HAND','PALM','THUMB','INDEX','FINGER'])

    # distance to nearest wrist by world coordinates
    o_center = o.matrix_world.translation
    nearest = None
    nearest_dist = 1e9
    for w in wrists:
        d = (o_center - w.matrix_world.translation).length
        if d < nearest_dist:
            nearest_dist = d
            nearest = w.name

    print(f"{o.name}")
    print(f"  type={o.type} parent={parent} side={up}")
    print(f"  location={loc} rotation_euler={rot} scale={scl}")
    print(f"  origin_world={tuple(round(v,4) for v in o.matrix_world.translation)}")
    print(f"  world_dims={tuple(round(d,4) for d in dims)} world_volume={round(vol,5)}")
    print(f"  hidden_vp_render={hidden}")
    print(f"  transforms_applied_like(loc_rot_scale_unit): rot_near_zero={applied_rot} scale_unit={applied_scale}")
    print(f"  duplicated_name={dup}")
    print(f"  nearest_wrist={nearest} dist={round(float(nearest_dist),4)}")
    if is_hand_related:
        # flag obviously abnormal relative to body
        bad = vol > (body_ref*body_ref*body_ref*0.08)
        print(f"  abnormal_volume_vs_bodyRef={bad}")
    print()

print('--- POTENTIAL GIANT / MISPLACED OBJECTS (volume > 0.08*body^3 or dist from center > 2*body_ref) ---')
scene_center = Vector((0,0,0))
for o in bpy.data.objects:
    if o.type!='MESH':
        continue
    dims = obj_bbox_world_dims(o)
    vol = dims[0]*dims[1]*dims[2]
    maxdim = max(dims)
    near_origin = o.matrix_world.translation.length
    abnormal = vol > body_ref**3*0.08 or maxdim > body_ref*0.85 or near_origin > body_ref*8
    if abnormal:
        print(f"  {o.name}: maxdim={round(maxdim,4)} volume={round(vol,5)} origin_distance={round(near_origin,4)}")

# Detect duplicates by naming pattern
print('\n--- DUPLICATE BASENAMES (case-insensitive substring) ---')
seen=set();
for o in bpy.data.objects:
    key=o.name.upper().replace(' ', '_')
    if key in seen:
        # likely auto-numbered duplicates
        pass
    seen.add(key)

dup_names={}
for n,c in name_counts.items():
    if c>1:
        dup_names[n]=c
print('duplicate_exact_names=',dup_names)

# detect object names likely helpers
helper_terms=['TMP','TEST','DEBUG','DUMMY','PROTOTYPE','HELPER','CHECK','CHECKER','POINT','PREVIEW','DUP','COPY']
helpers=[]
for o in bpy.data.objects:
    up=o.name.upper()
    if any(t in up for t in helper_terms):
        helpers.append(o.name)
print('helper_like_names=',helpers)

# check candidate detached hand components not close to wrists
hand_only=[o for o in hand_related if any(k in o.name.upper() for k in ['HAND','PALM','THUMB','INDEX','FINGER'])]
for o in hand_only:
    pmin=1e9
    pname=None
    oc=o.matrix_world.translation
    for w in wrists:
        d=(oc-w.matrix_world.translation).length
        if d<pmin:
            pmin=d; pname=w.name
    if pmin > 0.8:
        print(f"DETACHED_RISK: {o.name} dist_to_nearest_wrist={round(float(pmin),4)} (nearest={pname})")

print('--- DIAGNOSIS END ---')
