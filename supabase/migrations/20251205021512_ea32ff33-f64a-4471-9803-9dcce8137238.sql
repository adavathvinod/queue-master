-- Add new columns to queue_instances for industry type and new toggles
ALTER TABLE public.queue_instances 
ADD COLUMN IF NOT EXISTS industry_type text NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS audio_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS requeue_enabled boolean NOT NULL DEFAULT false;

-- Add comment for industry types
COMMENT ON COLUMN public.queue_instances.industry_type IS 'Industry classification: hospital, restaurant, retail, government, corporate, education, other';