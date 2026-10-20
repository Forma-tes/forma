import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target, Repeat2, ChartNoAxesCombined,
  Settings, Search, Plus, Bell, BellRing, Database, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight, UserRound, ShieldCheck, FileJson,
  ArrowDownRight, TrendingUp, Download, Upload, CalendarDays, SlidersHorizontal,
  MoreHorizontal, X, Check, XCircle, CircleHelp, PiggyBank, CreditCard, Sparkles, LogOut,
  Pencil, Trash2, Mail, LoaderCircle, FileSpreadsheet, CircleDollarSign, Menu, Users, LockKeyhole, Sun, Moon, UserPlus, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Prefer the canonical production URL so auth emails never redirect to a temporary Vercel preview URL.
const authRedirectUrl = () => String(import.meta.env.VITE_SITE_URL || window.location.origin).trim().replace(/\/+$/, '');
const cloudReady = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT') && !supabaseKey.includes('YOUR_SUPABASE'));
const supabase = cloudReady ? createClient(supabaseUrl, supabaseKey) : null;

const localDemoAccounts = [
  { username: 'test-user', password: '12345678', role: 'user', full_name: 'Test User', email: null, user_id: 'local-demo-test-user', enabled_features: ['Overview','Transactions','Accounts','Cash flow calendar','Budgets','Savings goals','Subscriptions & bills','Debts & installments','Insights & reports'].map(key=>({Overview:'overview',Transactions:'transactions','Accounts':'accounts','Cash flow calendar':'calendar',Budgets:'budgets','Savings goals':'goals','Subscriptions & bills':'recurring','Debts & installments':'debts','Insights & reports':'insights'}[key])) },
  { username: 'test-admin', password: '12345678', role: 'super_admin', full_name: 'Test Admin', email: null, user_id: 'local-demo-test-admin', enabled_features: [] }
];

