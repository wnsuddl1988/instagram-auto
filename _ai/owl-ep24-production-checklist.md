# 부엉박사 표시 23편 제작 체크리스트 (파일 번호 24) — 국민연금 군복무·출산 크레딧 확대 (규칙 23·26·27)

> 템플릿 `_ai/templates/episode-production-checklist.md`의 단계를 그대로 따른다. 단계가 끝날 때마다 ✅/❌와 증거(명령·결과 파일)를 적는다. 게시 시점은 Owner가 정한다(제안 금지). 짝 편: 표시 24편(파일 ep25) `owl-ep25-production-checklist.md`.

## A. 소재·대본
- ✅ 소재 탐색: `run-owl-topic-full-scan-once.mjs --out-dir C:/tmp/owl-topic-scan-ep23`(웹 보강 포함) → 후보 36개 보고 → Owner 지적("실업급여 같은 큰 개편이 안 나온다")으로 큰 개편 재선별 → Owner 위임("선정해봐") → **"1번 진행해"**(2026-10-06). 러너에 ⑨ "정부안·예산·큰 개편" 레인 키워드 추가.
- ✅ 팩트: 뉴스핌·이데일리·농민신문(복수, 10/1) 원문, `_ai/owl-ep24-pension-credit-script-draft.md` 팩트표. 못 본 것: 복지부 보도자료·국회 의결 원문·조문.
- ✅ 대본 v6(최종): `C:/tmp/owl-ep24-draft/pension-credit-scenes-v6.json`, **15씬·533자**, 검사기 `--character owl --hook-type T3` **반드시 수정 0**·확인 권장 3. (v5 17씬·590자는 1차 TTS가 124.28초라 CTA 포함 139초대 → 해군·공군 금액 씬·평균소득 가정 씬을 빼 15씬으로 줄임. 가정 내용은 캡션으로 이동.)
- ✅ 새 독자 읽기 점검(규칙 29) 1회(v5): Q1·Q2 통과, Q3 "하나로 이어짐", Q4 7건 중 5건 조치·2건 미조치(사유 기록). v6은 씬만 삭제·문장 일부 압축.
- ✅ Owner 대본 확정 + TTS 승인("1번 진행해" ×2, 2026-10-06). **TTS 유료 API 2회 사용**(1차 17씬 124.28초 폐기 `output-v1`, 2차 15씬 `output-v2`).
- ✅ 장부 `OWL_EPISODE_LEDGER` 23편 등록(policy_countdown·pension·question, published:false), 검사 10/10.

## B. TTS·스펙·이미지
- ✅ TTS 2차: `C:/tmp/money-shorts-os/owl-ep24-tts/output-v2/`, 15씬 **107.72초**(CTA 15초 포함 약 123초 → 목표 115~130초 안), 정렬 밀림 점검(`fix-tts-alignment-from-audio-once.mjs`) 최대 -0.08초 → 보정 없음.
- ✅ 스펙 `scripts/_owl-v2-ep24-assembly-spec.mjs`(`OWL_EP24_ASSEMBLY_SPEC`): 15씬, 배경 3구역(유리 온실 홀 A·시간의 길 전시관 B·계단식 열매 정원 C), openingMotion **impact**(직전 부엉 23편 pushin과 번갈아), 검사기(`--spec-module ./_owl-v2-ep24-assembly-spec.mjs --spec-export OWL_EP24_ASSEMBLY_SPEC`) 반드시 수정 0.
- ✅ 이미지 15장(2026-10-06, `ALLOW_CHATGPT_IMAGE=1 node probe-character-consistency-chatgpt-v1.mjs --character owl3dv5 --scene-spec ./_owl-v2-ep24-assembly-spec.mjs --scene-spec-export OWL_EP24_ASSEMBLY_SPEC --out-dir C:/tmp/owl-v2-ep24-images`, CDP 9222): **15장 모두 1차 생성, 재생성 0회**, 약 28분. 파일 `C:/tmp/owl-v2-ep24-images/owl_ep24_s{1..15}.png`.
- ✅ 안전선 시트 `C:/tmp/owl-v2-ep24-images/safe-zone-sheet.png`(`run-safe-zone-preview-once.mjs … --out`): 카드 글자 전부 좌우 안전선 안, 한글 철자 대조 OK, 카드 아래 끝 약 61~63%(자막 상단 약 68%보다 위), s10 클로즈는 카드 없음. 못 본 것: 영상화 후 글자 유지(Owner Veo 생성 후 검수).

## C. 영상 프롬프트
- ✅ `_ai/owl-ep24-video-generation-prompts.md`(`build-video-generation-prompts.mjs`, TTS output-v2 기준): **8초 5개(s2·6·7·14·15) / 10초 10개**, 카드 씬 전부 10초, 입 멈춤 2단계, 본문에 금지 표현("glued"·"Silent") 없음(안내 문구 1줄에만). 저장명 `Downloads/1~15.mp4`, "부엉박사 표시 23편(파일 ep24)"이라고 알려주기.

