-- Rate limiting with PostgreSQL for cross-instance enforcement.
-- Supports sliding windows per key via a dedicated table and RPC.

CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INT NOT NULL DEFAULT 1,
  max_requests INT NOT NULL,
  window_seconds INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_cleanup
  ON rate_limits(key, window_start);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key_window_unique
  ON rate_limits(key, window_start);

-- Cleanup old entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Check and increment rate limit for a given key.
-- Returns (allowed, remaining, reset_at).
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_requests INT DEFAULT 3,
  p_window_seconds INT DEFAULT 300
)
RETURNS TABLE(allowed BOOLEAN, remaining INT, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
BEGIN
  -- Calculate the current window start (aligned to window_seconds boundaries)
  v_window_start := date_trunc('second', NOW()) -
    (EXTRACT(EPOCH FROM NOW())::INT % p_window_seconds) * INTERVAL '1 second';

  -- Delete expired entries for this key
  DELETE FROM rate_limits
  WHERE key = p_key
    AND window_start < v_window_start;

  -- Count current window entries
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM rate_limits
  WHERE key = p_key
    AND window_start >= v_window_start;

  -- Check if allowed
  IF v_count < p_max_requests THEN
    -- Insert or increment
    INSERT INTO rate_limits (key, window_start, request_count, max_requests, window_seconds)
    VALUES (p_key, v_window_start, 1, p_max_requests, p_window_seconds)
    ON CONFLICT (key, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1
    WHERE rate_limits.request_count < rate_limits.max_requests;

    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      GREATEST(0, p_max_requests - v_count - 1)::INT,
      v_window_start + (p_window_seconds || ' seconds')::INTERVAL;
  ELSE
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      0::INT,
      v_window_start + (p_window_seconds || ' seconds')::INTERVAL;
  END IF;
END;
$$;
