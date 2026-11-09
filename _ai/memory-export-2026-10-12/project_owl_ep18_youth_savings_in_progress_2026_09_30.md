---
name: project-owl-ep18-youth-savings-in-progress-2026-09-30
description: "부엉박사 표시 18편 = 청년미래적금 2차(10/7~16 신청), 파일 번호 19. 2026-10-02: 이미지·영상·조립·QA·커버·압축·콘텐츠 유닛·배포 전 게이트까지 완료, Owner 최종검수 대기. P0: s1 카드 '신청 열흘 전' ≠ 나레이션 '열흘 안에'"
metadata:
  node_type: memory
  type: project
  originSessionId: 8b80c203-28f3-48f1-99ca-88a786522ccc
  modified: 2026-10-03T04:57:41.811Z
---

**★배포 완료(2026-10-03, Owner "부엉박사 18편 배포해줘"):** 릴스 https://www.instagram.com/reel/DeBP__Tks4W/ (coverUrl 적용 확인), 유튜브 https://www.youtube.com/shorts/pemJWqgl6_c (public, 썸네일 set), 스토리 mediaId 18134930333044846. 게시 직전 일정(10/7~16·홀짝제·6%/12%) 웹 재확인 불변, 게이트 통과, 폴더 `C:/tmp/owl-ep19-publish/`. 부엉 장부 18편 published:true+테스트 10/10. 다음 부엉 게시 대기: 표시 19편(파일 ep20, Veo 대기)·20·21편. 커밋은 Owner 승인 대기.

(이하 배포 전 기록) **★Owner 최종검수 완료·10/3 배포 예정 통보(2026-10-02) — 배포 지시 전에는 게시하지 않는다.** §5 4단계 계획 파일 생성 완료(업로드 없음). 지시가 오면 신선도 재확인 → preflight → §5 5~10단계(커버 merge 필수, 유튜브 public) → 링크 기록·장부 published. 커밋 5d26369 push 완료.

**현재 상태(2026-10-02):** 대본 v12(14씬·546자) → TTS(111.72초) → 이미지 14장(`C:/tmp/owl-v2-ep19-images/`) → Owner Veo 영상 14개(`C:/tmp/owl-v2-ep19-videos/`) → 조립·CTA·워터마크·오디오 마감 `C:/tmp/owl-v2-ep19-final/owl_episode_final_mastered.mp4`(126.2초, -14.9 LUFS) → **QA 반드시 수정 0** → 커버 `C:/tmp/owl-cover-ep19/00_owl_ep19_cover_thumb.png`("청년미래적금 / 신청 열흘뿐") → 압축 30.9MB·콘텐츠 유닛 `C:/tmp/owl-ep19-publish/` → **배포 전 게이트 통과**. 체크리스트 `_ai/owl-ep19-production-checklist.md`. **Owner 최종검수 대기, 배포 시점은 Owner가 정함(제안 금지).**

**★P0 해결(2026-10-02):** s1 카드를 "신청 기간 열흘"로 바꿔 이미지·Veo 영상 재생성, 재조립해 최신 최종본 `C:/tmp/owl-v2-ep19-final-v3/owl_episode_final_mastered.mp4`(QA 0, 게이트 통과; v3 = 자막을 y1290→1360으로 내려 카드 문구 가림 해소, Owner 지적 2026-10-02). 이전 `final/`은 "열흘 전" 본이라 쓰지 않는다. 10/3 게시 기준 재검증 완료(일정 불변). 남은 단점: 영상 시작 0.4초 윙크성 표정(8개 클립), s1 자막이 카드 아래 모서리에 닿음, 입 멈춤 도구 경고 12/14(실제 화면 구간은 부리 닫힘으로 보임).

**★파일 이름: 표시 18 = 파일 번호 19.** `_owl-v2-ep18-*`는 전세사기(표시 17). 작업 폴더 `C:/tmp/owl-v2-ep19-*`.

**핵심 팩트(금융위 원문 기준):** 일반형 기여금 6%(총급여 6,000만 원 이하)·우대형 12%(총급여 3,600만 원 이하 중소기업 재직자 등), 6,000만 초과~7,500만 이하는 가입 가능·기여금 없음, 월 최대 50만 원·3년, 2차 신청 10/7~16(7~8일 홀짝제), 2차부터 유형 직접 선택. 갈아타기: 새 계좌 먼저, 기존 계좌부터 해지하면 전환 불가. 쓰지 않은 것: "연 최고 19.4%", 우대형 15%·25% 상향, 사전 심사·이의신청 일정.

**How to apply:** 요약 메모리만 보고 이어 쓰지 말고 체크리스트·스펙 원문을 연다. 관련: [[project-owl-ep16-pension-on-hold-2026-09-30]](16=최저임금·17=전세사기), [[feedback-scene-count-not-owner-rule-2026-10-01]], [[feedback-hook-rules-v1-2026-09-30]], [[tts-alignment-drift-and-larger-text-2026-10-02]].
