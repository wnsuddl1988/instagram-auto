---
name: project-bull-voice-confirmed
description: "황소특보 ElevenLabs 목소리 확정(2026-09-23) — Jeonggi, env 등록+코드 화이트리스트 반영 완료"
metadata:
  node_type: memory
  type: project
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-22T21:01:37.509Z
---

## 확정 사항

- **목소리**: Jeonggi - Confident Narrator (`HCANy6ACvOWyndVWS0gV`), 계정 보유 voice(추가 결제 없이 바로 사용 가능)
- env: `ELEVENLABS_VOICE_ID_BULL`/`ELEVENLABS_VOICE_LABEL_BULL`을 `.env.local`에 Owner가 직접 추가 완료(2026-09-23)
- 코드 등록 완료:
  - `scripts/build-elevenlabs-korean-director-tts-from-script.mjs`의 `CHARACTER_VOICE_ENV_MAP`에 `bull` 추가
  - `scripts/run-owner-command-with-local-env-no-log.mjs`의 `TTS_VOICE_ONLY_ENV_KEY_NAMES`에 BULL 키 추가, `validateOwlTtsBeforeEnvAccess`의 `--character` 화이트리스트(`["owl","geumbaksa"]`)에 `"bull"` 추가
  - 이제 `--character bull`로 owl-tts no-log 서브커맨드 실행 가능

## 캐스팅 과정 (다음에 새 캐릭터 목소리 고를 때 참고)

- `scripts/build-owl-voice-casting-samples-v1.mjs`(이름은 owl이지만 범용) + no-log wrapper의 `owl-voice-casting` 서브커맨드로 진행. `--mode list`는 무료(계정 보유 57개+한국어 라이브러리 60개 조회), `--mode sample --arm`은 유료(보이스당 TTS 1회 생성).
- **ElevenLabs Voice Library 웹사이트는 로그인 필요해서 브라우저로 직접 못 들어감** — API 기반 no-log 방식이 유일한 실질적 경로.
- 부엉박사/금박사 캐스팅 때 이미 들어봤던 후보(Min, Seojin, Eric, Jeong, Yohan Koo, DHK7, Mr.K Pro, Daniel, Gihong, Liam=최종선택 / 금박사: Hyemin, Jessica, Sola, Hana Lee 등)와 겹치지 않게 새 후보를 골라야 함 — 과거 결과는 `C:\tmp\money-shorts-os\owl-voice-casting\`, `geumbaksa-voice-casting\` 파일명(예: `owl-casting-longer-{voiceId8자}.mp3`)으로 역추적 가능.
- 최종 6후보(Jeonggi/Jin Ho/Harry Kim/Kangsu/Adam/Bill) 중 Owner가 Jeonggi 선택. 결과 파일: `C:\tmp\money-shorts-os\bull-voice-casting\`

## 남은 작업

- [[project_bull_risk_disclosure_and_cta_structure]]에 따라 황소특보 단일 CTA 클립(TTS→Veo→합성) 제작 재개 — 이제 voice 블로커 해소됐으므로 바로 진행 가능
- `_ai/CURRENT_STANDARDS.md`에 황소특보 캐릭터 섹션(부엉박사/금박사처럼) 아직 미작성 — CTA/본편 파이프라인이 실제로 완성되면 그때 정식 등록
