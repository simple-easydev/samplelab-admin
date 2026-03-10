// Supabase Edge Function: Process Audio Waveform
// Fetches an audio file (WAV recommended) and returns waveform bar data.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface WaveformRequestBody {
  url?: string;
  barCount?: number;
}

interface WaveformResponseBody {
  durationSeconds: number;
  durationFormatted: string;
  bars: number[];
  barCount: number;
  format: string;
  sampleRate: number;
  channels: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: WaveformRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { url, barCount = 100 } = body ?? {};

  if (!url || typeof url !== "string") {
    return jsonResponse({ error: "Missing or invalid 'url' field" }, 400);
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return jsonResponse(
        { error: `Failed to fetch audio: ${res.status} ${res.statusText}` },
        400
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const cleanUrl = url.split("?")[0].split("#")[0];
    const ext = cleanUrl.toLowerCase().split(".").pop() ?? "unknown";

    let bars: number[] = [];
    let durationSeconds = 0;
    let sampleRate = 0;
    let channels = 0;

    if (ext === "wav" || ext === "wave") {
      const decoded = decodeWav(bytes);
      sampleRate = decoded.sampleRate;
      channels = decoded.channels;
      const samples = decoded.samples;
      durationSeconds =
        sampleRate > 0 ? samples.length / sampleRate : 0;
      bars = computeAmplitudeBars(samples, barCount);
    } else {
      // Fallback: approximate waveform from raw bytes (works for MP3 and others)
      bars = estimateBarsFromBytes(bytes, barCount);
    }

    const response: WaveformResponseBody = {
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      bars,
      barCount,
      format: ext,
      sampleRate,
      channels,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    console.error("process-audio-waveform error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});

/**
 * Decodes raw audio samples from a WAV file buffer.
 * Supports 8-bit, 16-bit, 24-bit, and 32-bit PCM formats.
 *
 * @param bytes Uint8Array containing the WAV file.
 */
function decodeWav(bytes: Uint8Array): {
  sampleRate: number;
  channels: number;
  samples: Float32Array;
} {
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  );

  // Find "fmt " and "data" chunks
  let offset = 12;
  let fmtOffset = -1;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset < bytes.byteLength - 8) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "fmt ") {
      fmtOffset = offset + 8;
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = chunkSize;
    }

    offset += 8 + chunkSize;
    if (offset % 2 !== 0) offset++;
  }

  if (fmtOffset === -1 || dataOffset === -1) {
    throw new Error("Invalid WAV file: missing fmt or data chunk");
  }

  const audioFormat = view.getUint16(fmtOffset, true);
  const channels = view.getUint16(fmtOffset + 2, true);
  const sampleRate = view.getUint32(fmtOffset + 4, true);
  const bitsPerSample = view.getUint16(fmtOffset + 14, true);
  const bytesPerSample = bitsPerSample / 8;

  if (audioFormat !== 1) {
    throw new Error(
      `Unsupported WAV format: ${audioFormat}. Only PCM (format 1) is supported.`
    );
  }

  const totalSamples = dataSize / bytesPerSample;
  const monoSamples = Math.floor(totalSamples / channels);
  const samples = new Float32Array(monoSamples);

  for (let i = 0; i < monoSamples; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch++) {
      const bytePos =
        dataOffset + (i * channels + ch) * bytesPerSample;

      let sample = 0;
      switch (bitsPerSample) {
        case 8:
          sample = (bytes[bytePos] - 128) / 128;
          break;
        case 16:
          sample = view.getInt16(bytePos, true) / 32768;
          break;
        case 24: {
          const b0 = bytes[bytePos];
          const b1 = bytes[bytePos + 1];
          const b2 = bytes[bytePos + 2];
          let val = (b2 << 16) | (b1 << 8) | b0;
          if (val >= 0x800000) val -= 0x1000000;
          sample = val / 8388608;
          break;
        }
        case 32:
          sample = view.getInt32(bytePos, true) / 2147483648;
          break;
        default:
          throw new Error(`Unsupported bit depth: ${bitsPerSample}`);
      }
      sum += sample;
    }
    samples[i] = sum / channels;
  }

  return { sampleRate, channels, samples };
}

/**
 * Computes amplitude bars from raw PCM samples.
 * Each bar represents the RMS (root mean square) amplitude of a chunk of audio.
 */
function computeAmplitudeBars(samples: Float32Array, barCount: number): number[] {
  const chunkSize = Math.floor(samples.length / barCount) || 1;
  const bars: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, samples.length);

    if (start >= samples.length) {
      bars.push(0);
      continue;
    }

    let sumSquares = 0;
    for (let j = start; j < end; j++) {
      const v = samples[j];
      sumSquares += v * v;
    }
    const count = end - start || 1;
    const rms = Math.sqrt(sumSquares / count);
    bars.push(rms);
  }

  const peak = Math.max(...bars, 0.0001);
  return bars.map((bar) => bar / peak);
}

/**
 * Formats a duration in seconds to "m:ss" or "h:mm:ss".
 */
function formatDuration(totalSeconds: number): string {
  const secsTotal = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(secsTotal / 3600);
  const mins = Math.floor((secsTotal % 3600) / 60);
  const secs = secsTotal % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Fallback: estimates amplitude bars from raw file bytes.
 * Skips headers and uses byte magnitudes as a rough proxy for amplitude.
 * Works for MP3 and other encoded formats where we don't decode PCM.
 */
function estimateBarsFromBytes(bytes: Uint8Array, barCount: number): number[] {
  if (bytes.length === 0) return Array(barCount).fill(0);

  const start = Math.min(200, Math.floor(bytes.length * 0.01));
  const end = Math.max(start + 1, bytes.length - 128);
  const usable = bytes.subarray(start, end);

  const chunkSize = Math.floor(usable.length / barCount) || 1;
  const bars: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const chunkStart = i * chunkSize;
    const chunkEnd = Math.min(chunkStart + chunkSize, usable.length);

    if (chunkStart >= usable.length) {
      bars.push(0);
      continue;
    }

    let sum = 0;
    for (let j = chunkStart; j < chunkEnd; j++) {
      sum += Math.abs(usable[j] - 128);
    }
    const count = chunkEnd - chunkStart || 1;
    bars.push(sum / count);
  }

  const peak = Math.max(...bars, 0.0001);
  return bars.map((b) => b / peak);
}

