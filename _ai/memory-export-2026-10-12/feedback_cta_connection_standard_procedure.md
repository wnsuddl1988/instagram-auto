---
name: cta-connection-standard-procedure
description: "CTA 연결 시 항상 쓸 표준 절차(2026-09-23 확정) — xfade 금지, tpad 연장+fade 전환 방식. \"CTA 붙여줘\"라고만 해도 이 절차 그대로 실행"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0616c897-fe63-4f4b-b75e-04be8bd972c3
  modified: 2026-09-26T05:20:15.225Z
---

## ★ 2026-09-26 갱신 — 이 절차는 이제 스크립트에 내장됨(수동 ffmpeg 금지)

`scripts/run-owl-episode-with-fixed-cta-once.mjs`가 아래 절차(발화 종료까지 tpad 연장 → 0.3초 fade-out/in → 오디오 순차 결합)를 자동으로 수행하고, 발화 사이 최소 무음 0.3초 보장과 프레임 드롭·A/V 길이 검증(`<out-dir>/cta-join-report.json`)까지 한다. **반드시 `--alignment <그 편 TTS *.alignment.json>`을 넣어 실행하고 report가 PASS인지 확인한다.** 사용법은 `_ai/CURRENT_STANDARDS.md` §A-7.

**Why(갱신 계기)**: 이 절차가 메모리에만 있고 스크립트는 하드컷만 해서, 황소특보 4편(2026-09-26)을 스크립트로 결합했더니 마지막 멘트 끝이 CTA 화면 위로 들리고 CTA 첫 프레임이 약 0.8초 정지한 채 배포됐다. "문서/메모리에 절차가 있다"와 "코드가 그렇게 동작한다"는 별개였다.

아래 수동 절차 설명은 원리 이해용으로만 남긴다.

## 규칙

본편(마지막 씬까지 조립된 영상)에 고정 CTA(`geumbaksa_cta_clean_final.mp4` 등, 캐릭터별 고정 클립)를 연결할 때는 **항상 아래 표준 절차**를 그대로 쓴다. Owner가 "CTA 연결해" / "CTA 붙여줘"라고만 말해도 이 절차를 기본값으로 실행한다.

## 적용 완료 현황 (2026-09-23)
- 금박사: 4, 5, 6, 7, 8, 9편 전부 이 절차로 v12 확정 (`C:/tmp/geumbaksa-ep{N}-episode-final-v12/owl_episode_final.mp4`). Owner 확인 완료("아까보단 많이 좋아졌네, 이렇게 진행하는걸로 하자").
- 부엉박사: 8, 9, 10, 11, 12, 13편 전부 이 절차로 `C:/tmp/owl-ep{N}-episode-final-v-cta-std/owl_episode_final.mp4`로 완료, Owner 확인 완료. 부엉박사는 파일명=표시번호 일치(금박사와 달리 혼선 없음).
- Owner 피드백(2026-09-23): **"금박사보다 부엉박사에서 퀄리티가 훨씬 더 살아난다"** — 같은 절차를 적용해도 캐릭터/CTA 클립 자체의 완성도 차이로 체감 품질이 갈릴 수 있다는 관찰. 향후 금박사 CTA 클립 자체의 개선 여지를 검토할 근거로 참고.
- 이 절차는 일회성이 아니라 **앞으로 모든 신규 편(금박사·부엉박사 모두)의 CTA 연결 시 기본값으로 계속 사용**한다 — Owner가 "이거 꼭 저장해놓고 절대 잊으면 안돼"라고 명시적으로 강조함.

## 표준 절차 (9편에서 확정, 4~8편에 재적용 완료, 2026-09-23)

### 배경 — 왜 이 방식인가
1. **xfade 필터는 절대 쓰지 않는다.** `xfade` 단독은 입력 길이/offset 관계에 따라 동작이 예측 불가능하게 달라진다(같은 코드로 어떤 편은 정상, 어떤 편은 CTA 뒷부분이 통째로 중복되거나 잘림). 실측 여러 번 재현 확인됨.
2. 대신 **`tpad`(마지막 프레임 짧게 연장) + `fade=t=out`/`fade=t=in` + `concat`** 조합을 쓴다. 이 방식은 길이 예측이 정확하고 프레임 드롭이 없다.
3. 본편 마지막 씬은 구조상 "발화 후 무음 꼬리는 화면을 안 늘린다"는 안전장치(과거 정지화면 사고 방지용, [[feedback_assembly_script_change_side_effects]] 참고) 때문에, **비디오 스트림이 오디오(발화)보다 먼저 끝나는 경우가 있다.** 이 경우 마지막 문장 끝 한두 글자가 화면 없이(이미 CTA로 넘어간 뒤) 들리는 결함이 생긴다 — Owner가 "마지막 멘트가 한두 글자씩 끊기면서 페이드아웃된다"고 정확히 지적함(2026-09-23).

### 단계

