import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://liznlwxkzbsmihrtfwup.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpem5sd3hremJzbWlocnRmd3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTMwOTcsImV4cCI6MjEwNTIyOTA5N30.SveTxHT0ql0p3HcQ0_lRDmjPrGRtNe-PQWxSD_QQwGQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