const coreExpenseCategories = ['Housing','Food & Groceries','Transportation','Bills & Utilities','Health','Shopping','Entertainment','Education','Travel','Savings & Debt','Family & Giving','Other'];
const womenExpenseCategories = ['Beauty & Skincare','Hair & Nails','Personal & Period Care','Fashion & Styling'];
const menExpenseCategories = ['Grooming & Personal Care','Fitness & Sports','Style & Accessories','Car & Gear'];
const defaultExpenseCategories = [...new Set([...coreExpenseCategories,...womenExpenseCategories,...menExpenseCategories])];
let expenseCategoriesOverride = null;
const setExpenseCategoriesOverride = list => { expenseCategoriesOverride = Array.isArray(list) ? [...new Set(list.map(x=>String(x).trim()).filter(Boolean))] : null; window.dispatchEvent(new Event('pocket-expense-categories-updated')); };
const readExpenseCategories = () => { try { const saved=JSON.parse(localStorage.getItem('pocket_expense_categories')||'null'); return Array.isArray(saved)&&saved.length?saved.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()):null; } catch { return null; } };
const getExpenseCategories = gender => { if(expenseCategoriesOverride) return expenseCategoriesOverride; const saved=readExpenseCategories(); return saved || [...new Set([...coreExpenseCategories,...(gender==='female'?womenExpenseCategories:gender==='male'?menExpenseCategories:[])])]; };
const expenseCategories = getExpenseCategories('');
const incomeCategories = ['Salary','Freelance','Business','Bonus','Investments','Other income'];
// Explicit timezone choices used by Account & Profile; avoids a runtime crash when opening the modal.
const zones = ['Africa/Cairo','Africa/Casablanca','Africa/Johannesburg','Asia/Dubai','Asia/Riyadh','Asia/Kuwait','Asia/Qatar','Asia/Amman','Europe/London','Europe/Paris','Europe/Berlin','America/New_York','America/Chicago','America/Los_Angeles','Asia/Tokyo','Australia/Sydney'];
const categories = [...new Set([...getExpenseCategories('female'),...getExpenseCategories('male'),...incomeCategories,'Transfer'])];
const getCategoriesForType = (type,gender) => type==='Income'?incomeCategories:type==='Transfer'?['Transfer']:getExpenseCategories(gender);
const categoryHierarchy = {
  'Housing':['Rent','Mortgage','Home maintenance','Furniture','Home supplies'],
  'Food & Groceries':['Groceries','Restaurants','Coffee','Food delivery','Takeaway'],
  'Transportation':['Fuel','Ride-hailing','Public transport','Parking','Car maintenance'],
  'Bills & Utilities':['Electricity','Water','Gas','Internet','Mobile bill'],
  'Health':['Doctor','Pharmacy','Dental care','Medical tests','Health insurance'],
  'Shopping':['Clothing','Shoes','Accessories','Electronics','Other shopping'],
  'Entertainment':['Movies','Gaming','Events','Hobbies','Activities'],
  'Education':['Courses','Books','Tuition','Certifications'],
  'Travel':['Flights','Hotels','Local transport','Activities','Travel insurance'],
  'Savings & Debt':['Savings contribution','Loan payment','Credit card payment','Debt repayment'],
  'Family & Giving':['Family support','Gifts','Donations','Charity'],
  'Beauty & Skincare':['Skincare','Makeup','Perfume','Beauty products'],
  'Hair & Nails':['Hair salon','Hair products','Manicure','Pedicure'],
  'Personal & Period Care':['Personal hygiene','Period products','Women’s health'],
  'Fashion & Styling':['Outfits','Bags','Jewelry','Occasion wear','Alterations'],
  'Grooming & Personal Care':['Barber','Shaving','Hair products','Skincare','Perfume'],
  'Fitness & Sports':['Gym','Sports gear','Sports activities','Fitness classes'],
  'Style & Accessories':['Clothing','Watches','Shoes','Bags','Accessories'],
  'Car & Gear':['Car upgrades','Car accessories','Car detailing','Equipment'],
  'Other':['Other expense']
};
const incomeSubcategories = {'Salary':['Monthly salary','Commission','Overtime'],'Freelance':['Freelance project','Consulting','Contract work'],'Business':['Sales revenue','Business profit','Other business income'],'Bonus':['Performance bonus','Gift bonus','Other bonus'],'Investments':['Dividends','Interest','Investment return'],'Other income':['Refund','Cashback','Other income']};
const uniqueOptions = values => [...new Map(values.filter(v=>typeof v==='string'&&v.trim()).map(v=>[v.trim().toLocaleLowerCase(),v.trim()])).values()];
const getCustomSubcategories = category => { try { const saved=JSON.parse(localStorage.getItem('pocket_subcategories')||'{}'); return Array.isArray(saved[category])&&saved[category].length?saved[category]:null; } catch { return null; } };
const saveCustomSubcategories = (category, values) => { try { const saved=JSON.parse(localStorage.getItem('pocket_subcategories')||'{}'); saved[category]=uniqueOptions(values); localStorage.setItem('pocket_subcategories',JSON.stringify(saved)); window.dispatchEvent(new Event('pocket-subcategories-updated')); } catch {} };
const getSubcategories = (type,category) => uniqueOptions(type==='Income'?(incomeSubcategories[category]||['Other income']):type==='Transfer'?['Transfer']:(getCustomSubcategories(category)||categoryHierarchy[category]||['Other expense']));
const palette = ['#6c7cf5','#50b99a','#f5b85b','#ee8291','#9b8af7','#59a8d8','#e79a6c','#7e9b87'];
const demoTransactions = [
  {id:'d1',transaction_date:'2026-10-01',type:'Income',category:'Salary',description:'Monthly salary',amount:28000,need_want:null,fixed_variable:'Fixed',payment_method:'Bank Transfer',recurring:true,notes:''},
  {id:'d2',transaction_date:'2026-10-02',type:'Expense',category:'Housing',subcategory:'Rent',description:'Apartment rent',amount:6500,need_want:'Need',fixed_variable:'Fixed',payment_method:'Bank Transfer',recurring:true,notes:''},
  {id:'d3',transaction_date:'2026-10-03',type:'Expense',category:'Food & Groceries',subcategory:'Groceries',description:'Groceries',amount:820,need_want:'Need',fixed_variable:'Variable',payment_method:'Debit Card',recurring:false,notes:''},
  {id:'d4',transaction_date:'2026-10-05',type:'Expense',category:'Transportation',description:'Fuel',amount:480,need_want:'Need',fixed_variable:'Variable',payment_method:'Debit Card',recurring:false,notes:''},
  {id:'d5',transaction_date:'2026-10-06',type:'Expense',category:'Shopping',description:'Personal purchase',amount:1250,need_want:'Want',fixed_variable:'Variable',payment_method:'Credit Card',recurring:false,notes:''},
  {id:'d6',transaction_date:'2026-10-08',type:'Expense',category:'Bills & Utilities',subcategory:'Mobile bill',description:'Mobile plan',amount:350,need_want:'Need',fixed_variable:'Fixed',payment_method:'Wallet',recurring:true,notes:''},
  {id:'d7',transaction_date:'2026-10-10',type:'Expense',category:'Food & Groceries',subcategory:'Restaurants',description:'Dinner',amount:290,need_want:'Want',fixed_variable:'Variable',payment_method:'Cash',recurring:false,notes:''},
  {id:'d8',transaction_date:'2026-10-12',type:'Income',category:'Freelance',description:'Project payment',amount:3500,need_want:null,fixed_variable:'Variable',payment_method:'Bank Transfer',recurring:false,notes:''},
  {id:'d9',transaction_date:'2026-10-14',type:'Expense',category:'Health',description:'Pharmacy',amount:420,need_want:'Need',fixed_variable:'Variable',payment_method:'Cash',recurring:false,notes:''},
  {id:'d10',transaction_date:'2026-10-15',type:'Expense',category:'Entertainment',description:'Cinema and coffee',amount:540,need_want:'Want',fixed_variable:'Variable',payment_method:'Debit Card',recurring:false,notes:''},
  {id:'d11',transaction_date:'2026-09-28',type:'Expense',category:'Education',subcategory:'Courses',description:'Online course',amount:900,need_want:'Want',fixed_variable:'Fixed',payment_method:'Credit Card',recurring:false,notes:''},
];
const starterGoals = [{id:'g1',name:'Emergency fund',target_amount:50000,saved_amount:12500,target_date:'2027-06-30',notes:'Build a safety net'}];
const starterRecurring = [
  {id:'r1',name:'Rent',category:'Housing',amount:6500,frequency:'Monthly',next_due_date:'2026-11-01',auto_pay:true,paid_this_cycle:false,essential:true,notes:''},
  {id:'r2',name:'Mobile plan',category:'Bills & Utilities',amount:350,frequency:'Monthly',next_due_date:'2026-11-08',auto_pay:false,paid_this_cycle:false,essential:true,notes:''},
  {id:'r3',name:'Streaming subscription',category:'Entertainment',amount:220,frequency:'Monthly',next_due_date:'2026-10-25',auto_pay:true,paid_this_cycle:false,essential:false,notes:''},
];
const isGoalsAccount = account => Boolean(account && (account.is_system===true || (String(account.name||'').trim().toLowerCase()==='goals' && String(account.type||'').toLowerCase().includes('saving'))));
const localISODate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const monthNow = localISODate().slice(0,7);
const fmt = n => { let currency='EGP'; try { currency=localStorage.getItem('forma_currency')||'EGP'; } catch {} return new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:currency==='EGP'?0:2}).format(Number(n)||0); };
const firstName = name => String(name||'').trim().split(/\s+/)[0] || '';
const getGreeting = (timezone) => { let hour=new Date().getHours(); try { if(timezone) hour=Number(new Intl.DateTimeFormat('en-US',{hour:'2-digit',hourCycle:'h23',timeZone:timezone}).format(new Date())); } catch {} return hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'; };
const PROFILE_AVATARS = Array.from({length:10},(_,i)=>({id:`avatar-${String(i+1).padStart(2,'0')}`,gender:[0,2,5,6,8].includes(i)?'male':'female',src:`/avatars/avatar-${String(i+1).padStart(2,'0')}.webp`}));
const defaultAvatarForGender = gender => gender==='female'?'avatar-02':gender==='male'?'avatar-01':'avatar-01';
const avatarsForGender = gender => gender==='female'||gender==='male'?PROFILE_AVATARS.filter(avatar=>avatar.gender===gender):PROFILE_AVATARS;
function ProfileAvatar({value,className=''}){const isRemotePhoto=typeof value==='string'&&/^https?:\/\//i.test(value);const avatar=PROFILE_AVATARS.find(a=>a.id===value)||PROFILE_AVATARS[0];return <img className={`profile-avatar-image ${className}`} src={isRemotePhoto?value:avatar.src} alt="Profile avatar" referrerPolicy="no-referrer" onError={e=>{if(isRemotePhoto){e.currentTarget.onerror=null;e.currentTarget.src=avatar.src;}}}/>;}
const addFrequency = (date, frequency) => { const step=d=>{if(frequency==='Weekly')d.setDate(d.getDate()+7);else if(frequency==='Monthly')d.setMonth(d.getMonth()+1);else if(frequency==='Quarterly')d.setMonth(d.getMonth()+3);else d.setFullYear(d.getFullYear()+1);return d;};let d=new Date(`${date||localISODate()}T12:00:00`);d=step(d);while(localISODate(d)<=localISODate())d=step(d);return localISODate(d); };
const shortDate = d => d ? new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'No date';
const monthLabel = m => new Date(m+'-15T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});
const monthStart = m => `${m}-01`;
const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random());
const FEATURE_OPTIONS = [
  {key:'overview',label:'Overview',description:'Main financial summary and dashboard'},
  {key:'transactions',label:'Transactions',description:'Add, edit, import, and export transactions'},
  {key:'accounts',label:'Accounts',description:'Bank accounts, cash, wallets, and balances'},
  {key:'calendar',label:'Cash flow calendar',description:'Transactions and upcoming payment dates'},
  {key:'budgets',label:'Budgets',description:'Monthly category budgets and limits'},
  {key:'goals',label:'Savings goals',description:'Savings targets and milestones'},
  {key:'subscriptions',label:'Subscriptions & bills',description:'Recurring payments and subscription renewals'},
  {key:'debts',label:'Debts & installments',description:'Debt balances and installment schedule'},
  {key:'insights',label:'Insights & reports',description:'Financial insights, forecasts, monthly and yearly reports'},
  {key:'expense_categories',label:'Expense categories',description:'Manage your own expense categories and subcategories'},
];
const PAGE_FEATURE = {'Overview':'overview','Transactions':'transactions','Accounts':'accounts','Cash flow calendar':'calendar','Budgets':'budgets','Savings goals':'goals','Subscriptions & bills':'subscriptions','Recurring payments':'subscriptions','Debts & installments':'debts','Insights & forecast':'insights','Reports':'insights','Insights & reports':'insights','Expense categories':'expense_categories'};

const POCKET_VALID_PAGES = new Set(['Overview','Transactions','Accounts','Cash flow calendar','Budgets','Savings goals','Subscriptions & bills','Recurring payments','Debts & installments','Insights & forecast','Insights & reports','Reports','Admin access','Expense categories']);
function readPocketStartupPage(){
  try {
    const lastPage = localStorage.getItem('pocket_current_page');
    if (lastPage && POCKET_VALID_PAGES.has(lastPage)) return lastPage;
    if (lastPage === 'Accounts & wallets') return 'Accounts';
    const savedPrefs = JSON.parse(localStorage.getItem('pocket_settings_prefs') || '{}');
    const preferredPage = savedPrefs?.firstPage;
    return preferredPage && POCKET_VALID_PAGES.has(preferredPage) ? preferredPage : 'Overview';
  } catch { return 'Overview'; }
}
function WorkspaceSkeleton(){
  return <section className="workspace-skeleton" aria-label="Loading workspace" aria-busy="true">
    <div className="skeleton-heading"><div className="skeleton-block skeleton-eyebrow"/><div className="skeleton-block skeleton-title"/><div className="skeleton-block skeleton-subtitle"/></div>
    <div className="skeleton-metrics">{[1,2,3,4].map(item=><div className="skeleton-panel" key={item}><div className="skeleton-block skeleton-label"/><div className="skeleton-block skeleton-value"/><div className="skeleton-block skeleton-line"/></div>)}</div>
    <div className="skeleton-columns"><div className="skeleton-panel skeleton-chart"><div className="skeleton-block skeleton-label"/><div className="skeleton-block skeleton-chart-shape"/></div><div className="skeleton-panel skeleton-chart"><div className="skeleton-block skeleton-label"/><div className="skeleton-block skeleton-chart-shape compact"/></div></div>
    <p className="skeleton-status"><span className="pocket-loading-status-dot"/> Loading your workspace securely…</p>
  </section>;
}

function App(){
  // Restore the last visited page on refresh and on the next visit in this browser.
  const [page,setPage] = useState(readPocketStartupPage);
  useEffect(()=>{
    try { localStorage.setItem('pocket_current_page', page); } catch {}
  },[page]);
  useEffect(()=>{
    const saveCurrentPage = () => { try { localStorage.setItem('pocket_current_page', page); } catch {} };
    window.addEventListener('pagehide', saveCurrentPage);
    return () => window.removeEventListener('pagehide', saveCurrentPage);
  },[page]);
  const [transactions,setTransactions] = useState([]);
  const [expenseCategoryRevision,setExpenseCategoryRevision] = useState(0);
  useEffect(()=>{const refresh=()=>setExpenseCategoryRevision(v=>v+1);window.addEventListener('pocket-expense-categories-updated',refresh);return()=>window.removeEventListener('pocket-expense-categories-updated',refresh)},[]);
  const [budgets,setBudgets] = useState([]);
  const [goals,setGoals] = useState([]);
  const [recurring,setRecurring] = useState([]);
  const [accounts,setAccounts] = useState([]);
  const [defaultAccountId,setDefaultAccountId] = useState(()=>{try{return localStorage.getItem('pocket_default_account')||''}catch{return ''}});
  const [debts,setDebts] = useState([]);
  const [month,setMonth] = useState(monthNow);
  const [search,setSearch] = useState('');
  const [typeFilter,setTypeFilter] = useState('All types');
  const [categoryFilter,setCategoryFilter] = useState('All categories');
  const [amountSort,setAmountSort] = useState('date');
  const [modal,setModal] = useState(null);
  const [confirmDialog,setConfirmDialog] = useState(null);
  const requestConfirm=(title,description,onConfirm,confirmLabel='Delete',options={})=>setConfirmDialog({title,description,onConfirm,confirmLabel,...options});
  const [editing,setEditing] = useState(null);
  const [toast,setToast] = useState('');
  const [notificationToast,setNotificationToast] = useState(null);
  const seenNotificationIds = useRef(null);
  const [session,setSession] = useState(null);
  const [localDemoUser,setLocalDemoUser] = useState(()=>{try{return JSON.parse(localStorage.getItem('pocket_local_demo_user')||'null')}catch{return null}});
  const [localDemoSignedIn,setLocalDemoSignedIn] = useState(()=>{try{return localStorage.getItem('pocket_local_demo_signed_in')==='true' && Boolean(localStorage.getItem('pocket_local_demo_user'))}catch{return false}});
  const [localDemoUsername,setLocalDemoUsername] = useState('');
  const [localDemoPassword,setLocalDemoPassword] = useState('');
  const [localDemoAuthError,setLocalDemoAuthError] = useState('');
  const exitLocalDemo=()=>{try{localStorage.setItem('pocket_local_demo_signed_in','false')}catch{};setLocalDemoSignedIn(false);setLocalDemoUser(null);setProfile(null);setLocalDemoPassword('');setLocalDemoAuthError('');setAccountMenuOpen(false);setNotificationsOpen(false);setModal(null)};
  const enterLocalDemo=(event)=>{event?.preventDefault?.();const username=localDemoUsername.trim().toLowerCase();const account=localDemoAccounts.find(item=>item.username===username&&item.password===localDemoPassword);if(!account){setLocalDemoAuthError('Invalid username or password.');return;}const safeUser={username:account.username,role:account.role,full_name:account.full_name,email:account.email,user_id:account.user_id,enabled_features:account.enabled_features};try{localStorage.setItem('pocket_local_demo_signed_in','true');localStorage.setItem('pocket_local_demo_user',JSON.stringify(safeUser));}catch{}setLocalDemoUser(safeUser);setProfile(safeUser);setAdminUsers(localDemoAccounts.map(({password,...u})=>u));setProfileLoaded(true);setLocalDemoSignedIn(true);setLocalDemoPassword('');setLocalDemoAuthError('');setAuthMsg('');setAuthMode('choice');setPage('Overview');};
  useEffect(()=>{if(!cloudReady||!session?.user?.id)return;let alive=true;(async()=>{const {data,error}=await supabase.from('expense_categories').select('name,is_enabled').eq('user_id',session.user.id).order('name');if(!alive)return;if(!error&&Array.isArray(data)&&data.length){setExpenseCategoriesOverride(data.filter(x=>x.is_enabled!==false).map(x=>x.name));}})();return()=>{alive=false}},[session?.user?.id]);
  const [profile,setProfile] = useState(()=>{try{return !cloudReady ? JSON.parse(localStorage.getItem('pocket_local_demo_user')||'null') : null}catch{return null}});
  const [profileLoaded,setProfileLoaded] = useState(false);
  const [profileLoadError,setProfileLoadError] = useState('');
  const [profileRetry,setProfileRetry] = useState(0);
  const [dataLoadError,setDataLoadError] = useState('');
  const [dataLoadAttempt,setDataLoadAttempt] = useState(0);
  const [adminUsers,setAdminUsers] = useState([]);
  const [adminLoading,setAdminLoading] = useState(false);
  const [authEmail,setAuthEmail] = useState('');
  const [authMsg,setAuthMsg] = useState('');
  const [authMode,setAuthMode] = useState('choice');
  const [authName,setAuthName] = useState('');
  const [authGender,setAuthGender] = useState('');
  const [authPassword,setAuthPassword] = useState('');
  const [authConfirmPassword,setAuthConfirmPassword] = useState('');
  const [busy,setBusy] = useState(false);
  const [authLoading,setAuthLoading] = useState(true);
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const [accountMenuOpen,setAccountMenuOpen] = useState(false);
  const [notificationsOpen,setNotificationsOpen] = useState(false);
  const [importPreview,setImportPreview] = useState([]);
  const [year,setYear] = useState(String(new Date().getFullYear()));
  const [clock,setClock] = useState(Date.now());
  const [currency,setCurrency] = useState(()=>{try{return localStorage.getItem('forma_currency')||'EGP'}catch{return 'EGP'}});
  const [timezone,setTimezone] = useState(()=>{try{return localStorage.getItem('forma_timezone')||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch{return 'UTC'}});
  const [profileName,setProfileName] = useState(()=>{try{return localStorage.getItem('forma_profile_name')||''}catch{return ''}});
  const [profileSaving,setProfileSaving] = useState(false);
  const [theme,setTheme] = useState(()=>localStorage.getItem('forma_theme')||'light');
  const [design,setDesign] = useState(()=>localStorage.getItem('forma_design')||'classic');
  const [sidebarSize,setSidebarSize] = useState(()=>localStorage.getItem('forma_sidebar_size')||'comfortable');
  const [profileAvatar,setProfileAvatar] = useState(()=>{const saved=localStorage.getItem('forma_profile_avatar');return PROFILE_AVATARS.some(a=>a.id===saved)?saved:'avatar-01'});
  const [avatarPickerGender,setAvatarPickerGender] = useState('prefer_not_to_say');
  const [backupForUsers,setBackupForUsers] = useState(false);
  const [paidBusy,setPaidBusy] = useState([]);
  const [localLoaded,setLocalLoaded] = useState(false);
  const [settingsCloudUserId,setSettingsCloudUserId] = useState('');
  const [accountsLoaded,setAccountsLoaded] = useState(false);
  const [accessRequestBusy,setAccessRequestBusy] = useState(false);
  const isDemo = !cloudReady;

  useEffect(()=>{
    if(!accountMenuOpen && !notificationsOpen) return;
    const handlePointerDown = (event) => {
      if(!(event.target instanceof Element)) return;
      if(accountMenuOpen && !event.target.closest('.account-popover') && !event.target.closest('.account-trigger')) setAccountMenuOpen(false);
      if(notificationsOpen && !event.target.closest('.notification-popover') && !event.target.closest('.notification-btn')) setNotificationsOpen(false);
    };
    const handleKeyDown = (event) => { if(event.key === 'Escape') { setAccountMenuOpen(false); setNotificationsOpen(false); } };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('pointerdown', handlePointerDown); document.removeEventListener('keydown', handleKeyDown); };
  },[accountMenuOpen,notificationsOpen]);

  useEffect(()=>{
    const overlayOpen = Boolean(modal || confirmDialog || notificationsOpen || accountMenuOpen);
    const previousOverflow = document.body.style.overflow;
    if(overlayOpen) document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if(event.key !== 'Escape') return;
      if(confirmDialog) setConfirmDialog(null);
      else if(modal) { setModal(null); setEditing(null); }
      setAccountMenuOpen(false); setNotificationsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return ()=>{ document.body.style.overflow = previousOverflow; document.removeEventListener('keydown',handleKeyDown); };
  },[modal,confirmDialog,notificationsOpen,accountMenuOpen]);

  useEffect(()=>{
    localStorage.setItem('forma_theme',theme);
    localStorage.setItem('pocket_language','en');
    document.documentElement.lang='en';
    document.documentElement.dir='ltr';
    localStorage.setItem('forma_design',design);
    localStorage.setItem('forma_sidebar_size',sidebarSize);
    localStorage.setItem('forma_profile_avatar',profileAvatar);
    document.documentElement.dataset.theme=theme;
    document.documentElement.dataset.design=design;
  },[theme,design,sidebarSize,profileAvatar]);

  useEffect(()=>{
    const loadLocal = () => {
      const read=(k,f)=>{try{return JSON.parse(localStorage.getItem('forma_'+k))||f}catch{return f}};
      setTransactions(read('transactions',demoTransactions));
      setBudgets(read('budgets',expenseCategories.map(c=>({id:'b'+c,category:c,month:monthStart(monthNow),amount: c==='Food & Groceries'?3500:c==='Transportation'?1800:c==='Housing'?6500:c==='Bills & Utilities'?1200:1000}))));
      setGoals(read('goals',starterGoals));
      setRecurring(read('recurring',starterRecurring));
      setAccounts(read('accounts',[{id:'acc-cash',name:'Cash',type:'Cash',opening_balance:0,color:'#50b99a'},{id:'acc-bank',name:'Main bank',type:'Bank account',opening_balance:0,color:'#6c7cf5'},{id:'acc-wallet',name:'E-wallet',type:'Digital wallet',opening_balance:0,color:'#f5b85b'}]));
      setDebts(read('debts',[]));
      setLocalLoaded(true);
    };
    if(!cloudReady){loadLocal();setAuthLoading(false);return;}
    let alive=true;
    supabase.auth.getSession().then(({data,error})=>{
      if(!alive)return;
      if(error)setAuthMsg(error.message);
      const authHash = new URLSearchParams(window.location.hash.replace(/^#/,''));
      if(authHash.get('type')==='recovery'){
        setAuthMode('update-password');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthMsg('Choose a new password for your Pocket account.');
      }
      const authError = authHash.get('error_description') || authHash.get('error');
      if(authError){setAuthMode('signin');setAuthMsg(decodeURIComponent(authError.replace(/\+/g,' ')));}
      setSession(data?.session||null);
      setAuthLoading(false);
    }).catch(error=>{
      if(!alive)return;
      setAuthMsg(error?.message||'Could not restore your session. Please sign in again.');
      setSession(null);
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{
      if(event==='PASSWORD_RECOVERY'){
        setAuthMode('update-password');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthMsg('Choose a new password for your Pocket account.');
      }
      setSession(s);
      setAuthLoading(false);
    });
    return ()=>{alive=false;subscription.unsubscribe()};
  },[]);
  useEffect(()=>{
    let alive=true;
    if(!cloudReady || !session?.user?.id){setProfile(null);setAdminUsers([]);setProfileLoadError('');setProfileLoaded(true);return ()=>{alive=false};}
    setProfileLoaded(false);setProfileLoadError('');
    (async()=>{
      try {
        const {data,error}=await supabase.from('profiles').select('id,email,full_name,role,enabled_features,created_at').eq('id',session.user.id).maybeSingle();
        if(!alive)return;
        if(error){setProfile(null);setProfileLoadError('Could not load your access profile. Check your connection and Supabase profile policies.');return;}
        if(!data){setProfile(null);setProfileLoadError('Your access profile could not be found. Contact the Pocket administrator.');return;}
        setProfile(data);
        const {data:settingData}=await supabase.from('app_settings').select('value').eq('key','backup_restore_for_users').maybeSingle();
        if(alive)setBackupForUsers(settingData?.value===true);
        if(['owner','super_admin'].includes(data.role)){
          setAdminLoading(true);
          const {data:users,error:usersError}=await supabase.rpc('admin_list_users');
          if(alive){if(usersError)setToast('Could not load user access list: '+usersError.message);else setAdminUsers(users||[]);setAdminLoading(false);}
        } else {setAdminUsers([]);setAdminLoading(false);}
      } catch (error) {
        if(alive)setProfileLoadError(error?.message||'Could not load your access profile.');
      } finally {
        if(alive)setProfileLoaded(true);
      }
    })();
    return ()=>{alive=false};
  },[session?.user?.id,profileRetry]);
  useEffect(()=>{
    if(session?.user){
      const meta=session.user.user_metadata||{};
      const nextCurrency=meta.currency||'EGP';
      const nextTimezone=meta.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
      setCurrency(nextCurrency);setTimezone(nextTimezone);
      localStorage.setItem('forma_currency',nextCurrency);localStorage.setItem('forma_timezone',nextTimezone);
      if(meta.full_name)setProfileName(meta.full_name);
      // Keep a user's explicit Pocket avatar if one is saved; otherwise use the photo supplied by Google OAuth.
      const googlePhoto=meta.picture||meta.avatar_url||meta.photo_url||session.user.identities?.find(identity=>identity.provider==='google')?.identity_data?.picture;
      if(meta.avatar)setProfileAvatar(meta.avatar);
      else if(googlePhoto)setProfileAvatar(googlePhoto);
      else {const genderDefault=defaultAvatarForGender(meta.gender);setProfileAvatar(genderDefault);localStorage.setItem('forma_profile_avatar',genderDefault);}
    }
  },[session?.user?.id]);
  useEffect(()=>{
    if(!cloudReady || !session?.user) {setAccountsLoaded(!cloudReady);return;}
    let alive=true;
    (async()=>{
      setAccountsLoaded(false);
      setDataLoadError('');
      setBusy(true);
      try {
        const [t,b,g,r,a,d]=await Promise.all([
          supabase.from('transactions').select('*').order('transaction_date',{ascending:false}),
          supabase.from('budgets').select('*').order('month',{ascending:false}),
          supabase.from('savings_goals').select('*').order('created_at',{ascending:false}),
          supabase.from('recurring_payments').select('*').order('next_due_date',{ascending:true}),
          supabase.from('financial_accounts').select('*').order('created_at',{ascending:true}),
          supabase.from('debts').select('*').order('due_date',{ascending:true})
        ]);
        if(!alive)return;
        const errors=[t,b,g,r,a,d].filter(result=>result.error).map(result=>result.error.message);
        if(!t.error)setTransactions(t.data||[]);
        if(!b.error)setBudgets(b.data||[]);
        if(!g.error)setGoals(g.data||[]);
        if(!r.error)setRecurring(r.data||[]);
        if(!a.error)setAccounts(a.data||[]);
        if(!d.error)setDebts(d.data||[]);
        if(errors.length)setDataLoadError(`Some data could not be loaded: ${[...new Set(errors)].join(' · ')}`);
      } catch(error) {
        if(alive)setDataLoadError(error?.message||'Could not load your workspace data.');
      } finally {
        if(alive){setAccountsLoaded(true);setBusy(false);}
      }
    })();
    return ()=>{alive=false};
  },[session?.user?.id,dataLoadAttempt]);
  useEffect(()=>{
    if(!cloudReady && localLoaded){
      localStorage.setItem('forma_transactions',JSON.stringify(transactions));
      localStorage.setItem('forma_budgets',JSON.stringify(budgets));
      localStorage.setItem('forma_goals',JSON.stringify(goals));
      localStorage.setItem('forma_recurring',JSON.stringify(recurring));
      localStorage.setItem('forma_accounts',JSON.stringify(accounts));
      localStorage.setItem('forma_debts',JSON.stringify(debts));
    }
  },[transactions,budgets,goals,recurring,accounts,debts,localLoaded]);
  useEffect(()=>{const t=setInterval(()=>setClock(Date.now()),60000);return()=>clearInterval(t)},[]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(t)},[toast]);


  // Sync account preferences to Supabase; localStorage is only a startup cache, not the source of truth.
  useEffect(()=>{
    const uid=session?.user?.id;
    if(!cloudReady||!uid)return;
    let alive=true;
    (async()=>{
      const {data,error}=await supabase.from('user_settings').select('settings').eq('user_id',uid).maybeSingle();
      if(!alive)return;
      if(!error&&data?.settings){
        const v=data.settings;
        if(v.currency){setCurrency(v.currency);localStorage.setItem('forma_currency',v.currency)}
        if(v.timezone){setTimezone(v.timezone);localStorage.setItem('forma_timezone',v.timezone)}
        if(v.profileName!==undefined){setProfileName(v.profileName||'');localStorage.setItem('forma_profile_name',v.profileName||'')}
        if(v.theme){setTheme(v.theme);localStorage.setItem('forma_theme',v.theme)}
        if(v.design){setDesign(v.design);localStorage.setItem('forma_design',v.design)}
        if(v.sidebarSize){setSidebarSize(v.sidebarSize);localStorage.setItem('forma_sidebar_size',v.sidebarSize)}
        if(v.profileAvatar){setProfileAvatar(v.profileAvatar);localStorage.setItem('forma_profile_avatar',v.profileAvatar)}
        if(v.defaultAccountId!==undefined){setDefaultAccountId(v.defaultAccountId||'');localStorage.setItem('pocket_default_account',v.defaultAccountId||'')}
        if(Array.isArray(v.expenseCategories)){localStorage.setItem('pocket_expense_categories',JSON.stringify(v.expenseCategories));setExpenseCategoriesOverride(v.expenseCategories)}
        if(v.subcategories&&typeof v.subcategories==='object')localStorage.setItem('pocket_subcategories',JSON.stringify(v.subcategories));
      }
      if(alive)setSettingsCloudUserId(uid);
    })();
    return()=>{alive=false};
  },[session?.user?.id,cloudReady]);
  useEffect(()=>{
    const uid=session?.user?.id;
    if(!cloudReady||!uid||settingsCloudUserId!==uid)return;
    let subcategories={},savedCategories=[];
    try{subcategories=JSON.parse(localStorage.getItem('pocket_subcategories')||'{}')}catch{}
    try{savedCategories=JSON.parse(localStorage.getItem('pocket_expense_categories')||'[]')}catch{}
    (async()=>{const {data:existingRow,error:readError}=await supabase.from('user_settings').select('settings').eq('user_id',uid).maybeSingle();if(readError){console.error('Could not read settings before syncing:',readError.message);return;}const preserved=existingRow?.settings&&typeof existingRow.settings==='object'?existingRow.settings:{};const settings={...preserved,currency,timezone,profileName,theme,design,sidebarSize,profileAvatar,defaultAccountId,
      expenseCategories:Array.isArray(savedCategories)?savedCategories:[],subcategories};
    const {error}=await supabase.from('user_settings').upsert({user_id:uid,settings,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)console.error('Could not sync settings to Supabase:',error.message);})();
  },[session?.user?.id,cloudReady,settingsCloudUserId,currency,timezone,profileName,theme,design,sidebarSize,profileAvatar,defaultAccountId,expenseCategoryRevision]);
    const monthTx=useMemo(()=>transactions.filter(t=>(t.transaction_date||'').slice(0,7)===month),[transactions,month]);
  const income=monthTx.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount||0),0);
  const expenses=monthTx.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount||0),0);
  const net=income-expenses, savingsRate=income?net/income*100:0;
  const filtered=useMemo(()=>transactions.filter(t=>{
    const q=search.toLowerCase();
    const matchesSearch=(t.description||'').toLowerCase().includes(q)||(t.category||'').toLowerCase().includes(q)||(t.notes||'').toLowerCase().includes(q);
    return matchesSearch && (typeFilter==='All types'||t.type===typeFilter) && (categoryFilter==='All categories'||t.category===categoryFilter);
  }),[transactions,search,typeFilter,categoryFilter]);
  const monthlySeries=useMemo(()=>Array.from({length:6},(_,i)=>{
    const [yy,mm]=month.split('-').map(Number);const d=new Date(yy,mm-1,1,12);d.setMonth(d.getMonth()-(5-i));const m=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const list=transactions.filter(t=>(t.transaction_date||'').slice(0,7)===m);
    return {month:new Date(m+'-15T12:00:00').toLocaleDateString('en-US',{month:'short'}),Income:list.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount),0),Expenses:list.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount),0)};
  }),[transactions,month]);
  const categoryData=useMemo(()=>expenseCategories.map(c=>({name:c,value:monthTx.filter(t=>t.type==='Expense'&&t.category===c).reduce((s,t)=>s+Number(t.amount),0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value),[monthTx]);
  const needs=monthTx.filter(t=>t.type==='Expense'&&t.need_want==='Need').reduce((s,t)=>s+Number(t.amount),0);
  const wants=monthTx.filter(t=>t.type==='Expense'&&t.need_want==='Want').reduce((s,t)=>s+Number(t.amount),0);
  const monthBudgets=budgets.filter(b=>(b.month||'').slice(0,7)===month);
  const totalBudget=monthBudgets.reduce((s,b)=>s+Number(b.amount||0),0);
  const totalSaved=goals.reduce((s,g)=>s+Number(g.saved_amount||0)+transactions.filter(t=>t.type==='Transfer'&&String(t.goal_id)===String(g.id)).reduce((v,t)=>{const from=accounts.find(a=>String(a.id)===String(t.account_id)),to=accounts.find(a=>String(a.id)===String(t.to_account_id));if(isGoalsAccount(from))return v-Number(t.amount||0);if(isGoalsAccount(to))return v+Number(t.amount||0);const fs=String(from?.type||'').toLowerCase().includes('saving'),ts=String(to?.type||'').toLowerCase().includes('saving');return v+(fs&&!ts?-1:1)*Number(t.amount||0)},0),0);
  const goalTarget=goals.reduce((s,g)=>s+Number(g.target_amount||0),0);
  const upcoming=recurring.filter(r=>!r.paid_this_cycle).sort((a,b)=>(a.next_due_date||'').localeCompare(b.next_due_date||'')).slice(0,4);
  const todayISO=localISODate();
  const activeMonth=todayISO.slice(0,7);
  const budgetAlerts=budgets.filter(b=>(b.month||'').slice(0,7)===activeMonth).map(b=>{const spent=transactions.filter(t=>t.type==='Expense'&&(t.transaction_date||'').slice(0,7)===activeMonth&&t.category===b.category).reduce((sum,t)=>sum+Number(t.amount||0),0);const pct=Number(b.amount)>0?spent/Number(b.amount)*100:0;return {...b,spent,pct};}).filter(b=>b.pct>=90).map(b=>({id:`budget-${b.id}`,kind:'budget',name:`${b.category} budget at ${Math.round(b.pct)}%`,detail:`${fmt(b.spent)} of ${fmt(b.amount)} used`,target:'Budgets',amount:null,pct:b.pct}));
  const notificationDueLimit=(()=>{const date=new Date(`${todayISO}T12:00:00`);date.setDate(date.getDate()+2);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`})();
  const debtAlerts=debts.filter(d=>Number(d.remaining_amount||0)>0&&d.due_date&&d.due_date<=notificationDueLimit).map(d=>({id:`debt-${d.id}`,kind:'debt',name:d.name,detail:`${d.due_date<todayISO?'Overdue':d.due_date===todayISO?'Due today':'Due soon'} · ${d.due_date}`,target:'Debts & installments',amount:Number(d.monthly_payment||0)}));
  const notificationPayments=recurring.filter(r=>!r.paid_this_cycle&&r.next_due_date&&r.next_due_date<=notificationDueLimit).sort((a,b)=>(a.next_due_date||'').localeCompare(b.next_due_date||''));
  const notificationItems=[...budgetAlerts,...debtAlerts,...notificationPayments.map(r=>({id:`recurring-${r.id}`,kind:'recurring',name:r.name,detail:r.next_due_date?`${r.next_due_date<todayISO?'Overdue':r.next_due_date===todayISO?'Due today':'Due soon'} · ${new Date(r.next_due_date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})} · ${r.frequency||'Recurring'}`:'Upcoming payment',target:'Recurring payments',amount:Number(r.amount||0)}))];
  useEffect(()=>{
    const currentIds=new Set(notificationItems.map(item=>String(item.id)));
    if(seenNotificationIds.current===null){seenNotificationIds.current=currentIds;return;}
    const added=notificationItems.find(item=>!seenNotificationIds.current.has(String(item.id)));
    seenNotificationIds.current=currentIds;
    if(added){setNotificationToast(added);}
  },[notificationItems.map(item=>item.id).join('|')]);
  useEffect(()=>{if(!notificationToast)return;const timer=setTimeout(()=>setNotificationToast(null),4800);return()=>clearTimeout(timer)},[notificationToast]);
  const displayName=titleCaseName(session ? (session.user.user_metadata?.full_name||session.user.email?.split('@')[0]||'there') : (localDemoUser?.full_name||profileName||'there'));
  const greeting=getGreeting(session?.user?.user_metadata?.timezone||timezone);
  void clock; void currency;

  async function saveRecord(table,record,existingId){
    if(cloudReady && session?.user){
      const payload={...record,user_id:session.user.id};delete payload.id;
      const res=existingId?await supabase.from(table).update(payload).eq('id',existingId).select().single():await supabase.from(table).insert(payload).select().single();
      if(res.error){setToast(res.error.message);return null;}return res.data;
    }
    return {...record,id:existingId||uid()};
  }
  async function removeRecord(table,id,setter,list){
    if(table==='financial_accounts'&&isGoalsAccount((list||[]).find(x=>String(x.id)===String(id)))){setToast('The system Goals account cannot be deleted.');return;}
    const deletedTransaction=table==='transactions'?(transactions||[]).find(t=>String(t.id)===String(id)):null;
    const linkedDebtPayment=deletedTransaction&&deletedTransaction.type==='Expense'&&deletedTransaction.debt_id&&String(deletedTransaction.notes||'').startsWith('Debt installment ')?deletedTransaction:null;
    const linkedDebt=linkedDebtPayment?(debts||[]).find(d=>String(d.id)===String(linkedDebtPayment.debt_id)):null;
    try{
      if(cloudReady&&session?.user){
        // Ask Supabase to return the deleted row so an RLS/no-match delete cannot
        // silently look successful in the UI.
        const {data,error}=await supabase.from(table).delete().eq('id',id).eq('user_id',session.user.id).select('id');
        if(error){setToast(`Could not delete item: ${error.message}`);return;}
        if(!data||data.length===0){
          setToast('Could not delete this item. Check your connection and account permissions, then refresh and try again.');
          return;
        }
      }
      setter(old=>Array.isArray(old)?old.filter(x=>String(x.id)!==String(id)):list.filter(x=>String(x.id)!==String(id)));
      if(linkedDebtPayment&&linkedDebt){
        const amount=Number(linkedDebtPayment.amount||0);
        const total=Number(linkedDebt.total_repayment||linkedDebt.original_amount||0);
        const nextPaid=Math.max(0,Number(linkedDebt.paid_installments||0)-1);
        const nextAmountPaid=Math.max(0,Number((Number(linkedDebt.amount_paid??Math.max(0,total-Number(linkedDebt.remaining_amount||0))-amount)).toFixed(2)));
        const nextRemaining=Math.min(total,Math.max(0,Number((Number(linkedDebt.remaining_amount||0)+amount).toFixed(2))));
        let previousDue=linkedDebt.due_date||null;
        if(previousDue){const d=new Date(`${previousDue}T12:00:00`);if(linkedDebt.frequency==='Weekly')d.setDate(d.getDate()-7);else if(linkedDebt.frequency==='Quarterly')d.setMonth(d.getMonth()-3);else if(linkedDebt.frequency==='Yearly')d.setFullYear(d.getFullYear()-1);else d.setMonth(d.getMonth()-1);previousDue=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
        const debtPayload={name:linkedDebt.name,debt_type:linkedDebt.debt_type||'Other',lender:linkedDebt.lender||'',account_id:linkedDebt.account_id||null,original_amount:Number(linkedDebt.original_amount||0),remaining_amount:nextRemaining,monthly_payment:Number(linkedDebt.monthly_payment||0),due_date:previousDue,frequency:linkedDebt.frequency||'Monthly',notes:linkedDebt.notes||'',start_date:linkedDebt.start_date||null,term_months:linkedDebt.term_months||null,total_repayment:total,interest_rate:Number(linkedDebt.interest_rate||0),paid_installments:nextPaid,amount_paid:nextAmountPaid};
        const savedDebt=await saveRecord('debts',debtPayload,linkedDebt.id);
        if(savedDebt){setDebts(old=>old.map(d=>String(d.id)===String(linkedDebt.id)?savedDebt:d));setToast('Transaction deleted and debt balance restored');}
        else setToast('Transaction deleted, but the debt update failed. Refresh and check the debt card.');
      }else setToast('Deleted successfully');
    }catch(err){
      setToast(err?.message||'Could not delete item. Please try again.');
    }
  }
  async function deleteRecurringPayment(payment){
    if(!payment?.id)return;
    requestConfirm('Delete recurring payment?', `“${payment.name||'This recurring payment'}” will be permanently removed. This action cannot be undone.`, async()=>{
    try{
      if(cloudReady && session?.user){
        // Do not request a returned row: DELETE + SELECT can fail when a project's
        // SELECT grants/policies differ, even though the user is allowed to delete.
        const {error}=await supabase.from('recurring_payments').delete().eq('id',payment.id).eq('user_id',session.user.id);
        if(error){setToast(`Could not delete payment: ${error.message}`);return;}
      }
      setRecurring(old=>old.filter(item=>String(item.id)!==String(payment.id)));
      setToast('Recurring payment deleted');
    }catch(error){setToast(error?.message||'Could not delete payment. Please try again.');}
    });
  }
  async function submitTransaction(form){
    if(!editing && !accounts.some(a=>!isGoalsAccount(a))){
      setModal(null);
      setToast('Add an account or wallet first. Go to Accounts → Add account, then come back to add your transaction.');
      setPage('Accounts');
      return;
    }
    if(!form.account_id || !accounts.some(account=>String(account.id)===String(form.account_id))){
      setToast('Choose an account or wallet for this transaction before saving.');
      return;
    }
    if(form.type==='Transfer' && (!form.to_account_id || String(form.to_account_id)===String(form.account_id))){setToast('Choose two different accounts or wallets for a transfer.');return;}
    const source=accounts.find(a=>String(a.id)===String(form.account_id));
    const destination=form.type==='Transfer'?accounts.find(a=>String(a.id)===String(form.to_account_id)):null;
    if(form.type!=='Transfer'&&isGoalsAccount(source)){setToast('The Goals account can only be used for transfers.');return;}
    if(form.type==='Transfer'&&(isGoalsAccount(source)||isGoalsAccount(destination))&&(!form.goal_id||!goals.some(g=>String(g.id)===String(form.goal_id)))){setToast('Choose which savings goal this transfer belongs to.');return;}
    if(form.type==='Transfer'&&isGoalsAccount(source)){
      const selectedGoal=goals.find(g=>String(g.id)===String(form.goal_id));
      const goalBalance=Number(selectedGoal?.saved_amount||0)+transactions.filter(t=>t.type==='Transfer'&&String(t.goal_id)===String(form.goal_id)&&String(t.id)!==String(editing?.id)).reduce((sum,t)=>{const from=accounts.find(a=>String(a.id)===String(t.account_id)),to=accounts.find(a=>String(a.id)===String(t.to_account_id));if(isGoalsAccount(from))return sum-Number(t.amount||0);if(isGoalsAccount(to))return sum+Number(t.amount||0);return sum+Number(t.amount||0)},0);
      if(Number(form.amount)>goalBalance){setToast(`This goal only has ${new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:2}).format(Math.max(0,goalBalance))} available to withdraw.`);return;}
    }
    const sourceIn=transactions.filter(t=>(t.type==='Income'&&String(t.account_id)===String(source?.id))||(t.type==='Transfer'&&String(t.to_account_id)===String(source?.id))).reduce((sum,t)=>sum+Number(t.amount||0),0);
    const sourceOut=transactions.filter(t=>((t.type==='Expense'||t.type==='Transfer')&&String(t.account_id)===String(source?.id))).reduce((sum,t)=>sum+Number(t.amount||0),0);
    let available=Number(source?.opening_balance||0)+sourceIn-sourceOut;
    if(editing && String(editing.account_id)===String(source?.id) && (editing.type==='Expense'||editing.type==='Transfer')) available+=Number(editing.amount||0);
    if((form.type==='Expense'||form.type==='Transfer') && Number(form.amount)>available){setToast(`Insufficient balance in ${source?.name||'this account'}. Available: ${new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:2}).format(Math.max(0,available))}.`);return;}
    const payload={transaction_date:form.transaction_date,type:form.type,category:form.type==='Transfer'?'Transfer':form.category,subcategory:form.type==='Transfer'?(form.goal_id?(goals.find(g=>String(g.id)===String(form.goal_id))?.name||'Transfer'):'Transfer'):(form.subcategory||null),description:form.description,amount:Number(form.amount),need_want:form.type==='Expense'?form.need_want:null,fixed_variable:form.fixed_variable,payment_method:accounts.find(a=>String(a.id)===String(form.account_id))?.name||'Unassigned',account_id:form.account_id||null,to_account_id:form.type==='Transfer'?form.to_account_id||null:null,goal_id:form.type==='Transfer'?(form.goal_id||null):null,debt_id:form.debt_id||null,recurring:form.type==='Transfer'?false:form.recurring,notes:form.notes};
    const saved=await saveRecord('transactions',payload,editing?.id);if(!saved)return;
    setTransactions(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);
    setModal(null);setEditing(null);setToast(editing?'Transaction updated':'Transaction added');
  }
  async function addGoal(form){
    const p={name:form.name,goal_type:form.goal_type||'Other',target_amount:Number(form.target_amount),saved_amount:Number(form.saved_amount||0),target_date:form.target_date||null,notes:form.notes||''};
    const saved=await saveRecord('savings_goals',p,editing?.id);if(!saved)return;
    setGoals(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);setModal(null);setEditing(null);setToast('Goal saved');
  }
  async function addRecurring(form){
    const p={name:form.name,category:form.category,subcategory:form.subcategory||null,amount:Number(form.amount),frequency:form.frequency,next_due_date:form.next_due_date||null,account_id:form.account_id||null,auto_pay:form.auto_pay,paid_this_cycle:form.paid_this_cycle,last_paid_date:editing?.last_paid_date||null,essential:form.essential,notes:form.notes||''};
    const saved=await saveRecord('recurring_payments',p,editing?.id);if(!saved)return;
    setRecurring(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);setModal(null);setEditing(null);setToast('Payment saved');
  }
  async function addBudget(form){
    const p={category:form.category,month:monthStart(form.month),amount:Number(form.amount)};
    const saved=await saveRecord('budgets',p,editing?.id);if(!saved)return;
    // Immediately replace by id OR category/month so the card always uses the latest saved amount.
    // This also handles older rows whose ID changed during a migration/import.
    const savedMonth=(saved.month||p.month||'').slice(0,7);
    setBudgets(old=>{
      const match=x=>String(x.id)===String(saved.id)||(x.category===saved.category&&(x.month||'').slice(0,7)===savedMonth);
      return [saved,...old.filter(x=>!match(x))];
    });
    if(savedMonth)setMonth(savedMonth);
    setPage('Budgets');
    setModal(null);setEditing(null);setToast('Budget updated');
    // Refresh from Supabase after the write; only replace state if the read succeeds.
    if(cloudReady&&session?.user){
      const {data,error}=await supabase.from('budgets').select('*').order('month',{ascending:false});
      if(!error&&Array.isArray(data))setBudgets(data);
    }
  }
  async function saveAccount(form){
    if(isGoalsAccount(editing)){setToast('The system Goals account cannot be edited.');return;}
    const payload={name:form.name.trim(),type:form.type,opening_balance:Number(form.opening_balance||0),opening_balance_date:form.opening_balance_date||localISODate(),color:form.color||'#6c7cf5'};
    const saved=await saveRecord('financial_accounts',payload,editing?.id);if(!saved)return;
    setAccounts(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);setModal(null);setEditing(null);setToast('Account saved');
  }
  async function createSetupAccount(form){
    const payload={name:form.name.trim(),type:form.type,opening_balance:Number(form.opening_balance||0),opening_balance_date:form.opening_balance_date||localISODate(),color:form.color||'#6c7cf5'};
    const saved=await saveRecord('financial_accounts',payload);if(!saved)return;
    setAccounts(old=>[saved,...old]);setToast('Your account is ready. You can start using Pocket now.');
  }
  async function saveDebt(form){
    const principal=Number(form.original_amount||0), installment=Number(form.monthly_payment||0), term=Math.max(0,Number(form.term_months||0));
    const totalRepayment=term>0&&installment>0?Number((installment*term).toFixed(2)):Number(form.total_repayment||principal);
    const startDate=form.start_date||null,dueDate=form.due_date||null;let paidCount=Math.max(0,Number(form.paid_installments??editing?.paid_installments??0));if(startDate&&dueDate){const a=new Date(`${startDate}T12:00:00`),b=new Date(`${dueDate}T12:00:00`);if(!Number.isNaN(a.getTime())&&!Number.isNaN(b.getTime())){let months=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());if(b.getDate()<a.getDate())months--;paidCount=Math.max(0,Math.min(term||600,months));}}
    const amountPaid=Math.min(totalRepayment,Math.max(0,Number((paidCount*installment).toFixed(2))));
    const remaining=Math.max(0,Number((totalRepayment-amountPaid).toFixed(2)));
    const interestRate=principal>0&&totalRepayment>0?Number((((totalRepayment-principal)/principal)*100).toFixed(2)):0;
    const payload={name:form.name.trim(),debt_type:form.debt_type||'Other',lender:form.lender||'',account_id:form.account_id||null,original_amount:principal,remaining_amount:remaining,monthly_payment:installment,due_date:form.due_date||null,frequency:'Monthly',notes:form.notes||'',start_date:form.start_date||null,term_months:term||null,total_repayment:totalRepayment,interest_rate:interestRate,paid_installments:paidCount,amount_paid:amountPaid};
    const saved=await saveRecord('debts',payload,editing?.id);if(!saved)return;
    setDebts(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);setModal(null);setEditing(null);setToast('Debt saved');
  }
  async function recordDebtInstallment(debt,accountId){
    accountId=accountId||debt.account_id;
    const account=accounts.find(a=>String(a.id)===String(accountId));
    if(!account){setToast('Choose the account to pay this installment from.');return;}
    if(isGoalsAccount(account)){setToast('The Goals account can only be used for transfers.');return;}
    const total=Number(debt.total_repayment||debt.original_amount||0), installment=Number(debt.monthly_payment||0), paid=Number(debt.paid_installments||0), amountPaid=Number(debt.amount_paid??Math.max(0,total-Number(debt.remaining_amount||0)));
    const payment=Math.min(installment,Number(debt.remaining_amount||0));
    if(payment<=0){setToast('This debt is already fully paid.');return;}
    if(installment<=0){setToast('Add an installment amount before recording a payment.');return;}
    const accountIn=transactions.filter(t=>(t.type==='Income'&&String(t.account_id)===String(account.id))||(t.type==='Transfer'&&String(t.to_account_id)===String(account.id))).reduce((sum,t)=>sum+Number(t.amount||0),0);
    const accountOut=transactions.filter(t=>((t.type==='Expense'||t.type==='Transfer')&&String(t.account_id)===String(account.id))).reduce((sum,t)=>sum+Number(t.amount||0),0);
    const balance=Number(account.opening_balance||0)+accountIn-accountOut;
    if(payment>balance){setToast(`Insufficient balance in ${account.name}. Available: ${fmt(balance)}.`);return;}
    const nextPaid=paid+1, nextAmountPaid=Math.min(total,Number((amountPaid+payment).toFixed(2))), nextRemaining=Math.max(0,Number((total-nextAmountPaid).toFixed(2)));
    let nextDue=debt.due_date||null;if(nextDue){const d=new Date(`${nextDue}T12:00:00`);if(debt.frequency==='Weekly')d.setDate(d.getDate()+7);else if(debt.frequency==='Quarterly')d.setMonth(d.getMonth()+3);else if(debt.frequency==='Yearly')d.setFullYear(d.getFullYear()+1);else d.setMonth(d.getMonth()+1);nextDue=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
    const txPayload={transaction_date:localISODate(),type:'Expense',category:'Debt repayment',subcategory:debt.debt_type||'Installment',description:`Installment · ${debt.name}`,amount:payment,need_want:'Need',fixed_variable:'Fixed',payment_method:account.name,account_id:account.id,to_account_id:null,goal_id:null,debt_id:debt.id,recurring:false,notes:`Debt installment ${nextPaid}`};
    const txSaved=await saveRecord('transactions',txPayload);if(!txSaved)return;
    const payload={name:debt.name,debt_type:debt.debt_type||'Other',lender:debt.lender||'',account_id:debt.account_id||account.id,original_amount:Number(debt.original_amount||0),remaining_amount:nextRemaining,monthly_payment:installment,due_date:nextDue,frequency:debt.frequency||'Monthly',notes:debt.notes||'',start_date:debt.start_date||null,term_months:debt.term_months||null,total_repayment:total,interest_rate:Number(debt.interest_rate||0),paid_installments:nextPaid,amount_paid:nextAmountPaid};
    const saved=await saveRecord('debts',payload,debt.id);if(!saved){await removeRecord('transactions',txSaved.id,setTransactions,transactions);return;}
    setTransactions(old=>[txSaved,...old]);setDebts(old=>old.map(x=>x.id===debt.id?saved:x));setToast(`Installment recorded from ${account.name}`);
  }

  async function signIn(e){
    e.preventDefault(); if(!supabase)return;
    setBusy(true);setAuthMsg('');
    const loginId=authEmail.trim();
    const loginEmail=loginId.includes('@')?loginId:`${loginId.toLowerCase().replace(/[^a-z0-9._-]/g,'-')}@users.pocket.local`;
    const {error}=await supabase.auth.signInWithPassword({email:loginEmail,password:authPassword});
    setBusy(false);
    if(error){
      const message=String(error.message||'');
      if(/email not confirmed|email_not_confirmed|confirm your email/i.test(message)){
        setAuthMsg('Your email is not confirmed yet. Check your inbox or resend the confirmation email below.');
      }else setAuthMsg(message);
    }
  }
  async function resendConfirmation(){
    if(!supabase)return;
    const email=authEmail.trim();
    if(!email){setAuthMsg('Enter your email address first, then resend the confirmation email.');return;}
    setBusy(true);setAuthMsg('');
    const {error}=await supabase.auth.resend({
      type:'signup',
      email,
      options:{emailRedirectTo:authRedirectUrl()}
    });
    setBusy(false);
    setAuthMsg(error ? error.message : 'If this address has a pending confirmation, a new confirmation email has been sent. Check your inbox and spam folder.');
  }
  async function signInWithGoogle(){
    if(!supabase){setAuthMsg('Google sign-in is unavailable until Supabase is configured.');return;}
    setBusy(true);setAuthMsg('');
    const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:authRedirectUrl()}});
    if(error){setBusy(false);setAuthMsg(error.message);}
  }
  async function signUp(e){
    e.preventDefault(); if(!supabase)return;
    if(authPassword.length<8){setAuthMsg('Use a password with at least 8 characters.');return;}
    setBusy(true);setAuthMsg('');
    const {data,error}=await supabase.auth.signUp({
      email:authEmail.trim(),
      password:authPassword,
      options:{data:{full_name:authName.trim(),gender:authGender,avatar:defaultAvatarForGender(authGender)},emailRedirectTo:authRedirectUrl()}
    });
    setBusy(false);
    if(error){setAuthMsg(error.message);return;}
    if(data.session){setAuthMsg('Account created successfully.');}
    else {setAuthMode('signin');setAuthMsg('Account created! Check your email to confirm your address, then sign in.');}
  }
  async function resetPassword(e){
    e.preventDefault(); if(!supabase)return;
    setBusy(true);setAuthMsg('');
    const {error}=await supabase.auth.resetPasswordForEmail(authEmail.trim(),{redirectTo:authRedirectUrl()});
    setBusy(false);
    setAuthMsg(error?error.message:'If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.');
  }
  async function updatePassword(e){
    e.preventDefault(); if(!supabase)return;
    if(authPassword.length<8){setAuthMsg('Use a password with at least 8 characters.');return;}
    if(authPassword!==authConfirmPassword){setAuthMsg('The passwords do not match.');return;}
    setBusy(true);setAuthMsg('');
    const {error}=await supabase.auth.updateUser({password:authPassword});
    if(error){setBusy(false);setAuthMsg(error.message);return;}
    await supabase.auth.signOut();
    setBusy(false);setAuthMode('signin');setAuthPassword('');setAuthConfirmPassword('');
    setAuthMsg('Password updated successfully. Sign in with your new password.');
  }
  async function createManagedUser(payload){
    if(!cloudReady){setToast('Creating users is available only in Supabase Cloud. These local demo accounts are fixed test accounts.');return false;}
    if(!['owner','super_admin'].includes(profile?.role))return false;
    const {data,error}=await supabase.functions.invoke('admin-create-user',{body:payload});
    if(error){setToast(error.message||'Could not create user');return false;}
    if(data?.error){setToast(data.error);return false;}
    setToast(data?.emailProvided?'User created successfully.':'User created. They can sign in with username; email recovery is unavailable until an email is added.');
    await refreshAdminUsers();
    return true;
  }
  async function refreshAdminUsers(){
    if(!cloudReady){setAdminUsers(localDemoAccounts.map(({password,...u})=>u));setToast('Showing the two built-in local demo accounts.');return;}
    if(!['owner','super_admin'].includes(profile?.role))return;
    setAdminLoading(true);
    const {data,error}=await supabase.rpc('admin_list_users');
    if(error)setToast('Could not refresh users: '+error.message);else setAdminUsers(data||[]);
    setAdminLoading(false);
  }
  async function deleteManagedUser(userId){
    if(!cloudReady){setToast('Built-in demo accounts cannot be deleted.');return;}
    if(!['owner','super_admin'].includes(profile?.role))return;
    const target=adminUsers.find(u=>u.user_id===userId);
    requestConfirm('Delete user account?', `Delete ${target?.email||'this user'} and all associated Pocket financial records? This cannot be undone.`, async()=>{
      const {error}=await supabase.rpc('admin_delete_user',{p_target_user_id:userId});
      if(error){setToast(error.message||'Could not delete user');return;}
      setToast('User and associated records deleted');await refreshAdminUsers();
    });
  }
  async function updateUserAccess(userId, enabledFeatures, role=null){
    if(!cloudReady){setToast('Demo account permissions are fixed for local testing.');return;}
    if(!['owner','super_admin'].includes(profile?.role))return;
    const {error}=await supabase.rpc('admin_update_user_access',{p_target_user_id:userId,p_enabled_features:enabledFeatures,p_role:role});
    if(error){setToast(error.message||'Could not update user access');return;}
    setToast('User access updated');
    await refreshAdminUsers();
  }
  function exportCSV(){
    const ws=XLSX.utils.json_to_sheet(transactions.map(t=>({'Date':t.transaction_date,'Type':t.type,'Category':t.category,'Description':t.description,[`Amount (${currency})`]:t.amount,'Need / Want':t.need_want,'Fixed / Variable':t.fixed_variable,'Account / Wallet':accounts.find(a=>a.id===t.account_id)?.name||'No account linked','Recurring?':t.recurring?'Yes':'No','Notes':t.notes})));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Transactions');XLSX.writeFile(wb,'forma-transactions.xlsx');
  }
  async function setBackupVisibility(enabled){
    if(!isAdmin){setToast('Only the Owner or Super Admin can change this setting');return;}
    if(cloudReady){
      const {error}=await supabase.from('app_settings').upsert({key:'backup_restore_for_users',value:!!enabled,updated_at:new Date().toISOString()},{onConflict:'key'});
      if(error){setToast('Could not save backup visibility: '+error.message);return;}
    }
    setBackupForUsers(!!enabled);setToast(enabled?'Backup & restore enabled for users':'Backup & restore hidden from users');
  }

  async function saveProfile(form){
    const name=String(form.full_name||'').trim();
    if(!name){setToast('Please enter your name');return;}
    setProfileSaving(true);
    try {
      if(cloudReady && session?.user){
        const {data,error}=await supabase.auth.updateUser({data:{...session.user.user_metadata,full_name:name,gender:form.gender||session.user.user_metadata?.gender||'prefer_not_to_say',currency:form.currency,timezone:form.timezone,avatar:form.avatar||profileAvatar}});
        if(error) throw error;
        const {error:profileError}=await supabase.from('profiles').update({full_name:name,updated_at:new Date().toISOString()}).eq('id',session.user.id);
        if(profileError) throw profileError;
        if(data?.user)setSession(old=>old?{...old,user:data.user}:old);
      }
      localStorage.setItem('forma_profile_name',name);
      localStorage.setItem('forma_currency',form.currency);
      localStorage.setItem('forma_timezone',form.timezone);
      setProfileName(name);setCurrency(form.currency);setTimezone(form.timezone);if(form.avatar){setProfileAvatar(form.avatar);localStorage.setItem('forma_profile_avatar',form.avatar);}
      setToast('Profile settings saved');setModal(null);
    } catch(err){setToast(err.message||'Could not save profile settings');}
    finally{setProfileSaving(false);}
  }
  function exportBackup(){
    const backup={app:'Forma Personal Finance',version:1,exported_at:new Date().toISOString(),currency,timezone,profile:{full_name:displayName},data:{transactions,budgets,goals,recurring,accounts,debts}};
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`forma-backup-${localISODate()}.json`;a.click();URL.revokeObjectURL(url);
    setToast('Full backup exported');
  }
  async function restoreBackup(e){
    const file=e.target.files?.[0];if(!file)return;
    try{
      const backup=JSON.parse(await file.text());
      const data=backup?.data;
      if(backup?.app!=='Forma Personal Finance'||!data||!Array.isArray(data.transactions)||!Array.isArray(data.budgets)||!Array.isArray(data.goals)||!Array.isArray(data.recurring)) throw new Error('This is not a valid Forma backup.');
      if(!confirm('Restore this backup? Matching cloud record IDs will be updated; records without cloud IDs may be added. Keep a separate backup before continuing.')) return;
      if(cloudReady&&session?.user){
        for(const [table,rows] of [['transactions',data.transactions],['budgets',data.budgets],['savings_goals',data.goals],['recurring_payments',data.recurring],['financial_accounts',data.accounts||[]],['debts',data.debts||[]]]){
          for(const row of rows){
            const record={...row};
            if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(record.id||''))) delete record.id;
            let result;
            if(table==='budgets'){delete record.id;result=await supabase.from(table).upsert({...record,user_id:session.user.id},{onConflict:'user_id,category,month'});}
            else result=await supabase.from(table).upsert({...record,user_id:session.user.id},{onConflict:'id'});
            const {error}=result;
            if(error)throw error;
          }
        }
        if(backup.profile?.full_name||backup.currency||backup.timezone){
          const {data:userData,error:userError}=await supabase.auth.updateUser({data:{...session.user.user_metadata,full_name:backup.profile?.full_name||session.user.user_metadata?.full_name||'',currency:backup.currency||currency,timezone:backup.timezone||timezone}});
          if(userError)throw userError;if(userData?.user)setSession(old=>old?{...old,user:userData.user}:old);
        }
        const [t,b,g,r,a,d]=await Promise.all([supabase.from('transactions').select('*'),supabase.from('budgets').select('*'),supabase.from('savings_goals').select('*'),supabase.from('recurring_payments').select('*'),supabase.from('financial_accounts').select('*'),supabase.from('debts').select('*')]);
        if(t.error||b.error||g.error||r.error||a.error||d.error)throw new Error('Backup imported but data refresh failed. Reload the app.');
        setTransactions(t.data||[]);setBudgets(b.data||[]);setGoals(g.data||[]);setRecurring(r.data||[]);setAccounts(a.data||[]);setDebts(d.data||[]);
      } else {
        setTransactions(data.transactions);setBudgets(data.budgets);setGoals(data.goals);setRecurring(data.recurring);setAccounts((data.accounts||[]).map(a=>({...a,opening_balance_date:a.opening_balance_date||(a.created_at?String(a.created_at).slice(0,10):localISODate())})));setDebts(data.debts||[]);
      }
      if(backup.currency){localStorage.setItem('forma_currency',backup.currency);setCurrency(backup.currency)}
      if(backup.timezone){localStorage.setItem('forma_timezone',backup.timezone);setTimezone(backup.timezone)}
      if(backup.profile?.full_name){localStorage.setItem('forma_profile_name',backup.profile.full_name);setProfileName(backup.profile.full_name)}
      setToast('Backup restored');
    }catch(err){setToast(err.message||'Could not restore backup');}
    finally{e.target.value='';}
  }
  async function markRecurringPaid(r){
    if(paidBusy.includes(r.id))return;
    setPaidBusy(old=>[...old,r.id]);
    try{
      const paidDate=localISODate();
      if(cloudReady&&session?.user){
        const {error}=await supabase.rpc('mark_recurring_payment_paid',{p_payment_id:r.id,p_paid_date:paidDate,p_account_id:r.account_id||null});
        if(error)throw error;
        const [t,rec]=await Promise.all([supabase.from('transactions').select('*').order('transaction_date',{ascending:false}),supabase.from('recurring_payments').select('*').order('next_due_date',{ascending:true})]);
        if(t.error||rec.error)throw new Error('Payment recorded. Reload the app if the refreshed list is not visible.');
        setTransactions(t.data||[]);setRecurring(rec.data||[]);
      } else {
        if(r.last_paid_date&&r.next_due_date&&paidDate<r.next_due_date)throw new Error('This payment was already recorded for the current cycle.');
        const account=accounts.find(a=>String(a.id)===String(r.account_id));if(!account)throw new Error('Choose an account or wallet in this recurring payment before marking it paid.');if(isGoalsAccount(account))throw new Error('The Goals account can only be used for transfers.');const accountIn=transactions.filter(t=>(t.type==='Income'&&String(t.account_id)===String(account.id))||(t.type==='Transfer'&&String(t.to_account_id)===String(account.id))).reduce((sum,t)=>sum+Number(t.amount||0),0);const accountOut=transactions.filter(t=>((t.type==='Expense'||t.type==='Transfer')&&String(t.account_id)===String(account.id))).reduce((sum,t)=>sum+Number(t.amount||0),0);const available=Number(account.opening_balance||0)+accountIn-accountOut;if(Number(r.amount)>available)throw new Error(`Insufficient balance in ${account.name}. Available: ${fmt(available)}.`);const tx={transaction_date:paidDate,type:'Expense',category:r.category||'Bills & Utilities',subcategory:r.subcategory||null,description:`Recurring payment: ${r.name}`,amount:Number(r.amount)||0,need_want:'Need',fixed_variable:'Fixed',payment_method:account.name,account_id:account.id,recurring:true,notes:`Generated from recurring payment ${r.name}`};
        const savedTx={...tx,id:uid()};
        const nextDue=addFrequency(r.next_due_date||paidDate,r.frequency);
        const updated={...r,next_due_date:nextDue,paid_this_cycle:true,last_paid_date:paidDate};
        setTransactions(old=>[savedTx,...old]);setRecurring(old=>old.map(x=>x.id===r.id?updated:x));
      }
      setToast('Payment recorded and next due date updated');
    }catch(err){setToast(err.message||'Could not mark payment as paid');}
    finally{setPaidBusy(old=>old.filter(id=>id!==r.id));}
  }

  async function requestAccess(){
    if(!cloudReady || !session?.user){setToast('Sign in to request access.');return;}
    if(accessRequestBusy)return;
    setAccessRequestBusy(true);
    try{
      const {error}=await supabase.functions.invoke('request-access',{body:{}});
      if(error)throw error;
      setToast('Access request sent to the Pocket administrator.');
    }catch(err){
      setToast(err?.message||'Could not send your access request. Please try again later.');
    }finally{setAccessRequestBusy(false);}
  }

  async function handleImport(e){
    const file=e.target.files?.[0];if(!file)return;
    try{
      const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
      const ws=wb.Sheets['Transactions']||wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:''});
      const mapped=rows.map((r,i)=>{
        const get=(...keys)=>{const k=Object.keys(r).find(x=>keys.some(y=>x.toLowerCase().trim()===y.toLowerCase()));return k?r[k]:''};
        const rawDate=get('Date','transaction_date');let date='';
        if(rawDate instanceof Date)date=localISODate(rawDate);else if(typeof rawDate==='number')date=XLSX.SSF.format('yyyy-mm-dd',rawDate);else if(rawDate)date=String(rawDate).slice(0,10);
        return {transaction_date:date,type:String(get('Type')||'Expense'),category:String(get('Category')||'Other'),description:String(get('Description')||''),amount:Number(get('Amount (EGP)','Amount (USD)','Amount (EUR)','Amount (GBP)','Amount (SAR)','Amount (AED)','Amount (CAD)','Amount (AUD)','Amount','amount')||0),need_want:String(get('Need / Want','Need/Wants')||'Need'),fixed_variable:String(get('Fixed / Variable')||'Variable'),payment_method:String(get('Payment Method')||'Cash'),recurring:['yes','true','1'].includes(String(get('Recurring?','Recurring')).toLowerCase()),notes:String(get('Notes')||'')};
      }).filter(x=>x.transaction_date&&x.amount>=0&&['Income','Expense'].includes(x.type));
      setImportPreview(mapped);setModal('import');
    }catch(err){setToast('Could not read this workbook. Check its Transactions sheet.');}
    e.target.value='';
  }
  async function confirmImport(){
    let added=[];
    for(const row of importPreview){const saved=await saveRecord('transactions',row);if(saved)added.push(saved);}
    setTransactions(old=>[...added,...old]);setModal(null);setImportPreview([]);setToast(`Imported ${added.length} transactions`);
  }

  const needsAccountSetup=cloudReady ? Boolean(session?.user && accountsLoaded && !accounts.some(a=>!isGoalsAccount(a))) : Boolean(localLoaded && !accounts.some(a=>!isGoalsAccount(a)));
  const isAdmin=(cloudReady && ['owner','super_admin'].includes(profile?.role)) || (!cloudReady && localDemoUser?.role==='super_admin');
  const allowedFeatures=!cloudReady||isAdmin?FEATURE_OPTIONS.map(f=>f.key):(Array.isArray(profile?.enabled_features)?profile.enabled_features:[]);
  // New sidebar pages inherit the same access rule as the standard Workspace pages
  // unless an explicit feature mapping is added to PAGE_FEATURE.
  const getPageFeature=(name)=>PAGE_FEATURE[name]||'overview';
  const visibleNavGroups=[{label:'WORKSPACE',items:[['Overview',LayoutDashboard],['Transactions',ArrowLeftRight],['Accounts',Wallet],['Cash flow calendar',CalendarDays],['Budgets',CreditCard],['Savings goals',Target],['Subscriptions & bills',Repeat2],['Debts & installments',CircleDollarSign]]},{label:'ANALYZE',items:[['Insights & reports',ChartNoAxesCombined]]}].map(g=>({...g,items:g.items.filter(([name])=>allowedFeatures.includes(getPageFeature(name)))})).filter(g=>g.items.length);
  const canSeeCurrentPage=page==='Admin access'?isAdmin:page==='Access restricted'?true:allowedFeatures.includes(getPageFeature(page));
  if(cloudReady && (authLoading || (session && !profileLoaded))) return <main className="pocket-loading-screen" role="status" aria-live="polite" aria-label="Loading Pocket">
    <div className="pocket-loading-glow pocket-loading-glow-one" aria-hidden="true"/><div className="pocket-loading-glow pocket-loading-glow-two" aria-hidden="true"/>
    <section className="pocket-loading-card">
      <div className="pocket-loading-brand"><span className="pocket-loading-logo"><img src="/brand/pocket-mark.svg" alt=""/></span><span>Pocket<span className="pocket-loading-brand-dot">.</span></span></div>
      <div className="pocket-loading-orbit" aria-hidden="true"><span className="pocket-loading-orbit-core"><img src="/brand/pocket-mark.svg" alt=""/></span><i/><i/><i/></div>
      <h1>Getting things ready</h1>
      <p>Connecting to your secure workspace</p>
      <div className="pocket-loading-progress" aria-hidden="true"><span/></div>
      <div className="pocket-loading-foot"><span className="pocket-loading-status-dot"/> Secure sign-in <span className="pocket-loading-separator">·</span> Your data stays protected</div>
    </section>
    <span className="pocket-loading-caption">PERSONAL FINANCE, IN ONE PLACE</span>
  </main>;
  if(cloudReady && (!session || authMode==='update-password')) return <AuthScreen {...{authMode,setAuthMode,authName,setAuthName,authGender,setAuthGender,authEmail,setAuthEmail,authPassword,setAuthPassword,authConfirmPassword,setAuthConfirmPassword,authMsg,setAuthMsg,busy,signIn,signInWithGoogle,signUp,resetPassword,updatePassword,resendConfirmation}} />;
  if(!cloudReady && !localDemoSignedIn) return <main className="auth-page pocket-auth-page local-demo-auth-page"><section className="auth-visual pocket-auth-visual"><div className="auth-brand pocket-brand"><div className="brand-mark"><img className="brand-logo-mark" src="/brand/pocket-mark.svg" alt="" /></div><span>Pocket</span></div><div className="auth-visual-copy pocket-visual-copy"><span className="eyebrow">LOCAL DEVELOPMENT</span><h1>Your money.<br/><em>Your way.</em></h1><p>Choose a demo account to test the regular-user and super-admin experience. No cloud account is used in this mode.</p></div><small className="auth-copyright">Pocket Finance · Local demo workspace</small></section><section className="auth-panel pocket-auth-panel"><div className="auth-choice-card pocket-auth-choice-card"><div className="auth-mobile-brand pocket-mobile-brand"><div className="brand-mark"><img className="brand-logo-mark" src="/brand/pocket-mark.svg" alt="" /></div><b>Pocket</b></div><span className="pocket-form-kicker">LOCAL WORKSPACE</span><h2>Welcome back.</h2><p className="auth-subtitle">Sign in with one of the local demo accounts.</p><form className="auth-form" onSubmit={enterLocalDemo}><label className="field"><span>Username</span><input autoComplete="username" required value={localDemoUsername} onChange={e=>{setLocalDemoUsername(e.target.value);setLocalDemoAuthError('')}} placeholder="test-user or test-admin"/></label><label className="field"><span>Password</span><input type="password" autoComplete="current-password" required value={localDemoPassword} onChange={e=>{setLocalDemoPassword(e.target.value);setLocalDemoAuthError('')}} placeholder="Enter demo password"/></label>{localDemoAuthError&&<p className="auth-message auth-message-error" role="alert">{localDemoAuthError}</p>}<button className="btn btn-primary auth-submit" type="submit"><LockKeyhole size={16}/> Sign in to demo workspace</button></form><div className="local-demo-credentials"><b>Test accounts</b><button type="button" onClick={()=>{setLocalDemoUsername('test-user');setLocalDemoPassword('12345678');setLocalDemoAuthError('')}}><span><strong>test-user</strong><small>Regular user</small></span><code>12345678</code></button><button type="button" onClick={()=>{setLocalDemoUsername('test-admin');setLocalDemoPassword('12345678');setLocalDemoAuthError('')}}><span><strong>test-admin</strong><small>Super admin</small></span><code>12345678</code></button></div><p className="auth-privacy pocket-privacy"><LockKeyhole size={12}/> Demo accounts are for local testing only.</p></div></section></main>;
  return <div className={`app-shell sidebar-${sidebarSize}`} lang="en" dir="ltr">
    <aside className={`sidebar ${sidebarOpen?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-mark"><img className="brand-logo-mark" src="/brand/pocket-mark.svg" alt="" /></div><span>Pocket</span><button className="icon-btn mobile-close" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div>
      <div className="sidebar-navigation-tools"><button className="nav-item sidebar-size-toggle" onClick={()=>setSidebarSize(v=>v==='compact'?'comfortable':'compact')} title={sidebarSize==='compact'?'Expand sidebar':'Compact sidebar'} aria-label={sidebarSize==='compact'?'Expand sidebar':'Compact sidebar'}><Menu size={18}/></button></div>
      {visibleNavGroups.map(group=><div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([name,Icon])=><button key={name} className={`nav-item ${page===name?'active':''}`} onClick={()=>{setPage(name);setSidebarOpen(false)}}><Icon size={18}/><span>{name}</span>{name==='Transactions'&&<span className="nav-count">{transactions.length}</span>}</button>)}</div>)}
      {(isAdmin||allowedFeatures.includes('expense_categories'))&&<div className="nav-group admin-nav-group"><div className="nav-label">ADMINISTRATION</div>{isAdmin&&<button className={`nav-item ${page==='Admin access'?'active':''}`} onClick={()=>{setPage('Admin access');setSidebarOpen(false)}}><ShieldCheck size={18}/><span>User access</span></button>}<button className={`nav-item ${page==='Expense categories'?'active':''}`} onClick={()=>{setPage('Expense categories');setSidebarOpen(false)}}><SlidersHorizontal size={18}/><span>Expense categories</span></button></div>}<div className="sidebar-bottom"><button className="nav-item" onClick={()=>setModal('app-settings')}><Settings size={18}/><span>Settings</span></button></div>
    </aside>
    {sidebarOpen&&<div className="scrim" onClick={()=>setSidebarOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn menu-toggle" onClick={()=>setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><b className="breadcrumb-current">{page}</b></div><div className="topbar-actions"><button type="button" className="icon-btn theme-toggle-btn" onClick={()=>setTheme(current=>current==='dark'?'light':'dark')} title={theme==='dark'?'Switch to light mode':'Switch to dark mode'} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><div className="top-action-wrap"><button className={`icon-btn notification-btn ${notificationsOpen?'is-open':''}`} onClick={()=>{setNotificationsOpen(v=>!v);setAccountMenuOpen(false)}} title="Notifications" aria-label={`Notifications${notificationItems.length?`, ${notificationItems.length} alerts`:''}`} aria-expanded={notificationsOpen}><Bell size={18}/>{notificationItems.length>0&&<span className="notification-count-badge" aria-hidden="true">{notificationItems.length>99?'99+':notificationItems.length}</span>}</button>{notificationsOpen&&<div className="top-popover notification-popover"><div className="popover-heading"><div><b>Notifications</b><span>{notificationItems.length?`${notificationItems.length} alert${notificationItems.length===1?'':'s'}`:'You’re all caught up'}</span></div><span className="popover-icon"><Bell size={16}/></span></div>{notificationItems.length?notificationItems.map(item=><button className="notification-item" key={item.id} onClick={()=>{setPage(item.target);setNotificationsOpen(false)}}><span className="notification-item-icon">{item.kind==='budget'?<ChartNoAxesCombined size={16}/>:item.kind==='debt'?<CreditCard size={16}/>:<CalendarDays size={16}/>}</span><span className="notification-item-copy"><b>{item.name}</b><small>{item.detail}</small></span>{item.amount!==null&&<strong>{fmt(item.amount)}</strong>}</button>):<div className="notification-empty"><span><Check size={18}/></span><b>No alerts right now</b><small>Debt installments, budget limits at 90%, and upcoming recurring payments will appear here.</small></div>}<button className="popover-footer-action" onClick={()=>{setPage('Budgets');setNotificationsOpen(false)}}>Review budgets <ArrowUpRight size={15}/></button></div>}</div><div className="top-action-wrap"><button className={`account-trigger ${accountMenuOpen?'is-open':''}`} onClick={()=>{setAccountMenuOpen(v=>!v);setNotificationsOpen(false)}} aria-label="Open account menu" aria-expanded={accountMenuOpen}><span className="top-avatar avatar-image"><ProfileAvatar value={profileAvatar}/></span><ChevronDown size={14}/></button>{accountMenuOpen&&<div className="top-popover account-popover"><div className="account-popover-identity"><span className="account-large-avatar avatar-image"><ProfileAvatar value={profileAvatar}/></span><div><b>{displayName}</b><span>{session?.user?.email||localDemoUser?.username||'Local demo workspace'}</span><small>{profile?.role==='owner'?'Owner':profile?.role==='super_admin'?'Super admin':session||localDemoUser?'User':'Local workspace'}</small></div></div><button className="account-menu-item" onClick={e=>{e.preventDefault();e.stopPropagation();setNotificationsOpen(false);setAccountMenuOpen(false);setModal('profile')}}><UserRound size={16}/><span>Account & profile</span></button>{session&&<button className="account-menu-item signout-menu-item" onClick={async()=>{setAccountMenuOpen(false);const {error}=await supabase.auth.signOut();if(error)setToast(error.message);else setToast('Signed out successfully')}}><LogOut size={16}/><span>Sign out</span></button>}{!cloudReady&&<button className="account-menu-item signout-menu-item" onClick={exitLocalDemo}><LogOut size={16}/><span>Sign out / Return to demo login</span></button>}</div>}</div></div></header>
      <div className="page-wrap">
        {profileLoadError&&<div className="workspace-error" role="alert"><div><b>Couldn’t verify your access</b><p>{profileLoadError}</p></div><button className="btn btn-secondary btn-sm" onClick={()=>{setProfileLoaded(false);setProfileLoadError('');setProfileRetry(v=>v+1)}}>Retry</button></div>}
        {dataLoadError&&<div className="workspace-error" role="alert"><div><b>Some workspace data didn’t load</b><p>{dataLoadError}</p></div><button className="btn btn-secondary btn-sm" onClick={()=>setDataLoadAttempt(v=>v+1)}>Retry loading</button></div>}
        {cloudReady&&session&&!accountsLoaded?<WorkspaceSkeleton/>: <>
        {!canSeeCurrentPage&&!(isAdmin&&['Expense categories','Admin access'].includes(page))&&<AccessRestricted profile={profile} onBack={()=>setPage(allowedFeatures[0]?FEATURE_OPTIONS.find(f=>f.key===allowedFeatures[0])?.label:'Overview')} onRequestAccess={requestAccess} requestBusy={accessRequestBusy}/> }
        {page==='Expense categories'&&(isAdmin||allowedFeatures.includes('expense_categories'))&&<ExpenseCategoriesPage session={session} supabase={supabase}/>}
        {page==='Admin access'&&isAdmin&&<AdminAccessPage users={adminUsers} loading={adminLoading} profile={profile} onUpdate={updateUserAccess} onDelete={deleteManagedUser} onCreate={createManagedUser} onRefresh={refreshAdminUsers}/>}
        {canSeeCurrentPage&&page==='Overview'&&<Overview {...{month,setMonth,transactions,accounts,monthTx,income,expenses,net,savingsRate,monthlySeries,categoryData,needs,wants,monthBudgets,totalBudget,totalSaved,goalTarget,upcoming,goals,setPage,setModal,setEditing,setToast,displayName,greeting,profileAvatar}}/>}
        {canSeeCurrentPage&&page==='Transactions'&&<TransactionsPage {...{transactions,accounts,debts,filtered,search,setSearch,typeFilter,setTypeFilter,categoryFilter,setCategoryFilter,amountSort,setAmountSort,setModal,setEditing,setPage,setToast,removeRecord,setTransactions,handleImport,exportCSV,currency,requestConfirm,recordDebtInstallment,activeCategoryOptions:getExpenseCategories(profile?.gender)}}/>}
        {canSeeCurrentPage&&page==='Accounts'&&<AccountsPage {...{accounts,transactions,setModal,setEditing,removeRecord,setAccounts,currency,requestConfirm,defaultAccountId,setDefaultAccountId}}/>}
        {canSeeCurrentPage&&page==='Cash flow calendar'&&<CashFlowCalendar {...{transactions,recurring,month,setMonth,currency}}/>}
        {canSeeCurrentPage&&page==='Debts & installments'&&<DebtsPage {...{debts,accounts,setModal,setEditing,removeRecord,setDebts,currency,requestConfirm,recordDebtInstallment,setToast}}/>}
        {canSeeCurrentPage&&(page==='Insights & reports'||page==='Insights & forecast'||page==='Reports')&&<InsightsReportsPage {...{transactions,month,setMonth,budgets,recurring,goals,debts,currency,setPage,accounts}}/>}
        {canSeeCurrentPage&&page==='Budgets'&&<BudgetsPage {...{budgets,transactions,month,setMonth,setModal,setEditing,setToast,removeRecord,setBudgets,requestConfirm}}/>}
        {canSeeCurrentPage&&page==='Savings goals'&&<GoalsPage {...{goals,transactions,accounts,setModal,setEditing,setToast,removeRecord,setGoals,totalSaved,goalTarget,requestConfirm}}/>}
        {canSeeCurrentPage&&(page==='Recurring payments'||page==='Subscriptions & bills')&&<RecurringPage {...{recurring,setModal,setEditing,setToast,removeRecord,setRecurring,markRecurringPaid,paidBusy,deleteRecurringPayment}}/>}
        </>}
      </div>
      <footer className="footer"><span>Pocket Finance <span className="footer-dot">•</span> Make room for what matters.</span><span>Currency: {currency}</span></footer>
    </main>
    {(modal==='transaction'||modal==='account-from-transaction')&&<TransactionModal currency={currency} accounts={accounts} goals={goals} debts={debts} recordDebtInstallment={recordDebtInstallment} defaultAccountId={defaultAccountId} gender={session?.user?.user_metadata?.gender||''} session={session} initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={submitTransaction} onAddAccount={()=>setModal('account-from-transaction')}/>}
    {modal==='goal'&&<GoalModal currency={currency} initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={addGoal}/>}
    {modal==='recurring'&&<RecurringModal currency={currency} accounts={accounts} initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={addRecurring}/>}
    {modal==='budget'&&<BudgetModal currency={currency} initial={editing} month={month} onClose={()=>{setModal(null);setEditing(null)}} onSave={addBudget}/>}
     {modal==='app-settings'&&<SettingsModal {...{onClose:()=>setModal(null),design,setDesign,sidebarSize,setSidebarSize,isAdmin,backupForUsers,setBackupVisibility,exportCSV,exportBackup,handleImport,restoreBackup,session,supabase,onOpenProfile:()=>setModal('profile')}}/>}
    {modal==='profile'&&<AccountProfileModal {...{onClose:()=>setModal(null),openAvatarPicker:gender=>{setAvatarPickerGender(gender||session?.user?.user_metadata?.gender||'prefer_not_to_say');setModal('avatar-picker')},session,saveProfile,profileSaving,profileName:session?.user?.user_metadata?.full_name||profileName,gender:session?.user?.user_metadata?.gender||'prefer_not_to_say',currency,timezone,profileAvatar}}/>}
    {modal==='avatar-picker'&&<AvatarPickerModal current={profileAvatar} gender={avatarPickerGender} onClose={()=>setModal('profile')} onChoose={avatar=>{setProfileAvatar(avatar);setModal('profile')}} />}
    {modal==='account'&&<AccountModal initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={saveAccount}/> }
    {modal==='account-from-transaction'&&<AccountModal initial={null} onClose={()=>setModal('transaction')} onSave={async form=>{const payload={name:form.name.trim(),type:form.type,opening_balance:Number(form.opening_balance||0),opening_balance_date:form.opening_balance_date||localISODate(),color:form.color||'#6c7cf5'};const saved=await saveRecord('financial_accounts',payload);if(!saved)return;setAccounts(old=>[saved,...old]);setModal('transaction');setToast('Account added. Select it for your transaction.')}}/>}
    {modal==='debt'&&<DebtModal currency={currency} accounts={accounts} initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={saveDebt}/> }
    {modal==='import'&&<ImportModal rows={importPreview} onClose={()=>{setModal(null);setImportPreview([])}} onConfirm={confirmImport}/>}
    {confirmDialog&&<ConfirmActionModal dialog={confirmDialog} onCancel={()=>setConfirmDialog(null)} onConfirm={async()=>{const action=confirmDialog.onConfirm;setConfirmDialog(null);await action?.()}}/>}
    {toast&&<div className={`toast ${/insufficient balance|error|failed|could not/i.test(toast)?'toast-error':'toast-success'}`} role="status">{/insufficient balance|error|failed|could not/i.test(toast)?<XCircle size={18}/>:<Check size={17}/>}<span>{toast}</span></div>}
    {notificationToast&&<div role="button" tabIndex={0} className="notification-toast" onClick={()=>{setPage(notificationToast.target);setNotificationToast(null)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){setPage(notificationToast.target);setNotificationToast(null)}}} aria-label={`Open notification: ${notificationToast.name}`}><span className={`notification-toast-icon ${notificationToast.kind}`}><Bell size={17}/></span><span className="notification-toast-copy"><b>New notification</b><strong>{notificationToast.name}</strong><small>{notificationToast.detail}</small></span><button type="button" className="notification-toast-close" aria-label="Dismiss notification" onClick={e=>{e.stopPropagation();setNotificationToast(null)}}><X size={15}/></button></div>}
  </div>;
}

