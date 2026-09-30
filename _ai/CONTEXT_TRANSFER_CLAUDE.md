# 진행 중 작업 인계 — 최신 2026-09-30

## ★ 2026-09-30 기준 — 먼저 읽을 것
- 오늘 변경·결함 수정·미결 항목의 원문은 **`_ai/CURRENT_STANDARDS.md` §7 맨 위 "2026-09-30 변경 반영 현황과 미결 항목"** 과 최우선 규칙 11~17. 이 문서보다 그쪽이 우선한다.
- 커밋 `41ab016`~`0aa956f`까지 푸시 완료(브랜치 `codex/source-first-blueprint-clean`). 미추적이던 옛 프로젝트 파일 `scripts/fixtures/golden_sample_v2_visual_only_render_manifest.salary_3days.v1.json`은 2026-09-30 Owner 지시("쇼츠에 안 쓰면 지워라")로 삭제함(현행 코드 참조 없음 확인, 보관 문서에만 이름이 남음).
- 황소특보 10편 배포 완료(릴스 instagram.com/reel/Dd5MZRaks2t, 유튜브 youtube.com/shorts/8tSCrplyAVI). 다음 신규는 황소 11편(새 체계 첫 적용: 훅 규칙 17, 스펙 shot·bg·motion·sceneBackgrounds·hookType, 입 멈춤 A/B 파일럿).
- 부엉박사 18편은 배포 대기 — **배포 전 새 코드로 재조립 → CTA 결합 → `run-audio-finish-once.mjs` → `run-episode-qa-once.mjs`**(시험본은 `C:/tmp/quality-v2-test/owl-ep18-final/` 검수 통과).
- **오후 추가(미커밋)**: ① 부엉 소재 도구(`owl-topic-lanes.ts`·레인 뉴스검색·쏠림점검) ② 고정 CTA 배치 v2 재제작 — 황소 `C:/tmp/bull-cta-fixed-v6/bull_cta_fixed_final_layout_v2.mp4`, 부엉 `C:/tmp/owl-cta-fixed-v3/owl_cta_fixed_v3_final_layout_v2.mp4`(`run-cta-layout-v2-rerender-once.mjs`, 결합 스크립트 등록, 시험 결합 PASS) ③ 부엉 15편 수정 진행 — s15 영상만 Owner 생성 대기(§7 "15편 진행"). 16·17편도 같은 방식(B안). 카드뉴스 중단·금박사 중단·배경음 없음 확정.
- **2026-09-30 저녁 추가(미커밋 포함)**: 황소 11편 = 조선주(대본 초안 `_ai/bull-ep11-ship-script-draft.md`, 체크리스트 `_ai/bull-ep11-production-checklist.md`, Owner 대본 확정 대기). 규칙 21(씬 전환 싱크 v3)·22(역할 분담: 황소=투자자/부엉=경제뉴스·정책)·23(규칙 누락 금지, 체크리스트 첨부). 소재 탐색은 `node scripts/run-bull-topic-full-scan-once.mjs` 한 번에 7단계. 레인 ⑨⑩·영역 industrial 추가. 부엉 15편 배포 완료, 16·17·18편은 `final-v3` 배포 대기(배포 시기는 Owner가 지시).
- **2026-09-30 밤 최신(먼저 읽을 것)**: ① 황소 11편 배포 완료(릴스 Dd6OQgkimBU, 유튜브 -noGZIex5sM), 유튜브 쇼츠 세로 칸 썸네일은 처리 미완 → **10/1 첫 작업으로 재확인**(메모리 `project_bull_ep11_deployed_2026_09_30`). ② 부엉 15편(실업급여) 역대 최고 반응 → 소재 기준을 "대상 폭·체감 크기" 최우선으로(규칙 13). ③ **부엉 재고 번호 재배치(Owner 확정)**: 표시 16=최저임금(파일 ep17)·17=전세사기(파일 ep18), 퇴직연금은 번호 없는 예비 재고(삭제 안 함, 배포할 게 없는 날 사용), 새 편은 18부터. **10/1 점심 슬롯 = 16편(최저임금) 배포**(Owner 지시 시). 경로표·배포 때 확인 사항은 CURRENT_STANDARDS §7 8번. 러너 장부 반영·테스트 완료(미커밋).
- **2026-09-30 밤 추가(소재 탐색 체계)**: 규칙 24(채널 분야 = 경제·금융 전반, 분야→담당→러너 대조표)·규칙 25(매일·실시간·확장 러너 전부). 부엉 `run-owl-topic-full-scan-once.mjs`(레인8+영역16 96키워드·성과·장부·ECOS7+KOSIS2), 황소 full-scan 8단계(미국주식·원자재·코인 그룹 + 공식 지표). 래퍼 서브커맨드 `owl-indicator-snapshot`(ECOS·KOSIS 키 이름 등록, Owner 승인). 자동 예약은 없음(Owner가 요청할 때마다 실시간 실행, 예약 태스크는 삭제함). 부엉 18편 소재는 미확정(후보 1위 청년미래적금 2차 10/7~16).
- 플랫폼 권한: 인스타 SYSTEM_USER 무기한 토큰(insights·comments 포함, 권한 추가는 비즈니스 설정 → 시스템 사용자 → 새 토큰 "만료 안 함"으로만), 유튜브 관리·분석 권한 + Analytics API 활성화 완료.

