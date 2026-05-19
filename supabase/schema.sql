-- 생성 이력 테이블
CREATE TABLE IF NOT EXISTS generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_emoji TEXT,
  title TEXT NOT NULL,
  script TEXT NOT NULL,
  hook TEXT,
  call_to_action TEXT,
  hashtags TEXT[],
  image_url TEXT,
  video_path TEXT,
  duration INTEGER DEFAULT 30,
  tone TEXT DEFAULT '정보전달',
  status TEXT DEFAULT 'generated'
    CHECK (status IN ('generated','rendered','uploaded','failed')),
  instagram_post_id TEXT,
  youtube_video_id TEXT,
  view_count INTEGER DEFAULT 0
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_generations_created_at
  ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_category_id
  ON generations(category_id);
CREATE INDEX IF NOT EXISTS idx_generations_status
  ON generations(status);

-- RLS 비활성화 (개인 프로젝트용)
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
