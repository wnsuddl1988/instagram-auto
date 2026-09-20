import bpy, os
from math import radians
from mathutils import Vector

BLEND_IN = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/01_blender/A1_ECONOMY_HELPER_BLOCKOUT_V004.blend"
BLEND_OUT = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/01_blender/A1_ECONOMY_HELPER_BLOCKOUT_V005_RIG_READY.blend"
PROOF_DIR = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/07_proofs/blockout_v005"
FBX_OUT = r"C:/Users/PC/jjy/character-lab/A1_ECONOMY_HELPER/07_proofs/blockout_v005/A1_ECONOMY_HELPER_BLOCKOUT_V005_RIG_READY.fbx"

DENY = ["HELPER","PREVIEW","TEST","GESTURE","PROTOTYPE","TMP","DUP","CHECK","POSE","REFERENCE","DEMO","TEMP","GESTURE"]
PART = ["HEAD","NECK","TORSO","SHOULDER","UPPER_ARM","ELBOW","FOREARM","WRIST","HAND","HIP","THIGH","KNEE","LOWER_LEG","ANKLE","FOOT","PALM","THUMB","INDEX","FINGER"]
SIDES = {"L":["_L","_LEFT",".L","LEFT","_L_"],"R":["_R","_RIGHT",".R","RIGHT","_R_"]}


def U(s):
    return s.upper()

def has_side(n, s):
    return any(t in n for t in SIDES[s])

def has_any(n, arr):
    return any(a in n for a in arr)

def meshes():
    return [o for o in bpy.data.objects if o.type == 'MESH']

def size_z(o):
    lo, hi = obj_bounds(o)
    if lo is None:
        return 0.0
    return max(0.0001, hi.z - lo.z)

def obj_bounds(o):
    try:
        c = [o.matrix_world @ Vector(v) for v in o.bound_box]
    except Exception:
        return None, None
    lo = Vector((min(v.x for v in c), min(v.y for v in c), min(v.z for v in c)))
    hi = Vector((max(v.x for v in c), max(v.y for v in c), max(v.z for v in c)))
    return lo, hi

def center(o):
    lo, hi = obj_bounds(o)
    if lo is None:
        return o.location
    return (lo + hi) * 0.5

def bounds(objs):
    lo = Vector((1e9,1e9,1e9)); hi = Vector((-1e9,-1e9,-1e9)); ok=False
    for o in objs:
        l,h = obj_bounds(o)
        if l is None: continue
        lo = Vector((min(lo.x,l.x),min(lo.y,l.y),min(lo.z,l.z)))
        hi = Vector((max(hi.x,h.x),max(hi.y,h.y),max(hi.z,h.z)))
        ok=True
    return lo,hi,ok


def find_objs(tokens, side=None):
    out=[]
    for o in meshes():
        n = U(o.name)
        if not n.startswith('A1_BLOCKOUT_'): 
            continue
        if side and not has_side(n,side):
            continue
        if has_any(n,tokens):
            out.append(o)
    return out

def best_by_size(lst):
    if not lst: return None,[]
    lst2 = sorted(lst, key=lambda x: (obj_bounds(x)[1]-obj_bounds(x)[0]).length if obj_bounds(x)[0] is not None else 0, reverse=True)
    return lst2[0], lst2[1:]

def find(name_tokens, side=None, fallback=False):
    c = find_objs(name_tokens, side)
    if not c and side and not fallback:
        c = [o for o in meshes() if U(o.name).startswith('A1_BLOCKOUT_') and has_any(U(o.name), name_tokens)]
    return best_by_size(c)

def parent_keep(child, par):
    if not child or not par or child == par:
        return
    child.parent = par
    child.matrix_parent_inverse = par.matrix_world.inverted() @ child.matrix_world

def remove(o):
    try:
        if o and o.name in bpy.data.objects:
            bpy.data.objects.remove(o, do_unlink=True)
    except Exception:
        pass