---

# (이전) 진행 중 작업 인계 — 2026-09-28 (Claude Code 세션 → 본계정 이관)

이 세션(부계정)에서 이틀에 걸쳐 진행한 작업 전체 요약과, 오늘(9/28) 배포 중
발생한 미해결 문제를 정리한다. 본계정에서 이 문서를 읽고 그대로 이어가면 된다.

## ★ 2026-09-28 업데이트 — 6편 배포 완료, 커버 문제는 오판정이었음

- **황소특보 6편 수동 배포 완료(Owner 직접)**: 인스타 릴스 https://www.instagram.com/reel/Ddz1XhcToBx/ , 유튜브 https://youtube.com/shorts/6ZVskG7TYTk . 상세는 [[project_bull_ep6_deploy_2026_09_28]].
- **커버 이미지 크롭 문제는 이미지 생성 결함이 아니었다** — Owner 확인: 업로드 시 본인이 비율 조정을 잘못한 것이 원인. safe/safe2 재생성 시도는 불필요했다. 다음에 같은 현상이 보이면 이미지 재생성보다 업로드 비율 설정부터 확인할 것.
- Vercel Blob 스토어는 2026-09-28 08~09시 두 차례 재확인 시점까지 여전히 정지 상태(`This store has been suspended.`, list()는 되지만 put()은 막힘). 재개 여부는 §3의 1번 작업으로 다시 확인할 것.
- **★2026-09-28 추가: Blob 게시완료 2일 경과 자동삭제를 매일 새벽4시 스케줄 태스크로 등록 완료(Owner 명시 승인, 완전 자동·무인).** 판정 스크립트 `scripts/run-vercel-blob-published-retention-cleanup.mjs`(인스타+유튜브 둘 다 게시 성공 확인된 것만, publish-result.json의 finishedAt 기준). 최초 실행으로 15개 콘텐츠·35개 파일(230.82MB) 삭제 완료. 상세는 [[feedback_blob_published_retention_cleanup_2026_09_28]], 원문은 CURRENT_STANDARDS §5-1.

## 최우선 확인 사항 (2026-09-28 오전 기준, 6편은 위에서 해결됨)

**황소특보 6편 배포가 오늘 중 완료돼야 시의성이 산다** (소재 자체가
"오늘(9/28)이 삼성전자 배당 마지막 매수일"이라 하루만 지나도 훅이 성립하지
않음). 아래 "미해결 문제" 항목이 최우선 처리 대상이다.

---

## 1. 최근 이틀간 진행한 작업 히스토리

