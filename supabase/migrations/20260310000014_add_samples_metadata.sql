-- Add metadata JSONB column to samples for waveform (amplitude bars) and duration
ALTER TABLE samples
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN samples.metadata IS 'Audio metadata: { "bars": number[], "duration_seconds": number } for waveform visualization';
