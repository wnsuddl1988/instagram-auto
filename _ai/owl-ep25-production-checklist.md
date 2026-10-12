# 부엉박사 표시 24편 제작 체크리스트 (파일 번호 25) — 아동수당 → 아동기본수당 월 20만 원(절반 상품권)·아이맞이지원금 (규칙 23·26·27)

> 템플릿 `_ai/templates/episode-production-checklist.md`의 단계를 그대로 따른다. 단계가 끝날 때마다 ✅/❌와 증거를 적는다. 게시 시점은 Owner가 정한다(제안 금지). 짝 편: 표시 23편(파일 ep24). **정부안·국회 심의 중 — 게시 직전 국회 결과 재확인 필수.**

## A. 소재·대본
- ✅ 소재: 위 표시 23편과 같은 경위("선정해봐" → "1번 진행해", 2026-10-06). 팩트: 이투데이·한국일보(9/1)·뉴스1·사이드뷰 원문 → `_ai/owl-ep25-child-allowance-script-draft.md` 팩트표.
- ✅ 대본 v4(최종): `C:/tmp/owl-ep24-draft/child-allowance-scenes-v4.json`, **15씬·526자**, 검사기 **반드시 수정 0**·확인 권장 4. (v3 17씬에서 TTS 전에 총액 7,500만 원 씬(단일 출처)·상품권 사용 제한 씬을 빼 줄임 — 총액은 영상·캡션 모두 쓰지 않음.)
- ✅ 새 독자 읽기 점검(규칙 29) 1회(v2): Q3 "중간에서 별개 제도가 섞인 느낌" → v3에서 3·5·6·8~12번 수정(현금 그대로·상품권 더해짐 명시, 항목을 매달/출생 몫으로 분리, 총액은 "정부 계산"). v4는 씬 삭제만.
- ✅ Owner 대본 확정 + TTS 승인("1번 진행해" ×2, 2026-10-06). **TTS 유료 API 1회**(15씬, `C:/tmp/money-shorts-os/owl-ep25-tts/output-v1/`).
- ✅ 장부 24편 등록(money_calc·other·contrast, published:false).

## B. TTS·스펙·이미지
- ✅ TTS: 15씬 **104.92초**(CTA 포함 약 120초), 정렬 밀림 최대 -0.2초 → 보정 없음.
- ✅ 스펙 `scripts/_owl-v2-ep25-assembly-spec.mjs`(`OWL_EP25_ASSEMBLY_SPEC`): 15씬, 배경 3구역(놀이 광장 라운지 A·지역 장터 광장 B·선물 상자 전시 홀 C), openingMotion **pushin**(직전 24편 impact와 번갈아), 검사기 반드시 수정 0.
- ✅ 이미지 15장(2026-10-06, ep24와 같은 명령 형식, `--scene-spec-export OWL_EP25_ASSEMBLY_SPEC --out-dir C:/tmp/owl-v2-ep25-images`): **15장 모두 1차 생성, 재생성 0회**. 파일 `owl_ep25_s{1..15}.png`.
- ✅ 안전선 시트 `C:/tmp/owl-v2-ep25-images/safe-zone-sheet.png`: 카드 글자 전부 좌우 안전선 안, 한글·숫자 철자 대조 OK, 카드 아래 끝 약 60% 안팎(자막 상단 약 68%보다 위), s9 클로즈는 카드 없음. 못 본 것: 영상화 후 글자 유지.

## C. 영상 프롬프트
- ✅ `_ai/owl-ep25-video-generation-prompts.md`: **8초 7개(s2·6·7·9·12·14·15) / 10초 8개**, 카드 씬 전부 10초, 입 멈춤 2단계, 본문에 금지 표현 없음. 저장명 `Downloads/1~15.mp4`, "부엉박사 표시 24편(파일 ep25)"이라고 알려주기.

## D. 영상 검수 (수령 2026-10-07, `Downloads/부엉 24편/1~15.mp4`)
- ✅ `C:/tmp/owl-v2-ep25-videos/`에 스펙 파일명으로 복사, ffprobe: 15개 모두 720x1280·24fps, 길이 요청 티어와 일치(8초 7개·10초 8개). 검수 시트 `C:/tmp/owl-v2-ep25-videos-review/sheet_1~5.png`(씬별 시작·중반·끝): 카드 글자(8개 씬 모두) 끝 프레임까지 선명, 소품 이탈·표정 붕괴·카메라 줌 없음, 배경에 새 글자 없음.
- ⚠ 입 멈춤 측정(`check-clip-speech-timing-once.mjs`): 15개 모두 경고(+1.19~+4.78초) — 이전 편과 같은 패턴, 조립이 TTS 발화 기준으로 잘라 쓰므로 컷에 보이는 구간만 영향. 못 본 것: 컷 안 대사 뒤 입 움직임 프레임 단위 확인.

