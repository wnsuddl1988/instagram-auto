import os
import sys
import json
import requests
from dotenv import load_dotenv
from openai import OpenAI
from moviepy.editor import (
    AudioFileClip,
    ImageClip,
    CompositeVideoClip
)
from PIL import Image, ImageDraw, ImageFont

# 1. 환경 변수 로드
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print(json.dumps({"error": "OPENAI_API_KEY가 존재하지 않습니다."}))
    sys.exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

def generate_tts(text: str, output_path: str):
    """OpenAI TTS를 활용하여 성우 나레이션 MP3 음성 파일 생성"""
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="nova",  # 신뢰감 있고 부드러운 여성 성우 목소리
            input=text
        )
        response.stream_to_file(output_path)
        return True
    except Exception as e:
        print(f"TTS 생성 오류: {str(e)}", file=sys.stderr)
        return False

def download_media(url: str, output_path: str):
    """Pexels 이미지 소스를 로컬로 다운로드"""
    try:
        res = requests.get(url, stream=True, timeout=30)
        res.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in res.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"미디어 다운로드 오류: {str(e)}", file=sys.stderr)
        return False

def create_caption_frame(bg_image_path: str, title: str, sentence: str, output_frame_path: str):
    """ImageMagick 없이 PIL을 사용하여 한글 자막(자막 테두리+글씨) 프레임 합성"""
    try:
        # 배경 이미지 로드 및 1080x1920 세로 비율로 크롭 및 리사이즈
        img = Image.open(bg_image_path)
        img_w, img_h = img.size
        
        # 9:16 비율 종횡비 계산
        target_w = 1080
        target_h = 1920
        
        scale = max(target_w / img_w, target_h / img_h)
        new_w = int(img_w * scale)
        new_h = int(img_h * scale)
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # 중앙 크롭
        left = (new_w - target_w) / 2
        top = (new_h - target_h) / 2
        img_cropped = img_resized.crop((left, top, left + target_w, top + target_h))
        
        # 드로잉 객체 획득
        draw = ImageDraw.Draw(img_cropped)
        
        # 한글 폰트 로드 (Windows 기본 맑은 고딕 사용, 미존재 시 기본 폰트)
        font_path = "C:\\Windows\\Fonts\\malgunbd.ttf"  # 맑은 고딕 Bold
        if not os.path.exists(font_path):
            font_path = "C:\\Windows\\Fonts\\malgun.ttf"
            
        try:
            title_font = ImageFont.truetype(font_path, 48)
            caption_font = ImageFont.truetype(font_path, 42)
        except:
            # 폰트 부재 시 fallback
            title_font = ImageFont.load_default()
            caption_font = ImageFont.load_default()
            
        # 1. 상단 제목 자막 드로잉 (그림자 효과 포함)
        title_w = draw.textlength(title, font=title_font)
        title_x = (target_w - title_w) / 2
        title_y = 250
        
        # 검은색 테두리/그림자 효과
        for offset_x in [-2, 0, 2]:
            for offset_y in [-2, 0, 2]:
                draw.text((title_x + offset_x, title_y + offset_y), title, font=title_font, fill="black")
        draw.text((title_x, title_y), title, font=title_font, fill="#FFE600") # 노란색 제목
        
        # 2. 중앙/하단 자막 줄바꿈 처리 및 드로잉
        words = sentence.split()
        lines = []
        current_line = ""
        for word in words:
            test_line = current_line + " " + word if current_line else word
            if draw.textlength(test_line, font=caption_font) < 900:
                current_line = test_line
            else:
                lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
            
        # 자막 시작 y축
        start_y = 1450 - (len(lines) * 30)
        for i, line in enumerate(lines):
            line_w = draw.textlength(line, font=caption_font)
            line_x = (target_w - line_w) / 2
            line_y = start_y + (i * 65)
            
            # 반투명 텍스트 박스 그리기
            box_padding = 15
            draw.rectangle(
                [line_x - box_padding, line_y - 5, line_x + line_w + box_padding, line_y + 55],
                fill=(0, 0, 0, 160)
            )
            
            # 흰색 자막 글씨 쓰기
            draw.text((line_x, line_y), line, font=caption_font, fill="white")
            
        # 프레임 임시 저장
        img_cropped.save(output_frame_path, "JPEG", quality=95)
        return True
    except Exception as e:
        print(f"자막 이미지 드로잉 실패: {str(e)}", file=sys.stderr)
        return False

def render_shorts(script_data: dict, output_file: str):
    """나레이션 MP3 음성과 PIL 자막 씬 프레임들을 영상 인코딩"""
    title = script_data.get("title", "AutoShorts")
    full_text = script_data.get("script", "")
    image_url = script_data.get("imageUrl")
    
    os.makedirs("output", exist_ok=True)
    temp_audio = "output/temp_narration.mp3"
    temp_bg = "output/temp_bg.jpg"
    
    print("🎙️ OpenAI TTS 성우 나레이션 음성 생성 중...", file=sys.stderr)
    if not generate_tts(full_text, temp_audio):
        raise Exception("TTS 나레이션 생성 실패")
        
    print("🖼️ Pexels 매칭 고화질 배경 미디어 다운로드 중...", file=sys.stderr)
    if not image_url:
        image_url = "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg"
    if not download_media(image_url, temp_bg):
        raise Exception("Pexels 이미지 리소스 다운로드 실패")

    try:
        audio_clip = AudioFileClip(temp_audio)
        duration = audio_clip.duration
        
        # 스크립트 문장 분할
        sentences = [s.strip() for s in full_text.split(".") if s.strip()]
        if not sentences:
            sentences = [full_text]
            
        sec_per_sentence = duration / len(sentences)
        
        clips = []
        for i, sentence in enumerate(sentences):
            frame_path = f"output/frame_{i}.jpg"
            # 각 자막 프레임 이미지 실시간 생성
            create_caption_frame(temp_bg, title, sentence, frame_path)
            
            # 문장 읽는 지속 시간에 맞춰 이미지 클립 배정
            img_clip = ImageClip(frame_path).set_duration(sec_per_sentence)
            start_time = i * sec_per_sentence
            img_clip = img_clip.set_start(start_time)
            clips.append(img_clip)
            
        # 씬 컴포지션 빌드
        video = CompositeVideoClip(clips, size=(1080, 1920))
        video = video.set_audio(audio_clip)
        
        print("🎬 고품질 FFmpeg 9:16 비디오 합성 인코딩 중...", file=sys.stderr)
        video.write_videofile(
            output_file,
            fps=24,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile="output/temp_render_voice.mp3",
            remove_temp=True,
            verbose=False,
            logger=None
        )
        
        audio_clip.close()
        for c in clips:
            c.close()
        video.close()
        
        # 개별 임시 프레임 삭제
        for i in range(len(sentences)):
            try: os.remove(f"output/frame_{i}.jpg")
            except: pass
            
        return True
    except Exception as e:
        print(f"렌더러 합성 오류: {str(e)}", file=sys.stderr)
        return False
    finally:
        if os.path.exists(temp_audio):
            try: os.remove(temp_audio)
            except: pass
        if os.path.exists(temp_bg):
            try: os.remove(temp_bg)
            except: pass

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "파라미터가 부족합니다."}))
        sys.exit(1)
        
    script_path = sys.argv[1]
    out_file = sys.argv[2]
    
    with open(script_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    try:
        success = render_shorts(data, out_file)
        if success:
            print(json.dumps({"success": True, "output": out_file}))
        else:
            print(json.dumps({"success": False, "error": "렌더링 실패"}))
    except Exception as ex:
        print(json.dumps({"success": False, "error": str(ex)}))
