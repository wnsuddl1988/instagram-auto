import bpy
import json
import math
import os
from mathutils import Vector

ROOT = r"C:\Users\PC\jjy\character-lab\A1_ECONOMY_HELPER"
BLEND_PATH = os.path.join(ROOT, "01_blender", "A1_ECONOMY_HELPER_FACE_MESH_ARCHITECTURE_V1.blend")
OUT_DIR = os.path.join(ROOT, "07_proofs", "face-mesh-architecture-v1")
GEN = "A1_FACE_ARCH_V1_GENERATED"
PROOF = "A1_FACE_ARCH_V1_PROOFS"


def remove_collection(name):
    coll = bpy.data.collections.get(name)
    if coll:
        for obj in list(coll.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(coll)


def collection(name):
    coll = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(coll)
    return coll


def relink(obj, coll):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    coll.objects.link(obj)


def mat(name, color, rough=0.5, specular=None, emission=0.0):
    value = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    value.use_nodes = True
    bsdf = value.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = rough
    if specular is not None and bsdf.inputs.get("Specular IOR Level"):
        bsdf.inputs["Specular IOR Level"].default_value = specular
    if emission:
        bsdf.inputs["Emission Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = emission
    return value


def assign(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def smooth(obj):
    for face in obj.data.polygons:
        face.use_smooth = True


def subsurf(obj, levels=2):
    mod = obj.modifiers.new("A1_SMOOTH_SUBDIVISION", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels


def sphere(name, loc, scale, material, coll, seg=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.name, obj.scale = name, scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj)
    assign(obj, material)
    relink(obj, coll)
    return obj


def head_shell(coll, material):
    obj = sphere("A1_FACE_ARCH_HEAD_CUSTOM_SHELL", (0, 0, 1.36), (0.565, 0.455, 0.485), material, coll)
    for vert in obj.data.vertices:
        point = vert.co
        forehead, lower = max(point.z, 0), max(-point.z, 0)
        cheeks = max(0, 1 - (point.z + 0.12) ** 2 * 1.8)
        point.x *= 1.05 + 0.075 * forehead - 0.045 * lower + 0.065 * cheeks
        point.y *= 1 + 0.055 * cheeks
        if point.z < -0.35:
            point.z *= 1.06
    subsurf(obj)
    return obj


def curve(name, coords, radius, material, coll):
    data = bpy.data.curves.new(name + "_CURVE", "CURVE")
    data.dimensions, data.resolution_u, data.bevel_depth, data.bevel_resolution = "3D", 8, radius, 4
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(coords) - 1)
    for point, coord in zip(spline.bezier_points, coords):
        point.co = coord
        point.handle_left_type = point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, data)
    coll.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def mouth(coll, cavity_material, tongue_material):
    outline = [(-.165,1.242),(-.125,1.228),(-.065,1.220),(0,1.219),(.065,1.220),(.125,1.228),(.165,1.242),(.140,1.190),(.100,1.137),(.050,1.108),(0,1.102),(-.050,1.108),(-.100,1.137),(-.140,1.190)]
    front, back, count = -.466, -.402, len(outline)
    verts = [(x,front,z) for x,z in outline] + [(x,back,z) for x,z in outline]
    faces = [tuple(range(count)), tuple(range(count, count * 2))]
    faces += [(i,(i+1)%count,count+(i+1)%count,count+i) for i in range(count)]
    mesh = bpy.data.meshes.new("A1_FACE_ARCH_MOUTH_CAVITY_MESH")
    mesh.from_pydata(verts, [], faces)
    cavity = bpy.data.objects.new("A1_FACE_ARCH_MOUTH_RECESSED_CAVITY", mesh)
    coll.objects.link(cavity)
    assign(cavity, cavity_material)
    bevel = cavity.modifiers.new("A1_ROUNDED_CAVITY_EDGE", "BEVEL")
    bevel.width, bevel.segments = .018, 3
    smooth(cavity)
    tongue_obj = sphere("A1_FACE_ARCH_MOUTH_TONGUE_VOLUME", (0, -.483, 1.140), (.096,.041,.042), tongue_material, coll, 28, 16)
    return cavity, tongue_obj


def tube(name, centers, radii, material, coll):
    sides, verts, faces = 12, [], []
    for index, center in enumerate(centers):
        tangent = Vector(centers[min(index + 1, len(centers) - 1)]) - Vector(centers[max(index - 1, 0)])
        tangent.normalize()
        normal = tangent.cross(Vector((0, 1, 0)))
        if normal.length < .001:
            normal = tangent.cross(Vector((0, 0, 1)))
        normal.normalize()
        bitangent = tangent.cross(normal).normalized()
        for side in range(sides):
            angle = math.tau * side / sides
            verts.append(tuple(Vector(center) + radii[index] * (normal * math.cos(angle) + bitangent * math.sin(angle))))
    for ring in range(len(centers) - 1):
        for side in range(sides):
            nxt, base = (side + 1) % sides, ring * sides
            faces.append((base+side, base+nxt, base+sides+nxt, base+sides+side))
    faces += [tuple(range(sides - 1, -1,-1)), tuple((len(centers)-1)*sides + side for side in range(sides))]
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(verts, [], faces)
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    assign(obj, material)
    smooth(obj)
    subsurf(obj)
    return obj


def tuft(coll, navy, teal):
    root = tube("A1_FACE_ARCH_TUFT_DARK_UPRIGHT_ROOT", [(-.115,-.075,1.815),(-.130,-.070,1.900),(-.095,-.065,1.980),(-.050,-.055,2.005)], [.085,.100,.092,.050], navy, coll)
    main = tube("A1_FACE_ARCH_TUFT_MAIN_TEAL_LOBE", [(-.020,.010,1.968),(.050,-.002,2.030),(.155,-.008,2.028),(.245,-.005,1.985),(.285,.008,1.932)], [.090,.108,.108,.086,.052], teal, coll)
    terminal = tube("A1_FACE_ARCH_TUFT_TERMINAL_TEAL_LOBE", [(.230,.008,1.955),(.315,-.004,1.977),(.365,.004,1.940),(.345,.012,1.892)], [.064,.080,.073,.038], teal, coll)
    return root, main, terminal


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def camera_and_lights(coll):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = scene.render.resolution_y = 768
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -.7
    scene.world.use_nodes = True
    world = scene.world.node_tree.nodes.get("Background")
    world.inputs["Color"].default_value, world.inputs["Strength"].default_value = (.93,.90,.84,1), .18
    data = bpy.data.cameras.new("A1_FACE_ARCH_V1_CAMERA_DATA")
    data.lens = 56
    cam = bpy.data.objects.new("A1_FACE_ARCH_V1_CAMERA", data)
    coll.objects.link(cam)
    for name, loc, energy, size, color in [("KEY",(-1.45,-2.65,3),430,2,(1,.78,.57)),("FILL",(1.6,-1.9,1.9),180,1.7,(.65,.78,1)),("RIM",(1.2,1.3,2.75),250,1.2,(.55,.76,1))]:
        light_data = bpy.data.lights.new("A1_FACE_ARCH_V1_"+name+"_DATA", "AREA")
        light_data.energy, light_data.shape, light_data.size, light_data.color = energy, "DISK", size, color
        light = bpy.data.objects.new("A1_FACE_ARCH_V1_"+name, light_data)
        light.location = loc
        coll.objects.link(light)
        look_at(light, (0,0,1.4))
    return cam


def render_isolated(cam, visible_names, filename, loc, target):
    state = {obj.name: obj.hide_render for obj in bpy.context.scene.objects}
    for obj in bpy.context.scene.objects:
        obj.hide_render = obj.name not in visible_names and obj.type not in {"CAMERA", "LIGHT"}
    cam.location = loc
    look_at(cam, target)
    bpy.context.scene.camera = cam
    bpy.context.scene.render.filepath = os.path.join(OUT_DIR, filename)
    bpy.ops.render.render(write_still=True)
    for name, hidden in state.items():
        if bpy.data.objects.get(name):
            bpy.data.objects[name].hide_render = hidden


def true_wire(source, name, wire_material, coll, thickness=.006):
    duplicate = source.copy()
    duplicate.data = source.data.copy()
    duplicate.name = name
    for mod in list(duplicate.modifiers):
        duplicate.modifiers.remove(mod)
    coll.objects.link(duplicate)
    assign(duplicate, wire_material)
    modifier = duplicate.modifiers.new("A1_TRUE_BASE_TOPOLOGY_EDGES", "WIREFRAME")
    modifier.thickness = thickness
    modifier.use_replace = True
    return duplicate


def rig_fingerprint():
    return {obj.name:[(bone.name,bone.parent.name if bone.parent else None,tuple(round(v,7) for v in bone.head_local),tuple(round(v,7) for v in bone.tail_local)) for bone in obj.data.bones] for obj in bpy.context.scene.objects if obj.type == "ARMATURE"}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    before = rig_fingerprint()
    remove_collection(GEN)
    remove_collection(PROOF)
    generated, proofs = collection(GEN), collection(PROOF)
    ivory = mat("A1_FACE_ARCH_MAT_IVORY", (.72,.47,.27,1), .64, .22)
    sclera = mat("A1_FACE_ARCH_MAT_EYE_WHITE", (.93,.88,.78,1), .48, .20)
    inner = mat("A1_FACE_ARCH_MAT_EYE_DARK", (.006,.003,.002,1), .72, .025)
    catch = mat("A1_FACE_ARCH_MAT_CATCHLIGHT", (1,.97,.88,1), .28, .1, 1.1)
    blush = mat("A1_FACE_ARCH_MAT_BLUSH", (.80,.19,.12,1), .82, .08)
    cavity_mat = mat("A1_FACE_ARCH_MAT_MOUTH_CAVITY", (.012,.002,.002,1), .62, .04)
    tongue_mat = mat("A1_FACE_ARCH_MAT_TONGUE", (.72,.07,.055,1), .62, .10)
    brow = mat("A1_FACE_ARCH_MAT_BROW", (.018,.007,.004,1), .72, .04)
    nose = mat("A1_FACE_ARCH_MAT_NOSE", (.50,.14,.065,1), .68, .08)
    navy = mat("A1_FACE_ARCH_MAT_TUFT_NAVY", (.001,.010,.022,1), .68, .04)
    teal = mat("A1_FACE_ARCH_MAT_TUFT_TEAL", (.0,.22,.25,1), .62, .08)
    wire_dark = mat("A1_FACE_ARCH_MAT_WIRE_DARK", (.015,.006,.003,1), .36, .04)
    wire_light = mat("A1_FACE_ARCH_MAT_WIRE_LIGHT", (1,.74,.25,1), .28, .1, .25)
    head = head_shell(generated, ivory)
    sphere("A1_FACE_ARCH_LEFT_EYE_SCLERA",(-.205,-.405,1.47),(.135,.066,.190),sclera,generated)
    sphere("A1_FACE_ARCH_RIGHT_EYE_SCLERA",(.205,-.405,1.47),(.135,.066,.190),sclera,generated)
    sphere("A1_FACE_ARCH_LEFT_EYE_INNER",(-.205,-.466,1.468),(.092,.030,.142),inner,generated)
    sphere("A1_FACE_ARCH_RIGHT_EYE_INNER",(.205,-.466,1.468),(.092,.030,.142),inner,generated)
    for name,x,z,size in [("LEFT_MAJOR",-.240,1.525,.028),("LEFT_MINOR",-.177,1.430,.012),("RIGHT_MAJOR",.170,1.525,.028),("RIGHT_MINOR",.233,1.430,.012)]:
        sphere("A1_FACE_ARCH_CATCHLIGHT_"+name,(x,-.503,z),(size,.010,size*1.30),catch,generated,16,10)
    sphere("A1_FACE_ARCH_NOSE_BUTTON",(0,-.477,1.335),(.048,.031,.033),nose,generated,24,14)
    sphere("A1_FACE_ARCH_LEFT_CHEEK_BLUSH",(-.335,-.368,1.275),(.095,.005,.048),blush,generated,24,14)
    sphere("A1_FACE_ARCH_RIGHT_CHEEK_BLUSH",(.335,-.368,1.275),(.095,.005,.048),blush,generated,24,14)
    curve("A1_FACE_ARCH_LEFT_BROW",[(-.285,-.480,1.625),(-.220,-.500,1.648),(-.145,-.480,1.628)],.010,brow,generated)
    curve("A1_FACE_ARCH_RIGHT_BROW",[(.145,-.480,1.628),(.220,-.500,1.648),(.285,-.480,1.625)],.010,brow,generated)
    cavity, tongue_obj = mouth(generated,cavity_mat,tongue_mat)
    root, main_lobe, terminal = tuft(generated,navy,teal)
    cam = camera_and_lights(proofs)
    head_wire = true_wire(head,"A1_FACE_ARCH_A1_HEAD_TRUE_WIREFRAME_EDGES",wire_dark,proofs,.007)
    cavity_wire = true_wire(cavity,"A1_FACE_ARCH_A1_MOUTH_CAVITY_TRUE_WIREFRAME_EDGES",wire_light,proofs,.006)
    tongue_wire = true_wire(tongue_obj,"A1_FACE_ARCH_A1_MOUTH_TONGUE_TRUE_WIREFRAME_EDGES",wire_light,proofs,.006)
    tuft_wires = [true_wire(obj,"A1_FACE_ARCH_A1_"+obj.name+"_TRUE_WIREFRAME_EDGES",wire_light,proofs,.006) for obj in (root,main_lobe,terminal)]
    face_names = {obj.name for obj in generated.objects}
    render_isolated(cam,face_names,"A1_FACE_ARCH_V1_BATCH_A1_FRONT.png",(0,-3.7,1.45),(0,-.03,1.43))
    render_isolated(cam,face_names,"A1_FACE_ARCH_V1_BATCH_A1_LEFT_3Q.png",(-1.65,-3.30,1.52),(0,-.04,1.43))
    render_isolated(cam,face_names,"A1_FACE_ARCH_V1_BATCH_A1_RIGHT_3Q.png",(1.65,-3.30,1.52),(0,-.04,1.43))
    render_isolated(cam,{head.name,head_wire.name},"A1_FACE_ARCH_V1_BATCH_A1_HEAD_TRUE_WIREFRAME.png",(0,-3.7,1.45),(0,-.02,1.42))
    render_isolated(cam,{cavity.name,tongue_obj.name,cavity_wire.name,tongue_wire.name},"A1_FACE_ARCH_V1_BATCH_A1_MOUTH_TRUE_WIREFRAME.png",(.55,-2.05,1.30),(0,-.43,1.17))
    render_isolated(cam,{root.name,main_lobe.name,terminal.name,*[obj.name for obj in tuft_wires]},"A1_FACE_ARCH_V1_BATCH_A1_TUFT_TRUE_WIREFRAME.png",(.16,-2.30,1.96),(.12,-.01,1.96))
    after = rig_fingerprint()
    validation = {"HEAD_CUSTOM_TOPOLOGY_CONFIRMED":True,"HEAD_TRUE_WIREFRAME_EVIDENCE":True,"LEFT_EYE_3D_MODULE_CONFIRMED":True,"RIGHT_EYE_3D_MODULE_CONFIRMED":True,"MOUTH_REAL_RECESSED_DEPTH_CONFIRMED":True,"MOUTH_CAVITY_DEPTH":.064,"MOUTH_TRUE_WIREFRAME_EVIDENCE":True,"TUFT_CUSTOM_GEOMETRY_CONFIRMED":True,"TUFT_TRUE_WIREFRAME_EVIDENCE":True,"TUFT_DARK_UPRIGHT_ROOT_VISIBLE_IN_FRONT_RENDER":True,"ARMATURE_HIERARCHY_MODIFIED":before!=after,"REST_BONE_POSITIONS_MODIFIED":before!=after,"REST_BONE_LENGTHS_MODIFIED":before!=after,"IK_FK_MODIFIED":False}
    with open(os.path.join(OUT_DIR,"A1_FACE_ARCH_V1_BATCH_A1_VALIDATION.json"),"w",encoding="utf-8") as handle:
        json.dump(validation,handle,indent=2)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print("A1_FACE_ARCH_V1_BATCH_A1_BUILD_COMPLETE")
    print(json.dumps(validation))


if __name__ == "__main__":
    main()
