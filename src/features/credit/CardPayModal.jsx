import { useMemo, useState } from 'react';
import { ModalShell } from '../../components/modals/ModalShell.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { accountFlows, cardPayOptions, daysUntil, isMoneyAccount, money } from '../../lib/credit.js';
import { localISODate, shortDate } from '../../lib/format.js';

// Pay a credit card: pick how much, and see exactly what it clears before you confirm.
export function CardPayModal({ card, summary, accounts = [], transactions = [], currency = 'EGP', initialChoice = 0, onClose, onSubmit }) {
  const fmt = money(currency, 2);
  const options = useMemo(() => cardPayOptions(summary), [summary]);
  const sources = accounts.filter(isMoneyAccount);
  const [choice, setChoice] = useState(Math.min(initialChoice, Math.max(0, options.length - 1)));
  const [custom, setCustom] = useState('');
  const [accountId, setAccountId] = useState(card.pay_from_account_id || sources[0]?.id || '');
  const [date, setDate] = useState(localISODate());
  const [busy, setBusy] = useState(false);

  const amount = choice === 'custom' ? Math.round((Number(custom) || 0) * 100) / 100 : (options[choice]?.amount || 0);
  const source = sources.find(a => String(a.id) === String(accountId));
  const balance = source ? accountFlows(source, transactions).balance : 0;
  const error = !amount || amount <= 0 ? 'Enter an amount to pay.'
    : amount > summary.owed + 0.004 ? `That is more than you owe (${fmt(summary.owed)}).`
    : !source ? 'Choose the account you are paying from.'
    : amount > balance ? `Not enough in ${source.name}. Available: ${fmt(balance)}.` : '';

  // Payments clear the oldest statement first.
  let left = amount;
  const after = summary.groups.map(g => { const t = Math.min(g.remaining, left); left -= t; return { ...g, left: g.remaining - t }; });
  const first = after[0];
  const short = !error && first && first.left > 0.004;

  const label = (o, i) => options.length === 1 ? 'Full amount' : i === 0 ? 'Nearest due date' : o.last ? 'Everything you owe' : `Everything due by ${shortDate(o.due)}`;
  async function submit() { if (error || busy) return; setBusy(true); try { await onSubmit({ amount, accountId, paymentDate: date }); } finally { setBusy(false); } }

  return <ModalShell title="Pay credit card" subtitle={`${card.name} · payments clear the oldest due date first`} onClose={onClose}>
    <div className="cc-options" role="radiogroup" aria-label="How much to pay">
      {options.map((o, i) => <button type="button" role="radio" aria-checked={choice === i} key={o.key} className={`cc-option ${choice === i ? 'on' : ''}`} onClick={() => setChoice(i)}>
        <span><b>{label(o, i)}</b><small>Clears everything due by {shortDate(o.due)}{daysUntil(o.due) < 0 ? ' (overdue)' : ''}{i === 0 ? ' · avoids interest' : ''}</small></span><strong>{fmt(o.amount)}</strong></button>)}
      <div role="radio" aria-checked={choice === 'custom'} tabIndex={0} className={`cc-option ${choice === 'custom' ? 'on' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }} onClick={() => setChoice('custom')} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setChoice('custom'); } }}>
        <span><b>Other amount</b><small>Pay any amount up to {fmt(summary.owed)}</small></span>
        <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="Enter amount" aria-label="Other amount" value={custom} onFocus={() => setChoice('custom')} onChange={e => { setCustom(e.target.value); setChoice('custom'); }} />
      </div>
    </div>
    <div className="form-grid">
      <Field label="Pay from"><select value={accountId} onChange={e => setAccountId(e.target.value)}><option value="">Choose account</option>{sources.map(a => <option key={a.id} value={a.id}>{a.name} · {fmt(accountFlows(a, transactions).balance)}</option>)}</select></Field>
      <Field label="Payment date"><input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
    </div>
    {error ? <div className="cc-error" role="alert">{error}</div> : <div className={`cc-preview ${short ? 'bad' : 'ok'}`} aria-live="polite">
      {short ? <><b className="big">{fmt(first.left)} still due on {shortDate(first.due)}</b>Interest may apply on the unpaid part. Pay {fmt(options[0].amount)} to stay safe.</> : <><b className="big">Nothing late</b>{after.find(g => g.left > 0.004) ? `Next due ${shortDate(after.find(g => g.left > 0.004).due)} · ${fmt(after.find(g => g.left > 0.004).left)}` : 'This clears the card.'}</>}
    </div>}
    {!error && <div className="tx-review-details" style={{ marginBottom: 6 }}>
      {after.map(g => <div key={g.due}><span>Pay by {shortDate(g.due)}</span><b>{g.left <= 0.004 ? 'Cleared' : `${fmt(g.left)} left`}</b></div>)}
      <div><span>{source?.name} after</span><b>{fmt(balance - amount)}</b></div>
      <div><span>Available credit after</span><b>{fmt(summary.available + amount)}</b></div>
    </div>}
    <p className="small-muted" style={{ margin: '6px 0 0' }}>This is saved as a transfer to your card, so it is not counted as a new expense.</p>
    <div className="modal-actions" style={{ marginTop: 16 }}><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" disabled={Boolean(error) || busy} onClick={submit}>{busy ? 'Saving…' : `Pay ${fmt(amount)}`}</button></div>
  </ModalShell>;
}
