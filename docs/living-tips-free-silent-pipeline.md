# AutoShorts AI — 생활꿀팁 무료 무음 샘플 파이프라인

> Status: **LEGACY / REFERENCE ONLY** (2026-06-27). This old living_tips render pipeline is not active MVP direction. Do not run render/output/API flows from this document without explicit Owner approval.

> 최초 작성: 2026-05-24  
> 검증된 루프: QA-LH-7 (laundry-clothing, 95/pass, accept_silent_sample)  
> 관련 문서: `docs/living-tips-qa-strategy.md`, `docs/image-provider-fallback-strategy.md`

---

## 1. 목적

유료 API(Imagen/TTS/ElevenLabs/Pollinations) 없이 생활꿀팁 숏폼 샘플을 생성한다.

- **비용**: $0
- **출력**: 1080×1920, 45~60초, h264, 무음(자막만)
- **용도**: 콘텐츠 시각 확인, 승인 후 TTS 최종본 생성 전 사전 검토

---

## 2. 전제 조건

### 2-1. 환경 변수 (.env.local)

```bash
# 유료 플래그 — 반드시 false 유지
PAID_API_ENABLED=false
ALLOW_OPENAI_GENERATE=false
ALLOW_OPENAI_TTS=false
ALLOW_IMAGEN=false
ALLOW_ELEVENLABS=false

# Pexels — 무료 stock 이미지 (필수)
PEXELS_API_KEY=your_pexels_key_here

# OpenAI — generate 단계에서만 임시 true (이후 즉시 false 복구)
OPENAI_API_KEY=your_openai_key_here
```

### 2-2. 필수 런타임

| 도구 | 용도 |
|------|------|
| Node.js 18+ | mjs 스크립트 실행 |
| Python 3.10+ | render_v2.py |
| FFmpeg + ffprobe | 영상 조립 + 메타데이터 확인 |
| pnpm | 빌드 검증 |

---

## 3. 파이프라인 단계별 절차

### Step 1 — Plan 생성 (generate-v2)

> ⚠️ 실제 OpenAI GPT 호출 필요 — `ALLOW_OPENAI_GENERATE=true` 임시 활성화 후 즉시 복구

```bash
# UI에서 실행: POST /api/generate-v2
# subTopicId: laundry-clothing | kitchen-cleaning | food-storage
# referenceStyle: living_tips
# imageMode: stock-first
```

또는 기존 plan JSON 재사용 (generate 생략 가능):
```
output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh7_plan.json
```

**생성 직후 `ALLOW_OPENAI_GENERATE=false` 복구 필수.**

---

### Step 2 — qualityScore 확인

plan JSON에서 `_meta.qualityScore` 확인:

```bash
node -e "const p=require('./output/v2/paid_qa/YOUR_PLAN.json'); console.log(p._meta?.qualityScore, p._meta?.qualityGate)"
```

| 조건 | 다음 단계 |
|------|----------|
| score ≥ 80, gate = "pass" | Step 3 진행 |
| score < 80 또는 gate = "fail"/"review" | generate 재시도 또는 plan 수동 수정 |

**Gate 기준**:
- Gate L: living_tips 후반 밀도 부족 → cap 79
- Gate M: narration 짧음 3건+ → cap 79
- Gate A/B: 씬 수/critical fail → fail 상한 59

---

### Step 3 — Pexels 이미지 검색 + 다운로드

```bash
node --env-file=.env.local scripts/check-lh7-pexels-stock-images.mjs
```

> 새 plan의 경우 스크립트 내 plan 경로를 수정하거나 범용 스크립트 사용

**확인 기준**:
- 10/10 씬 다운로드 성공
- 실패 씬이 있으면 `fallbackSearchQuery` 수정 후 재시도

**출력**:
```
output/v2/paid_qa/lh7_pexels_stock_images/scene_01.jpg
...
output/v2/paid_qa/lh7_pexels_stock_images/scene_10.jpg
output/v2/paid_qa/lh7_pexels_stock_image_check.json
```

---

### Step 4 — render_plan.json 생성 (localImagePath 주입)

plan JSON을 복사하고 각 씬에 `localImagePath` 필드 추가:

```javascript
// 예시 (scripts/fix-lh7-visual.mjs 참조)
for (const scene of plan.scenes) {
  const padded = String(scene.sceneNumber).padStart(2, "0");
  scene.localImagePath = `output/v2/paid_qa/lh7_pexels_stock_images/scene_${padded}.jpg`;
}
```

`narrationPath` 필드는 추가하지 않음 → 무음 렌더.

**저장 위치 예시**:
```
output/v2/paid_qa/lh7_silent_render/render_plan.json
```

---

### Step 5 — 무음 영상 렌더

```bash
python python/render_v2.py \
  "output/v2/paid_qa/lh7_silent_render/render_plan.json" \
  "output/v2/paid_qa/lh7_silent_render/lh7_silent_preview.mp4"
```