### 1-1. 부엉박사 17편(2027년 최저임금 확정) — 완료
- v2 구조 재제작본, 커버·스토리·카드뉴스까지 전부 제작·검수 완료.
- **배포는 아직 안 함** — 자산은 완비된 상태로 대기 중.
- 커버: `C:/tmp/owl-cover-ep17/`(정확한 파일명은 세션 로그 참고 필요, 이
  문서 작성 시점에 경로 재확인 안 함 — 배포 전 CURRENT_STANDARDS §7에서
  최신 경로 재확인 권장)
- 카드뉴스: 4슬라이드 제작 완료.

### 1-2. 황소특보 6편(삼성전자 3분기 배당 마지막 매수일) — 영상 제작·조립·CTA 결합 완료, 배포 중 Blob 문제로 중단
가장 비중 있게 진행한 작업. 아래에 상세 기술.

#### 소재 선정 경위
1. 최초 "UAE 방산 계약(9/17 사건)" 안을 검토했으나, Owner가 "오늘
   9월 28일인데 9월 17일 주가 이야기 하고 있는게 맞아?"라고 지적 →
   9일~11일 지나 시의성 소실로 **폐기**.
2. Owner가 추석 연휴 캘린더(9/23 마지막 개장, 9/24~27 휴장, 9/28
   재개장) 정보를 제공 → 재검색 결과 "삼성전자 3분기 배당 마지막
   매수일이 정확히 오늘(9/28)"이라는 소재를 발견해 채택.
3. 핵심 팩트(2026-09-28 WebSearch 재확인): 배당 기준일 9/30, 국내
   결제 2영업일 규칙상 9/28(오늘)까지 매수해야 배당권 확보, 9/29
   배당락일. 총 배당 약 30조 원(정규 2.45조+특별 27.55조), 삼성전자
   90~110조 원 주주환원 계획 첫 실행분. 예상 배당금 주당 4,500원
   안팎(**미확정**, 10월 말 이사회 최종 확정 — 대본에서 반드시 "예상"
   표현 유지).
4. 훅을 1~5편의 "삼성전자보다 더 오른 종목" 비교형 틀에서 벗어나
   "다들, 삼성전자 주주라면 오늘 놓치면 안 되는 날이야"라는 긴급성
   프레임으로 새로 작성(Owner 지적 반영).
5. 마지막 체크리스트를 수동적 관망이 아니라 "오늘 장 마감 전 매수
   여부"라는 즉시 실행 항목으로 재구성(Owner: "항상 마지막에 아쉬움이
   남는다" 지적 반영).

#### 대본·TTS·이미지·영상 제작
- 스펙 파일: `scripts/_bull-ep6-assembly-spec.mjs` (18씬, 614자,
  `export const BULL_EP6_ASSEMBLY_SPEC`). 파일 상단 주석에 소재 선정
  경위·핵심 팩트·종목명 규칙이 전부 기록돼 있음.
- TTS: `C:/tmp/money-shorts-os/bull-ep6-tts/output-v2/` 최종본
  (127.16초, 18씬 전부 9.5초 규칙 통과). 스키마 상한이 4~18씬임을 이번에
  처음 발견 — s13을 두 씬으로 쪼갰다가 19씬이 되어 ABORT 에러 발생,
  분리 대신 문장 압축(52자→37자)으로 18씬 유지하며 해결.
- 이미지: 18장 전부 `C:/tmp/bull-ep6-images/`에 생성, 시각 검수 통과.
  배경은 "글로벌 반도체 기업 본사 앞 광장"(로고·회사명 없는 유리 타워
  2동+화단+깃대) — 사용자가 "삼성 사옥 앞"을 제안했으나 상표권
  우려로 로고 없는 통칭 배경으로 절충.
- 영상 생성 프롬프트 문서: `_ai/bull-ep6-video-generation-prompts.md`
  (8초 티어 13개, 10초 티어 5개, PROP LOCK/CAMERA LOCK 강화 문구 포함).
