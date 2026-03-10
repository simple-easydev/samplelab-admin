// Supabase Edge Function: Extract Audio Metadata (BPM, Key)
// Fetches an audio file from URL and extracts BPM and Key from ID3 (MP3) or LIST INFO (WAV).

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

interface ExtractMetadataRequestBody {
  url?: string;
}

interface ExtractMetadataResponseBody {
  bpm?: number | null;
  key?: string | null;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: ExtractMetadataRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { url } = body ?? {};

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
    const ext = (cleanUrl.toLowerCase().split(".").pop() ?? "").replace(/\?.*/, "");

    let bpm: number | null = null;
    let key: string | null = null;

    // Detect format by extension and/or magic bytes
    const hasId3 = bytes.length >= 3 && String.fromCharCode(bytes[0], bytes[1], bytes[2]) === "ID3";
    const hasRiff = bytes.length >= 4 && String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF";

    if (ext === "mp3" || ext === "mpeg" || hasId3) {
      const parsed = parseId3v2(bytes);
      bpm = parsed.bpm;
      key = parsed.key;
    } else if (ext === "wav" || ext === "wave" || hasRiff) {
      const parsed = parseWavListInfo(bytes);
      bpm = parsed.bpm;
      key = parsed.key;
    }

    const response: ExtractMetadataResponseBody = { bpm, key };
    return jsonResponse(response, 200);
  } catch (error) {
    console.error("extract-audio-metadata error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message, bpm: null, key: null }, 500);
  }
});

/**
 * Read syncsafe integer (ID3v2 size): 4 bytes, high bit of each byte is 0.
 */
function readSyncsafe(view: DataView, offset: number): number {
  return (
    ((view.getUint8(offset) & 0x7f) << 21) |
    ((view.getUint8(offset + 1) & 0x7f) << 14) |
    ((view.getUint8(offset + 2) & 0x7f) << 7) |
    (view.getUint8(offset + 3) & 0x7f)
  );
}

/**
 * Parse ID3v2.3/2.4 tags from the start of an MP3 file.
 * Extracts TBPM (BPM) and TKEY or TXXX (key).
 */
function parseId3v2(bytes: Uint8Array): { bpm: number | null; key: string | null } {
  let bpm: number | null = null;
  let key: string | null = null;

  if (bytes.length < 10) return { bpm, key };

  const id3 = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
  if (id3 !== "ID3") return { bpm, key };

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const major = view.getUint8(3);
  const flags = view.getUint8(5);
  const size = readSyncsafe(view, 6);
  let offset = 10;

  // Skip extended header: ID3v2.4 uses syncsafe size; ID3v2.3 uses 6-byte minimum
  if (flags & 0x40) {
    if (major === 4) {
      const extSize = readSyncsafe(view, offset);
      offset = 10 + extSize;
    } else {
      offset = 10 + 6; // ID3v2.3: minimum 6 bytes
    }
  }

  const end = Math.min(10 + size, bytes.length);

  while (offset + 10 <= end) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    let frameSize: number;
    if (major === 4) {
      frameSize = readSyncsafe(view, offset + 4);
    } else {
      frameSize = view.getUint32(offset + 4, false); // big-endian
    }
    offset += 10; // 4 id + 4 size + 2 flags
    if (frameSize <= 0 || offset + frameSize > end) break;

    if (frameId === "TBPM") {
      const text = decodeId3Text(bytes, offset, frameSize).trim();
      const num = Math.round(parseFloat(text));
      if (!isNaN(num) && num > 0 && num < 1000) bpm = num;
    } else if (frameId === "TKEY") {
      const text = decodeId3Text(bytes, offset, frameSize).trim();
      if (text) key = text;
    } else if (frameId === "TXXX") {
      const { value, description } = decodeTxxx(bytes, offset, frameSize);
      const desc = (description || "").toLowerCase();
      const val = (value || "").trim();
      if (
        (desc.includes("key") || desc.includes("initial key") || desc === "key") &&
        val
      ) {
        key = val;
      } else if ((desc === "bpm" || desc.includes("bpm")) && val) {
        const num = Math.round(parseFloat(val));
        if (!isNaN(num) && num > 0 && num < 1000) bpm = num;
      }
    }

    offset += frameSize;
  }

  return { bpm, key };
}

