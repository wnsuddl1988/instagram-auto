---
name: feedback-blob-published-retention-cleanup-2026-09-28
description: "★Vercel Blob 매일 자동삭제 등록됨(2026-09-28, Owner 명시승인)★ — 게시완료(인스타+유튜브 둘다) 후 2일 경과 콘텐츠만, 매일 새벽4시 무인 실행"
metadata:
  type: feedback
  originSessionId: 96dabe12-0224-46cf-9034-b0b64d75918f
  modified: 2026-09-28T06:10:51.110Z
---

## 결정
Owner가 Blob 스토어 반복 정지 문제(Hobby 플랜 용량 한도)를 근본적으로 해결하려고
**"게시 끝난 것부터 2일 지나면 자동 삭제"**를 명시적으로 지시했다("이미 올린건
문제없다며" — 배포 완료된 콘텐츠는 Meta/YouTube가 자체 서버로 이미 복사해갔으므로
원본 Blob을 지워도 게시물엔 영향 없다는 전제, 이전 세션에서 이미 확인됨).

**삭제 기준은 "Blob 업로드 시각"이 아니라 "실제 게시 완료 시각"이다** — Claude가
먼저 업로드 시각 기준을 제안했으나, 미배포 재고의 Blob이 실수로 지워질 위험이
있어 Owner에게 재확인 후 게시완료 시각 기준으로 확정했다.

## 구현
- 판정 스크립트: `scripts/run-vercel-blob-published-retention-cleanup.mjs`
  — `C:/tmp/**/owl-instagram-publish-result.json`·`owl-youtube-publish-result.json`을
  스캔해 같은 contentId에 대해 인스타(`PUBLISHED`)+유튜브(`UPLOADED`) **둘 다** 성공
  기록이 있고, 더 늦게 끝난 쪽 기준 `finishedAt`이 N일(기본 2일) 넘게 지난 것만
  대상으로 삼는다. 그 contentId에 해당하는 Blob만 삭제(다른 콘텐츠는 안 건드림).
- no-log 실행기: `scripts/run-owner-blob-retention-cleanup-no-log.mjs`
  (`node scripts/run-owner-blob-retention-cleanup-no-log.mjs --days 2 --confirm-delete`)
- **매일 새벽 4시 자동 실행 스케줄 등록 완료**(taskId: `blob-published-retention-cleanup`,
  cron `0 4 * * *`). `--confirm-delete`를 포함해 실행하므로 **승인 없이 매일 실제
  삭제가 일어난다** — 이 프로젝트의 기본 원칙("삭제는 Owner 승인 필요")의 명시적
  예외로, 이번 건에 한해 Owner가 완전 자동을 선택했다.
- 2026-09-28 최초 실행(수동): dry-run으로 15개 contentId·35개 파일(230.82MB) 확인 후
  Owner 승인 하에 실제 삭제, 35/35 성공.

## Why 이 방식인가
- "업로드 후 N일"이 아니라 "게시완료 후 N일"인 이유: 재고(대본·이미지·영상은
  다 만들었지만 아직 Instagram/YouTube에 올리지 않은 콘텐츠)의 Blob을 지우면
  배포 시점에 처음부터 다시 업로드해야 한다 — 이는 게시완료 여부와 무관하게
  단순 경과일만 보는 방식의 위험이다.
- 인스타+유튜브 "둘 다" 성공을 요구하는 이유: 한쪽만 게시되고 다른 쪽이 실패한
  상태(예: 인스타는 올라갔는데 유튜브 업로드가 막힌 경우)에서 Blob을 지우면
  나머지 플랫폼 재시도가 불가능해진다.

## How to apply
- 이 자동화는 계속 돌아간다. **판정 기준(2일, 둘 다 성공 요구)을 바꾸려면
  Owner에게 먼저 확인**한다 — 스케줄 태스크 프롬프트에도 "인자를 임의로 바꾸지
  말 것"이 명시돼 있다.
- 스케줄 태스크가 매일 알림을 보낸다(`notifyOnCompletion: true`). 알림에서 삭제
  대상이 비정상적으로 많거나(50개 초과) 에러가 난 게 보이면 Owner에게 보고한다.
- 이 삭제는 Blob 원본만 지운다 — 로컬 `C:/tmp/**` 산출물이나 게시된 실제
  Instagram/YouTube 게시물에는 영향이 없다.
- 관련: `_ai/CONTEXT_TRANSFER_CLAUDE.md`의 Blob 정지 경위, [[project_bull_ep6_deploy_2026_09_28]].
