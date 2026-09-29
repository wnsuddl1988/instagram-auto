"""Blender-side V3 layer renderer: separate environment and transparent Coin actor."""
import math, os, sys
import bpy

ROOT=r"C:\Users\PC\jjy\instagram-auto"
OUT=os.path.join(ROOT,"output","editorial-v2","coin-production-reentry-v3")
BASE=os.path.join(ROOT,"scripts","editorial_v2","build_editorial_recovery_v2.py")
scope={"__name__":"v3_base","__file__":BASE}
exec(compile(open(BASE,encoding="utf-8").read(),BASE,"exec"),scope)
clean_non_coin=scope["clean_non_coin"]; material=scope["material"]; cube=scope["cube"]; cyl=scope["cyl"]
key=scope["key"]; make_lights=scope["make_lights"]; make_camera=scope["make_camera"]; look_at=scope["look_at"]; set_mouth=scope["set_mouth"]

SCENES={
1:(195,"PAYMENT_PHONE_DESK",(0.04,.14,.22,1),(.12,.84,.70,1),[(-1.7,0,.0),(-1.7,0,.18),(-1.45,0,-.08)],[(0,.0,-.25),(0,.18,.46),(0,-.08,.12)]),
2:(180,"CHECKOUT_PAYMENT_CHOICE",(.08,.10,.28,1),(.36,.62,1,1),[(0,0,.0),(-1.25,0,.0),(1.25,0,.0)],[(0,.0,-.15),(0,-.18,.38),(0,.18,-.36)]),
3:(180,"STATEMENT_INSPECTION_DESK",(.17,.09,.26,1),(.88,.48,1,1),[(1.45,0,0),(1.2,0,.12),(1.4,0,-.05)],[(0,.12,-.22),(0,-.16,.36),(0,.14,.22)]),
4:(299,"CALCULATOR_NUMBER_WORKBENCH",(.08,.20,.18,1),(.30,.92,.72,1),[(-1.6,0,0),(-1.45,0,.08),(-1.3,0,-.02)],[(0,0,-.12),(0,-.14,.42),(0,.10,.20)]),
5:(278,"INSTALLMENT_VS_REVOLVING_SPLIT_SET",(.18,.12,.07,1),(1,.70,.24,1),[(0,0,0),(-1.45,0,0),(1.45,0,0)],[(0,0,-.08),(0,-.20,.42),(0,.20,-.42)]),
6:(195,"STATEMENT_TO_CARD_PORTAL",(.04,.16,.30,1),(.30,.78,1,1),[(-1.4,0,0),(-1.2,0,.12),(1.25,0,0)],[(0,.10,-.15),(0,-.15,.36),(0,.18,.20)]),
7:(260,"REPAYMENT_PLANNING_DESK",(.08,.23,.27,1),(.22,.90,.82,1),[(1.3,0,0),(.3,0,.05),(-1.25,0,.1)],[(0,.18,-.20),(0,-.12,.45),(0,.10,.18)]),
8:(292,"CHECKLIST_AND_CONTACT_DESK",(.20,.09,.20,1),(.94,.52,.88,1),[(-1.4,0,0),(-.2,0,.08),(1.25,0,.1)],[(0,.12,-.20),(0,-.12,.36),(0,.08,.08)]),
}

def setup(scene_no, alpha):
    f,env,bg,accent,positions,turns=SCENES[scene_no]
    s=bpy.context.scene; s.frame_start=1; s.frame_end=f; s.render.engine="BLENDER_EEVEE_NEXT"; s.eevee.taa_render_samples=12
    s.render.resolution_x=1080;s.render.resolution_y=1920;s.render.resolution_percentage=100;s.render.fps=30
    s.render.image_settings.file_format="FFMPEG";s.render.ffmpeg.format="QUICKTIME" if alpha else "MPEG4";s.render.ffmpeg.codec="QTRLE" if alpha else "H264"
    s.render.image_settings.color_mode="RGBA" if alpha else "RGB";s.render.film_transparent=alpha
    s.world.use_nodes=True;s.world.node_tree.nodes["Background"].inputs["Color"].default_value=bg;s.world.node_tree.nodes["Background"].inputs["Strength"].default_value=.32
    return f,env,bg,accent,positions,turns

