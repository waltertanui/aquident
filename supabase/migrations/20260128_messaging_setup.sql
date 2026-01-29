-- Create notification_logs table to prevent duplicate messages
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_no INT,
    appointment_id INT,
    type VARCHAR(50) NOT NULL, -- 'birthday', 'reminder_2d', 'reminder_1d', 'reminder_0d'
    status VARCHAR(20) NOT NULL, -- 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone_number VARCHAR(20) NOT NULL,
    message_sid TEXT
);

-- Enable pg_cron if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Set up cron job to run at 8:00 AM EAT daily (5:00 AM UTC)
-- Note: Replace 'your-project-ref' with actual project ref in the URL if needed, 
-- but usually internal calls use local service names or we can use a wrapper.
SELECT cron.schedule(
    'daily-reminders',
    '0 5 * * *', -- 05:00 UTC is 08:00 EAT
    $$
    SELECT
      net.http_post(
        url:='https://wfiacvliyhvaslsweuug.supabase.co/functions/v1/process-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
);
