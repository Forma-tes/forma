// Bank SMS parser. Keep in sync with supabase/functions/sms-ingest/index.ts
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const normalizeDigits = s => String(s || '').replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d)).replace(/٫/g, '.').replace(/٬/g, ',');

const DEBIT = ['purchase', 'purchased', 'spent', 'debited', 'debit', 'withdrawn', 'withdrawal', 'paid', 'payment', 'pos ', 'transferred to', 'sent', 'charged', 'سحب', 'خصم', 'مشتريات', 'شراء', 'تم دفع', 'دفع', 'تحويل صادر', 'تم تحويل'];
const CREDIT = ['credited', 'credit ', 'deposit', 'deposited', 'received', 'refund', 'salary', 'transferred from', 'incoming', 'اضافة', 'إضافة', 'ايداع', 'إيداع', 'استلام', 'تم استلام', 'تحويل وارد', 'راتب', 'استرداد'];
const NOISE_BEFORE = /(balance|available|avail|limit|bal|رصيد|الرصيد|المتاح|حد)[^0-9]{0,18}$/i;
const CUR = '(?:EGP|LE|L\\.E\\.?|E£|£E|£|جنيه|ج\\.م|جم|USD|\\$)';

const lc = s => String(s || '').toLowerCase();
const clean = a => Number(String(a).replace(/,/g, ''));

function findAmount(text, custom) {
  if (custom) {
    try { const m = new RegExp(custom, 'i').exec(text); if (m) { const v = clean(m[1] || m[0]); if (v > 0) return v; } } catch { /* ignore bad pattern */ }
  }
  const re = new RegExp(`(?:${CUR}\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?))|(?:([0-9][0-9,]*(?:\\.[0-9]{1,2})?)\\s*${CUR})`, 'gi');
  let m; const found = [];
  while ((m = re.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 28), m.index);
    if (NOISE_BEFORE.test(before)) continue;
    const v = clean(m[1] || m[2]);
    if (v > 0) found.push(v);
  }
  return found[0] || null;
}

function earliest(text, list) {
  const t = lc(text); let best = null;
  for (const k of list) { const w = lc(k).trim(); if (!w) continue; const i = t.indexOf(w); if (i >= 0 && (!best || i < best.i)) best = { i, k }; }
  return best;
}

function findType(text, cfg = {}) {
  const d = earliest(text, [...(cfg.debit_keywords || []), ...DEBIT]);
  const c = earliest(text, [...(cfg.credit_keywords || []), ...CREDIT]);
  const dCustom = (cfg.debit_keywords || []).length && d && (cfg.debit_keywords || []).some(k => lc(k).trim() === lc(d.k).trim());
  const cCustom = (cfg.credit_keywords || []).length && c && (cfg.credit_keywords || []).some(k => lc(k).trim() === lc(c.k).trim());
  if (dCustom && !cCustom) return 'Expense';
  if (cCustom && !dCustom) return 'Income';
  if (d && c) return d.i <= c.i ? 'Expense' : 'Income';
  if (d) return 'Expense';
  if (c) return 'Income';
  return null;
}

function findMerchant(text) {
  const m = /(?:\bat|\bfrom|\bto|@|لدى|من|إلى|الى|عند)\s+([A-Za-z0-9؀-ۿ&'._\- ]{2,34}?)(?=\s*(?:on|with|using|card|ending|bal|available|avail|\.|,|;|\n|$|في|بتاريخ|رصيد|بطاقة))/i.exec(text);
  return m ? m[1].trim() : '';
}

export function findLast4(text) {
  const m = /(?:card|acct|account|a\/c|ending|ending in|xx+|\*+|بطاقة|حساب|رقم)\D{0,12}(\d{4})\b/i.exec(text);
  return m ? m[1] : '';
}

export function parseSms(raw, cfg = {}) {
  const text = normalizeDigits(raw).replace(/\s+/g, ' ').trim();
  return { amount: findAmount(text, cfg.amount_pattern), type: findType(text, cfg), merchant: findMerchant(text), last4: findLast4(text) };
}

export function matchAccount(configs, sender, last4) {
  const s = lc(sender).trim(); let best = null, score = 0;
  for (const c of configs) {
    if (c.enabled === false) continue;
    let sc = 0;
    if (s && (c.senders || []).some(x => lc(x).trim() && (s === lc(x).trim() || s.includes(lc(x).trim())))) sc += 2;
    if (last4 && (c.card_last4 || []).some(x => String(x).trim() === last4)) sc += 3;
    if (sc > score) { score = sc; best = c; }
  }
  return best;
}
