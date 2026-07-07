CREATE OR REPLACE FUNCTION get_available_slots(
  p_staff_id UUID,
  p_date DATE,
  p_service_duration_minutes INT,
  p_salon_id UUID
)
RETURNS TABLE(start_time TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_business_open TIME := '09:00';
  v_business_close TIME := '19:00';
  v_staff_start TIME;
  v_staff_end TIME;
  v_day_name TEXT;
  v_slot TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
  v_day_start TIMESTAMPTZ;
  v_day_end TIMESTAMPTZ;
  v_min_lead_time TIMESTAMPTZ;
  v_busy RECORD;
BEGIN
  v_min_lead_time := NOW() + INTERVAL '30 minutes';
  v_day_start := p_date::TIMESTAMPTZ;
  v_day_end := (p_date + INTERVAL '1 day')::TIMESTAMPTZ;
  v_day_name := LOWER(TRIM(TO_CHAR(p_date, 'day')));

  -- Get staff working hours
  SELECT start_time::TIME, end_time::TIME
  INTO v_staff_start, v_staff_end
  FROM staff
  WHERE id = p_staff_id;

  -- Get salon business hours for this day from JSONB
  SELECT 
    MIN((h.value->>'open')::TIME),
    MIN((h.value->>'close')::TIME)
  INTO v_business_open, v_business_close
  FROM salons s
  CROSS JOIN LATERAL jsonb_array_elements(s.business_hours) AS h
  WHERE s.id = p_salon_id
    AND LOWER(TRIM(h.value->>'day')) = v_day_name;

  -- Fallback if no hours set
  IF v_business_open IS NULL THEN v_business_open := '09:00'; END IF;
  IF v_business_close IS NULL THEN v_business_close := '19:00'; END IF;
  IF v_staff_start IS NULL THEN v_staff_start := '09:00'; END IF;
  IF v_staff_end IS NULL THEN v_staff_end := '17:00'; END IF;

  -- Start from the later of business open and staff start
  v_slot := GREATEST(
    v_day_start + v_business_open,
    v_day_start + v_staff_start
  );

  -- Generate 15-min slots
  WHILE v_slot + (p_service_duration_minutes || ' minutes')::INTERVAL <= LEAST(
    v_day_start + v_business_close,
    v_day_start + v_staff_end
  ) LOOP
    v_slot_end := v_slot + (p_service_duration_minutes || ' minutes')::INTERVAL;

    -- Check minimum lead time (30 min)
    IF v_slot >= v_min_lead_time THEN
      -- Check no booking conflict (exclude the booking being rescheduled if applicable)
      IF NOT EXISTS (
        SELECT 1
        FROM bookings b
        WHERE b.staff_id = p_staff_id
          AND b.status IN ('confirmed', 'completed')
          AND b.start_time < v_slot_end
          AND (b.start_time + (COALESCE(b.duration_minutes, p_service_duration_minutes) || ' minutes')::INTERVAL) > v_slot
      ) THEN
        start_time := v_slot;
        RETURN NEXT;
      END IF;
    END IF;

    v_slot := v_slot + INTERVAL '15 minutes';
  END LOOP;
END;
$$;
