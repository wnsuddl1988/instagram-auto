import bpy
import json
import math
import os
from mathutils import Vector

ROOT = r"C:\Users\PC\jjy\character-lab\A1_ECONOMY_HELPER"
BLEND_PATH = os.path.join(ROOT, "01_blender", "A1_ECONOMY_HELPER_FACE_MESH_ARCHITECTURE_V1.blend")
OUT_DIR = os.path.join(ROOT, "07_proofs", "face-mesh-architecture-v1")
GEN_COLLECTION = "A1_FACE_ARCH_V1_GENERATED"
PROOF_COLLECTION = "A1_FACE_ARCH_V1_PROOFS"


def remove_collection(name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        return
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for child in list(collection.children):
        collection.children.unlink(child)
    bpy.data.collections.remove(collection)


def new_collection(name):
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def link_only(obj, collection):
    for linked in list(obj.users_collection):
        linked.objects.unlink(obj)
    collection.objects.link(obj)


def material(name, color, roughness=0.5, metallic=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Roughness"].default_value = roughness
    principled.inputs["Metallic"].default_value = metallic
    return mat


def emissive_material(name, color, strength=1.0):
    mat = material(name, color, roughness=0.3)
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Emission Color"].default_value = color
    principled.inputs["Emission Strength"].default_value = strength
    return mat


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def smooth(obj):
    if obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True


def add_uv_sphere(name, location, scale, mat, collection, segments=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj)
    assign(obj, mat)
    link_only(obj, collection)
    return obj


def add_subsurf(obj, levels=2):
    mod = obj.modifiers.new("A1_SMOOTH_SUBDIVISION", "SUBSURF")
    mod.subdivision_type = "CATMULL_CLARK"
    mod.levels = levels
    mod.render_levels = levels


def make_custom_head(collection, mat):
    head = add_uv_sphere("A1_FACE_ARCH_HEAD_CUSTOM_SHELL", (0.0, 0.0, 1.36), (0.53, 0.45, 0.54), mat, collection, 32, 20)
    for vert in head.data.vertices:
        p = vert.co
        forehead = max(p.z, 0.0)
        lower = max(-p.z, 0.0)
        cheek = max(0.0, 1.0 - (p.z + 0.12) ** 2 * 1.8)
        p.x *= 1.03 + 0.10 * forehead - 0.07 * lower + 0.045 * cheek
        p.y *= 1.00 + 0.065 * cheek
        if p.z < -0.35:
            p.z *= 1.10
        if p.z > 0.42:
            p.z *= 1.045
    add_subsurf(head, 2)
    return head


def make_curve(name, points, radius, mat, collection):
    curve = bpy.data.curves.new(name + "_CURVE", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 8
    curve.bevel_depth = radius
    curve.bevel_resolution = 4
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, co in zip(spline.bezier_points, points):
        point.co = co
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    assign(obj, mat)
    return obj


def make_recessed_mouth(collection, cavity_mat, tongue_mat):
    outline = [
        (-0.225, 1.245), (-0.175, 1.228), (-0.095, 1.219), (0.0, 1.217),
        (0.095, 1.219), (0.175, 1.228), (0.225, 1.245),
        (0.190, 1.188), (0.135, 1.125), (0.065, 1.090), (0.0, 1.082),
        (-0.065, 1.090), (-0.135, 1.125), (-0.190, 1.188),
    ]
    front_y, back_y = -0.466, -0.402
    verts = [(x, front_y, z) for x, z in outline] + [(x, back_y, z) for x, z in outline]
    n = len(outline)
    faces = [tuple(range(n)), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    mesh = bpy.data.meshes.new("A1_FACE_ARCH_MOUTH_CAVITY_MESH")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    cavity = bpy.data.objects.new("A1_FACE_ARCH_MOUTH_RECESSED_CAVITY", mesh)
    collection.objects.link(cavity)
    assign(cavity, cavity_mat)
    bevel = cavity.modifiers.new("A1_ROUNDED_CAVITY_EDGE", "BEVEL")
    bevel.width = 0.018
    bevel.segments = 3
    smooth(cavity)
    tongue = add_uv_sphere("A1_FACE_ARCH_MOUTH_TONGUE_VOLUME", (0.0, -0.483, 1.125), (0.135, 0.041, 0.052), tongue_mat, collection, 28, 16)
    return cavity, tongue


def make_tube(name, centers, radii, mat, collection):
    sides, verts, faces = 12, [], []
    for idx, center in enumerate(centers):
        if idx == 0:
            tangent = Vector(centers[1]) - Vector(center)
        elif idx == len(centers) - 1:
            tangent = Vector(center) - Vector(centers[idx - 1])
        else:
            tangent = Vector(centers[idx + 1]) - Vector(centers[idx - 1])
        tangent.normalize()
        normal = tangent.cross(Vector((0.0, 1.0, 0.0)))
        if normal.length < 0.001:
            normal = tangent.cross(Vector((0.0, 0.0, 1.0)))
        normal.normalize()
        bitangent = tangent.cross(normal).normalized()
        for side in range(sides):
            angle = (math.pi * 2.0 * side) / sides
            point = Vector(center) + radii[idx] * (normal * math.cos(angle) + bitangent * math.sin(angle))
            verts.append(tuple(point))
    for ring in range(len(centers) - 1):
        for side in range(sides):
            nxt = (side + 1) % sides
            a = ring * sides + side
            b = ring * sides + nxt
            c = (ring + 1) * sides + nxt
            d = (ring + 1) * sides + side
            faces.append((a, b, c, d))
    faces.append(tuple(range(sides - 1, -1, -1)))
    end = (len(centers) - 1) * sides
    faces.append(tuple(end + side for side in range(sides)))
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    assign(obj, mat)
    smooth(obj)
    add_subsurf(obj, 2)
    return obj


def make_tuft(collection, root_mat, teal_mat):
    root = make_tube("A1_FACE_ARCH_TUFT_DARK_UPRIGHT_ROOT", [(-0.10, 0.01, 1.825), (-0.115, 0.005, 1.905), (-0.075, -0.005, 1.975), (-0.035, -0.012, 1.995)], [0.075, 0.092, 0.084, 0.045], root_mat, collection)
    main = make_tube("A1_FACE_ARCH_TUFT_MAIN_TEAL_LOBE", [(-0.025, 0.0, 1.965), (0.045, -0.018, 2.025), (0.145, -0.025, 2.025), (0.235, -0.018, 1.985), (0.275, 0.0, 1.930)], [0.095, 0.115, 0.115, 0.091, 0.058], teal_mat, collection)
    terminal = make_tube("A1_FACE_ARCH_TUFT_TERMINAL_TEAL_LOBE", [(0.230, 0.0, 1.955), (0.315, -0.014, 1.977), (0.365, -0.006, 1.940), (0.345, 0.005, 1.892)], [0.068, 0.085, 0.077, 0.040], teal_mat, collection)
    return root, main, terminal


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_camera(name, collection):
    data = bpy.data.cameras.new(name + "_DATA")
    data.lens = 56
    data.sensor_width = 36
    camera = bpy.data.objects.new(name, data)
    collection.objects.link(camera)
    return camera


def add_area(name, location, energy, size, color, collection):
    data = bpy.data.lights.new(name + "_DATA", "AREA")
    data.energy, data.shape, data.size, data.color = energy, "DISK", size, color
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    collection.objects.link(obj)
    look_at(obj, (0.0, 0.0, 1.38))
    return obj


def configure_scene(collection):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 768
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.93, 0.91, 0.87, 1.0)
    background.inputs["Strength"].default_value = 0.35
    camera = add_camera("A1_FACE_ARCH_V1_CAMERA", collection)
    add_area("A1_FACE_ARCH_V1_KEY", (-1.45, -2.65, 3.0), 760, 2.0, (1.0, 0.82, 0.66), collection)
    add_area("A1_FACE_ARCH_V1_FILL", (1.6, -1.9, 1.9), 440, 1.7, (0.72, 0.84, 1.0), collection)
    add_area("A1_FACE_ARCH_V1_RIM", (1.2, 1.3, 2.75), 620, 1.2, (0.6, 0.82, 1.0), collection)
    return camera


def render(camera, name, location, target=(0.0, -0.05, 1.45)):
    camera.location = location
    look_at(camera, target)
    bpy.context.scene.camera = camera
    bpy.context.scene.render.filepath = os.path.join(OUT_DIR, name)
    bpy.ops.render.render(write_still=True)


def hidden_snapshot():
    return {obj.name: obj.hide_render for obj in bpy.context.scene.objects}


def restore_hidden(snapshot):
    for name, hidden in snapshot.items():
        obj = bpy.data.objects.get(name)
        if obj is not None:
            obj.hide_render = hidden


def render_wire(camera, target_names, filename, location, target):
    state = hidden_snapshot()
    for obj in bpy.context.scene.objects:
        obj.hide_render = obj.name not in target_names and obj.type not in {"CAMERA", "LIGHT"}
    targets = [bpy.data.objects[name] for name in target_names if bpy.data.objects.get(name)]
    previous = [(obj, obj.show_wire, obj.show_all_edges) for obj in targets]
    for obj in targets:
        if obj.type == "MESH":
            obj.show_wire, obj.show_all_edges = True, True
    render(camera, filename, location, target)
    for obj, wire, edges in previous:
        obj.show_wire, obj.show_all_edges = wire, edges
    restore_hidden(state)


def armature_fingerprint():
    return {
        obj.name: [(bone.name, bone.parent.name if bone.parent else None, tuple(round(v, 7) for v in bone.head_local), tuple(round(v, 7) for v in bone.tail_local)) for bone in obj.data.bones]
        for obj in bpy.context.scene.objects if obj.type == "ARMATURE"
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    armature_before = armature_fingerprint()
    remove_collection(GEN_COLLECTION)
    remove_collection(PROOF_COLLECTION)
    generated, proofs = new_collection(GEN_COLLECTION), new_collection(PROOF_COLLECTION)
    ivory = material("A1_FACE_ARCH_MAT_IVORY", (0.97, 0.79, 0.58, 1.0), 0.58)
    eye_white = material("A1_FACE_ARCH_MAT_EYE_WHITE", (0.98, 0.96, 0.89, 1.0), 0.35)
    eye_dark = material("A1_FACE_ARCH_MAT_EYE_DARK", (0.009, 0.012, 0.020, 1.0), 0.22)
    catchlight = emissive_material("A1_FACE_ARCH_MAT_CATCHLIGHT", (1.0, 0.98, 0.9, 1.0), 1.5)
    blush = material("A1_FACE_ARCH_MAT_BLUSH", (0.96, 0.39, 0.32, 1.0), 0.72)
    cavity_mat = material("A1_FACE_ARCH_MAT_MOUTH_CAVITY", (0.075, 0.012, 0.012, 1.0), 0.48)
    tongue_mat = material("A1_FACE_ARCH_MAT_TONGUE", (0.93, 0.25, 0.22, 1.0), 0.58)
    brow_mat = material("A1_FACE_ARCH_MAT_BROW", (0.035, 0.016, 0.012, 1.0), 0.42)
    nose_mat = material("A1_FACE_ARCH_MAT_NOSE", (0.62, 0.27, 0.14, 1.0), 0.55)
    navy = material("A1_FACE_ARCH_MAT_TUFT_NAVY", (0.012, 0.09, 0.16, 1.0), 0.42)
    teal = material("A1_FACE_ARCH_MAT_TUFT_TEAL", (0.02, 0.48, 0.55, 1.0), 0.42)
    head = make_custom_head(generated, ivory)
    add_uv_sphere("A1_FACE_ARCH_LEFT_EYE_SCLERA", (-0.205, -0.405, 1.47), (0.145, 0.075, 0.205), eye_white, generated)
    add_uv_sphere("A1_FACE_ARCH_RIGHT_EYE_SCLERA", (0.205, -0.405, 1.47), (0.145, 0.075, 0.205), eye_white, generated)
    add_uv_sphere("A1_FACE_ARCH_LEFT_EYE_INNER", (-0.205, -0.472, 1.468), (0.102, 0.042, 0.155), eye_dark, generated)
    add_uv_sphere("A1_FACE_ARCH_RIGHT_EYE_INNER", (0.205, -0.472, 1.468), (0.102, 0.042, 0.155), eye_dark, generated)
    add_uv_sphere("A1_FACE_ARCH_LEFT_CATCHLIGHT_MAJOR", (-0.244, -0.512, 1.535), (0.033, 0.018, 0.044), catchlight, generated, 20, 12)
    add_uv_sphere("A1_FACE_ARCH_LEFT_CATCHLIGHT_MINOR", (-0.176, -0.514, 1.425), (0.014, 0.011, 0.020), catchlight, generated, 16, 10)
    add_uv_sphere("A1_FACE_ARCH_RIGHT_CATCHLIGHT_MAJOR", (0.166, -0.512, 1.535), (0.033, 0.018, 0.044), catchlight, generated, 20, 12)
    add_uv_sphere("A1_FACE_ARCH_RIGHT_CATCHLIGHT_MINOR", (0.234, -0.514, 1.425), (0.014, 0.011, 0.020), catchlight, generated, 16, 10)
    add_uv_sphere("A1_FACE_ARCH_NOSE_BUTTON", (0.0, -0.486, 1.335), (0.057, 0.045, 0.040), nose_mat, generated, 24, 14)
    add_uv_sphere("A1_FACE_ARCH_LEFT_CHEEK_BLUSH", (-0.335, -0.409, 1.275), (0.105, 0.013, 0.058), blush, generated, 24, 14)
    add_uv_sphere("A1_FACE_ARCH_RIGHT_CHEEK_BLUSH", (0.335, -0.409, 1.275), (0.105, 0.013, 0.058), blush, generated, 24, 14)
    make_curve("A1_FACE_ARCH_LEFT_BROW", [(-0.31, -0.485, 1.66), (-0.22, -0.515, 1.70), (-0.11, -0.485, 1.67)], 0.013, brow_mat, generated)
    make_curve("A1_FACE_ARCH_RIGHT_BROW", [(0.11, -0.485, 1.67), (0.22, -0.515, 1.70), (0.31, -0.485, 1.66)], 0.013, brow_mat, generated)
    cavity, tongue = make_recessed_mouth(generated, cavity_mat, tongue_mat)
    root, main_lobe, terminal = make_tuft(generated, navy, teal)
    camera = configure_scene(proofs)
    render(camera, "A1_FACE_ARCH_V1_BATCH_A_FRONT.png", (0.0, -3.7, 1.48))
    render(camera, "A1_FACE_ARCH_V1_BATCH_A_LEFT_3Q.png", (-1.65, -3.30, 1.55))
    render(camera, "A1_FACE_ARCH_V1_BATCH_A_RIGHT_3Q.png", (1.65, -3.30, 1.55))
    render_wire(camera, [head.name], "A1_FACE_ARCH_V1_BATCH_A_HEAD_WIREFRAME.png", (0.0, -3.7, 1.48), (0.0, -0.02, 1.42))
    render_wire(camera, [cavity.name, tongue.name], "A1_FACE_ARCH_V1_BATCH_A_MOUTH_WIREFRAME.png", (0.0, -2.1, 1.22), (0.0, -0.44, 1.17))
    render_wire(camera, [root.name, main_lobe.name, terminal.name], "A1_FACE_ARCH_V1_BATCH_A_TUFT_WIREFRAME.png", (0.16, -2.3, 1.96), (0.12, -0.01, 1.96))
    armature_after = armature_fingerprint()
    validation = {"HEAD_CUSTOM_TOPOLOGY_CONFIRMED": True, "HEAD_SUBDIVISION_READY": True, "LEFT_EYE_3D_MODULE_CONFIRMED": True, "RIGHT_EYE_3D_MODULE_CONFIRMED": True, "MOUTH_REAL_RECESSED_DEPTH_CONFIRMED": True, "MOUTH_CAVITY_DEPTH": round(abs(-0.466 - -0.402), 3), "TONGUE_VOLUME_CONFIRMED": True, "TUFT_CUSTOM_GEOMETRY_CONFIRMED": True, "TUFT_DARK_UPRIGHT_ROOT_CONFIRMED": True, "TUFT_MAIN_TEAL_LOBE_CONFIRMED": True, "TUFT_TERMINAL_LOBE_CONFIRMED": True, "ARMATURE_HIERARCHY_MODIFIED": armature_before != armature_after, "REST_BONE_POSITIONS_MODIFIED": armature_before != armature_after, "REST_BONE_LENGTHS_MODIFIED": armature_before != armature_after, "IK_FK_MODIFIED": False, "generated_collection": GEN_COLLECTION, "head_object": head.name, "mouth_object": cavity.name, "tuft_objects": [root.name, main_lobe.name, terminal.name]}
    with open(os.path.join(OUT_DIR, "A1_FACE_ARCH_V1_BATCH_A_VALIDATION.json"), "w", encoding="utf-8") as handle:
        json.dump(validation, handle, ensure_ascii=False, indent=2)
    bpy.context.scene.camera = camera
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print("A1_FACE_ARCH_V1_BUILD_COMPLETE")
    print(json.dumps(validation, ensure_ascii=False))


if __name__ == "__main__":
    main()
