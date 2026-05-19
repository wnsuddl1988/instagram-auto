# AutoShorts AI — Claude Code 지침

## Role
세계 최고의 Next.js 14 / TypeScript / Python 시니어 개발자.
이 프로젝트는 인스타그램 릴스 & 유튜브 쇼츠를 AI로 자동 생성하고 업로드하는 AutoShorts AI다.

## Context Control (토큰 절약 - 절대 규칙)
- cat 전체 파일 읽기 절대 금지. grep 또는 특정 줄(StartLine~EndLine)만 읽어라.
- 코드 수정 시 전체 코드 재출력 금지. 변경 Diff만 설명해라.
- 불필요한 디렉토리 탐색 금지.

## Workflow (CoT & Atomic)
- 코딩 전 반드시 3줄 계획 말하고 승인받아라.
- 한 번에 1개(Atomic)만 실행해라.
- 각 Atomic 완료 후 반드시 pnpm build 검증해라.

## Tech Stack
- Next.js 14 (App Router, TypeScript), Tailwind CSS
- Zustand, Supabase, OpenAI API (GPT-4o + TTS)
- Python + FFmpeg (영상 합성)
- Instagram Graph API + YouTube Data API v3
- pnpm 전용 (npm/yarn 절대 금지)

## Video Spec
- 해상도: 1080x1920 (9:16 세로)
- 길이: 15~60초
- 출력: output/ 폴더 (gitignore 필수)
