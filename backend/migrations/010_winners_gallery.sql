-- Migration: Add winners gallery fields to raffle_rounds table

ALTER TABLE raffle_rounds 
ADD COLUMN IF NOT EXISTS winner_photo_url TEXT,
ADD COLUMN IF NOT EXISTS winner_testimonial TEXT,
ADD COLUMN IF NOT EXISTS winner_prize_name VARCHAR(255);

-- Create index for faster queries on completed rounds
CREATE INDEX IF NOT EXISTS idx_raffle_rounds_status ON raffle_rounds(status);
CREATE INDEX IF NOT EXISTS idx_raffle_rounds_ended_at ON raffle_rounds(ended_at DESC);

-- Comment
COMMENT ON COLUMN raffle_rounds.winner_photo_url IS 'URL de la foto del ganador para galería pública';
COMMENT ON COLUMN raffle_rounds.winner_testimonial IS 'Testimonio del ganador';
COMMENT ON COLUMN raffle_rounds.winner_prize_name IS 'Nombre del premio ganado';
