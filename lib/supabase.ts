import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

/** generations.meta_snapshot 컬럼에 저장할 경량 컨텍스트 스냅샷 */
export interface GenerationMetaSnapshot {
  categoryId?: string;
  categoryName?: string;
  subTopicId?: string;
  subTopicName?: string;
  topicMode?: "preset" | "custom" | "random";
  concreteTopic?: string;
  customTopic?: string;
  accountPresetId?: string;
  accountPresetName?: string;
}

export interface Generation {
  id?: string;
  created_at?: string;
  category_id: string;
  category_name: string;
  category_emoji?: string;
  title: string;
  script: string;
  hook?: string;
  call_to_action?: string;
  hashtags?: string[];
  image_url?: string;
  video_path?: string;
  duration?: number;
  tone?: string;
  status?: "generated" | "rendered" | "uploaded" | "failed";
  instagram_post_id?: string;
  youtube_video_id?: string;
  view_count?: number;
  /** 콘티 생성 컨텍스트 스냅샷 — DB 컬럼 추가 후 활성화 (null-safe) */
  meta_snapshot?: GenerationMetaSnapshot | null;
}

export async function saveGeneration(data: Generation) {
  const { data: result, error } = await supabase
    .from("generations")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * video_path 기준으로 기존 row가 있으면 update, 없으면 insert.
 * partial retry 중복 저장 방지용.
 */
export async function saveOrUpdateGeneration(data: Generation) {
  const videoPath = data.video_path;

  // video_path가 없으면 일반 insert로 폴백
  if (!videoPath) {
    return saveGeneration(data);
  }

  // 기존 row 조회
  const { data: existing, error: selectError } = await supabase
    .from("generations")
    .select("id")
    .eq("video_path", videoPath)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing?.id) {
    // 기존 row 있음 → update (id/created_at 제외)
    const { id: _id, created_at: _ca, ...updateFields } = data;
    const { data: updated, error: updateError } = await supabase
      .from("generations")
      .update(updateFields)
      .eq("id", existing.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return updated;
  }

  // 기존 row 없음 → insert
  const { data: result, error: insertError } = await supabase
    .from("generations")
    .insert(data)
    .select()
    .single();
  if (insertError) throw insertError;
  return result;
}

export async function getGenerations(limit = 20) {
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Generation[];
}

export async function updateGenerationStatus(
  id: string,
  status: Generation["status"],
  extra?: Partial<Generation>
) {
  const { error } = await supabase
    .from("generations")
    .update({ status, ...extra })
    .eq("id", id);
  if (error) throw error;
}