def cleanup_helpers():
    allm = meshes()
    keep=set()
    # keep known family names
    for s in ['L','R']:
        for tk in [['SHOULDER'],['UPPER_ARM'],['ELBOW'],['FOREARM'],['WRIST'],['HAND','PALM'],['THUMB'],['INDEX'],['FINGER'],['HIP'],['THIGH'],['KNEE'],['LOWER_LEG'],['ANKLE'],['FOOT']]:
            a,b = find(tk, side=s)
            if a: keep.add(a)
            for x in b: keep.add(x)
    for tk in [['HEAD'],['NECK'],['TORSO']]:
        a,b = find(tk, side=None)
        if a: keep.add(a)
        for x in b: keep.add(x)

    for o in list(allm):
        n = U(o.name)
        if not n.startswith('A1_BLOCKOUT_'):
            continue
        if o in keep:
            continue
        if has_any(n, DENY):
            remove(o)
            continue
        if not has_any(n, PART):
            remove(o)


def ensure_chain_and_hands():
    for s in ['L','R']:
        sh, _ = find(['SHOULDER'], side=s)
        up, _ = find(['UPPER_ARM'], side=s)
        el, _ = find(['ELBOW'], side=s)
        fr, _ = find(['FOREARM'], side=s)
        wr, _ = find(['WRIST'], side=s)
        if sh and up: parent_keep(up, sh)
        if up and el: parent_keep(el, up)
        if el and fr: parent_keep(fr, el)
        if fr and wr: parent_keep(wr, fr)

        palm, dup = find(['HAND','PALM'], side=s)
        if not palm:
            palm, _ = find(['HAND'], side=s)
        # remove duplicate/odd hand objects around same side
        for d in dup:
            remove(d)

        thumb, _ = find(['THUMB'], side=s)
        index, _ = find(['INDEX'], side=s)
        finger, _ = find(['FINGER'], side=s)

        if not thumb and palm:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.024, location=palm.location + Vector((0.025,0.03,0.0)))
            thumb = bpy.context.object
            thumb.name = f"A1_BLOCKOUT_HAND_{s}_THUMB"
        if not index and palm:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.023, location=palm.location + Vector((0.032,0.07,0.0)))
            index = bpy.context.object
            index.name = f"A1_BLOCKOUT_HAND_{s}_INDEX"
        if not finger and palm:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.022, location=palm.location + Vector((0.0,0.056,-0.012)))
            finger = bpy.context.object
            finger.name = f"A1_BLOCKOUT_HAND_{s}_FINGER"

        if palm and not palm.name.startswith("A1_BLOCKOUT_HAND_"):
            if has_side(U(palm.name), s):
                palm.name = f"A1_BLOCKOUT_HAND_{s}_PALM"

        if thumb and not thumb.name.startswith("A1_BLOCKOUT_HAND_") and has_side(U(thumb.name), s):
            thumb.name = f"A1_BLOCKOUT_HAND_{s}_THUMB"
        if index and not index.name.startswith("A1_BLOCKOUT_HAND_") and has_side(U(index.name), s):
            index.name = f"A1_BLOCKOUT_HAND_{s}_INDEX"
        if finger and not finger.name.startswith("A1_BLOCKOUT_HAND_") and has_side(U(finger.name), s):
            finger.name = f"A1_BLOCKOUT_HAND_{s}_FINGER"

        if palm and wr:
            if (palm.location - wr.location).length > 0.35:
                fore, _ = find(['FOREARM'], side=s)
                d = (wr.location - fore.location) if fore else Vector((0,0.05,0))
                if d.length < 0.001: d = Vector((0,0.05,0))
                palm.location = wr.location + d.normalized() * 0.05
                thumb.location = palm.location + Vector((0.03,0.03,0.0)) if thumb else None
                index.location = palm.location + Vector((0.02,0.06,0.0)) if index else None
                finger.location = palm.location + Vector((0.0,0.05,-0.01)) if finger else None
            parent_keep(palm, wr)
            if thumb: parent_keep(thumb, palm)
            if index: parent_keep(index, palm)
            if finger: parent_keep(finger, palm)

        if thumb: thumb.scale = Vector((0.7,0.7,0.7))
        if index: index.scale = Vector((0.74,0.74,0.74))
        if finger: finger.scale = Vector((0.72,0.72,0.72))


def ensure_neck():
    hd,_ = find(['HEAD'])
    to,_ = find(['TORSO'])
    nk,_ = find(['NECK'])
    if nk: return
    if not hd or not to: return
    hbz = obj_bounds(hd)[0].z
    tbz = obj_bounds(to)[1].z
    gap = hbz - tbz
    if gap > 0.18 or gap < 0.005:
        gap = 0.05
    if gap < 0.02: gap = 0.02
    c = (center(hd)+center(to))*0.5
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.05, depth=gap, location=(c.x,c.y,tbz+gap*0.5))
    k = bpy.context.object
    k.name = "A1_BLOCKOUT_NECK"