function AccessRestricted({profile,onBack,onRequestAccess,requestBusy=false}){
 return <section className="panel access-restricted"><div className="empty-state"><span className="empty-icon"><LockKeyhole size={24}/></span><h2>Access needed</h2><p>Your Pocket account is created, but workspace access has not been enabled yet. Request access and the administrator will be notified privately.</p><button className="btn btn-primary" onClick={onRequestAccess} disabled={requestBusy}>{requestBusy?<LoaderCircle size={16} className="spin"/>:<Mail size={16}/>} Request access</button><button className="btn btn-secondary" onClick={onBack}>Go to available workspace</button><small>Account role: {profile?.role||'user'}</small></div></section>;
}
function AdminAccessPage({users,loading,profile,onUpdate,onDelete,onCreate,onRefresh}){
 const [selected,setSelected]=useState(null); const [createOpen,setCreateOpen]=useState(false); const isOwner=profile?.role==='owner';
 const current=users.find(u=>u.user_id===selected?.user_id)||selected;
 return <><PageHeading eyebrow="ADMINISTRATION" title="User access" subtitle="Create accounts and configure workspace permissions." actions={<><span className="status-tag status-good"><ShieldCheck size={14}/>{isOwner?'Owner':'Super admin'}</span><button className="btn btn-secondary" type="button" onClick={onRefresh} disabled={loading}><RefreshCw size={15} className={loading?'spin':''}/> Refresh</button><button className="btn btn-primary" type="button" onClick={()=>setCreateOpen(true)}><UserPlus size={16}/> Create user</button></>}/><section className="panel admin-access-shell"><div className="panel-header"><div><h2><Users size={18}/> User accounts</h2><p>Create a username-based account, with email optional.</p></div><span className="status-tag">{users.length} users</span></div>{loading?<div className="loading-row"><LoaderCircle className="spin" size={18}/> Loading user access…</div>:users.length===0?<div className="empty-state"><h3>No registered users yet</h3><p>New accounts will appear here after they sign up.</p></div>:<div className="admin-user-cards">{[...users].sort((a,b)=>({owner:0,super_admin:1,user:2}[a.role]??3)-({owner:0,super_admin:1,user:2}[b.role]??3)||String(a.email||'').localeCompare(String(b.email||''))).map(u=>{const isSelf=u.user_id===profile?.id;const canDelete=u.role!=='owner'&&!isSelf&&(isOwner||u.role!=='super_admin');const features=Array.isArray(u.enabled_features)?u.enabled_features:[];return <article key={u.user_id} className={`admin-user-mini ${selected?.user_id===u.user_id?'active':''}`} onClick={()=>setSelected(u)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(u)}}}><div className="admin-mini-top"><div className="admin-mini-avatar">{(u.full_name||u.email||'U').slice(0,1).toUpperCase()}</div><span className={`status-tag ${u.role==='owner'?'status-good':u.role==='super_admin'?'status-pending':''}`}>{u.role==='super_admin'?'Admin':u.role==='owner'?'Owner':'User'}</span></div><b className="admin-mini-name">{u.full_name||'Unnamed user'}</b><span className="admin-mini-email">{u.email||'No email'}</span><div className="admin-mini-footer"><span>{u.role==='user'?`${features.length}/${FEATURE_OPTIONS.length} features`:'Full access'}</span><span className="admin-mini-open"><Settings size={13}/> Configure</span></div>{canDelete&&<button className="admin-mini-delete" title="Delete user" aria-label={`Delete ${u.email||'user'}`} onClick={e=>{e.stopPropagation();onDelete(u.user_id)}}><Trash2 size={14}/></button>}</article>})}</div>}</section>{createOpen&&<AdminCreateUserModal isOwner={isOwner} onClose={()=>setCreateOpen(false)} onCreate={async payload=>{const ok=await onCreate(payload);if(ok)setCreateOpen(false);}}/>}{current&&<AdminAccessWizard key={current.user_id} user={current} isOwner={isOwner} onClose={()=>setSelected(null)} onSave={(features,role)=>{onUpdate(current.user_id,features,role);setSelected(null)}}/>}</>;
}
function titleCaseName(value){return String(value||'').trim().replace(/\s+/g,' ').split(' ').map(part=>part?part.charAt(0).toLocaleUpperCase()+part.slice(1).toLocaleLowerCase():'').join(' ');}
function AdminCreateUserModal({isOwner,onClose,onCreate}){
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]); const [firstName,setFirstName]=useState(''); const [lastName,setLastName]=useState(''); const [gender,setGender]=useState('prefer_not_to_say');
 const [username,setUsername]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [role,setRole]=useState('user'); const [features,setFeatures]=useState(FEATURE_OPTIONS.map(f=>f.key)); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const fullName=`${titleCaseName(firstName)} ${titleCaseName(lastName)}`.trim();
 const toggle=key=>setFeatures(old=>old.includes(key)?old.filter(x=>x!==key):[...old,key]);
 const continueFromStep=()=>{setError(''); if(step===1){if(!firstName.trim()||!lastName.trim()){setError('First name and last name are required.');return;}if(!/^[a-zA-Z0-9._-]{3,32}$/.test(username.trim())){setError('Username must be 3–32 characters and use letters, numbers, dots, underscores or hyphens.');return;}if(email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError('Enter a valid email address or leave it blank.');return;}if(password.length<8){setError('Password must be at least 8 characters.');return;}} if(step<3)setStep(step+1);};
 const submit=async()=>{setError('');setBusy(true);const ok=await onCreate({first_name:titleCaseName(firstName),last_name:titleCaseName(lastName),full_name:fullName,gender,username:username.trim(),email:email.trim()||null,password,role:isOwner?role:'user',enabled_features:role==='user'?features:[]});setBusy(false);if(!ok)setError('Could not create the account. Check the notification and Supabase function setup.');};
 return <div className="modal-backdrop admin-wizard-backdrop" onMouseDown={e=>e.target===e.currentTarget&&!busy&&onClose()}><section className="modal modal-wide admin-access-wizard admin-create-user-modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title"><div className="modal-head"><div><div className="eyebrow">USER ACCESS</div><h2 id="create-user-title">Create User</h2><p>Create A Pocket Account And Configure Its Access.</p></div><button type="button" className="icon-btn" onClick={onClose} disabled={busy}><X size={19}/></button></div>
 <div className="admin-wizard-steps">{[{n:1,label:'Role'},{n:2,label:'Features'},{n:3,label:'Review'}].map(x=><div key={x.n} className={step===x.n?'active':step>x.n?'complete':''}><span>{step>x.n?<Check size={13}/>:x.n}</span><b>{x.label}</b></div>)}</div>
 {step===1&&<div className="admin-wizard-content"><div className="admin-wizard-title"><h3>Choose Account Role</h3><p>Role Determines Administrative Permissions.</p></div>{isOwner?<div className="admin-role-choices"><label className={role==='user'?'selected':''}><input type="radio" name="new-user-role" value="user" checked={role==='user'} onChange={()=>setRole('user')}/><span><b>Regular User</b><small>Access Only The Workspace Features Selected In The Next Step.</small></span></label><label className={role==='super_admin'?'selected':''}><input type="radio" name="new-user-role" value="super_admin" checked={role==='super_admin'} onChange={()=>setRole('super_admin')}/><span><b>Super Admin</b><small>Can Manage User Access And Administrative Settings. Owner-Only Actions Remain Protected.</small></span></label></div>:<div className="admin-full-access-note"><ShieldCheck size={19}/><div><b>Regular User</b><p>Super Admins Can Create Regular Users. Only The Owner Can Create Or Promote A Super Admin.</p></div></div>}<div className="admin-create-identity-fields"><label className="field"><span>First Name *</span><input required autoComplete="given-name" value={firstName} onChange={e=>setFirstName(e.target.value)} onBlur={()=>setFirstName(titleCaseName(firstName))} placeholder="e.g. Mahmoud"/></label><label className="field"><span>Last Name *</span><input required autoComplete="family-name" value={lastName} onChange={e=>setLastName(e.target.value)} onBlur={()=>setLastName(titleCaseName(lastName))} placeholder="e.g. Adel"/></label><label className="field"><span>Gender</span><select value={gender} onChange={e=>setGender(e.target.value)}><option value="prefer_not_to_say">Prefer Not To Say</option><option value="female">Female</option><option value="male">Male</option></select></label><label className="field"><span>Username *</span><input required minLength={3} maxLength={32} autoComplete="off" value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. mahmoud"/></label><label className="field"><span>Email (Optional)</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com"/><small>If Omitted, The User Signs In With Their Username. Email Recovery Will Not Be Available.</small></label><label className="field"><span>Temporary Password *</span><input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At Least 8 Characters"/></label></div></div>}
 {step===2&&<div className="admin-wizard-content"><div className="admin-wizard-title"><h3>Choose Workspace Features</h3><p>{role==='user'?'Select The Pages That Will Appear In This User’s Navigation.':'Admin Accounts Have Access To All Features.'}</p></div>{role!=='user'?<div className="admin-full-access-note"><ShieldCheck size={19}/><div><b>Full Workspace Access</b><p>Feature Selection Is Not Required For Super Admin Accounts.</p></div></div>:<><div className="admin-feature-toolbar"><span>{features.length} Of {FEATURE_OPTIONS.length} Selected</span><div><button type="button" className="select-lite" onClick={()=>setFeatures(FEATURE_OPTIONS.map(f=>f.key))}>Select All</button><button type="button" className="select-lite" onClick={()=>setFeatures([])}>Clear All</button></div></div><div className="admin-wizard-feature-grid">{FEATURE_OPTIONS.map(f=><label className={`admin-wizard-feature ${features.includes(f.key)?'checked':''}`} key={f.key}><input type="checkbox" checked={features.includes(f.key)} onChange={()=>toggle(f.key)}/><span className="admin-wizard-check">{features.includes(f.key)?<Check size={13}/>:null}</span><span className="admin-wizard-feature-copy"><b>{f.label}</b><small>{f.description}</small></span></label>)}</div></>}</div>}
 {step===3&&<div className="admin-wizard-content"><div className="admin-wizard-title"><h3>Review New User</h3><p>Confirm The Account Details Before Creating It.</p></div><div className="admin-create-review-grid"><div><span>Full Name</span><b>{fullName||'—'}</b></div><div><span>Gender</span><b>{gender==='female'?'Female':gender==='male'?'Male':'Prefer Not To Say'}</b></div><div><span>Username</span><b>{username||'—'}</b></div><div><span>Email</span><b>{email.trim()||'Not Provided'}</b></div><div><span>Role</span><b>{role==='super_admin'?'Super Admin':'Regular User'}</b></div><div><span>Workspace Access</span><b>{role==='super_admin'?'All Features':`${features.length} Of ${FEATURE_OPTIONS.length} Features`}</b></div></div>{role==='user'&&<div className="admin-review-feature-list">{FEATURE_OPTIONS.filter(f=>features.includes(f.key)).map(f=><span key={f.key}><Check size={13}/>{f.label}</span>)}{features.length===0&&<small>No Workspace Pages Selected.</small>}</div>}</div>}
 {error&&<p className="auth-message auth-message-error" role="alert">{error}</p>}
 <div className="admin-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>step===1?onClose():setStep(step-1)} disabled={busy}>{step===1?'Cancel':<><ChevronLeft size={15}/> Back</>}</button><span className="admin-wizard-step-label">Step {step} Of 3</span>{step<3?<button type="button" className="btn btn-primary" onClick={continueFromStep}>Continue <ArrowUpRight size={15}/></button>:<button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>{busy?<LoaderCircle size={16} className="spin"/>:<UserPlus size={16}/>} Create Account</button>}</div></section></div>;
}
function AdminAccessWizard({user,isOwner,onClose,onSave}){
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]);const [features,setFeatures]=useState(Array.isArray(user.enabled_features)?user.enabled_features:[]);const [role,setRole]=useState(user.role||'user');const isAdmin=user.role==='owner'||user.role==='super_admin';const canEditRole=isOwner&&user.role!=='owner';const toggle=key=>setFeatures(old=>old.includes(key)?old.filter(x=>x!==key):[...old,key]);
 return <div className="modal-backdrop admin-wizard-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal modal-wide admin-access-wizard"><div className="modal-head"><div><div className="eyebrow">USER ACCESS SETUP</div><h2>{user.full_name||'Unnamed user'}</h2><p>{user.email} · Configure permissions for this account.</p></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div><div className="admin-wizard-steps">{[{n:1,label:'Features'},{n:2,label:'Role'},{n:3,label:'Review'}].map(x=><div key={x.n} className={step===x.n?'active':step>x.n?'complete':''}><span>{step>x.n?<Check size={13}/>:x.n}</span><b>{x.label}</b></div>)}</div>
 {step===1&&<div className="admin-wizard-content"><div className="admin-wizard-title"><h3>What should this user access?</h3><p>Choose the pages that will appear in their navigation.</p></div>{isAdmin?<div className="admin-full-access-note"><ShieldCheck size={19}/><div><b>Admin account</b><p>Owner and super admin accounts have access to all features. Feature selection is only available for regular users.</p></div></div>:<><div className="admin-feature-toolbar"><span>{features.length} of {FEATURE_OPTIONS.length} selected</span><div><button type="button" className="select-lite" onClick={()=>setFeatures(FEATURE_OPTIONS.map(f=>f.key))}>Select all</button><button type="button" className="select-lite" onClick={()=>setFeatures([])}>Clear all</button></div></div><div className="admin-wizard-feature-grid">{FEATURE_OPTIONS.map(f=><label className={`admin-wizard-feature ${features.includes(f.key)?'checked':''}`} key={f.key}><input type="checkbox" checked={features.includes(f.key)} onChange={()=>toggle(f.key)}/><span className="admin-wizard-check">{features.includes(f.key)?<Check size={13}/>:null}</span><span className="admin-wizard-feature-copy"><b>{f.label}</b><small>{f.description}</small></span></label>)}</div></>}</div>}
 {step===2&&<div className="admin-wizard-content"><div className="admin-wizard-title"><h3>Choose account role</h3><p>Role controls administrative permissions, while feature access controls the regular workspace.</p></div>{canEditRole?<div className="admin-role-choices"><label className={role==='user'?'selected':''}><input type="radio" name="admin-role" value="user" checked={role==='user'} onChange={()=>setRole('user')}/><span><b>Regular user</b><small>Only the features selected in the previous step.</small></span></label><label className={role==='super_admin'?'selected':''}><input type="radio" name="admin-role" value="super_admin" checked={role==='super_admin'} onChange={()=>setRole('super_admin')}/><span><b>Super admin</b><small>Can manage user access and administrative settings.</small></span></label></div>:<div className="admin-full-access-note"><ShieldCheck size={19}/><div><b>{user.role==='owner'?'Owner':'Super admin'}</b><p>{user.role==='owner'?'The owner role is protected and cannot be changed here.':'Only the owner can promote or demote super admins.'}</p></div></div>}</div>}
 {step===3&&<div className="admin-wizard-content"><div className="admin-wizard-title"><h3>Review access changes</h3><p>Confirm the setup before saving it to this account.</p></div><div className="admin-review-summary"><div><span>Account</span><b>{user.full_name||'Unnamed user'}</b><small>{user.email}</small></div><div><span>Role</span><b>{role==='super_admin'?'Super admin':role==='owner'?'Owner':'Regular user'}</b></div><div><span>Workspace access</span><b>{role!=='user'?'All features':`${features.length} of ${FEATURE_OPTIONS.length} features`}</b></div></div>{role==='user'&&<div className="admin-review-feature-list">{FEATURE_OPTIONS.filter(f=>features.includes(f.key)).map(f=><span key={f.key}><Check size={13}/>{f.label}</span>)}{features.length===0&&<small>No workspace pages selected. This user will see an access-restricted state after signing in.</small>}</div>}</div>}
 <div className="admin-wizard-actions"><button className="btn btn-secondary" onClick={()=>step===1?onClose():setStep(s=>s-1)}>{step===1?'Cancel':<><ChevronLeft size={15}/> Back</>}</button><span className="admin-wizard-step-label">Step {step} of 3</span>{step<3?<button className="btn btn-primary" onClick={()=>setStep(s=>s+1)}>Continue <ArrowUpRight size={15}/></button>:<button className="btn btn-primary" onClick={()=>onSave(role==='user'?features:null,canEditRole?role:null)}><Check size={15}/> Save access</button>}</div></section></div>;
}

