---
name: project-bull-ep12-seohak-in-progress-2026-10-01
description: "황소특보 12편 = 서학개미 추석 연휴 미국주식 순매수(KORU·SGOV 등 실명) — 완성본 마감·QA 통과(2026-10-02), 남은 것: 통합 커버(스토리 겸용)·배지 결정·콘텐츠 유닛·배포는 Owner 지시"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-01T01:26:43.902Z
---

**★배포 완료(2026-10-02, Owner "12편 배포하자"):** 릴스 instagram.com/reel/Dd7uTWygmx-/ (커버 URL 200 확인), 유튜브 youtube.com/shorts/f6MVAa55hzc (public, 썸네일 set), 스토리 게시(커버 1장). 게시본=v3(`C:/tmp/bull-ep12-final-v3/owl_episode_final_mastered.mp4`: 원래 제목 문구 3줄 108·102·104px, 자막 96px 2줄, TTS alignment 보정). 결과 기록 `C:/tmp/bull-ep12-publish/`. 남은 일: 24~48시간 뒤 성과 수집(황소 소재 탐색 러너 9~10단계가 자동 수집), 유튜브 세로 칸 썸네일(oar1~3) 처리 확인, 배지 결정은 미결. 아래 "상태"의 최종본 경로는 v1이므로 v3가 최신.

**상태(2026-10-02):** 대본 v4(16씬·613자) → TTS(타임라인 116.04초) → 스펙 `scripts/_bull-ep12-assembly-spec.mjs` → 이미지 16장(`C:/tmp/bull-ep12-images/`, s3·s10·s11 재생성 1·2·3회) → 영상 16개(`C:/tmp/bull-ep12-videos/`, s14는 10초 재생성본, 구본 보관) → 조립·CTA·워터마크·오디오 마감 → **QA 반드시 수정 0**. 최종본 `C:/tmp/bull-ep12-final/owl_episode_final_mastered.mp4`(124.08초, -14.2 LUFS). 체크리스트 `_ai/bull-ep12-production-checklist.md`부터 열어 ⬜ 순서대로.

**배포 준비 완료(2026-10-01~02):** 통합 커버 `C:/tmp/bull-cover-ep12/00_bull_ep12_cover_thumb.png`(글자 148/164px, "서학개미 1위 / 반도체 아님", 배지 제외 기본안) · 압축본 `C:/tmp/bull-ep12-publish/owl_episode_final_compressed.mp4`(31.3MB) · 콘텐츠 유닛 `C:/tmp/bull-ep12-publish/owl-content-unit.json` · 스토리용 `story-src/` · **배포 전 게이트 실패 0·경고 0**. **남은 일: 배포는 Owner 지시 시에만**(§5 순서: 커버 merge 필수, 유튜브 `--privacy public`, 스토리는 `story-src`). "경제번역소" 배지 결정은 대기(넣으면 세로 14% 아래). 신선도: 게시가 늦을수록 약함.

**결정·교훈:** 종목 실명은 Owner "종목 다 적어"로 12편에 한해 허용(공식 집계 사실만, KORU는 영문 표기). 마이크론은 9편과 중복이라 제외. 소품 씬 영상은 10초 티어가 효과 있었고(끝 글자 소실 해결), 입 멈춤 문구 강화는 효과 없었다(n=1) — 입 움직임 초과(컷에 약 0.55~1.16초)는 이번 편 수용, 다음 편은 `--pilot-dialogue` A/B. 팩트: 예탁결제원 집계, 결제일 기준 9/24~25(이틀치) — 신선도는 게시가 늦을수록 약함(다음 주 집계가 나오면 식음), 10번 씬 "대기하던 돈이 움직였을 수도 있어"는 조건형 해석.

관련: [[feedback-story-image-unified-with-cover-2026-10-01]] [[feedback-video-prompt-text-preservation-must-verify]] [[feedback-bull-topic-ranking-must-use-performance-data-2026-10-01]]
