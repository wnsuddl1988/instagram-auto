import bpy, os
from mathutils import Vector

def find(token):
    token=token.upper()
    return [o for o in bpy.data.objects if token in o.name.upper() and o.type=='MESH']

def world(o):
    return o.matrix_world.translation

for n in ['L_UPPER_ARM','R_UPPER_ARM','L_FOREARM','R_FOREARM','L_WRIST','R_WRIST','L_SHOULDER','R_SHOULDER','L_ELBOW','R_ELBOW','L_HIP','R_HIP','L_THIGH','R_THIGH','L_KNEE','R_KNEE','L_LOWER_LEG','R_LOWER_LEG','L_ANKLE','R_ANKLE','L_FOOT','R_FOOT','HEAD','TORSO','A1_BLOCKOUT_BODY']:
    objs = find(n)
    if objs:
        o=objs[0]
        print(n, o.name, tuple(round(float(v),4) for v in world(o)))

for pair in [('L_UPPER_ARM','L_WRIST'),('R_UPPER_ARM','R_WRIST')]:
    lu = find(pair[0])[0]
    lw = find(pair[1])[0]
    v = world(lw)-world(lu)
    print(pair[0], '->', pair[1], tuple(round(float(x),4) for x in v), 'len', round(v.length,4))
