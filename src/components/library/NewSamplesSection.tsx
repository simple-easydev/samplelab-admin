import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { FileAudio, ImagePlus, Loader2, Pause, Play, X } from "lucide-react";
import { useWaveform } from "@/hooks/useWaveform";
import { WaveformBars } from "@/components/library/WaveformBars";

interface NewSampleFile {
  id: string;
  file: File;
  name: string;
  bpm: string;
  key: string;
  type: "Loop" | "One-shot";
  length: string;
  creditCost: string;
  hasStems: boolean;
  stemFiles: File[];
  thumbnailFile: File | null;
}

interface NewSamplesSectionProps {
  newSampleFiles: NewSampleFile[];
  isSubmitting: boolean;
  onSampleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveNewSample: (sampleId: string) => void;
  onUpdateNewSample: (sampleId: string, field: string, value: any) => void;
  onStemUpload: (sampleId: string, files: FileList | null) => void;
  onRemoveStems: (sampleId: string) => void;
  /** Called when waveform is ready; use to set length and/or store bars + duration for saving */
  onWaveformReady?: (
    sampleId: string,
    durationFormatted: string,
    waveformData?: { bars: number[]; durationSeconds: number }
  ) => void;
}

function NewSampleRow({
  sample,
  isSubmitting,
  isPlaying,
  playProgress,
  onPlayPause,
  onRemoveNewSample,
  onUpdateNewSample,
  onStemUpload,
  onRemoveStems,
  onWaveformReady,
}: {
  sample: NewSampleFile;
  isSubmitting: boolean;
  isPlaying: boolean;
  /** 0–1 playback progress when this sample is playing */
  playProgress?: number;
  onPlayPause: (sampleId: string, file: File) => void;
  onRemoveNewSample: (id: string) => void;
  onUpdateNewSample: (id: string, field: string, value: any) => void;
  onStemUpload: (id: string, files: FileList | null) => void;
  onRemoveStems: (id: string) => void;
  onWaveformReady?: (
    sampleId: string,
    durationFormatted: string,
    waveformData?: { bars: number[]; durationSeconds: number }
  ) => void;
}) {
  const { data: waveform, loading: waveformLoading, error: waveformError } = useWaveform(sample.file);

  // When waveform is ready: set length and pass bars + duration for saving to DB
  useEffect(() => {
    if (waveform && onWaveformReady) {
      onWaveformReady(sample.id, waveform.durationFormatted, {
        bars: waveform.bars,
        durationSeconds: waveform.durationSeconds,
      });
    }
  }, [waveform, sample.id, onWaveformReady]);

  // Thumbnail preview URL (create/revoke from thumbnailFile)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  useEffect(() => {
    if (sample.thumbnailFile) {
      const url = URL.createObjectURL(sample.thumbnailFile);
      setThumbPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbPreview(null);
    }
  }, [sample.thumbnailFile]);

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPlayPause(sample.id, sample.file)}
            disabled={isSubmitting}
            aria-label={isPlaying ? "Pause" : "Play"}
            className={`relative shrink-0 rounded-md overflow-hidden border flex items-center justify-center bg-muted ${
              thumbPreview ? "h-12 w-12" : "h-9 w-9 border-input"
            }`}
          >
            {thumbPreview ? (
              <>
                <img
                  src={thumbPreview}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="relative z-10 flex items-center justify-center w-full h-full bg-black/30 text-white">
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </span>
              </>
            ) : (
              <>
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </>
            )}
          </button>
          <FileAudio className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-medium truncate">{sample.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(sample.file.size / 1024 / 1024).toFixed(2)} MB
              {waveform && ` • ${waveform.durationFormatted}`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemoveNewSample(sample.id)}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Waveform visualization */}
      <div className="space-y-1">
        {waveformLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing waveform…</span>
          </div>
        )}
        {waveformError && (
          <p className="text-xs text-destructive">{waveformError}</p>
        )}
        {waveform && !waveformLoading && (
          <WaveformBars
            bars={waveform.bars}
            progress={playProgress}
            height={36}
            className="rounded-md bg-muted/50 p-1"
          />
        )}
      </div>

      {/* Thumbnail upload */}
      <div className="space-y-2">
        <Label className="text-xs">Thumbnail (optional)</Label>
        <div className="flex items-center gap-3">
          {thumbPreview ? (
            <>
              <img
                src={thumbPreview}
                alt="Thumbnail preview"
                className="h-16 w-16 rounded object-cover border"
              />
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateNewSample(sample.id, "thumbnailFile", null)}
                  disabled={isSubmitting}
                >
                  Remove
                </Button>
              </div>
            </>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpdateNewSample(sample.id, "thumbnailFile", f);
                  e.target.value = "";
                }}
                disabled={isSubmitting}
              />
              <ImagePlus className="h-5 w-5" />
              <span>Upload thumbnail (JPG, PNG, WebP)</span>
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div>
          <Label className="text-xs">Title</Label>
          <Input
            value={sample.name}
            onChange={(e) => onUpdateNewSample(sample.id, "name", e.target.value)}
            placeholder="Sample title"
            disabled={isSubmitting}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">BPM</Label>
          <Input
            value={sample.bpm}
            onChange={(e) => onUpdateNewSample(sample.id, "bpm", e.target.value)}
            placeholder="120"
            disabled={isSubmitting}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">Key</Label>
          <Input
            value={sample.key}
            onChange={(e) => onUpdateNewSample(sample.id, "key", e.target.value)}
            placeholder="C"
            disabled={isSubmitting}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">Type</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9"
                disabled={isSubmitting}
              >
                {sample.type}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => onUpdateNewSample(sample.id, "type", "Loop")}
              >
                Loop
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateNewSample(sample.id, "type", "One-shot")}
              >
                One-shot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <Label className="text-xs">Credit Cost (Rule-based)</Label>
          <Input
            value={sample.creditCost}
            placeholder="Auto"
            disabled
            className="h-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`stems-${sample.id}`}
            checked={sample.hasStems}
            onChange={(e) =>
              onUpdateNewSample(sample.id, "hasStems", e.target.checked)
            }
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor={`stems-${sample.id}`} className="cursor-pointer text-sm">
            Has stems?
          </Label>
        </div>

        {sample.hasStems && (
          <div>
            <Input
              type="file"
              accept=".wav,.mp3"
              multiple
              onChange={(e) => onStemUpload(sample.id, e.target.files)}
              disabled={isSubmitting}
              className="cursor-pointer h-9"
            />
            {sample.stemFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {sample.stemFiles.length} stem file(s) selected
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveStems(sample.id)}
                  disabled={isSubmitting}
                  className="h-7 text-xs mt-1"
                >
                  Remove stems
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function NewSamplesSection({
  newSampleFiles,
  isSubmitting,
  onSampleUpload,
  onRemoveNewSample,
  onUpdateNewSample,
  onStemUpload,
  onRemoveStems,
  onWaveformReady,
}: NewSamplesSectionProps) {
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{
    sampleId: string;
    currentTime: number;
    duration: number;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const handlePlayPause = (sampleId: string, file: File) => {
    if (playingSampleId === sampleId) {
      audioRef.current?.pause();
      setPlayingSampleId(null);
      setPlaybackProgress(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    audioRef.current?.pause();
    setPlaybackProgress(null);

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const audio = new Audio(url);
    const updateProgress = () => {
      setPlaybackProgress({
        sampleId,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      });
    };

    audio.onended = () => {
      setPlayingSampleId(null);
      setPlaybackProgress(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    audio.ontimeupdate = updateProgress;
    audio.onloadedmetadata = updateProgress;

    audioRef.current = audio;
    audio.play().catch(() => {
      setPlayingSampleId(null);
      setPlaybackProgress(null);
    });
    setPlayingSampleId(sampleId);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Samples</CardTitle>
        <CardDescription>Upload additional audio files to this pack</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            accept=".wav,.mp3"
            multiple
            onChange={onSampleUpload}
            disabled={isSubmitting}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Supported formats: WAV, MP3 • You can select multiple files
          </p>
        </div>

        {newSampleFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">New Samples ({newSampleFiles.length})</h4>
            {newSampleFiles.map((sample) => {
              const isThisPlaying = playingSampleId === sample.id;
              const progress =
                playbackProgress?.sampleId === sample.id && playbackProgress.duration > 0
                  ? playbackProgress.currentTime / playbackProgress.duration
                  : undefined;
              return (
                <NewSampleRow
                  key={sample.id}
                  sample={sample}
                  isSubmitting={isSubmitting}
                  isPlaying={isThisPlaying}
                  playProgress={progress}
                  onPlayPause={handlePlayPause}
                  onRemoveNewSample={onRemoveNewSample}
                  onUpdateNewSample={onUpdateNewSample}
                  onStemUpload={onStemUpload}
                  onRemoveStems={onRemoveStems}
                  onWaveformReady={onWaveformReady}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

