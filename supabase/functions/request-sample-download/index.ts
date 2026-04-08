/**
 * Authenticated sample full-audio download: debit credits (via RPC) + short-lived signed URL.
 * Invoke with: supabase.functions.invoke('request-sample-download', { body: { sampleId }, headers: { Authorization } })
 */
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Must match `samples.audio_url` Storage bucket (full files; signed after credit check). */
const DEFAULT_BUCKET = "private-audios";
const DEFAULT_TTL_SEC = 180;

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Buckets that may appear as the first path segment in path-only `audio_url` values. */
function knownStorageBucketIds(defaultBucket: string): Set<string> {
  return new Set([
    defaultBucket,
    "private-audios",
    "preview-audios",
    "audio-samples",
  ]);
}

/**
 * Path-only `audio_url` (no `https://`):
 * - `samples/foo.wav` → object key `samples/foo.wav` in `defaultBucket`.
 * - `private-audios/samples/foo.wav` → bucket `private-audios`, key `samples/foo.wav` (do not double the bucket).
 */
function pathOnlyToBucketAndPath(
  noLeadingSlash: string,
  defaultBucket: string,
): { bucket: string; path: string } {
  const firstSlash = noLeadingSlash.indexOf("/");
  if (firstSlash === -1) {
    return { bucket: defaultBucket, path: noLeadingSlash };
  }
  const first = noLeadingSlash.slice(0, firstSlash);
  const rest = noLeadingSlash.slice(firstSlash + 1);
  if (knownStorageBucketIds(defaultBucket).has(first)) {
    return { bucket: first, path: rest };
  }
  return { bucket: defaultBucket, path: noLeadingSlash };
}

/**
 * Resolve Storage bucket + object path from `samples.audio_url`.
 * - Path-only values (no scheme): see `pathOnlyToBucketAndPath`.
 * - Full Supabase URLs: bucket is read from `/object/public/<bucket>/...` or `/object/sign/<bucket>/...`
 *   so legacy rows (e.g. old bucket name in URL) still sign correctly.
 */
function bucketAndPathFromAudioUrl(
  audioUrl: string,
  defaultBucket: string,
): { bucket: string; path: string } | null {
  const trimmed = audioUrl.trim();
  if (!trimmed) return null;

  if (!trimmed.includes("://") && !trimmed.startsWith("//")) {
    const noLeadingSlash = trimmed.replace(/^\/+/, "");
    return pathOnlyToBucketAndPath(noLeadingSlash, defaultBucket);
  }

  try {
    const u = new URL(trimmed);
    const m = u.pathname.match(/\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (m) {
      return {
        bucket: m[1],
        path: decodeURIComponent(m[2]),
      };
    }
  } catch {
    return null;
  }
  return null;
}

function downloadFilename(sampleName: string, storagePath: string): string {
  const ext =
    storagePath.includes(".") ?
      storagePath.slice(storagePath.lastIndexOf("."))
    : ".wav";
  const base =
    sampleName.replace(/[^\w\-. ]+/g, "_").trim().slice(0, 180) || "sample";
  return `${base}${ext}`;
}

type PrepareRow = {
  ok: boolean;
  code?: string;
  replay?: boolean;
  bucket?: string;
  audio_url?: string;
  sample_name?: string;
  has_stems?: boolean;
  credits_charged?: number;
};

function dirname(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

function stemsZipPathFromAudioObjectPath(audioObjectPath: string): string {
  const dir = dirname(audioObjectPath);
  return dir ? `${dir}/full.zip` : "full.zip";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ code: "method_not_allowed", message: "Use POST" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return jsonResponse({ code: "server_error", message: "Server misconfigured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ code: "not_authenticated", message: "Missing bearer token" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userErr,
  } = await admin.auth.getUser(token);

  if (userErr || !user) {
    return jsonResponse({ code: "not_authenticated", message: "Invalid session" }, 401);
  }

  let body: { sampleId?: string; idempotencyKey?: string | null };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ code: "bad_request", message: "Invalid JSON" }, 400);
  }

  const sampleId = body.sampleId?.trim();
  if (!sampleId) {
    return jsonResponse({ code: "bad_request", message: "sampleId is required" }, 400);
  }

  const idempotencyKey = body.idempotencyKey?.trim() || null;

  const { data: raw, error: rpcError } = await admin.rpc(
    "request_sample_download_prepare",
    {
      p_sample_id: sampleId,
      p_user_id: user.id,
      p_idempotency_key: idempotencyKey || null,
    },
  );

  if (rpcError) {
    console.error("request_sample_download_prepare", rpcError);
    return jsonResponse(
      { code: "server_error", message: rpcError.message },
      500,
    );
  }

  const row = raw as PrepareRow;
  if (!row?.ok) {
    const code = row?.code ?? "unknown";
    const status =
      code === "sample_not_found" ? 404
      : code === "customer_not_found" ? 403
      : code === "forbidden" ? 403
      : code === "insufficient_credits" ? 402
      : code === "idempotency_conflict" ? 409
      : code === "asset_unavailable" ? 503
      : 400;
    return jsonResponse(
      {
        code,
        message:
          code === "sample_not_found" ? "Sample not found or not available"
          : code === "customer_not_found" ? "No billing profile for this account"
          : code === "forbidden" ? "Subscription required for this content"
          : code === "insufficient_credits" ? "Not enough credits"
          : code === "idempotency_conflict" ? "Idempotency key reused for a different sample"
          : code === "asset_unavailable" ? "Audio file is unavailable"
          : "Request failed",
      },
      status,
    );
  }

  const defaultBucket =
    Deno.env.get("PRIVATE_AUDIOS_BUCKET") ?? row.bucket ?? DEFAULT_BUCKET;
  const audioUrl = row.audio_url;
  if (!audioUrl) {
    return jsonResponse({ code: "asset_unavailable", message: "No audio URL" }, 503);
  }

  const resolved = bucketAndPathFromAudioUrl(audioUrl, defaultBucket);
  if (!resolved) {
    console.error("Could not parse bucket/path from samples.audio_url", audioUrl);
    return jsonResponse(
      {
        code: "asset_unavailable",
        message: "Storage path could not be resolved from audio_url",
      },
      503,
    );
  }

  const { bucket, path: objectPath } = resolved;
  const targetObjectPath = row.has_stems === true
    ? stemsZipPathFromAudioObjectPath(objectPath)
    : objectPath;

  const ttl = Number(Deno.env.get("SAMPLE_DOWNLOAD_URL_TTL_SEC") ?? DEFAULT_TTL_SEC);
  const filename = downloadFilename(row.sample_name ?? "sample", targetObjectPath);

  const { data: signed, error: signError } = await admin.storage
    .from(bucket)
    .createSignedUrl(targetObjectPath, ttl, { download: filename });

  if (signError || !signed?.signedUrl) {
    console.error("createSignedUrl failed", {
      bucket,
      objectPath: targetObjectPath,
      audioUrlPrefix: audioUrl.slice(0, 120),
      signError,
    });
    const hint =
      "No file at this path in Storage. Check that samples.audio_url matches the bucket and object key (e.g. file exists under private-audios, or URL still points at an old bucket name).";
    return jsonResponse(
      {
        code: "asset_unavailable",
        message: signError?.message
          ? `${signError.message}. ${hint}`
          : hint,
      },
      503,
    );
  }

  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  return jsonResponse(
    {
      signedUrl: signed.signedUrl,
      expiresAt,
      filename,
      creditsCharged: row.credits_charged ?? 0,
      replay: row.replay === true,
    },
    200,
  );
});
