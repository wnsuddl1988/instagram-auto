# YouTube Shorts Letterbox Render Test — Result (Local Only)

Task: `youtube-shorts-letterbox-variant-render-test-v1`
Owner approval: `APPROVE_PLATFORM_VARIANT_RENDER_TEST`
Status: **local render test 1회 완료.** upload/API/OAuth/env/deploy 없음.

관련 계약:
- [`docs/youtube-shorts-letterbox-variant-renderer.md`](./youtube-shorts-letterbox-variant-renderer.md) — dry-run planner/프로필 계약
- [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md) — `youtube_shorts_letterbox_1080x1920` 변형 정의

---

## 1. 무엇을 했는가

기존 로컬 Instagram/full-frame mp4 1개(`golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4`, 20,294,549 bytes)를 입력으로 사용해, YouTube Shorts letterbox 변형 mp4를 **정확히 1회 ffmpeg 변환**으로 생성했다. 결과물은 `output/youtube-shorts-letterbox-render-test-v1/` 하위에만 기록했다.

## 2. 입력/출력 요약

| 항목 | 소스 | 출력 |
|------|------|------|
| 경로 | `C:\tmp\money-shorts-os\...\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4` | `output/youtube-shorts-letterbox-render-test-v1/golden_sample_t1_lifestyle_inflation_youtube_letterbox_v1.mp4` |
| 크기 | 20,294,549 bytes | 7,349,425 bytes |
| 해상도 | 1080×1920 | 1080×1920 |
| 코덱 | h264 / yuv420p | h264 / yuv420p |
| duration | 53.966667s | 53.966667s |
| 오디오 | AAC mono 44.1kHz | AAC (보존) |

## 3. 변환 필터 (ffmpeg, 정확히 1회 실행)

```
scale=w=864:h=1536:force_original_aspect_ratio=decrease,
pad=w=1080:h=1920:x=(ow-iw)/2:y=(oh-ih)/2:color=black
```

- content box 864×1536이 중앙 배치됨.
- 결정론적 계산: top/bottom margin = (1920−1536)/2 = **192px**, side margin = (1080−864)/2 = **108px**.
- 소스가 이미 1080×1920(9:16)이므로 side gutter는 실질적으로 발생하지 않고 top/bottom 검은 여백만 생성됨(source aspect ratio == content box aspect ratio).

## 4. 검증 결과

| 체크 | 결과 |
|------|------|
| output width 1080 | PASS |
| output height 1920 | PASS |
| output video codec h264-compatible | PASS |
| output pixel format yuv420p | PASS |
| output duration close to source (± 1.0s) | PASS (delta = 0.0s) |
| output audio preserved (source has audio) | PASS |
| ffmpeg conversion count == 1 | PASS |

전체 결과는 `output/youtube-shorts-letterbox-render-test-v1/render-test-result.json`에 기록됨.

## 5. 이 테스트가 하지 않은 것

- 업로드 없음 (Instagram/YouTube 어느 쪽도 업로드하지 않음)
- YouTube Data API/OAuth 호출 없음
- Instagram API/`--arm` 호출 없음
- Vercel Blob provisioning/token/env 접근 없음
- `.env.local` 접근 없음
- deploy/DNS/Cloudflare/R2/wrangler 변경 없음
- ffmpeg 추가 실행(screenshot/frame extraction/blackdetect 등) 없음 — 변환 1회 + ffprobe 검증(읽기 전용) 2회(소스/출력)만 수행

## 6. 다음 승인 게이트

이 결과는 [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md) §6의 `APPROVE_PLATFORM_VARIANT_RENDER_TEST` 게이트를 충족한다. 다음 단계는 `APPROVE_VERCEL_BLOB_STORE_PROVISIONING`(Instagram 경로) 및 `APPROVE_YOUTUBE_OAUTH_AND_UPLOAD_INTEGRATION`(YouTube 경로)이며, 둘 다 별도 Owner 승인이 필요하다.