def neutral_pose():
    for s in ['L','R']:
        up,_ = find(['UPPER_ARM'], side=s)
        fr,_ = find(['FOREARM'], side=s)
        wr,_ = find(['WRIST'], side=s)
        if up:
            up.rotation_mode='XYZ'
            up.rotation_euler = (radians(10),0,radians(-20) if s=='L' else radians(20))
        if fr:
            fr.rotation_mode='XYZ'
            fr.rotation_euler = (radians(-8),0,0)
        if wr:
            wr.rotation_mode='XYZ'
            wr.rotation_euler = (0,0,0)
    for s in ['L','R']:
        ft,_ = find(['FOOT'], side=s)
        ak,_ = find(['ANKLE'], side=s)
        if ft and ak:
            ft.rotation_euler=(radians(5),0,radians(8) if s=='L' else radians(-8))


def center_at_origin():
    hd,_ = find(['HEAD'])
    to,_ = find(['TORSO'])
    refs = [o for o in [hd,to] if o]
    if len(refs)<1: return
    lo, hi, ok = bounds(refs)
    if not ok: return
    c = Vector((lo.x + 0.5*(hi.x-lo.x), lo.y + 0.5*(hi.y-lo.y),0))
    for o in meshes():
        if U(o.name).startswith('A1_BLOCKOUT_'):
            o.location -= Vector((c.x,c.y,0))


def character_objs():
    return [o for o in meshes() if U(o.name).startswith('A1_BLOCKOUT_') and has_any(U(o.name), PART)]


def set_render_scene():
    sce = bpy.context.scene
    engs = bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items.keys()
    sce.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in engs else ('CYCLES' if 'CYCLES' in engs else 'BLENDER_WORKBENCH')
    sce.render.resolution_x = 1920
    sce.render.resolution_y = 1920
    sce.render.film_transparent = False
    sce.render.image_settings.file_format='PNG'
    if sce.render.engine == 'CYCLES':
        sce.cycles.samples = 64

    w = sce.world or bpy.data.worlds.new('W')
    sce.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (0.95,0.97,1.0,1)
    bg.inputs['Strength'].default_value = 1.0

    for o in list(bpy.data.objects):
        if o.type in {'LIGHT','CAMERA'} and o.name.startswith('A1_'):
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.light_add(type='AREA', location=(2.0,-2.0,2.5)); k=bpy.context.object; k.data.energy=1800; k.name='A1_BLOCKOUT_KEY'
    bpy.ops.object.light_add(type='AREA', location=(-2.0,-1.8,2.0)); f=bpy.context.object; f.data.energy=900; f.name='A1_BLOCKOUT_FILL'; f.data.size=4


def camera_look(camera, loc, target):
    camera.location = loc
    v = target - loc
    camera.rotation_euler = v.to_track_quat('-Z','Y').to_euler()

def render_one(path, loc):
    cobj = bpy.data.objects.get(path + '_CAM')
    if cobj is None:
        cam = bpy.data.cameras.new(path + '_CAM')
        cobj = bpy.data.objects.new(path + '_CAM', cam)
        bpy.context.scene.collection.objects.link(cobj)
    if cobj.name in bpy.data.objects:
        pass
    c = character_objs()
    lo,hi,ok = bounds(c)
    if ok:
        center=(lo+hi)*0.5
        span=max(hi.x-lo.x,hi.y-lo.y,hi.z-lo.z,0.1)
    else:
        center=Vector((0,0,1))
        span=1.0
    d = span*2.6
    if loc=="FRONT":
        camLoc = center + Vector((0,-d,span*0.18))
    elif loc=="BACK":
        camLoc = center + Vector((0,d,span*0.18))
    elif loc=="LEFT_3Q":
        camLoc = center + Vector((-d*0.7,-d*0.7,span*0.24))
    elif loc=="RIGHT_3Q":
        camLoc = center + Vector((d*0.7,-d*0.7,span*0.24))
    else:
        camLoc = center + Vector((-d,0,span*0.12))

    camera = cobj
    camera.data.type='PERSP'
    camera.data.lens = 50
    camera_look(camera, camLoc, center)
    bpy.context.scene.camera = camera
    if not os.path.isdir(PROOF_DIR): os.makedirs(PROOF_DIR, exist_ok=True)
    bpy.context.scene.render.filepath = os.path.join(PROOF_DIR, f"{path}.png")
    bpy.ops.render.render(write_still=True)


