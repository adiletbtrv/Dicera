ALTER TABLE monsters ADD COLUMN IF NOT EXISTS cr_numeric NUMERIC GENERATED ALWAYS AS (
  CASE challenge_rating
    WHEN '0'   THEN 0
    WHEN '1/8' THEN 0.125
    WHEN '1/4' THEN 0.25
    WHEN '1/2' THEN 0.5
    ELSE CAST(challenge_rating AS NUMERIC)
  END
) STORED;

CREATE INDEX IF NOT EXISTS monsters_cr_numeric_idx ON monsters(cr_numeric);
