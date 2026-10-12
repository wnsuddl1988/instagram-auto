# 본계정 인수인계 — 2026-10-12 (서브계정 세션 종료 시점)

> 먼저 읽을 순서: ① 저장소 `CLAUDE.md`(맨 위 스토리형 규칙 포함) → ② 이 파일 → ③ `_ai/CONTEXT_TRANSFER_CLAUDE.md` 맨 위 두 섹션 → ④ `_ai/story-ep16-20-production-checklist.md`.
> 브랜치 `handoff/econ-pc-20261009-1232`(원격 push됨). 프로젝트 Main AI = Claude Code, 사용자 보고는 한국어, 보고 끝은 `### 다음 추천 작업`(게시·배포 항목은 넣지 않는다).

## 1. 본계정이 맨 처음 붙여 넣을 프롬프트

```text
ROLE_MODE: MAIN_AI_MODE
프로젝트: 경제번역소 Shorts — C:\Users\PC\jjy\instagram-auto (Main AI = Claude Code)
브랜치: handoff/econ-pc-20261009-1232 (최신 커밋 확인 후 작업)

서브계정 세션에서 인수받는다. 아래 순서로 읽고, 편집 전에 현재 상태를 짧게 보고해라.
1) CLAUDE.md (맨 위 스토리형 대본 규칙 = 어떤 작업보다 먼저)
2) _ai/HANDOFF_TO_MAIN_ACCOUNT_2026-10-12.md
3) _ai/CONTEXT_TRANSFER_CLAUDE.md 맨 위 두 섹션
4) _ai/story-ep16-20-production-checklist.md
5) 메모리: 현재 계정 메모리에 이 프로젝트 기록이 없으면 _ai/memory-export-2026-10-12/MEMORY.md 를 색인으로 읽고 필요한 파일만 연다.

확인할 것: git status -sb / git log -3, C:\tmp\story-ep16-buldak ~ story-ep20-castella 와 C:\tmp\money-shorts-os 존재 여부(없으면 _ai/story-pipeline-backup-2026-10-12/ 로 도구·설정만 복원 가능, 음성·이미지는 재생성 필요), Downloads\스토리16~20편_이미지 와 Downloads\스토리 N편\ 존재 여부.

지금 상태 요약: 스토리형 16~20편은 대본 확정·소재 검증·TTS·정렬·템포·배경음·조립 스펙·영상 프롬프트·이미지 79장 검수까지 끝났고 Owner Veo 영상(Downloads\스토리 N편\1~n.mp4)을 기다린다. 스토리 7편은 10/12 배포 완료(유튜브 Studio 썸네일 저장만 미완).

지킬 것: 자격증명은 scripts/run-owner-command-with-local-env-no-log.mjs 래퍼로만(.env.local 읽기 금지). 게시·배포는 Owner가 "N편 배포해줘"라고 할 때만, commit은 Owner 요청 때만, push는 별도 승인. 새 유료 API 호출은 횟수를 말하고 Owner 승인 후. 사실 확인은 검색·WebFetch 요약이 아니라 페이지 원문(node fetch 키워드 대조)으로. 풀(lib/source-facts/story-topic-pool.json)은 26편 시작 전까지 동결.

상태 보고 뒤 Owner에게 다음 작업(아래 우선순위)을 번호로 물어봐라:
1. 16~20편 Veo 영상 수령 → 검수·조립·QA·커버 (제목 임시안 확정 필요)
2. 21~25편 설계 줄 + 대본 (16~20편과 같은 방식)
3. 스토리 5·6·7편 유튜브 반응 재수집(10/14 이후) 후 스냅샷
```

## 2. 지금까지 한 일 (2026-10-12 서브계정 세션)

| 구분 | 내용 | 위치 |
|---|---|---|
| 규칙 완화(Owner 승인) | ① 숫자 4개 하한 폐지(쓰는 숫자만 2출처) ② 결정 장면 1출처 귀속 허용 ③ 현상 서사 허용. 근거·변경 이력 기록 | `_ai/story-script-rules.md`, `_ai/owner-rule-provenance.md`, `_ai/story-format-structure-v1.md` |
| 소재 풀 | 432개(사용 15·쓸 수 있음 152·못 씀 265), 26편 시작 전까지 동결 | `lib/source-facts/story-topic-pool.json`, `_ai/STORY_ASSETS_AND_OPERATING_PLAN_2026-10-12.md` |
| 시즌 2 | 16 불닭볶음면·17 프리챌·18 포켓몬빵·19 류현진 포스팅·20 대왕카스테라·21 설향·22 스타벅스 프리퀀시·23 유일한의 유언·24 평창 롱패딩·25 애니팡 | `_ai/story-season-plan-2026-10-12.md` |
| 성과 추적 | 스토리형 1·2·3·5·6편 IG·YT 지표, 스냅샷 스크립트 | `_ai/performance-report-story-2026-10-12.md`, `_ai/story-performance-tracker.md`, `scripts/story-performance-snapshot.mjs` |
| 16~20편 대본 | 설계 줄 → 대본 → 원문 대조(103곳 일치) → 검사기 수정 0 → 17~20편 마지막 문구 축소 | `_ai/story-script-final-ep16-20-2026-10-12.md`, `_ai/story-s2-scripts/` |
| 16~20편 제작 | 소재 검증·설계·TTS 9회·정렬·템포·배경음 5회·조립 스펙·영상 프롬프트·이미지 79장 | `_ai/story-ep16-20-production-checklist.md`, `scripts/_story-ep{16..20}-assembly-spec.mjs`, `_ai/story-ep{16..20}-video-generation-prompts.md` |
| 스토리 7편 배포 | 릴스 DeYYsagiP_r(13:33), 스토리, 유튜브 Ae8re-WZ6iU 14:35 예약 | 메모리 `project_story_ep7_deployed_2026_10_12.md` |

