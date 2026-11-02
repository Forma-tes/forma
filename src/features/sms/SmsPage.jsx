import { Check, ChevronDown, Copy, Inbox, History, MessageSquare, Pencil, RefreshCw, RotateCcw, Search, Settings2, X, Clock, CheckCircle2, Download, FileSpreadsheet, FileText, Plus, Scissors, Trash2, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Field } from '../../components/ui/Field.jsx';
import { PageHeading } from '../../components/ui/PageHeading.jsx';
import { getExpenseCategories, incomeCategories } from '../../lib/categories.js';
import { localISODate } from '../../lib/format.js';
import { isGoalsAccount } from '../../lib/features.js';
import { accountFlows, money } from '../../lib/credit.js';
import { exportTable } from '../../lib/transferFile.js';
import { MenuButton } from '../../components/ui/MenuButton.jsx';
import { buildAmountPattern, findBalance, findLast4, matchAccount, normalizeDigits, parseSms } from '../../lib/smsParser.js';

const csv = v => String(v || '').split(/[,\n،]/).map(x => x.trim()).filter(Boolean);
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
const copy = async (text, setToast) => { try { await navigator.clipboard.writeText(text); setToast?.('Copied'); } catch { setToast?.('Could not copy — select and copy manually'); } };

function AccountConfig({ account, cfg, userId, supabase, onSaved, setToast, open, onToggle, categories }) {
  const [f, setF] = useState({ enabled: cfg?.enabled ?? true, senders: (cfg?.senders || []).join(', '), card_last4: (cfg?.card_last4 || []).join(', '), default_category: cfg?.default_category || '', debit_keywords: (cfg?.debit_keywords || []).join(', '), credit_keywords: (cfg?.credit_keywords || []).join(', '), amount_pattern: cfg?.amount_pattern || '' });
  const [rules, setRules] = useState(cfg?.auto_rules || []);
  const [sample, setSample] = useState({ body: '', amt: '' });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(o => ({ ...o, [k]: v }));
  const save = async () => {
    if (f.amount_pattern) { try { new RegExp(f.amount_pattern); } catch { setToast('Amount pattern is not a valid regex'); return; } }
    setBusy(true);
    const row = { account_id: account.id, user_id: userId, enabled: f.enabled, senders: csv(f.senders), card_last4: csv(f.card_last4).map(x => x.replace(/\D/g, '').slice(-4)).filter(x => x.length === 4), default_category: f.default_category || null, debit_keywords: csv(f.debit_keywords), credit_keywords: csv(f.credit_keywords), amount_pattern: f.amount_pattern.trim() || null, auto_rules: rules.filter(r => String(r.merchant || '').trim() && Number(r.max) > 0).map(r => ({ merchant: String(r.merchant).trim(), max: Number(r.max) })), updated_at: new Date().toISOString() };
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
        <div className="sms-helper"><b>Pattern helper</b><small>Paste one SMS from this bank and type the amount as you see it. Pocket builds the pattern for you.</small>
          <textarea rows={3} dir="auto" value={sample.body} onChange={e => setSample(o => ({ ...o, body: e.target.value }))} placeholder="Paste a sample SMS" />
          <div className="sms-helper-row"><input inputMode="decimal" value={sample.amt} onChange={e => setSample(o => ({ ...o, amt: e.target.value }))} placeholder="Amount in the SMS, e.g. 450.00" /><button type="button" className="btn btn-sm" onClick={() => { const pat = buildAmountPattern(sample.body, sample.amt); if (!pat) { setToast('Could not find that amount in the SMS'); return; } set('amount_pattern', pat); setToast('Pattern created. Press Save to keep it.'); }}>Build pattern</button></div>
        </div>
      </details>
      <div className="sms-rules"><b>Auto-approve</b><small>Messages from these merchants are added to Transactions by themselves, up to the limit. Works when this page is open.</small>
        {rules.map((r, i) => <div className="sms-rule" key={i}><input value={r.merchant} onChange={e => setRules(o => o.map((x, j) => j === i ? { ...x, merchant: e.target.value } : x))} placeholder="Merchant, e.g. Uber" /><input inputMode="decimal" value={r.max} onChange={e => setRules(o => o.map((x, j) => j === i ? { ...x, max: e.target.value } : x))} placeholder="Up to" /><button type="button" className="icon-btn" aria-label="Remove rule" onClick={() => setRules(o => o.filter((_, j) => j !== i))}><Trash2 size={15} /></button></div>)}
        <button type="button" className="btn btn-sm" onClick={() => setRules(o => [...o, { merchant: '', max: '' }])}><Plus size={14} /> Add rule</button></div>
      <div className="sms-actions"><button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></div>
    </div>}
  </div>;
}

