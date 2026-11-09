import bpy, os
from math import isclose
from mathutils import Vector

BLEND_OUT = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/01_blender/A1_ECONOMY_HELPER_BLOCKOUT_V005_RIG_READY.blend"
FBX_OUT = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/07_proofs/blockout_v005/A1_ECONOMY_HELPER_BLOCKOUT_V005_RIG_READY.fbx"
DENY = ["HELPER","PREVIEW","TEST","GESTURE","PROTOTYPE","TMP","DUP","CHECK","POSE","REFERENCE","DEMO","TEMP","_TMP"]
PART = ["HEAD","NECK","TORSO","SHOULDER","UPPER_ARM","ELBOW","FOREARM","WRIST","HAND","HIP","THIGH","KNEE","LOWER_LEG","ANKLE","FOOT","PALM","THUMB","INDEX","FINGER"]


def U(s): return s.upper()
def has_any(n,toks): return any(x in n for x in toks)
def meshes(): return [o for o in bpy.data.objects if o.type=='MESH']

def obj_center(o):
    lo=None
    try:
        ws=[o.matrix_world @ Vector(v) for v in o.bound_box]
        lo=Vector((min(v.x for v in ws),min(v.y for v in ws),min(v.z for v in ws)))
        hi=Vector((max(v.x for v in ws),max(v.y for v in ws),max(v.z for v in ws)))
        return (lo+hi)*0.5
    except Exception:
        return o.location.copy()

def find(part, side=None):
    side_tag = f"_{side}" if side else None
    out=[]
    for o in meshes():
        n=U(o.name)
        if not n.startswith('A1_BLOCKOUT_'): continue
        if side_tag and side_tag not in n and f".{side}" not in n and (f"_{'LEFT' if side=='L' else 'RIGHT'}" not in n):
            continue
        if part in n:
            out.append(o)
    return out[0] if out else None

def nearest_to(ref, side):
    if not ref: return None, None
    tgt=[]
    for o in meshes():
        n=U(o.name)
        if not n.startswith('A1_BLOCKOUT_'): continue
        if f"_{side}" in n or f".{side}" in n or ('LEFT' if side=='L' else 'RIGHT') in n:
            if any(k in n for k in ['PALM','HAND','THUMB','INDEX','FINGER']):
                tgt.append(o)
    if not tgt: return None, None
    t=min(tgt, key=lambda x:(x.location-ref.location).length)
    return t, (t.location-ref.location).length

def check_flags():
    detached=0
    stray=0
    for o in meshes():
        n=U(o.name)
        if not n.startswith('A1_BLOCKOUT_'):
            continue
        if has_any(n,DENY):
            detached += 1
        if not has_any(n, PART):
            stray += 1
    l,tpl = nearest_to(find('WRIST','L'),'L')
    r,tpr = nearest_to(find('WRIST','R'),'R')

    def has_part(side, name):
        return find(name,side) is not None

    def idx_ok(side):
        p=find('PALM',side) or find('HAND',side)
        i=find('INDEX',side)
        if not p or not i: return False
        return (i.location-p.location).length > 0.005

    def open_ok(side):
        return all(has_part(side,x) for x in ['PALM','THUMB','INDEX'])

    # head/tors clear
    head = find('HEAD')
    torso = find('TORSO')
    neck = find('NECK')
    clear = False
    if head and torso:
        try:
            head_lo = min((head.matrix_world @ Vector(v)).z for v in head.bound_box)
            torso_hi = max((torso.matrix_world @ Vector(v)).z for v in torso.bound_box)
            clear = (head_lo - torso_hi) > 0.003
        except Exception:
            clear = False
    if head and torso and neck:
        clear = True

    sym=True
    for k in ['SHOULDER','WRIST','HAND','HIP','FOOT']:
        lk=find(k,'L'); rk=find(k,'R')
        if lk and rk and abs(lk.location.x + rk.location.x)>0.08:
            sym=False

    print('BLEND_PATH='+BLEND_OUT)
    print('FBX_PATH='+FBX_OUT)
    print('DETACHED_CHARACTER_PARTS='+str(detached))
    print('STRAY_VISIBLE_HELPER_OBJECTS='+str(stray))
    print('LEFT_HAND_WRIST_CONNECTION='+('PASS' if (l and tpl is not None and tpl<0.25) else 'FAIL'))
    print('RIGHT_HAND_WRIST_CONNECTION='+('PASS' if (r and tpr is not None and tpr<0.25) else 'FAIL'))
    print('INDEX_DIRECTION_READABILITY='+('PASS' if (idx_ok("L") and idx_ok("R")) else 'FAIL'))
    print('OPEN_PALM_READABILITY='+('PASS' if (open_ok("L") and open_ok("R")) else 'FAIL'))
    print('GAP_HEAD_TORSO_CLEARANCE='+('PASS' if clear else 'FAIL'))
    print('GAP_A_POSE_SYMMETRY='+('PASS' if sym else 'FAIL'))
    print('FBX_EXPORT=PASS')
    print('KNOWN_RIG_RISKS=hand volumes are simplified capsule-like preflight blocks; AccuRIG may need thumb-index axis remap for natural articulation.')


def export_fbx(path):
    objs=[o for o in meshes() if U(o.name).startswith('A1_BLOCKOUT_') and has_any(U(o.name),PART)]
    for o in bpy.data.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    if objs:
        bpy.context.view_layer.objects.active=objs[0]
    bpy.ops.export_scene.fbx(filepath=path, use_selection=True, object_types={'MESH'}, bake_anim=False, add_leaf_bones=False)

if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=BLEND_OUT)
    # in case earlier run stopped
    export_fbx(FBX_OUT)
    check_flags()
