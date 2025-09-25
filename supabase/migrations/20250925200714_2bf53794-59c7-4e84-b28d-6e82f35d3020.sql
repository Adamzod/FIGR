-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule monthly reconciliation (runs at 00:10 on the 1st of each month)
SELECT cron.schedule(
  'monthly-reconcile',
  '10 0 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://vfzjrmypwqqgncqkytds.supabase.co/functions/v1/monthly-reconcile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmempybXlwd3FxZ25jcWt5dGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjYzOTUsImV4cCI6MjA3NDQwMjM5NX0.07utRxhZdXpie3uyzJrimyWtnm0694-BPFJv4xaZ6NU'
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);

-- Schedule daily subscription processing (runs at 00:30 every day)
SELECT cron.schedule(
  'apply-due-subscriptions',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vfzjrmypwqqgncqkytds.supabase.co/functions/v1/apply-due-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmempybXlwd3FxZ25jcWt5dGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjYzOTUsImV4cCI6MjA3NDQwMjM5NX0.07utRxhZdXpie3uyzJrimyWtnm0694-BPFJv4xaZ6NU'
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);

-- Schedule daily goal contributions (runs at 00:45 every day)
SELECT cron.schedule(
  'apply-scheduled-contributions',
  '45 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vfzjrmypwqqgncqkytds.supabase.co/functions/v1/apply-scheduled-contributions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmempybXlwd3FxZ25jcWt5dGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjYzOTUsImV4cCI6MjA3NDQwMjM5NX0.07utRxhZdXpie3uyzJrimyWtnm0694-BPFJv4xaZ6NU'
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);