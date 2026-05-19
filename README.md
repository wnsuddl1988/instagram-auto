# 🎬 AutoShorts AI

> 카테고리 선택 하나로 인스타그램 릴스 & 유튜브 쇼츠를 AI로 자동 생성하는 시스템

## 기능

- 🤖 GPT-4o 스크립트 자동 생성 (8개 카테고리)
- 🖼️ Pexels 배경 이미지 자동 매칭
- 🎙️ OpenAI TTS 음성 자동 생성
- 🎬 FFmpeg 쇼츠 영상 합성 (1080x1920)
- 📱 인스타그램 릴스 자동 업로드
- 🗄️ Supabase 생성 이력 관리
- ⏰ n8n 하루 3회 자동화 스케줄

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React 19
- **Backend**: Next.js API Routes, OpenAI API (GPT-4o + TTS)
- **Video**: Python, FFmpeg (1080x1920 해상도)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (영상 저장)
- **Image**: Pexels API (배경 이미지)
- **Social**: Instagram Graph API
- **Automation**: n8n Docker (3회 일일 스케줄)
- **Package Manager**: pnpm

## 환경변수 설정 (.env.local)

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Pexels
PEXELS_API_KEY=your_pexels_api_key

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id

# API Key for n8n Automation
AUTO_API_KEY=autoshorts-secret-2025
```

## 빠른 시작

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 환경변수 설정
`.env.local` 파일을 만들고 위의 환경변수들을 입력합니다.

### 3. 개발 서버 실행
```bash
pnpm dev
```
브라우저에서 `http://localhost:3000` 접속

### 4. 스크립트 생성
- 카테고리 선택 후 `생성` 버튼 클릭
- AI가 스크립트, 이미지, 음성을 자동 생성

### 5. 영상 합성
- Python으로 FFmpeg을 이용해 쇼츠 형식으로 영상 합성
- `output/` 폴더에 저장됨

### 6. 인스타그램 업로드
- 생성된 영상을 Instagram Graph API로 릴스 업로드
- Supabase에 이력 저장

## n8n 자동화

매일 3회(09:00, 14:00, 20:00 한국시간) 자동으로 실행됩니다.

- 스크립트 자동 생성
- Supabase 저장
- 인스타그램 자동 업로드
- Discord 알림

자세한 설정은 [README_N8N.md](./README_N8N.md) 참고

## API 엔드포인트

### POST /api/auto
스크립트 생성 (n8n에서 자동 호출)

```bash
curl -X POST http://localhost:3000/api/auto \
  -H "x-api-key: autoshorts-secret-2025" \
  -H "Content-Type: application/json" \
  -d '{"duration": 30, "tone": "정보전달"}'
```

### POST /api/upload
인스타그램 업로드 (n8n에서 자동 호출)

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "x-api-key: autoshorts-secret-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "generationId": "xxx",
    "platform": "instagram",
    "title": "제목",
    "caption": "설명",
    "hashtags": ["해시태그"],
    "videoUrl": "https://..."
  }'
```

## 프로젝트 구조

```
app/              # Next.js App Router
├── api/           # API Routes (/api/auto, /api/upload, etc)
└── page.tsx       # 메인 대시보드

components/       # React 컴포넌트
├── CategorySelector.tsx
├── SettingsPanel.tsx
├── ScriptPreview.tsx
└── UploadPanel.tsx

lib/              # 유틸리티 & 클라이언트
├── openai.ts      # GPT-4o + TTS
├── pexels.ts      # 이미지 검색
├── supabase.ts    # DB 클라이언트
├── instagram.ts   # Instagram API
└── categories.ts  # 카테고리 정의

python/           # 영상 합성 스크립트
└── generate_video.py

n8n/              # 자동화 워크플로우
└── workflow_autoshorts.json
```

## 빌드 & 배포

### 로컬 빌드
```bash
pnpm build
pnpm start
```

### Vercel 배포
```bash
pnpm dlx vercel
```

Vercel은 자동으로 다음을 감지합니다:
- `vercel.json` 설정
- Next.js 프레임워크
- API Routes maxDuration (60초)

## 트러블슈팅

### 1. 인스타그램 업로드 실패
- `INSTAGRAM_ACCESS_TOKEN` 만료 확인
- Instagram Business Account ID 확인
- API 호출 한도 초과 확인

### 2. 스크립트 생성 실패
- `OPENAI_API_KEY` 확인
- OpenAI API 크레딧 확인
- 네트워크 연결 확인

### 3. n8n 자동화 미작동
- n8n Docker가 실행 중인지 확인
- `host.docker.internal:3000` 연결 확인
- `AUTO_API_KEY` 값 확인

자세한 설정은 [README_N8N.md](./README_N8N.md) 참고

## 라이선스

Copyright © 2026 AutoShorts AI. All rights reserved.