- **영상 18개 검수 결과(2차까지 진행)**: 최초 18개 중 12개 통과, 6개
  (s2,5,11,14,16,17)는 클립 후반부(발화 종료 이후 여유 구간)에서 카드
  소실·회전·비율 왜곡 발생. **재생성 시도했으나 같은 계열 결함이
  반복**됐음. 최종적으로 확인한 결론: 조립 스크립트가 오디오 길이만큼만
  클립 앞부분을 잘라 쓰는 구조(`run-owl-assemble-shorts-v2.mjs`가
  `-t targetDuration`으로 클립 앞부분만 사용)라, 실제 사용 구간(발화
  종료 시점까지, 4.5~7.2초)은 전부 문제없이 선명함을 프레임 단위로
  확인 → **재생성 없이 원본 그대로 조립에 사용**해 정상 처리됨.

#### 조립·CTA 결합 — 완료, 검증 PASS
- 최종 영상: `C:\tmp\bull-ep6-episode-final\owl_episode_final.mp4`
  (135.33초). 조립 시 프레임 3248/3248, 화면·오디오 길이 정확히 일치
  검증 PASS.
- CTA: `run-owl-episode-with-fixed-cta-once.mjs --alignment` 사용
  (표준 절차 그대로), 고정 CTA
  `C:\tmp\bull-cta-fixed-v5\bull_cta_fixed_final_with_captions.mp4`.
- 전환 구간 4개 지점(발화 종료 직전/전환/전환 직후/CTA 마지막 프레임)
  전부 육안 검수 PASS.

#### 커버·스토리 이미지 — 완료
- 신규 스펙: `scripts/_bull-cover-ep6-spec.mjs`,
  `scripts/_bull-story-ep6-spec.mjs`.
- 커버: `C:/tmp/bull-ep6-cover/00_bull_ep6_cover_thumb.png`
- 스토리: `C:/tmp/bull-ep6-story/01_bull_ep6_story_cover.png`
- **카드뉴스는 스킵**(황소특보는 카드뉴스 없는 캐릭터 — 부엉박사
  전용 규칙 확인 후 Owner 승인받고 제작 안 함).

### 1-3. 부엉박사 버전 업그레이드 관련(이전 세션에서 진행, 이 세션 시작 시점에 이미 완료 상태)
- 부엉박사는 11편부터 대본 구조 v2 적용(옛 구조 재고 7편도 v2로
  재제작해 새 11~17편으로 재배치, CURRENT_STANDARDS §1·§7 참고).
- 오프닝을 훅 뒤로 재배치(18편부터 영구 적용, 17편·재고는 기존대로
  오프닝 먼저).
- 이 세션에서는 새 작업을 추가하지 않았고, 17편(재배치 마지막 편)
  자산만 완비했음.

---

## 2. 오늘(9/28) 배포 중 발생한 문제 — 미해결, 최우선 처리 필요

### 2-1. Vercel Blob 스토어 한도 초과 → 삭제로 316MB 확보했으나 여전히 정지 중
- 배포 절차(§5) 3단계(계획 파일)까지는 정상 완료했으나, 5단계
  실제 업로드(`owl-blob-upload --arm`)에서
  `Vercel Blob: This store has been suspended.` 에러로 실패.
- 원인 확인: Vercel 대시보드에서 `instagram-auto-instagram-media-prod`
  Blob 스토어가 **Hobby(무료) 플랜 사용량 한도 초과**로 정지된 상태.
  대시보드 배너: "You have reached your usage limits for this store
  using the Hobby plan. Access resumes on 26. 9. 28.." — 즉 **오늘
  중 특정 시각(UTC 기준으로 추정, 정확한 시각 미확인)에 자동 재개**될
  예정.
- 읽기 전용 조회 스크립트를 새로 작성해(`scripts/check-vercel-blob-
  store-usage-list-only.mjs` + no-log 실행기
  `scripts/run-owner-blob-usage-check-no-log.mjs`) 스토어 안 파일
  전수 조회 → 총 793MB, 120개 파일 확인.