def env(scene_no):
    # New scene: actual foreground/midground/background silhouettes, no world-space critical text.
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    f,ident,bg,accent,_,_=setup(scene_no,False)
    m={"bg":material("V3_BG",bg,roughness=.65),"dark":material("V3_DARK",(.03,.05,.08,1),roughness=.35),"accent":material("V3_ACCENT",accent,roughness=.28,emission=accent),"paper":material("V3_PAPER",(.93,.92,.86,1),roughness=.7),"warn":material("V3_WARN",(1,.20,.22,1),roughness=.32),"floor":material("V3_FLOOR",tuple(min(1,x*1.5) for x in bg[:3])+(1,),roughness=.42)}
    cube("BACKGROUND_ARCH",(0,3.6,.5),(6.4,.14,8.9),m["bg"],.24);cube("MID_FLOOR",(0,1.55,-4.3),(6.3,2.0,.2),m["floor"],.18)
    # Foreground framing creates depth/parallax under actual camera reframes.
    cube("FOREGROUND_LEFT",(-5.5,1.0,-.2),(.45,.5,5.0),m["dark"],.16);cube("FOREGROUND_RIGHT",(5.5,1.4,.6),(.45,.5,4.2),m["dark"],.16)
    if scene_no==1:
        cube("PHONE",(2.5,1.2,.2),(1.3,.18,2.3),m["dark"],.3);cube("PHONE_SCREEN",(2.5,.98,.2),(1.05,.03,1.9),m["accent"],.16);cube("DESK_RECEIPT",(-.1,1.7,-2.1),(2.2,.05,.65),m["paper"],.08)
    elif scene_no==2:
        cube("TERMINAL",(0,1.5,-.3),(1.55,.32,2.3),m["dark"],.3);cyl("OPTION_FULL",(-2.8,1.7,.6),1.0,.18,m["accent"]);cyl("OPTION_PARTIAL",(2.8,1.7,.6),1.0,.18,m["warn"])
    elif scene_no==3:
        cube("STATEMENT",(-2.65,1.7,.25),(1.6,.1,3.2),m["paper"],.12);cyl("FEE_MARKER",(2.4,1.5,.3),1.3,.18,m["warn"])
    elif scene_no==4:
        cube("CALCULATOR",(1.9,1.5,.2),(2.4,.2,3.5),m["dark"],.28);[cyl("CALC_%d"%i,(.45+i*1.45,1.2,-1.5),.34,.1,m["accent"]) for i in range(3)]
    elif scene_no==5:
        cyl("FIXED_ENDPOINT",(-2.8,1.7,.3),1.7,.2,m["accent"]);cyl("REVOLVING_LOOP",(2.8,1.7,.3),1.7,.2,m["warn"]);cube("SPLIT_DIVIDER",(0,2.5,.2),(.08,.2,5.0),m["paper"],.05)
    elif scene_no==6:
        cube("STATEMENT",(-2.5,1.6,.2),(1.55,.1,3.0),m["paper"],.12);cube("PORTAL",(2.55,1.5,.2),(1.8,.18,2.7),m["dark"],.26);cube("RATE_TARGET",(2.55,1.25,.45),(1.25,.03,.35),m["accent"],.10)
    elif scene_no==7:
        cube("PLANNING_DESK",(0,1.7,-.6),(4.8,.18,.32),m["dark"],.15);[cyl("SLIDER_%d"%i,(-3+i*3,1.42,-.6),.42,.12,m["accent"]) for i in range(3)]
    elif scene_no==8:
        cube("CHECKLIST",(-2.25,1.6,.3),(2.1,.1,3.25),m["paper"],.16);cube("CONTACT_PHONE",(2.9,1.35,-.1),(1.05,.18,2.15),m["dark"],.25);cube("CONTACT_SCREEN",(2.9,1.12,-.1),(.80,.03,1.70),m["accent"],.12)
    make_lights(accent);cam=make_camera({"camera":(43,56)});cam.location=(0,-19,.25);look_at(cam,(0,0,.1),1,43);cam.location=(-.35,-18.5,.3);look_at(cam,(0,0,.1),int(f*.52),56);cam.location=(.3,-19,.2);look_at(cam,(0,0,.1),f,48)
    out=os.path.join(OUT,"scene%02d"%scene_no,"environment");os.makedirs(out,exist_ok=True);s=bpy.context.scene;s.render.filepath=os.path.join(out,"SCENE%02d_ENVIRONMENT.mp4"%scene_no);bpy.ops.render.render(animation=True)

