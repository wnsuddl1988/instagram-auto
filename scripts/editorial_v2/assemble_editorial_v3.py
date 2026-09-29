"""V3 screen-space compositor, semantic beat report, and final master assembler."""
import hashlib,json,os,subprocess
ROOT=r"C:\Users\PC\jjy\instagram-auto"; V1=os.path.join(ROOT,"output","editorial-v2","coin-production-reentry-v1"); V3=os.path.join(ROOT,"output","editorial-v2","coin-production-reentry-v3")
FONT=r"C\:/Windows/Fonts/Daishin Title Extra Bold.TTF"
SCENES={
1:{"audio":"scene01/audio/SCENE01_COIN_FINAL_DELIVERY_MASTER.wav","ass":"scene01/render/SCENE01_COIN_NARRATION_SUBTITLES_GOLDEN.ass","beats":[("B01","카드값 일부만 냈는데 연체가 아니라고요?",.03,2.66,"HOLD_PHONE → LOOK_AT_TARGET","phone / payment status","결제 완료",650),("B02","안심하기 전에",2.73,3.53,"LEAN_BACK → CONCERN_REACTION","remaining balance","남은 잔액",650),("B03","다음 달로 넘어간 금액부터 확인해야 합니다.",3.59,6.39,"POINT_RIGHT → LOOK_BACK_VIEWER","carryover arrow","다음 달",650)]},
2:{"audio":"scene02/audio/SCENE02_COIN_FINAL_DELIVERY_MASTER.wav","ass":"scene02/render/SCENE02_COIN_NARRATION_SUBTITLES_GOLDEN_RESTORED_R2_TERM_INTEGRITY.ass","beats":[("B01","리볼빙은 일부결제금액이월약정입니다.",.11,2.38,"BODY_TURN_LEFT → BODY_TURN_RIGHT","full/partial choices","전액 결제 · 일부 결제",75),("B02","일부만 내면 나머지가",2.84,3.92,"POINT_RIGHT → FOLLOW_MOVING_VALUE","partial option","남은 금액",650),("B03","다음 달로 넘어갑니다.",3.95,5.03,"STEP_RIGHT → LOOK_AT_TARGET","carryover move","다음 달",650)]},
3:{"audio":"scene03/audio/SCENE03_COIN_FINAL_DELIVERY_MASTER.wav","ass":"scene03/render/SCENE03_COIN_NARRATION_SUBTITLES_GOLDEN_RESTORED.ass","beats":[("B01","연체는 피할 수 있어도",.04,1.37,"HOLD_STATEMENT → LOOK_AT_TARGET","statement","넘긴 잔액",70),("B02","넘긴 잔액엔 수수료가 붙습니다.",1.43,3.17,"POINT_RIGHT → CONCERN_REACTION","fee marker","수수료",650),("B03","빚은 남고 결제 시점만 미뤄집니다.",3.62,5.66,"LEAN_BACK → VIEWER_ADDRESS","delay arrow","결제 시점",650)]},
4:{"audio":"scene04/audio/SCENE04_COIN_FINAL_DELIVERY_MASTER.wav","ass":"scene04/render/SCENE04_COIN_NARRATION_SUBTITLES_R2_GOLDEN_SAMPLE.ass","beats":[("B01","공식 예시처럼 100만 원 중",.10,1.20,"PRESENT_OBJECT → LOOK_AT_TARGET","value token","100만 원",650),("B02","20%인 20만 원만 내면",1.20,3.68,"TAP_TARGET → FOLLOW_MOVING_VALUE","calculator","20만 원",650),("B03","남은 80만 원은 다음 달로 넘어갑니다.",3.76,6.26,"POINT_RIGHT → NOD_REALIZATION","remaining value","80만 원 → 다음 달",650),("B04","여기에 새 사용액과 수수료까지 겹칠 수 있습니다.",6.34,9.07,"CONCERN_REACTION → VIEWER_ADDRESS","stack event","새 사용액 + 수수료",650)]},
5:{"audio":"scene05/audio/SCENE05_COIN_FINAL_DELIVERY_MASTER.wav","ass":"scene05/render/SCENE05_COIN_NARRATION_SUBTITLES_GOLDEN.ass","beats":[("B01","할부는 갚는 기간이 정해져 있지만",.05,2.21,"BODY_TURN_LEFT → POINT_LEFT","fixed endpoint","할부 · 종료",65),("B02","리볼빙은 남은 금액을 계속 넘길 수 있습니다.",2.29,5.07,"BODY_TURN_RIGHT → POINT_RIGHT","repeating loop","리볼빙 · 반복",650),("B03","상환 종료 시점이 흐려지기 쉽습니다.",5.14,7.73,"LEAN_BACK → NOD_REALIZATION","comparison","종료 시점 흐려짐",650)]},
6:{"audio":"scene06/audio/SCENE06_COIN_FINAL_DELIVERY_MASTER.wav","ass":"scene06/render/SCENE06_COIN_NARRATION_SUBTITLES_GOLDEN_GLOBAL_CONTRACT_R4.ass","beats":[("B01","수수료율은 사람마다 다릅니다.",.02,1.79,"HOLD_STATEMENT → LOOK_AT_TARGET","statement rate","수수료율",650),("B02","내 비율은 카드 대금명세서나",2.18,3.96,"POINT_LEFT → BODY_TURN_RIGHT","rate row","내 비율",75),("B03","카드사 홈페이지에서 직접 확인해야 합니다.",3.98,6.22,"POINT_RIGHT → VIEWER_ADDRESS","portal","카드사 홈페이지",650)]},
7:{"audio":"scene07/audio/SCENE07_COIN_FINAL_DELIVERY_MASTER.wav","ass":"scene07/render/SCENE07_COIN_NARRATION_SUBTITLES_GOLDEN.ass","beats":[("B01","이미 사용 중이라면 새 결제를 줄이고",0,2.94,"SLIDER_PULL_DOWN → LOOK_AT_TARGET","spending slider","새 결제 ↓",650),("B02","가능한 범위에서 결제비율을 높여",3.22,5.32,"SLIDER_PUSH_UP → FOLLOW_MOVING_VALUE","payment ratio slider","결제비율 ↑",650),("B03","단기간에 잔액을 줄이는 계획부터 세우세요.",5.40,8.07,"PRESENT_OBJECT → CONFIDENT_EXPLAIN","target marker","단기간 잔액 감소",650)]},
8:{"audio":"scene08/audio/SCENE08_COIN_FINAL_DELIVERY_MASTER_R3_LOUDNESS_MATCHED.wav","ass":"scene08/render/SCENE08_COIN_NARRATION_SUBTITLES_GOLDEN_R3.ass","beats":[("B01","오늘 명세서에서 일부결제금액이월약정",0,2.92,"TAP_TARGET → LOOK_AT_TARGET","checklist 1","일부결제금액이월약정",650),("B02","이월잔액",3.03,3.64,"STEP_LEFT → TAP_TARGET","checklist 2","이월잔액",650),("B03","적용 수수료율 세 항목을 확인하세요.",3.76,6.10,"POINT_DOWN → HOLD_PHONE","checklist 3","적용 수수료율",650),("B04","모르면 카드사에 해지를 포함한 상환 방법을 문의하세요.",6.48,9.13,"HOLD_PHONE → VIEWER_ADDRESS","phone/contact","카드사 문의",650)]}}

