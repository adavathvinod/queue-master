-- Create an atomic function to generate the next token number
CREATE OR REPLACE FUNCTION public.generate_next_token(
  p_queue_id UUID,
  p_session_id TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_number INTEGER;
  v_system_status BOOLEAN;
  v_capacity_enabled BOOLEAN;
  v_daily_capacity INTEGER;
  v_current_next_token INTEGER;
BEGIN
  -- Lock the row and get current values atomically
  SELECT next_token, system_status, capacity_enabled, daily_capacity
  INTO v_current_next_token, v_system_status, v_capacity_enabled, v_daily_capacity
  FROM queue_instances
  WHERE id = p_queue_id
  FOR UPDATE;

  -- Check if queue exists
  IF v_current_next_token IS NULL THEN
    RAISE EXCEPTION 'Queue not found';
  END IF;

  -- Check system status
  IF NOT v_system_status THEN
    RAISE EXCEPTION 'Queue is closed';
  END IF;

  -- Check capacity
  IF v_capacity_enabled AND v_daily_capacity IS NOT NULL THEN
    IF (v_current_next_token - 1) >= v_daily_capacity THEN
      RAISE EXCEPTION 'Daily capacity reached';
    END IF;
  END IF;

  -- Get the next token number
  v_token_number := v_current_next_token;

  -- Atomically increment next_token
  UPDATE queue_instances
  SET next_token = next_token + 1,
      updated_at = now()
  WHERE id = p_queue_id;

  -- Insert the token record
  INSERT INTO tokens (queue_id, token_number, session_id, status)
  VALUES (p_queue_id, v_token_number, p_session_id, 'active');

  RETURN v_token_number;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.generate_next_token(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_token(UUID, TEXT) TO anon;