function decodeId3Text(bytes: Uint8Array, offset: number, size: number): string {
  if (size < 1) return "";
  const encoding = bytes[offset];
  const data = bytes.subarray(offset + 1, offset + size);
  if (encoding === 1) return decodeUtf16(data, "bom");
  if (encoding === 2) return decodeUtf16(data, "be");
  return decodeLatin1(data);
}

function decodeTxxx(
  bytes: Uint8Array,
  offset: number,
  size: number
): { description: string; value: string } {
  if (size < 1) return { description: "", value: "" };
  const encoding = bytes[offset];
  let i = offset + 1;
  let term = offset + size;
  if (encoding === 1 || encoding === 2) {
    for (let j = i; j < offset + size - 1; j += 2) {
      if (bytes[j] === 0 && bytes[j + 1] === 0) {
        term = j;
        break;
      }
    }
  } else {
    for (let j = i; j < offset + size; j++) {
      if (bytes[j] === 0) {
        term = j;
        break;
      }
    }
  }
  const utf16Mode = encoding === 1 ? "bom" : encoding === 2 ? "be" : null;
  const description =
    utf16Mode !== null
      ? decodeUtf16(bytes.subarray(i, term), utf16Mode)
      : decodeLatin1(bytes.subarray(i, term));
  i = term + (utf16Mode !== null ? 2 : 1);
  const value =
    i < offset + size
      ? utf16Mode !== null
        ? decodeUtf16(bytes.subarray(i, offset + size), utf16Mode)
        : decodeLatin1(bytes.subarray(i, offset + size))
      : "";
  return { description, value };
}

/** mode: "bom" = use BOM to detect LE/BE, "be" = big-endian without BOM */
function decodeUtf16(bytes: Uint8Array, mode: "bom" | "be"): string {
  if (bytes.length < 2) return "";
  try {
    let le: boolean;
    let i: number;
    if (mode === "be") {
      le = false;
      i = 0;
    } else {
      const bom = bytes[0] === 0xff && bytes[1] === 0xfe;
      le = bom || (bytes[0] !== 0xfe || bytes[1] !== 0xff);
      i = 2;
    }
    let s = "";
    for (; i < bytes.length - 1; i += 2) {
      const code = le ? bytes[i] | (bytes[i + 1] << 8) : (bytes[i] << 8) | bytes[i + 1];
      if (code === 0) break;
      s += String.fromCharCode(code);
    }
    return s;
  } catch {
    return decodeLatin1(bytes);
  }
}

function decodeLatin1(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) break;
    s += String.fromCharCode(bytes[i]);
  }
  return s;
}

/**
 * Parse WAV LIST INFO chunk for optional IKEY (key) and IBPM if present.
 */
function parseWavListInfo(bytes: Uint8Array): { bpm: number | null; key: string | null } {
  let bpm: number | null = null;
  let key: string | null = null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 12) return { bpm, key };

  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (riff !== "RIFF") return { bpm, key };

  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "LIST" && chunkSize >= 4) {
      const listType = String.fromCharCode(
        bytes[offset + 8],
        bytes[offset + 9],
        bytes[offset + 10],
        bytes[offset + 11]
      );
      if (listType === "INFO") {
        let pos = offset + 12;
        const listEnd = offset + 8 + chunkSize;
        while (pos + 8 <= listEnd) {
          const subId = String.fromCharCode(
            bytes[pos],
            bytes[pos + 1],
            bytes[pos + 2],
            bytes[pos + 3]
          );
          const subSize = view.getUint32(pos + 4, true);
          pos += 8;
          if (pos + subSize > listEnd) break;
          const value = decodeLatin1(bytes.subarray(pos, pos + subSize)).trim();
          if (subId === "IKEY" && value) key = value;
          if (subId === "IBPM" && value) {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0 && num < 1000) bpm = num;
          }
          pos += subSize;
        }
      }
    }

    offset += 8 + chunkSize;
    if (offset % 2 !== 0) offset++;
  }

  return { bpm, key };
}