function PageHeading({eyebrow,title,subtitle,actions,className=''}){const isGreeting=className.includes('greeting-heading')||(typeof title==='string'&&/^(Good morning|Good afternoon|Good evening)/.test(title));return <div className={`page-heading ${className}${isGreeting?' greeting-heading':''}`}><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div><div className="heading-actions">{actions}</div></div>}
function MonthPicker({month,setMonth}){return <div className="month-picker"><CalendarDays size={16}/><input aria-label="Selected month" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>}
function MetricCard({label,value,change,icon:Icon,tone='blue',note}){return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-foot">{change&&<span className={change.startsWith('+')?'positive':'neutral'}>{change}</span>}<span>{note}</span></div></div>}
function Overview(p){
 const {month,setMonth,monthTx,accounts=[],income,expenses,net,savingsRate,monthlySeries,categoryData,needs,wants,monthBudgets,totalBudget,totalSaved,goalTarget,upcoming,goals,setPage,setModal,setEditing,setToast,displayName,greeting,profileAvatar}=p;
 const maxSpend=Math.max(1,...categoryData.map(x=>x.value));
 const insight=expenses===0?'Add your first expense to start seeing your spending patterns.':savingsRate>=20?`Great work — you're keeping ${Math.round(savingsRate)}% of this month's income.`:net<0?'Your expenses are higher than income this month. Review flexible spending first.':`Your top spending category is ${categoryData[0]?.name||'—'}. Keep an eye on it as the month continues.`;
 return <>
  <PageHeading className="greeting-heading" title={<><span className="greeting-avatar-wrap"><ProfileAvatar value={profileAvatar} className="greeting-avatar-image"/></span><span className="greeting-copy"><span className="greeting-time">{greeting},</span><span className="greeting-name">{displayName}</span></span></>} subtitle="Let’s make it a productive day" actions={<><MonthPicker month={month} setMonth={setMonth}/><button className="btn btn-primary" onClick={()=>{if(!accounts.length){setToast('Add an account or wallet first. Go to Accounts → Add account, then come back to add your transaction.');setPage('Accounts');return;}setEditing(null);setModal('transaction')}}><Plus size={17}/> Add transaction</button></>}/>
  <div className="metric-grid">
   <MetricCard label="Total income" value={fmt(income)} icon={ArrowDownRight} tone="green" change="+ tracked" note="this month"/>
   <MetricCard label="Total expenses" value={fmt(expenses)} icon={ArrowUpRight} tone="orange" change="spending" note="this month"/>
   <MetricCard label="Net cash flow" value={fmt(net)} icon={TrendingUp} tone={net>=0?'blue':'red'} change={net>=0?'Positive':'Negative'} note="income minus expenses"/>
   <MetricCard label="Savings rate" value={`${Math.round(savingsRate)}%`} icon={PiggyBank} tone="purple" change={savingsRate>=20?'On track':'Room to improve'} note="of monthly income"/>
  </div>
  <div className="dashboard-grid top-charts">
   <section className="panel chart-panel"><div className="panel-header"><div><h2>Cash flow</h2><p>Income vs. expenses over time</p></div><button className="select-lite" onClick={()=>setPage('Reports')}>View report <ArrowUpRight size={14}/></button></div><div className="chart-legend"><span><i className="legend-dot income-dot"/> Income</span><span><i className="legend-dot expense-dot"/> Expenses</span></div><div className="line-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlySeries} margin={{top:8,right:8,left:0,bottom:0}}><defs><linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#56b99b" stopOpacity={.18}/><stop offset="100%" stopColor="#56b99b" stopOpacity={0}/></linearGradient><linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f1b15e" stopOpacity={.18}/><stop offset="100%" stopColor="#f1b15e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#9ba2af',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9ba2af',fontSize:11}} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={36}/><Tooltip formatter={v=>fmt(v)} contentStyle={{border:'1px solid #edf0f4',borderRadius:12,fontSize:12}}/><Area type="monotone" dataKey="Income" stroke="#50b99a" strokeWidth={2.5} fill="url(#incFill)"/><Area type="monotone" dataKey="Expenses" stroke="#f0b15d" strokeWidth={2.5} fill="url(#expFill)"/></AreaChart></ResponsiveContainer></div></section>
   <section className="panel"><div className="panel-header"><div><h2>Spending breakdown</h2><p>Where your money goes</p></div><button className="icon-btn" onClick={()=>setPage('Reports')}><MoreHorizontal size={19}/></button></div>{categoryData.length?<><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData.slice(0,7)} dataKey="value" nameKey="name" innerRadius={65} outerRadius={88} paddingAngle={3} stroke="none">{categoryData.slice(0,7).map((e,i)=><Cell key={e.name} fill={palette[i%palette.length]}/>)}</Pie><Tooltip formatter={v=>fmt(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><b>{fmt(expenses)}</b><span>Total spent</span></div></div><div className="category-legend">{categoryData.slice(0,5).map((c,i)=><div className="category-legend-row" key={c.name}><span><i style={{background:palette[i%palette.length]}}/>{c.name}</span><b>{Math.round(c.value/(expenses||1)*100)}%</b></div>)}</div></>:<EmptyState icon={ChartNoAxesCombined} title="No spending yet" text="Add expenses to see your category breakdown."/>}</section>
  </div>
  <div className="dashboard-grid lower-grid">
   <section className="panel"><div className="panel-header"><div><h2>Recent transactions</h2><p>Your latest money movements</p></div><button className="select-lite" onClick={()=>setPage('Transactions')}>View all <ArrowUpRight size={14}/></button></div><TransactionTable transactions={[...monthTx].sort((a,b)=>b.transaction_date.localeCompare(a.transaction_date)).slice(0,5)} accounts={accounts}/></section>
   <section className="panel budget-summary"><div className="panel-header"><div><h2>Budget snapshot</h2><p>Monthly spending limits</p></div><button className="icon-btn" onClick={()=>setPage('Budgets')}><ArrowUpRight size={17}/></button></div><div className="budget-total"><div><span>Total budget</span><b>{fmt(totalBudget)}</b></div><div><span>Spent</span><b>{fmt(expenses)}</b></div></div><div className="progress-track big"><span style={{width:`${Math.min(100,totalBudget?expenses/totalBudget*100:0)}%`,background:expenses>totalBudget?'#e66f78':'#6c7cf5'}}/></div><div className="progress-caption"><span>{totalBudget?Math.round(expenses/totalBudget*100):0}% used</span><span>{fmt(Math.max(0,totalBudget-expenses))} left</span></div><div className="insight-box"><div className="insight-icon"><Sparkles size={17}/></div><div><b>A little insight</b><p>{insight}</p></div></div></section>
  </div>
  <div className="dashboard-grid bottom-grid">
   <section className="panel needs-panel"><div className="panel-header"><div><h2>Needs vs. wants</h2><p>Essential and lifestyle spending</p></div><button className="select-lite" onClick={()=>setPage('Reports')}>Details</button></div><div className="needs-bars"><div className="need-row"><div className="need-label"><span><i className="need-dot"/>Needs</span><b>{fmt(needs)}</b></div><div className="progress-track"><span style={{width:`${expenses?needs/expenses*100:0}%`,background:'#50b99a'}}/></div></div><div className="need-row"><div className="need-label"><span><i className="want-dot"/>Wants</span><b>{fmt(wants)}</b></div><div className="progress-track"><span style={{width:`${expenses?wants/expenses*100:0}%`,background:'#f1b15e'}}/></div></div></div><div className="split-note"><span>{expenses?Math.round(needs/expenses*100):0}% essentials</span><span>{expenses?Math.round(wants/expenses*100):0}% lifestyle</span></div></section>
   <section className="panel"><div className="panel-header"><div><h2>Savings goals</h2><p>Keep your future in focus</p></div><button className="select-lite" onClick={()=>setPage('Savings goals')}>View goals <ArrowUpRight size={14}/></button></div>{goals.length?goals.slice(0,2).map(g=><div className="goal-mini" key={g.id}><div className="goal-mini-top"><span className="goal-icon"><Target size={17}/></span><div className="goal-mini-name"><b>{g.name}</b><small>{fmt(g.saved_amount)} of {fmt(g.target_amount)}</small></div><strong>{Math.min(100,Math.round(g.saved_amount/(g.target_amount||1)*100))}%</strong></div><div className="progress-track"><span style={{width:`${Math.min(100,g.saved_amount/(g.target_amount||1)*100)}%`}}/></div></div>):<EmptyState icon={Target} title="Start a savings goal" text="Set a target and track your progress." action={()=>{setEditing(null);setModal('goal')}} actionLabel="Add goal"/>}</section>
   <section className="panel"><div className="panel-header"><div><h2>Upcoming payments</h2><p>Stay ahead of your bills</p></div><button className="select-lite" onClick={()=>setPage('Recurring payments')}>See all <ArrowUpRight size={14}/></button></div>{upcoming.length?upcoming.slice(0,3).map(r=><div className="upcoming-row" key={r.id}><div className="upcoming-icon"><CreditCard size={17}/></div><div className="upcoming-info"><b>{r.name}</b><span>{shortDate(r.next_due_date)}</span></div><strong>{fmt(r.amount)}</strong></div>):<EmptyState icon={Repeat2} title="All caught up" text="No unpaid recurring payments."/>}</section>
  </div>
 </>;
}

function EmptyState({icon:Icon,title,text,action,actionLabel}){return <div className="empty-state"><div className="empty-icon"><Icon size={21}/></div><b>{title}</b><p>{text}</p>{action&&<button className="btn btn-secondary btn-sm" onClick={action}>{actionLabel||'Add new'}</button>}</div>}
function TransactionTable({transactions,onEdit,onDelete,accounts=[]}){
 if(!transactions.length)return <EmptyState icon={ArrowLeftRight} title="No transactions found" text="Your money movements will appear here."/>
 return <div className="table-wrap"><table className="data-table"><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Amount</th>{onEdit&&<th></th>}</tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td><div className="transaction-name"><span className={`tx-avatar ${t.type==='Income'?'tx-income':'tx-expense'}`}>{t.type==='Income'?<ArrowDownRight size={16}/>:t.type==='Transfer'?<ArrowLeftRight size={16}/>:<ArrowUpRight size={16}/>}</span><span><b>{t.description||t.category}</b><small>{t.type==='Transfer'?`${accounts.find(a=>String(a.id)===String(t.account_id))?.name||'Source'} → ${accounts.find(a=>String(a.id)===String(t.to_account_id))?.name||'Destination'}`:(accounts.find(a=>String(a.id)===String(t.account_id))?.name||'No account linked')}</small></span></div></td><td><span className="category-pill">{t.category}</span>{t.type==='Transfer'&&t.goal_id&&<small className="transaction-goal-subcategory"><Target size={11}/>{t.subcategory||'Savings goal'}</small>}</td><td className="date-cell"><span>{shortDate(t.transaction_date)}</span><small className="transaction-time">{(()=>{const raw=t.transaction_time||t.time||t.created_at||t.inserted_at;if(!raw)return '';const d=new Date(raw);return Number.isNaN(d.getTime())?'':d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false})})()}</small></td><td><b className={t.type==='Income'?'amount-income':t.type==='Transfer'?'amount-transfer':'amount-expense'}>{t.type==='Income'?'+':t.type==='Transfer'?'↔':'−'}{fmt(t.amount)}</b></td>{onEdit&&<td><div className="row-actions"><button className="icon-btn" onClick={()=>onEdit(t)}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>onDelete(t)}><Trash2 size={15}/></button></div></td>}</tr>)}</tbody></table></div>
}
function TransactionsPage(p){
 const {transactions,accounts,debts=[],recordDebtInstallment,filtered,search,setSearch,typeFilter,setTypeFilter,categoryFilter,setCategoryFilter,amountSort,setAmountSort,setModal,setEditing,setToast,removeRecord,setTransactions,handleImport,exportCSV,currency,requestConfirm,activeCategoryOptions=[]}=p;
 const rows=[...filtered].sort((a,b)=>amountSort==='high'?Number(b.amount)-Number(a.amount):amountSort==='low'?Number(a.amount)-Number(b.amount):(b.transaction_date||'').localeCompare(a.transaction_date||''));
 return <><PageHeading eyebrow="MONEY MOVEMENTS" title="Transactions" subtitle="Every income and expense, all in one place." actions={<><button className="btn btn-secondary" onClick={exportCSV}><Download size={16}/> Export</button><label className="btn btn-secondary file-btn"><Upload size={16}/> Import Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport}/></label><button className="btn btn-primary" onClick={()=>{if(!accounts.length){setToast('Add an account or wallet first. Go to Accounts → Add account, then come back to add your transaction.');setPage('Accounts');return;}setEditing(null);setModal('transaction')}}><Plus size={17}/> Add transaction</button></>}/>
 <div className="metric-strip"><div><span>Total transactions</span><b>{transactions.length}</b></div><div><span>Income recorded</span><b className="amount-income">{fmt(transactions.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount),0))}</b></div><div><span>Expenses recorded</span><b>{fmt(transactions.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount),0))}</b></div></div>
 <section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={17}/><input placeholder="Search transactions..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button className="icon-btn" onClick={()=>setSearch('')}><X size={14}/></button>}</div><div className="filter-group"><SlidersHorizontal size={16}/><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option>All types</option><option>Income</option><option>Expense</option><option>Transfer</option></select><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All categories</option>{activeCategoryOptions.map(c=><option key={c}>{c}</option>)}</select><select aria-label="Sort transactions" value={amountSort} onChange={e=>setAmountSort(e.target.value)}><option value="date">Sort by date</option><option value="high">Amount: high to low</option><option value="low">Amount: low to high</option></select></div></div>
 <TransactionTable transactions={rows} accounts={accounts} onEdit={t=>{setEditing(t);setModal('transaction')}} onDelete={t=>requestConfirm('Delete transaction?', `Delete “${t.description||t.category}”? This cannot be undone.`, ()=>removeRecord('transactions',t.id,setTransactions,transactions))}/>
 <div className="table-bottom"><span>Showing <b>{rows.length}</b> of <b>{transactions.length}</b> transactions</span><span>Amounts in {currency}</span></div></section></>;
}
function BudgetsPage(p){
 const {budgets,transactions,month,setMonth,setModal,setEditing,setToast,removeRecord,setBudgets,requestConfirm}=p;
 const allBudgets=expenseCategories.map(c=>{const b=budgets.find(x=>x.category===c&&(x.month||'').slice(0,7)===month);const spent=transactions.filter(t=>t.type==='Expense'&&t.category===c&&(t.transaction_date||'').slice(0,7)===month).reduce((s,t)=>s+Number(t.amount),0);return {...(b||{id:null,category:c,amount:0,month:monthStart(month)}),category:c,spent,used:Number(b?.amount)>0?spent/Number(b.amount)*100:0}});
 const list=allBudgets.filter(b=>Number(b.amount)>0);
 const total=allBudgets.reduce((s,b)=>s+Number(b.amount||0),0),spent=allBudgets.reduce((s,b)=>s+b.spent,0);
 return <><PageHeading eyebrow="PLAN WITH PURPOSE" title="Budgets" subtitle="Give every pound a plan, without losing flexibility." actions={<><MonthPicker month={month} setMonth={setMonth}/><button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('budget')}}><Plus size={17}/> Set budget</button></>}/>
 <div className="metric-grid three"><MetricCard label="Planned budget" value={fmt(total)} icon={Wallet} tone="blue" note={monthLabel(month)}/><MetricCard label="Spent so far" value={fmt(spent)} icon={ArrowUpRight} tone="orange" note={`${total?Math.round(spent/total*100):0}% of budget`}/><MetricCard label="Remaining" value={fmt(total-spent)} icon={PiggyBank} tone="green" note={spent>total?'Over budget':'Available to spend'}/></div>
 <div className="budget-grid">{list.map((b,i)=><div className="panel budget-card" key={b.category}><div className="budget-card-head"><span className="category-color" style={{background:palette[i%palette.length]}}/><div><b>{b.category}</b><small>{b.amount?`${fmt(b.amount)} monthly limit`:'No budget set'}</small></div><div className="row-actions"><button className="icon-btn" title="Edit budget" aria-label={`Edit ${b.category} budget`} onClick={()=>{setEditing(b);setModal('budget')}}><Pencil size={15}/></button>{b.id&&<button className="icon-btn danger-hover" title="Clear budget" aria-label={`Clear ${b.category} budget`} onClick={()=>requestConfirm('Clear this budget?', `Remove the ${b.category} budget for ${monthLabel(month)}? Your transactions will not be deleted.`, ()=>removeRecord('budgets',b.id,setBudgets,budgets), 'Clear budget')}><Trash2 size={15}/></button>}</div></div><div className="budget-numbers"><b>{fmt(b.spent)}</b><span>{b.amount?`of ${fmt(b.amount)}`:'spent'}</span></div><div className="progress-track"><span style={{width:`${Math.min(100,b.used)}%`,background:b.used>=100?'#e66f78':b.used>=80?'#f1b15d':palette[i%palette.length]}}/></div><div className="budget-card-foot"><span className={b.used>=100?'text-danger':b.used>=80?'text-warn':'text-muted'}>{b.amount?(b.used>=100?'Over budget':b.used>=80?'Near limit':'On track'):'Set a limit'}</span><b>{b.amount?`${Math.round(b.used)}%`:''}</b></div></div>)}</div></>;
}
function DebtPaymentMiniCard({debt,accounts,currency,recordDebtInstallment,progress,paid,term}){const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);return <div className="panel debt-payment-mini"><div className="debt-card-title"><h3>{debt.name}</h3><p>{debt.lender||debt.debt_type||'Debt'}</p></div><div className="goal-amounts"><div><span>Remaining</span><b>{fmt(debt.remaining_amount)}</b></div><div><span>Installment</span><b>{fmt(Math.min(Number(debt.monthly_payment||0),Number(debt.remaining_amount||0)))}</b></div></div><div className="progress-track debt-progress-track"><span style={{width:`${progress}%`,background:progress>=100?'#50b99a':'#6c7cf5'}}/></div><div className="progress-caption"><span>{Math.round(progress)}% repaid</span><span>{term?`${Math.max(0,term-paid)} installments left`:'Installments'}</span></div><p className="small-muted">Paid from: {accounts.find(a=>String(a.id)===String(debt.account_id))?.name||'No account linked'}</p><button type="button" className="btn btn-primary" style={{marginTop:10}} disabled={!debt.account_id||Number(debt.remaining_amount||0)<=0} onClick={()=>recordDebtInstallment(debt)}>Record installment paid</button></div>}

