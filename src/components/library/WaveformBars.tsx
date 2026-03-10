import { cn } from "@/lib/utils";

interface WaveformBarsProps {
  bars: number[];
  /** Playback progress 0–1; when set, bars before this position are filled, rest grey */
  progress?: number;
  className?: string;
  barClassName?: string;
  height?: number;
}

export function WaveformBars({
  bars,
  progress,
  className,
  barClassName,
  height = 32,
}: WaveformBarsProps) {
  if (!bars.length) return null;

  const n = bars.length;

  return (
    <div
      className={cn("flex items-center gap-px w-full", className)}
      style={{ height }}
      role="img"
      aria-label={progress != null ? "Audio waveform with playback progress" : "Audio waveform"}
    >
      {bars.map((norm, i) => {
        const isFilled = progress != null && i / n < progress;
        const barHeight = Math.max(4, norm * height);
        return (
          <div
            key={i}
            className={cn(
              "w-0.5 shrink-0 rounded-sm transition-colors",
              isFilled ? "bg-primary/70" : "bg-muted-foreground/30",
              barClassName
            )}
            style={{
              height: `${barHeight}px`,
            }}
          />
        );
      })}
    </div>
  );
}
