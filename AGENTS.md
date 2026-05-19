# AutoShorts AI — AGENTS.md

## Project Goal
인스타그램 릴스 & 유튜브 쇼츠를 카테고리 선택만으로 자동 생성 & 배포하는 AI 자동화 프로그램

## 지원 카테고리 (8개)
AI생성활용 / 밈&짤 / 충격뉴스 / TMI지식 / 게임클립 / 재테크팁 / 귀여운동물 / 셀럽엔터

## 폴더 구조
- app/ : Next.js App Router 페이지 & API Routes
- components/ : UI 컴포넌트
- lib/ : 외부 서비스 클라이언트 (OpenAI, Supabase, Instagram, YouTube)
- python/ : 영상 합성 Python 스크립트
- n8n/ : n8n 워크플로우 JSON
- output/ : 생성된 영상 임시 저장 (.gitignore 필수)

## 핵심 규칙
- pnpm만 사용 (npm, yarn 금지)
- 영상 포맷: 1080x1920 (9:16), 15~60초
- pnpm build 무결성 검증 필수
