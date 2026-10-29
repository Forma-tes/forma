import { useMemo, useState } from 'react';
import { ModalShell } from '../../components/modals/ModalShell.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { accountFlows, isMoneyAccount, money } from '../../lib/credit.js';
import { localISODate, shortDate } from '../../lib/format.js';

// Pay every installment that falls on one due date (for example all your Valu plans due on 5 Nov).
export function ProviderPayModal({ provider, group, accounts = [], transactions = [], currency = 'EGP', onClose, onSubmit }) {
  const fmt = money(currency, 2);
  const sources = accounts.filter(isMoneyAccount);
  const items = useMemo(() => group.plans.map(p => ({ plan: p, amount: Math.min(Number(p.monthly_payment || 0), Number(p.remaining_amount || 0)) })).filter(x => x.amount > 0), [group]);
  const total = items.reduce((s, x) => s + x.amount, 0);
  const [accountId, setAccountId] = useState(provider.pay_from_account_id || group.plans[0]?.account_id || sources[0]?.id || '');
  const [date, setDate] = useState(localISODate());
  const [busy, setBusy] = useState(false);
  const source = sources.find(a => String(a.id) === String(accountId));
  const balance = source ? accountFlows(source, transactions).balance : 0;
  const error = !source ? 'Choose the account you are paying from.' : total > balance ? `Not enough in ${source.name}. Available: ${fmt(balance)}.` : '';
  async function submit() { if (error || busy) return; setBusy(true); try { await onSubmit({ items, accountId, paymentDate: date }); } finally { setBusy(false); } }

  return <ModalShell title={`Pay ${provider.name}`} subtitle={`Installments due ${shortDate(group.due)}`} onClose={onClose}>
    <div className="tx-review-details" style={{ marginBottom: 14 }}>
      {items.map(x => <div key={x.plan.id}><span>{x.plan.name}</span><b>{fmt(x.amount)}</b></div>)}
      <div><span><b>Total</b></span><b>{fmt(total)}</b></div>
    </div>
    <div className="form-grid">
      <Field label="Pay from"><select value={accountId} onChange={e => setAccountId(e.target.value)}><option value="">Choose account</option>{sources.map(a => <option key={a.id} value={a.id}>{a.name} · {fmt(accountFlows(a, transactions).balance)}</option>)}</select></Field>
      <Field label="Payment date"><input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
    </div>
    {error ? <div className="cc-error" role="alert">{error}</div> : <div className="cc-preview ok"><b className="big">{source?.name} after: {fmt(balance - total)}</b>Each plan is saved as its own expense, so your reports stay accurate.</div>}
    <div className="modal-actions" style={{ marginTop: 16 }}><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" disabled={Boolean(error) || busy || !items.length} onClick={submit}>{busy ? 'Saving…' : `Pay ${fmt(total)}`}</button></div>
  </ModalShell>;
}
