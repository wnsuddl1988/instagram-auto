---
name: owl-fixed-cta-v6-confirmed
description: 부엉박사(부엉이 쇼츠) 고정 CTA 최종 확정본 경로와 구조 — 앞으로 모든 부엉이 편에 무조건 이 CTA를 연결
metadata: 
  node_type: memory
  type: project
  originSessionId: 528ff956-cbd7-4372-8c6e-a5802fc9e598
  modified: 2026-09-30T04:47:41.803Z
---

**★2026-09-30 대체됨: 15편부터 `C:\tmp\owl-cta-fixed-v3\owl_cta_fixed_v3_final_layout_v2.mp4` 사용 — [[project-cta-layout-v2-remake-2026-09-30]]. 아래는 역사 기록.★**

부엉박사(부엉이 쇼츠) 채널은 매 편 CTA를 새로 만들지 않고, 하나의 고정 CTA 자산을 모든 편(과거·미래 편 전부)에 공용으로 붙인다. 2026-09-20 Owner 확정: "앞으로 이 CTA는 부엉박사에 무조건 연결하는거니까 꼭 기억해."

**최종 확정 CTA 파일**: `C:\tmp\owl-cta-fixed-v2\owl_cta_fixed_v2_final_v6.mp4` (14.958초, 1080x1920)

구조:
- follow 클립(0~8s): "어려운 경제 뉴스를 내 지갑 얘기로 풀어주는 부엉박사야. 팔로우해두면 다음 이야기도 먼저 만나볼 수 있어." — 팔로우 아이콘 카드 + 좌하단 "팔로우/다음 소식도 먼저 받기" 텍스트 카드 오버레이
- teaser 클립(~7.6~14.96s, 0.4초 크로스디졸브로 연결): "다음 편엔 우리 지갑을 또 뭐가 건드릴지, 부엉박사가 알짜만 골라서 쉽게 정리해서 가져올게." — 물음표 카드 + 좌하단 "경제번역소/다음 편도 기대해줘" 텍스트 카드 오버레이
- 배경: 밝은 톤 방송국/뉴스 스튜디오(블루/그레이 패널+세계지도), 두 클립 배경 완전 통일(같은 대화 세션에서 연속 생성해야 함)

핵심 기술 이슈와 해결(재작업 시 반드시 참고):
1. **배경 불일치**: teaser 이미지를 별도 생성하면 책장·트로피 등 이질적 소품이 섞임 → follow+teaser를 반드시 같은 ChatGPT 대화 세션에서 연속 생성(`--owl-cta-fixed-v2-only "1,2"`)
2. **영상 끝부분 표정 붕괴**: teaser 원본 영상이 발화 종료(6.173s) 이후 약 7.3~7.6초 지점부터 카드를 내리고 눈을 감는 등 이상 동작 → 정상 구간(7.333초)까지 트림해서 사용
3. **클립 간 "뚝 끊기는" 느낌**: 마지막 프레임 정지 홀드(tpad clone) 방식은 "얼어붙었다 컷"처럼 보여 실패 → **0.4초 크로스디졸브(xfade+acrossfade)**로 교체해 해결
4. **발화 시작 자음 잘림**("어려운"의 "어", "다음"의 "다"가 안 들림): alignment 기준 정확한 발화 시작 시각에서 바로 자르면 자음 어택이 손실됨. 오디오 태그 마커(`[confident]`, `[warm]`) 구간까지 포함해 넉넉히 자른 뒤 `silenceremove`로 무음만 자동 제거하는 방식이 정답. 단순 fade-in은 오히려 어택을 깎아 더 안 들리게 만듦(실패한 접근).
5. **카드 오버레이 누락**: 캐릭터가 손에 든 아이콘 카드와는 별개로, 화면 좌하단에 큰 텍스트 카드(검은 박스, "팔로우"+"다음 소식도 먼저 받기" / "경제번역소"+"다음 편도 기대해줘")를 drawtext로 얹어야 함 — 새 CTA 파이프라인 스크립트 작성 시 이 오버레이를 빠뜨리기 쉬우니 주의.

담당 스크립트:
- `scripts/run-owl-cta-fixed-v2-caption-assemble-once.mjs` — follow/teaser 각각 자막+카드 오버레이 합성(`--scene-role follow|teaser`, `--extra-audio-delay-sec`로 오디오 딜레이만큼 자막 오프셋 보정)
- `scripts/run-owl-episode-with-fixed-cta-once.mjs` — 본편(1~7번 장면)에 이 CTA를 붙여 최종 편 완성(`--cta-clip`에 위 v6 경로 지정)

6~9편은 이 v6 CTA로 전량 재조립 완료(2026-09-20): `owl-ep{6~9}-episode-final-v{7,7,5,4}\owl_episode_final.mp4`.

관련: [[project_owl_character_consistency_and_fixed_cta]]