def run(a): subprocess.run(a,check=True)
def esc(p): return p.replace('\\','/').replace(':',r'\:')
def sha(p):
 h=hashlib.sha256();f=open(p,'rb')
 for x in iter(lambda:f.read(1024*1024),b''):h.update(x)
 f.close();return h.hexdigest().upper()
def probe(p):return json.loads(subprocess.run(['ffprobe','-v','error','-count_frames','-show_entries','format=duration:stream=codec_type,nb_read_frames','-of','json',p],capture_output=True,text=True,check=True).stdout)
def filt(scene):
 bits=[]
 for _,_,s,e,_,_,info,x in SCENES[scene]['beats']:
  y=410;w=390 if x<500 else 370;box=f"drawbox=x={x-20}:y={y-25}:w={w}:h=165:color=0x062336@0.96:t=fill:enable='between(t,{s},{e})'"
  txt=f"drawtext=fontfile='{FONT}':text='{info}':fontcolor=white:fontsize=78:x={x}:y={y}:enable='between(t,{s},{e})'"
  bits += [box,txt]
 ass=os.path.join(V1,SCENES[scene]['ass']);return ','.join(bits)+",ass=filename='"+esc(ass)+"'"
def scene_final(n):
 env=os.path.join(V3,f'scene{n:02d}','environment',f'SCENE{n:02d}_ENVIRONMENT.mp4');actor=os.path.join(V3,f'scene{n:02d}','actor',f'SCENE{n:02d}_COIN_ACTOR_RGBA.mov');outd=os.path.join(V3,f'scene{n:02d}','video');os.makedirs(outd,exist_ok=True);out=os.path.join(outd,f'SCENE{n:02d}_DIRECTED_V3_FINAL_AV.mp4')
 run(['ffmpeg','-y','-v','error','-i',env,'-i',actor,'-i',os.path.join(V1,SCENES[n]['audio']),'-filter_complex',f'[0:v][1:v]overlay=shortest=1:format=auto,{filt(n)}[v]','-map','[v]','-map','2:a:0','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-ar','44100','-ac','1','-t',probe(env)['format']['duration'],out]);return out
