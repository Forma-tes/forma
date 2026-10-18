import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminEmail = Deno.env.get('ACCESS_REQUEST_ADMIN_EMAIL');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('ACCESS_REQUEST_FROM_EMAIL');
  if (!adminEmail || !resendKey || !fromEmail) {
    return new Response(JSON.stringify({ error: 'Access request email is not configured on the server.' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await caller.auth.getUser();
  if (userError || !user) return new Response(JSON.stringify({ error: 'Sign in is required.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const service = createClient(supabaseUrl, serviceRoleKey);
  const { data: recent } = await service.from('access_requests').select('id,created_at').eq('user_id', user.id).eq('status', 'pending').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).limit(1);
  if (recent?.length) return new Response(JSON.stringify({ ok: true, alreadyPending: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const name = String(user.user_metadata?.full_name || user.user_metadata?.name || '').slice(0, 160);
  const email = String(user.email || '').slice(0, 320);
  const { error: insertError } = await service.from('access_requests').insert({ user_id: user.id, user_email: email, user_name: name });
  if (insertError) return new Response(JSON.stringify({ error: 'Could not save the access request.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: [adminEmail],
      subject: 'Pocket access request',
      text: `A user requested access to Pocket.\n\nName: ${name || 'Not provided'}\nEmail: ${email || 'Not provided'}\nUser ID: ${user.id}\n\nOpen Pocket Admin → User access to review and enable the required features.`,
    }),
  });
  if (!emailResponse.ok) {
    const { error: updateError } = await service.from('access_requests').update({ status: 'pending' }).eq('user_id', user.id).eq('status', 'pending');
    return new Response(JSON.stringify({ error: 'The request was saved, but the admin notification email could not be sent. Please contact the administrator through the app support channel.' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  await service.from('access_requests').update({ notified_at: new Date().toISOString() }).eq('user_id', user.id).eq('status', 'pending');
  return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
