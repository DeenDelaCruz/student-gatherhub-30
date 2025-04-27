
-- Function to get the average rating for an event
CREATE OR REPLACE FUNCTION public.get_event_average_rating(event_id_param UUID)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating FLOAT;
BEGIN
  SELECT AVG(rating)::FLOAT INTO avg_rating
  FROM public.event_ratings
  WHERE event_id = event_id_param;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$;

-- Function to count ratings for an event
CREATE OR REPLACE FUNCTION public.get_event_rating_count(event_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rating_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rating_count
  FROM public.event_ratings
  WHERE event_id = event_id_param;
  
  RETURN COALESCE(rating_count, 0);
END;
$$;
