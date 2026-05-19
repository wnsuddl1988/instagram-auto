# n8n Docker 연동 가이드

## 개요
AutoShorts AI를 n8n Docker에서 자동화합니다.
- **매일 3회 자동 실행**: 09:00, 14:00, 20:00
- **자동 기능**: 스크립트 생성 → Supabase 저장 → 인스타그램 업로드 → Discord 알림

---

## 1. 워크플로우 Import

### 1-1. n8n 대시보드 접속
```
http://localhost:5678
```

### 1-2. 워크플로우 Import
1. 좌측 메뉴 → **Workflows**
2. **Import from File** 버튼 클릭
3. `n8n/workflow_autoshorts.json` 선택

---

## 2. 필수 설정 변경

### 2-1. Next.js API 경로 확인
Docker에서 호스트 PC 접근 시:
```
http://host.docker.internal:3000/api/auto
```

> ⚠️ Next.js가 3000이 아닌 다른 포트에서 실행 중이면, 워크플로우의 "🤖 스크립트 자동 생성" 노드 URL을 수정하세요.

### 2-2. API Key 확인
워크플로우 노드들의 Header 설정 확인:
```
x-api-key: autoshorts-secret-2025
```

`.env.local`에 설정된 AUTO_API_KEY와 일치해야 합니다.

---

## 3. Discord 알림 설정 (선택)

### 3-1. Discord 웹훅 생성
1. Discord 서버 설정 → **연동** → **웹훅**
2. **새 웹훅** 생성
3. 웹훅 URL 복사

### 3-2. 워크플로우에 붙여넣기
n8n 워크플로우에서:
- "💬 Discord 알림" 노드 → URL 필드 업데이트
- "❌ 실패 알림" 노드 → URL 필드 업데이트

```
https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

---

## 4. 테스트 실행

### 4-1. 워크플로우 열기
n8n 대시보드 → **AutoShorts AI - 하루 3회 자동화** 클릭

### 4-2. 수동 테스트
1. 우측 상단 **Test workflow** 버튼 클릭
2. "⏰ 하루 3회 스케줄" 노드 → **Execute Node** 클릭
3. 결과 확인:
   - "🤖 스크립트 자동 생성" 노드 결과 확인
   - `success: true` 확인
   - `generationId` 저장됨 확인

### 4-3 트러블슈팅

**401 Unauthorized:**
- `.env.local`의 `AUTO_API_KEY` 확인
- 워크플로우 헤더의 `x-api-key` 값과 일치하는지 확인

**host.docker.internal 오류:**
- Docker 데스크톱 설정 확인
- Windows: 기본 지원
- Mac/Linux: `/etc/hosts`에 `127.0.0.1 host.docker.internal` 추가

**Supabase 저장 실패:**
- `.env.local` NEXT_PUBLIC_SUPABASE_URL/KEY 확인
- API가 여전히 스크립트 반환 (DB 오류는 무시됨)

---

## 5. 활성화

### 5-1. 워크플로우 활성화
워크플로우 상단 토글 → **Active** 변경

### 5-2. 자동 실행 확인
- 매일 09:00, 14:00, 20:00에 자동 실행
- Executions 탭에서 실행 이력 확인

---

## 노드 설명

| 노드 | 설명 |
|------|------|
| ⏰ 하루 3회 스케줄 | 매일 09:00 / 14:00 / 20:00 트리거 |
| 🤖 스크립트 자동 생성 | /api/auto 호출 → 스크립트 생성 |
| ✅ 생성 성공 확인 | 응답 success 필드 확인 |
| 📱 인스타그램 업로드 | /api/upload 호출 → 릴스 업로드 |
| 💬 Discord 알림 | 성공 시 Discord에 알림 |
| ❌ 실패 알림 | 실패 시 에러 메시지 전송 |

---

## 환경 변수

`.env.local`에 필수:
```env
AUTO_API_KEY=autoshorts-secret-2025
INSTAGRAM_BUSINESS_ACCOUNT_ID=xxx
INSTAGRAM_ACCESS_TOKEN=xxx
OPENAI_API_KEY=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

## Docker 컨테이너 실행

```bash
# n8n Docker 실행
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# 또는 docker-compose 사용
docker-compose up -d n8n
```

---

## 문제 해결

**Next.js 앱에 연결할 수 없음:**
```bash
# pnpm dev 실행 (기본 포트 3000)
pnpm dev

# 또는 특정 포트
pnpm dev -- -p 3001
```

**n8n 데이터 초기화:**
```bash
rm -rf ~/.n8n
# 또는 Docker volume 삭제
docker volume prune
```

---

## 참고

- n8n 공식 문서: https://docs.n8n.io
- Instagram Graph API: https://developers.facebook.com/docs/instagram-graph-api
- Discord Webhooks: https://discord.com/developers/docs/resources/webhook
