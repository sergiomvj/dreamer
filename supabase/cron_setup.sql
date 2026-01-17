-- Enable pg_cron extension (Must be done by superuser/dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the sequence worker to run every 10 minutes
-- Note: Replace 'your-project-ref' and 'anon-key' with actual values in a real environment
-- or use the Supabase Dashboard UI for setting up pg_cron jobs.

-- Example SQL for pg_cron (runs inside Postgres):
/*
SELECT cron.schedule(
  'process-sequences-every-10m', -- name of the job
  '*/10 * * * *',                -- cron schedule
  $$
  select
    net.http_post(
        url:='https://PROJECT_REF.supabase.co/functions/v1/sequence-worker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
*/

-- Since we cannot run pg_cron directly from here without knowing if the extension is enabled 
-- and having the keys, I will create a helper function that can be triggered manually for testing.

CREATE OR REPLACE FUNCTION public.trigger_sequence_worker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a placeholder. In a real setup, this would use pg_net to call the Edge Function.
  -- For this MVP, we will just rely on the "manual trigger" via UI or external cron.
  NULL;
END;
$$;
