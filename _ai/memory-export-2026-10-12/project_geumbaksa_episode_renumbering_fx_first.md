---
name: project-geumbaksa-episode-renumbering-fx-first
description: "금박사 환율편이 실질적 1편으로 신설, 기존 IRP/ETF/레버리지 편이 2/3/4편으로 밀림(2026-09-20)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 622d3477-873d-4163-815e-7f07e9df42b5
  modified: 2026-09-19T23:19:56.136Z
---

부엉이 5편(한국은행 기준금리 3.00%, 11월 추가 인상 유력 — 환율 1,380원 돌파·국고채 4.06%·변동금리 대출 부담 포함) 배포에 맞춰, 금박사 신규 편을 **환율**("원달러 환율이 오르면 왜 금리 인상 압력까지 이어질까") 소재로 만들어 실질적 1편으로 배포하기로 확정. 오전에 금박사 환율편 배포, 오후에 부엉이 5편 배포 순서다.

이에 따라 기존에 만들어 둔 편들이 배포 번호 기준으로 한 칸씩 밀린다:
- (신규) 환율편 → **1편**
- 기존 1편(IRP, [[project_geumbaksa_character_and_operating_principles]]) → **2편**
- 기존 2편(ETF 기초) → **3편**
- 기존 3편(레버리지, 영상 제작 중이던 편) → **4편**

**Why:** Owner가 코픽스·국고채보다 환율을 원래 생각하고 있었고([[feedback_geumbaksa_scope_not_etf_investing_only]] 정정과 함께), 환율이 난이도·부엉이 5편 연결성·시청자 체감 폭에서 가장 적합하다고 판단해 이걸 첫 편으로 세우기로 함. 파일이 이미 여러 개 만들어진 상태라 실제 rename 대신 표시 번호만 바꾸는 방식을 Owner가 선택함.

**How to apply:**
- 파일명·폴더명(`_geumbaksa-assembly-spec.mjs`=IRP, `_geumbaksa-ep2-assembly-spec.mjs`=ETF, `_geumbaksa-ep3-assembly-spec.mjs`=레버리지, `C:/tmp/geumbaksa-ep2-*`, `C:/tmp/geumbaksa-ep3-*` 등)는 그대로 둔다. **rename 금지** — 참조 경로가 많아 깨질 위험.
- 각 스펙 파일 상단 주석에 실제 배포 편수를 이미 기록해 뒀다(2026-09-20). 새 파일을 만들 때도 이 매핑을 참고해 배포용 캡션·헤더 타이틀·게시 순서를 정할 것.
- 신규 환율편을 위한 스펙 파일은 아직 없음 — 다음 작업은 `_geumbaksa-ep4-assembly-spec.mjs`(파일명 규칙상 다음 순번) 또는 별도 이름으로 환율편 스펙을 신설하되, 상단 주석에 "실제 배포 편수는 1편"이라고 명시해야 함.
- 카드뉴스도 동일 매핑: `_geumbaksa-cardnews-ep1-spec.mjs`(IRP)=배포2편, `_geumbaksa-cardnews-ep2-spec.mjs`(ETF)=배포3편.

관련: [금박사 캐릭터+운영원칙](project_geumbaksa_character_and_operating_principles.md), [금박사 범위는 ETF·투자 한정 아님](feedback_geumbaksa_scope_not_etf_investing_only.md).