const ago = d => { if (!d) return 'No SMS yet'; const m = Math.round((Date.now() - new Date(d).getTime()) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const mapPending = (x, cfgs, memo) => {
  const cfg = x.account_id ? cfgs.find(k => k.account_id === x.account_id) : matchAccount(cfgs, x.sender, findLast4(normalizeDigits(x.body)));
  return { ...x, account_id: x.account_id || cfg?.account_id || null, _type: x.txn_type || 'Expense', _amount: x.amount ?? '', _cat: x.category || memo[String(x.merchant || '').trim().toLowerCase()] || cfg?.default_category || '', _desc: x.merchant || '', _acc: x.account_id || cfg?.account_id || '' };
};
const isNoise = x => x.amount == null && !x.txn_type;

function SmsCard({ x, usable, expCats, currency, fmt, patch, onApprove, onDismiss, onRemember, editing, setEditing, selectMode, selected, onSelect, dup, bal }) {
  const [open, setOpen] = useState(false);
  const accName = usable.find(a => String(a.id) === String(x._acc))?.name;
  const isIn = x._type === 'Income';
  const amt = Number(x._amount);
  const last4 = findLast4(normalizeDigits(x.body));
  const cats = isIn ? incomeCategories : expCats;
  const splits = x._splits || null;
  const splitSum = splits ? splits.reduce((n, r) => n + (Number(r.amount) || 0), 0) : 0;
  const remain = amt - splitSum;
  const startEdit = () => { patch(x.id, { _snap: { _type: x._type, _amount: x._amount, _acc: x._acc, _cat: x._cat, _desc: x._desc, _splits: x._splits || null } }); setEditing(x.id, true); };
  const cancelEdit = () => { if (x._snap) patch(x.id, { ...x._snap, _snap: null }); setEditing(x.id, false); };
  const setSplit = (i, k, v) => patch(x.id, { _splits: splits.map((r, j) => j === i ? { ...r, [k]: v } : r) });
  return <article className={`smx-card ${isIn ? 'in' : 'out'} ${editing ? 'editing' : ''} ${selected ? 'picked' : ''}`}>
    <div className="smx-meta">
      {selectMode && <input type="checkbox" className="smx-check" checked={!!selected} onChange={() => onSelect(x.id)} aria-label="Select this SMS" />}
      <span className="smx-av" aria-hidden="true">{(x.sender || '?').trim().charAt(0).toUpperCase()}</span>
      <small>{x.sender || 'Unknown sender'} · {new Date(x.received_at).toLocaleString()}</small>
    </div>
    <div className="smx-hero"><div className={`smx-big ${isIn ? 'in' : 'out'}`}>{amt > 0 ? `${isIn ? '+' : '−'}${fmt(amt)}` : 'No amount'}</div>{x._desc && <b className="smx-title">{x._desc}</b>}</div>
    {!editing ? <div className="smx-chips"><span className="smx-chip">{accName || 'No account'}</span><span className="smx-chip">{splits ? `Split in ${splits.length}` : (x._cat || (isIn ? 'Other income' : 'Other'))}</span><span className="smx-chip soft">{isIn ? 'Money in' : 'Money out'}</span></div> : <div className="form-grid smx-edit">
      <Field label="Type"><select value={x._type} onChange={e => patch(x.id, { _type: e.target.value, _cat: '', _splits: null })}><option>Expense</option><option>Income</option></select></Field>
      <Field label={`Amount (${currency})`}><input inputMode="decimal" value={x._amount} onChange={e => patch(x.id, { _amount: e.target.value })} /></Field>
      <Field label="Account"><select value={x._acc} onChange={e => patch(x.id, { _acc: e.target.value })}><option value="">Choose…</option>{usable.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
      {!splits && <Field label="Category"><select value={x._cat} onChange={e => patch(x.id, { _cat: e.target.value })}><option value="">{isIn ? 'Other income' : 'Other'}</option>{cats.map(c => <option key={c}>{c}</option>)}</select></Field>}
      <Field label="Description" wide><input value={x._desc} onChange={e => patch(x.id, { _desc: e.target.value })} placeholder="Where was it?" /></Field>
      {splits && <div className="smx-splits wide">{splits.map((r, i) => <div className="smx-split" key={i}><select value={r.cat} onChange={e => setSplit(i, 'cat', e.target.value)} aria-label="Category"><option value="">{isIn ? 'Other income' : 'Other'}</option>{cats.map(c => <option key={c}>{c}</option>)}</select><input inputMode="decimal" value={r.amount} onChange={e => setSplit(i, 'amount', e.target.value)} placeholder="Amount" aria-label="Part amount" /><button type="button" className="icon-btn" aria-label="Remove part" onClick={() => patch(x.id, { _splits: splits.length > 2 ? splits.filter((_, j) => j !== i) : null })}><Trash2 size={15} /></button></div>)}
        <div className="smx-split-foot"><button type="button" className="btn btn-sm" onClick={() => patch(x.id, { _splits: [...splits, { cat: '', amount: remain > 0 ? String(Math.round(remain * 100) / 100) : '' }] })}><Plus size={14} /> Add part</button><small className={Math.abs(remain) < 0.01 ? 'ok' : 'bad'}>{Math.abs(remain) < 0.01 ? 'Parts add up' : remain > 0 ? `${fmt(remain)} left to assign` : `${fmt(-remain)} too much`}</small></div></div>}
      {!splits && amt > 0 && <button type="button" className="sms-link smx-splitbtn" onClick={() => patch(x.id, { _splits: [{ cat: x._cat, amount: String(Math.round(amt / 2 * 100) / 100) }, { cat: '', amount: String(Math.round(amt / 2 * 100) / 100) }] })}><Scissors size={13} /> Split into categories</button>}
    </div>}
    <button type="button" className={`smx-quote ${open ? 'open' : ''}`} dir="auto" onClick={() => setOpen(o => !o)} aria-expanded={open}>{x.body}</button>
    {dup && <p className="smx-alert"><TriangleAlert size={14} /> Looks like “{dup.description || dup.category}” on {dup.transaction_date} is already in Transactions.</p>}
    {bal && <p className={`smx-bal ${bal.ok ? 'ok' : 'bad'}`}>{bal.ok ? `Balance matches the bank (${fmt(bal.sms)}) after adding this.` : `Bank says ${fmt(bal.sms)}, Pocket would show ${fmt(bal.expected)} (difference ${bal.diff > 0 ? '+' : '−'}${fmt(Math.abs(bal.diff))}).`}</p>}
    {!x.account_id && !editing && <p className="sms-warn">{x._acc ? <>Matched by guess. <button type="button" className="sms-link" onClick={() => onRemember(x)}>Remember {x.sender || 'this sender'}{last4 ? ` · ••${last4}` : ''} for {accName}</button></> : 'No account matched. Tap Edit to choose one.'}</p>}
    {!x.account_id && editing && x._acc && <p className="sms-warn"><button type="button" className="sms-link" onClick={() => onRemember(x)}>Remember {x.sender || 'this sender'}{last4 ? ` · ••${last4}` : ''} for {accName}</button></p>}
    <div className="smx-tear" />
    <footer className="smx-foot">
      <button type="button" className="btn btn-sm" onClick={() => onDismiss(x)}><X size={14} /> Dismiss</button>
      <span className="smx-spacer" />
      {editing ? <button type="button" className="btn btn-sm" onClick={cancelEdit}>Cancel edit</button> : <button type="button" className="btn btn-sm" onClick={startEdit}><Pencil size={14} /> Edit</button>}
      <button type="button" className="btn btn-primary btn-sm" onClick={() => onApprove(x)}><Check size={14} /> Approve</button>
    </footer>
  </article>;
}

export function SmsPage({ accounts, transactions = [], session, supabase, currency = 'EGP', gender = '', onApprove, onPendingChange, setToast }) {
  const userId = session?.user?.id;
  const [tab, setTab] = useState('inbox');
  const [items, setItems] = useState([]);
  const [hist, setHist] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [token, setToken] = useState('');
  const [lastSms, setLastSms] = useState(null);
  const [cstep, setCstep] = useState(1);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openAcc, setOpenAcc] = useState(null);
  const [editingIds, setEditingIds] = useState({});
  const [selectMode, setSelectMode] = useState(false);
  const [sel, setSel] = useState([]);
  const [bulk, setBulk] = useState({ cat: '', acc: '' });
  const [fAcc, setFAcc] = useState('');
  const [q, setQ] = useState('');
  const [hStatus, setHStatus] = useState('all');
  const [hFrom, setHFrom] = useState('');
  const [platform, setPlatform] = useState(/android/i.test(navigator.userAgent) ? 'android' : 'iphone');
  const [test, setTest] = useState({ sender: '', body: '' });
  const usable = useMemo(() => accounts.filter(a => !isGoalsAccount(a)), [accounts]);
  const expCats = useMemo(() => getExpenseCategories(gender), [gender]);
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co'}/functions/v1/sms-ingest`;

  const load = useCallback(async () => {
    setLoading(true);
    const [i, c, t, h] = await Promise.all([
      supabase.from('sms_inbox').select('*').eq('status', 'pending').order('received_at', { ascending: false }),
      supabase.from('account_sms_config').select('*'),
      supabase.from('sms_tokens').select('token').maybeSingle(),
      supabase.from('sms_inbox').select('*').in('status', ['approved', 'dismissed']).order('received_at', { ascending: false }).limit(300),
    ]);
    const hrows = h.data || [];
    const memo = {}; hrows.filter(r => r.status === 'approved' && r.category).forEach(r => { const k = String(r.merchant || '').trim().toLowerCase(); if (k && !memo[k]) memo[k] = r.category; });
    const all = [...(i.data || []), ...hrows];
    setLastSms(all.reduce((m, r) => (!m || r.created_at > m ? r.created_at : m), null));
    if (i.error || c.error) { const e = i.error || c.error; setToast(e.message.includes('does not exist') ? 'SMS tables are not installed yet — run the SMS migration in Supabase first.' : e.message); }
    setItems((i.data || []).map(x => mapPending(x, c.data || [], memo)));
    setHist(hrows);
    setConfigs(c.data || []);
    setToken(t.data?.token || '');
    setLoading(false);
  }, [supabase, setToast]);
  useEffect(() => { load(); }, [load]);
  const live = useRef({ items: [], configs: [], hist: [] });
  live.current = { items, configs, hist };
  const poll = useCallback(async () => {
    const { data } = await supabase.from('sms_inbox').select('*').eq('status', 'pending').order('received_at', { ascending: false });
    if (!data) return;
    const have = new Set(live.current.items.map(x => x.id));
    const fresh = data.filter(x => !have.has(x.id));
    if (!fresh.length) return;
    const memo = {}; live.current.hist.filter(r => r.status === 'approved' && r.category).forEach(r => { const k = String(r.merchant || '').trim().toLowerCase(); if (k && !memo[k]) memo[k] = r.category; });
    const mapped = fresh.map(x => mapPending(x, live.current.configs, memo));
    setItems(o => [...mapped.filter(m => !o.some(y => y.id === m.id)), ...o]);
    setLastSms(new Date().toISOString());
    setToast(fresh.length === 1 ? 'New SMS arrived' : `${fresh.length} new SMS arrived`);
  }, [supabase, setToast]);
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') poll(); };
    const id = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, [poll]);
  const payments = useMemo(() => items.filter(x => !isNoise(x)), [items]);
  const noise = useMemo(() => items.filter(isNoise), [items]);
  useEffect(() => { onPendingChange?.(items.length); }, [items.length, onPendingChange]);

  const patch = (id, p) => setItems(o => o.map(x => x.id === id ? { ...x, ...p } : x));
  const setEditing = (id, v) => setEditingIds(o => ({ ...o, [id]: v }));
  const approve = async x => {
    const amount = Number(x._amount);
    if (!(amount > 0)) { setEditing(x.id, true); setToast('Enter the amount first'); return false; }
    if (!x._acc) { setEditing(x.id, true); setToast('Choose the account'); return false; }
    const parts = x._splits || null;
    if (parts && Math.abs(amount - parts.reduce((n, r) => n + (Number(r.amount) || 0), 0)) >= 0.01) { setEditing(x.id, true); setToast('The split parts must add up to the full amount'); return false; }
    const acc = accounts.find(a => String(a.id) === String(x._acc));
    const list = parts ? parts.map((r, i) => ({ cat: r.cat || (x._type === 'Income' ? 'Other income' : 'Other'), amount: Number(r.amount), label: `${x._desc || (x.sender ? `SMS · ${x.sender}` : 'Bank SMS')} (${i + 1}/${parts.length})` })) : [{ cat: x._cat || (x._type === 'Income' ? 'Other income' : 'Other'), amount, label: x._desc || (x.sender ? `SMS · ${x.sender}` : 'Bank SMS') }];
    let first = null;
    for (const part of list) {
      const saved = await onApprove({ transaction_date: localISODate(new Date(x.received_at)), type: x._type, category: part.cat, subcategory: null, description: part.label, amount: part.amount, need_want: x._type === 'Expense' ? 'Need' : null, fixed_variable: 'Variable', payment_method: acc?.name || 'Unassigned', account_id: x._acc, to_account_id: null, goal_id: null, debt_id: null, recurring: false, notes: `From bank SMS: ${x.body}`.slice(0, 500) });
      if (!saved) return false;
      first = first || saved;
    }
    const cat = list.length > 1 ? 'Split' : list[0].cat;
    const upd = { status: 'approved', transaction_id: first.id, category: cat, merchant: x._desc || x.merchant || null, amount, txn_type: x._type, account_id: x._acc };
    await supabase.from('sms_inbox').update(upd).eq('id', x.id);
    setItems(o => o.filter(y => y.id !== x.id));
    setHist(o => [{ ...x, ...upd }, ...o]);
    setToast(list.length > 1 ? `Added ${list.length} transactions` : 'Added to Transactions');
    return true;
  };
  const approveAll = async () => { for (const x of shown.filter(y => y._acc && Number(y._amount) > 0)) await approve(x); };
  const dismiss = async x => { await supabase.from('sms_inbox').update({ status: 'dismissed' }).eq('id', x.id); setItems(o => o.filter(y => y.id !== x.id)); setHist(o => [{ ...x, status: 'dismissed' }, ...o]); };
  const restore = async x => { const { error } = await supabase.from('sms_inbox').update({ status: 'pending' }).eq('id', x.id); if (error) { setToast(error.message); return; } setToast('Moved back to Inbox'); await load(); };
  const remember = async x => {
    const acc = accounts.find(a => String(a.id) === String(x._acc)); if (!acc) { setToast('Choose the account first'); return; }
    const cur = configs.find(c => c.account_id === acc.id);
    const last4 = findLast4(normalizeDigits(x.body));
    const senders = [...new Set([...(cur?.senders || []), ...(x.sender ? [x.sender] : [])])];
    const card_last4 = [...new Set([...(cur?.card_last4 || []), ...(last4 ? [last4] : [])])];
    const row = { account_id: acc.id, user_id: userId, enabled: true, senders, card_last4, default_category: cur?.default_category || null, debit_keywords: cur?.debit_keywords || [], credit_keywords: cur?.credit_keywords || [], amount_pattern: cur?.amount_pattern || null, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('account_sms_config').upsert(row, { onConflict: 'account_id' }).select().single();
    if (error) { setToast(error.message); return; }
    setConfigs(o => [...o.filter(c => c.account_id !== data.account_id), data]);
    setItems(o => o.map(y => y.id === x.id ? { ...y, account_id: acc.id } : y));
    setToast(`Next time, ${x.sender || 'this sender'} goes to ${acc.name} automatically`);
  };
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
  const makeToken = async () => {
    const t = newToken();
    const { error } = await supabase.from('sms_tokens').upsert({ user_id: userId, token: t }, { onConflict: 'user_id' });
    if (error) { setToast(error.message); return; }
    setToken(t); setToast(token ? 'New token created — update your phone automation' : 'Token created');
  };

  const needle = q.trim().toLowerCase();
  const hit = x => !needle || `${x.body} ${x.sender || ''} ${x._desc || x.merchant || ''}`.toLowerCase().includes(needle);
  const shown = payments.filter(x => hit(x) && (!fAcc || (fAcc === 'none' ? !x._acc : String(x._acc) === String(fAcc))));
  const histShown = hist.filter(x => hit(x) && (hStatus === 'all' || x.status === hStatus) && (!fAcc || String(x.account_id) === String(fAcc)) && (!hFrom || localISODate(new Date(x.received_at)) >= hFrom));
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const approvedMonth = hist.filter(x => x.status === 'approved' && new Date(x.received_at) >= monthStart).length;
  const dupFor = x => { const amt = Number(x._amount); if (!(amt > 0) || !x._acc) return null; const d = new Date(x.received_at).getTime(); return transactions.find(t => String(t.account_id) === String(x._acc) && t.type === x._type && Math.abs(Number(t.amount) - amt) < 0.005 && Math.abs(new Date(t.transaction_date).getTime() - d) <= 1.5 * 864e5) || null; };
  const balFor = x => { const sb = findBalance(x.body); const acc = usable.find(a => String(a.id) === String(x._acc)); const amt = Number(x._amount); if (sb == null || !acc || !(amt > 0)) return null; const expected = accountFlows(acc, transactions).balance + (x._type === 'Income' ? amt : -amt); const diff = sb - expected; return { sms: sb, expected, diff, ok: Math.abs(diff) < 0.5 }; };
  const autoMatch = x => { const cfg = configs.find(c => String(c.account_id) === String(x._acc)); const hay = `${x._desc} ${x.body}`.toLowerCase(); const amt = Number(x._amount); return x._type === 'Expense' && amt > 0 && (cfg?.auto_rules || []).some(r => r.merchant && hay.includes(String(r.merchant).toLowerCase()) && amt <= Number(r.max)); };
  const autoDone = useRef(new Set());
  useEffect(() => {
    if (loading) return;
    const todo = items.filter(x => !isNoise(x) && x._acc && !autoDone.current.has(x.id) && autoMatch(x) && !dupFor(x));
    if (!todo.length) return;
    todo.forEach(x => autoDone.current.add(x.id));
    (async () => { let n = 0; for (const x of todo) { if (await approve(x)) n++; } if (n) setToast(`Auto-approved ${n} SMS`); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading, configs]);
  const picked = shown.filter(x => sel.includes(x.id));
  const toggleSel = id => setSel(o => o.includes(id) ? o.filter(i => i !== id) : [...o, id]);
  const bulkApply = () => { picked.forEach(x => patch(x.id, { ...(bulk.cat ? { _cat: bulk.cat, _splits: null } : {}), ...(bulk.acc ? { _acc: bulk.acc } : {}) })); setToast(`Updated ${picked.length} SMS`); };
  const bulkApprove = async () => { for (const x of picked) await approve(x); setSel([]); };
  const bulkDismiss = async () => { for (const x of picked) await dismiss(x); setSel([]); };
  const exportHist = fmtName => exportTable(fmtName, 'bank-sms-history', 'Bank SMS', histShown.map(x => ({ Date: localISODate(new Date(x.received_at)), Status: x.status, Sender: x.sender || '', Type: x.txn_type || '', [`Amount (${currency})`]: x.amount ?? '', Account: accLabel(x.account_id) || '', Category: x.category || '', Description: x.merchant || '', Message: x.body })));
  const accLabel = id => usable.find(a => String(a.id) === String(id))?.name;

  const testResult = useMemo(() => {
    if (!test.body.trim()) return null;
    const probe = parseSms(test.body, {});
    const cfg = matchAccount(configs, test.sender, probe.last4);
    const p = parseSms(test.body, cfg || {});
    return { ...p, account: cfg ? accounts.find(a => a.id === cfg.account_id)?.name : null };
  }, [test, configs, accounts]);

  const jsonBody = `{"token":"${token || 'YOUR_TOKEN'}","sender":"<Sender>","body":"<Message>"}`;
  const tabs = [['inbox', 'Inbox', Inbox, items.length], ['history', 'History', History], ['banks', 'Banks', Settings2], ['connect', 'Connect phone', MessageSquare], ['test', 'Test', Check]];
  const filters = <div className="smx-filters">
    <label className="smx-search"><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search merchant or message" aria-label="Search SMS" /></label>
    <select value={fAcc} onChange={e => setFAcc(e.target.value)} aria-label="Filter by account"><option value="">All accounts</option>{tab === 'inbox' && <option value="none">No account</option>}{usable.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
    {tab === 'history' && <><select value={hStatus} onChange={e => setHStatus(e.target.value)} aria-label="Filter by status"><option value="all">Approved + dismissed</option><option value="approved">Approved</option><option value="dismissed">Dismissed</option></select><input type="date" value={hFrom} onChange={e => setHFrom(e.target.value)} aria-label="From date" /></>}
  </div>;

  return <div className="sms-page">
    <PageHeading eyebrow="AUTOMATIC TRACKING" title="Bank SMS" subtitle="Bank messages land here first. You review them before they become transactions." actions={<button type="button" className="btn" onClick={load}><RefreshCw size={15} /> Refresh</button>} />
    <div className="smx-summary">
      <div><span className="smx-sico"><Inbox size={16} /></span><b>{items.length}</b><small>Pending</small></div>
      <div><span className="smx-sico"><Clock size={16} /></span><b>{lastSms ? ago(lastSms) : '—'}</b><small>Last SMS</small></div>
      <div><span className="smx-sico"><CheckCircle2 size={16} /></span><b>{approvedMonth}</b><small>Approved this month</small></div>
    </div>
    <div className="panel sms-panel">
    <div className="sms-tabs" role="tablist">{tabs.map(([k, l, I, n]) => <button type="button" role="tab" aria-selected={tab === k} key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><I size={15} />{l}{n ? <em>{n}</em> : null}</button>)}</div>

    {tab === 'inbox' && <section className="sms-pane">
      {filters}
      <div className="sms-pane-top"><p>{loading ? 'Loading…' : shown.length ? `${shown.length} waiting for review` : 'Nothing waiting'}</p><button type="button" className="btn btn-sm" onClick={() => { setSelectMode(m => !m); setSel([]); }}>{selectMode ? 'Done selecting' : 'Select'}</button>{shown.filter(x => x._acc && Number(x._amount) > 0).length > 1 && <button type="button" className="btn btn-primary btn-sm" onClick={approveAll}><Check size={14} /> Approve all ready ({shown.filter(x => x._acc && Number(x._amount) > 0).length})</button>}</div>
      {!loading && !payments.length && <div className="sms-empty"><MessageSquare size={26} /><b>No SMS yet</b><small>Connect your phone, then new bank messages show up here.</small><button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('connect')}>Connect phone</button></div>}
      {selectMode && <div className="smx-bulk"><label className="smx-bulk-all"><input type="checkbox" checked={shown.length > 0 && picked.length === shown.length} onChange={e => setSel(e.target.checked ? shown.map(x => x.id) : [])} /> {picked.length} selected</label>
        <select value={bulk.cat} onChange={e => setBulk(o => ({ ...o, cat: e.target.value }))} aria-label="Set category"><option value="">Category…</option>{[...new Set([...expCats, ...incomeCategories])].map(c => <option key={c}>{c}</option>)}</select>
        <select value={bulk.acc} onChange={e => setBulk(o => ({ ...o, acc: e.target.value }))} aria-label="Set account"><option value="">Account…</option>{usable.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <button type="button" className="btn btn-sm" disabled={!picked.length || (!bulk.cat && !bulk.acc)} onClick={bulkApply}>Apply</button>
        <button type="button" className="btn btn-sm" disabled={!picked.length} onClick={bulkDismiss}><X size={14} /> Dismiss</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!picked.length} onClick={bulkApprove}><Check size={14} /> Approve</button></div>}
      <div className="smx-list">{shown.map(x => <SmsCard key={x.id} x={x} selectMode={selectMode} selected={sel.includes(x.id)} onSelect={toggleSel} dup={dupFor(x)} bal={balFor(x)} usable={usable} expCats={expCats} currency={currency} fmt={fmt} patch={patch} onApprove={approve} onDismiss={dismiss} onRemember={remember} editing={!!editingIds[x.id]} setEditing={setEditing} />)}</div>
      {noise.length > 0 && <details className="sms-other"><summary>Not a payment ({noise.length}) <small>OTP codes, offers…</small></summary>
        {noise.map(x => <div className="sms-other-row" key={x.id}><p dir="auto">{x.body}</p><button type="button" className="btn btn-sm" onClick={() => dismiss(x)}><X size={14} /> Dismiss</button></div>)}
        <div className="sms-actions"><button type="button" className="btn btn-sm" onClick={async () => { for (const x of noise) await dismiss(x); }}>Dismiss all</button></div></details>}
    </section>}

    {tab === 'history' && <section className="sms-pane">
      {filters}
      <div className="sms-actions"><MenuButton label="Export" icon={Download} items={[{ label: 'CSV', description: 'Plain text, opens anywhere', icon: FileText, onClick: () => exportHist('csv') }, { label: 'Excel', description: '.xlsx spreadsheet', icon: FileSpreadsheet, onClick: () => exportHist('xlsx') }]} disabled={!histShown.length} /></div>
      {!histShown.length ? <div className="sms-empty"><History size={26} /><b>Nothing here</b><small>Approved and dismissed messages appear here.</small></div> :
        <div className="smx-list">{histShown.map(x => <article className="smx-row" key={x.id}>
          <span className={`smx-dot ${x.status}`} />
          <div className="smx-row-main"><b>{x.merchant || x.sender || 'Bank SMS'}</b><small>{new Date(x.received_at).toLocaleDateString()} · {accLabel(x.account_id) || 'No account'}{x.category ? ` · ${x.category}` : ''}</small></div>
          <div className="smx-row-end">{x.amount != null && <b className={x.txn_type === 'Income' ? 'smx-in' : ''}>{x.txn_type === 'Income' ? '+' : '−'}{fmt(x.amount)}</b>}<span className={`sms-pill ${x.status === 'approved' ? 'on' : ''}`}>{x.status === 'approved' ? 'Approved' : 'Dismissed'}</span></div>
          {x.status === 'dismissed' && <button type="button" className="btn btn-sm" onClick={() => restore(x)}><RotateCcw size={14} /> Restore</button>}
        </article>)}</div>}
    </section>}

    {tab === 'banks' && <section className="sms-pane">
      <p className="sms-hint">For each account, tell Pocket which bank sender and card digits belong to it. Matching messages are linked to that account automatically.</p>
      {usable.length ? usable.map(a => <AccountConfig key={a.id + (configs.find(c => c.account_id === a.id)?.updated_at || '')} account={a} cfg={configs.find(c => c.account_id === a.id)} userId={userId} supabase={supabase} categories={expCats} setToast={setToast} open={String(openAcc) === String(a.id)} onToggle={() => setOpenAcc(o => String(o) === String(a.id) ? null : a.id)} onSaved={row => setConfigs(o => [...o.filter(c => c.account_id !== row.account_id), row])} />) : <div className="sms-empty"><b>No accounts yet</b><small>Add an account first.</small></div>}
      <div className="sms-actions"><button type="button" className="btn btn-sm" disabled={testing} onClick={sendTest}>{testing ? 'Sending…' : 'Send test SMS'}</button></div>
    </section>}

    {tab === 'connect' && <section className="sms-pane">
      <div className="sms-steps" role="tablist">{[['Token', !!token], ['Bank', configs.some(c => (c.senders || []).length || (c.card_last4 || []).length)], ['Phone', !!lastSms]].map(([l, done], i) => <button type="button" key={l} className={`${cstep === i + 1 ? 'on' : ''} ${done ? 'done' : ''}`} onClick={() => setCstep(i + 1)}><i>{done ? <Check size={12} /> : i + 1}</i>{l}</button>)}</div>
      {cstep === 1 && <div className="sms-card"><h4>Create your private token</h4><p>This tells Pocket the SMS is yours. Never share it.</p>
        {token ? <div className="sms-copy"><code>{token}</code><button type="button" className="icon-btn" aria-label="Copy token" onClick={() => copy(token, setToast)}><Copy size={15} /></button></div> : null}
        <div className="sms-actions"><button type="button" className="btn btn-sm" onClick={makeToken}>{token ? <><RefreshCw size={14} /> Regenerate</> : 'Create token'}</button><button type="button" className="btn btn-primary btn-sm" disabled={!token} onClick={() => setCstep(2)}>Next</button></div></div>}
      {cstep === 2 && <div className="sms-card"><h4>Tell Pocket which bank is which account</h4><p>{configs.filter(c => (c.senders || []).length || (c.card_last4 || []).length).length ? `${configs.filter(c => (c.senders || []).length || (c.card_last4 || []).length).length} account(s) set up.` : 'Add the bank name and the last 4 digits for each account.'}</p>
        <div className="sms-actions"><button type="button" className="btn btn-sm" onClick={() => setTab('banks')}><Settings2 size={14} /> Set up accounts</button><button type="button" className="btn btn-sm" onClick={() => setCstep(1)}>Back</button><button type="button" className="btn btn-primary btn-sm" onClick={() => setCstep(3)}>Next</button></div></div>}
      {cstep === 3 && <>
        <div className="sms-card"><h4>Forward the SMS from your phone</h4>
          <div className="sms-seg"><button type="button" className={platform === 'iphone' ? 'on' : ''} onClick={() => setPlatform('iphone')}>iPhone</button><button type="button" className={platform === 'android' ? 'on' : ''} onClick={() => setPlatform('android')}>Android</button></div>
          <p>Webhook address</p><div className="sms-copy"><code>{endpoint}</code><button type="button" className="icon-btn" aria-label="Copy address" onClick={() => copy(endpoint, setToast)}><Copy size={15} /></button></div>
          {platform === 'android' && <><p>Body (JSON)</p><div className="sms-copy"><code>{jsonBody}</code><button type="button" className="icon-btn" aria-label="Copy body" onClick={() => copy(jsonBody, setToast)}><Copy size={15} /></button></div></>}
          {platform === 'iphone' ? <ol>
            <li>Open <b>Shortcuts</b> → <b>Automation</b> → <b>+</b> → <b>Message</b>.</li>
            <li>Choose <b>Message Contains</b> <code>EGP</code> (or your bank as <b>Sender</b>). Pick <b>Run Immediately</b>.</li>
            <li>Add <b>Get Contents of URL</b>: URL = the address above, Method <b>POST</b>, Request Body <b>JSON</b>.</li>
            <li>Fields: <code>token</code> = your token · <code>sender</code> = <i>Shortcut Input → Sender</i> · <code>body</code> = <i>Shortcut Input → Content</i>.</li>
          </ol> : <ol>
            <li>Install <b>SMS Forwarder</b> and allow SMS access.</li>
            <li>New rule: sender contains your bank → forward to <b>Webhook</b> (POST, <code>application/json</code>).</li>
            <li>Paste the address and the JSON body above.</li>
          </ol>}</div>
        <div className="sms-card"><h4>Check it works</h4><p>{lastSms ? `Last SMS: ${ago(lastSms)}` : 'No SMS received yet'}</p>
          <div className="sms-actions"><button type="button" className="btn btn-sm" onClick={() => setCstep(2)}>Back</button><button type="button" className="btn btn-primary btn-sm" disabled={testing} onClick={sendTest}>{testing ? 'Sending…' : 'Send a test SMS'}</button></div>
          <p className="sms-hint">The test appears in your Inbox. Dismiss it after checking.</p></div></>}
    </section>}

    {tab === 'test' && <section className="sms-pane">
      <p className="sms-hint">Paste a bank SMS to see how Pocket reads it. Nothing is saved.</p>
      <div className="form-grid"><Field label="Sender (optional)"><input value={test.sender} onChange={e => setTest(o => ({ ...o, sender: e.target.value }))} placeholder="CIB" /></Field><Field label="Message" wide><textarea rows={4} dir="auto" value={test.body} onChange={e => setTest(o => ({ ...o, body: e.target.value }))} placeholder="Paste the SMS here" /></Field></div>
      {testResult && <div className="sms-result"><div><small>Type</small><b>{testResult.type === 'Income' ? 'Money in' : testResult.type === 'Expense' ? 'Money out' : 'Not detected'}</b></div><div><small>Amount</small><b>{testResult.amount ?? 'Not detected'}</b></div><div><small>Merchant</small><b>{testResult.merchant || '—'}</b></div><div><small>Account</small><b>{testResult.account || 'No match'}</b></div></div>}
    </section>}
    </div>
  </div>;
}
