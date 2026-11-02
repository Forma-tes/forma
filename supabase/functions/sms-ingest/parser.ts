// Parses Egyptian bank SMS messages (Arabic) into a Pocket transaction.
// Plain JavaScript syntax on purpose so it can be unit-tested with Node as well as run in Deno.

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeText(raw) {
  return String(raw || '')
    .replace(/[٠-٩]/g, d => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',')
    .replace(/[إأآ]/g, 'ا')
    .replace(/\s+/g, ' ')
    .trim();
}

// Words that mean money came IN or went OUT of the account.
const INCOME_PATTERNS = [/استقبال/, /ايداع/, /اضافة/, /تم اضافه/, /استلام/, /وارد/, /credited/i, /received/i, /deposit/i];
const EXPENSE_PATTERNS = [/تنفيذ تحويل/, /تحويل .*من حساب/, /خصم/, /شراء/, /سحب/, /سداد/, /دفع/, /صادر/, /debited/i, /purchase/i, /withdraw/i];

function detectType(text) {
  // Check the "in" wording first: an incoming transfer says "إلى حسابكم", an outgoing one says "من حسابكم".
  if (/الى حساب/.test(text) && INCOME_PATTERNS.some(p => p.test(text))) return 'Income';
  if (EXPENSE_PATTERNS.some(p => p.test(text))) return 'Expense';
  if (INCOME_PATTERNS.some(p => p.test(text))) return 'Income';
  return null;
}

function parseAmount(text) {
  const m = text.match(/(?:بمبلغ|مبلغ|بقيمة|amount(?: of)?)\s*:?\s*(?:EGP|جم|ج\.م)?\s*([\d,]+(?:\.\d+)?)/i)
    || text.match(/([\d,]+(?:\.\d+)?)\s*(?:جم|ج\.م|جنيه|EGP)/i);
  if (!m) return null;
  const value = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

function parseAccountRef(text) {
  const m = text.match(/(?:حسابكم|حسابك|حساب|بطاقتكم|بطاقتك|بطاقة|account|card)\s*(?:رقم|no\.?|ending(?: in)?)?\s*[*xX#]*\s*(\d{4})\b/i);
  return m ? m[1] : null;
}

// Banks here send dates as M/D/YY (e.g. 10/29/26). If the first number is > 12 we treat it as D/M.
function parseDate(text, fallbackIso) {
  const m = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (!m) return fallbackIso;
  let a = Number(m[1]), b = Number(m[2]), y = Number(m[3]);
  if (y < 100) y += 2000;
  let month = a, day = b;
  if (a > 12 && b <= 12) { month = b; day = a; }
  if (month < 1 || month > 12 || day < 1 || day > 31) return fallbackIso;
  const iso = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const check = new Date(iso + 'T00:00:00Z');
  return Number.isNaN(check.getTime()) || check.getUTCDate() !== day ? fallbackIso : iso;
}

function parseTime(text) {
  const m = text.match(/\b(\d{1,2}):(\d{2})\b/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

function parseReference(text) {
  const m = text.match(/(?:رقم المعامله|رقم المعاملة|رقم العمليه|رقم العملية|مرجع|ref(?:erence)?(?: no\.?)?)\s*:?\s*([A-Za-z0-9-]{4,})/i);
  return m ? m[1] : null;
}

function parseCounterparty(text, type) {
  // Incoming: "... من FADY NADER في 02:32"
  // Outgoing: "... الى AHMED في ..." or "... لصالح AHMED ..."
  const patterns = type === 'Income'
    ? [/جم من (.+?) (?:في|فى|بتاريخ|يوم)(?= |$)/, /من (?!حساب)(.+?) (?:في|فى|بتاريخ|يوم)(?= |$)/]
    : [/(?:الى|لصالح|لدى|عند|at) (?!حساب)(.+?) (?:في|فى|بتاريخ|يوم|on)(?= |$)/i];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].length <= 80) return m[1].trim();
  }
  return '';
}

export function parseBankSms(raw, todayIso) {
  const text = normalizeText(raw);
  const type = detectType(text);
  const amount = parseAmount(text);
  if (!type || !amount) return { ok: false, reason: !amount ? 'amount_not_found' : 'type_not_found', text };

  const counterparty = parseCounterparty(text, type);
  const isTransfer = /تحويل/.test(text);
  let description;
  if (type === 'Income') description = counterparty ? `تحويل من ${counterparty}` : (isTransfer ? 'تحويل وارد' : 'إيداع');
  else description = counterparty ? (isTransfer ? `تحويل إلى ${counterparty}` : counterparty) : (isTransfer ? 'تحويل لحظي صادر' : 'خصم من الحساب');

  return {
    ok: true,
    type,
    amount,
    accountRef: parseAccountRef(text),
    date: parseDate(text, todayIso),
    time: parseTime(text),
    reference: parseReference(text),
    counterparty,
    description,
    paymentMethod: isTransfer ? 'Bank Transfer' : /بطاق|card/i.test(text) ? 'Debit Card' : 'Bank Transfer',
  };
}