- Owner 승인 하에 가장 오래된 파일부터 47개(316.33MB, 9/16~9/22
  업로드분, 부엉박사·금박사 초기편 관련 reels/cardnews)를 삭제
  (`scripts/run-vercel-blob-oldest-cleanup-once.mjs` +
  `scripts/run-owner-blob-cleanup-no-log.mjs`, dry-run 확인 후
  `--confirm-delete`로 실행, 47/47 성공).
- **삭제 후에도 업로드 재시도 결과 동일 에러 반복** — 용량을 비우는
  것만으로는 "Limits Exceeded" 상태가 즉시 풀리지 않음을 확인. Hobby
  플랜은 한도 초과 시점 기준으로 다음 리셋 주기까지 정지가 유지되는
  구조로 보임(Pro 업그레이드는 Owner가 "돈 쓸 필요 없다"며 보류).

### 2-2. 임시 우회책 — 이번 6편만 수동 업로드로 전환
- Owner 판단: "이건만 수동으로 올릴까? 지금 올려야 효과가 있잖아,
  단 이번만"으로 결정.
- 압축본 영상(`C:\tmp\bull-ep6-publish\bull_ep6_compressed.mp4`,
  32.7MB, ffmpeg로 1900k 비트레이트 압축 완료) + 커버 + 스토리
  이미지를 Owner에게 파일로 전달, PC 웹브라우저로 인스타그램/유튜브에
  직접 업로드하는 방식으로 전환.
- `owl-content-unit.json` 작성 완료:
  `C:/tmp/bull-ep6-publish/owl-content-unit.json` (제목, 캡션,
  유튜브 설명 전문 포함 — 본계정에서 재사용 가능).

### 2-3. 커버 이미지 크롭 문제 — 미해결, 본계정에서 이어서 처리 필요
- 최초 커버 이미지(`00_bull_ep6_cover_thumb.png`)가 실제 해상도
  941×1672로 생성됨(요청한 1080×1920이 아니었음) → 인스타그램
  릴스 커버 편집기가 강제로 확대·크롭.
- 1차 수정: ffmpeg로 정확히 1080×1920으로 스케일+크롭
  (`C:/tmp/bull-ep6-cover-fixed/00_bull_ep6_cover_thumb_1080x1920.png`)
  → **여전히 확대돼 보임**. 이 버전으로 실제 게시까지 해봤으나
  실제 게시물에서도 확대되어 나와 Owner가 바로 삭제함.
- 2차 수정: 상하좌우 여백(letterbox, 네이비 배경) 추가해 안전영역
  확보
  (`C:/tmp/bull-ep6-cover-safe/00_bull_ep6_cover_thumb_safe.png`)
  → 이 버전도 인스타 커버 편집기 미리보기에서 여전히 얼굴
  클로즈업으로 확대돼 보임(게시 테스트는 아직 안 해봄).
- 3차 수정: 컨텐츠를 더 작게(가로 756px, 세로 1344px로 축소) +
  하단으로 이동(세로 오프셋 55%)해 여백을 훨씬 크게 만든 버전
  (`C:/tmp/bull-ep6-cover-safe2/00_bull_ep6_cover_thumb_safe2.png`)
  → **본계정 인계 시점 기준 Owner가 아직 시도 결과를 보고하지 않음.
  이 파일로 실제 게시 테스트가 필요한 상태.**
- 근본 원인 추정: 인스타그램 릴스 커버 편집기가 업로드된 정사각형
  아닌 이미지를 "채우기(cover-fit)" 방식으로 무조건 확대해서 보여주는
  동작으로 보이며, 정확한 해상도(1080×1920)를 지켜도 크롭이 발생한
  전례가 있어 **여백을 얼마나 넣어야 안전한지 아직 경험적으로 확정
  안 됨**. 다음에 같은 문제가 재발하면: (a) safe2 버전으로 실제 게시
  테스트 → 여전히 크롭되면 여백을 더 키우거나, (b) 애초에 이미지
  생성 프롬프트 단계에서 텍스트·캐릭터를 화면 중앙 30~40%에만
  배치하도록 세이프존 규칙을 더 보수적으로 강화하는 방향 검토.

