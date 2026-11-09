---
name: feedback-youtube-scheduled-publish-one-hour-after-instagram-2026-10-07
description: "★배포 시 인스타는 바로, 유튜브는 --publish-at으로 1시간 뒤 예약(Owner 9/28 확정·10/7 재확인, 1h/2h는 근거 데이터 없어 1h 기본) — 도구는 있었지만 §5 절차가 --privacy public이어서 그동안 전부 즉시 공개됐음(정정), 유튜브 썸네일 세로 칸은 API 한계"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44079e93-cb91-40d7-a5f2-8a4f2a547778
  modified: 2026-10-07T04:14:24.673Z
---

Owner(2026-10-07): "내가 배포 요청하면 인스타는 바로 배포, 유튜브는 1시간 뒤 배포로 예약해 달라고 했다. 그래야 유튜브는 알고리즘을 잘 탄대. 1시간인가 2시간인가 확인해봐. 유튜브 썸네일이 제대로 적용 안 되고 있었다."

**확인한 사실:**
- 업로드 도구 `run-owl-youtube-publish-once-v1.mjs`에 `--publish-at`(미래 ISO8601, private 업로드 후 그 시각 자동 공개)가 2026-09-28부터 있었다("바로 올리면 알고리즘을 잘 못 탄다", Owner 확정). 그런데 `CURRENT_STANDARDS §5` 10단계가 `--privacy public`으로 적혀 있어 **지금까지 배포된 편은 전부 즉시 공개**였다(결과 파일 `privacyStatus: public`, `publishAt: null` 확인, 예: 부엉 21편). 절차 문서가 Owner 요청을 반영하지 않은 내 쪽 누락 — 10/7에 §5 10단계를 예약 방식으로 고침.
- 1시간 vs 2시간: Owner 기억이 불확실하고 문서·기록에 시간 값이 없다. 웹 검색으로도 "몇 시간 뒤가 낫다"는 근거는 못 찾았다(스케줄 자체는 알고리즘 불이익이 없고 공개 시점부터 지표가 잡힌다는 일반 설명뿐, 소스 [socialbee](https://socialbee.com/blog/schedule-youtube-shorts/)). → **기본 1시간**, Owner가 2시간을 말하면 그 값. 효과는 우리 데이터로 검증된 게 아니다.
- `publishAt`은 한 번 넣으면 이 토큰(업로드 전용)으로 수정·취소가 안 된다(Studio에서만). 실행 전 `--arm` 없이 돌려 찍힌 시각을 확인.
- 썸네일: API `thumbnails.set`은 16:9 저장본에만 들어가고 쇼츠 세로 칸은 영상 프레임(oar1~3)을 쓴다(§5 10단계 실측 기록, 2026-09-30). **API로는 고칠 수 없고** 세로 썸네일은 YouTube Studio에서 Owner 계정으로 직접 지정해야 한다(미확정). 예약 업로드에서도 같은 한계로 봄.

**How to apply:** "N편 배포해줘" → §5 순서로 인스타(릴스·스토리) 먼저 게시, 유튜브는 인스타 게시 시각 + 1시간으로 `--publish-at` 예약(preflight로 시각 확인 → `--arm`). 배포 후 보고에 유튜브 공개 예정 시각을 적는다. 관련 [[feedback_deploy_procedure_must_follow_exactly]], [[feedback_youtube_token_upload_only_scope]].