## E. 조립·마감
- ✅ 정렬 보정 `fix-tts-alignment-from-audio-once.mjs --threshold 0.05`(23편 교훈으로 처음부터 엄격 기준): 11개 씬 -0.06~-0.2초 보정 → `…summary.audio-fixed.json`·`…audio-fixed.alignment.json`으로 조립·CTA·QA.
- ✅ 조립 `C:/tmp/owl-v2-ep25-assembly-v1/`(104.9초, openingMotion pushin, 전환 싱크 누적 오차 0, 컷 리드 0.10~0.14초). 1차 조립이 한 어절 폭 초과 3줄('아동기본수당으로' 768·'지역사랑상품권이야' 864·'아이맞이지원금이' 768 > 한도 760)로 ABORT → **조립기·QA에 스펙 옵션 `captionWidthExceptions` 신설**(사유 필수·안전폭 864px 이내만·글자 96px 유지·승인 줄은 경고로 남김, 기본 동작 불변), 스펙에 3줄 사유 승인(대사 변경=TTS 유료 재생성 회피).
- ✅ CTA 결합(owl-cta-fixed-v3, `--scene8-start 104.931`, audio-fixed alignment) **PASS 2866/2866**, 화면·오디오 119.42초, 4시점 프레임 육안 확인(본편 끝→검은 전환→CTA→CTA 마지막) → 워터마크 제거(sparkle·veo_text, watermark-check 15곳 육안 OK) → 오디오 마감 **-14.9 LUFS / -0.5 dBTP** → `C:/tmp/owl-v2-ep25-final/owl_episode_final_mastered.mp4`.
- ✅ QA 1차 반드시 수정 2: ①s1 '아이 키우는 집, 내년 || 아동수당이' 금지 경계(대안 분할이 발화 0.59초라 0.6초 규칙에 0.01초 모자람 → 스펙 `captionBoundaryExceptions`로 사유 승인) ②edge-review 기록 누락 → 시트(edge-review-1~2·caption-card-1~2) 육안 후 `qa/edge-review.json`(카드 씬 8개 edge·captionOverlap 전부 ok) → 재실행 **반드시 수정 0**. 자막-음성 대조 33곳 모두 끝까지 표시, 자막-카드 간격 윗줄 최소 y=1257. 확인 권장 17(0.6초 미만 자막 4·한 어절 자막·예외 승인 경계 1·폭 3·H4·글자수·"7월" 반복·계산 예시 없음).
- 못 본 것: 완성본 전체 청취, 첫 씬(pushin) 확대 구간 프레임별 확인.

## F. 커버
- ✅ `scripts/_owl-cover-ep25-spec.mjs`(딥 틸→코랄 핑크, 직전 6편과 색 겹침 없음, 글자·카드·상품권 실물 없음) → 글자 없는 배경 `C:/tmp/owl-cover-ep25-textless/`(1차에 통과) → 합성기로 **제목 그대로(규칙 30)** "아동수당 / 두 배, / 절반은 / 상품권이에요" **4줄 150·150·150·145px(≥140)**, 세로 5.1~40.9%, 마지막 줄 노랑, 귀깃(≈47%)과 겹침 없음 → `C:/tmp/owl-cover-ep25/00_owl_ep25_cover_thumb.png`. 3줄("아동수당 두 배,"/"절반은"/"상품권이에요")은 첫 줄 121px라 규칙 30의 4줄 허용으로 나눔.
- ✅ 캡션 마무리 질문 추가("월 20만 원 중 10만 원이 상품권이라면 … 현금과 상품권 중 어느 쪽이 더 쓸모 있을까?"): 기존 설명형 업데이트 방향(`_ai/explainer-update-direction-2026-10-07.md`) 반영.

## G. 이후 단계
- ⬜ Owner 커버·영상 확인 → 압축(35MB 이하)·콘텐츠 유닛·배포 전 게이트 → Owner 지시 배포(시간표: 기존 영상 저녁 6~7시).
- 게시 직전 재확인(필수): 국회 심의 결과(시행 시기 2027.7, 금액, 소급 여부), 아동기본수당 대상 연령(0~12세 vs 단계 확대), 지방우대 지역 범위, 상품권 사용 가능 지역·가게 제한(캡션에 언급).
