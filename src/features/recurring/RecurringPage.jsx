import { useState } from 'react';
import { CalendarDays, CreditCard, Pencil, Plus, Repeat2, Trash2 } from 'lucide-react';
import { MetricCard } from '../../components/ui/MetricCard.jsx';
import { PageHeading } from '../../components/ui/PageHeading.jsx';
import { isLiability } from '../../lib/credit.js';
import { isGoalsAccount } from '../../lib/features.js';
import { fmt, localISODate, shortDate } from '../../lib/format.js';

export function RecurringPage(p){
 const {accounts=[],recurring,setModal,setEditing,removeRecord,markRecurringPaid,paidBusy,deleteRecurringPayment}=p;
 const [payTarget,setPayTarget]=useState(null),[payAcc,setPayAcc]=useState(''),[payRecord,setPayRecord]=useState(true);
 const spendable=accounts.filter(a=>!isLiability(a)&&!isGoalsAccount(a));
 const openPay=r=>{setPayTarget(r);setPayAcc(r.account_id||spendable[0]?.id||'');setPayRecord(true)};
 const confirmPay=async()=>{const r=payTarget;if(payRecord&&!payAcc)return;setPayTarget(null);await markRecurringPaid(r,{accountId:payAcc,record:payRecord})};
 const total=recurring.reduce((s,r)=>s+Number(r.amount||0)*(r.frequency==='Weekly'?52/12:r.frequency==='Quarterly'?1/3:r.frequency==='Yearly'?1/12:1),0);
 const today=localISODate();
 const isPaid=r=>Boolean(r.last_paid_date&&r.next_due_date&&r.last_paid_date<r.next_due_date&&today<r.next_due_date) || Boolean(r.paid_this_cycle&&!r.next_due_date);
 const awaiting=recurring.filter(r=>!isPaid(r)).length;
 return <><PageHeading eyebrow="RECURRING COMMITMENTS" title="Subscriptions & bills" subtitle="Track subscriptions, recurring bills, renewals, and what is coming next." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('recurring')}}><Plus size={17}/> Add payment</button>}/>
 <div className="metric-grid three"><MetricCard label="Monthly commitments" value={fmt(total)} icon={Repeat2} tone="blue" note="estimated monthly equivalent"/><MetricCard label="Active payments" value={recurring.length} icon={CreditCard} tone="purple" note="tracked recurring items"/><MetricCard label="Awaiting payment" value={awaiting} icon={CalendarDays} tone="orange" note="this cycle"/></div>
 <section className="panel table-panel"><div className="panel-header section-header"><div><h2>All recurring payments</h2><p>Mark each item paid when you complete it. Auto-pay is a tracker only; Pocket does not move money.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Payment</th><th>Frequency</th><th>Next due</th><th>Amount</th><th>Auto-pay</th><th>Status</th><th>Actions</th></tr></thead><tbody>{recurring.map(r=><tr key={r.id}><td><div className="transaction-name"><span className="tx-avatar tx-expense"><Repeat2 size={16}/></span><span><b>{r.name}</b><small>{r.category}{r.essential?' · Essential':' · Optional'}</small></span></div></td><td>{r.frequency}</td><td>{shortDate(r.next_due_date)}</td><td><b>{fmt(r.amount)}</b></td><td>{r.auto_pay?<span className="status-tag status-good">Enabled</span>:<span className="text-muted">Manual</span>}</td><td><span className={`status-tag ${isPaid(r)?'status-good':'status-pending'}`}>{isPaid(r)?'Paid':'Due'}</span></td><td><div className="row-actions"><button className="btn btn-sm btn-secondary" onClick={()=>openPay(r)} disabled={paidBusy.includes(r.id)||isPaid(r)}>{paidBusy.includes(r.id)?'Saving…':isPaid(r)?'Paid':'Mark paid'}</button><button className="icon-btn" onClick={()=>{setEditing(r);setModal('recurring')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>deleteRecurringPayment(r)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></section>
 {payTarget&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPayTarget(null)}}><section className="modal pay-modal" role="dialog" aria-modal="true" aria-labelledby="pay-title"><div className="modal-head"><div><h2 id="pay-title">Mark “{payTarget.name}” as paid</h2><p>{fmt(payTarget.amount)} · due {shortDate(payTarget.next_due_date)}</p></div></div>
  <label className="pay-check"><input type="checkbox" checked={payRecord} onChange={e=>setPayRecord(e.target.checked)}/><span><b>Also record it as an expense</b><small>Adds a transaction and takes the money out of the account below.</small></span></label>
  {payRecord&&<label className="field"><span>Paid from</span><select value={payAcc} onChange={e=>setPayAcc(e.target.value)}><option value="">Choose an account</option>{spendable.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
  <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setPayTarget(null)}>Cancel</button><button type="button" className="btn btn-primary" disabled={payRecord&&!payAcc} onClick={confirmPay}>Mark paid</button></div></section></div>}
</>;
}