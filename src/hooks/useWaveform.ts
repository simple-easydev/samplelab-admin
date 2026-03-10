import { useState, useEffect, useCallback } from "react";

const BAR_COUNT = 80;

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

function formatDuration(totalSeconds: number): string {
  const secsTotal = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(secsTotal / 3600);
  const mins = Math.floor((secsTotal % 3600) / 60);
  const secs = secsTotal % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export interface WaveformData {
  bars: number[];
  durationSeconds: number;
  durationFormatted: string;
  barCount: number;
  sampleRate: number;
  channels: number;
}

export function useWaveform(
  file: File | null,
  barCount: number = BAR_COUNT
): {
  data: WaveformData | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<WaveformData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (audioFile: File) => {
    setLoading(true);
    setError(null);
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const decoded = await audioContext.decodeAudioData(arrayBuffer);

      const numChannels = decoded.numberOfChannels;
      const length = decoded.length;
      let samples: Float32Array;

      if (numChannels === 1) {
        samples = decoded.getChannelData(0);
      } else {
        const ch0 = decoded.getChannelData(0);
        const ch1 = decoded.getChannelData(1);
        samples = new Float32Array(length);
        for (let i = 0; i < length; i++) {
          samples[i] = (ch0[i] + ch1[i]) / 2;
        }
      }

      const bars = computeAmplitudeBars(samples, barCount);
      const durationSeconds = decoded.duration;

      setData({
        bars,
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        barCount,
        sampleRate: decoded.sampleRate,
        channels: numChannels,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to decode audio";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [barCount]);

  useEffect(() => {
    if (!file) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "wav" && ext !== "mp3" && ext !== "wave") {
      setError("Unsupported format. Use WAV or MP3.");
      setData(null);
      setLoading(false);
      return;
    }

    processFile(file);
  }, [file, processFile]);

  return { data, loading, error };
}