## 3. 남은 일

1. **Veo 영상 → 16~20편 조립**: Owner가 `Downloads\스토리 N편\1~n.mp4`로 저장하고 알려 주면 검수 → 조립(`scripts/run-owl-assemble-shorts-v2.mjs`, 스펙 `STORY_EP{N}_ASSEMBLE_SPEC`) → 워터마크 제거 → 오디오 마감 → QA 수정 0 → 커버. 11~15편 기록(`_ai/story-ep11-production-checklist.md` 등)이 같은 순서다.
2. **영상 위 제목(`headerTitle`) 확정**: 5편 모두 임시안.
3. **배경음 청취 확인**: `C:/tmp/money-shorts-os/story-ep{16..20}-bgm/preview/`.
4. **스토리 7편 유튜브 Studio 썸네일 저장**: `Downloads\스토리7편_유튜브썸네일.jpg` → `studio.youtube.com/video/Ae8re-WZ6iU/edit`(Claude in Chrome 확장 연결 시 Claude가 직접).
5. **8·9·10편 배포**(Owner 지시 때만; 일정은 10/13·14·15 하루 한 편 점심 전후): 완성본 `C:/tmp/story-ep8-assembled-v6`·`story-ep9-assembled`·`story-ep10-assembled-v5`, 절차 `_ai/CURRENT_STANDARDS.md` §5, 6·7편 배포 폴더(`C:/tmp/story-ep6-publish`·`story-ep7-publish`)가 템플릿.
6. **21~25편 설계 줄·대본**: 16~20편과 같은 방식. 도구 `_ai/story-pipeline-backup-2026-10-12/tools/grep-page.mjs`(원문 키워드 대조)·`qverify.mjs`(인용문 대조).
7. **10/14 이후 유튜브 반응 재수집**: `instagram-insights-collect`·`youtube-analytics-collect`(래퍼, 읽기 전용) → `node scripts/story-performance-snapshot.mjs`. 7편 ID를 `_ai/story-performance-ids.json`에 추가(IG DeYYsagiP_r, YT Ae8re-WZ6iU).
8. **Owner 판단 대기 항목**: 애플–MS 1997(한국 접점), 오징어게임 수익, 샤넬 오픈런, 17편 이후 귀속 항목(`_ai/story-script-final-ep16-20-2026-10-12.md` §4).

## 4. 파일이 어디 있나 (git ↔ 로컬)

| 구분 | 위치 | git |
|---|---|---|
| 규칙·계획·대본·체크리스트·프롬프트 | `_ai/` | ✅ |
| 어셈블리 스펙·검사기·도구 | `scripts/`, `lib/source-facts/` | ✅ |
| 파이프라인 설정·도구 백업(텍스트) | `_ai/story-pipeline-backup-2026-10-12/` | ✅ |
| 메모리 사본(228개) | `_ai/memory-export-2026-10-12/` | ✅ |
| 음성·배경음·이미지·영상 | `C:/tmp/money-shorts-os/story-ep*-{tts,bgm}/`, `C:/tmp/story-ep*-images/`, `Downloads/` | ❌ (로컬 전용) |
| 소재 검증·설계 | `C:/tmp/story-topic-vetting/`, `C:/tmp/story-ep*/story-design.json` | ❌ (재생성: `story-base-gen.mjs`) |
| 완성본·배포 폴더 | `C:/tmp/story-ep{6,7}-publish/` 등 | ❌ |
| 이전 핸드오프 산출물 | `_handoff/tmp/` (스테이징만 됨, 커밋 제외) | 제외 — 575MB 이미지·QA 기록이라 저장소를 키우지 않기 위해 이번 커밋에서 뺐다(로컬 파일은 그대로) |

다른 PC로 옮기면 ❌ 항목은 없다. 그때는 음성·이미지를 만든 단계(TTS 9회·배경음 5회·ChatGPT 이미지 79장)를 다시 해야 하므로, 같은 PC 계정 전환이면 걱정할 필요가 없다.

## 5. 주의(이번 세션에서 배운 것)

- **검색·WebFetch 요약은 틀린다**: 주체·방향을 바꿔 쓴 사례(제작진 반박 대상, 띠부씰 '예전 그대로', 노숙 등). 사실은 원문 텍스트 대조 후에만 대본에 쓴다.
- **마지막 장면은 9초 안쪽**: 17~20편은 처음 10.8~11.8초라 TTS를 다시 만들었다(문구 63자 이하).
- **유료 호출 합계(이번 세션 이전 제외)**: ElevenLabs TTS 9회·Music 5회. 새 호출은 Owner 승인 후.
- **TTS 장면 수 4~18개**, 장면 음성 10초 초과 금지(Veo 클립 최대 10초).
- **연락 시트**: `System.Drawing`으로 만든 뒤 육안 검수(글자·숫자·로고·얼굴). ffmpeg tile은 순서 문제로 쓰지 않았다.
- **Chrome 확장 연결**: `list_connected_browsers`가 비면 Studio 썸네일은 Owner가 올려야 한다.
- 훅 규칙: 첫 문장에 주인공+상황+걸린 것, 결과·이유는 숨기고, "~가 있었어" 틀·풀이형 금지(CLAUDE.md 맨 위 규칙 참고).