function GoalsPage(p){
 const {goals,transactions=[],accounts=[],setModal,setEditing,removeRecord,setGoals,totalSaved,goalTarget,requestConfirm}=p;
 return <><PageHeading eyebrow="FUTURE YOU WILL THANK YOU" title="Savings goals" subtitle="Turn the things you want into a plan you can follow." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('goal')}}><Plus size={17}/> New goal</button>}/>
 <div className="metric-grid three"><MetricCard label="Total target" value={fmt(goalTarget)} icon={Target} tone="purple" note="across all goals"/><MetricCard label="Already saved" value={fmt(totalSaved)} icon={PiggyBank} tone="green" note="saved so far"/><MetricCard label="Still to save" value={fmt(Math.max(0,goalTarget-totalSaved))} icon={TrendingUp} tone="blue" note="to reach your goals"/></div>
 <div className="goal-grid">{goals.map((g,i)=>{const linkedTransfers=transactions.filter(t=>t.type==='Transfer'&&String(t.goal_id)===String(g.id)).reduce((sum,t)=>{const from=accounts.find(a=>String(a.id)===String(t.account_id)),to=accounts.find(a=>String(a.id)===String(t.to_account_id));if(isGoalsAccount(from))return sum-Number(t.amount||0);if(isGoalsAccount(to))return sum+Number(t.amount||0);const fromSavings=String(from?.type||'').toLowerCase().includes('saving'),toSavings=String(to?.type||'').toLowerCase().includes('saving');if(fromSavings&&!toSavings)return sum-Number(t.amount||0);if(toSavings&&!fromSavings)return sum+Number(t.amount||0);return sum+Number(t.amount||0)},0);const savedAmount=Number(g.saved_amount||0)+linkedTransfers;const progress=Math.min(100,Math.round(savedAmount/(Number(g.target_amount)||1)*100));const remaining=Math.max(0,Number(g.target_amount)-savedAmount);const months=g.target_date?Math.max(1,(new Date(g.target_date).getFullYear()-new Date().getFullYear())*12+new Date(g.target_date).getMonth()-new Date().getMonth()):null;return <div className="panel goal-card" key={g.id}><div className="goal-card-top"><div className={`goal-big-icon goal-tone-${i%4}`}><Target size={22}/></div><div className="goal-menu"><button className="icon-btn" onClick={()=>{setEditing(g);setModal('goal')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>requestConfirm('Delete savings goal?', `Delete “${g.name}”? This cannot be undone.`, ()=>removeRecord('savings_goals',g.id,setGoals,goals))}><Trash2 size={15}/></button></div></div><h3>{g.name}</h3><p className="goal-deadline">{g.target_date?`Target date · ${shortDate(g.target_date)}`:'No target date set'}</p><div className="goal-amounts"><div><span>Saved so far</span><b>{fmt(savedAmount)}</b></div><div><span>Target amount</span><b>{fmt(g.target_amount)}</b></div></div><div className="progress-track big"><span style={{width:`${progress}%`,background:palette[i%palette.length]}}/></div><div className="progress-caption"><span>{progress}% complete</span><span>{fmt(remaining)} to go</span></div><div className="goal-footer"><span><CalendarDays size={14}/>{months?`${months} months left`:'Flexible timeline'}</span><b>{months?`${fmt(remaining/months)}/mo`:'—'}</b></div>{g.notes&&<p className="goal-note">{g.notes}</p>}</div>})}
 {goals.length===0&&<div className="panel empty-large"><EmptyState icon={Target} title="Every goal starts somewhere" text="Create your first savings goal and watch your progress grow." action={()=>{setEditing(null);setModal('goal')}} actionLabel="Create a goal"/></div>}</div></>;
}
function RecurringPage(p){
 const {recurring,setModal,setEditing,removeRecord,markRecurringPaid,paidBusy,deleteRecurringPayment}=p;
 const total=recurring.reduce((s,r)=>s+Number(r.amount||0)*(r.frequency==='Weekly'?52/12:r.frequency==='Quarterly'?1/3:r.frequency==='Yearly'?1/12:1),0);
 const today=localISODate();
 const isPaid=r=>Boolean(r.last_paid_date&&r.next_due_date&&r.last_paid_date<r.next_due_date&&today<r.next_due_date) || Boolean(r.paid_this_cycle&&!r.next_due_date);
 const awaiting=recurring.filter(r=>!isPaid(r)).length;
 return <><PageHeading eyebrow="RECURRING COMMITMENTS" title="Subscriptions & bills" subtitle="Track subscriptions, recurring bills, renewals, and what is coming next." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('recurring')}}><Plus size={17}/> Add payment</button>}/>
 <div className="metric-grid three"><MetricCard label="Monthly commitments" value={fmt(total)} icon={Repeat2} tone="blue" note="estimated monthly equivalent"/><MetricCard label="Active payments" value={recurring.length} icon={CreditCard} tone="purple" note="tracked recurring items"/><MetricCard label="Awaiting payment" value={awaiting} icon={CalendarDays} tone="orange" note="this cycle"/></div>
 <section className="panel table-panel"><div className="panel-header section-header"><div><h2>All recurring payments</h2><p>Mark each item paid when you complete it. Auto-pay is a tracker only; Pocket does not move money.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Payment</th><th>Frequency</th><th>Next due</th><th>Amount</th><th>Auto-pay</th><th>Status</th><th>Actions</th></tr></thead><tbody>{recurring.map(r=><tr key={r.id}><td><div className="transaction-name"><span className="tx-avatar tx-expense"><Repeat2 size={16}/></span><span><b>{r.name}</b><small>{r.category}{r.essential?' · Essential':' · Optional'}</small></span></div></td><td>{r.frequency}</td><td>{shortDate(r.next_due_date)}</td><td><b>{fmt(r.amount)}</b></td><td>{r.auto_pay?<span className="status-tag status-good">Enabled</span>:<span className="text-muted">Manual</span>}</td><td><span className={`status-tag ${isPaid(r)?'status-good':'status-pending'}`}>{isPaid(r)?'Paid':'Due'}</span></td><td><div className="row-actions"><button className="btn btn-sm btn-secondary" onClick={()=>markRecurringPaid(r)} disabled={paidBusy.includes(r.id)||isPaid(r)}>{paidBusy.includes(r.id)?'Saving…':isPaid(r)?'Paid':'Mark paid'}</button><button className="icon-btn" onClick={()=>{setEditing(r);setModal('recurring')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>deleteRecurringPayment(r)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></section></>;
}
function ReportsPage(p){
 const {transactions,monthlySeries,needs,wants,year,setYear,month,setMonth}=p;
 const yearly=transactions.filter(t=>(t.transaction_date||'').startsWith(year));
 const yIncome=yearly.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount),0),yExpenses=yearly.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount),0);
 const byMonth=Array.from({length:12},(_,i)=>{const m=`${year}-${String(i+1).padStart(2,'0')}`,tx=yearly.filter(t=>(t.transaction_date||'').slice(0,7)===m);return {month:new Date(m+'-15T12:00:00').toLocaleDateString('en-US',{month:'short'}),Income:tx.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount),0),Expenses:tx.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount),0)}});
 const yNeeds=yearly.filter(t=>t.type==='Expense'&&t.need_want==='Need').reduce((s,t)=>s+Number(t.amount),0),yWants=yearly.filter(t=>t.type==='Expense'&&t.need_want==='Want').reduce((s,t)=>s+Number(t.amount),0);
 const cats=expenseCategories.map(c=>({name:c,value:yearly.filter(t=>t.type==='Expense'&&t.category===c).reduce((s,t)=>s+Number(t.amount),0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
 return <><PageHeading eyebrow="UNDERSTAND YOUR MONEY" title="Reports & insights" subtitle="Look back, spot patterns, and plan your next move." actions={<><button className="btn btn-secondary" onClick={()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(byMonth),'Monthly summary');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(cats.map(c=>({Category:c.name,Expense:c.value,SharePercent:yExpenses?Math.round(c.value/yExpenses*100):0}))),'Categories');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(yearly.map(t=>({Date:t.transaction_date,Type:t.type,Category:t.category,Description:t.description,Amount:t.amount,NeedOrWant:t.need_want,AccountWallet:accounts.find(a=>a.id===t.account_id)?.name||'No account linked',Notes:t.notes}))), 'Transactions');XLSX.writeFile(wb,`forma-report-${year}.xlsx`)}}><Download size={16}/> Export report</button><div className="year-picker"><CalendarDays size={16}/><select value={year} onChange={e=>setYear(e.target.value)}>{Array.from({length:Math.max(6,new Date().getFullYear()-2020+2)},(_,i)=>new Date().getFullYear()+1-i).sort((a,b)=>b-a).map(y=><option key={y}>{y}</option>)}</select></div></>}/>
 <div className="metric-grid three"><MetricCard label={`${year} income`} value={fmt(yIncome)} icon={ArrowDownRight} tone="green" note="year to date"/><MetricCard label={`${year} expenses`} value={fmt(yExpenses)} icon={ArrowUpRight} tone="orange" note="year to date"/><MetricCard label="Net cash flow" value={fmt(yIncome-yExpenses)} icon={TrendingUp} tone="blue" note="income minus expenses"/></div>
 <div className="metric-grid three"><MetricCard label="Average daily expenses" value={fmt(yExpenses/(new Date().getFullYear()===Number(year)?Math.max(1,Math.floor((Date.now()-new Date(Number(year),0,1).getTime())/86400000)+1):((Number(year)%4===0&&Number(year)%100!==0)||Number(year)%400===0?366:365)))} icon={CalendarDays} tone="orange" note="expenses divided by elapsed days"/><MetricCard label="Average monthly expenses" value={fmt(yExpenses/(Number(year)===new Date().getFullYear()?Math.max(1,new Date().getMonth()+1):12))} icon={TrendingUp} tone="blue" note={Number(year)===new Date().getFullYear()?'average per elapsed month':'annual total ÷ 12'}/><MetricCard label="Expense transactions" value={yearly.filter(t=>t.type==='Expense').length} icon={ArrowLeftRight} tone="purple" note="count for selected year"/></div>
 <div className="dashboard-grid report-charts"><section className="panel chart-panel"><div className="panel-header"><div><h2>Yearly cash flow</h2><p>Monthly income compared with spending</p></div></div><div className="chart-legend"><span><i className="legend-dot income-dot"/> Income</span><span><i className="legend-dot expense-dot"/> Expenses</span></div><div className="line-chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={byMonth} margin={{top:8,right:8,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#9ba2af',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9ba2af',fontSize:11}} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={36}/><Tooltip formatter={v=>fmt(v)}/><Bar dataKey="Income" fill="#50b99a" radius={[5,5,0,0]}/><Bar dataKey="Expenses" fill="#f1b15d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section>
 <section className="panel"><div className="panel-header"><div><h2>Needs vs. wants</h2><p>How spending splits</p></div></div><div className="report-split"><div className="split-big"><span className="need-dot"/> <div><b>{fmt(yNeeds)}</b><small>Needs · {yExpenses?Math.round(yNeeds/yExpenses*100):0}%</small></div></div><div className="split-big"><span className="want-dot"/> <div><b>{fmt(yWants)}</b><small>Wants · {yExpenses?Math.round(yWants/yExpenses*100):0}%</small></div></div><div className="stacked-progress"><span style={{width:`${yExpenses?yNeeds/yExpenses*100:0}%`}}/><span style={{width:`${yExpenses?yWants/yExpenses*100:0}%`}}/></div><p className="small-muted">Categorize expenses as Needs or Wants when recording a transaction to improve this report.</p></div></section></div>
 <section className="panel report-categories"><div className="panel-header"><div><h2>Top spending categories</h2><p>Across {year}</p></div></div>{cats.length?cats.slice(0,8).map((c,i)=><div className="report-category-row" key={c.name}><span className="category-color" style={{background:palette[i%palette.length]}}/><span>{c.name}</span><div className="report-bar"><i style={{width:`${c.value/(cats[0].value||1)*100}%`,background:palette[i%palette.length]}}/></div><b>{fmt(c.value)}</b></div>):<EmptyState icon={ChartNoAxesCombined} title="No yearly data yet" text="Once you record transactions, your annual reports will appear here."/>}</section>
 <section className="panel insights-panel"><div className="insight-icon"><Sparkles size={18}/></div><div><h2>Your {year} money recap</h2><p>{yIncome===0&&yExpenses===0?'Your yearly insights will appear as you record income and expenses.':`You recorded ${fmt(yIncome)} in income and ${fmt(yExpenses)} in expenses. Your net cash flow is ${fmt(yIncome-yExpenses)}. ${yExpenses?`Your biggest category is ${cats[0]?.name||'not categorized'} at ${fmt(cats[0]?.value||0)}.`:''} ${yIncome?`Your savings rate is ${Math.round((yIncome-yExpenses)/yIncome*100)}%.`:''}`}</p></div></section></>;
}

function InsightsReportsPage({transactions,month,setMonth,budgets,recurring,goals,debts,currency,setPage,accounts=[]}){
 const money=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);
 const [year,setYear]=useState(String((month||localISODate().slice(0,7)).slice(0,4)));
 useEffect(()=>{setYear(String((month||localISODate().slice(0,7)).slice(0,4)))},[month]);
 const [y,m]=month.split('-').map(Number); const nowKey=localISODate().slice(0,7); const daysInMonth=new Date(y,m,0).getDate();
 const monthTx=transactions.filter(t=>(t.transaction_date||'').slice(0,7)===month); const prevDate=new Date(y,m-2,15); const prevKey=`${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`; const prevTx=transactions.filter(t=>(t.transaction_date||'').slice(0,7)===prevKey);
 const sum=(arr,type)=>arr.filter(t=>t.type===type).reduce((a,t)=>a+Number(t.amount||0),0); const monthOpening=accounts.filter(a=>String(a.opening_balance_date||(a.created_at||'').slice(0,10)||'').slice(0,7)===month).reduce((v,a)=>v+Number(a.opening_balance||0),0); const income=sum(monthTx,'Income')+monthOpening,expenses=sum(monthTx,'Expense'),net=income-expenses,prevExpenses=sum(prevTx,'Expense');
 const elapsed=month===nowKey?Math.max(1,new Date().getDate()):month<nowKey?daysInMonth:1; const forecast=month<nowKey?expenses:expenses/elapsed*daysInMonth;
 const recurringMonthly=recurring.reduce((a,r)=>a+Number(r.amount||0)*(r.frequency==='Weekly'?4.33:r.frequency==='Quarterly'?1/3:r.frequency==='Yearly'?1/12:1),0);
 const limits=budgets.filter(b=>(b.month||'').slice(0,7)===month).map(b=>{const spent=sum(monthTx.filter(t=>t.category===b.category),'Expense');return {...b,spent,pct:Number(b.amount)?spent/Number(b.amount)*100:0}}).filter(b=>b.pct>=80).sort((a,b)=>b.pct-a.pct);
 const categoryTotals={}; monthTx.filter(t=>t.type==='Expense').forEach(t=>categoryTotals[t.category||'Other']=(categoryTotals[t.category||'Other']||0)+Number(t.amount||0)); const cats=Object.entries(categoryTotals).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
 const yearly=transactions.filter(t=>(t.transaction_date||'').startsWith(year)); const yearOpening=accounts.filter(a=>String(a.opening_balance_date||(a.created_at||'').slice(0,10)||'').startsWith(year)).reduce((v,a)=>v+Number(a.opening_balance||0),0); const yIncome=sum(yearly,'Income')+yearOpening,yExpenses=sum(yearly,'Expense'); const byMonth=Array.from({length:12},(_,i)=>{const key=`${year}-${String(i+1).padStart(2,'0')}`,rows=yearly.filter(t=>(t.transaction_date||'').slice(0,7)===key),opening=accounts.filter(a=>String(a.opening_balance_date||(a.created_at||'').slice(0,10)||'').slice(0,7)===key).reduce((v,a)=>v+Number(a.opening_balance||0),0);return {month:new Date(key+'-15T12:00:00').toLocaleDateString('en-US',{month:'short'}),Income:sum(rows,'Income')+opening,Expenses:sum(rows,'Expense')}});
 const advice=[]; if(!monthTx.length) advice.push('Add transactions for this month to unlock personalized insights.'); if(net<0) advice.push(`Spending is ${money(Math.abs(net))} higher than recorded income this month.`); if(prevExpenses>0&&expenses>prevExpenses*1.1) advice.push(`Spending is ${Math.round((expenses/prevExpenses-1)*100)}% higher than last month.`); if(prevExpenses>0&&expenses<prevExpenses*.9) advice.push(`Spending is down ${Math.round((1-expenses/prevExpenses)*100)}% compared with last month.`); if(cats[0]) advice.push(`${cats[0].name} is your largest spending category at ${money(cats[0].value)}.`); if(limits.length) advice.push(`${limits.length} budget${limits.length===1?'':'s'} reached at least 80% of the limit.`); if(!advice.length) advice.push('Your spending is on track with the information recorded so far.');
 const exportReport=()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(byMonth),'Monthly cash flow');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(cats.map(c=>({Category:c.name,Expense:c.value,SharePercent:expenses?Math.round(c.value/expenses*100):0}))),'This month categories');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(yearly.map(t=>({Date:t.transaction_date,Type:t.type,Category:t.category,Description:t.description,Amount:t.amount,AccountWallet:accounts.find(a=>a.id===t.account_id)?.name||'No account linked',NeedOrWant:t.need_want,Notes:t.notes}))), 'Transactions');XLSX.writeFile(wb,`pocket-money-report-${year}.xlsx`)};
 return <><PageHeading eyebrow="YOUR MONEY, AT A GLANCE" title="Insights & reports" subtitle="The key patterns, upcoming risks, and cash-flow picture — without the clutter." actions={<><MonthPicker month={month} setMonth={setMonth}/><button className="btn btn-secondary" onClick={exportReport}><Download size={16}/> Export report</button></>}/>
 <div className="metric-grid three"><MetricCard label="Net this month" value={money(net)} icon={CircleDollarSign} tone={net>=0?'green':'orange'} note="income minus expenses"/><MetricCard label="Projected month-end spend" value={money(forecast)} icon={TrendingUp} tone="blue" note={month===nowKey?`based on ${elapsed} elapsed day(s)`:month<nowKey?'completed month total':'early estimate'}/><MetricCard label="Annual savings rate" value={yIncome?`${Math.round((yIncome-yExpenses)/yIncome*100)}%`:'—'} icon={Target} tone="purple" note={`${year} income less expenses`}/></div>
 <div className="dashboard-grid report-charts"><section className="panel chart-panel"><div className="panel-header"><div><h2>Cash flow trend</h2><p>Monthly income compared with expenses in {year}</p></div><div className="year-picker"><CalendarDays size={16}/><select value={year} onChange={e=>{setYear(e.target.value);setMonth(`${e.target.value}-${month.slice(5,7)}`)}}>{Array.from({length:Math.max(6,new Date().getFullYear()-2020+2)},(_,i)=>String(new Date().getFullYear()+1-i)).map(v=><option key={v}>{v}</option>)}</select></div></div><div className="chart-legend"><span><i className="legend-dot income-dot"/> Income</span><span><i className="legend-dot expense-dot"/> Expenses</span></div><div className="line-chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={byMonth} margin={{top:8,right:8,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#9ba2af',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9ba2af',fontSize:11}} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={36}/><Tooltip formatter={v=>money(v)}/><Bar dataKey="Income" fill="#50b99a" radius={[5,5,0,0]}/><Bar dataKey="Expenses" fill="#f1b15d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section>
 <section className="panel"><div className="panel-header"><div><h2>Spending insights</h2><p>What stands out for {monthLabel(month)}.</p></div></div>{advice.slice(0,4).map((a,i)=><div className="insight-row" key={i}><span className="insight-bullet"><Sparkles size={15}/></span><p>{a}</p></div>)}<div className="panel-footer-action"><button className="btn btn-secondary" onClick={()=>setPage('Transactions')}>Review transactions <ArrowUpRight size={15}/></button></div></section></div>
 <div className="dashboard-grid report-charts"><section className="panel"><div className="panel-header"><div><h2>Top spending categories</h2><p>{money(expenses)} spent in {monthLabel(month)}</p></div></div>{cats.length?cats.slice(0,5).map((c,i)=><div className="report-category-row" key={c.name}><span className="category-color" style={{background:palette[i%palette.length]}}/><span>{c.name}</span><div className="report-bar"><i style={{width:`${c.value/(cats[0].value||1)*100}%`,background:palette[i%palette.length]}}/></div><b>{money(c.value)}</b></div>):<EmptyState icon={ChartNoAxesCombined} title="No spending yet" text="Add expenses to see your biggest categories here."/>}</section>
 <section className="panel"><div className="panel-header"><div><h2>Budget alerts</h2><p>Only budgets nearing or over their limit.</p></div></div>{limits.length?limits.slice(0,4).map(a=><div className="budget-alert-row" key={a.id}><div className="budget-alert-top"><b>{a.category}</b><span>{Math.round(a.pct)}% used</span></div><div className="progress-track"><span style={{width:`${Math.min(100,a.pct)}%`,background:a.pct>=100?'#ee8291':'#f5b85b'}}/></div><small>{money(a.spent)} of {money(a.amount)}{a.pct>=100?' · Over limit':''}</small></div>):<EmptyState icon={ShieldCheck} title="No budget alerts" text="Your budgets are below 80%, or no budgets are set for this month."/>}<button className="btn btn-secondary" onClick={()=>setPage('Budgets')}>Manage budgets</button></section></div>
 <section className="panel forecast-summary"><div className="panel-header"><div><h2>Planning snapshot</h2><p>Helpful context for your next money decision.</p></div></div><div className="forecast-grid"><div><span>Expected recurring costs / month</span><b>{money(recurringMonthly)}</b></div><div><span>Debt remaining</span><b>{money(debts.reduce((a,d)=>a+Number(d.remaining_amount||0),0))}</b></div><div><span>Active savings goals</span><b>{goals.length}</b></div></div><p className="small-muted">The spending forecast extends your recorded daily average; it is an estimate, not a guaranteed balance. Recurring costs and debt are shown as planning context and are not added to actual transactions.</p></section></>;
}

function AccountsPage({accounts,transactions,setModal,setEditing,removeRecord,setAccounts,currency,requestConfirm,defaultAccountId,setDefaultAccountId}){
 const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);
 const rows=accounts.map(a=>{const linked=transactions.filter(t=>t.account_id===a.id||t.to_account_id===a.id);const inflow=transactions.filter(t=>(t.type==='Income'&&String(t.account_id)===String(a.id))||(t.type==='Transfer'&&String(t.to_account_id)===String(a.id))).reduce((s,t)=>s+Number(t.amount||0),0);const outflow=transactions.filter(t=>(t.type==='Expense'&&String(t.account_id)===String(a.id))||(t.type==='Transfer'&&String(t.account_id)===String(a.id))).reduce((s,t)=>s+Number(t.amount||0),0);return {...a,balance:Number(a.opening_balance||0)+inflow-outflow,inflow,outflow,linkedCount:linked.length}});
 const total=rows.reduce((s,a)=>s+a.balance,0);
 return <><PageHeading eyebrow="YOUR MONEY, ORGANIZED" title="Accounts" subtitle="Track cash, bank accounts, and e-wallets in one place. Balances include only transactions linked to each account." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('account')}}><Plus size={17}/> Add account</button>}/><div className="metric-grid"><MetricCard label="Tracked balance" value={fmt(total)} icon={Wallet} tone="blue" note="opening balances + linked activity"/><MetricCard label="Accounts" value={String(accounts.length)} icon={CreditCard} tone="green" note="cash, bank, and wallets"/><MetricCard label="Linked transactions" value={String(rows.reduce((s,a)=>s+a.linkedCount,0))} icon={ArrowLeftRight} tone="orange" note="across these accounts"/></div>{rows.length?<div className="goal-grid">{rows.map((a,i)=><section className="panel goal-card" key={a.id}><div className="goal-card-top"><div className={`goal-big-icon goal-tone-${i%4}`}><Wallet size={22}/></div>{isGoalsAccount(a)?<span className="system-account-badge"><LockKeyhole size={12}/> System account</span>:<div className="goal-menu"><button className="icon-btn" onClick={()=>{setEditing(a);setModal('account')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>requestConfirm('Delete account or wallet?', `Delete “${a.name}”? Existing transactions will remain but will no longer contribute to this balance.`, ()=>removeRecord('financial_accounts',a.id,setAccounts,accounts))}><Trash2 size={15}/></button></div>}</div><h3>{a.name}</h3><p className="goal-deadline">{a.type}{isGoalsAccount(a)?' · Linked to your savings goals':''}</p>{!isGoalsAccount(a)&&<button type="button" className={`btn ${String(defaultAccountId)===String(a.id)?'btn-primary':'btn-secondary'}`} onClick={()=>{setDefaultAccountId(a.id);try{localStorage.setItem('pocket_default_account',String(a.id))}catch{} }} style={{marginTop:8}}>{String(defaultAccountId)===String(a.id)?'✓ Default for transactions':'Set as default account'}</button>}<div className="goal-amounts"><div><span>Current tracked balance</span><b>{fmt(a.balance)}</b></div><div><span>Opening balance · {a.opening_balance_date||(a.created_at?String(a.created_at).slice(0,10):'Date not set')}</span><b>{fmt(a.opening_balance)}</b></div></div><div className="split-note"><span>Money in: {fmt(a.inflow)}</span><span>Money out: {fmt(a.outflow)}</span></div><p className="goal-note">{a.linkedCount} linked transaction{a.linkedCount===1?'':'s'}. Add or edit a transaction to link it to this account.</p></section>)}</div>:<EmptyState icon={Wallet} title="No accounts yet" text="Add a cash, bank, or wallet account to start tracking balances."/>}</>;
}
function CashFlowCalendar({transactions,recurring,month,setMonth,currency}){
 const [selected,setSelected]=useState('');const [yy,mm]=month.split('-').map(Number);const first=new Date(yy,mm-1,1);const days=new Date(yy,mm,0).getDate();const offset=(first.getDay()+6)%7;
 const events={};const add=(date,item)=>{if(!date||date.slice(0,7)!==month)return;(events[date] ||= []).push(item)};
 transactions.forEach(t=>add(t.transaction_date,{kind:t.type==='Income'?'income':'expense',title:t.description||t.category,amount:Number(t.amount||0),label:t.type}));
 recurring.filter(r=>r.next_due_date).forEach(r=>add(r.next_due_date,{kind:'due',title:r.name,amount:Number(r.amount||0),label:'Due'}));
 const daysWithEvents=Object.keys(events).length;const dayEvents=events[selected]||[];const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);
 return <><PageHeading eyebrow="PLAN AHEAD" title="Cash flow calendar" subtitle="See recorded income and spending alongside upcoming recurring due dates." actions={<MonthPicker month={month} setMonth={setMonth}/>}/><section className="panel calendar-panel"><div className="calendar-heading"><button className="icon-btn" onClick={()=>setMonth(m=>{const [y,n]=m.split('-').map(Number);return `${n===1?y-1:y}-${String(n===1?12:n-1).padStart(2,'0')}`})}><ChevronLeft size={18}/></button><h2>{new Date(yy,mm-1,15).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h2><button className="icon-btn" onClick={()=>setMonth(m=>{const [y,n]=m.split('-').map(Number);return `${n===12?y+1:y}-${String(n===12?1:n+1).padStart(2,'0')}`})}><ChevronRight size={18}/></button></div><div className="calendar-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div className="calendar-weekday" key={d}>{d}</div>)}{Array.from({length:offset},(_,i)=><div className="calendar-empty" key={'e'+i}/>)}{Array.from({length:days},(_,i)=>{const d=i+1;const key=`${month}-${String(d).padStart(2,'0')}`;const ev=events[key]||[];return <button key={key} className={`calendar-day ${selected===key?'selected':''} ${key===localISODate()?'today':''}`} onClick={()=>setSelected(key)}><span>{d}</span><div className="calendar-dots">{ev.slice(0,3).map((e,j)=><i key={j} className={`calendar-dot ${e.kind}`}/>)}</div>{ev.length>0&&<small>{ev.length} item{ev.length>1?'s':''}</small>}</button>})}</div><div className="calendar-legend"><span><i className="calendar-dot income"/> Income</span><span><i className="calendar-dot expense"/> Expense</span><span><i className="calendar-dot due"/> Recurring due</span></div></section><section className="panel"><div className="panel-header"><div><h2>{selected?new Date(selected+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}):'Select a day'}</h2><p>{dayEvents.length?`${dayEvents.length} scheduled or recorded item${dayEvents.length===1?'':'s'}`:'Choose a day to inspect transactions and due dates.'}</p></div></div>{dayEvents.length?dayEvents.map((e,i)=><div className="upcoming-row" key={i}><div className={`upcoming-icon ${e.kind}`}><CalendarDays size={17}/></div><div className="upcoming-info"><b>{e.title}</b><span>{e.label}</span></div><strong className={e.kind==='income'?'amount-income':e.kind==='expense'?'amount-expense':''}>{e.kind==='income'?'+':e.kind==='expense'?'−':''}{fmt(e.amount)}</strong></div>):<p className="small-muted">No items for this date. Calendar events come from your saved transactions and recurring payment due dates; Pocket does not predict salary dates unless you record them.</p>}</section><p className="small-muted">{daysWithEvents} day{daysWithEvents===1?'':'s'} with activity this month. Recurring due dates are reminders, not automatic payments.</p></>;
}
function DebtsPage({debts,accounts=[],setModal,setEditing,removeRecord,setDebts,currency,requestConfirm,recordDebtInstallment,setToast}){
 const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:2}).format(Number(n)||0);const total=debts.reduce((s,d)=>s+Number(d.remaining_amount||0),0);const payments=debts.reduce((s,d)=>s+Number(d.monthly_payment||0),0);
 return <><PageHeading eyebrow="COMMITMENTS" title="Debts & installments" subtitle="Track the amount borrowed, repayment schedule, installments paid, and the total cost of each loan." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('debt')}}><Plus size={17}/> Add debt</button>}/><div className="metric-grid"><MetricCard label="Outstanding balance" value={fmt(total)} icon={CreditCard} tone="orange" note="remaining repayments across debts"/><MetricCard label="Planned installments" value={fmt(payments)} icon={CalendarDays} tone="blue" note="per payment cycle"/><MetricCard label="Active debts" value={String(debts.filter(d=>Number(d.remaining_amount)>0).length)} icon={ShieldCheck} tone="green" note="with a balance remaining"/></div>{debts.length?<div className="debt-card-grid">{debts.map(d=>{const term=Number(d.term_months||0),paid=Number(d.paid_installments||0),left=term?Math.max(0,term-paid):null,principal=Number(d.original_amount||0),totalRepayment=Number(d.total_repayment||((term&&Number(d.monthly_payment))?term*Number(d.monthly_payment):principal)),interest=Number(d.interest_rate??(principal>0?((totalRepayment-principal)/principal)*100:0)),amountPaid=Number(d.amount_paid??Math.max(0,totalRepayment-Number(d.remaining_amount||0))),progress=totalRepayment>0?Math.min(100,Math.max(0,amountPaid/totalRepayment*100)):0;return <section className="panel debt-detail-card" key={d.id}><div className="debt-card-top"><div className="goal-big-icon goal-tone-1"><CreditCard size={21}/></div><div className="debt-card-title"><h3>{d.name}</h3><p>{d.lender||d.debt_type||'Debt'} · {d.debt_type||'Other'} · Paid from: {accounts.find(a=>String(a.id)===String(d.account_id))?.name||'Account not linked'}</p></div><div className="row-actions"><button className="icon-btn" title="Edit debt" onClick={()=>{setEditing(d);setModal('debt')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" title="Delete debt" onClick={()=>requestConfirm('Delete debt record?',`Delete “${d.name}”? This cannot be undone.`,()=>removeRecord('debts',d.id,setDebts,debts))}><Trash2 size={15}/></button></div></div><div className="debt-primary-metrics"><div><span>Amount borrowed</span><b>{fmt(principal)}</b></div><div><span>Total repayment</span><b>{fmt(totalRepayment)}</b></div><div><span>Monthly installment</span><b>{fmt(d.monthly_payment)}</b></div></div><div className="debt-installment-progress"><div className="debt-progress-label"><span>{paid} installments paid</span><b>{left===null?'—':`${left} remaining`}</b></div><div className="progress-track debt-progress-track"><span style={{width:`${progress}%`,background:progress>=100?'#50b99a':'#6c7cf5'}}/></div></div><div className="debt-secondary-metrics"><div><span>Amount paid so far</span><b>{fmt(d.amount_paid??Math.max(0,totalRepayment-Number(d.remaining_amount||0)))}</b></div><div><span>Remaining to pay</span><b>{fmt(d.remaining_amount)}</b></div><div><span>Interest / extra cost</span><b>{fmt(Math.max(0,totalRepayment-principal))} ({interest.toFixed(2)}%)</b></div><div><span>Loan started</span><b>{d.start_date?shortDate(d.start_date):'Not set'}</b></div><div><span>Duration</span><b>{term?`${term} months`:'Not set'}</b></div><div><span>Next installment</span><b>{d.due_date?shortDate(d.due_date):'Not set'}</b></div></div><div className="debt-card-actions"><button className="btn btn-primary" disabled={!d.account_id||Number(d.remaining_amount||0)<=0||Number(d.monthly_payment||0)<=0} onClick={()=>requestConfirm('Record installment?',`Record one ${d.frequency||'monthly'} installment of ${fmt(Math.min(Number(d.monthly_payment||0),Number(d.remaining_amount||0)))} for “${d.name}”? This creates an expense transaction, deducts the installment from the linked account, and updates the remaining balance and installment count.`,()=>recordDebtInstallment(d),'Record installment',{variant:'payment'})}><Check size={15}/> Record installment paid</button><span>{Number(d.remaining_amount||0)<=0?'Fully paid':!d.account_id?'Edit debt to link an account':`${Math.round(progress)}% repaid`}</span></div></section>})}</div>:<EmptyState icon={CreditCard} title="No debts tracked" text="Add a bank loan, credit card balance, or installment plan to see the full repayment cost and how many installments remain."/>}</>;
}

function InsightsPage({transactions,month,setMonth,budgets,recurring,goals,debts,currency,setPage}){
 const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);const [y,m]=month.split('-').map(Number);const previous=new Date(y,m-2,15);const prevKey=`${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,'0')}`;const tx=transactions.filter(t=>(t.transaction_date||'').slice(0,7)===month);const prev=transactions.filter(t=>(t.transaction_date||'').slice(0,7)===prevKey);const sum=(arr,type)=>arr.filter(t=>t.type===type).reduce((s,t)=>s+Number(t.amount||0),0);const income=sum(tx,'Income'),expenses=sum(tx,'Expense'),prevExpenses=sum(prev,'Expense'),net=income-expenses;const daysInMonth=new Date(y,m,0).getDate();const currentMonth=localISODate().slice(0,7);const elapsed=month===currentMonth?Math.max(1,new Date().getDate()):month<currentMonth?daysInMonth:1;const forecast=expenses/elapsed*daysInMonth;const recurringMonthly=recurring.reduce((s,r)=>s+Number(r.amount||0)*(r.frequency==='Weekly'?4.33:r.frequency==='Quarterly'?1/3:r.frequency==='Yearly'?1/12:1),0);const limits=budgets.filter(b=>(b.month||'').slice(0,7)===month);const alerts=limits.map(b=>{const spent=tx.filter(t=>t.type==='Expense'&&t.category===b.category).reduce((s,t)=>s+Number(t.amount||0),0);return {...b,spent,pct:Number(b.amount)?spent/Number(b.amount)*100:0}}).filter(b=>b.pct>=80).sort((a,b)=>b.pct-a.pct);const cats={};tx.filter(t=>t.type==='Expense').forEach(t=>cats[t.category]=(cats[t.category]||0)+Number(t.amount||0));const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];const change=prevExpenses?((expenses-prevExpenses)/prevExpenses)*100:null;const advice=[];if(!tx.length)advice.push('Add transactions for this month to unlock data-based insights.');if(net<0)advice.push(`Recorded spending exceeds income by ${fmt(Math.abs(net))}. Review non-essential categories first.`);if(change!==null&&change>10)advice.push(`Expenses are ${Math.round(change)}% higher than last month. Check the categories that grew most.`);if(change!==null&&change<-10)advice.push(`Expenses are down ${Math.round(Math.abs(change))}% compared with last month.`);if(top)advice.push(`${top[0]} is your highest-spend category at ${fmt(top[1])} this month.`);if(alerts.length)advice.push(`${alerts.length} budget limit${alerts.length===1?' is':'s are'} at 80% or more.`);if(!advice.length)advice.push('Keep recording transactions consistently. Insights improve when both income and spending are captured.');
 return <><PageHeading eyebrow="AUTOMATION & ANALYSIS" title="Insights & forecast" subtitle="Understand recorded patterns and estimate month-end spending from the current daily average." actions={<MonthPicker month={month} setMonth={setMonth}/>}/><div className="metric-grid"><MetricCard label="Current net cash flow" value={fmt(net)} icon={CircleDollarSign} tone={net>=0?'green':'orange'} note="income minus expenses"/><MetricCard label="Month-end expense estimate" value={fmt(forecast)} icon={TrendingUp} tone="blue" note={month===localISODate().slice(0,7)?`based on ${elapsed} elapsed day(s)`:month<localISODate().slice(0,7)?'completed month total':'early estimate; future month'}/><MetricCard label="Expected recurring costs" value={fmt(recurringMonthly)} icon={Repeat2} tone="orange" note="normalized monthly equivalent"/><MetricCard label="Debt remaining" value={fmt(debts.reduce((s,d)=>s+Number(d.remaining_amount||0),0))} icon={CreditCard} tone="blue" note="tracked debt records"/></div><div className="content-grid"><section className="panel"><div className="panel-header"><div><h2><Sparkles size={17}/> Smart financial insights</h2><p>Generated from the transactions and budgets you have saved.</p></div></div>{advice.map((a,i)=><div className="insight-row" key={i}><span className="insight-bullet"><Sparkles size={15}/></span><p>{a}</p></div>)}<div className="panel-footer-action"><button className="btn btn-secondary" onClick={()=>setPage('Transactions')}>Review transactions <ArrowUpRight size={15}/></button></div></section><section className="panel"><div className="panel-header"><div><h2>Budget alerts</h2><p>Alerts at 80% of the monthly category limit.</p></div></div>{alerts.length?alerts.map(a=><div className="budget-alert-row" key={a.id}><div className="budget-alert-top"><b>{a.category}</b><span>{Math.round(a.pct)}% used</span></div><div className="progress-track"><span style={{width:`${Math.min(100,a.pct)}%`,background:a.pct>=100?'#ee8291':'#f5b85b'}}/></div><small>{fmt(a.spent)} spent of {fmt(a.amount)}{a.pct>=100?' · Over limit':''}</small></div>):<EmptyState icon={ShieldCheck} title="No budget alerts" text="Set category budgets to receive alerts when spending approaches the limit."/>}<button className="btn btn-secondary" onClick={()=>setPage('Budgets')}>Manage budgets</button></section></div><section className="panel"><div className="panel-header"><div><h2>Forecast notes</h2><p>Use this estimate as a planning aid, not a guaranteed balance.</p></div></div><div className="forecast-grid"><div><span>Estimated remaining income after projected expenses</span><b className={income-forecast>=0?'amount-income':'amount-expense'}>{fmt(income-forecast)}</b></div><div><span>Monthly recurring commitments</span><b>{fmt(recurringMonthly)}</b></div><div><span>Savings goals tracked</span><b>{goals.length}</b></div></div><p className="small-muted">Forecast assumes the current average daily expense continues for the rest of the month. It does not automatically add future salary, due dates, or unrecorded bills to actual transactions.</p></section></>;
}
function AccountSetupWizard({onSave,currency='EGP'}){
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]);
 const [saving,setSaving]=useState(false);
 const [form,setForm]=useState({type:'Bank account',name:'',opening_balance:'0',opening_balance_date:localISODate(),color:'#6c7cf5'});
 const set=(key,value)=>setForm(old=>({...old,[key]:value}));
 const types=[
  {name:'Cash',description:'Money you keep on hand',icon:'💵'},
  {name:'Bank account',description:'Your current or salary account',icon:'🏦'},
  {name:'Digital wallet',description:'Wallets such as Vodafone Cash',icon:'📱'},
  {name:'Credit card',description:'Track spending on a credit card',icon:'💳'},
  {name:'Savings account',description:'Money set aside for savings',icon:'🐷'},
  {name:'Other',description:'Another place you keep money',icon:'👛'}
 ];
 async function submit(){if(!form.name.trim())return;setSaving(true);try{await onSave(form)}finally{setSaving(false)}}
 return <div className="modal-backdrop setup-wizard-backdrop"><div className="modal setup-wizard-modal"><div className="setup-wizard-brand"><span className="brand-mark"><img className="brand-logo-mark" src="/brand/pocket-mark.svg" alt="" /></span><span>Pocket</span><span className="setup-step-count">STEP {step} OF 3</span></div><div className="setup-progress"><span style={{width:`${step/3*100}%`}}/></div>
  {step===1&&<><div className="setup-wizard-intro"><span className="setup-wizard-kicker">LET’S GET YOU SET UP</span><h2>Where do you keep your money?</h2><p>Choose the first account or wallet you want to track. You can add more later.</p></div><div className="setup-type-grid">{types.map(t=><button type="button" key={t.name} className={`setup-type-card ${form.type===t.name?'selected':''}`} onClick={()=>set('type',t.name)}><span className="setup-type-emoji">{t.icon}</span><span><b>{t.name}</b><small>{t.description}</small></span>{form.type===t.name&&<Check size={16}/>}</button>)}</div><div className="modal-actions"><button className="btn btn-primary" onClick={()=>setStep(2)}>Continue <ArrowUpRight size={16}/></button></div></>}
  {step===2&&<><div className="setup-wizard-intro"><span className="setup-wizard-kicker">YOUR FIRST ACCOUNT</span><h2>Give it a name</h2><p>Add a name you’ll recognize and its current starting balance.</p></div><form onSubmit={e=>{e.preventDefault();setStep(3)}}><div className="setup-selected-type"><span className="setup-type-emoji">{types.find(t=>t.name===form.type)?.icon}</span><div><b>{form.type}</b><small>You can change these details later.</small></div><button type="button" className="text-link" onClick={()=>setStep(1)}>Change</button></div><div className="form-grid setup-form-grid"><Field label="Account / wallet name" wide><input autoFocus required maxLength={60} value={form.name} onChange={e=>set('name',e.target.value)} placeholder={form.type==='Cash'?'e.g. Cash in hand':form.type==='Digital wallet'?'e.g. Vodafone Cash':'e.g. Main bank account'}/></Field><Field label={`Opening balance (${currency})`} wide><input type="number" min="0" step="0.01" required value={form.opening_balance} onChange={e=>set('opening_balance',e.target.value)}/><small className="field-help">Enter 0 if you want to start tracking from today.</small></Field><Field label="Opening balance date" wide><input type="date" required value={form.opening_balance_date||localISODate()} onChange={e=>set('opening_balance_date',e.target.value)}/><small className="field-help">The date this starting balance applies to.</small></Field></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}>Back</button><button type="submit" className="btn btn-primary">Review account <ArrowUpRight size={16}/></button></div></form></>}
  {step===3&&<><div className="setup-wizard-intro"><span className="setup-wizard-kicker">READY TO GO</span><h2>Review your account</h2><p>Make sure everything looks right. You can edit it anytime.</p></div><div className="setup-review-card"><span className="setup-review-icon"><Wallet size={23}/></span><div className="setup-review-copy"><small>ACCOUNT / WALLET</small><h3>{form.name}</h3><span>{form.type}</span></div><div className="setup-review-balance"><small>STARTING BALANCE</small><b>{fmt(Number(form.opening_balance||0))}</b><small className="setup-review-date">As of {form.opening_balance_date||localISODate()}</small></div></div><div className="setup-ready-note"><Check size={17}/><span>After you create this account, you can add transactions and track your balance in Pocket.</span></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(2)}>Back</button><button type="button" className="btn btn-primary" disabled={saving} onClick={submit}>{saving?<LoaderCircle size={16} className="spin"/>:<Check size={16}/>} Create account</button></div></>}
 </div></div>
}