`render_v2.py` 내부 `_add_audio()`:
- `narrationPath` 없거나 파일 없으면 → `os.replace(video_path, output_path)` (무음 그대로)
- 별도 코드 수정 불필요

---

### Step 6 — 영상 메타데이터 확인

```bash
ffprobe -v quiet -print_format json -show_streams -show_format \
  "output/v2/paid_qa/lh7_silent_render/lh7_silent_preview.mp4" \
  | python -c "
import sys,json; d=json.load(sys.stdin); fmt=d['format']
vs=[s for s in d['streams'] if s['codec_type']=='video'][0]
print(f'Resolution: {vs[\"width\"]}x{vs[\"height\"]}')
print(f'Duration: {float(fmt[\"duration\"]):.1f}s')
print(f'Size: {int(fmt[\"size\"])//1024//1024:.2f}MB')
audio=[s for s in d['streams'] if s['codec_type']=='audio']
print(f'Audio: {\"none\" if not audio else audio[0][\"codec_name\"]}')"
```

**통과 기준**:
- Resolution: `1080x1920`
- Duration: `45~60s`
- Audio: `none`

---

### Step 7 — scene별 프레임 추출 + Visual QA

```bash
python -c "
import subprocess, os
video = 'output/v2/paid_qa/lh7_silent_render/lh7_silent_preview.mp4'
frames_dir = 'output/v2/paid_qa/lh7_silent_render/qa_frames'
os.makedirs(frames_dir, exist_ok=True)
# 씬 midpoint: (sceneNumber - 1) * durationSec + durationSec / 2
scenes = [(i, (i-1)*5 + 2.5) for i in range(1,11)]
for n, t in scenes:
    pad = str(n).zfill(2)
    out = os.path.join(frames_dir, f'scene_{pad}_mid.jpg')
    subprocess.run(['ffmpeg','-y','-ss',str(t),'-i',video,'-frames:v','1','-q:v','2',out], capture_output=True)
    print(f'scene_{pad}: {t}s')
"
```

**QA 체크리스트** (각 프레임에 대해):

| 항목 | 기준 |
|------|------|
| 이미지-자막 일치 | 캡션 내용과 이미지 맥락 일치 |
| 인물/신체 노출 | 얼굴 클로즈업, 신체 부각 이미지 없어야 함 |
| topTitle 주제 | subTopicId와 일치 (예: 세탁→"세탁" 포함) |
| 자막 가독성 | 배경 대비 충분, 잘림 없음 |
| 씬 카운터 | N/10 표기 정상 |
| scene 10 motion | slow_zoom_out 확인 (start→end 프레임 비교) |

**판단 기준**:

| 상태 | 조건 | 다음 단계 |
|------|------|----------|
| `accept_silent_sample` | blocking 0건 | 완료 또는 TTS 진행 |
| `needs_visual_fix` | blocking 1건+ | Step 8 진행 |
| `needs_tts` | visual OK, 음성만 필요 | TTS 승인 후 Step 10 |

---

### Step 8 — 문제 씬 Pexels 재검색 + 교체

```bash
node --env-file=.env.local scripts/fix-lh7-visual.mjs
```

> 새 plan의 경우 `fix-lh7-visual.mjs`를 참고해 유사 스크립트 작성

**교체 원칙**:
- blocking 씬 우선 (필수)
- minor 씬은 atomic scope 안에서 여유 있을 때만
- Pexels 호출 최대 5회/task
- 쿼리에서 피해야 할 요소: 인물 얼굴, 신체/다이어트, 여행 가방, 패션쇼 런웨이
- `per_page=8` + `photos[0]` (관련도 높은 첫 번째 결과 선택)

**저장 위치**:
```
output/v2/paid_qa/lh7_silent_render_fixed/images/scene_07.jpg
output/v2/paid_qa/lh7_silent_render_fixed/images/scene_08.jpg
```

---

### Step 9 — fixed render 재생성

```bash
python python/render_v2.py \
  "output/v2/paid_qa/lh7_silent_render_fixed/render_plan.json" \
  "output/v2/paid_qa/lh7_silent_render_fixed/lh7_silent_preview_fixed.mp4"
```

Step 7 프레임 추출 반복 → 교체 씬 재확인.

---

### Step 10 — QA summary 저장

```json
{
  "qaId": "QA-{PLAN_ID}-visual",
  "recommendation": "accept_silent_sample | needs_visual_fix | needs_tts",
  "blockingIssues": [],
  "minorIssues": [],
  "noPaidApiUsed": true,
  "noPollinationsUsed": true
}
```

---

## 4. 품질 기준 체크리스트

```
□ qualityScore ≥ 80 (gate = "pass")
□ Pexels 이미지 10/10 다운로드 성공
□ 해상도: 1080×1920
□ 길이: 45~60초
□ 오디오: none (무음)
□ topTitle subTopicId와 일치
□ blocking visual mismatch 0건
□ 사람 얼굴/신체/부적절 이미지 0건
□ 자막 가독성 이상 없음
□ PAID_API_ENABLED=false 확인
□ noPaidApiUsed: true
```

