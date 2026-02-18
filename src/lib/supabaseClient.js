import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://lrwsyrsjsshnulbhznax.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyd3N5cnNqc3NobnVsYmh6bmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDk1MzAsImV4cCI6MjA4Njk4NTUzMH0.zrh-NL7gKDNzg1Y9dicyX1NBa0HPVdMtEwpSh5u0BuU';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
