import { AnimatedNumber } from '../../components/ui/AnimatedNumber.jsx';
import { CreditCard, ShoppingBag } from 'lucide-react';
import { dueLabel, dueTone, daysUntil, money } from '../../lib/credit.js';
import { shortDate } from '../../lib/format.js';
import { providerTheme } from '../../lib/providerThemes.js';

export function DueChip({ date }) {
  if (!date) return null;
  return <span className={`cc-chip ${dueTone(daysUntil(date))}`}>{dueLabel(date)}</span>;
}

export function LimitBar({ used, limit, usedLabel = 'used', currency }) {
  const fmt = money(currency);
  const pct = limit > 0 ? Math.min(100, used / limit * 100) : 0;
  return <div>
    <div className="cc-limit-line"><b>{limit > 0 ? `${fmt(Math.max(0, limit - used))} available` : 'No limit set'}</b><span className="cc-sub">{fmt(used)} {usedLabel}{limit > 0 ? ` of ${fmt(limit)}` : ''}</span></div>
    <div className="cc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Credit limit used"><i className={pct >= 100 ? 'full' : pct > 80 ? 'hi' : ''} style={{ width: `${pct}%` }} /></div>
  </div>;
}

export function CardVisual({ account, line1, line2, icon: Icon = CreditCard, kindLabel = 'Credit card' }) {
  return <div className="cc-visual" style={{ '--cc-a': account.color || '#6c7cf5' }}>
    <span className="cc-v-icon"><Icon size={18} /></span>
    <div><small>{kindLabel}</small><strong>{account.name}</strong>{line1 && <small style={{ marginTop: 6 }}>{line1}</small>}{line2 && <small>{line2}</small>}</div>
  </div>;
}

// Credit-card shaped face (Visa proportions) used for cards and installment apps everywhere.
export function PaymentCard({ account, kind = 'card', used = 0, limit = 0, next = null, currency, menu = null, onOpen, children }) {
  const fmt = money(currency);
  const t = kind === 'app' ? providerTheme(account) : { a: account.color || '#3157f6', b: `color-mix(in srgb,${account.color || '#3157f6'} 55%,#0b1033)` };
  const pct = limit > 0 ? Math.min(100, used / limit * 100) : 0;
  const Icon = kind === 'app' ? ShoppingBag : CreditCard;
  return <div className="pc-wrap">
    <div className={`pc-face ${onOpen ? 'pc-click' : ''}`} style={{ '--pc-a': t.a, '--pc-b': t.b }} onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onKeyDown={e => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(); } }} aria-label={onOpen ? `Open ${account.name}` : undefined}>
      <div className="pc-top"><div className="pc-id"><span className="pc-mono">{kind === 'app' ? (account.name || '?').trim().charAt(0).toUpperCase() : <Icon size={16} />}</span><span><small>{kind === 'app' ? 'Installment app' : 'Credit card'}</small><b>{account.name}</b></span></div>{menu && <div className="pc-menu" onClick={e => e.stopPropagation()}>{menu}</div>}</div>
      <div className="pc-mid"><small>{limit > 0 ? 'Available' : 'No limit set'}</small><strong>{limit > 0 ? fmt(Math.max(0, limit - used)) : fmt(used)}</strong>
        <div className="pc-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
        <small>{fmt(used)} {kind === 'app' ? 'committed' : 'used'}{limit > 0 ? ` of ${fmt(limit)}` : ''}</small></div>
      <div className="pc-bottom"><div><small>Next payment</small><b>{next ? fmt(next.amount) : 'All clear'}</b></div>{next ? <span className="pc-due"><DueChip date={next.due} /></span> : <span className="pc-ok">Nothing due</span>}</div>
    </div>
    {children && <div className="pc-actions">{children}</div>}
  </div>;
}

// Big tile used on the Debts & installments list and the Overview strip.
export function CardTile({ card, summary, currency, onOpen, onPay }) {
  const fmt = money(currency);
  const next = summary.next;
  return <PaymentCard account={card} kind="card" used={summary.owed} limit={summary.limit} next={next ? { amount: next.remaining, due: next.due } : null} currency={currency} onOpen={() => onOpen(card)}>
    {next && <button className="btn btn-primary btn-sm" onClick={() => onPay(card)}>Pay {fmt(next.remaining)}</button>}<button className="btn btn-secondary btn-sm" onClick={() => onOpen(card)}>View details</button>
  </PaymentCard>;
}

export function ProviderTile({ provider, summary, currency, onOpen, onPay }) {
  const next = summary.next;
  return <PaymentCard account={provider} kind="app" used={summary.used} limit={summary.limit} next={next ? { amount: next.amount, due: next.due } : null} currency={currency} onOpen={() => onOpen(provider)}>
    {next && <button className="btn btn-primary btn-sm" onClick={() => onPay(provider, next)}>Pay</button>}<button className="btn btn-secondary btn-sm" onClick={() => onOpen(provider)}>Details</button>
  </PaymentCard>;
}