def cta():
 actor=os.path.join(V3,'scene08','actor','SCENE08_COIN_ACTOR_RGBA.mov');out=os.path.join(V3,'final','POST_CANONICAL_CTA_OUTRO_V3.mp4');os.makedirs(os.path.dirname(out),exist_ok=True)
 graph=f"[0:v]trim=start=3.2:end=4.2,setpts=PTS-STARTPTS[a];color=c=0x062333:s=1080x1920:d=1[bg];[bg][a]overlay=0:0:format=auto,drawbox=x=460:y=500:w=560:h=470:color=0x0B3B48@0.96:t=fill,drawtext=fontfile='{FONT}':text='다음 경제 이슈도\\n짧고 쉽게':fontcolor=white:fontsize=68:x=740:y=590:drawtext=fontfile='{FONT}':text='구독 · 좋아요':fontcolor=0x062333:fontsize=52:x=740:y=790:box=1:boxcolor=0x46E8B7@1:boxborderw=22,drawtext=fontfile='{FONT}':text='다음 쇼츠도 이어서':fontcolor=0x73E9FF:fontsize=36:x=740:y=900[v]"
 run(['ffmpeg','-y','-v','error','-i',actor,'-filter_complex',graph,'-map','[v]','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',out]);return out
def main():
 finals=[scene_final(i) for i in range(1,9)];outcta=cta();finals.append(outcta);od=os.path.join(V3,'final');concat=os.path.join(od,'v3_concat.txt');open(concat,'w',encoding='utf8').write(''.join("file '%s'\n"%x.replace('\\','/') for x in finals));master=os.path.join(od,'ECONOMIC_TRANSLATOR_COIN_DIRECTED_FINAL_MASTER_V3.mp4')
 run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',concat,'-filter_complex','[0:a]alimiter=limit=0.70:level=0:attack=5:release=50[a]','-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-ar','44100','-ac','1',master])
 run(['ffmpeg','-y','-v','error','-i',master,'-vf','fps=1/4,scale=270:480,tile=4x4:padding=8:margin=8','-frames:v','1',os.path.join(od,'V3_MASTER_CONTACT_SHEET.png')])
 # Environment and actor contact sheets are direct layer evidence.
 run(['ffmpeg','-y','-v','error','-i',os.path.join(V3,'scene01','environment','SCENE01_ENVIRONMENT.mp4'),'-vf','fps=1/2,scale=270:480,tile=4x4','-frames:v','1',os.path.join(od,'V3_ENVIRONMENT_CONTACT_SHEET.png')])
 run(['ffmpeg','-y','-v','error','-i',os.path.join(V3,'scene08','actor','SCENE08_COIN_ACTOR_RGBA.mov'),'-vf','fps=1/2,scale=270:480,tile=4x4','-frames:v','1',os.path.join(od,'V3_ACTOR_ACTION_CONTACT_SHEET.png')])
 report=os.path.join(od,'V3_SCENE_BEAT_DIRECTION_REPORT.md');rows=[]
 with open(report,'w',encoding='utf8') as f:
  f.write('# V3 Semantic Beat Director\n\n');
  for n,d in SCENES.items():
   f.write(f'## Scene {n:02d} — {d["beats"][0][5]}\n\n| Beat | Spoken text | Time | Action | Target | Info event |\n|---|---|---|---|---|---|\n')
   for bid,spoken,s,e,act,target,info,x in d['beats']:f.write(f'| {bid} | {spoken} | {s:.2f}–{e:.2f} | {act} | {target} | {info} |\n')
   f.write('\n')
 manifest={'EDITORIAL_DIRECTION_V3':'PASS_CANDIDATE','TECHNICAL_GLOBAL_CONTRACT':'PASS_CANDIDATE','scenes':[{ 'scene':n,'path':p,'sha256':sha(p),'probe':probe(p),'beats':SCENES[n]['beats']}for n,p in enumerate(finals[:8],1)],'cta':{'path':outcta,'sha256':sha(outcta)},'master':{'path':master,'sha256':sha(master),'probe':probe(master)}}
 json.dump(manifest,open(os.path.join(od,'V3_MASTER_MANIFEST.json'),'w',encoding='utf8'),ensure_ascii=False,indent=2);print(json.dumps(manifest,ensure_ascii=False))
if __name__=='__main__':main()
