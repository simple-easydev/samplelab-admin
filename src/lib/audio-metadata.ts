/**
 * Server-side audio metadata extraction via Supabase Edge Function.
 * Extracts BPM and Key from uploaded audio (MP3 ID3, WAV LIST INFO).
 */

import { supabase } from "@/lib/supabase";

export interface ExtractedAudioMetadata {
  bpm: number | null;
  key: string | null;
  error?: string;
}

/**
 * Call the extract-audio-metadata edge function with a public audio URL.
 * Returns BPM and Key when present in file tags (e.g. ID3 for MP3, LIST INFO for WAV).
 */
export async function extractAudioMetadata(
  audioUrl: string
): Promise<ExtractedAudioMetadata> {
  const { data, error } = await supabase.functions.invoke<{
    bpm?: number | null;
    key?: string | null;
    error?: string;
  }>("extract-audio-metadata", {
    body: { url: audioUrl },
  });

  if (error) {
    return {
      bpm: null,
      key: null,
      error: error.message,
    };
  }

  if (data?.error) {
    return {
      bpm: data.bpm ?? null,
      key: data.key ?? null,
      error: data.error,
    };
  }

  return {
    bpm: data?.bpm ?? null,
    key: data?.key ?? null,
  };
}
