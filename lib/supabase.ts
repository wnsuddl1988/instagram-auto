import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

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
