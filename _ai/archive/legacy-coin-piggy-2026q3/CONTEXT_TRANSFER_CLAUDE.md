# Context Transfer — Money Shorts OS (부엉이/금박사) — 2026-09-20

## 현재 배포 상태
- 부엉이 쇼츠+카드뉴스: 1~5편 배포 완료(Instagram Reels/카드뉴스/Story, YouTube Shorts)
- 부엉이 쇼츠 제작(미배포): 1~9편 제작 완료(9편은 대본→TTS→이미지→영상→조립까지 완료, Owner 승인됨)
- 금박사 쇼츠+카드뉴스: 1편 배포 완료(환율편, `_geumbaksa-ep4-assembly-spec.mjs` 파일명 기준. 배포 순서상 실질 1편)
- 금박사 쇼츠 제작(미배포): 1~4편 제작 완료(환율/IRP/ETF/레버리지)
- 금박사 5편(신용점수): 대본 확정, TTS 생성 완료(10씬, 69.96초, 전 씬 10초 이내). 다음 단계는 이미지 생성(미시작)

## 자막 시스템 버그 수정 이력(2026-09-20)
- `scripts/run-owl-assemble-shorts-v2.mjs`의 캡션 재분할 로직에 "관형사(한/두/세/…/그/이/저/또/몇) 바로 뒤 분할 금지" 규칙 추가(`splitCaptionIntoScreenSafeBlocks`, `wrapToLines`, `wrapToLinesForced` 3곳). "4개 중 1개는 한 / 달 이후"처럼 어절이 쪼개지던 버그 수정. 8편 재조립으로 검증 완료.

## CTA 시스템 버그 수정 이력(2026-09-20) — 이번 작업의 핵심 배경
- 기존 `owl_cta_muxed.mp4`(follow 클립)의 오디오 트랙이 7.36초로 잘려있었음(원본 TTS는 8.64초) — 자막은 8.64초 타이밍인데 음성이 짧아 마지막 자막 구간("먼저 만나볼 수 있어")이 목소리와 어긋났음.
- 원인: mux 단계에서 오디오가 하드컷된 것으로 추정(생성 스크립트 소실, 재구성으로 수정).
- 수정: 원본 TTS 오디오(8.64초, `C:\tmp\money-shorts-os\owl-cta-tts\out\`)를 정확히 재추출해 원본 비디오 소스(`owl_cta_signature_motion.mp4`, 10초)와 재mux → `owl_cta_final_with_captions_fixed.mp4`(8.67초) → 기존 teaser(`owl_ep3_cta_bright_teaser_final_with_captions.mp4`, 8.0초, 자체 검증 결과 정상)와 재결합 → `owl_cta_combined_follow_teaser_v2.mp4`(16.7초) 완성.
- 이 v2 CTA를 5, 6, 7, 8, 9편 전체에 재적용해 재조립 완료.
- **CTA 관련 스크립트**: `scripts/run-owl-cta-final-assemble-once.mjs`(follow 클립 자막 재생성, `--muxed-video`/`--out-dir`/`--final-out-name` 파라미터화 완료), `scripts/run-owl-episode-with-fixed-cta-once.mjs`(본편+CTA 결합, `--cta-clip`로 원하는 CTA 클립 지정 가능)

## 이번 대화에서 시작된 새 작업: 부엉이 CTA 근본 재검토
Owner 지적(2026-09-20): "CTA 1~2편 멘트는 그대로 가면 될거 같은데 아니 더 우리 채널 컨셉에 맞게 보충해도 좋지. ... 부엉이쇼츠는 CTA가 영상마다 난 어색하게 느껴져." — 단순 오디오-자막 동기화 버그를 넘어서, **CTA 콘텐츠 자체(멘트·배경·목소리 톤)가 본편과 이질감이 있다**는 근본적 지적.

배경:
- 부엉이 CTA(follow+teaser)는 원래 "2편(가계부채)"·"3편(서울 집값)" 제작 과정에서 만들어진 것을 재사용 중 — 부엉이 콘텐츠가 1~9편까지 쌓이며 채널 컨셉(경제번역소, 카피라이팅 톤, 캐릭터 "부엉박사")이 정립된 지금 시점에는 안 맞을 가능성.
- 금박사 CTA는 "부엉이를 만들면서 같이 만든 것"이라 상대적으로 안정적(Owner 표현)이라, 이번 재검토 대상은 부엉이 CTA로 한정.
- Owner 요청: 기존처럼 "2개 영상 클립(follow+teaser)" 구조는 유지하되, 대본을 그대로 쓰거나 개선해서 1~9편 전체 영상 흐름을 참고해 "어느 편에 붙여도 안 어색한" 범용 CTA를 새로 설계해달라는 것. "면밀히 검토하고 제안"을 요청 — 아직 실행 승인은 아님, 제안 단계.

## 다음에 할 일 (미착수)
1. 부엉이 1~9편의 실제 영상 톤·배경·캐릭터명("부엉박사")·엔딩 분위기를 전수 조사
2. 기존 CTA(follow+teaser) 대본·배경·목소리 톤이 왜 이질적인지 구체적으로 진단(예: 배경이 특정 편과 겹침, 목소리 톤이 안 맞음, "경제번역소" 채널명 시점에 캐릭터명 "부엉박사"가 없어서 생긴 구조적 차이 등)
3. 개선안 제안(대본 유지/보완 여부, 배경 재설계 여부, TTS 재생성 여부) — Owner 승인 후 실행

## 참고 파일 경로
- 부엉이 CTA 자산: `C:\tmp\owl-cta-final\` (v2가 현재 최신), teaser는 `C:\tmp\owl-ep3-cta-bright\`
- 부엉이 CTA TTS 원본: `C:\tmp\money-shorts-os\owl-cta-tts\owl-cta-tts-script.json`(follow), `C:\tmp\money-shorts-os\owl-ep3-cta-teaser-tts\owl-cta-teaser-tts-script.json`(teaser)
- 부엉이 각 편 스펙: `scripts/_owl-ep{1~9}-assembly-spec.mjs`(1~4편은 `_ai/OWL_EP{n}_ASSEMBLY_SPEC_BACKUP.mjs`)
- 금박사 5편 TTS 완료본: `C:\tmp\money-shorts-os\geumbaksa-ep5-tts\output-v1\`
