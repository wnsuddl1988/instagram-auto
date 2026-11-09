# YouTube Shorts Letterbox Variant Renderer (Dry-Run, No-Live)

Task: `youtube-shorts-letterbox-variant-renderer-dryrun-v1`
Status: dry-run/no-write planner. 실제 ffmpeg 실행으로 mp4를 생성하지 않는다.
Scope note: 이 slice는 **렌더 스펙 고정 + command planner**만 다룬다. 실제 변환 실행, upload, YouTube API/OAuth는 별도 Owner 승인 slice에서 진행한다.

관련 계약: [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md) — `youtube_shorts_letterbox_1080x1920` 변형 정의.

---

## 1. 왜 YouTube가 별도 변형을 갖는가

Instagram Reels 변형(`instagram_reels_full_frame_1080x1920`)은 현재 스타일 그대로 full-frame 세로 영상이다. YouTube Shorts는 플레이어 UI(진행바/제목/구독 버튼 등)가 화면 상하단을 가리는 경우가 있어, 같은 full-frame 영상을 그대로 쓰면 중요한 자막/구성 요소가 UI에 가려질 위험이 있다. 이를 피하기 위해 YouTube 전용 변형은 검정 배경 canvas 중앙에 원본 콘텐츠를 배치하고 위/아래에 검은 여백(letterbox)을 둔다.

## 2. 왜 검정 canvas에 스케일링하는가

- 최종 mp4는 1080×1920 세로 규격을 유지해야 YouTube Shorts로 인식된다.
- 원본 콘텐츠를 그대로 여백 없이 채우면 UI 위험 영역과 겹칠 수 있으므로, 콘텐츠 박스를 864×1536으로 축소하고 나머지 공간을 검정으로 채운다.
- top/bottom 약 192px, side 약 108px 여백이 생기며, 이는 9:16 원본 기준 값이다.

## 3. 왜 side gutter를 허용하고 stretch는 금지하는가

원본 종횡비를 보존하기 위해 `force_original_aspect_ratio=decrease` 방식으로 스케일링한다. 이 경우 원본과 목표 컨텐츠 박스의 종횡비가 정확히 일치하지 않으면 좌우에도 약간의 gutter가 생길 수 있다. 이것은 허용되는 부작용이며, 영상을 억지로 늘리거나 찌그러뜨리는 stretch는 화질 왜곡을 유발하므로 금지한다.

## 4. 이 작업은 로컬 후처리일 뿐, YouTube 업로드가 아니다

이 스크립트(`scripts/create-youtube-shorts-letterbox-variant.mjs`)는 로컬 mp4 → 로컬 mp4 변환 계획만 세운다.

- Vercel Blob/public URL을 필요로 하지 않는다 (`requiresPublicBlobUrl: false`).
- YouTube Data API 업로드, OAuth, 실제 파일 전송은 전혀 수행하지 않는다.
- 이 slice에서는 ffmpeg 실행 자체도 하지 않는다 — deterministic plan/command만 출력한다.

## 5. CLI 사용법

```
node scripts/create-youtube-shorts-letterbox-variant.mjs --input <mp4> --output <mp4> [--dry-run]
node scripts/create-youtube-shorts-letterbox-variant.mjs --example [--dry-run]
```

- `--input` / `--output`: 실제 파일 경로 기반 계획을 세운다. 기본 동작은 dry-run/no-write.
- `--example`: 실제 mp4 없이 no-input example 모드로 결정론적 계획을 출력한다.
- `--dry-run`: 명시적으로 dry-run 모드를 강제한다 (기본값과 동일).
- `--run`: 향후 승인된 slice에서 실제 실행을 위해 예약된 플래그다. **이번 slice에서는 `--run`을 주면 즉시 abort하고 실행하지 않는다.**

## 6. 렌더 프로필 (fixed, no-live)

| 항목 | 값 |
|------|-----|
| Canvas | 1080×1920, 검정 배경 |
| Content box | 864×1536, 중앙 배치 |
| Top/bottom margin | 약 192px (9:16 source 기준) |
| Side margin | 약 108px (9:16 source 기준, 종횡비 보존 gutter) |
| Video codec | H.264 / yuv420p / faststart |
| Audio | 있으면 AAC로 보존/재인코딩 |

머신 판독 계약은 `scripts/fixtures/youtube_shorts_letterbox_render_profile.v1.json`, 정적 가드는 `scripts/check-youtube-shorts-letterbox-variant-renderer-static.mjs`.

## 7. Instagram 변형과의 관계

Instagram full-frame 변형(`instagram_reels_full_frame_1080x1920`)은 이 slice에서 전혀 수정하지 않는다. YouTube letterbox 변형은 독립된 별도 산출물이며, 두 변형은 서로 다른 렌더 경로/파일로 유지된다(conflation 금지).

## 8. 금지 (이 slice)

- ffmpeg 실행으로 새 mp4 생성
- render/mux/TTS/image/browser regeneration
- upload
- YouTube API/OAuth 호출
- Instagram API/`--arm`
- Vercel Blob provisioning/token/env
- `.env.local` 접근
- deploy/domain/DNS 변경
- Cloudflare/R2/wrangler action
- dependency/lockfile/font 변경
- commit/push

## 9. 다음 승인 순서

이 slice는 [`docs/dual-platform-variant-publish-architecture.md`](./dual-platform-variant-publish-architecture.md) §6의 `APPROVE_YOUTUBE_VARIANT_RENDER_SPEC` 게이트에 대응한다. 실제 ffmpeg 실행(`--run` 활성화)은 별도 Owner 승인 이후 `APPROVE_PLATFORM_VARIANT_RENDER_TEST` 단계에서 진행한다.