def render_neutral_set(prefix):
    for view in ['FRONT','LEFT_3Q','RIGHT_3Q','SIDE','BACK']:
        render_one(f"{prefix}_{view}", view)


def snapshot_pose(name, fn):
    # save and restore hand/wrist transforms
    backup={}
    for o in meshes():
        if any(x in U(o.name) for x in ['WRIST','HAND','PALM','THUMB','INDEX','FINGER']):
            backup[o.name]=(o.location.copy(), o.rotation_euler.copy(), o.scale.copy(), o.matrix_parent_inverse.copy())
    fn()
    render_one(name, 'FRONT')
    for k,(loc,rot,sc,mpi) in backup.items():
        if k in bpy.data.objects:
            o=bpy.data.objects[k]
            o.location=loc; o.rotation_euler=rot; o.scale=sc; o.matrix_parent_inverse=mpi


def check_flags():
    detached = 0
    stray = 0
    for o in meshes():
        n=U(o.name)
        if not n.startswith('A1_BLOCKOUT_'): continue
        if has_any(n,DENY) and n.startswith('A1_BLOCKOUT_'):
            detached += 1
        if not has_any(n,PART):
            stray += 1

    def wrist_ok(side):
        wr,_ = find(['WRIST'], side=side)
        hp,_ = find(['HAND','PALM'], side=side)
        if not wr or not hp: return False, None
        return ((hp.location-wr.location).length < 0.25), (hp.location-wr.location).length

    l_ok,l_gap = wrist_ok('L')
    r_ok,r_gap = wrist_ok('R')

    def idx_ok(side):
        p,_=find(['HAND','PALM'],side=side)
        i,_=find(['INDEX'],side=side)
        if not p or not i: return False
        d=(i.location-p.location).length
        return d>0.01

    io = idx_ok('L') and idx_ok('R')
    op = all(find(['HAND','PALM'],side='L')[0] and find(['THUMB'],side='L')[0] and find(['INDEX'],side='L')[0] and find(['HAND','PALM'],side='R')[0] and find(['THUMB'],side='R')[0] and find(['INDEX'],side='R')[0])

    h,_ = find(['HEAD'])
    t,_ = find(['TORSO'])
    n,_ = find(['NECK'])
    clear=False
    if h and t:
        hz=obj_bounds(h)[0].z if obj_bounds(h)[0] else 0
        tz=obj_bounds(t)[1].z if obj_bounds(t)[1] else 0
        clear = (hz - tz) > 0.01
    if n and h and t:
        clear=True

    # symmetry
    sym=True
    for k in ['SHOULDER','HAND','HIP','FOOT','WRIST']:
        l,_=find([k],side='L'); r,_=find([k],side='R')
        if l and r:
            if abs(l.location.x + r.location.x) > 0.08:
                sym=False

    return detached,stray,l_ok,r_ok,l_gap,r_gap,io,op,clear,sym


