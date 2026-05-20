#!/usr/bin/env python3
"""
AutoShorts AI - 동영상 렌더링 엔진 (MoviePy + FFmpeg)
- ASS 자막 생성 및 FFmpeg 번인 (레퍼런스급 퀄리티)
- FFmpeg 오디오 믹싱 (나레이션 + BGM)
- Pexels/Pollinations 동적 소스
"""

import os
import sys
import json
import requests
import urllib.parse
import shutil
import tempfile

# Pillow ANTIALIAS 호환성 (MoviePy 내부 호출 우회)
import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS

from dotenv import load_dotenv
from openai import OpenAI
from moviepy.editor import (
    AudioFileClip,
    VideoFileClip,
    concatenate_videoclips,
)

# 환경 변수 로드
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# 공통 HTTP 헤더
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*"
}

# OpenAI 클라이언트 초기화
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Fallback 스톡 영상 URL 풀 (5개)
FALLBACK_URLS = [
    "https://videos.pexels.com/video-files/3052388/3052388-sd_640_360_25fps.mp4",
    "https://videos.pexels.com/video-files/3041471/3041471-sd_640_360_30fps.mp4",
    "https://videos.pexels.com/video-files/9614835/9614835-sd_640_360_24fps.mp4",
    "https://videos.pexels.com/video-files/7578389/7578389-sd_640_360_25fps.mp4",
    "https://videos.pexels.com/video-files/5568703/5568703-sd_640_360_30fps.mp4",
]


def generate_tts(text, output_path):
    """OpenAI TTS API로 음성 생성"""
    try:
        with openai_client.audio.speech.with_streaming_response.create(
            model="tts-1",
            voice="nova",
            input=text,
        ) as response:
            response.stream_to_file(output_path)
        return True
    except Exception as e:
        print(f"❌ TTS 생성 실패: {e}", file=sys.stderr)
        return False


def generate_ass_subtitle(word_timestamps, output_path, font_path=None):
    """
    wordTimestamps 배열을 기반으로 ASS(Advanced SubStation Alpha) 자막 파일 생성
    - 3~5단어씩 그룹화하여 한 화면에 표시
    - 현재 재생 단어만 노란색 강조 (노래방 효과)
    - 중간 하단 위치 (Alignment 2)
    """
    def format_ass_time(seconds):
        """초 단위 시간을 ASS 형식으로 변환 (HH:MM:SS.CC)"""
        total_cs = int(seconds * 100)
        hours = total_cs // 360000
        remainder = total_cs % 360000
        minutes = remainder // 6000
        remainder = remainder % 6000
        secs = remainder // 100
        cs = remainder % 100
        return f"{hours}:{minutes:02d}:{secs:02d}.{cs:02d}"

    try:
        # 폰트 선택 (assets/fonts 우선)
        font_name = "DoHyeon"
        if font_path and "BlackHanSans" in font_path:
            font_name = "BlackHanSans"

        # ASS 파일 헤더
        ass_content = """[Script Info]
Title: AutoShorts Subtitle
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{},56,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,2,0,0,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""".format(font_name)

        # 3~5단어씩 그룹화하여 동적 강조 자막 생성
        dialogue_lines = []
        if word_timestamps:
            GROUP_SIZE = 4  # 3~5 중간값

            # 단어들을 GROUP_SIZE씩 그룹으로 분할
            for group_idx in range(0, len(word_timestamps), GROUP_SIZE):
                group = word_timestamps[group_idx:group_idx + GROUP_SIZE]

                # 각 그룹 내의 단어들에 대해 개별 Dialogue 라인 생성
                for word_idx, word_data in enumerate(group):
                    current_word = word_data.get("word", "")
                    start = word_data.get("start", 0.0)
                    end = word_data.get("end", 0.0)

                    start_str = format_ass_time(start)
                    end_str = format_ass_time(end)

                    # 그룹 내 모든 단어를 텍스트로 구성 (현재 단어만 노란색)
                    text_parts = []
                    for i, w in enumerate(group):
                        w_text = w.get("word", "")
                        if i == word_idx:
                            # 현재 재생 단어: 노란색 (BGR: 00E6FF = RGB(255, 230, 0))
                            text_parts.append("{\\c&H00E6FF&}" + w_text + "{\\r}")
                        else:
                            # 나머지 단어: 흰색 (기본값)
                            text_parts.append(w_text)

                    text = " ".join(text_parts)
                    dialogue = f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{text}"
                    dialogue_lines.append(dialogue)

        ass_content += "\n".join(dialogue_lines)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        print(f"✓ ASS 자막 생성 완료: {output_path}", file=sys.stderr)
        return True
    except Exception as e:
        print(f"❌ ASS 자막 생성 실패: {e}", file=sys.stderr)
        return False


