import bpy, math
from mathutils import Vector

def p(t):
    return tuple(round(float(x),4) for x in t)

names = ['A1_BLOCKOUT_L_SHOULDER','A1_BLOCKOUT_L_UPPER_ARM','A1_BLOCKOUT_L_ELBOW','A1_BLOCKOUT_L_FOREARM','A1_BLOCKOUT_L_WRIST','A1_BLOCKOUT_R_SHOULDER','A1_BLOCKOUT_R_UPPER_ARM','A1_BLOCKOUT_R_ELBOW','A1_BLOCKOUT_R_FOREARM','A1_BLOCKOUT_R_WRIST']
for n in names:
    o=bpy.data.objects.get(n)
    if o:
        print(n, 'rot=',p(o.rotation_euler), 'loc=',p(o.location), 'parent=',o.parent.name if o.parent else 'NONE', 'children=', [c.name for c in o.children])
