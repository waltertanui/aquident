import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Twilio credentials (ensure these are kept secret)
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER") ?? "";

// Supabase configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle HTTP requests
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date().toISOString().split('T')[0];
    const todayObj = new Date();

    let body: any = {};
    try {
        body = await req.json();
    } catch (e) {
        // body remains empty
    }

    const results: any[] = [];

    // 1. Manual reminder for specific appointment
    if (body.manual && body.appointment_id) {
        const { data: apt } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', body.appointment_id)
            .single();

        if (apt && apt.patient_contacts) {
            const msg = `Reminder: ${apt.patient_name}, you have an appointment today at ${apt.appointment_time || "8:00 AM"} at Aquadent Dental Clinic.`;
            const sid = await sendSms(apt.patient_contacts, msg);
            await logNotification(supabase, apt.patient_no, apt.id, 'manual_reminder', apt.patient_contacts, sid);
            results.push({ type: 'manual_reminder', patient: apt.patient_name });
        }
    } else {
        // 2. Process Birthdays
        const { data: birthdayPatients } = await supabase
            .from('walkins')
            .select('no, name, contacts, dob')
            .not('dob', 'is', null);

        for (const patient of (birthdayPatients || [])) {
            const dob = new Date(patient.dob);
            if (dob.getMonth() === todayObj.getMonth() && dob.getDate() === todayObj.getDate()) {
                // Check if already sent today
                const { data: existing } = await supabase
                    .from('notification_logs')
                    .select('id')
                    .eq('patient_no', patient.no)
                    .eq('type', 'birthday')
                    .gte('sent_at', today + 'T00:00:00')
                    .single();

                if (!existing && patient.contacts) {
                    const msg = `Happy Birthday ${patient.name}! Wishing you a wonderful day from Aquadent Dental Clinic.`;
                    const sid = await sendSms(patient.contacts, msg);
                    await logNotification(supabase, patient.no, null, 'birthday', patient.contacts, sid);
                    results.push({ type: 'birthday', patient: patient.name });
                }
            }
        }

        // 3. Process Appointment Reminders (2d, 1d, 0d)
        const reminderWindows = [
            { days: 2, type: 'reminder_2d', msg: (name: string, date: string, time: string) => `Reminder: ${name}, you have an appointment in 2 days on ${date} at ${time} at Aquadent Dental Clinic.` },
            { days: 1, type: 'reminder_1d', msg: (name: string, date: string, time: string) => `Reminder: ${name}, you have an appointment tomorrow ${date} at ${time} at Aquadent Dental Clinic.` },
            { days: 0, type: 'reminder_0d', msg: (name: string, date: string, time: string) => `Reminder: ${name}, you have an appointment today at ${time} at Aquadent Dental Clinic.` },
        ];

        for (const window of reminderWindows) {
            const targetDate = new Date();
            targetDate.setDate(todayObj.getDate() + window.days);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            const { data: upcomingApts } = await supabase
                .from('appointments')
                .select('*')
                .eq('appointment_date', targetDateStr)
                .eq('status', 'scheduled');

            for (const apt of (upcomingApts || [])) {
                if (!apt.patient_contacts) continue;

                const { data: existing } = await supabase
                    .from('notification_logs')
                    .select('id')
                    .eq('appointment_id', apt.id)
                    .eq('type', window.type)
                    .single();

                if (!existing) {
                    const msg = window.msg(apt.patient_name, apt.appointment_date, apt.appointment_time || "8:00 AM");
                    const sid = await sendSms(apt.patient_contacts, msg);
                    await logNotification(supabase, apt.patient_no, apt.id, window.type, apt.patient_contacts, sid);
                    results.push({ type: window.type, patient: apt.patient_name });
                }
            }
        }
    }

    return new Response(JSON.stringify({ status: 'success', processed: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
});

// Send SMS using Twilio API
async function sendSms(to: string, message: string) {
    const normalizedTo = normalizePhoneNumber(to);
    const params = new URLSearchParams();
    params.append('To', normalizedTo);
    params.append('From', TWILIO_PHONE_NUMBER);
    params.append('Body', message);

    try {
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Twilio API error:', data);
            return 'error';
        }
        return data.sid || 'error';
    } catch (err) {
        console.error('Fetch error:', err);
        return 'error';
    }
}

// Normalize phone numbers to E.164 format
function normalizePhoneNumber(phone: string) {
    let clean = phone.replace(/\D/g, '');
    // Handle Kenyan numbers (e.g., 0711... or 711...)
    if (clean.startsWith('0')) {
        clean = '254' + clean.substring(1);
    } else if (clean.length === 9 && (clean.startsWith('7') || clean.startsWith('1'))) {
        clean = '254' + clean;
    }

    if (!clean.startsWith('+')) {
        clean = '+' + clean;
    }
    return clean;
}

// Log notifications in Supabase
async function logNotification(supabase: any, patientNo: number | null, aptId: number | null, type: string, phone: string, sid: string) {
    await supabase.from('notification_logs').insert({
        patient_no: patientNo,
        appointment_id: aptId,
        type: type,
        status: sid !== 'error' ? 'sent' : 'failed',
        phone_number: phone,
        message_sid: sid
    });
}