def search_pexels_video(query):
    """Pexels 영상 검색"""
    if not PEXELS_API_KEY:
        return None

    try:
        url = "https://api.pexels.com/videos/search"
        headers = {"Authorization": PEXELS_API_KEY}
        params = {
            "query": query,
            "orientation": "portrait",
            "per_page": 3,
            "size": "medium",
        }

        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("videos"):
            video = data["videos"][0]
            if video.get("video_files"):
                for vf in video["video_files"]:
                    if vf.get("type") == "video/mp4":
                        return vf.get("link")

        return None
    except Exception as e:
        print(f"⚠️  Pexels 검색 실패: {e}", file=sys.stderr)
        return None


def download_pollinations_image(prompt, output_path):
    """Pollinations.ai AI 이미지 다운로드"""
    try:
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1080&height=1920&model=turbo&nologo=true"

        response = requests.get(url, headers=HEADERS, timeout=60)
        response.raise_for_status()

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(response.content)

        return True
    except Exception as e:
        print(f"⚠️  Pollinations 이미지 다운로드 실패: {e}", file=sys.stderr)
        return False


def download_file(url, output_path):
    """일반 파일 다운로드 (비디오용)"""
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        response = requests.get(url, headers=HEADERS, stream=True, timeout=30)
        response.raise_for_status()

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        return True
    except Exception as e:
        print(f"⚠️  파일 다운로드 실패: {e}", file=sys.stderr)
        return False




def _select_bgm(bgm_type="emotional", bgm_dir="assets/bgm"):
    """동적 BGM 파일 선택 (bgmType 기반)"""
    try:
        bgm_path = os.path.join(bgm_dir, f"{bgm_type}.mp3")
        if os.path.exists(bgm_path):
            return bgm_path

        # Fallback: 폴더의 첫 MP3 파일
        if os.path.exists(bgm_dir):
            for file in sorted(os.listdir(bgm_dir)):
                if file.endswith(".mp3"):
                    return os.path.join(bgm_dir, file)

        print("⚠️  BGM 파일을 찾을 수 없습니다", file=sys.stderr)
        return None
    except Exception as e:
        print(f"⚠️  BGM 선택 중 오류: {e}", file=sys.stderr)
        return None


def _render_with_ffmpeg(video_path, narration_path, subtitle_path, output_path, bgm_type="emotional"):
    """
    FFmpeg로 최종 렌더링
    - BGM과 나레이션 오디오 믹싱 (나레이션 1.0, BGM 0.1)
    - ASS 자막 번인
    """
    try:
        import subprocess

        # BGM 선택 (bgmType 기반)
        bgm_path = _select_bgm(bgm_type)

        # FFmpeg 명령어 구성
        cmd = ["ffmpeg", "-i", video_path, "-i", narration_path]

        # BGM이 있으면 추가 입력
        if bgm_path and os.path.exists(bgm_path):
            cmd.extend(["-i", bgm_path])
            # 오디오 믹싱 + 자막 필터
            if subtitle_path and os.path.exists(subtitle_path):
                filter_complex = f'[0]subtitles={subtitle_path}[v];[1]volume=1.0[a1];[2]volume=0.1[a2];[a1][a2]amix=inputs=2:duration=first[a]'
                cmd.extend(["-filter_complex", filter_complex, "-map", "[v]", "-map", "[a]"])
            else:
                filter_complex = '[1]volume=1.0[a1];[2]volume=0.1[a2];[a1][a2]amix=inputs=2:duration=first[a]'
                cmd.extend(["-filter_complex", filter_complex, "-map", "0:v", "-map", "[a]"])
        else:
            # BGM 없이 자막만
            if subtitle_path and os.path.exists(subtitle_path):
                cmd.extend(["-vf", f"subtitles={subtitle_path}", "-map", "0:v", "-map", "1:a"])
            else:
                cmd.extend(["-map", "0:v", "-map", "1:a"])

        # 인코딩 옵션
        cmd.extend(["-c:v", "libx264", "-c:a", "aac", "-y", output_path])

        print(f"🎬 FFmpeg 최종 렌더링 중...", file=sys.stderr)
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"⚠️  FFmpeg stderr: {result.stderr}", file=sys.stderr)
        else:
            print(f"✓ FFmpeg 렌더링 완료", file=sys.stderr)

        return True

    except Exception as e:
        print(f"❌ FFmpeg 렌더링 실패: {e}", file=sys.stderr)
        return False