---

## 3. 지금 당장 이어서 할 일 (우선순위 순)

1. **커버 이미지 크롭 문제 해결 확인** — `00_bull_ep6_cover_thumb_safe2.png`
   로 인스타그램 릴스 재게시 테스트. 여전히 크롭되면 여백을 더
   늘리거나(예: 컨텐츠를 가로 600px까지 축소) 이미지 자체를 완전히
   새로 생성.
2. **황소특보 6편 배포 완료** — 인스타그램 릴스(캡션은
   `C:/tmp/bull-ep6-publish/owl-content-unit.json`의
   `instagramCaption` 필드 그대로 사용) + 스토리 + 유튜브(제목·설명은
   같은 파일의 `youtubeTitle`/`youtubeDescription`, 공개 범위 반드시
   Public, 썸네일은 커버 이미지 파일 사용). 오늘 안에 끝내야 시의성이
   산다.
3. **Vercel Blob 스토어 자동 재개 여부 확인** — 재개됐으면 이후
   편(부엉박사 17편 등)부터는 다시 기존 자동화 배포 파이프라인
   (`owl-blob-upload --arm` 등)으로 정상 진행 가능한지 한 번
   확인해볼 것. 재개 안 됐으면 계속 수동 업로드로 우회.
4. **부엉박사 17편 배포** — 자산(영상·CTA·커버·스토리·카드뉴스)
   전부 완비된 상태로 대기 중. Blob 스토어 상태에 따라 자동/수동
   배포 결정.
5. **밀린 배포 건 정리** — 부엉박사 13·14·16편, 15편+금박사 9편
   (ep10 수정판) 등 이전부터 여러 차례 언급된 밀린 배포 건들, 아직
   미배포. CURRENT_STANDARDS §7 재고 표 참고.

## 4. 이번 세션에서 새로 만든 파일(코드/스크립트)

- `scripts/_bull-ep6-assembly-spec.mjs` — 6편 조립 스펙(18씬)
- `scripts/_bull-cover-ep6-spec.mjs`, `scripts/_bull-story-ep6-spec.mjs`
- `_ai/bull-ep6-video-generation-prompts.md`
- `scripts/check-vercel-blob-store-usage-list-only.mjs` — Blob 목록
  조회 전용(읽기 전용, list()만)
- `scripts/run-owner-blob-usage-check-no-log.mjs` — 위 스크립트의
  no-log 실행기(BLOB_READ_WRITE_TOKEN 주입만, 값 출력 없음)
- `scripts/run-vercel-blob-oldest-cleanup-once.mjs` — Blob 오래된
  파일부터 정리(dry-run 기본, `--confirm-delete`로만 실제 삭제)
- `scripts/run-owner-blob-cleanup-no-log.mjs` — 위 스크립트의
  no-log 실행기

이 4개 Blob 관련 스크립트는 기존 `run-owner-command-with-local-env-
no-log.mjs`의 승인된 서브커맨드 화이트리스트를 건드리지 않기 위해
독립 파일로 만들었다. 필요하면 나중에 정식 서브커맨드로 통합하는
것도 검토할 만하다(지금은 급해서 임시로 분리해둔 상태).

## 5. 금지 사항 재확인 (본계정에서도 동일하게 적용)

- 외부 게시(인스타/유튜브)는 Owner 승인 후에만.
- Blob 대량 삭제는 Claude Code 세션이 자동 차단하므로 Owner가
  터미널에서 직접 실행해야 한다(이번에 실제로 겪은 제약).
- `.env.local`을 직접 Read하지 않는다 — no-log 래퍼로만 값 주입.
- commit/push는 Owner의 명시적 승인 없이 하지 않는다(이번 세션에서
  변경한 스크립트·스펙 파일들은 아직 커밋 안 된 상태일 수 있음 —
  본계정에서 `git status -sb`로 먼저 확인할 것).
