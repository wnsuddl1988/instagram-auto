---
name: project-owl-ep19-withholding-in-progress-2026-10-01
description: "부엉박사 표시 19편(파일 ep20) = 광고 최고금리 vs 내가 받는 금리(예금). 15씬·111.4초, TTS·이미지·Veo 검수·조립·CTA(125.83초)·QA 0·커버 완료. 남은 것: 10/3 금리 재확인→압축·콘텐츠 유닛·게이트, 게시 10/4(일) Owner 지시. 앞선 소재 반려·보류 경위와 교훈"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-04T05:51:41.380Z
---

**★배포 완료(2026-10-04, Owner "부엉박사 19편 팩트확인하고 배포해줘"):** 릴스 https://www.instagram.com/reel/DeD65DVD6HC/ , 유튜브 https://www.youtube.com/shorts/BNk3_Vmay0o (public, 썸네일 set), 스토리 mediaId 17895635001608978. 게시 직전 웹 재확인 결과 광주은행 4.04%·5대 은행 3.5~3.6%·예금자보호 1억은 일치, **저축은행 최고금리만 영상 기준 4.03%(9월 4주) vs 10월 1주 4.10%(OK저축은행 앱 변동금리)로 달라** 영상은 두고 캡션·설명란에 기준 시점과 최신 값을 명시. 폴더 `C:/tmp/owl-ep20-publish/`, 부엉 장부 19편 published:true. 다음 부엉 게시 대기: 표시 20편(파일 ep21, Veo 대기)·21편(파일 ep22, Veo 대기), 20편은 2금융권 AI 해킹 확산으로 대본 팩트 재확인 필요. **교훈:** 금리·순위처럼 주마다 바뀌는 수치는 TTS 전에 "기준 시점"을 대사에 넣거나(예: "9월 넷째 주 기준") 게시 직전 재확인한다.

**번호:** 표시 19편 = 파일 ep20(Owner 2026-10-02 정정 "20편 아니고 19편"). 작업 폴더 이름(`owl-ep19-draft`)은 표시 번호.

**현재 상태(2026-10-02):** 소재 = 예금 "4%"는 기본 3.54%+우대 0.5%p(지방은행), 5대 은행 3.5% 안팎 vs 저축은행 4.03%, 예금자보호 금융기관별 1억. **적금 씬(s12·13) 삭제**(Owner) → 15씬·533자·본편 111.4초. 완료: 대본 v4 검사기 수정 0 · TTS(`C:/tmp/money-shorts-os/owl-ep20-tts/output-v2` 컷본, 컷 도구 `scripts/cut-scenes-from-tts-once.mjs`, 정렬 밀림 없음) · 스펙 `scripts/_owl-v2-ep20-assembly-spec.mjs` · 이미지 15장 · Veo 15개 검수 통과(입 멈춤 경미 이하, s6 계기판 숫자 없음) · **조립·CTA 125.83초(PASS)·워터마크 제거·오디오 -14.9 LUFS·QA 반드시 수정 0**(자막 경계 예외 2건 스펙 기록) → 완성본 `C:/tmp/owl-v2-ep20-final/owl_episode_final_mastered.mp4` · **커버 완료** `C:/tmp/owl-cover-ep20/00_owl_ep20_cover_thumb.png`(\"광고 4%/내 금리는?\" 230/179px). 커밋 `839fcf5`(스펙·도구·문서, 푸시됨). 이후 영상 검수·조립·커버 변경은 미커밋.

**★Owner 결정(2026-10-02 "1번은 10/4일 배포할 때 확인해줘"): 금리 재확인·압축·콘텐츠 유닛·배포 전 게이트는 10/3에 미리 하지 않고, Owner가 10/4에 "배포해줘"라고 할 때 그 자리에서 순서대로 한다 — ① 금리 원문 재확인(바뀌었으면 보고하고 해당 씬 재생성 여부 Owner 결정 후 진행) ② 압축·콘텐츠 유닛·게이트 ③ §5 순서 배포 ④ 장부 19편 published 갱신·커밋은 Owner 승인 후.** (기존 계획:) ① 10/3 금리 재확인(5대 은행 3.5% 안팎·저축은행 4.03%·지방은행 4.04% — 바뀌면 해당 씬 재생성 여부 Owner 결정) ② 압축(1900k)·콘텐츠 유닛(캡션에 법인세 기업 돈 14조 8천억 이탈·은행채 4.18% 설명, 은행·상품명은 사례+추천 아님 고지, 제목 "정체" 금지)·배포 전 게이트 ③ **게시 10/4(일), 시점은 Owner 지시**. Owner 청취 확인 대기: 컷 이음매(s11→s12) 및 읽기 표기(사점영사퍼센트·영점오퍼센트포인트·백칠십칠만 오천 원).

**도구 수정 기록:** 합성기 `%` 문자 소실 → `expansion=none`(2026-10-02). QA `captionBoundaryExceptions`(불가피한 자막 경계만 사유와 함께 예외). 정렬 보정 탐색 범위 제한.

**소재 이력과 교훈(Owner 지적 4회):** ①원천징수 3.3→2.2%(8/3 세제개편안)는 소식 자체가 2개월 전 → 12월 국회 처리 직전용 보관(`_ai/owl-reserve-freelancer-withholding-script-draft.md`). 후보 신선도는 "기사 날짜"가 아니라 "소식 최초일"로. ②국민연금(10/1 통과)은 금액이 작아 반응 약함 → 체감 금액이 큰 소재 먼저. ③훅 "세금 끝난 줄 알았지?"는 뭐가 끝인지 불명 → 소식을 앞세우고 한 번에 이해되는지 직접 확인. ④대출금리 대본은 "변동금리인지 확인하세요"라 뻔함 → **이 편만의 새 정보(규칙·함정·반전 수치)와 이전 편과 다른 정보가 있어야 함**(`_ai/owl-ep20-loan-rate-script-draft.md` 보관). ⑤갤럭시 S26 가격 인상은 9/14에 이미 보도 → 새 정보 약함.

관련: [[feedback_owl_topic_report_all_candidates_fresh_ranked_2026_10_01]], [[feedback_gates_over_memory_2026_10_01]], [[feedback_owl_deploy_timing_owner_decides_2026_09_30]], [[feedback_scene_deletion_requires_audio_alignment_rebuild]].
