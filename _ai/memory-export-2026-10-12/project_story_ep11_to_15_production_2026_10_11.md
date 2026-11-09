---
name: project-story-ep11-to-15-production-2026-10-11
description: "스토리 11~15편(포스코·디즈니·쿠쿠·닌텐도·한진해운) 제작 1단계 10/11 밤 — 설계·소재 검증·TTS·템포·배경음·스펙·영상 프롬프트 완료, 이미지는 ChatGPT 순차 생성 중, Owner Veo 영상 대기"
metadata:
  node_type: memory
  type: project
  originSessionId: 1d556ea0-6135-4784-9793-c20382605cb4
  modified: 2026-10-11T05:37:17.318Z
---

Owner 10/11 밤 "11~15편 TTS ~ 영상프롬프트까지 순차적으로 실행". 기본 베이스 구조 확정본(v4 검사기 수정 0).

| 편 | 대본 | 장면·글자 | 음성(템포 후) | 비고 |
|---|---|---|---|---|
| 11 포스코 | `story-ep11-posco/scenes-v7` | 15·493 | 80.32초 | 12번 9.2초 |
| 12 디즈니 | `story-ep12-disney-florida/scenes-v5` | 16·557 | 85.28초 | |
| 13 쿠쿠 | `story-ep13-cuckoo/scenes-v7` | 16·463 | 66.02초 | 가장 짧음 |
| 14 닌텐도 | `story-ep14-nintendo/scenes-v10` | 18·544 | 86.12초 | 2번 9.34초 |
| 15 한진해운 | `story-ep15-hanjin/scenes-v8` | 16·519 | 83.59초 | 14번 9.2초 |

- 생성기: `C:/tmp/story-base-gen.mjs`(설계·소재 검증·TTS 낭독 스크립트, 편별 `ep-config.mjs`), `C:/tmp/story-spec-gen.mjs`(조립 스펙, 편별 `spec-data.mjs`), BGM 계획 `C:/tmp/story-bgm-plans-11-15.mjs`, 이미지 순차 러너 `C:/tmp/run-all-images.mjs`(로그 `C:/tmp/story-images-run.log`).
- 유료 호출: ElevenLabs TTS 5회(편당 1) + Music 5회. 정렬 `--threshold 0.1`, 템포 `--factor 1.2 --max-scene-gap 0.25 --keep-gap-scenes <질문 장면>`.
- 스펙 `scripts/_story-ep{11..15}-assembly-spec.mjs`, 영상 프롬프트 `_ai/story-ep{11..15}-video-generation-prompts.md`, 체크리스트 `_ai/story-ep{11..15}-production-checklist.md`. 제목 headerTitle은 임시안(Owner 확정 필요).
- 소재 검증 파일 `C:/tmp/story-topic-vetting/story-ep{11..15}-*.json`: 원문 인용 자동 대조 통과(인용 못 찾은 출처는 빼고 2곳 유지). 1출처 귀속: 12편 14번 13만 1천 달러(디즈니 공식 글, ownerApproved), 14편 11~12번 요코이 회고.
- 이미지 81장 완료(ChatGPT 순차, 연락 시트 육안 검수): 재생성 3장(12편 16번 성 모양 배경, 15편 5·9번 인쇄된 글자 같은 무늬 서류). 14편은 1차 4장 뒤 s5에서 멈춰 s5~s17 재개. 14편 17번 휴대 게임기가 게임보이와 비슷해 Owner 확인 요청. 이미지 사본 `Downloads/스토리11~15편_이미지/스토리N편/`, 영상 프롬프트 `Downloads/스토리 N편/스토리N편_영상프롬프트.md`.
- 남은 일: Owner Veo 영상 `Downloads/스토리 N편/1~n.mp4`, 이후 조립·QA·커버·배포. 스토리 6편 배포·7~10편 일일 배포도 대기. episode-ledger 등록은 Owner 최종 확정 뒤.