def actor(scene_no):
    clean_non_coin();f,ident,bg,accent,pos,turns=setup(scene_no,True);make_lights(accent);cam=make_camera({"camera":(50,58)})
    root=bpy.data.objects["coin_finalist_root"];right=bpy.data.objects.get("motion_right_explain_control");left=bpy.data.objects.get("motion_left_pad_control");pad=bpy.data.objects.get("motion_translation_pad_control")
    beats=(1,int(f*.34),int(f*.67),f)
    # Stable Coin scale; real body turn, lean, steps, hands and prop interactions change the performance.
    for fr,i in zip(beats,(0,1,2,2)):
        x,y,z=pos[i];rx,ry,rz=turns[i];key(root,fr,location=(x,y,z),rotation=(rx,ry,rz),scale=(.90,.90,.90))
    for obj,a,b,c in ((right,(-.15,0,-.12),(.0,-.34,.65),(0,.10,.18)),(left,(0,.08,.10),(0,.20,-.42),(0,-.10,.12)),(pad,(0,0,-.10),(0,0,.25),(0,0,0))):
        if obj:
            key(obj,1,rotation=a);key(obj,int(f*.34),rotation=b);key(obj,int(f*.68),rotation=c);key(obj,f,rotation=a)
    # Three actual shot setups, held stable within their semantic beats.
    for fr,loc,target,lens in ((1,(0,-19,.25),(0,0,.1),46),(int(f*.34),(pos[1][0]*.15,-17.5,.25),(pos[1][0]*.2,0,.15),60),(int(f*.67),(pos[2][0]*.10,-18.2,.2),(pos[2][0]*.15,0,.1),52),(f,(0,-19,.25),(0,0,.1),47)):
        cam.location=loc;look_at(cam,target,fr,lens)
    set_mouth("REST_SMILE",[(1,"REST_SMILE"),(f-2,"REST_SMILE")]);set_mouth("SMALL_OPEN",[(12,"SMALL_OPEN"),(int(f*.26),"SMALL_OPEN"),(int(f*.61),"SMALL_OPEN")]);set_mouth("ROUND_OPEN",[(int(f*.38),"ROUND_OPEN")]);set_mouth("WIDE_OPEN",[(int(f*.53),"WIDE_OPEN")]);set_mouth("SMILE_OPEN",[(int(f*.79),"SMILE_OPEN")]);set_mouth("REST_SMILE",[(f-2,"REST_SMILE")])
    out=os.path.join(OUT,"scene%02d"%scene_no,"actor");os.makedirs(out,exist_ok=True);s=bpy.context.scene;s.render.filepath=os.path.join(out,"SCENE%02d_COIN_ACTOR_RGBA.mov"%scene_no);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,"SCENE%02d_COIN_ACTOR_V3.blend"%scene_no));bpy.ops.render.render(animation=True)

args=sys.argv[sys.argv.index("--")+1:]
if len(args)!=2 or int(args[1]) not in SCENES: raise SystemExit("usage: ... -- environment|actor 1..8")
{"environment":env,"actor":actor}[args[0]](int(args[1]))
