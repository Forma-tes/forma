import { Check, ChevronDown, Copy, Inbox, MessageSquare, RefreshCw, Settings2, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ModalShell } from '../../components/modals/ModalShell.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { getExpenseCategories, incomeCategories } from '../../lib/categories.js';
import { localISODate } from '../../lib/format.js';
import { isGoalsAccount } from '../../lib/features.js';
import { matchAccount, parseSms } from '../../lib/smsParser.js';

const csv = v => String(v || '').split(/[,\n،]/).map(x => x.trim()).filter(Boolean);
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
const copy = async (text, setToast) => { try { await navigator.clipboard.writeText(text); setToast?.('Copied'); } catch { setToast?.('Could not copy — select and copy manually'); } };

function AccountConfig({ account, cfg, userId, supabase, onSaved, setToast, open, onToggle, categories }) {
  const [f, setF] = useState({ enabled: cfg?.enabled ?? true, senders: (cfg?.senders || []).join(', '), card_last4: (cfg?.card_last4 || []).join(', '), default_category: cfg?.default_category || '', debit_keywords: (cfg?.debit_keywords || []).join(', '), credit_keywords: (cfg?.credit_keywords || []).join(', '), amount_pattern: cfg?.amount_pattern || '' });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(o => ({ ...o, [k]: v }));
  const save = async () => {
    if (f.amount_pattern) { try { new RegExp(f.amount_pattern); } catch { setToast('Amount pattern is not a valid regex'); return; } }
    setBusy(true);
    const row = { account_id: account.id, user_id: userId, enabled: f.enabled, senders: csv(f.senders), card_last4: csv(f.card_last4).map(x => x.replace(/\D/g, '').slice(-4)).filter(x => x.length === 4), default_category: f.default_category || null, debit_keywords: csv(f.debit_keywords), credit_keywords: csv(f.credit_keywords), amount_pattern: f.amount_pattern.trim() || null, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('account_sms_config').upsert(row, { onConflict: 'account_id' }).select().single();
    setBusy(false);
    if (error) { setToast(error.message); return; }
    onSaved(data); setToast(`SMS settings saved for ${account.name}`);
  };
  const configured = cfg && (cfg.senders?.length || cfg.card_last4?.length);
  return <div className={`sms-acc ${open ? 'open' : ''}`}>
    <button type="button" className="sms-acc-head" onClick={onToggle} aria-expanded={open}><span><b>{account.name}</b><small>{configured ? `${(cfg.senders || []).join(', ') || '—'}${cfg.card_last4?.length ? ` · •••• ${cfg.card_last4.join(', ')}` : ''}` : 'Not set up'}</small></span><span className={`sms-pill ${configured && cfg.enabled ? "on" : ""}`}>{configured ? (cfg.enabled ? 'On' : 'Off') : 'Off'}</span><ChevronDown size={16} /></button>
    {open && <div className="sms-acc-body">
      <label className="sms-toggle"><input type="checkbox" checked={f.enabled} onChange={e => set('enabled', e.target.checked)} /> <span>Read bank SMS for this account</span></label>
      <div className="form-grid">
        <Field label="Bank sender name(s)" wide><input value={f.senders} onChange={e => set('senders', e.target.value)} placeholder="CIB, NBE, +201234…" /></Field>
        <Field label="Card / account last 4"><input inputMode="numeric" value={f.card_last4} onChange={e => set('card_last4', e.target.value)} placeholder="1234" /></Field>
        <Field label="Default category"><select value={f.default_category} onChange={e => set('default_category', e.target.value)}><option value="">Choose when approving</option>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
      </div>
      <details className="sms-adv"><summary><Settings2 size={14} /> Parsing rules (optional)</summary>
        <div className="form-grid">
          <Field label="Words that mean money out" wide><input value={f.debit_keywords} onChange={e => set('debit_keywords', e.target.value)} placeholder="purchase, سحب, خصم" /></Field>
          <Field label="Words that mean money in" wide><input value={f.credit_keywords} onChange={e => set('credit_keywords', e.target.value)} placeholder="credited, ايداع, راتب" /></Field>
          <Field label="Custom amount pattern (regex, first group = amount)" wide><input value={f.amount_pattern} onChange={e => set('amount_pattern', e.target.value)} placeholder="Amt:\s*([\d,.]+)" /></Field>
        </div>
      </details>
      <div className="sms-actions"><button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></div>
    </div>}
  </div>;
}

export function SmsHubModal({ accounts, session, supabase, currency = 'EGP', gender = '', initialTab = 'inbox', initialAccountId = null, onClose, onApprove, onPendingChange, setToast }) {
  const userId = session?.user?.id;
  const [tab, setTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [token, setToken] = useState('');
  const [lastSms, setLastSms] = useState(null);
  const [cstep, setCstep] = useState(1);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openAcc, setOpenAcc] = useState(initialAccountId);
  const [platform, setPlatform] = useState(/android/i.test(navigator.userAgent) ? 'android' : 'iphone');
  const [test, setTest] = useState({ sender: '', body: '' });
  const usable = useMemo(() => accounts.filter(a => !isGoalsAccount(a)), [accounts]);
  const expCats = useMemo(() => getExpenseCategories(gender), [gender]);
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co'}/functions/v1/sms-ingest`;

  const load = useCallback(async () => {
    setLoading(true);
    const [i, c, t, h, l] = await Promise.all([
      supabase.from('sms_inbox').select('*').eq('status', 'pending').order('received_at', { ascending: false }),
      supabase.from('account_sms_config').select('*'),
      supabase.from('sms_tokens').select('token').maybeSingle(),
      supabase.from('sms_inbox').select('merchant,category').eq('status', 'approved').not('category', 'is', null).order('created_at', { ascending: false }).limit(300),
      supabase.from('sms_inbox').select('created_at').order('created_at', { ascending: false }).limit(1),
    ]);
    const memo = {}; (h.data || []).forEach(r => { const k = String(r.merchant || '').trim().toLowerCase(); if (k && !memo[k]) memo[k] = r.category; });
    setLastSms(l.data?.[0]?.created_at || null);
    if (i.error || c.error) setToast((i.error || c.error).message.includes('does not exist') ? 'SMS tables are not installed yet — run the SMS migration in Supabase first.' : (i.error || c.error).message);
    setItems((i.data || []).map(x => ({ ...x, _type: x.txn_type || 'Expense', _amount: x.amount ?? '', _cat: x.category || memo[String(x.merchant || '').trim().toLowerCase()] || '', _desc: x.merchant || '', _acc: x.account_id || '' })));
    setConfigs(c.data || []);
    setToken(t.data?.token || '');
    setLoading(false);
  }, [supabase, setToast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { onPendingChange?.(items.length); }, [items.length, onPendingChange]);

  const patch = (id, p) => setItems(o => o.map(x => x.id === id ? { ...x, ...p } : x));
  const approve = async x => {
    const amount = Number(x._amount);
    if (!(amount > 0)) { setToast('Enter the amount first'); return; }
    if (!x._acc) { setToast('Choose the account'); return; }
    const cat = x._cat || (x._type === 'Income' ? 'Other income' : 'Other');
    const acc = accounts.find(a => String(a.id) === String(x._acc));
    const saved = await onApprove({ transaction_date: localISODate(new Date(x.received_at)), type: x._type, category: cat, subcategory: null, description: x._desc || (x.sender ? `SMS · ${x.sender}` : 'Bank SMS'), amount, need_want: x._type === 'Expense' ? 'Need' : null, fixed_variable: 'Variable', payment_method: acc?.name || 'Unassigned', account_id: x._acc, to_account_id: null, goal_id: null, debt_id: null, recurring: false, notes: `From bank SMS: ${x.body}`.slice(0, 500) });
    if (!saved) return;
    await supabase.from('sms_inbox').update({ status: 'approved', transaction_id: saved.id, category: cat, merchant: x._desc || x.merchant || null }).eq('id', x.id);
    setItems(o => o.filter(y => y.id !== x.id));
    setToast('Added to Transactions');
  };
  const approveAll = async () => { const ready = items.filter(x => x._acc && Number(x._amount) > 0); for (const x of ready) { await approve(x); } };
  const sendTest = async () => {
    if (!token) { setToast('Create your token first'); return; }
    setTesting(true);
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, sender: 'Pocket Test', body: 'Test: card ending 0000 was charged EGP 1.00 at Pocket Test' }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { setToast('Test SMS arrived. Check your Inbox.'); await load(); } else setToast(j.error || 'The test did not go through');
    } catch { setToast('Could not reach the SMS address'); }
    setTesting(false);
  };
  const ago = d => { if (!d) return 'No SMS received yet'; const m = Math.round((Date.now() - new Date(d).getTime()) / 60000); return m < 1 ? 'Last SMS: just now' : m < 60 ? `Last SMS: ${m} min ago` : m < 1440 ? `Last SMS: ${Math.round(m / 60)} h ago` : `Last SMS: ${Math.round(m / 1440)} d ago`; };
  const dismiss = async x => { await supabase.from('sms_inbox').update({ status: 'dismissed' }).eq('id', x.id); setItems(o => o.filter(y => y.id !== x.id)); };
  const makeToken = async () => {
    const t = newToken();
    const { error } = await supabase.from('sms_tokens').upsert({ user_id: userId, token: t }, { onConflict: 'user_id' });
    if (error) { setToast(error.message); return; }
    setToken(t); setToast(token ? 'New token created — update your phone automation' : 'Token created');
  };

  const testResult = useMemo(() => {
    if (!test.body.trim()) return null;
    const probe = parseSms(test.body, {});
    const cfg = matchAccount(configs, test.sender, probe.last4);
    const p = parseSms(test.body, cfg || {});
    return { ...p, account: cfg ? accounts.find(a => a.id === cfg.account_id)?.name : null };
  }, [test, configs, accounts]);

  const jsonBody = `{"token":"${token || 'YOUR_TOKEN'}","sender":"<Sender>","body":"<Message>"}`;
  const tabs = [['inbox', 'Inbox', Inbox, items.length], ['accounts', 'Accounts', Settings2], ['connect', 'Connect phone', MessageSquare], ['test', 'Test', Check]];

  return <ModalShell title="Bank SMS" subtitle="Bank messages land here first. You approve them before they become transactions." onClose={onClose} wide>
    <div className="sms-tabs" role="tablist">{tabs.map(([k, l, I, n]) => <button type="button" role="tab" aria-selected={tab === k} key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={15} />{l}{n ? <em>{n}</em> : null}</button>)}</div>

    {tab === 'inbox' && <section className="sms-pane">
      <div className="sms-pane-top"><p>{loading ? 'Loading…' : items.length ? `${items.length} waiting for review` : 'Nothing waiting'}</p><div className="sms-actions">{items.filter(x => x._acc && Number(x._amount) > 0).length > 1 && <button type="button" className="btn btn-primary btn-sm" onClick={approveAll}><Check size={14} /> Approve all ready ({items.filter(x => x._acc && Number(x._amount) > 0).length})</button>}<button type="button" className="btn btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button></div></div>
      {!loading && !items.length && <div className="sms-empty"><MessageSquare size={26} /><b>No SMS yet</b><small>Connect your phone, then new bank messages show up here.</small><button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('connect')}>Connect phone</button></div>}
      {items.map(x => <div className="sms-item" key={x.id}>
        <div className="sms-item-msg"><b>{x.sender || 'Unknown sender'}</b><small>{new Date(x.received_at).toLocaleString()}</small><p dir="auto">{x.body}</p></div>
        {!x.account_id && <p className="sms-warn">No account matched this sender — pick one below.</p>}
        <div className="form-grid">
          <Field label="Type"><select value={x._type} onChange={e => patch(x.id, { _type: e.target.value, _cat: '' })}><option>Expense</option><option>Income</option></select></Field>
          <Field label={`Amount (${currency})`}><input inputMode="decimal" value={x._amount} onChange={e => patch(x.id, { _amount: e.target.value })} /></Field>
          <Field label="Account"><select value={x._acc} onChange={e => patch(x.id, { _acc: e.target.value })}><option value="">Choose…</option>{usable.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
          <Field label="Category"><select value={x._cat} onChange={e => patch(x.id, { _cat: e.target.value })}><option value="">{x._type === 'Income' ? 'Other income' : 'Other'}</option>{(x._type === 'Income' ? incomeCategories : expCats).map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Description" wide><input value={x._desc} onChange={e => patch(x.id, { _desc: e.target.value })} placeholder="Where was it?" /></Field>
        </div>
        <div className="sms-actions"><button type="button" className="btn btn-sm" onClick={() => dismiss(x)}><X size={14} /> Dismiss</button><button type="button" className="btn btn-primary btn-sm" onClick={() => approve(x)}><Check size={14} /> Add transaction</button></div>
      </div>)}
    </section>}

    {tab === 'accounts' && <section className="sms-pane">
      <p className="sms-hint">For each account, tell Pocket which bank sender and card digits belong to it. Messages that match are linked to that account automatically.</p>
      {usable.length ? usable.map(a => <AccountConfig key={a.id + (configs.find(c => c.account_id === a.id)?.updated_at || '')} account={a} cfg={configs.find(c => c.account_id === a.id)} userId={userId} supabase={supabase} categories={expCats} setToast={setToast} open={String(openAcc) === String(a.id)} onToggle={() => setOpenAcc(o => String(o) === String(a.id) ? null : a.id)} onSaved={row => setConfigs(o => [...o.filter(c => c.account_id !== row.account_id), row])} />) : <div className="sms-empty"><b>No accounts yet</b><small>Add an account first.</small></div>}
    </section>}

    {tab === 'connect' && <section className="sms-pane">
      <div className="sms-steps" role="tablist">{[['Token', !!token], ['Bank', configs.some(c => (c.senders || []).length || (c.card_last4 || []).length)], ['Phone', !!lastSms]].map(([l, done], i) => <button type="button" key={l} className={`${cstep === i + 1 ? 'on' : ''} ${done ? 'done' : ''}`} onClick={() => setCstep(i + 1)}><i>{done ? <Check size={12} /> : i + 1}</i>{l}</button>)}</div>
      {cstep === 1 && <div className="sms-card"><h4>Create your private token</h4><p>This tells Pocket the SMS is yours. Never share it.</p>
        {token ? <div className="sms-copy"><code>{token}</code><button type="button" className="icon-btn" aria-label="Copy token" onClick={() => copy(token, setToast)}><Copy size={15} /></button></div> : null}
        <div className="sms-actions"><button type="button" className="btn btn-sm" onClick={makeToken}>{token ? <><RefreshCw size={14} /> Regenerate</> : 'Create token'}</button><button type="button" className="btn btn-primary btn-sm" disabled={!token} onClick={() => setCstep(2)}>Next</button></div></div>}
      {cstep === 2 && <div className="sms-card"><h4>Tell Pocket which bank is which account</h4><p>{configs.filter(c => (c.senders || []).length || (c.card_last4 || []).length).length ? `${configs.filter(c => (c.senders || []).length || (c.card_last4 || []).length).length} account(s) set up.` : 'Add the bank name and the last 4 digits for each account.'}</p>
        <div className="sms-actions"><button type="button" className="btn btn-sm" onClick={() => setTab('accounts')}><Settings2 size={14} /> Set up accounts</button><button type="button" className="btn btn-sm" onClick={() => setCstep(1)}>Back</button><button type="button" className="btn btn-primary btn-sm" onClick={() => setCstep(3)}>Next</button></div></div>}
      {cstep === 3 && <>
        <div className="sms-card"><h4>Forward the SMS from your phone</h4>
          <div className="sms-seg"><button type="button" className={platform === 'iphone' ? 'on' : ''} onClick={() => setPlatform('iphone')}>iPhone</button><button type="button" className={platform === 'android' ? 'on' : ''} onClick={() => setPlatform('android')}>Android</button></div>
          <p>Webhook address</p><div className="sms-copy"><code>{endpoint}</code><button type="button" className="icon-btn" aria-label="Copy address" onClick={() => copy(endpoint, setToast)}><Copy size={15} /></button></div>
          {platform === 'android' && <><p>Body (JSON)</p><div className="sms-copy"><code>{jsonBody}</code><button type="button" className="icon-btn" aria-label="Copy body" onClick={() => copy(jsonBody, setToast)}><Copy size={15} /></button></div></>}
          {platform === 'iphone' ? <ol>
            <li>Open <b>Shortcuts</b> → <b>Automation</b> → <b>+</b> → <b>Message</b>.</li>
            <li>Choose your bank as <b>Sender</b> (or <b>Message Contains</b> <code>EGP</code>). Pick <b>Run Immediately</b>.</li>
            <li>Add <b>Get Contents of URL</b>: URL = the address above, Method <b>POST</b>, Request Body <b>JSON</b>.</li>
            <li>Fields: <code>token</code> = your token · <code>sender</code> = <i>Shortcut Input → Sender</i> · <code>body</code> = <i>Shortcut Input → Content</i>.</li>
          </ol> : <ol>
            <li>Install <b>SMS Forwarder</b> and allow SMS access.</li>
            <li>New rule: sender contains your bank → forward to <b>Webhook</b> (POST, <code>application/json</code>).</li>
            <li>Paste the address and the JSON body above.</li>
          </ol>}</div>
        <div className="sms-card"><h4>Check it works</h4><p>{ago(lastSms)}</p>
          <div className="sms-actions"><button type="button" className="btn btn-sm" onClick={() => setCstep(2)}>Back</button><button type="button" className="btn btn-primary btn-sm" disabled={testing} onClick={sendTest}>{testing ? 'Sending…' : 'Send a test SMS'}</button></div>
          <p className="sms-hint">The test appears in your Inbox. Dismiss it after checking.</p></div></>}
    </section>}

    {tab === 'test' && <section className="sms-pane">
      <p className="sms-hint">Paste a bank SMS to see how Pocket reads it. Nothing is saved.</p>
      <div className="form-grid"><Field label="Sender (optional)"><input value={test.sender} onChange={e => setTest(o => ({ ...o, sender: e.target.value }))} placeholder="CIB" /></Field><Field label="Message" wide><textarea rows={4} dir="auto" value={test.body} onChange={e => setTest(o => ({ ...o, body: e.target.value }))} placeholder="Paste the SMS here" /></Field></div>
      {testResult && <div className="sms-result"><div><small>Type</small><b>{testResult.type === 'Income' ? 'Money in' : testResult.type === 'Expense' ? 'Money out' : 'Not detected'}</b></div><div><small>Amount</small><b>{testResult.amount ?? 'Not detected'}</b></div><div><small>Merchant</small><b>{testResult.merchant || '—'}</b></div><div><small>Account</small><b>{testResult.account || 'No match'}</b></div></div>}
    </section>}
  </ModalShell>;
}