1. **정확한 발화 종료 시각(NARRATION_END) 계산**: 그 편의 TTS alignment JSON(`C:/tmp/money-shorts-os/geumbaksa-ep{N}-tts/output-v*/*.alignment.json`, 가장 최근 버전)에서 마지막 씬 narration의 마지막 문장이 끝나는 정확한 시각(마침표 `character_end_times_seconds`)을 구한다.
2. **본편 비디오 스트림의 실제 끝(VIDEO_END) 확인**: `ffprobe -select_streams v:0 -show_entries stream=duration`로 **비디오 스트림만** 확인한다 — 컨테이너 전체 길이(오디오 포함, `format=duration`)와 다를 수 있으므로 반드시 구분할 것.
3. **연장 필요 여부 판단**: `EXTEND_SEC = NARRATION_END - VIDEO_END + 0.15`(여유 마진). `EXTEND_SEC <= 0`이면 연장 불필요(화면이 이미 발화보다 김) — 원본을 그대로 쓴다. 4~7편은 실제로 연장이 필요 없었고, 8편·9편만 필요했다 — 편마다 다르니 매번 계산해야 한다.
4. **필요시 tpad로 마지막 프레임 연장**: `tpad=stop_mode=clone:stop_duration=<EXTEND_SEC>,fps=24,format=yuv420p`
5. **fade-out(본편 끝) + fade-in(CTA 시작) + concat으로 영상 트랙 결합**: `DISSOLVE_DUR=0.3`초 고정. `FADE_START = NEW_VIDEO_END - 0.3`.
   ```
   [0:v]setpts=PTS-STARTPTS,fps=24,format=yuv420p,fade=t=out:st=<FADE_START>:d=0.3[v0];
   [1:v]setpts=PTS-STARTPTS,fps=24,format=yuv420p,fade=t=in:st=0:d=0.3[v1];
   [v0][v1]concat=n=2:v=1:a=0,fps=24[outv]
   ```
6. **오디오는 순차 결합**(본편을 NEW_VIDEO_END까지 자르고 CTA 오디오를 그대로 이어붙임, 겹치지 않게).
7. **최종 mux**: video_only + audio_only를 `-c:v copy -c:a copy -shortest`로 합친다.

### 검증 (매번 필수, 생략 금지)
- 프레임 드롭 검증: `nb_read_frames / 24`가 `duration`과 정확히 일치해야 함.
- 시각 검증(Read 도구로 프레임 이미지 직접 확인): (a) NARRATION_END 직전엔 여전히 본편 화면, (b) 직후엔 CTA로 자연스럽게 전환, (c) CTA 원본의 진짜 마지막 프레임(마무리 여운 컷)까지 잘리지 않고 다 포함됐는지 — CTA가 중간에 잘리는 게 가장 흔한 실패 패턴이었음.
- 무음 구간 검증: 전환부 무음이 0.3~1.2초 범위(편마다 CTA 자체 시작 무음 + 본편 여백이 달라 다를 수 있음, 과도하게 길면(2초+) 의심).

### 조립·CTA 결합·보고는 한 번에 묶어서 (2026-09-24 확정)

본편 조립 후 CTA 결합까지 **항상 이어서 같이 진행하고, 두 단계가 다 끝난 뒤 한 번에 검수 요청**한다. "본편 조립했습니다, CTA도 붙일까요?"처럼 중간에 끊어서 재확인받지 않는다 — Owner가 "조립할때 CTA까지 항상 같이 결합하고 보고해, 한번에 검수하게"라고 명시적으로 지시함. 씬 영상이 다 모이면 본편 조립 → NARRATION_END/VIDEO_END 계산 → CTA 결합까지 자동으로 이어서 실행하고, 최종 결과물(CTA까지 붙은 완성본) 하나만 놓고 검수를 받는다.

### 하지 말아야 할 것
- CTA 클립 자체를 매번 새로 생성하지 않는다(비용 낭비, [[feedback_deploy_procedure_must_follow_exactly]]처럼 API 낭비 지적받음). "CTA 앞에 대기 인트로 클립을 추가"하는 방식도 한 번 시도했으나 Owner가 "이상해졌다"며 원복 요청함(2026-09-22) — 재시도 금지.
- xfade 필터 사용 금지(위 배경 참고).
- 발화 후 무음 꼬리까지 화면을 억지로 늘리지 않는다 — 딱 NARRATION_END + 여유(0.15초)까지만 연장.

### 관련 파일
- 표준 스크립트: `scripts/run-owl-episode-with-fixed-cta-once.mjs` — 2026-09-26부터 위 절차 내장(수동 ffmpeg 불필요). 새 CTA 클립은 `KNOWN_CTA_LEADING_SILENCE_TRIM_SEC`에 실측 도입부 무음을 등록해야 한다(금박사 현행 `geumbaksa_cta_clean_final_v3voice.mp4`=0초 등록 완료).
