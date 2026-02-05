/**
 * Audio Upload Utilities for Supabase Storage
 * Handles uploading audio files, covers, and stems to Supabase
 */

import { supabase } from "@/lib/supabase";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface AudioUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload an audio file to Supabase Storage
 * @param file The audio file to upload
 * @param folder Optional subfolder (e.g., 'samples', 'stems')
 * @param onProgress Optional callback for upload progress
 * @returns Upload result with URL or error
 */
export async function uploadAudioFile(
  file: File,
  folder: string = "samples",
  onProgress?: (progress: UploadProgress) => void
): Promise<AudioUploadResult> {
  try {
    // Validate file type
    const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3)$/i)) {
      return {
        success: false,
        error: "Invalid file type. Only WAV and MP3 files are allowed.",
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("audio-samples")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("audio-samples")
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error("Unexpected upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Upload multiple audio files (for stems)
 * @param files Array of audio files
 * @param folder Subfolder name
 * @returns Array of upload results
 */
export async function uploadMultipleAudioFiles(
  files: File[],
  folder: string = "stems"
): Promise<AudioUploadResult[]> {
  const uploadPromises = files.map((file) => uploadAudioFile(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Upload a pack cover image
 * @param file The image file
 * @returns Upload result with URL or error
 */
export async function uploadPackCover(file: File): Promise<AudioUploadResult> {
  try {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPG, PNG, and WebP images are allowed.",
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size exceeds 10MB limit.",
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("pack-covers")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Cover upload error:", error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("pack-covers")
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error("Unexpected cover upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete a file from storage
 * @param bucket The storage bucket name
 * @param path The file path
 * @returns Success status
 */
export async function deleteStorageFile(
  bucket: "audio-samples" | "pack-covers",
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Create a new pack with samples
 * @param packData Pack metadata
 * @param samples Sample data array
 * @returns Created pack ID or error
 */
export async function createPackWithSamples(
  packData: {
    name: string;
    description?: string;
    creator_id: string;
    cover_url?: string;
    category_id?: string;
    tags?: string[];
    is_premium: boolean;
    status: "Draft" | "Published";
    genres: string[]; // genre IDs
  },
  samples: {
    name: string;
    audio_url: string;
    bpm?: number;
    key?: string;
    type: "Loop" | "One-shot"; // NOTE: 'Stem' is NOT a sample type - stems are bundles attached to samples
    length?: string;
    file_size_bytes?: number;
    credit_cost?: number; // Cost for the parent sample (excludes stems bundle cost)
    has_stems: boolean; // If true, stems array should contain stem files
    stems?: { name: string; audio_url: string; file_size_bytes?: number }[]; // Stem bundle files (0-N files)
  }[]
): Promise<{ success: boolean; packId?: string; error?: string }> {
  try {
    // 1. Create the pack
    const { data: pack, error: packError } = await supabase
      .from("packs")
      .insert({
        name: packData.name,
        description: packData.description,
        creator_id: packData.creator_id,
        cover_url: packData.cover_url,
        category_id: packData.category_id,
        tags: packData.tags,
        is_premium: packData.is_premium,
        status: packData.status,
      })
      .select()
      .single();

    if (packError) {
      console.error("Pack creation error:", packError);
      return { success: false, error: packError.message };
    }

    const packId = pack.id;

    // 2. Link genres to pack
    if (packData.genres.length > 0) {
      const genreLinks = packData.genres.map((genreId) => ({
        pack_id: packId,
        genre_id: genreId,
      }));

      const { error: genreError } = await supabase
        .from("pack_genres")
        .insert(genreLinks);

      if (genreError) {
        console.error("Genre linking error:", genreError);
        // Non-critical, continue
      }
    }

    // 3. Create samples
    for (const sample of samples) {
      const { data: createdSample, error: sampleError } = await supabase
        .from("samples")
        .insert({
          pack_id: packId,
          name: sample.name,
          audio_url: sample.audio_url,
          bpm: sample.bpm,
          key: sample.key,
          type: sample.type,
          length: sample.length,
          file_size_bytes: sample.file_size_bytes,
          credit_cost: sample.credit_cost,
          has_stems: sample.has_stems,
          status: "Active",
        })
        .select()
        .single();

      if (sampleError) {
        console.error("Sample creation error:", sampleError);
        continue; // Skip this sample
      }

      // 4. Create stems if any
      if (sample.has_stems && sample.stems && sample.stems.length > 0) {
        const stemData = sample.stems.map((stem) => ({
          sample_id: createdSample.id,
          name: stem.name,
          audio_url: stem.audio_url,
          file_size_bytes: stem.file_size_bytes,
        }));

        const { error: stemError } = await supabase
          .from("stems")
          .insert(stemData);

        if (stemError) {
          console.error("Stem creation error:", stemError);
          // Non-critical, continue
        }
      }
    }

    return { success: true, packId };
  } catch (error) {
    console.error("Unexpected error creating pack:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get list of creators for dropdown
 */
export async function getCreators() {
  const { data, error } = await supabase
    .from("creators")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching creators:", error);
    return [];
  }

  return data || [];
}

/**
 * Get list of genres for dropdown
 */
export async function getGenres() {
  const { data, error } = await supabase
    .from("genres")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching genres:", error);
    return [];
  }

  return data || [];
}

/**
 * Get list of categories for dropdown
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data || [];
}