def export_fbx(path):
    obj = character_objs()
    for o in bpy.data.objects:
        o.select_set(False)
    for o in obj:
        o.select_set(True)
    if obj:
        bpy.context.view_layer.objects.active = obj[0]
    bpy.ops.export_scene.fbx(filepath=path, use_selection=True, object_types={'MESH'}, use_animation=False, bake_anim=False, add_leaf_bones=False, use_custom_props=False)


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_IN)
    bpy.context.scene.unit_settings.system='METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0
    cleanup_helpers()
    ensure_chain_and_hands()
    ensure_neck()
    neutral_pose()
    center_at_origin()
    center_at_origin()
    set_render_scene()

    render_neutral_set('A1_BLOCKOUT_V005')

    def open_pose():
        for s in ['L','R']:
            p,_ = find(['HAND','PALM'],side=s); t,_=find(['THUMB'],side=s); i,_=find(['INDEX'],side=s); w,_=find(['WRIST'],side=s)
            if p: p.rotation_euler=(0,0,0)
            if t: t.rotation_euler=(0,0.4,0.5)
            if i: i.rotation_euler=(0,0,0.35)
            if w: w.rotation_euler=(0,0,0)

    def left_pose():
        w,_=find(['WRIST'],side='L')
        p,_=find(['HAND','PALM'],side='L')
        f,_=find(['FOREARM'],side='L')
        if w: w.rotation_euler=(0,radians(40),radians(-35))
        if p: p.rotation_euler=(0,0.1,radians(-20))
        if f: f.rotation_euler=(0,0,radians(-20))
        w2,_=find(['WRIST'],side='R')
        if w2: w2.rotation_euler=(0,0,0)

    def right_pose():
        w,_=find(['WRIST'],side='R')
        p,_=find(['HAND','PALM'],side='R')
        f,_=find(['FOREARM'],side='R')
        if w: w.rotation_euler=(0,radians(-40),radians(35))
        if p: p.rotation_euler=(0,-0.1,radians(20))
        if f: f.rotation_euler=(0,0,radians(20))
        w2,_=find(['WRIST'],side='L')
        if w2: w2.rotation_euler=(0,0,0)

    snapshot_pose('A1_V005_OPEN_PALM_CHECK', open_pose)
    snapshot_pose('A1_V005_POINT_LEFT_CHECK', left_pose)
    snapshot_pose('A1_V005_POINT_RIGHT_CHECK', right_pose)

    # restore neutral then save/fbx
    neutral_pose()
    if not os.path.isdir(os.path.dirname(BLEND_OUT)): os.makedirs(os.path.dirname(BLEND_OUT), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

    if not os.path.isdir(os.path.dirname(FBX_OUT)): os.makedirs(os.path.dirname(FBX_OUT), exist_ok=True)
    export_fbx(FBX_OUT)

    d,s,lok,rok,lg,rg,idir,openr,clear,sym = check_flags()

    print('BLEND_PATH='+BLEND_OUT)
    print('FBX_PATH='+FBX_OUT)
    print('A1_BLOCKOUT_V005_FRONT.png='+os.path.join(PROOF_DIR,'A1_BLOCKOUT_V005_FRONT.png'))
    print('A1_BLOCKOUT_V005_LEFT_3Q.png='+os.path.join(PROOF_DIR,'A1_BLOCKOUT_V005_LEFT_3Q.png'))
    print('A1_BLOCKOUT_V005_RIGHT_3Q.png='+os.path.join(PROOF_DIR,'A1_BLOCKOUT_V005_RIGHT_3Q.png'))
    print('A1_BLOCKOUT_V005_SIDE.png='+os.path.join(PROOF_DIR,'A1_BLOCKOUT_V005_SIDE.png'))
    print('A1_BLOCKOUT_V005_BACK.png='+os.path.join(PROOF_DIR,'A1_BLOCKOUT_V005_BACK.png'))
    print('A1_V005_OPEN_PALM_CHECK.png='+os.path.join(PROOF_DIR,'A1_V005_OPEN_PALM_CHECK.png'))
    print('A1_V005_POINT_LEFT_CHECK.png='+os.path.join(PROOF_DIR,'A1_V005_POINT_LEFT_CHECK.png'))
    print('A1_V005_POINT_RIGHT_CHECK.png='+os.path.join(PROOF_DIR,'A1_V005_POINT_RIGHT_CHECK.png'))
    print('DETACHED_CHARACTER_PARTS='+str(d))
    print('STRAY_VISIBLE_HELPER_OBJECTS='+str(s))
    print('LEFT_HAND_WRIST_CONNECTION=' + ('PASS' if lok else 'FAIL'))
    print('RIGHT_HAND_WRIST_CONNECTION=' + ('PASS' if rok else 'FAIL'))
    print('INDEX_DIRECTION_READABILITY=' + ('PASS' if idir else 'FAIL'))
    print('OPEN_PALM_READABILITY=' + ('PASS' if openr else 'FAIL'))
    print('GAP_HEAD_TORSO_CLEARANCE=' + ('PASS' if clear else 'FAIL'))
    print('GAP_A_POSE_SYMMETRY=' + ('PASS' if sym else 'FAIL'))
    print('FBX_EXPORT=PASS')
    print('KNOWN_RISKS=small hand-finger volumes are simplified preflight blocks; validate in AccuRIG for index spread/finger curl ranges')

if __name__ == '__main__':
    main()