def render_shorts_v3(script_data, output_file):
    """
    FFmpeg 통합 렌더링 (레퍼런스 영상급 퀄리티)
    - ASS 자막 생성 및 번인
    - 나레이션 + BGM 오디오 믹싱
    - MoviePy는 순수 비디오 합성만 수행
    """
    try:
        script = script_data.get("script", "")
        scenes = script_data.get("scenes", [])
        word_timestamps = script_data.get("wordTimestamps", [])
        bgm_type = script_data.get("bgmType", "emotional")

        if not scenes:
            raise Exception("씬이 없습니다")

        temp_dir = tempfile.mkdtemp()

        # Step 1: ASS 자막 생성
        subtitle_path = None
        if word_timestamps:
            script_id = script_data.get("id", "temp")
            subtitle_path = f"output/subtitle_{script_id}.ass"
            if not generate_ass_subtitle(word_timestamps, subtitle_path):
                print("⚠️  ASS 자막 생성 실패, 자막 없이 진행", file=sys.stderr)
                subtitle_path = None

        # Step 2: 나레이션 오디오 확인
        audio_path = "output/temp_narration.mp3"
        if not os.path.exists(audio_path):
            raise Exception("나레이션 오디오를 찾을 수 없습니다")

        audio_clip = AudioFileClip(audio_path)
        total_duration = audio_clip.duration
        duration_per_scene = total_duration / len(scenes) if scenes else 0
        print(f"🎙️  나레이션 길이: {total_duration:.1f}초, 씬당 {duration_per_scene:.1f}초", file=sys.stderr)

        # Step 3: 씬별 비디오 클립 로드 (자막 처리 없음)
        clips = []
        for i, scene_data in enumerate(scenes):
            bg_source = scene_data.get("localMediaUrl")

            if not bg_source or not os.path.exists(bg_source):
                fallback_url = FALLBACK_URLS[i % len(FALLBACK_URLS)]
                bg_source = os.path.join(temp_dir, f"fallback_scene_{i}.mp4")
                if not download_file(fallback_url, bg_source):
                    raise Exception(f"씬 {i} 로드 실패")

            # 비디오 클립 로드 및 리사이즈
            try:
                clip = VideoFileClip(bg_source)
                clip = clip.resize((1080, 1920)).set_duration(duration_per_scene)
                clips.append(clip)
                print(f"✓ 씬 {i} 로드: {os.path.basename(bg_source)}", file=sys.stderr)
            except Exception as e:
                print(f"❌ 씬 {i} 로드 실패: {e}", file=sys.stderr)
                raise

        # Step 4: 비디오 합성 (MoviePy)
        temp_video_path = os.path.join(temp_dir, "video_raw.mp4")
        final_video = concatenate_videoclips(clips, method="compose")

        print(f"🎬 비디오 합성 중...", file=sys.stderr)
        final_video.write_videofile(
            temp_video_path,
            fps=24,
            codec="libx264",
            audio_codec="aac",
            remove_temp=True,
            verbose=False,
            logger=None,
        )

        # Step 5: FFmpeg으로 최종 처리 (오디오 믹싱 + 자막 번인)
        _render_with_ffmpeg(temp_video_path, audio_path, subtitle_path, output_file, bgm_type)

        # Step 6: 정리
        audio_clip.close()
        final_video.close()
        shutil.rmtree(temp_dir, ignore_errors=True)

        return True

    except Exception as e:
        print(f"❌ 렌더링 실패: {e}", file=sys.stderr)
        return False



if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "사용법: python render.py <script.json> <output.mp4>",
                }
            )
        )
        sys.exit(1)

    script_json_path = sys.argv[1]
    output_mp4_path = sys.argv[2]

    try:
        with open(script_json_path, "r", encoding="utf-8") as f:
            script_data = json.load(f)

        success = render_shorts_v3(script_data, output_mp4_path)

        if success:
            print(
                json.dumps(
                    {
                        "success": True,
                        "output": os.path.abspath(output_mp4_path),
                    }
                )
            )
        else:
            print(
                json.dumps(
                    {
                        "success": False,
                        "error": "렌더링 실패",
                    }
                )
            )

    except Exception as e:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(e),
                }
            )
        )
        sys.exit(1)
