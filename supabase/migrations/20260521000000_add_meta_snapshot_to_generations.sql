-- Migration: add meta_snapshot jsonb column to generations
-- Created: 2026-05-21
-- Purpose: 콘티 생성 컨텍스트(카테고리/소주제/운영프리셋/주제모드 등)를 generations 행에 함께 저장
--          /history 페이지에서 두 이력 소스(Supabase + localStorage)를 통합 표시할 때 활용
--
-- 적용 방법:
--   Supabase Dashboard > SQL Editor에 이 파일 내용을 붙여넣고 실행하거나,
--   Supabase CLI: supabase db push (로컬 supabase 환경 설정 후)
--
-- 롤백:
--   ALTER TABLE generations DROP COLUMN IF EXISTS meta_snapshot;

ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS meta_snapshot JSONB;

-- 선택적 인덱스: accountPresetName 기준 빠른 조회가 필요하면 활성화
-- CREATE INDEX IF NOT EXISTS idx_generations_meta_preset
--   ON generations ((meta_snapshot->>'accountPresetName'));

COMMENT ON COLUMN generations.meta_snapshot IS
  '콘티 생성 컨텍스트 스냅샷. 예: {"categoryId":"emotional-stories","categoryName":"감동사연","subTopicId":"parents-children","subTopicName":"부모/자녀","topicMode":"custom","concreteTopic":"...","customTopic":"...","accountPresetId":"...","accountPresetName":"..."}';
