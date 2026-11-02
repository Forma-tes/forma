// Receives a bank SMS forwarded from the user's phone (iPhone Shortcuts / Android MacroDroid)
// and records it as a Pocket transaction.
//
// Deploy with JWT verification OFF — the phone has no Supabase session. Instead every request
// must carry the user's personal SMS key (generated in Pocket → Settings → SMS auto-import):
//   POST https://<project>.supabase.co/functions/v1/sms-ingest
//   Header: x-pocket-key: <key>        (or JSON body field "key")
//   Body:   {"text": "<full SMS text>"}  (plain-text body also accepted)
//   supabase functions deploy sms-ingest --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseBankSms } from './parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pocket-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
});

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const cairoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ ok: false, error: 'Server configuration is incomplete.' }, 503);

  // Accept JSON {text, key} or a plain-text body.
  const rawBody = await req.text();
  let text = rawBody, bodyKey = '';
  try {
    const parsed = JSON.parse(rawBody);
    if (parsed && typeof parsed === 'object') { text = String(parsed.text ?? parsed.message ?? parsed.sms ?? ''); bodyKey = String(parsed.key ?? ''); }
  } catch { /* plain text body */ }
  text = String(text || '').slice(0, 2000).trim();

  const key = (req.headers.get('x-pocket-key') || bodyKey || new URL(req.url).searchParams.get('key') || '').trim();
  if (key.length < 20) return json({ ok: false, error: 'Missing or invalid SMS key.' }, 401);
  if (!text) return json({ ok: false, error: 'Message text is empty.' }, 400);

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: tokenRow } = await db.from('sms_ingest_tokens').select('user_id').eq('token_hash', await sha256Hex(key)).maybeSingle();
  if (!tokenRow?.user_id) return json({ ok: false, error: 'Missing or invalid SMS key.' }, 401);
  const userId = tokenRow.user_id;
  await db.from('sms_ingest_tokens').update({ last_used_at: new Date().toISOString() }).eq('user_id', userId);

  const result = parseBankSms(text, cairoToday());
  const logBase = { user_id: userId, raw_text: text };

  if (!result.ok) {
    await db.from('sms_inbox').insert({ ...logBase, status: 'unparsed', detail: result.reason });
    return json({ ok: true, imported: false, status: 'unparsed', reason: result.reason });
  }

  // Match the account by its last 4 digits (set in Settings → SMS auto-import).
  let accountId: string | null = null;
  if (result.accountRef) {
    const { data: account } = await db.from('financial_accounts').select('id').eq('user_id', userId).eq('sms_account_ref', result.accountRef).maybeSingle();
    accountId = account?.id ?? null;
  }

  // The bank's transaction number prevents double-recording the same SMS.
  const externalRef = 'sms:' + (result.reference || await sha256Hex(text));
  const { data: existing } = await db.from('transactions').select('id').eq('user_id', userId).eq('external_ref', externalRef).maybeSingle();
  if (existing) {
    await db.from('sms_inbox').insert({ ...logBase, status: 'duplicate', transaction_id: existing.id, detail: externalRef });
    return json({ ok: true, imported: false, status: 'duplicate', transactionId: existing.id });
  }

  const isIncome = result.type === 'Income';
  const { data: inserted, error } = await db.from('transactions').insert({
    user_id: userId,
    transaction_date: result.date,
    type: result.type,
    category: isIncome ? 'Other income' : 'Other',
    description: result.description,
    amount: result.amount,
    need_want: isIncome ? null : 'Need',
    fixed_variable: 'Variable',
    payment_method: result.paymentMethod,
    recurring: false,
    notes: `Imported from bank SMS${result.time ? ' · ' + result.time : ''}${result.reference ? ' · Ref ' + result.reference : ''}`,
    account_id: accountId,
    external_ref: externalRef,
    source: 'sms',
    needs_review: true,
  }).select('id').single();

  if (error || !inserted) {
    console.error('sms-ingest insert failed', { userId, code: error?.code, message: error?.message });
    await db.from('sms_inbox').insert({ ...logBase, status: 'error', detail: error?.message?.slice(0, 300) || 'insert failed' });
    return json({ ok: false, error: 'Could not save the transaction.' }, 500);
  }

  await db.from('sms_inbox').insert({ ...logBase, status: 'imported', transaction_id: inserted.id, detail: accountId ? null : 'no_matching_account' });
  return json({ ok: true, imported: true, status: 'imported', transactionId: inserted.id, type: result.type, amount: result.amount, date: result.date });
});
