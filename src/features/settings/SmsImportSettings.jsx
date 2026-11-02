import { Check, Copy, KeyRound, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const statusLabel = { imported: 'Recorded', duplicate: 'Already recorded', unparsed: 'Not recognised', error: 'Error' };

export function SmsImportSettings({ session, supabase }) {
  const uid = session?.user?.id;
  const endpoint = `${String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')}/functions/v1/sms-ingest`;
  const [tokenInfo, setTokenInfo] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [refs, setRefs] = useState({});
  const [inbox, setInbox] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const load = async () => {
    if (!supabase || !uid) return;
    setError('');
    const [t, a, i] = await Promise.all([
      supabase.from('sms_ingest_tokens').select('created_at,last_used_at').eq('user_id', uid).maybeSingle(),
      supabase.from('financial_accounts').select('id,name,type,sms_account_ref').eq('user_id', uid).order('created_at'),
      supabase.from('sms_inbox').select('id,raw_text,status,detail,received_at').eq('user_id', uid).order('received_at', { ascending: false }).limit(10),
    ]);
    const err = t.error || a.error || i.error;
    if (err) { setError('SMS import is not set up in the database yet. Apply the 20261102_sms_auto_import migration first.'); return; }
    setTokenInfo(t.data || null);
    setAccounts(a.data || []);
    setRefs(Object.fromEntries((a.data || []).map(x => [x.id, x.sms_account_ref || ''])));
    setInbox(i.data || []);
  };
  useEffect(() => { load(); }, [uid]);

  const copy = async (value, label) => { try { await navigator.clipboard.writeText(value); setCopied(label); setTimeout(() => setCopied(''), 1500); } catch { setError('Could not copy. Select the text and copy it manually.'); } };

  const generate = async () => {
    if (tokenInfo && !window.confirm('Create a new key? The old key on your phone will stop working.')) return;
    setBusy(true); setError('');
    const { data, error: e } = await supabase.rpc('rotate_sms_ingest_token');
    setBusy(false);
    if (e) { setError(e.message); return; }
    setNewKey(data); load();
  };

  const revoke = async () => {
    if (!window.confirm('Turn off SMS import? Your phone will no longer be able to send messages to Pocket.')) return;
    setBusy(true);
    const { error: e } = await supabase.from('sms_ingest_tokens').delete().eq('user_id', uid);
    setBusy(false);
    if (e) setError(e.message); else { setNewKey(''); load(); }
  };

  const saveRef = async id => {
    const value = String(refs[id] || '').trim();
    if (value && !/^\d{4}$/.test(value)) { setError('Enter exactly the last 4 digits shown in the bank SMS.'); return; }
    setError('');
    const { error: e } = await supabase.from('financial_accounts').update({ sms_account_ref: value || null }).eq('id', id).eq('user_id', uid);
    if (e) setError(e.message); else { setCopied('ref-' + id); setTimeout(() => setCopied(''), 1500); }
  };

  if (!supabase || !uid) return <p className="small-muted">Sign in to use SMS auto-import.</p>;

  return <div className="sms-import-settings">
    <p className="small-muted">Your phone forwards bank SMS to Pocket and each one is recorded as a transaction automatically. Imported transactions are marked for review so you can set the right category.</p>
    {error && <div className="workspace-error" role="alert">{error}</div>}

    <div className="settings-info-row"><KeyRound size={17}/><div>
      <b>Your SMS key</b>
      <p className="small-muted">{tokenInfo ? `Active · created ${new Date(tokenInfo.created_at).toLocaleDateString()}${tokenInfo.last_used_at ? ` · last message ${new Date(tokenInfo.last_used_at).toLocaleString()}` : ' · no messages yet'}` : 'Not set up yet.'}</p>
    </div></div>

    {newKey && <div className="sms-key-reveal">
      <p className="small-muted"><b>Copy this key now.</b> It will not be shown again.</p>
      <label className="field"><span>Link</span><div className="sms-copy-row"><input readOnly value={endpoint} onFocus={e => e.target.select()}/><button type="button" className="btn btn-secondary btn-sm" onClick={() => copy(endpoint, 'url')}>{copied === 'url' ? <Check size={14}/> : <Copy size={14}/>}</button></div></label>
      <label className="field"><span>Key</span><div className="sms-copy-row"><input readOnly value={newKey} onFocus={e => e.target.select()}/><button type="button" className="btn btn-secondary btn-sm" onClick={() => copy(newKey, 'key')}>{copied === 'key' ? <Check size={14}/> : <Copy size={14}/>}</button></div></label>
    </div>}

    <div className="settings-actions">
      <button type="button" className="btn btn-primary" disabled={busy} onClick={generate}>{busy ? <LoaderCircle size={15} className="spin"/> : <RefreshCw size={15}/>}{tokenInfo ? 'Create new key' : 'Create SMS key'}</button>
      {tokenInfo && <button type="button" className="btn btn-secondary" disabled={busy} onClick={revoke}><Trash2 size={15}/>Turn off</button>}
    </div>

    <h4 className="sms-subhead">Match accounts</h4>
    <p className="small-muted">Type the last 4 digits the bank writes in the SMS (e.g. “حسابكم 1234”) next to the matching account.</p>
    <div className="sms-account-list">
      {accounts.length ? accounts.map(acc => <div className="sms-account-row" key={acc.id}>
        <span><b>{acc.name}</b><small>{acc.type}</small></span>
        <input inputMode="numeric" maxLength={4} placeholder="0000" value={refs[acc.id] || ''} onChange={e => setRefs(r => ({ ...r, [acc.id]: e.target.value.replace(/\D/g, '') }))} onBlur={() => saveRef(acc.id)}/>
        {copied === 'ref-' + acc.id && <Check size={14}/>}
      </div>) : <p className="small-muted">Add an account first.</p>}
    </div>

    <h4 className="sms-subhead">Recent messages</h4>
    {inbox.length ? <ul className="sms-inbox-list">{inbox.map(m => <li key={m.id} className={`sms-${m.status}`}>
      <span className="sms-status">{statusLabel[m.status] || m.status}{m.detail === 'no_matching_account' ? ' · no account matched' : ''}</span>
      <small>{new Date(m.received_at).toLocaleString()}</small>
      <p dir="rtl">{m.raw_text}</p>
    </li>)}</ul> : <p className="small-muted">No messages received yet.</p>}
  </div>;
}
