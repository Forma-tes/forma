import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Prefer the canonical production URL so auth emails never redirect to a temporary Vercel preview URL.
export const authRedirectUrl = () => String(import.meta.env.VITE_SITE_URL || window.location.origin).trim().replace(/\/+$/, '');
export const cloudReady = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT') && !supabaseKey.includes('YOUR_SUPABASE'));
export const supabase = cloudReady ? createClient(supabaseUrl, supabaseKey) : null;