function WizardProgress({step,total=3,labels}){return <div className="tx-wizard-progress"><div className="tx-wizard-steps">{labels.map((label,i)=><div key={label} className={`tx-wizard-step ${step===i+1?'active':step>i+1?'complete':''}`}><span>{step>i+1?<Check size={14}/>:i+1}</span><b>{label}</b></div>)}</div><div className="tx-wizard-track"><span style={{width:`${step/total*100}%`}}/></div></div>}
function ChoiceCards({items,value,onChange,columns=3}){return <div className="tx-category-grid" style={{gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`}}>{items.map(item=><button type="button" key={item.value} className={`tx-choice-card ${value===item.value?'selected':''}`} onClick={()=>onChange(item.value)}><span className="tx-choice-icon">{item.icon||<CircleDollarSign size={17}/>}</span><span className="tx-choice-label">{item.label}</span>{item.description&&<small>{item.description}</small>}{value===item.value&&<span className="tx-choice-check"><Check size={13}/></span>}</button>)}</div>}
function AccountModal({initial,onClose,onSave,currency='EGP'}){
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]);const [f,S]=useState({name:initial?.name||'',type:initial?.type||'Bank account',opening_balance:initial?.opening_balance??0,opening_balance_date:initial?.opening_balance_date||(initial?.created_at?String(initial.created_at).slice(0,10):localISODate()),color:initial?.color||'#6c7cf5'});const set=(k,v)=>S(s=>({...s,[k]:v}));
 const types=[['Cash','Cash you keep on hand','💵'],['Bank account','Everyday or salary account','🏦'],['Digital wallet','Mobile money wallet','📱'],['Credit card','Credit card balance tracking','💳'],['Savings account','Money set aside','🐷'],['Other','Another money account','👛']];
 return <ModalShell title={initial?'Edit account or wallet':'Add account or wallet'} subtitle="Set up the place where you keep your money." onClose={onClose} wide><WizardProgress step={step} labels={['Account type','Details','Review']}/>
 <form onSubmit={e=>{e.preventDefault();if(step<3){setStep(x=>x+1);return}onSave(f)}}>
 {step===1&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>What kind of account is it?</h3><p>Choose the option that best describes this account or wallet.</p></div><ChoiceCards columns={3} value={f.type} onChange={v=>set('type',v)} items={types.map(([label,description,icon])=>({value:label,label,description,icon}))}/><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" onClick={()=>setStep(2)}>Continue <ArrowUpRight size={16}/></button></div></section>}
 {step===2&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Give it a name</h3><p>Add a recognizable name and starting balance.</p></div><div className="form-grid"><Field label="Account / wallet name" wide><input autoFocus required maxLength={60} value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Main bank, Cash, Vodafone Cash"/></Field><Field label={`Opening balance (${currency})`}><input type="number" step="0.01" required value={f.opening_balance} onChange={e=>set('opening_balance',e.target.value)}/></Field><Field label="Opening balance date"><input type="date" required value={f.opening_balance_date||localISODate()} onChange={e=>set('opening_balance_date',e.target.value)}/></Field><Field label="Accent color"><div className="choice-color-row">{[['#6c7cf5','Indigo'],['#50b99a','Green'],['#f5b85b','Amber'],['#ee8291','Rose']].map(([v,l])=><button type="button" key={v} title={l} className={`color-choice ${f.color===v?'selected':''}`} style={{'--choice-color':v}} onClick={()=>set('color',v)}><span/></button>)}</div></Field></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}><ChevronLeft size={16}/> Back</button><button type="button" className="btn btn-primary" disabled={!f.name.trim()} onClick={()=>setStep(3)}>Review <ArrowUpRight size={16}/></button></div></section>}
 {step===3&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Review your account</h3><p>Check the details before saving.</p></div><div className="tx-review-card"><div className="tx-review-icon"><Wallet size={22}/></div><div className="tx-review-main"><span>{f.type.toUpperCase()}</span><strong>{f.name||'New account'}</strong><small>Opening balance</small></div><strong className="tx-review-amount">{fmt(Number(f.opening_balance)||0)}</strong></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(2)}><ChevronLeft size={16}/> Back</button><button type="submit" className="btn btn-primary"><Check size={16}/>{initial?'Save changes':'Add account'}</button></div></section>}
 </form></ModalShell>
}
function DebtModal({initial,onClose,onSave,currency='EGP',accounts=[]}){
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]);const [f,S]=useState({name:initial?.name||'',debt_type:initial?.debt_type||'Bank loan',lender:initial?.lender||'',account_id:initial?.account_id||accounts.find(a=>!isGoalsAccount(a))?.id||'',original_amount:initial?.original_amount??'',remaining_amount:initial?.remaining_amount??'',monthly_payment:initial?.monthly_payment??'',start_date:initial?.start_date||'',term_months:initial?.term_months??'',paid_installments:initial?.paid_installments??0,due_date:initial?.due_date||'',frequency:initial?.frequency||'Monthly',notes:initial?.notes||''});const set=(k,v)=>S(s=>({...s,[k]:v}));
 const installmentsFromDates=(start,due,term)=>{if(!start||!due)return null;const a=new Date(`${start}T12:00:00`),b=new Date(`${due}T12:00:00`);if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<a)return 0;let months=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());if(b.getDate()<a.getDate())months--;return Math.max(0,Math.min(Number(term)||600,months));};
 const types=[['Installment','Phone, appliance, or purchase plan','📅'],['Personal loan','Money borrowed from a person or lender','🤝'],['Credit card','Outstanding credit card balance','💳'],['Bank loan','Formal loan from a bank','🏦'],['Buy now, pay later','Split payments or BNPL','🛍️'],['Other','Another debt or liability','↗']];
 const principal=Number(f.original_amount||0),installment=Number(f.monthly_payment||0),term=Math.max(0,Number(f.term_months||0)),totalRepayment=term>0&&installment>0?installment*term:principal,interest=principal>0?((totalRepayment-principal)/principal)*100:0,datedPaid=installmentsFromDates(f.start_date,f.due_date,term),paid=datedPaid===null?Number(f.paid_installments||0):datedPaid,amountPaid=Math.min(totalRepayment,Math.max(0,Number((paid*installment).toFixed(2)))),remaining=Math.max(0,totalRepayment-amountPaid);const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:2}).format(Number(n)||0);
 return <ModalShell title={initial?'Edit debt or installment':'Add debt or installment'} subtitle="Enter the loan terms and dates. Pocket estimates installments already paid from the start date and next due date." onClose={onClose} wide><WizardProgress step={step} labels={['Debt type','Loan details','Review']}/><form onSubmit={e=>{e.preventDefault();if(step<3){setStep(x=>x+1);return}onSave({...f,paid_installments:paid,amount_paid:amountPaid,total_repayment:totalRepayment,interest_rate:interest,remaining_amount:remaining})}}>
 {step===1&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>What kind of debt is this?</h3><p>Choose a type to organize the obligation.</p></div><ChoiceCards value={f.debt_type} onChange={v=>set('debt_type',v)} items={types.map(([label,description,icon])=>({value:label,label,description,icon}))}/><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" onClick={()=>setStep(2)}>Continue <ArrowUpRight size={16}/></button></div></section>}
 {step===2&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Loan details</h3><p>For example, if the bank gives you EGP 100,000 and you repay it over 36 months, enter the agreed monthly installment.</p></div><div className="form-grid"><Field label="Debt / loan name" wide><input autoFocus required value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. CIB personal loan"/></Field><Field label="Bank / lender"><input value={f.lender} onChange={e=>set('lender',e.target.value)} placeholder="e.g. Bank name"/></Field><Field label="Pay installments from" wide><select required value={f.account_id} onChange={e=>set('account_id',e.target.value)}><option value="">Choose account or wallet</option>{accounts.filter(a=>!isGoalsAccount(a)).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><small className="field-help">Every recorded installment will create an expense transaction and deduct from this account.</small></Field><Field label={`Amount received / borrowed (${currency})`}><input required min="0.01" type="number" step="0.01" value={f.original_amount} onChange={e=>set('original_amount',e.target.value)}/></Field><Field label="Loan start date"><input required type="date" value={f.start_date} onChange={e=>set('start_date',e.target.value)}/></Field><Field label="Duration (months)"><input required min="1" max="600" type="number" value={f.term_months} onChange={e=>set('term_months',e.target.value)} placeholder="e.g. 36"/></Field><Field label="Installments paid (calculated)"><input type="number" value={paid} readOnly/><small className="small-muted">Calculated from loan start date and next installment date. If either date is missing, the saved count is used.</small></Field><Field label={`Monthly installment (${currency})`}><input required min="0.01" type="number" step="0.01" value={f.monthly_payment} onChange={e=>set('monthly_payment',e.target.value)} placeholder="e.g. 3500"/></Field><Field label="Next installment due"><input type="date" value={f.due_date} onChange={e=>set('due_date',e.target.value)}/></Field><Field label="Notes" wide><input value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Optional loan details"/></Field></div><div className="debt-calculation-preview"><div><span>Total amount you will pay</span><b>{fmt(totalRepayment)}</b></div><div><span>Interest / extra cost</span><b>{fmt(totalRepayment-principal)} ({interest.toFixed(2)}%)</b></div><div><span>Amount paid so far</span><b>{fmt(amountPaid)}</b></div><div><span>Estimated remaining</span><b>{fmt(remaining)}</b></div><p>Installments paid are estimated from the loan start date and next due date. Amount paid so far = installments paid × monthly installment. Estimated remaining = total repayment − amount paid so far. The percentage shown is the total extra cost as a share of the amount borrowed, not the bank’s annual APR. Fees, insurance, or a different final installment can change the real cost.</p>{totalRepayment<principal&&<p className="text-danger">The total repayment is lower than the amount borrowed. Check the loan amount or installment details.</p>}</div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}><ChevronLeft size={16}/> Back</button><button type="button" className="btn btn-primary" disabled={!f.name.trim()||!f.account_id||principal<=0||installment<=0||term<=0||!f.start_date||totalRepayment<principal} onClick={()=>setStep(3)}>Review <ArrowUpRight size={16}/></button></div></section>}
 {step===3&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Review your loan</h3><p>Confirm the repayment plan before saving.</p></div><div className="tx-review-card"><div className="tx-review-icon"><CreditCard size={22}/></div><div className="tx-review-main"><span>{f.debt_type.toUpperCase()}</span><strong>{f.name}</strong><small>{f.lender||'Lender not specified'} · Started {f.start_date} · {term} months</small></div><strong className="tx-review-amount">{fmt(principal)}</strong></div><div className="tx-review-details"><div><span>Payment account</span><b>{accounts.find(a=>String(a.id)===String(f.account_id))?.name||'Not selected'}</b></div><div><span>Monthly installment</span><b>{fmt(installment)}</b></div><div><span>Total repayment</span><b>{fmt(totalRepayment)}</b></div><div><span>Extra cost / interest</span><b>{fmt(totalRepayment-principal)} ({interest.toFixed(2)}%)</b></div><div><span>Installments paid</span><b>{paid} of {term}</b></div></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(2)}><ChevronLeft size={16}/> Back</button><button type="submit" className="btn btn-primary"><Check size={16}/>{initial?'Save changes':'Add debt'}</button></div></section>}
 </form></ModalShell>
}

function GoalModal({initial,onClose,onSave,currency='EGP'}){
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]);const [f,S]=useState({name:initial?.name||'',goal_type:initial?.goal_type||'Emergency fund',target_amount:initial?.target_amount??'',saved_amount:initial?.saved_amount??0,target_date:initial?.target_date||'',notes:initial?.notes||''});const set=(k,v)=>S(s=>({...s,[k]:v}));
 const types=[['Emergency fund','Build a financial safety net','🛟'],['Travel','Plan a trip or holiday','✈️'],['Home','Save for a home or furniture','🏡'],['Car','Save for a car or upgrade','🚗'],['Education','Courses, tuition, or learning','🎓'],['Big purchase','Something special you want','✨'],['Investment','Build long-term savings','📈'],['Other','A personal milestone','🎯']];
 return <div className="modal-backdrop goal-page-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal modal-wide goal-create-page"><div className="modal-head"><div><div className="eyebrow">SAVINGS GOALS</div><h2>{initial?'Edit savings goal':'Create a savings goal'}</h2><p>Turn a meaningful milestone into a plan.</p></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div><WizardProgress step={step} labels={['Goal type','Your plan','Review']}/><form onSubmit={e=>{e.preventDefault();if(step<3){setStep(x=>x+1);return}onSave(f)}}>
 {step===1&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>What are you saving for?</h3><p>Choose a goal type to get started, then give it your own name.</p></div><ChoiceCards columns={4} value={f.goal_type} onChange={v=>{set('goal_type',v);if(!f.name.trim())set('name',v)}} items={types.map(([label,description,icon])=>({value:label,label,description,icon}))}/><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" onClick={()=>setStep(2)}>Continue <ArrowUpRight size={16}/></button></div></section>}
 {step===2&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Set your target</h3><p>Choose an amount and a timeline that works for you.</p></div><div className="form-grid"><Field label="Goal name" wide><input autoFocus required value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Emergency fund"/></Field><Field label={`Target amount (${currency})`}><input required type="number" min="1" step="0.01" value={f.target_amount} onChange={e=>set('target_amount',e.target.value)}/></Field><Field label={`Already saved (${currency})`}><input type="number" min="0" step="0.01" value={f.saved_amount} onChange={e=>set('saved_amount',e.target.value)}/></Field><Field label="Target date"><input type="date" value={f.target_date} onChange={e=>set('target_date',e.target.value)}/></Field><Field label="Notes" wide><input value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Optional details"/></Field></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}><ChevronLeft size={16}/> Back</button><button type="button" className="btn btn-primary" disabled={!f.name.trim()||Number(f.target_amount)<=0||Number(f.saved_amount)<0} onClick={()=>setStep(3)}>Review <ArrowUpRight size={16}/></button></div></section>}
 {step===3&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Review your goal</h3><p>One last look before adding it to your goals.</p></div><div className="tx-review-card"><div className="tx-review-icon"><Target size={22}/></div><div className="tx-review-main"><span>{f.goal_type.toUpperCase()}</span><strong>{f.name}</strong><small>{f.target_date?`Target · ${f.target_date}`:'Flexible timeline'}</small></div><strong className="tx-review-amount">{fmt(Number(f.target_amount)||0)}</strong></div><div className="tx-review-details"><div><span>Already saved</span><b>{fmt(Number(f.saved_amount)||0)}</b></div><div><span>Still to save</span><b>{fmt(Math.max(0,Number(f.target_amount)-Number(f.saved_amount)))}</b></div></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(2)}><ChevronLeft size={16}/> Back</button><button type="submit" className="btn btn-primary"><Check size={16}/>{initial?'Save changes':'Create goal'}</button></div></section>}
 </form></section></div>
}
function RecurringModal({initial,onClose,onSave,currency='EGP',accounts=[]}){
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]);const [f,S]=useState({name:initial?.name||'',category:initial?.category||'Bills & Utilities',subcategory:initial?.subcategory||getSubcategories('Expense',initial?.category||'Bills & Utilities')[0],amount:initial?.amount??'',frequency:initial?.frequency||'Monthly',next_due_date:initial?.next_due_date||'',account_id:initial?.account_id||accounts[0]?.id||'',auto_pay:initial?.auto_pay||false,paid_this_cycle:initial?.paid_this_cycle||false,essential:initial?.essential??true,notes:initial?.notes||''});const set=(k,v)=>S(s=>({...s,[k]:v}));const subs=getSubcategories('Expense',f.category);
 return <ModalShell title={initial?'Edit recurring payment':'Add payment'} subtitle="Organize a recurring bill or subscription before it is due." onClose={onClose} wide><WizardProgress step={step} labels={['Category','Payment details','Review']}/><form onSubmit={e=>{e.preventDefault();if(step<3){setStep(x=>x+1);return}onSave(f)}}>
 {step===1&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>What kind of payment is it?</h3><p>Select a category and the closest subcategory.</p></div><ChoiceCards columns={4} value={f.category} onChange={v=>S(old=>({...old,category:v,subcategory:getSubcategories('Expense',v)[0]}))} items={expenseCategories.map((c,i)=>({value:c,label:c,icon:<CategoryGlyph name={['house','shopping-basket','car-front','receipt','heart-pulse','shopping-bag','clapperboard','graduation-cap','plane','piggy-bank','gift'][i%11]}/>}))}/><div className="tx-subcategory-heading"><div><h4>Subcategory</h4><p>Choose the closest match</p></div><span>{f.category}</span></div><div className="tx-subcategory-grid">{subs.map(sub=><button type="button" key={sub} className={`tx-subcategory-card ${f.subcategory===sub?'selected':''}`} onClick={()=>set('subcategory',sub)}>{sub}{f.subcategory===sub&&<Check size={14}/>}</button>)}</div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" onClick={()=>setStep(2)}>Continue <ArrowUpRight size={16}/></button></div></section>}
 {step===2&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Payment details</h3><p>Keep the amount and schedule handy.</p></div><div className="form-grid"><Field label="Payment name" wide><input autoFocus required value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Internet subscription"/></Field><Field label={`Amount (${currency})`}><input required min="0.01" type="number" step="0.01" value={f.amount} onChange={e=>set('amount',e.target.value)}/></Field><Field label="Frequency"><div className="tx-subcategory-grid">{['Weekly','Monthly','Quarterly','Yearly'].map(x=><button type="button" key={x} className={`tx-subcategory-card ${f.frequency===x?'selected':''}`} onClick={()=>set('frequency',x)}>{x}</button>)}</div></Field><Field label="Next due date"><input type="date" value={f.next_due_date} onChange={e=>set('next_due_date',e.target.value)}/></Field><Field label="Pay from account / wallet" wide><select required value={f.account_id} onChange={e=>set('account_id',e.target.value)}><option value="">Choose account or wallet</option>{accounts.filter(a=>!isGoalsAccount(a)).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><small className="field-help">Marking this payment as paid will create an expense against this account and check its available balance.</small></Field><label className="checkbox-field"><input type="checkbox" checked={f.auto_pay} onChange={e=>set('auto_pay',e.target.checked)}/> Auto-pay enabled</label><label className="checkbox-field"><input type="checkbox" checked={f.essential} onChange={e=>set('essential',e.target.checked)}/> Essential payment</label><Field label="Notes" wide><input value={f.notes} onChange={e=>set('notes',e.target.value)}/></Field></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}><ChevronLeft size={16}/> Back</button><button type="button" className="btn btn-primary" disabled={!f.name.trim()||Number(f.amount)<=0||!f.account_id} onClick={()=>setStep(3)}>Review <ArrowUpRight size={16}/></button></div></section>}
 {step===3&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Review your payment</h3><p>Confirm the category and schedule.</p></div><div className="tx-review-card"><div className="tx-review-icon"><Repeat2 size={22}/></div><div className="tx-review-main"><span>{f.category.toUpperCase()} · {f.subcategory}</span><strong>{f.name}</strong><small>{f.frequency}{f.next_due_date?` · Due ${f.next_due_date}`:''} · {accounts.find(a=>String(a.id)===String(f.account_id))?.name||'No account selected'}</small></div><strong className="tx-review-amount">{fmt(Number(f.amount)||0)}</strong></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(2)}><ChevronLeft size={16}/> Back</button><button type="submit" className="btn btn-primary"><Check size={16}/>{initial?'Save changes':'Add payment'}</button></div></section>}
 </form></ModalShell>
}
function BudgetModal({initial,month,onClose,onSave,currency='EGP'}){
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]);const [f,S]=useState({category:initial?.category||'Food & Groceries',month:(initial?.month||monthStart(month)).slice(0,7),amount:initial?.amount??''});const set=(k,v)=>S(s=>({...s,[k]:v}));
 return <ModalShell title={initial?.id?'Edit budget':'Set budget'} subtitle="Choose a monthly spending limit for one category." onClose={onClose} wide><WizardProgress step={step} labels={['Category','Budget limit','Review']}/><form onSubmit={e=>{e.preventDefault();if(step<3){setStep(x=>x+1);return}onSave(f)}}>
 {step===1&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>{initial?.id?`Edit ${f.category} budget`:'Which category are you budgeting for?'}</h3><p>{initial?.id?'Only this category budget for the selected month will be updated.':'Choose a category to give it a clear monthly limit.'}</p></div>{initial?.id?<div className="tx-review-card"><div className="tx-review-icon"><Wallet size={22}/></div><div className="tx-review-main"><span>SELECTED BUDGET</span><strong>{f.category}</strong><small>{monthLabel(f.month)}</small></div></div>:<ChoiceCards columns={4} value={f.category} onChange={v=>set('category',v)} items={expenseCategories.map((c,i)=>({value:c,label:c,icon:<CategoryGlyph name={['house','shopping-basket','car-front','receipt','heart-pulse','shopping-bag','clapperboard','graduation-cap','plane','piggy-bank','gift'][i%11]}/>}))}/>}<div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" onClick={()=>setStep(2)}>Continue <ArrowUpRight size={16}/></button></div></section>}
 {step===2&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Set your limit</h3><p>Pick the month and amount that feels realistic.</p></div><div className="form-grid"><Field label="Month"><input type="month" required value={f.month} onChange={e=>set('month',e.target.value)}/></Field><Field label={`Monthly budget (${currency})`}><input autoFocus required type="number" min="0.01" step="0.01" value={f.amount} onChange={e=>set('amount',e.target.value)} placeholder="e.g. 2500"/></Field></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}><ChevronLeft size={16}/> Back</button><button type="button" className="btn btn-primary" disabled={!f.month||Number(f.amount)<=0} onClick={()=>setStep(3)}>Review <ArrowUpRight size={16}/></button></div></section>}
 {step===3&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Review your budget</h3><p>One clear limit, ready to track.</p></div><div className="tx-review-card"><div className="tx-review-icon"><Wallet size={22}/></div><div className="tx-review-main"><span>{f.month}</span><strong>{f.category}</strong><small>Monthly spending limit</small></div><strong className="tx-review-amount">{fmt(Number(f.amount)||0)}</strong></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(2)}><ChevronLeft size={16}/> Back</button><button type="submit" className="btn btn-primary"><Check size={16}/>{initial?.id?'Save budget':'Set budget'}</button></div></section>}
 </form></ModalShell>
}

function ConfirmActionModal({dialog,onCancel,onConfirm}){
 return <div className="modal-backdrop confirm-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onCancel()}><section className="modal confirm-action-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-action-title"><div className={`confirm-action-icon ${dialog.variant==='payment'?'confirm-action-icon-payment':''}`}>{dialog.variant==='payment'?<CreditCard size={21}/>:<Trash2 size={21}/>}</div><div className="confirm-action-copy"><h2 id="confirm-action-title">{dialog.title}</h2><p>{dialog.description}</p></div><div className="confirm-action-buttons"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button><button type="button" className={`btn ${dialog.variant==='payment'?'btn-primary':'btn-danger'}`} onClick={onConfirm}>{dialog.variant==='payment'&&<CreditCard size={15}/>} {dialog.confirmLabel||'Delete'}</button></div></section></div>;
}

function ModalShell({title,subtitle,onClose,children,wide=false}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className={`modal ${wide?'modal-wide':''}`}><div className="modal-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>{children}</div></div>}
function Field({label,children,wide=false}){return <label className={`field ${wide?'field-wide':''}`}><span>{label}</span>{children}</label>}
function TransactionModal({initial,onClose,onSave,currency='EGP',accounts=[],goals=[],debts=[],recordDebtInstallment,gender='',onAddAccount,defaultAccountId='',session}){
 const initialType=initial?.type||'Expense';
 const [step,setStep]=useState(1);
 const [customCategoryInput,setCustomCategoryInput]=useState('');
 const [customSubcategoryInput,setCustomSubcategoryInput]=useState('');
 const [showCategoryInput,setShowCategoryInput]=useState(false);
 const [showSubcategoryInput,setShowSubcategoryInput]=useState(false);
 const [newCategoryIcon,setNewCategoryIcon]=useState('🛍️');
 const [newSubcategoryIcon,setNewSubcategoryIcon]=useState('✨');
 const [,refreshSubcategories]=useState(0);
 useEffect(()=>{const refresh=()=>refreshSubcategories(v=>v+1);window.addEventListener('pocket-subcategories-updated',refresh);return()=>window.removeEventListener('pocket-subcategories-updated',refresh)},[]);
 const [form,setForm]=useState({transaction_date:initial?.transaction_date||localISODate(),type:initialType,category:initial?.category||'Food & Groceries',subcategory:initial?.subcategory||getSubcategories(initialType,initial?.category||'Food & Groceries')[0],description:initial?.description||'',amount:initial?.amount??'',need_want:initial?.need_want||'Need',fixed_variable:initial?.fixed_variable||'Variable',account_id:initial?.account_id||accounts.find(a=>String(a.id)===String(defaultAccountId)&&!isGoalsAccount(a))?.id||accounts.find(a=>!isGoalsAccount(a))?.id||'',to_account_id:initial?.to_account_id||accounts.find(a=>String(a.id)!==String(initial?.account_id||defaultAccountId||accounts.find(x=>!isGoalsAccount(x))?.id))?.id||'',goal_id:initial?.goal_id||'',debt_id:initial?.debt_id||'',recurring:initial?.recurring||false,notes:initial?.notes||''});
 useEffect(()=>{if(!form.account_id&&accounts.length){setForm(f=>({...f,account_id:accounts.find(a=>String(a.id)===String(defaultAccountId)&&!isGoalsAccount(a))?.id||accounts.find(a=>!isGoalsAccount(a))?.id||accounts[0].id}))}},[accounts,defaultAccountId,form.account_id]);
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const availableCategories=getCategoriesForType(form.type,gender);
 const changeType=type=>{const category=type==='Income'?'Salary':type==='Transfer'?'Transfer':'Food & Groceries';setForm(f=>({...f,type,category,subcategory:getSubcategories(type,category)[0],recurring:type==='Transfer'?false:f.recurring,account_id:f.account_id||accounts.find(a=>!isGoalsAccount(a))?.id||'',to_account_id:f.to_account_id||accounts.find(a=>String(a.id)!==String(f.account_id||accounts.find(x=>!isGoalsAccount(x))?.id))?.id||''}))};
 const changeCategory=category=>setForm(f=>({...f,category,subcategory:getSubcategories(f.type,category)[0],debt_id:''}));
 const addTransactionCategory=async()=>{const value=customCategoryInput.trim();if(!value||availableCategories.some(c=>c.toLowerCase()===value.toLowerCase()))return;if(supabase&&session?.user?.id&&form.type==='Expense'){const {error}=await supabase.from('expense_categories').insert({user_id:session.user.id,name:value});if(error){alert(error.message||'Could not add category.');return;}}const next=[...new Set([...getExpenseCategories(gender),value])];setExpenseCategoriesOverride(next);try{localStorage.setItem('pocket_expense_categories',JSON.stringify(next));const icons=JSON.parse(localStorage.getItem('pocket_category_icons')||'{}');icons[value]=newCategoryIcon;localStorage.setItem('pocket_category_icons',JSON.stringify(icons));}catch{}setCustomCategoryInput('');setShowCategoryInput(false);setNewCategoryIcon('🛍️');changeCategory(value);};
 const addTransactionSubcategory=async()=>{const value=customSubcategoryInput.trim();if(!value||subcategories.some(x=>x.toLowerCase()===value.toLowerCase()))return;if(supabase&&session?.user?.id){const {error}=await supabase.from('expense_subcategories').insert({user_id:session.user.id,category_name:form.category,name:value});if(error){alert(error.message||'Could not add subcategory.');return;}}saveCustomSubcategories(form.category,[...subcategories,value]);try{const icons=JSON.parse(localStorage.getItem('pocket_subcategory_icons')||'{}');icons[`${form.category}::${value}`]=newSubcategoryIcon;localStorage.setItem('pocket_subcategory_icons',JSON.stringify(icons));}catch{}set('subcategory',value);setCustomSubcategoryInput('');setShowSubcategoryInput(false);setNewSubcategoryIcon('✨');};
 const subcategories=getSubcategories(form.type,form.category);
 const sourceAccount=accounts.find(a=>String(a.id)===String(form.account_id));
 const destinationAccount=accounts.find(a=>String(a.id)===String(form.to_account_id));
 const involvesGoals=form.type==='Transfer'&&(isGoalsAccount(sourceAccount)||isGoalsAccount(destinationAccount));
 useEffect(()=>{if(!involvesGoals&&form.goal_id)setForm(f=>({...f,goal_id:''}));},[involvesGoals,form.goal_id]);
 const validStep1=Number(form.amount)>0&&Boolean(form.transaction_date);
 const validStep2=form.type==='Transfer'?Boolean(form.to_account_id&&String(form.to_account_id)!==String(form.account_id)&&(!involvesGoals||Boolean(form.goal_id))):Boolean(form.category&&form.subcategory);
 const validStep3=Boolean(form.account_id)&&(form.type!=='Transfer'||Boolean(form.to_account_id&&String(form.to_account_id)!==String(form.account_id)&&(!involvesGoals||Boolean(form.goal_id))));
 const submit=()=>{if(!accounts.length)return;if(!validStep3)return;onSave(form)};
 const categoryIcon=name=>({'Housing':'house','Food & Groceries':'shopping-basket','Transportation':'car-front','Bills & Utilities':'receipt','Health':'heart-pulse','Shopping':'shopping-bag','Entertainment':'clapperboard','Education':'graduation-cap','Travel':'plane','Savings & Debt':'piggy-bank','Family & Giving':'gift','Beauty & Skincare':'sparkles','Hair & Nails':'scissors','Personal & Period Care':'heart','Fashion & Styling':'shirt','Grooming & Personal Care':'user-round','Fitness & Sports':'dumbbell','Style & Accessories':'shirt','Car & Gear':'car-front','Salary':'wallet','Freelance':'laptop','Business':'briefcase-business','Bonus':'gift','Investments':'chart-no-axes-combined','Other income':'circle-dollar-sign'})[name]||'shapes';
 return <ModalShell title={initial?'Edit transaction':'Add transaction'} subtitle="Add the essentials first. You can review everything before saving." onClose={onClose} wide>
  <div className="tx-wizard-progress"><div className="tx-wizard-steps">{[{n:1,label:'Details'},{n:2,label:form.type==='Transfer'?'Accounts':'Category'},{n:3,label:'Review'}].map(x=><div key={x.n} className={`tx-wizard-step ${step===x.n?'active':step>x.n?'complete':''}`}><span>{step>x.n?<Check size={14}/>:x.n}</span><b>{x.label}</b></div>)}</div><div className="tx-wizard-track"><span style={{width:`${step/3*100}%`}}/></div></div>
  <form onSubmit={e=>{e.preventDefault();if(step<3){setStep(s=>s+1);return;}submit()}}>
   {step===1&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>What are we recording?</h3><p>Choose a transaction type and enter the amount and date.</p></div><div className="tx-type-cards">{[{type:'Expense',title:'Expense',desc:'Money going out',icon:'arrow-up-right'},{type:'Income',title:'Income',desc:'Money coming in',icon:'arrow-down-left'},{type:'Transfer',title:'Transfer',desc:'Move between accounts',icon:'arrow-left-right'}].map(t=><button type="button" key={t.type} className={`tx-type-card ${form.type===t.type?'selected '+t.type.toLowerCase():''}`} onClick={()=>changeType(t.type)}><span className="tx-type-card-icon"><icon-placeholder>{t.type==='Expense'?<ArrowUpRight size={18}/>:t.type==='Income'?<ArrowDownRight size={18}/>:<ArrowLeftRight size={18}/>}</icon-placeholder></span><b>{t.title}</b><small>{t.desc}</small></button>)}</div><div className="form-grid tx-step-form"><Field label={`Amount (${currency})`}><input autoFocus required min="0.01" step="0.01" type="number" placeholder="0.00" value={form.amount} onChange={e=>set('amount',e.target.value)}/></Field><Field label="Date"><input required type="date" value={form.transaction_date} onChange={e=>set('transaction_date',e.target.value)}/></Field><Field label="Description" wide><input placeholder={form.type==='Transfer'?'e.g. Move savings to wallet':form.type==='Income'?'e.g. Monthly salary':'e.g. Weekly groceries'} value={form.description} onChange={e=>set('description',e.target.value)}/></Field></div><div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" disabled={!validStep1} onClick={()=>setStep(2)}>Continue <ArrowUpRight size={16}/></button></div></section>}
   {step===2&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>{form.type==='Transfer'?'Choose the accounts':'Choose a category'}</h3><p>{form.type==='Transfer'?'Select where the money comes from and where it goes.':'Tap a card to choose a category, then select a subcategory.'}</p></div>{form.type!=='Transfer'?<><div className="form-grid"><div className="field field-wide"><span>Account / wallet</span><select className="account-wallet-select" required value={form.account_id} onChange={e=>{if(e.target.value==='__add_account__'){onAddAccount();return;}set('account_id',e.target.value)}}><option value="">Choose account or wallet</option>{accounts.filter(a=>!isGoalsAccount(a)).map(a=><option key={a.id} value={a.id}>{a.name}{String(a.id)===String(defaultAccountId)?' · Default':''}</option>)}<option value="__add_account__">＋ Add account…</option></select><small className="field-help">This is where the income will be received or the expense will be paid from.</small></div></div><div className="tx-section-heading-with-action"><h4>Category</h4>{form.type==='Expense'&&<button type="button" className="btn btn-secondary btn-sm" onClick={e=>{e.preventDefault();e.stopPropagation();setShowCategoryInput(v=>!v)}}><Plus size={14}/> Add category</button>}</div>{form.type==='Expense'&&showCategoryInput&&<div className="category-create-wizard"><div className="category-create-head"><span className="category-create-symbol"><Sparkles size={18}/></span><div><strong>New category</strong><small>Give it a name and choose an icon.</small></div><button type="button" className="category-create-close" aria-label="Close" onClick={()=>setShowCategoryInput(false)}><X size={16}/></button></div><label className="category-create-label">Category name<input autoFocus value={customCategoryInput} onChange={e=>setCustomCategoryInput(e.target.value)} placeholder="e.g. Pets & Supplies" maxLength={50} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addTransactionCategory()}}}/></label><span className="category-create-label">Choose an icon</span><div className="category-icon-picker">{['🛍️','🏠','🍔','🚗','💡','🩺','🎓','✈️','🎮','🐾','🎁','💳','💪','✨','📱','💼'].map(icon=><button type="button" key={icon} className={newCategoryIcon===icon?'active':''} onClick={()=>setNewCategoryIcon(icon)}>{icon}</button>)}</div><div className="category-create-actions"><button type="button" className="btn btn-secondary btn-sm" onClick={()=>setShowCategoryInput(false)}>Cancel</button><button type="button" className="btn btn-primary btn-sm" disabled={!customCategoryInput.trim()} onClick={addTransactionCategory}><Check size={14}/> Create category</button></div></div>}<div className="tx-category-grid">{availableCategories.map(c=><button type="button" key={c} className={`tx-choice-card ${form.category===c?'selected':''}`} onClick={()=>changeCategory(c)}><span className="tx-choice-icon"><CategoryGlyph name={categoryIcon(c)}/></span><span className="tx-choice-label">{c}</span>{form.category===c&&<span className="tx-choice-check"><Check size={13}/></span>}</button>)}</div><div className="tx-subcategory-heading"><div><h4>Subcategory</h4></div><div className="tx-heading-actions">{form.type==='Expense'&&<button type="button" className="btn btn-secondary btn-sm" onClick={e=>{e.preventDefault();e.stopPropagation();setShowSubcategoryInput(v=>!v)}}><Plus size={14}/> Add subcategory</button>}</div></div>{form.type==='Expense'&&showSubcategoryInput&&<div className="category-create-wizard"><div className="category-create-head"><span className="category-create-symbol"><Sparkles size={18}/></span><div><strong>New subcategory</strong><small>Organize this category with a more specific label.</small></div><button type="button" className="category-create-close" aria-label="Close" onClick={()=>setShowSubcategoryInput(false)}><X size={16}/></button></div><label className="category-create-label">Subcategory name<input autoFocus value={customSubcategoryInput} onChange={e=>setCustomSubcategoryInput(e.target.value)} placeholder="e.g. Coffee shops" maxLength={50} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addTransactionSubcategory()}}}/></label><span className="category-create-label">Choose an icon</span><div className="category-icon-picker">{['✨','🛒','🍽️','☕','🚕','📦','🎟️','🧾','🐾','🎁','💊','📱','🏋️','✈️','🏡','💳'].map(icon=><button type="button" key={icon} className={newSubcategoryIcon===icon?'active':''} onClick={()=>setNewSubcategoryIcon(icon)}>{icon}</button>)}</div><div className="category-create-actions"><button type="button" className="btn btn-secondary btn-sm" onClick={()=>setShowSubcategoryInput(false)}>Cancel</button><button type="button" className="btn btn-primary btn-sm" disabled={!customSubcategoryInput.trim()} onClick={addTransactionSubcategory}><Check size={14}/> Create subcategory</button></div></div>}<div className="tx-subcategory-grid">{subcategories.map(sub=><button type="button" key={sub} className={`tx-subcategory-card ${form.subcategory===sub?'selected':''}`} onClick={()=>set('subcategory',sub)}>{sub}{form.subcategory===sub&&<Check size={14}/>}</button>)}</div></>:<div className="form-grid"><Field label="From account / wallet"><select className="account-wallet-select" required value={form.account_id} onChange={e=>setForm(f=>({...f,account_id:e.target.value,to_account_id:String(f.to_account_id)===String(e.target.value)?accounts.find(a=>String(a.id)!==String(e.target.value))?.id||'':f.to_account_id}))}><option value="">Select source</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="To account / wallet"><select className="account-wallet-select" required value={form.to_account_id} onChange={e=>set('to_account_id',e.target.value)}><option value="">Select destination</option>{accounts.filter(a=>String(a.id)!==String(form.account_id)).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><p className="field-help field-wide">Transfers update both account balances and are excluded from income and expense totals.</p>{involvesGoals&&<div className="goals-transfer-callout field-wide"><div className="goals-transfer-callout-icon"><Target size={18}/></div><div><b>{isGoalsAccount(destinationAccount)?'Choose where these savings are going':'Choose which goal you are withdrawing from'}</b><p>{isGoalsAccount(destinationAccount)?'This transfer will add to the selected goal.':'This transfer will reduce the selected goal balance.'}</p></div></div>}{involvesGoals&&<div className="field-wide goals-subcategory-picker"><div className="tx-subcategory-heading"><div><h4>Choose a goal</h4><p>Required · each goal is a subcategory of your Goals account</p></div><span>{goals.length} {goals.length===1?'goal':'goals'}</span></div>{goals.length?<div className="tx-subcategory-grid goals-subcategory-grid">{goals.map(g=><button type="button" key={g.id} className={`tx-subcategory-card ${String(form.goal_id)===String(g.id)?'selected':''}`} onClick={()=>set('goal_id',g.id)}><Target size={15}/>{g.name}{String(form.goal_id)===String(g.id)&&<Check size={14}/>}</button>)}</div>:<div className="goals-no-goals">You haven’t created any savings goals yet. Add a goal first, then come back to this transfer.</div>}<small className="field-help">{isGoalsAccount(destinationAccount)?'The transfer amount will be added to this goal.':'The transfer amount will be deducted from this goal.'}</small></div>}</div>}<div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(1)}><ChevronLeft size={16}/> Back</button><button type="button" className="btn btn-primary" disabled={!validStep2} onClick={()=>setStep(3)}>Continue <ArrowUpRight size={16}/></button></div></section>}
   {step===3&&<section className="tx-wizard-page"><div className="tx-wizard-intro"><h3>Review your transaction</h3><p>Make sure the details look right before saving.</p></div><div className="tx-review-card"><div className={`tx-review-icon ${form.type.toLowerCase()}`}>{form.type==='Income'?<ArrowDownRight size={22}/>:form.type==='Transfer'?<ArrowLeftRight size={22}/>:<ArrowUpRight size={22}/>}</div><div className="tx-review-main"><span>{form.type.toUpperCase()}</span><strong>{form.description||form.category||'Transaction'}</strong><small>{form.transaction_date}</small></div><strong className={`tx-review-amount ${form.type.toLowerCase()}`}>{form.type==='Income'?'+':form.type==='Transfer'?'↔':'−'}{new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:2}).format(Number(form.amount)||0)}</strong></div><div className="tx-review-details">{form.type!=='Transfer'&&<div><span>Account / wallet</span><b>{accounts.find(a=>String(a.id)===String(form.account_id))?.name||'Not selected'}</b></div>}{form.type!=='Transfer'&&<><div><span>Category</span><b>{form.category}</b></div><div><span>Subcategory</span><b>{form.subcategory}</b></div></>}{form.type==='Transfer'&&<><div><span>From account</span><b>{accounts.find(a=>String(a.id)===String(form.account_id))?.name||'Not selected'}</b></div><div><span>To account</span><b>{accounts.find(a=>String(a.id)===String(form.to_account_id))?.name||'Not selected'}</b></div>{involvesGoals&&<div><span>Savings goal</span><b>{goals.find(g=>String(g.id)===String(form.goal_id))?.name||'Not selected'}</b></div>}</>}{form.type==='Expense'&&<><div><span>Need or want</span><b>{form.need_want}</b></div><div><span>Fixed or variable</span><b>{form.fixed_variable}</b></div></>}<div className="tx-review-extra"><Field label="Notes"><input placeholder="Optional note" value={form.notes} onChange={e=>set('notes',e.target.value)}/></Field>{form.type==='Expense'&&<div className="tx-review-selects"><Field label="Need or want"><select value={form.need_want} onChange={e=>set('need_want',e.target.value)}><option>Need</option><option>Want</option></select></Field><Field label="Fixed or variable"><select value={form.fixed_variable} onChange={e=>set('fixed_variable',e.target.value)}><option>Variable</option><option>Fixed</option></select></Field></div>}{form.type!=='Transfer'&&<label className="checkbox-field"><input type="checkbox" checked={form.recurring} onChange={e=>set('recurring',e.target.checked)}/> This is a recurring transaction</label>}</div></div>{!accounts.length&&<div className="tx-wizard-warning tx-empty-account-callout"><span>Add an account or wallet to choose where this transaction will be recorded.</span><button type="button" className="btn btn-secondary btn-sm" onClick={onAddAccount}><Plus size={14}/> Add account</button></div>}<div className="tx-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setStep(2)}><ChevronLeft size={16}/> Back</button><button type="submit" className="btn btn-primary" disabled={!validStep3||!validStep1}><Check size={16}/>{initial?'Save changes':'Add transaction'}</button></div></section>}
  </form>
 </ModalShell>;
}
function CategoryGlyph({name}){const icons={'house':<Wallet size={17}/>, 'shopping-basket':<CircleDollarSign size={17}/>, 'car-front':<ArrowLeftRight size={17}/>, 'receipt':<FileSpreadsheet size={17}/>, 'heart-pulse':<CircleHelp size={17}/>, 'shopping-bag':<CreditCard size={17}/>, 'clapperboard':<Sparkles size={17}/>, 'graduation-cap':<Target size={17}/>, 'plane':<ArrowUpRight size={17}/>, 'piggy-bank':<PiggyBank size={17}/>, 'gift':<Sparkles size={17}/>, 'sparkles':<Sparkles size={17}/>, 'scissors':<Settings size={17}/>, 'heart':<CircleHelp size={17}/>, 'shirt':<UserRound size={17}/>, 'user-round':<UserRound size={17}/>, 'dumbbell':<Target size={17}/>, 'laptop':<FileJson size={17}/>, 'briefcase-business':<Wallet size={17}/>, 'chart-no-axes-combined':<ChartNoAxesCombined size={17}/>, 'circle-dollar-sign':<CircleDollarSign size={17}/>, 'shapes':<CircleHelp size={17}/>};return icons[name]||<CircleHelp size={17}/>}

function ImportModal({rows,onClose,onConfirm}){return <ModalShell title="Import transactions" subtitle="Review the first rows before importing them." onClose={onClose} wide><div className="import-summary"><FileSpreadsheet size={22}/><div><b>{rows.length} transactions ready</b><span>Imported records will be added to your ledger.</span></div></div><div className="table-wrap import-table"><table className="data-table"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>{rows.slice(0,8).map((r,i)=><tr key={i}><td>{r.transaction_date}</td><td>{r.type}</td><td>{r.category}</td><td>{r.description}</td><td>{fmt(r.amount)}</td></tr>)}</tbody></table></div>{rows.length>8&&<p className="small-muted">Showing first 8 rows of {rows.length}.</p>}<div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={onConfirm}><Upload size={16}/>Import {rows.length} rows</button></div></ModalShell>}
function AuthScreen(p){
 const {authMode,setAuthMode,authName,setAuthName,authGender,setAuthGender,authEmail,setAuthEmail,authPassword,setAuthPassword,authConfirmPassword,setAuthConfirmPassword,authMsg,setAuthMsg,busy,signIn,signInWithGoogle,signUp,resetPassword,updatePassword,resendConfirmation}=p;
 const isChoice=authMode==='choice', isSignup=authMode==='signup', isForgot=authMode==='forgot', isUpdatePassword=authMode==='update-password';
 const submit=isSignup?signUp:isForgot?resetPassword:isUpdatePassword?updatePassword:signIn;
 const closeAuth=()=>{setAuthMode('choice');setAuthMsg('')};
 return <main className="auth-page pocket-auth-page">
  <section className="auth-visual pocket-auth-visual">
   <div className="auth-brand pocket-brand"><div className="brand-mark"><img className="brand-logo-mark" src="/brand/pocket-mark.svg" alt="" /></div><span>Pocket</span></div>
   <div className="pocket-hero-orbit pocket-orbit-one"/><div className="pocket-hero-orbit pocket-orbit-two"/>
   <div className="auth-visual-copy pocket-visual-copy">
    <span className="eyebrow"><span className="pocket-live-dot"/> YOUR MONEY, IN FOCUS</span>
    <h1>Your money.<br/><em>Your way.</em></h1>
    <p>Plan with confidence, build better habits, and make room for what matters.</p>
    <div className="pocket-greeting-preview">
     <div className="pocket-greeting-avatar"><img src="/avatars/avatar-01.webp" alt="Pocket profile avatar"/></div>
     <div className="pocket-greeting-copy"><span className="auth-greeting-time">A little more clarity, every day</span><strong>Good things start<br/>with a plan.</strong><i aria-hidden="true"/><p>Your money, your pace. Your goals, in reach.</p></div>
     <span className="pocket-greeting-spark" aria-hidden="true">✦</span>
    </div>
   </div>
   <small className="auth-copyright">Pocket Finance · Make room for what matters.</small>
  </section>
  <section className="auth-panel pocket-auth-panel">
   {isChoice&&<div className="auth-choice-card pocket-auth-choice-card">
    <div className="auth-mobile-brand pocket-mobile-brand"><div className="brand-mark"><img className="brand-logo-mark" src="/brand/pocket-mark.svg" alt="" /></div><b>Pocket</b></div>
    <span className="pocket-form-kicker">A CALMER WAY TO MANAGE MONEY</span>
    <h2>Make room for<br/><em>what matters.</em></h2>
    <p className="auth-subtitle">One clear view of your money, goals, and everyday decisions.</p>
    <div className="auth-choice-actions">
     <button type="button" className="auth-choice-option auth-choice-primary" onClick={()=>{setAuthMode('signin');setAuthMsg('')}}><span className="auth-choice-icon"><LockKeyhole size={19}/></span><span><b>Sign in</b><small>Welcome back to your Pocket</small></span><ArrowUpRight size={18}/></button>
     <button type="button" className="auth-choice-option" onClick={()=>{setAuthMode('signup');setAuthMsg('')}}><span className="auth-choice-icon"><Sparkles size={19}/></span><span><b>Create account</b><small>Start building better money habits</small></span><ArrowUpRight size={18}/></button>
    </div>
    <div className="pocket-form-divider"><span/><small>YOUR MONEY, YOUR PACE</small><span/></div>
    <button type="button" className="pocket-google-button auth-choice-google" onClick={signInWithGoogle} disabled={busy}><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.95 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Continue with Google</span></button>
    {authMsg&&<p className="auth-message auth-message-error" role="status">{authMsg}</p>}
    <p className="auth-privacy pocket-privacy"><LockKeyhole size={12}/> Secure sign-in keeps your financial workspace private.</p>
   </div>}
   {!isChoice&&<div className="auth-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!isUpdatePassword)closeAuth()}}>
    <div className="auth-card pocket-auth-card auth-popup-card" role="dialog" aria-modal="true" aria-labelledby="auth-popup-title">
     {!isUpdatePassword&&<button type="button" className="auth-popup-close" onClick={closeAuth} aria-label="Close sign in form"><X size={18}/></button>}
     <div className="auth-mobile-brand pocket-mobile-brand"><div className="brand-mark"><img className="brand-logo-mark" src="/brand/pocket-mark.svg" alt="" /></div><b>Pocket</b></div>
     <div className="pocket-form-kicker">{isSignup?'A BETTER MONEY HABIT STARTS HERE':isForgot?'GET BACK INTO YOUR ACCOUNT':isUpdatePassword?'SECURE YOUR ACCOUNT':'YOUR FINANCIAL SPACE'}</div>
     <h2 id="auth-popup-title">{isSignup?'Create your Pocket':isForgot?'Reset your password':isUpdatePassword?'Choose a new password':'Welcome back.'}</h2>
     <p className="auth-subtitle">{isSignup?'A clearer view of your money starts with one small step.':isForgot?'We’ll send you a secure link to reset your password.':isUpdatePassword?'Choose a strong password you have not used before.':'Sign in to pick up where you left off.'}</p>
     <form className="auth-form auth-main-form pocket-main-form" onSubmit={submit}>
      {isSignup&&<><label className="auth-field"><span>Full name</span><input autoComplete="name" required value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="What should we call you?"/></label><fieldset className="auth-gender-field"><legend>Gender</legend><div className="auth-gender-options">{[{value:'female',label:'Female',symbol:'♀'},{value:'male',label:'Male',symbol:'♂'},{value:'prefer_not_to_say',label:'Prefer not to say',symbol:'—'}].map(g=><button key={g.value} type="button" className={`auth-gender-option ${authGender===g.value?'selected':''}`} aria-pressed={authGender===g.value} onClick={()=>setAuthGender(g.value)}><span>{g.symbol}</span><b>{g.label}</b>{authGender===g.value&&<Check size={14}/>}</button>)}</div><small className="field-help">Used to personalize suggested transaction categories. You can change it later in Account &amp; Profile.</small></fieldset></>}
      {!isUpdatePassword&&<label className="auth-field"><span>{authMode==='signin'?'Email or username':'Email address'}</span><input type={authMode==='signin'?'text':'email'} autoComplete={authMode==='signin'?'username':'email'} required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label>}
      {!isForgot&&<label className="auth-field"><span>{isUpdatePassword?'New password':'Password'}</span><input type="password" autoComplete={isSignup||isUpdatePassword?'new-password':'current-password'} minLength={isSignup||isUpdatePassword?8:1} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder={isSignup||isUpdatePassword?'At least 8 characters':'Enter your password'}/></label>}
      {isUpdatePassword&&<label className="auth-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} required value={authConfirmPassword} onChange={e=>setAuthConfirmPassword(e.target.value)} placeholder="Enter the new password again"/></label>}
      {!isSignup&&!isForgot&&!isUpdatePassword&&<button type="button" className="auth-text-link forgot-link" onClick={()=>{setAuthMode('forgot');setAuthMsg('')}}>Forgot password?</button>}
      <button className="btn btn-primary auth-submit pocket-auth-submit" type="submit" disabled={busy}>{busy?<LoaderCircle size={17} className="spin"/>:null}{busy?'Please wait…':isSignup?'Create account':isForgot?'Send reset link':isUpdatePassword?'Update password':'Sign in'}<span aria-hidden="true">↗</span></button>
      {!isForgot&&!isUpdatePassword&&<><div className="pocket-form-divider pocket-google-divider"><span/><small>OR CONTINUE WITH</small><span/></div><button type="button" className="pocket-google-button" onClick={signInWithGoogle} disabled={busy}><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.95 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Continue with Google</span></button></>}
      {authMsg&&<p className={`auth-message ${/check your email|link has been sent|created successfully|confirmation email has been sent/i.test(authMsg)?'auth-message-success':'auth-message-error'}`} role="status">{authMsg}</p>}
      {!isSignup&&!isForgot&&!isUpdatePassword&&/not confirmed|confirmation email|confirm your email/i.test(authMsg)&&<button type="button" className="auth-text-link pocket-resend" onClick={resendConfirmation} disabled={busy}>{busy?'Sending…':'Resend confirmation email'}</button>}
     </form>
     <div className="pocket-form-divider"><span/><small>YOUR MONEY, YOUR PACE</small><span/></div>
     {!isUpdatePassword&&<div className="auth-switch pocket-auth-switch">{isForgot?<>Remembered your password? <button type="button" onClick={()=>{setAuthMode('signin');setAuthMsg('')}}>Back to sign in</button></>:isSignup?<>Already have a Pocket account? <button type="button" onClick={()=>{setAuthMode('signin');setAuthMsg('')}}>Sign in</button></>:<>New to Pocket? <button type="button" onClick={()=>{setAuthMode('signup');setAuthMsg('')}}>Create an account</button></>}</div>}
     <p className="auth-privacy pocket-privacy"><LockKeyhole size={12}/> Your account and financial data are protected with secure authentication and database access controls.</p>
    </div>
   </div>}
  </section>
 </main>;
}
function AccountProfileModal(p){
 const {onClose,openAvatarPicker,session,saveProfile,profileSaving,profileName,gender='prefer_not_to_say',currency,timezone,profileAvatar}=p;
 const [name,setName]=useState(profileName||'');const [userGender,setUserGender]=useState(['female','male','prefer_not_to_say'].includes(String(gender).toLowerCase())?String(gender).toLowerCase():'prefer_not_to_say');const [curr,setCurr]=useState(currency);const [zone,setZone]=useState(timezone);
 const genderOptions=[{value:'female',label:'Female',detail:'Personalized suggestions'},{value:'male',label:'Male',detail:'Personalized suggestions'},{value:'prefer_not_to_say',label:'Prefer not to say',detail:'Keep suggestions general'}];
 return <ModalShell title="Account & profile" subtitle="Manage your identity and regional preferences in one place." onClose={onClose} wide><form className="auth-form profile-settings-form" onSubmit={e=>{e.preventDefault();saveProfile({full_name:name,gender:userGender,currency:curr,timezone:zone,avatar:profileAvatar})}}>
   <section className="profile-settings-card profile-personal-card"><div className="profile-section-heading"><span className="profile-section-icon"><UserRound size={17}/></span><div><h3>Personal details</h3><p>How you appear across Pocket.</p></div></div>
    <div className="profile-identity-strip"><span className="profile-avatar-preview"><ProfileAvatar value={profileAvatar}/></span><div className="profile-avatar-current-copy"><b>{name.trim()||'Your profile'}</b><small>{session?.user?.email||'Your personal Pocket workspace'}</small><span className="profile-avatar-caption">Profile picture</span></div><button type="button" className="btn btn-secondary btn-sm" onClick={()=>openAvatarPicker(userGender)}>Change picture</button></div>
    <div className="profile-fields-row"><Field label="Display name"><input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name"/></Field><div className="field profile-gender-field"><span>Gender</span><div className="profile-gender-options" role="group" aria-label="Gender">{genderOptions.map(option=><button key={option.value} type="button" className={`profile-gender-option ${userGender===option.value?'selected':''}`} aria-pressed={userGender===option.value} onClick={()=>setUserGender(option.value)}><span className="profile-gender-check">{userGender===option.value?<Check size={13}/>:null}</span><b>{option.label}</b></button>)}</div></div></div>
    <p className="small-muted profile-gender-note">Gender is used to personalize suggested expense categories. You can still choose any category.</p>
   </section>
   <section className="profile-settings-card"><div className="profile-section-heading"><span className="profile-section-icon"><SlidersHorizontal size={17}/></span><div><h3>Regional preferences</h3><p>Set the currency and time zone used by Pocket.</p></div></div><div className="profile-fields-row"><Field label="Currency"><select value={curr} onChange={e=>setCurr(e.target.value)}>{['EGP','USD','EUR','GBP','SAR','AED','CAD','AUD'].map(c=><option key={c} value={c}>{c} — {({EGP:'Egyptian Pound',USD:'US Dollar',EUR:'Euro',GBP:'British Pound',SAR:'Saudi Riyal',AED:'UAE Dirham',CAD:'Canadian Dollar',AUD:'Australian Dollar'})[c]}</option>)}</select></Field><Field label="Time zone"><select value={zone} onChange={e=>setZone(e.target.value)}>{Array.from(new Set([zone,'Africa/Cairo','UTC',...zones])).map(z=><option key={z} value={z}>{z}</option>)}</select></Field></div></section>
   <div className="profile-settings-footer"><span className="small-muted"><LockKeyhole size={13}/> Your profile details are kept with your account.</span><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" disabled={profileSaving}>{profileSaving?<><LoaderCircle size={15} className="spin"/> Saving…</>:'Save changes'}</button></div></div>
  </form></ModalShell>
}
function AvatarPickerModal({current,onClose,onChoose,gender='prefer_not_to_say'}){
 const options=avatarsForGender(gender);
 const label=gender==='female'?'Female avatars':gender==='male'?'Male avatars':'All avatars';
 return <ModalShell title="Change profile picture" subtitle={`Choose from ${label.toLowerCase()} to use across Pocket.`} onClose={onClose} wide><div className="avatar-picker-gender-label">{label}<span>{options.length} pictures</span></div><div className="avatar-picker-popup-grid">{options.map((avatar,i)=><button type="button" key={avatar.id} className={`avatar-picker-popup-card ${current===avatar.id?'selected':''}`} onClick={()=>onChoose(avatar.id)} aria-label={`Choose ${gender} profile picture ${i+1}`}><img src={avatar.src} alt={`${avatar.gender} profile picture ${i+1}`} loading="lazy"/><span>{current===avatar.id?<><Check size={14}/> Selected</>:'Choose picture'}</span></button>)}</div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button></div></ModalShell>
}

function ExpenseCategoriesPage({session,supabase}){
 // Supabase expense_categories / expense_subcategories are canonical; mirror them to localStorage for the transaction wizard cache.
 const normalizeCategory=value=>String(value||'').trim().toLocaleLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim();
 const [cats,setCats]=useState([]),[subs,setSubs]=useState({}),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [wizard,setWizard]=useState(null),[name,setName]=useState(''),[icon,setIcon]=useState('🧾'),[edit,setEdit]=useState(''),[editName,setEditName]=useState(''),[editSubs,setEditSubs]=useState(''),[deleteGroup,setDeleteGroup]=useState(null),[deleteSubConfirm,setDeleteSubConfirm]=useState(null),[deleteCategoryConfirm,setDeleteCategoryConfirm]=useState(null);
 const icons=['🧾','🏠','🍔','🚗','💡','🛍️','🎓','🎮','✈️','💊','👨‍👩‍👧','💰','✨','🏋️','🎁','📱'];
 const reload=async()=>{if(!supabase||!session?.user?.id){setCats(defaultExpenseCategories.map(name=>({name,is_enabled:true})));setSubs(Object.fromEntries(Object.entries(categoryHierarchy).map(([k,v])=>[k,[...v]])));setLoading(false);return;}setLoading(true);setError('');try{const uid=session.user.id;let [c,q,markerResult]=await Promise.all([supabase.from('expense_categories').select('id,name,is_enabled').eq('user_id',uid).order('name'),supabase.from('expense_subcategories').select('category_name,name').eq('user_id',uid).order('name'),supabase.from('user_settings').select('settings').eq('user_id',uid).maybeSingle()]);if(c.error)throw c.error;if(q.error)throw q.error;if(markerResult.error)throw markerResult.error;let cloudSettings=markerResult.data?.settings&&typeof markerResult.data.settings==='object'?markerResult.data.settings:{};
 // Seed defaults into this user's rows only once. After the marker is saved, user edits/deletions remain permanent.
 if(!(c.data||[]).length){const categoryRows=defaultExpenseCategories.map(name=>({user_id:uid,name,is_enabled:true}));const {error:seedCategoriesError}=await supabase.from('expense_categories').insert(categoryRows);if(seedCategoriesError&&!/duplicate key|unique constraint/i.test(seedCategoriesError.message||''))throw seedCategoriesError;c=await supabase.from('expense_categories').select('id,name,is_enabled').eq('user_id',uid).order('name');if(c.error)throw c.error;}
 if(cloudSettings.defaultCategoriesSeeded!==true){const existingSubs=q.data||[];const subRows=Object.entries(categoryHierarchy).flatMap(([category,items])=>items.filter(name=>!existingSubs.some(row=>normalizeCategory(row.category_name)===normalizeCategory(category)&&normalizeCategory(row.name)===normalizeCategory(name))).map(name=>({user_id:uid,category_name:category,name})));if(subRows.length){const {error:seedSubsError}=await supabase.from('expense_subcategories').insert(subRows);if(seedSubsError&&!/duplicate key|unique constraint/i.test(seedSubsError.message||''))throw seedSubsError;}cloudSettings={...cloudSettings,defaultCategoriesSeeded:true};const {error:markerError}=await supabase.from('user_settings').upsert({user_id:uid,settings:cloudSettings,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(markerError)throw markerError;q=await supabase.from('expense_subcategories').select('category_name,name').eq('user_id',uid).order('name');if(q.error)throw q.error;}
 const rows=(c.data||[]).map(row=>({...row,is_default:defaultExpenseCategories.some(name=>normalizeCategory(name)===normalizeCategory(row.name))}));setCats(rows);const g={};(q.data||[]).forEach(row=>{const parent=String(row.category_name||'').trim(),sub=String(row.name||'').trim();if(!parent||!sub)return;const matching=rows.find(cat=>normalizeCategory(cat.name)===normalizeCategory(parent));const key=matching?.name||parent;(g[key]??=[]);if(!g[key].some(item=>normalizeCategory(item)===normalizeCategory(sub)))g[key].push(sub)});Object.keys(g).forEach(k=>g[k]=[...new Map(g[k].filter(Boolean).map(x=>[normalizeCategory(x),x])).values()]);setSubs(g);const enabledNames=rows.filter(x=>x.is_enabled!==false).map(x=>x.name);setExpenseCategoriesOverride(enabledNames);try{localStorage.setItem('pocket_expense_categories',JSON.stringify(enabledNames));localStorage.setItem('pocket_subcategories',JSON.stringify(g));window.dispatchEvent(new Event('pocket-subcategories-updated'))}catch{}}catch(e){setError(e?.message||'Could not load categories.')}finally{setLoading(false)}};
 useEffect(()=>{reload()},[session?.user?.id]);
 const submit=async e=>{e.preventDefault();const v=name.trim();if(!v)return;if(!supabase||!session?.user?.id){setError('Sign in to save categories.');return}setBusy(true);setError('');try{if(wizard.type==='category'&&cats.some(c=>String(c.name||'').trim().toLocaleLowerCase()===v.toLocaleLowerCase())){setError(`“${v}” already exists in your expense categories. Choose a different name or edit the existing category.`);setBusy(false);return}if(wizard.type==='subcategory'&&(subs[wizard.category]||[]).some(x=>String(x).trim().toLocaleLowerCase()===v.toLocaleLowerCase())){setError(`“${v}” already exists under ${wizard.category}. Choose a different name.`);setBusy(false);return}const result=wizard.type==='category'?await supabase.from('expense_categories').insert({user_id:session.user.id,name:v,is_enabled:true}):await supabase.from('expense_subcategories').insert({user_id:session.user.id,category_name:wizard.category,name:v});if(result.error){const msg=String(result.error.message||'');if(result.error.code==='23505'||/duplicate key|unique constraint/i.test(msg))setError(`“${v}” already exists. Please use a different name.`);else setError(msg||'Could not save this item. Please try again.')}else{setWizard(null);setName('');setIcon('🧾');await reload()}}catch(err){const msg=String(err?.message||'');setError(/duplicate key|unique constraint/i.test(msg)?`“${v}” already exists. Please use a different name.`:(msg||'Could not save this item. Please try again.'))}finally{setBusy(false)}};
 const deleteCat=async cat=>setDeleteCategoryConfirm({name:cat});
 const deleteSub=async(cat,sub)=>setDeleteSubConfirm({category:cat,name:sub});
 const saveEdit=async cat=>{const v=editName.trim();if(!v)return;setBusy(true);const {error:e}=await supabase.from('expense_categories').update({name:v}).eq('user_id',session.user.id).eq('name',cat);if(e){setError(e.message);setBusy(false);return}if(v!==cat){const {error:se}=await supabase.from('expense_subcategories').update({category_name:v}).eq('user_id',session.user.id).eq('category_name',cat);if(se)setError(se.message)}const values=[...new Set(editSubs.split(',').map(x=>x.trim()).filter(Boolean))];const {error:de}=await supabase.from('expense_subcategories').delete().eq('user_id',session.user.id).eq('category_name',v);if(!de&&values.length){const {error:ie}=await supabase.from('expense_subcategories').insert(values.map(name=>({user_id:session.user.id,category_name:v,name})));if(ie)setError(ie.message)}else if(de)setError(de.message);setEdit('');await reload();setBusy(false)};
 return <div className="category-admin-page"><div className="category-admin-heading"><div><div className="eyebrow">ADMINISTRATION</div><h1>Expense categories</h1><p>Manage expense categories and subcategories across Pocket.</p></div><button className="btn btn-primary" onClick={()=>{setWizard({type:'category'});setName('');setError('')}}><Plus size={16}/> Add category</button></div>{error&&<div className="workspace-error" role="alert">{error}</div>}<div className="category-admin-summary"><span><b>{cats.length}</b> categories</span><span><b>{Object.values(subs).reduce((n,a)=>n+a.length,0)}</b> subcategories</span></div>{loading?<div className="panel category-admin-empty">Loading categories…</div>:<div className="category-admin-list">{cats.map((c,i)=>{const cat=c.name,matchedKey=Object.keys(subs).find(key=>normalizeCategory(key)===normalizeCategory(cat)),children=matchedKey?subs[matchedKey]:[];return <section className="category-admin-card" key={cat}><div className="category-admin-card-head"><label className="category-enabled"><input type="checkbox" checked={c.is_enabled!==false} disabled={busy} onChange={async e=>{const enabled=e.target.checked;const {error:er}=await supabase.from('expense_categories').upsert({user_id:session.user.id,name:cat,is_enabled:enabled},{onConflict:'user_id,name',ignoreDuplicates:false});if(er)setError(er.message);else{const nextCats=cats.map(item=>item.name===cat?{...item,is_enabled:enabled}:item);setCats(nextCats);const active=nextCats.filter(item=>item.is_enabled!==false).map(item=>item.name);setExpenseCategoriesOverride(active);try{localStorage.setItem('pocket_expense_categories',JSON.stringify(active))}catch{}await reload()}}}/><span className="category-icon-tile">{icons[i%icons.length]}</span><span className="category-name-copy"><b>{cat}</b><small>{children.length} subcategor{children.length===1?'y':'ies'}</small></span></label><div className="category-admin-actions"><button className="icon-btn" title="Add subcategory" onClick={()=>{setWizard({type:'subcategory',category:cat});setName('')}}><Plus size={15}/></button><button className="icon-btn" title="Edit" onClick={()=>{setEdit(cat);setEditName(cat);setEditSubs(children.join(', '))}}><Pencil size={15}/></button><button className="icon-btn danger-hover" title="Delete" onClick={()=>deleteCat(cat)}><Trash2 size={15}/></button></div></div>{edit===cat?<div className="category-admin-edit"><label>Category name<input value={editName} onChange={e=>setEditName(e.target.value)}/></label><label>Subcategories <small>Separate names with commas</small><textarea rows={3} value={editSubs} onChange={e=>setEditSubs(e.target.value)}/></label><div className="category-admin-edit-actions"><button className="btn btn-primary btn-sm" disabled={busy} onClick={()=>saveEdit(cat)}>Save changes</button><button className="btn btn-secondary btn-sm" onClick={()=>setEdit('')}>Cancel</button></div></div>:<div className="subcategory-chip-list">{children.map(sub=><span className="subcategory-chip" key={sub}>{sub}<button title="Delete subcategory" disabled={busy} onClick={()=>deleteSub(cat,sub)}><X size={12}/></button></span>)}{!children.length&&<span className="category-no-subcategories">No subcategories yet</span>}</div>}</section>})}{Object.entries(subs).filter(([parent,items])=>!cats.some(c=>normalizeCategory(c.name)===normalizeCategory(parent))&&items.length>0).map(([parent,items])=><section className="category-admin-card category-orphan-subcategories" key={'unlinked-'+parent}><div className="category-admin-card-head"><span className="category-name-copy"><b>{parent}</b><small>{items.length} saved subcategor{items.length===1?'y':'ies'} · category name needs matching</small></span></div><div className="subcategory-chip-list">{items.map(sub=><span className="subcategory-chip" key={sub}>{sub}<button title={`Delete saved subcategory ${sub}`} disabled={busy} onClick={()=>deleteSub(parent,sub)}><Trash2 size={12}/></button></span>)}</div><div className="category-admin-edit-actions"><button className="btn btn-secondary btn-sm" disabled={busy} onClick={()=>setDeleteGroup({parent,items:[...items]})}><Trash2 size={13}/> Delete group</button></div></section>)}</div>}{wizard&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setWizard(null)}}><section className="modal-shell category-wizard-card" role="dialog" aria-modal="true"><div className="modal-header"><div><h2>{wizard.type==='category'?'Create category':'Add subcategory'}</h2><p>{wizard.type==='category'?'Choose a name and icon for your category.':`Add a subcategory under ${wizard.category}.`}</p></div><button className="icon-btn" onClick={()=>setWizard(null)}><X size={18}/></button></div><form onSubmit={submit}>{error&&<div className="category-wizard-error" role="alert">{error}</div>}<label className="category-wizard-field"><span>{wizard.type==='category'?'Category name':'Subcategory name'}</span><input autoFocus value={name} onChange={e=>setName(e.target.value)} maxLength={50} placeholder={wizard.type==='category'?'e.g. Home & Living':'e.g. Rent'}/></label>{wizard.type==='category'&&<label className="category-wizard-field"><span>Icon</span><select value={icon} onChange={e=>setIcon(e.target.value)}>{icons.map(x=><option key={x}>{x}</option>)}</select></label>}<div className="category-wizard-actions"><button type="button" className="btn btn-secondary" onClick={()=>setWizard(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy||!name.trim()}>{busy?<LoaderCircle size={15}/>:<Plus size={15}/>} {wizard.type==='category'?'Create category':'Add subcategory'}</button></div></form></section></div>}{deleteGroup&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setDeleteGroup(null)}}><section className="modal-shell category-wizard-card category-delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-group-title"><div className="modal-header"><div><h2 id="delete-group-title">Delete saved subcategories?</h2><p>This will permanently delete {deleteGroup.items.length} subcategor{deleteGroup.items.length===1?'y':'ies'} under <b>{deleteGroup.parent}</b> from your account.</p></div><button className="icon-btn" disabled={busy} onClick={()=>setDeleteGroup(null)}><X size={18}/></button></div><div className="category-delete-list">{deleteGroup.items.map(item=><span key={item}>{item}</span>)}</div>{error&&<div className="workspace-error" role="alert">{error}</div>}<div className="category-wizard-actions"><button className="btn btn-secondary" disabled={busy} onClick={()=>setDeleteGroup(null)}>Cancel</button><button className="btn btn-danger" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const {error:deleteError}=await supabase.from('expense_subcategories').delete().eq('user_id',session.user.id).eq('category_name',deleteGroup.parent);if(deleteError)throw deleteError;const {data:remaining,error:verifyError}=await supabase.from('expense_subcategories').select('name').eq('user_id',session.user.id).eq('category_name',deleteGroup.parent);if(verifyError)throw verifyError;if(remaining?.length)throw new Error('Some subcategories remain. Check the Supabase delete policy.');try{const saved=JSON.parse(localStorage.getItem('pocket_subcategories')||'{}');delete saved[deleteGroup.parent];localStorage.setItem('pocket_subcategories',JSON.stringify(saved))}catch{}setDeleteGroup(null);await reload()}catch(e){setError(e?.message||'Could not delete this group.')}finally{setBusy(false)}}}>{busy?<LoaderCircle size={15}/>:<Trash2 size={15}/>} Delete group</button></div></section></div>}{deleteCategoryConfirm&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setDeleteCategoryConfirm(null)}}><section className="modal-shell category-wizard-card category-delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-category-title"><div className="modal-header"><div><h2 id="delete-category-title">Delete category?</h2><p>Remove <b>{deleteCategoryConfirm.name}</b>? Existing transactions will keep their saved category name. This change will be saved to your Pocket account.</p></div><button className="icon-btn" disabled={busy} onClick={()=>setDeleteCategoryConfirm(null)}><X size={18}/></button></div>{error&&<div className="workspace-error" role="alert">{error}</div>}<div className="category-wizard-actions"><button className="btn btn-secondary" disabled={busy} onClick={()=>setDeleteCategoryConfirm(null)}>Cancel</button><button className="btn btn-danger" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const {error:deleteError}=await supabase.from('expense_categories').delete().eq('user_id',session.user.id).eq('name',deleteCategoryConfirm.name);if(deleteError)throw deleteError;const {data:remaining,error:verifyError}=await supabase.from('expense_categories').select('id').eq('user_id',session.user.id).eq('name',deleteCategoryConfirm.name);if(verifyError)throw verifyError;if(remaining?.length)throw new Error('The category was not deleted. Check the Supabase delete policy.');setDeleteCategoryConfirm(null);await reload()}catch(e){setError(e?.message||'Could not delete this category.')}finally{setBusy(false)}}}>{busy?<LoaderCircle size={15}/>:<Trash2 size={15}/>} Delete category</button></div></section></div>}{deleteSubConfirm&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setDeleteSubConfirm(null)}}><section className="modal-shell category-wizard-card category-delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-sub-title"><div className="modal-header"><div><h2 id="delete-sub-title">Delete subcategory?</h2><p>Remove <b>{deleteSubConfirm.name}</b> from <b>{deleteSubConfirm.category}</b>? This change will be saved to your Pocket account.</p></div><button className="icon-btn" disabled={busy} onClick={()=>setDeleteSubConfirm(null)}><X size={18}/></button></div><div className="category-wizard-actions"><button className="btn btn-secondary" disabled={busy} onClick={()=>setDeleteSubConfirm(null)}>Cancel</button><button className="btn btn-danger" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const {error:deleteError}=await supabase.from('expense_subcategories').delete().eq('user_id',session.user.id).eq('category_name',deleteSubConfirm.category).eq('name',deleteSubConfirm.name);if(deleteError)throw deleteError;const {data:remaining,error:verifyError}=await supabase.from('expense_subcategories').select('name').eq('user_id',session.user.id).eq('category_name',deleteSubConfirm.category).eq('name',deleteSubConfirm.name);if(verifyError)throw verifyError;if(remaining?.length)throw new Error('The subcategory was not deleted. Check the Supabase delete policy.');try{const saved=JSON.parse(localStorage.getItem('pocket_subcategories')||'{}');if(Array.isArray(saved[deleteSubConfirm.category]))saved[deleteSubConfirm.category]=saved[deleteSubConfirm.category].filter(x=>String(x).toLowerCase()!==deleteSubConfirm.name.toLowerCase());localStorage.setItem('pocket_subcategories',JSON.stringify(saved))}catch{}setDeleteSubConfirm(null);await reload()}catch(e){setError(e?.message||'Could not delete this subcategory.')}finally{setBusy(false)}}}>{busy?<LoaderCircle size={15}/>:<Trash2 size={15}/>} Delete subcategory</button></div></section></div>}</div>
}

function SettingsModal(p){
 const {onClose,design,setDesign,sidebarSize,setSidebarSize,isAdmin,backupForUsers,setBackupVisibility,exportCSV,exportBackup,handleImport,restoreBackup,session,supabase,onOpenProfile}=p;
 const [prefs,setPrefs]=useState(()=>{try{return {...{budgetAlerts:true,debtAlerts:true,recurringAlerts:true,firstPage:'Overview',dateFormat:'DD/MM/YYYY',financialMonth:'1'},...JSON.parse(localStorage.getItem('pocket_settings_prefs')||'{}')}}catch{return {budgetAlerts:true,debtAlerts:true,recurringAlerts:true,firstPage:'Overview',dateFormat:'DD/MM/YYYY',financialMonth:'1'}}});
 const [open,setOpen]=useState('Profile & Account');
 const [expenseCats,setExpenseCats]=useState(()=>getExpenseCategories('').map(name=>({name,is_enabled:true})));
 const [categoryBusy,setCategoryBusy]=useState(false),[deleteExpenseCatConfirm,setDeleteExpenseCatConfirm]=useState(null);
 const [categoryError,setCategoryError]=useState('');
 useEffect(()=>{let alive=true;(async()=>{if(!supabase||!session?.user?.id){setExpenseCats(getExpenseCategories('').map(name=>({name,is_enabled:true})));return;}setCategoryBusy(true);const {data,error}=await supabase.from('expense_categories').select('id,name,is_enabled').eq('user_id',session.user.id).order('name');if(!alive)return;if(error){setCategoryError('Could not load categories from Supabase. Run the included SQL migration, then try again.');setExpenseCats(getExpenseCategories('').map(name=>({name,is_enabled:true})));}else if(data?.length){setExpenseCats(data.map(x=>({name:x.name,is_enabled:x.is_enabled!==false})));setExpenseCategoriesOverride(data.filter(x=>x.is_enabled!==false).map(x=>x.name));}else{setExpenseCats(defaultExpenseCategories.map(name=>({name,is_enabled:true})));setCategoryError('No saved categories yet. Add your current categories to Supabase using the included migration/setup SQL.');}setCategoryBusy(false)})();return()=>{alive=false}},[session?.user?.id]);
 const [newExpenseCat,setNewExpenseCat]=useState('');
 const [editingExpenseCat,setEditingExpenseCat]=useState('');
 const [editingExpenseValue,setEditingExpenseValue]=useState('');
 const [expandedSubcategoryCategory,setExpandedSubcategoryCategory]=useState('');
 const [editingSubcategoryText,setEditingSubcategoryText]=useState('');
 const saveExpenseCats=async(next,operation={})=>{const clean=[...new Set(next.map(x=>String(typeof x==='string'?x:x.name).trim()).filter(Boolean))];setCategoryError('');if(!supabase||!session?.user?.id){setCategoryError('Please sign in to save categories to Supabase.');return false;}setCategoryBusy(true);try{if(operation.deleteName){const {error}=await supabase.from('expense_categories').delete().eq('user_id',session.user.id).eq('name',operation.deleteName);if(error)throw error;}if(operation.rename){const {error}=await supabase.from('expense_categories').update({name:operation.rename.to}).eq('user_id',session.user.id).eq('name',operation.rename.from);if(error)throw error;}if(operation.addName){const {error}=await supabase.from('expense_categories').insert({user_id:session.user.id,name:operation.addName});if(error)throw error;}const {data:latest}=await supabase.from('expense_categories').select('name,is_enabled').eq('user_id',session.user.id).order('name');const rows=latest?.length?latest.map(x=>({name:x.name,is_enabled:x.is_enabled!==false})):clean.map(name=>({name,is_enabled:true}));setExpenseCats(rows);setExpenseCategoriesOverride(rows.filter(x=>x.is_enabled).map(x=>x.name));return true;}catch(e){setCategoryError(e?.message||'Could not save categories to Supabase.');return false;}finally{setCategoryBusy(false)}};
 const update=(key,value)=>setPrefs(old=>{const next={...old,[key]:value};localStorage.setItem('pocket_settings_prefs',JSON.stringify(next));return next});
 const sections=[
  {title:'Profile & Account',desc:'Personal details, currency and regional preferences.',icon:<UserRound size={18}/>,body:<><p className="small-muted">Update your name, profile picture, currency and time zone.</p><button className="btn btn-secondary" onClick={onOpenProfile}><UserRound size={15}/>Manage account & profile</button><p className="small-muted" style={{marginTop:10}}>Signed in as {session?.user?.email||'Local demo workspace'}</p></>},
  {title:'Notification Preferences',desc:'Choose which financial reminders appear in Pocket.',icon:<BellRing size={18}/>,body:<div className="settings-preference-list">{[['budgetAlerts','Budget limit alerts','Notify me when a budget reaches 90%.'],['debtAlerts','Debt reminders','Show upcoming and overdue installment reminders.'],['recurringAlerts','Recurring payments','Show reminders for upcoming recurring payments.']].map(([key,label,help])=><label className="setting-toggle" key={key}><span><b>{label}</b><small>{help}</small></span><input type="checkbox" checked={!!prefs[key]} onChange={e=>update(key,e.target.checked)}/></label>)}</div>},
  {title:'Security & Privacy',desc:'Review your account access and protect your financial data.',icon:<ShieldCheck size={18}/>,body:<><div className="settings-info-row"><LockKeyhole size={17}/><div><b>Account authentication</b><p className="small-muted">Your account is protected by Pocket sign-in and Supabase authentication.</p></div></div>{session&&<button className="btn btn-secondary" onClick={async()=>{const {error}=await supabase.auth.resetPasswordForEmail(session.user.email);alert(error?error.message:'If password reset is available, a reset email will be sent to your inbox.')}}>Request password reset</button>}<p className="small-muted" style={{marginTop:10}}>Never share exported backups; they may contain private financial information.</p></>},
  {title:'Data Management',desc:'Back up, restore or import your financial records.',icon:<Database size={18}/>,body:<>{(isAdmin||backupForUsers)?<><div className="settings-actions"><button className="btn btn-secondary" onClick={exportBackup}><FileJson size={16}/>Full JSON backup</button><button className="btn btn-secondary" onClick={exportCSV}><Download size={16}/>Export transactions</button><label className="btn btn-secondary file-btn"><Upload size={16}/>Restore JSON backup<input type="file" accept="application/json,.json" onChange={restoreBackup}/></label><label className="btn btn-secondary file-btn"><FileSpreadsheet size={16}/>Import Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport}/></label></div><p className="small-muted" style={{marginTop:10}}>Backup files contain private financial data. Keep them secure.</p></>:<p className="small-muted">Backup and restore tools are currently limited to Owner and Super Admins.</p>}</>},
  {
   title:'Expense Categories',
   desc:'Add, rename or remove categories used in expense transactions.',
   icon:<SlidersHorizontal size={18}/>,
   body:(
    <div className="expense-category-settings">
     <p className="small-muted">Your current expense categories are listed below. Changes are saved to your Pocket account in Supabase.</p>
     <form className="expense-category-add" onSubmit={e=>{
      e.preventDefault();
      const value=newExpenseCat.trim();
      const exists=expenseCats.some(c=>String(typeof c==='string'?c:c.name).toLowerCase()===value.toLowerCase());
      if(value&&!exists){saveExpenseCats([...expenseCats,value],{addName:value}).then(ok=>{if(ok)setNewExpenseCat('')});}
     }}>
      <input aria-label="New expense category" placeholder="New category name" value={newExpenseCat} onChange={e=>setNewExpenseCat(e.target.value)} maxLength={50}/>
      <button className="btn btn-primary" type="submit" disabled={!newExpenseCat.trim()||expenseCats.some(c=>String(typeof c==='string'?c:c.name).toLowerCase()===newExpenseCat.trim().toLowerCase())}><Plus size={15}/>Add category</button>
     </form>
     <div className="expense-category-list">
      {categoryBusy&&<p className="small-muted">Loading / saving categories…</p>}
      {categoryError&&<p className="small-muted" role="alert">{categoryError}</p>}
      {expenseCats.map(item=>{
       const cat=typeof item==='string'?item:item.name;
       const enabled=typeof item==='string'?true:item.is_enabled!==false;
       return <div className="expense-category-row" key={cat}>
        <label className="expense-category-visibility">
         <input type="checkbox" checked={enabled} disabled={categoryBusy} onChange={async e=>{
          const nextEnabled=e.target.checked;
          setCategoryBusy(true);setCategoryError('');
          if(!supabase||!session?.user?.id){setCategoryError('Please sign in to update category visibility.');setCategoryBusy(false);return;}
          const {error}=await supabase.from('expense_categories').update({is_enabled:nextEnabled}).eq('user_id',session.user.id).eq('name',cat);
          if(error){setCategoryError(error.message||'Could not update category visibility.');}
          else {const next=expenseCats.map(x=>(typeof x==='string'?x:x.name)===cat?{name:cat,is_enabled:nextEnabled}:x);setExpenseCats(next);setExpenseCategoriesOverride(next.filter(x=>typeof x==='string'||x.is_enabled!==false).map(x=>typeof x==='string'?x:x.name));}
          setCategoryBusy(false);
         }}/>
        </label>
        {editingExpenseCat===cat ? (
         <div className="category-edit-form">
          <input aria-label="Rename category" value={editingExpenseValue} onChange={e=>setEditingExpenseValue(e.target.value)} maxLength={50}/>
          <label className="category-subcategory-editor"><span>Subcategories <small>Separate each subcategory with a comma</small></span><textarea value={editingSubcategoryText} onChange={e=>setEditingSubcategoryText(e.target.value)} rows={2}/></label>
          <div className="category-edit-actions">
           <button className="btn btn-primary btn-sm" onClick={async()=>{
            const value=editingExpenseValue.trim();
            const duplicate=expenseCats.some(c=>{const name=typeof c==='string'?c:c.name;return name!==cat&&name.toLowerCase()===value.toLowerCase()});
            if(!value||duplicate)return;
            const ok=await saveExpenseCats(expenseCats.map(c=>(typeof c==='string'?c:c.name)===cat?{name:value,is_enabled:typeof c==='string'?true:c.is_enabled}:c),{rename:{from:cat,to:value}});
            if(ok){const values=editingSubcategoryText.split(',').map(x=>x.trim()).filter(Boolean);if(supabase&&session?.user?.id){if(value!==cat){const {error:renameError}=await supabase.from('expense_subcategories').update({category_name:value}).eq('user_id',session.user.id).eq('category_name',cat);if(renameError){setCategoryError(renameError.message||'Category renamed, but subcategories could not be renamed in Supabase.');return;}}const {error:deleteError}=await supabase.from('expense_subcategories').delete().eq('user_id',session.user.id).eq('category_name',value);if(deleteError){setCategoryError(deleteError.message||'Could not save subcategories.');return;}if(values.length){const {error:insertError}=await supabase.from('expense_subcategories').insert(values.map(name=>({user_id:session.user.id,category_name:value,name})));if(insertError){setCategoryError(insertError.message||'Could not save subcategories.');return;}}}saveCustomSubcategories(value,values);if(value!==cat){try{const saved=JSON.parse(localStorage.getItem('pocket_subcategories')||'{}');delete saved[cat];localStorage.setItem('pocket_subcategories',JSON.stringify(saved));}catch{}}setEditingExpenseCat('');setExpandedSubcategoryCategory('');}
           }} disabled={!editingExpenseValue.trim()||categoryBusy}>Save</button>
           <button className="btn btn-secondary btn-sm" onClick={()=>{setEditingExpenseCat('');setExpandedSubcategoryCategory('')}}>Cancel</button>
          </div>
         </div>
        ) : (
         <>
          <span>{cat}</span>
          <div className="row-actions">
           <button type="button" className="icon-btn" title="Edit category and subcategories" aria-label={'Edit '+cat+' and subcategories'} onClick={()=>{setEditingExpenseCat(cat);setEditingExpenseValue(cat);setExpandedSubcategoryCategory(cat);setEditingSubcategoryText(getSubcategories('Expense',cat).join(', '));}}><Pencil size={14}/></button>
           <button type="button" className="icon-btn danger-hover" aria-label={'Delete '+cat} onClick={()=>setDeleteExpenseCatConfirm({name:cat})}><Trash2 size={14}/></button>
          </div>
         </>
        )}
       </div>;
      })}
     </div>
     <p className="small-muted">Note: removing a category won’t delete or rewrite historical transactions.</p>
    </div>
   )
  },
  {title:'Preferences',desc:'Personalize how dates and navigation behave.',icon:<SlidersHorizontal size={18}/>,body:<div className="settings-preference-grid"><label className="field"><span>First page after opening Pocket</span><select value={prefs.firstPage} onChange={e=>update('firstPage',e.target.value)}>{['Overview','Transactions','Accounts','Budgets','Debts','Goals','Recurring payments','Insights & reports'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field"><span>Date format</span><select value={prefs.dateFormat} onChange={e=>update('dateFormat',e.target.value)}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label><label className="field"><span>Financial year starts</span><select value={prefs.financialMonth} onChange={e=>update('financialMonth',e.target.value)}>{Array.from({length:12},(_,i)=>i+1).map(m=><option value={String(m)} key={m}>{new Date(2026,m-1,1).toLocaleString('en',{month:'long'})}</option>)}</select></label></div>},
  ...(isAdmin?[{title:'User Permissions',desc:'Control access to administrative data tools.',icon:<Users size={18}/>,body:<label className="setting-toggle"><span><b>Show Backup & restore to regular users</b><small>When off, only Owner and Super Admins can see these tools.</small></span><input type="checkbox" checked={backupForUsers} onChange={e=>setBackupVisibility(e.target.checked)}/></label>}]:[])
 ];
 return <><ModalShell title="Settings" subtitle="Manage your account, preferences, notifications and data." onClose={onClose} wide><div className="settings-redesign-intro"><span className="settings-redesign-icon"><SlidersHorizontal size={20}/></span><div><b>Make Pocket work for you</b><p>Manage the details and controls that shape your workspace.</p></div></div><div className="settings-accordion-list">{sections.map(section=><section className={`settings-card ${open===section.title?'is-expanded':''}`} key={section.title}><button type="button" className="settings-card-trigger" onClick={()=>setOpen(open===section.title?'':section.title)} aria-expanded={open===section.title}><span className="settings-card-icon">{section.icon}</span><span className="settings-card-copy"><b>{section.title}</b><small>{section.desc}</small></span><ChevronDown size={17} className="settings-card-chevron"/></button>{open===section.title&&<div className="settings-card-content">{section.body}</div>}</section>)}</div><div className="modal-actions"><button className="btn btn-primary" onClick={onClose}>Done</button></div></ModalShell>{deleteExpenseCatConfirm&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!categoryBusy)setDeleteExpenseCatConfirm(null)}}><section className="modal-shell category-wizard-card category-delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="settings-delete-category-title"><div className="modal-header"><div><h2 id="settings-delete-category-title">Delete expense category?</h2><p>Remove <b>{deleteExpenseCatConfirm.name}</b>? Existing transactions will keep their saved category name. This change will be saved to your Pocket account.</p></div><button className="icon-btn" disabled={categoryBusy} onClick={()=>setDeleteExpenseCatConfirm(null)}><X size={18}/></button></div>{categoryError&&<div className="workspace-error" role="alert">{categoryError}</div>}<div className="category-wizard-actions"><button className="btn btn-secondary" disabled={categoryBusy} onClick={()=>setDeleteExpenseCatConfirm(null)}>Cancel</button><button className="btn btn-danger" disabled={categoryBusy} onClick={async()=>{const cat=deleteExpenseCatConfirm.name;setCategoryBusy(true);setCategoryError('');try{const ok=await saveExpenseCats(expenseCats.filter(c=>(typeof c==='string'?c:c.name)!==cat),{deleteName:cat});if(ok){setDeleteExpenseCatConfirm(null);setExpandedSubcategoryCategory('')}}catch(e){setCategoryError(e?.message||'Could not delete this category.')}finally{setCategoryBusy(false)}}}>{categoryBusy?<LoaderCircle size={15}/>:<Trash2 size={15}/>} Delete category</button></div></section></div>}</>
}

createRoot(document.getElementById('root')).render(<App/>);
