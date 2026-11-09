---
name: reference-youtube-shorts-transcript-bulk-collection
description: "YouTube 채널 쇼츠 자막 원문 대량 수집법(내장 Browser pane, 2026-09-26 검증: 486개/약 15분, 실패 2건) — 벤치마크 재분석 시 이 방법으로"
metadata:
  node_type: memory
  type: reference
  modified: 2026-09-26T07:18:12.967Z
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
---

벤치마크 채널을 분석할 때는 **요약이 아니라 자막 원문 전체를 모아서** 본다([[feedback_benchmark_analysis_must_use_raw_transcripts]]). 2026-09-26 경제사냥꾼 쇼츠 486개를 이 방법으로 모았다.

**안 되는 방법(시도해서 실패함):** 영상을 재생하며 `.ytp-caption-segment`를 폴링하는 방식은 영상 하나에 수 분이 걸리고, 쇼츠 화면이 다음 영상으로 자동 넘어가 끊긴다. `get_transcript` API는 400(FAILED_PRECONDITION)으로 막혀 있다. timedtext의 baseUrl을 직접 fetch하면 pot 토큰이 없어 빈 응답이 온다.

**되는 방법(단계):**
1. 채널 목록 수집: `/channel/{id}/shorts` 페이지 HTML에서 `ytInitialData`를 꺼낸다. 그 안의 `chipViewModel.text==='인기순'`에서 continuationCommand.token을 찾는다. 이 토큰으로 `/youtubei/v1/browse`에 `ytcfg.get('INNERTUBE_API_KEY')`와 `INNERTUBE_CONTEXT`를 넣어 POST하고, continuation을 반복한다. `shortsLockupViewModel`에서 videoId·제목·조회수를 얻는다(20페이지로 960개).
2. **일반 watch 페이지**(`/watch?v=ID`)를 연다. 쇼츠 페이지는 자동으로 넘어가서 쓰지 않는다.
3. 페이지에서 `window.fetch`와 `XMLHttpRequest`를 후킹한다. URL에 `timedtext`가 들어간 응답 본문을 `window.__tt`에 쌓는다.
4. 같은 페이지에서 영상만 바꾼다: `movie_player.mute(); loadVideoById(id)` → 1.5초 대기 → `unloadModule('captions')` → `loadModule('captions'); setOption('captions','track',{languageCode:'ko'})`. 이러면 플레이어가 pot 토큰이 붙은 정상 요청을 보내고, 그 응답(json3)을 가로챌 수 있다. 영상 하나에 약 2초 걸린다.
5. json3의 `events[].segs[].utf8`과 `tStartMs`로 텍스트와 타임스탬프를 만든다.
6. `javascript_tool`은 45초 제한이 있다. 배치 예산을 36초로 두면 호출 한 번에 약 19개를 처리한다. `browser_batch`로 5번씩 묶어 돌린다.
7. 분석은 브라우저 안에서 정규식 통계(출현율, 출현 시점)로 먼저 하고, 원문은 대표 표본만 컨텍스트로 가져와 읽는다. 486개 원문을 전부 가져오면 약 120만 자라 컨텍스트가 넘친다.

**2026-09-26 2차 수집(정책형 79개, 실패 0) 때 확인한 보정:**
- 경제사냥꾼 핸들 `@moneyhunter_kr`는 404다. 채널 ID `UC7usMJDHmtbs_oegmzQKKMA`로 `/channel/{id}/shorts`에 접근한다.
- 목록 이어받기 토큰은 `continuationItemRenderer.continuationEndpoint.continuationCommand.token`에서 꺼낸다. 아무 `continuationCommand`나 잡으면 첫 페이지만 반복된다.
- 채널 목록 페이지에서 watch 페이지로 옮기면 `window` 변수가 사라진다. 고른 목록은 `sessionStorage`에 넣어 옮긴다.
- **내장 Browser pane에서는 원문을 파일로 못 뺀다**(2026-09-26 확인): `a.download` 다운로드는 파일이 생기지 않고, YouTube CSP 때문에 127.0.0.1로의 fetch·iframe도 막히며, `window.open`은 팝업 차단 뒤 **같은 탭을 이동시켜 수집 데이터가 날아간다**(절대 쓰지 말 것). Claude가 원문을 읽어 Write로 옮기는 건 제3자 저작물 전문 복제라 하지 않는다. 원문 보관이 필요하면 Owner 본인 Chrome에서 콘솔 스크립트로 수집·다운로드하게 한다.

**개선할 점(다음에 적용):**
- 수집이 끝나면 원문 전체를 로컬에 보관한다. 지금은 브라우저 메모리에만 있어 페이지를 옮기면 사라진다. 파일로 저장하려면 다운로드 승인을 받거나 청크로 나눠 Write해야 한다. 다음에는 Owner 승인을 받고 JSON으로 저장해서 재분석 때 다시 모으지 않게 한다.
- 표본이 인기순 상위 위주라 조회수 상관관계가 약하게 나온다. 다음에는 인기 상위·중위·하위와 최신을 층별로 섞어 뽑는다.
- 정규식 하나로는 표현 변형(핵심 질문 등)을 놓친다. 무작위 표본 원문 정독으로 보완한다.
- 자동자막 오탈자가 있다("3전"=삼전 등). 인용할 때는 원문 그대로 두고, 해석할 때만 보정한다.