---

## 5. 금지 사항

| 금지 | 이유 |
|------|------|
| Pollinations 호출 | 402 차단 상태 (2026-05-24 기준) |
| Imagen 호출 | 유료 — 사용자 명시 승인 필요 |
| OpenAI TTS 호출 | 유료 — 사용자 명시 승인 필요 |
| ElevenLabs 호출 | 유료 — 사용자 명시 승인 필요 |
| render-v2 API 직접 호출 | TTS/Imagen fallback 위험 |
| 원본 plan JSON 수정 | QA 재현성 보장 위해 원본 보존 |

---

## 6. 관련 스크립트 & 파일

| 파일 | 용도 |
|------|------|
| `scripts/check-lh7-pexels-stock-images.mjs` | Pexels 이미지 검색/다운로드 검증 |
| `scripts/fix-lh7-visual.mjs` | visual fix: 문제 씬 Pexels 재검색 + render_plan 패치 |
| `python/render_v2.py` | 무음/유음 영상 렌더 (narrationPath 없으면 무음) |
| `lib/pexels.ts` | Pexels API 클라이언트 (`searchStockPhoto` 함수) |
| `app/api/render-v2/route.ts` | `stock-first`/`stock-only` imageMode 분기 포함 |

---

## 7. 검증된 루프 결과 (QA-LH-7 기준)

| 단계 | 결과 |
|------|------|
| generate | score 95/pass, capReasons [], narration 짧음 0건 |
| Pexels 이미지 | 10/10 성공 (1차 시도) |
| 무음 렌더 | 1080×1920, 50.0s, 33MB, 무음 |
| 1차 Visual QA | blocking 2건 (scene 7/8), minor 4건 |
| Visual Fix | scene 7/8/10 교체 + topTitle 수정 (Pexels 3회) |
| 최종 판단 | **accept_silent_sample** |
| 유료 API | **없음 ($0)** |

**최종 아티팩트**:
```
output/v2/paid_qa/lh7_silent_render_fixed/lh7_silent_preview_fixed.mp4
```

---

## 8. 다음 단계 (accept_silent_sample 이후)

| 옵션 | 내용 | 비용 |
|------|------|------|
| **A** | `ALLOW_OPENAI_TTS=true` 승인 → fixed render_plan으로 음성 완성본 생성 | ≈$0.005 |
| **B** | 다른 소주제(kitchen-cleaning/food-storage)로 무료 무음 루프 반복 | $0 |
| **C** | scene 4/6/9 minor visual fix (Pexels 3회 이하) | $0 |

---

## 9. TTS Final QA 체크리스트 (LH-9 교훈, 2026-05-30 추가)

`accept_silent_sample` 이후 TTS를 생성하면 반드시 아래를 확인한다.

### 9-1. audio/video duration gap 확인

```bash
ffprobe -v quiet -print_format json -show_streams output.mp4
# video stream duration vs audio stream duration 비교
```

| gap 범위 | 판정 | 대응 |
|----------|------|------|
| 0 ~ 2s | ✅ pass | 허용 |
| 2 ~ 5s | ⚠️ minor | tail trim 권장 |
| 5s 초과 | ⛔ blocking 가능 | scene 10 무음 여부 확인 필수 |

### 9-2. trailing silence 감지

```bash
ffmpeg -i narration.mp3 -af silencedetect=noise=-35dB:d=0.5 -f null - 2>&1 | grep silence
```

- 씬 간 쉼 0.5~1s: 정상 (쉼표 구분 패턴)
- narration 파일 자체 꼬리 무음: 있으면 실제 음성 종료 시각 확인

### 9-3. scene 10 (CTA 씬) 무음 여부 확인

```
scene 10 시작 시각 = (씬 수 - 1) × durationSec
audio_end = narration 파일 duration

scene 10 시작 >= audio_end → scene 10 전체 무음 → blocking
```

**LH-9 케이스**: 씬 10 시작 45s, audio_end 43.15s → 씬 10 전체 무음 → tail trim 필요

### 9-4. tail trim 실행 (무료)

```bash
# stream copy (무재인코딩, 빠름)
ffmpeg -y -i input.mp4 -t {audio_end + 0.4} -c copy output_trimmed.mp4

# 검증
ffprobe output_trimmed.mp4  # video/audio duration gap < 1s 확인
# 끝 프레임 추출
ffmpeg -ss {audio_end - 1} -i output_trimmed.mp4 -vframes 1 end_frame.jpg
```

### 9-5. 픽스 옵션 비교

| 상황 | 권장 방법 | 비용 |
|------|----------|------|
| gap 5s 초과 + scene 10 무음 | **tail trim** (scene 9로 마무리) | $0 |
| scene 10 CTA 음성 포함 필수 | **sceneTts:true 재렌더** | TTS 1회 |
| 단순 gap 0.4s 이하 | 그대로 accept | $0 |