## D. 영상 검수 (수령 2026-10-06, `Downloads/1~15.mp4`)
- ✅ `C:/tmp/owl-v2-ep24-videos/`에 스펙 파일명으로 복사, ffprobe: 15개 모두 720x1280·24fps, 길이 요청 티어와 일치(8초 5개·10초 10개). 검수 시트 `C:/tmp/owl-v2-ep24-videos-review/sheet_1~5.png`(씬별 시작·중반·끝): 카드 글자 끝 프레임까지 선명, 소품 이탈·표정 붕괴·카메라 줌 없음, 배경에 새 글자 없음.
- ⚠ 입 멈춤 측정(`check-clip-speech-timing-once.mjs`): 15개 모두 경고(+0.86~+5.02초, Veo 클립 자체 음성이 대사보다 오래 남음) — 이전 편과 같은 패턴, 조립이 TTS 발화 기준으로 잘라 쓰므로 컷에 보이는 구간만 영향. 못 본 것: 컷 안 대사 뒤 입 움직임 프레임 단위 확인.

## E. 조립·마감
- ✅ 조립 v1 → QA 1차 반드시 수정 4: ①'시행은 2027년 || 1월 1일이고'(854px>760) ②'모두 해당되는 || 건 아니야'(826px>760) → 폭 한도 안에서 규칙대로 못 넣어 스펙 `captionBoundaryExceptions`로 사유 승인(TTS 재생성 회피) ③62.7~63.1초 s10 첫 발화 앞 자막이 0.2초 늦게 켜짐 → `fix-tts-alignment-from-audio-once.mjs --threshold 0.05`(기본 0.3으로는 -0.06~-0.08 이동이 "정상"이라 못 잡음, 실제 발화 시작 62.67초 vs 자막 62.89초) → `…summary.audio-fixed.json`·`…audio-fixed.alignment.json`으로 재조립 ④edge-review 기록 누락.
- ✅ 재조립 v2 `C:/tmp/owl-v2-ep24-assembly-v2/`(107.7초, openingMotion impact, 전환 싱크 누적 오차 0, 컷 리드 0.10~0.14초) → CTA 결합(owl-cta-fixed-v3, `--scene8-start 107.72`, audio-fixed alignment) **PASS 2932/2932**, 화면·오디오 122.17초 → 워터마크 제거(sparkle·veo_text) → 오디오 마감 **-14.7 LUFS / -0.9 dBTP** → `C:/tmp/owl-v2-ep24-final-v2/owl_episode_final_mastered.mp4`.
- ✅ QA **반드시 수정 0**(`qa/edge-review.json` 카드 씬 9개 edge·captionOverlap 전부 ok — edge-review-1~3·caption-card-1~2·watermark-check 육안). 자막-음성 대조 35곳 모두 끝까지 표시. 자막-카드 간격 윗줄 최소 y=1257. 확인 권장 10(0.6초 미만 자막 3·한 어절 자막·예외 승인 경계 2·H4·글자수·계산 예시 없음).
- 못 본 것: 완성본 전체 청취, 첫 씬(impact) 확대 구간 프레임별 확인(워터마크 시트상 ✦ 없음).

## F. 커버
- ✅ `scripts/_owl-cover-ep24-spec.mjs`(딥 포레스트 그린→골드 앰버, 글자·배지·군 마크 없음) → 글자 없는 배경 `C:/tmp/owl-cover-ep24-textless/`(1차 생성은 귀깃이 44%에 올라와 폐기 `…_v1_ears44.png`, 2차 귀깃 ≈53%) → 합성기로 **제목 그대로(규칙 30)** "군 복무와 / 출산, / 국민연금 / 더 인정돼요" **4줄 150px(≥140)**, 세로 13.0~49.1%, 마지막 줄 노랑 → `C:/tmp/owl-cover-ep24/00_owl_ep24_cover_thumb.png`. 3줄("군 복무와 출산,"/"국민연금"/"더 인정돼요")은 첫 줄 121px라 규칙 30의 4줄 허용으로 나눔.
- ⬜ Owner 커버·영상 확인 → 압축(35MB 이하)·콘텐츠 유닛·배포 전 게이트 → 배포는 Owner 지시(제안 금지). 게시 직전 재확인: 국민연금법 시행일·군별 개월 수·월 연금 추정(복지부 가정)·"이미 전역자 제외".
- 게시 직전 재확인: 국민연금법 개정 시행일·군별 개월 수·월 연금 추정 수치(복지부 평균소득 가정), "이미 전역자는 대상 아님" 해석.
