---
name: project-owl-ep16-pension-on-hold-2026-09-30
description: "★부엉박사 재고 번호 재배치(Owner 2026-09-30 밤) — 표시 16=최저임금·17=전세사기, 퇴직연금=번호 없는 예비 재고(삭제 안 함), 새 편은 18부터, 내일(10/1) 16편 배포 예정"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-02T04:45:42.129Z
---

**★16편(최저임금) 배포 완료(2026-10-01, Owner "부엉박사 16편 배포해줘"):** 릴스 instagram.com/reel/Dd79PV3lakS/, 유튜브 youtube.com/shorts/pkVzd0LRuAQ(public·썸네일 set), 스토리 게시(별도 옛 스토리 이미지 `owl-v2-ep17-story`). **게시본 = `owl-v2-ep17-final-v4`**(싱크 v3 + 보드 글자 크롭선 교정 s9·11·12·13). Owner 현황 메모에는 final-v2로 적혀 있었으나 v2는 옛 본이라 확인 질문 후 v4로 확정(Owner 선택). 캡션의 "이번 달 발표된 실업급여 개편"은 날짜가 지나 "최근 발표된"으로 고침. 결과 기록 `C:/tmp/owl-ep17-publish/`. 장부 published:true. **★17편(전세사기, 파일 ep18) 배포 완료(2026-10-02, Owner "부엉박사 17편 배포해줘"):** 릴스 https://www.instagram.com/reel/Dd-pzWjCDPZ/ , 유튜브 https://www.youtube.com/shorts/IQWaF_Xp_Yc (public·썸네일 set), 스토리 게시(옛 스토리 이미지 `owl-story-ep18`, 24시간 만료). 결과 기록 `C:/tmp/owl-ep18-publish/`. 장부 17편 published:true·테스트 10/10. 배포 전 게이트 경고 1건(옛 커버라 `.headline.json` 없음)은 이전에 눈으로 확인한 커버라 진행. 18편(청년미래적금)은 10/3 예정, 19편(예금)은 10/4 예정. (배포 전 기록:) 17편(전세사기, 파일 ep18) 배포 준비 완료(2026-10-01) — Owner가 10/2 점심 배포 예정, 지시 전 게시 금지. 게시본 = **`C:/tmp/owl-v2-ep18-final-v4/owl_episode_final_mastered.mp4`**(final-v3는 글자 끝 판정이 없었고 카드 글자가 크롭선 근처인 씬 8개를 오른쪽 이동으로 교정한 v4). 압축본·콘텐츠 유닛·계획 파일은 `C:/tmp/owl-ep18-publish/`, 체크리스트 `_ai/owl-ep18-production-checklist.md`. 18편(청년미래적금)은 10/3 예정.

**최신 확정(2026-09-30 밤, Owner 지시):** 퇴직연금은 삭제하지 않고 번호 없는 예비 재고로 둔다(배포할 소재가 없는 날 사용, 그때 다음 번호를 받음). 나머지가 한 편씩 당겨져 **표시 16편=최저임금, 표시 17편=전세사기**. 새로 만드는 부엉박사는 **18편부터**. **내일(10/1) 점심 슬롯은 16편(최저임금) 배포**(Owner가 배포를 지시할 때 실행).

**파일·스펙 이름은 그대로(rename 금지) — 표시 번호 ≠ 파일 번호:**
- 표시 16 최저임금 = 파일 ep17: `C:/tmp/owl-v2-ep17-final-v3/owl_episode_final_mastered.mp4`, 커버 `owl-v2-ep17-cover`, 스토리 `owl-v2-ep17-story`, 콘텐츠 유닛 `C:/tmp/owl-ep17-publish/owl-content-unit.json`(압축본은 아직 없음 → 배포 때 final-v3에서 압축)
- 표시 17 전세사기 = 파일 ep18: `owl-v2-ep18-final-v3`, 커버 `owl-cover-ep18`, 스토리 `owl-story-ep18`
- 번호 없음 퇴직연금 = 파일 ep16: `owl-v2-ep16-final-v3`, 커버·스토리 `owl-v2-ep16-cover`·`-story`

**Why:** 15편 실업급여가 역대 최고 반응 → 흐름을 잇는 게 개수보다 중요. 최저임금은 15편 실업급여 하한액과 직접 연결(대본에 "15편에서 본…" 포함)이라 후속으로 가장 좋음. 퇴직연금은 체감이 약해 예비.

**How to apply:** 배포·게시 기록·장부는 표시 번호(16=최저임금), 파일 경로는 옛 번호로 찾는다. 폴더명 숫자만으로 소재 판단 금지. 러너 장부 `lib/source-facts/owl-topic-lanes.ts`는 이미 재배치됨(퇴직연금은 `OWL_UNNUMBERED_STOCK`). 원문 CURRENT_STANDARDS §7 8번 표. 퇴직연금을 배포하는 날은 그 시점 다음 번호로 장부에 옮긴다. 관련: [[project-owl-ep15-unemployment-best-performer-2026-09-30]], [[feedback-owl-deploy-timing-owner-decides-2026-09-30]].
