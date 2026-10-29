import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sign-up WITHOUT an email: the account signs in with a username. (Sign-up with an email uses normal Supabase auth.)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Sign-up is temporarily unavailable.' }, 503);

  let body: { username?: unknown; password?: unknown; full_name?: unknown; gender?: unknown; avatar?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const fullName = String(body.full_name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const gender = ['male', 'female', 'prefer_not_to_say'].includes(String(body.gender)) ? String(body.gender) : 'prefer_not_to_say';
  if (!fullName) return json({ error: 'Enter your name.' }, 400);
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) return json({ error: 'Username must be 3–32 characters: letters, numbers, dots, underscores or hyphens.' }, 400);
  if (password.length < 8) return json({ error: 'Use a password with at least 8 characters.' }, 400);

  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: taken, error: lookupError } = await service.from('profiles').select('id').ilike('username', username).limit(1);
  if (lookupError) return json({ error: 'Could not check the username. Try again.' }, 500);
  if (taken?.length) return json({ error: 'That username is already taken.' }, 409);

  const [firstName, ...rest] = fullName.split(' ');
  const { error: createError } = await service.auth.admin.createUser({
    email: `${username.toLowerCase()}@users.pocket.local`,
    password,
    email_confirm: true,
    user_metadata: { username, first_name: firstName, last_name: rest.join(' '), full_name: fullName, gender, avatar: String(body.avatar || '').slice(0, 200) || undefined },
  });
  if (createError) return json({ error: /already/i.test(createError.message) ? 'That username is already taken.' : createError.message }, 400);
  return json({ ok: true });
});
