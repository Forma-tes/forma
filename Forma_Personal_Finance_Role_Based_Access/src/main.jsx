import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target, Repeat2, ChartNoAxesCombined,
  Settings, Search, Plus, Bell, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight, UserRound, ShieldCheck, FileJson,
  ArrowDownRight, TrendingUp, Download, Upload, CalendarDays, SlidersHorizontal,
  MoreHorizontal, X, Check, CircleHelp, PiggyBank, CreditCard, Sparkles, LogOut,
  Pencil, Trash2, Mail, LoaderCircle, FileSpreadsheet, CircleDollarSign, Menu, Users, LockKeyhole
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const cloudReady = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT') && !supabaseKey.includes('YOUR_SUPABASE'));
const supabase = cloudReady ? createClient(supabaseUrl, supabaseKey) : null;

const categories = ['Food','Transportation','Bills','Mobile Bill','Training','Rent','Shopping','Health','Entertainment','Personal Care','Travel','Salary','Freelance','Bonus','Other'];
const expenseCategories = ['Food','Transportation','Bills','Mobile Bill','Training','Rent','Shopping','Health','Entertainment','Personal Care','Travel','Other'];
const palette = ['#6c7cf5','#50b99a','#f5b85b','#ee8291','#9b8af7','#59a8d8','#e79a6c','#7e9b87'];
const demoTransactions = [
  {id:'d1',transaction_date:'2026-10-01',type:'Income',category:'Salary',description:'Monthly salary',amount:28000,need_want:null,fixed_variable:'Fixed',payment_method:'Bank Transfer',recurring:true,notes:''},
  {id:'d2',transaction_date:'2026-10-02',type:'Expense',category:'Rent',description:'Apartment rent',amount:6500,need_want:'Need',fixed_variable:'Fixed',payment_method:'Bank Transfer',recurring:true,notes:''},
  {id:'d3',transaction_date:'2026-10-03',type:'Expense',category:'Food',description:'Groceries',amount:820,need_want:'Need',fixed_variable:'Variable',payment_method:'Debit Card',recurring:false,notes:''},
  {id:'d4',transaction_date:'2026-10-05',type:'Expense',category:'Transportation',description:'Fuel',amount:480,need_want:'Need',fixed_variable:'Variable',payment_method:'Debit Card',recurring:false,notes:''},
  {id:'d5',transaction_date:'2026-10-06',type:'Expense',category:'Shopping',description:'Personal purchase',amount:1250,need_want:'Want',fixed_variable:'Variable',payment_method:'Credit Card',recurring:false,notes:''},
  {id:'d6',transaction_date:'2026-10-08',type:'Expense',category:'Mobile Bill',description:'Mobile plan',amount:350,need_want:'Need',fixed_variable:'Fixed',payment_method:'Wallet',recurring:true,notes:''},
  {id:'d7',transaction_date:'2026-10-10',type:'Expense',category:'Food',description:'Dinner',amount:290,need_want:'Want',fixed_variable:'Variable',payment_method:'Cash',recurring:false,notes:''},
  {id:'d8',transaction_date:'2026-10-12',type:'Income',category:'Freelance',description:'Project payment',amount:3500,need_want:null,fixed_variable:'Variable',payment_method:'Bank Transfer',recurring:false,notes:''},
  {id:'d9',transaction_date:'2026-10-14',type:'Expense',category:'Health',description:'Pharmacy',amount:420,need_want:'Need',fixed_variable:'Variable',payment_method:'Cash',recurring:false,notes:''},
  {id:'d10',transaction_date:'2026-10-15',type:'Expense',category:'Entertainment',description:'Cinema and coffee',amount:540,need_want:'Want',fixed_variable:'Variable',payment_method:'Debit Card',recurring:false,notes:''},
  {id:'d11',transaction_date:'2026-09-28',type:'Expense',category:'Training',description:'Online course',amount:900,need_want:'Want',fixed_variable:'Fixed',payment_method:'Credit Card',recurring:false,notes:''},
];
const starterGoals = [{id:'g1',name:'Emergency fund',target_amount:50000,saved_amount:12500,target_date:'2027-06-30',notes:'Build a safety net'}];
const starterRecurring = [
  {id:'r1',name:'Rent',category:'Rent',amount:6500,frequency:'Monthly',next_due_date:'2026-11-01',auto_pay:true,paid_this_cycle:false,essential:true,notes:''},
  {id:'r2',name:'Mobile plan',category:'Mobile Bill',amount:350,frequency:'Monthly',next_due_date:'2026-11-08',auto_pay:false,paid_this_cycle:false,essential:true,notes:''},
  {id:'r3',name:'Streaming subscription',category:'Entertainment',amount:220,frequency:'Monthly',next_due_date:'2026-10-25',auto_pay:true,paid_this_cycle:false,essential:false,notes:''},
];
const localISODate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const monthNow = localISODate().slice(0,7);
const fmt = n => { let currency='EGP'; try { currency=localStorage.getItem('forma_currency')||'EGP'; } catch {} return new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:currency==='EGP'?0:2}).format(Number(n)||0); };
const firstName = name => String(name||'').trim().split(/\s+/)[0] || '';
const getGreeting = (timezone) => { let hour=new Date().getHours(); try { if(timezone) hour=Number(new Intl.DateTimeFormat('en-US',{hour:'2-digit',hourCycle:'h23',timeZone:timezone}).format(new Date())); } catch {} return hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'; };
const addFrequency = (date, frequency) => { const step=d=>{if(frequency==='Weekly')d.setDate(d.getDate()+7);else if(frequency==='Monthly')d.setMonth(d.getMonth()+1);else if(frequency==='Quarterly')d.setMonth(d.getMonth()+3);else d.setFullYear(d.getFullYear()+1);return d;};let d=new Date(`${date||localISODate()}T12:00:00`);d=step(d);while(localISODate(d)<=localISODate())d=step(d);return localISODate(d); };
const shortDate = d => d ? new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'No date';
const monthLabel = m => new Date(m+'-15T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});
const monthStart = m => `${m}-01`;
const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random());
const FEATURE_OPTIONS = [
  {key:'overview',label:'Overview',description:'Main financial summary and dashboard'},
  {key:'transactions',label:'Transactions',description:'Add, edit, import, and export transactions'},
  {key:'accounts',label:'Accounts & wallets',description:'Bank accounts, cash, wallets, and balances'},
  {key:'calendar',label:'Cash flow calendar',description:'Transactions and upcoming payment dates'},
  {key:'budgets',label:'Budgets',description:'Monthly category budgets and limits'},
  {key:'goals',label:'Savings goals',description:'Savings targets and milestones'},
  {key:'subscriptions',label:'Subscriptions & bills',description:'Recurring payments and subscription renewals'},
  {key:'debts',label:'Debts & installments',description:'Debt balances and installment schedule'},
  {key:'insights',label:'Insights & forecast',description:'Financial insights, forecasts, and budget alerts'},
  {key:'reports',label:'Reports',description:'Monthly/yearly analytics and export'},
];
const PAGE_FEATURE = {'Overview':'overview','Transactions':'transactions','Accounts & wallets':'accounts','Cash flow calendar':'calendar','Budgets':'budgets','Savings goals':'goals','Subscriptions & bills':'subscriptions','Recurring payments':'subscriptions','Debts & installments':'debts','Insights & forecast':'insights','Reports':'reports'};

function App(){
  const [page,setPage] = useState('Overview');
  const [transactions,setTransactions] = useState([]);
  const [budgets,setBudgets] = useState([]);
  const [goals,setGoals] = useState([]);
  const [recurring,setRecurring] = useState([]);
  const [accounts,setAccounts] = useState([]);
  const [debts,setDebts] = useState([]);
  const [month,setMonth] = useState(monthNow);
  const [search,setSearch] = useState('');
  const [typeFilter,setTypeFilter] = useState('All types');
  const [categoryFilter,setCategoryFilter] = useState('All categories');
  const [modal,setModal] = useState(null);
  const [editing,setEditing] = useState(null);
  const [toast,setToast] = useState('');
  const [session,setSession] = useState(null);
  const [profile,setProfile] = useState(null);
  const [adminUsers,setAdminUsers] = useState([]);
  const [adminLoading,setAdminLoading] = useState(false);
  const [authEmail,setAuthEmail] = useState('');
  const [authMsg,setAuthMsg] = useState('');
  const [authMode,setAuthMode] = useState('signin');
  const [authName,setAuthName] = useState('');
  const [authPassword,setAuthPassword] = useState('');
  const [busy,setBusy] = useState(false);
  const [authLoading,setAuthLoading] = useState(true);
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const [importPreview,setImportPreview] = useState([]);
  const [year,setYear] = useState(String(new Date().getFullYear()));
  const [clock,setClock] = useState(Date.now());
  const [currency,setCurrency] = useState(()=>{try{return localStorage.getItem('forma_currency')||'EGP'}catch{return 'EGP'}});
  const [timezone,setTimezone] = useState(()=>{try{return localStorage.getItem('forma_timezone')||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch{return 'UTC'}});
  const [profileName,setProfileName] = useState(()=>{try{return localStorage.getItem('forma_profile_name')||''}catch{return ''}});
  const [profileSaving,setProfileSaving] = useState(false);
  const [paidBusy,setPaidBusy] = useState([]);
  const [localLoaded,setLocalLoaded] = useState(false);
  const isDemo = !cloudReady;

  useEffect(()=>{
    const loadLocal = () => {
      const read=(k,f)=>{try{return JSON.parse(localStorage.getItem('forma_'+k))||f}catch{return f}};
      setTransactions(read('transactions',demoTransactions));
      setBudgets(read('budgets',expenseCategories.map(c=>({id:'b'+c,category:c,month:monthStart(monthNow),amount: c==='Food'?3500:c==='Transportation'?1800:c==='Rent'?6500:c==='Bills'?1200:1000}))));
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
      setSession(data?.session||null);
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{
      setSession(s);
      setAuthLoading(false);
    });
    return ()=>{alive=false;subscription.unsubscribe()};
  },[]);
  useEffect(()=>{
    if(!cloudReady || !session?.user?.id){setProfile(null);setAdminUsers([]);return;}
    let alive=true;
    (async()=>{
      const {data,error}=await supabase.from('profiles').select('id,email,full_name,role,enabled_features,created_at').eq('id',session.user.id).maybeSingle();
      if(!alive)return;
      if(error){setToast('Could not load your access profile. Run the latest supabase/schema.sql migration.');setProfile(null);return;}
      setProfile(data||null);
      if(data && ['owner','super_admin'].includes(data.role)){
        setAdminLoading(true);
        const {data:users,error:usersError}=await supabase.rpc('admin_list_users');
        if(alive){if(usersError)setToast('Could not load user access list: '+usersError.message);else setAdminUsers(users||[]);setAdminLoading(false);}
      } else {setAdminUsers([]);}
    })();
    return ()=>{alive=false};
  },[session?.user?.id]);
  useEffect(()=>{
    if(session?.user){
      const meta=session.user.user_metadata||{};
      const nextCurrency=meta.currency||'EGP';
      const nextTimezone=meta.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
      setCurrency(nextCurrency);setTimezone(nextTimezone);
      localStorage.setItem('forma_currency',nextCurrency);localStorage.setItem('forma_timezone',nextTimezone);
      if(meta.full_name)setProfileName(meta.full_name);
    }
  },[session?.user?.id]);
  useEffect(()=>{
    if(!cloudReady || !session?.user) return;
    let alive=true;
    (async()=>{
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setRecurring([]);setAccounts([]);setDebts([]);
      setBusy(true);
      const [t,b,g,r,a,d]=await Promise.all([
        supabase.from('transactions').select('*').order('transaction_date',{ascending:false}),
        supabase.from('budgets').select('*').order('month',{ascending:false}),
        supabase.from('savings_goals').select('*').order('created_at',{ascending:false}),
        supabase.from('recurring_payments').select('*').order('next_due_date',{ascending:true}),
        supabase.from('financial_accounts').select('*').order('created_at',{ascending:true}),
        supabase.from('debts').select('*').order('due_date',{ascending:true})
      ]);
      if(!alive)return;
      if(!t.error)setTransactions(t.data||[]);
      if(!b.error)setBudgets(b.data||[]);
      if(!g.error)setGoals(g.data||[]);
      if(!r.error)setRecurring(r.data||[]);
      if(!a.error)setAccounts(a.data||[]);
      if(!d.error)setDebts(d.data||[]);
      setBusy(false);
    })();
    return ()=>{alive=false};
  },[session?.user?.id]);
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
  const totalSaved=goals.reduce((s,g)=>s+Number(g.saved_amount||0),0);
  const goalTarget=goals.reduce((s,g)=>s+Number(g.target_amount||0),0);
  const upcoming=recurring.filter(r=>!r.paid_this_cycle).sort((a,b)=>(a.next_due_date||'').localeCompare(b.next_due_date||'')).slice(0,4);
  const displayName=firstName(session ? (session.user.user_metadata?.full_name||session.user.email?.split('@')[0]||'there') : (profileName||'there'));
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
    if(cloudReady&&session?.user){const {error}=await supabase.from(table).delete().eq('id',id);if(error){setToast(error.message);return;}}
    setter(list.filter(x=>x.id!==id));setToast('Deleted successfully');
  }
  async function submitTransaction(form){
    const payload={transaction_date:form.transaction_date,type:form.type,category:form.category,description:form.description,amount:Number(form.amount),need_want:form.type==='Expense'?form.need_want:null,fixed_variable:form.fixed_variable,payment_method:form.payment_method,account_id:form.account_id||null,recurring:form.recurring,notes:form.notes};
    const saved=await saveRecord('transactions',payload,editing?.id);if(!saved)return;
    setTransactions(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);
    setModal(null);setEditing(null);setToast(editing?'Transaction updated':'Transaction added');
  }
  async function addGoal(form){
    const p={name:form.name,target_amount:Number(form.target_amount),saved_amount:Number(form.saved_amount||0),target_date:form.target_date||null,notes:form.notes||''};
    const saved=await saveRecord('savings_goals',p,editing?.id);if(!saved)return;
    setGoals(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);setModal(null);setEditing(null);setToast('Goal saved');
  }
  async function addRecurring(form){
    const p={name:form.name,category:form.category,amount:Number(form.amount),frequency:form.frequency,next_due_date:form.next_due_date||null,auto_pay:form.auto_pay,paid_this_cycle:form.paid_this_cycle,last_paid_date:editing?.last_paid_date||null,essential:form.essential,notes:form.notes||''};
    const saved=await saveRecord('recurring_payments',p,editing?.id);if(!saved)return;
    setRecurring(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);setModal(null);setEditing(null);setToast('Payment saved');
  }
  async function addBudget(form){
    const p={category:form.category,month:monthStart(form.month),amount:Number(form.amount)};
    const saved=await saveRecord('budgets',p,editing?.id);if(!saved)return;
    setBudgets(old=>[...old.filter(x=>!(x.category===saved.category&&(x.month||'').slice(0,7)===(saved.month||'').slice(0,7)&&x.id!==saved.id)),saved]);setModal(null);setEditing(null);setToast('Budget saved');
  }
  async function saveAccount(form){
    const payload={name:form.name.trim(),type:form.type,opening_balance:Number(form.opening_balance||0),color:form.color||'#6c7cf5'};
    const saved=await saveRecord('financial_accounts',payload,editing?.id);if(!saved)return;
    setAccounts(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);setModal(null);setEditing(null);setToast('Account saved');
  }
  async function saveDebt(form){
    const payload={name:form.name.trim(),lender:form.lender||'',original_amount:Number(form.original_amount||0),remaining_amount:Number(form.remaining_amount||0),monthly_payment:Number(form.monthly_payment||0),due_date:form.due_date||null,frequency:form.frequency||'Monthly',notes:form.notes||''};
    const saved=await saveRecord('debts',payload,editing?.id);if(!saved)return;
    setDebts(old=>editing?old.map(x=>x.id===editing.id?saved:x):[saved,...old]);setModal(null);setEditing(null);setToast('Debt saved');
  }
  async function signIn(e){
    e.preventDefault(); if(!supabase)return;
    setBusy(true);setAuthMsg('');
    const {error}=await supabase.auth.signInWithPassword({email:authEmail.trim(),password:authPassword});
    setBusy(false);
    if(error)setAuthMsg(error.message);
  }
  async function signUp(e){
    e.preventDefault(); if(!supabase)return;
    if(authPassword.length<8){setAuthMsg('Use a password with at least 8 characters.');return;}
    setBusy(true);setAuthMsg('');
    const {data,error}=await supabase.auth.signUp({
      email:authEmail.trim(),
      password:authPassword,
      options:{data:{full_name:authName.trim()},emailRedirectTo:window.location.origin}
    });
    setBusy(false);
    if(error){setAuthMsg(error.message);return;}
    if(data.session){setAuthMsg('Account created successfully.');}
    else {setAuthMode('signin');setAuthMsg('Account created! Check your email to confirm your address, then sign in.');}
  }
  async function resetPassword(e){
    e.preventDefault(); if(!supabase)return;
    setBusy(true);setAuthMsg('');
    const {error}=await supabase.auth.resetPasswordForEmail(authEmail.trim(),{redirectTo:window.location.origin});
    setBusy(false);
    setAuthMsg(error?error.message:'If an account exists for this email, a password reset link has been sent.');
  }
  async function refreshAdminUsers(){
    if(!cloudReady || !['owner','super_admin'].includes(profile?.role))return;
    setAdminLoading(true);
    const {data,error}=await supabase.rpc('admin_list_users');
    if(error)setToast('Could not refresh users: '+error.message);else setAdminUsers(data||[]);
    setAdminLoading(false);
  }
  async function updateUserAccess(userId, enabledFeatures, role=null){
    if(!cloudReady || !['owner','super_admin'].includes(profile?.role))return;
    const {error}=await supabase.rpc('admin_update_user_access',{p_target_user_id:userId,p_enabled_features:enabledFeatures,p_role:role});
    if(error){setToast(error.message||'Could not update user access');return;}
    setToast('User access updated');
    await refreshAdminUsers();
  }
  function exportCSV(){
    const ws=XLSX.utils.json_to_sheet(transactions.map(t=>({'Date':t.transaction_date,'Type':t.type,'Category':t.category,'Description':t.description,[`Amount (${currency})`]:t.amount,'Need / Want':t.need_want,'Fixed / Variable':t.fixed_variable,'Payment Method':t.payment_method,'Recurring?':t.recurring?'Yes':'No','Notes':t.notes})));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Transactions');XLSX.writeFile(wb,'forma-transactions.xlsx');
  }
  async function saveProfile(form){
    const name=String(form.full_name||'').trim();
    if(!name){setToast('Please enter your name');return;}
    setProfileSaving(true);
    try {
      if(cloudReady && session?.user){
        const {data,error}=await supabase.auth.updateUser({data:{...session.user.user_metadata,full_name:name,currency:form.currency,timezone:form.timezone}});
        if(error) throw error;
        const {error:profileError}=await supabase.from('profiles').update({full_name:name,updated_at:new Date().toISOString()}).eq('id',session.user.id);
        if(profileError) throw profileError;
        if(data?.user)setSession(old=>old?{...old,user:data.user}:old);
      }
      localStorage.setItem('forma_profile_name',name);
      localStorage.setItem('forma_currency',form.currency);
      localStorage.setItem('forma_timezone',form.timezone);
      setProfileName(name);setCurrency(form.currency);setTimezone(form.timezone);
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
        setTransactions(data.transactions);setBudgets(data.budgets);setGoals(data.goals);setRecurring(data.recurring);setAccounts(data.accounts||[]);setDebts(data.debts||[]);
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
        const {error}=await supabase.rpc('mark_recurring_payment_paid',{p_payment_id:r.id,p_paid_date:paidDate});
        if(error)throw error;
        const [t,rec]=await Promise.all([supabase.from('transactions').select('*').order('transaction_date',{ascending:false}),supabase.from('recurring_payments').select('*').order('next_due_date',{ascending:true})]);
        if(t.error||rec.error)throw new Error('Payment recorded. Reload the app if the refreshed list is not visible.');
        setTransactions(t.data||[]);setRecurring(rec.data||[]);
      } else {
        if(r.last_paid_date&&r.next_due_date&&paidDate<r.next_due_date)throw new Error('This payment was already recorded for the current cycle.');
        const tx={transaction_date:paidDate,type:'Expense',category:r.category||'Bills',description:`Recurring payment: ${r.name}`,amount:Number(r.amount)||0,need_want:'Need',fixed_variable:'Fixed',payment_method:'Other',recurring:true,notes:`Generated from recurring payment ${r.name}`};
        const savedTx={...tx,id:uid()};
        const nextDue=addFrequency(r.next_due_date||paidDate,r.frequency);
        const updated={...r,next_due_date:nextDue,paid_this_cycle:true,last_paid_date:paidDate};
        setTransactions(old=>[savedTx,...old]);setRecurring(old=>old.map(x=>x.id===r.id?updated:x));
      }
      setToast('Payment recorded and next due date updated');
    }catch(err){setToast(err.message||'Could not mark payment as paid');}
    finally{setPaidBusy(old=>old.filter(id=>id!==r.id));}
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

  const isAdmin=cloudReady && ['owner','super_admin'].includes(profile?.role);
  const allowedFeatures=!cloudReady||isAdmin?FEATURE_OPTIONS.map(f=>f.key):(Array.isArray(profile?.enabled_features)?profile.enabled_features:[]);
  const visibleNavGroups=[{label:'WORKSPACE',items:[['Overview',LayoutDashboard],['Transactions',ArrowLeftRight],['Accounts & wallets',Wallet],['Cash flow calendar',CalendarDays],['Budgets',CreditCard],['Savings goals',Target],['Subscriptions & bills',Repeat2],['Debts & installments',CircleDollarSign]]},{label:'ANALYZE',items:[['Insights & forecast',Sparkles],['Reports',ChartNoAxesCombined]]}].map(g=>({...g,items:g.items.filter(([name])=>allowedFeatures.includes(PAGE_FEATURE[name]))})).filter(g=>g.items.length);
  const canSeeCurrentPage=page==='Admin access'?isAdmin:page==='Access restricted'?true:allowedFeatures.includes(PAGE_FEATURE[page]);
  if(cloudReady && authLoading) return <div className="auth-loading"><div className="brand-mark"><CircleDollarSign size={23}/></div><b>Forma</b><span>Preparing your secure workspace…</span></div>;
  if(cloudReady && !session) return <AuthScreen {...{authMode,setAuthMode,authName,setAuthName,authEmail,setAuthEmail,authPassword,setAuthPassword,authMsg,setAuthMsg,busy,signIn,signUp,resetPassword}} />;
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-mark"><CircleDollarSign size={21}/></div><span>forma<span className="brand-dot">.</span></span><button className="icon-btn mobile-close" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div>
      <div className="workspace-switch"><div className="workspace-avatar">{(displayName[0]||'U').toUpperCase()}</div><div className="workspace-label"><b>My finances</b><span>{cloudReady?(session?'Cloud workspace':'Cloud not signed in'):'Personal workspace'}</span></div><ChevronDown size={15}/></div>
      {visibleNavGroups.map(group=><div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([name,Icon])=><button key={name} className={`nav-item ${page===name?'active':''}`} onClick={()=>{setPage(name);setSidebarOpen(false)}}><Icon size={18}/><span>{name}</span>{name==='Transactions'&&<span className="nav-count">{transactions.length}</span>}</button>)}</div>)}
      {isAdmin&&<div className="nav-group admin-nav-group"><div className="nav-label">ADMINISTRATION</div><button className={`nav-item ${page==='Admin access'?'active':''}`} onClick={()=>{setPage('Admin access');setSidebarOpen(false)}}><ShieldCheck size={18}/><span>User access</span></button></div>}<div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><b>Your money, in focus</b><p>Small insights. Better decisions.</p><div className="upgrade-progress"><span/></div><small>{transactions.length} transactions tracked</small></div><button className="nav-item" onClick={()=>setModal('settings')}><Settings size={18}/><span>Settings & data</span></button><div className="profile"><div className="profile-avatar">{(displayName[0]||'U').toUpperCase()}</div><div className="profile-info"><b>{displayName}</b><span>{cloudReady?(session?'Cloud sync enabled':'Sign in to sync'):'Local demo mode'}</span></div><button className="icon-btn" title="Account" onClick={()=>setModal('settings')}><MoreHorizontal size={18}/></button></div></div>
    </aside>
    {sidebarOpen&&<div className="scrim" onClick={()=>setSidebarOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn menu-toggle" onClick={()=>setSidebarOpen(true)}><Menu size={20}/></button><span className="breadcrumb">Workspace</span><ChevronRight size={14} color="#a4a9b5"/><b>{page}</b></div><div className="topbar-actions"><div className="cloud-status"><span className={`status-dot ${cloudReady&&session?'online':''}`}/>{cloudReady?(session?'Cloud synced':'Cloud setup needed'):'Demo mode'}</div><button className="icon-btn notification-btn" onClick={()=>setPage('Recurring payments')} title="Upcoming payments"><Bell size={18}/>{upcoming.length>0&&<i/>}</button><div className="top-avatar">{(displayName[0]||'U').toUpperCase()}</div></div></header>
      <div className="page-wrap">
        {!canSeeCurrentPage&&<AccessRestricted profile={profile} onBack={()=>setPage(allowedFeatures[0]?FEATURE_OPTIONS.find(f=>f.key===allowedFeatures[0])?.label:'Overview')}/> }
        {page==='Admin access'&&isAdmin&&<AdminAccessPage users={adminUsers} loading={adminLoading} profile={profile} onUpdate={updateUserAccess}/>}
        {canSeeCurrentPage&&page==='Overview'&&<Overview {...{month,setMonth,transactions,monthTx,income,expenses,net,savingsRate,monthlySeries,categoryData,needs,wants,monthBudgets,totalBudget,totalSaved,goalTarget,upcoming,goals,setPage,setModal,setEditing,setToast,displayName,greeting}}/>}
        {canSeeCurrentPage&&page==='Transactions'&&<TransactionsPage {...{transactions,filtered,search,setSearch,typeFilter,setTypeFilter,categoryFilter,setCategoryFilter,setModal,setEditing,setPage,setToast,removeRecord,setTransactions,handleImport,exportCSV,currency}}/>}
        {canSeeCurrentPage&&page==='Accounts & wallets'&&<AccountsPage {...{accounts,transactions,setModal,setEditing,removeRecord,setAccounts,currency}}/>}
        {canSeeCurrentPage&&page==='Cash flow calendar'&&<CashFlowCalendar {...{transactions,recurring,month,setMonth,currency}}/>}
        {canSeeCurrentPage&&page==='Debts & installments'&&<DebtsPage {...{debts,setModal,setEditing,removeRecord,setDebts,currency}}/>}
        {canSeeCurrentPage&&page==='Insights & forecast'&&<InsightsPage {...{transactions,month,setMonth,budgets,recurring,goals,debts,currency,setPage}}/>}
        {canSeeCurrentPage&&page==='Budgets'&&<BudgetsPage {...{budgets,transactions,month,setMonth,setModal,setEditing,setToast,removeRecord,setBudgets}}/>}
        {canSeeCurrentPage&&page==='Savings goals'&&<GoalsPage {...{goals,setModal,setEditing,setToast,removeRecord,setGoals,totalSaved,goalTarget}}/>}
        {canSeeCurrentPage&&(page==='Recurring payments'||page==='Subscriptions & bills')&&<RecurringPage {...{recurring,setModal,setEditing,setToast,removeRecord,setRecurring,markRecurringPaid,paidBusy}}/>}
        {canSeeCurrentPage&&page==='Reports'&&<ReportsPage {...{transactions,monthlySeries,categoryData,needs,wants,year,setYear,month,setMonth}}/>}
      </div>
      <footer className="footer"><span>Forma Finance <span className="footer-dot">•</span> Made for mindful money</span><span>Currency: {currency} <span className="footer-dot">•</span> {cloudReady&&session?'Synced to cloud':'Your workspace'}</span></footer>
    </main>
    {modal==='transaction'&&<TransactionModal currency={currency} accounts={accounts} initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={submitTransaction}/>}
    {modal==='goal'&&<GoalModal currency={currency} initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={addGoal}/>}
    {modal==='recurring'&&<RecurringModal currency={currency} initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={addRecurring}/>}
    {modal==='budget'&&<BudgetModal currency={currency} initial={editing} month={month} onClose={()=>{setModal(null);setEditing(null)}} onSave={addBudget}/>}
     {modal==='settings'&&<SettingsModal {...{onClose:()=>setModal(null),cloudReady,session,supabase,exportCSV,exportBackup,handleImport,restoreBackup,saveProfile,profileSaving,profileName:session?.user?.user_metadata?.full_name||profileName,currency,timezone}}/>}
    {modal==='account'&&<AccountModal initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={saveAccount}/> }
    {modal==='debt'&&<DebtModal currency={currency} initial={editing} onClose={()=>{setModal(null);setEditing(null)}} onSave={saveDebt}/> }
    {modal==='import'&&<ImportModal rows={importPreview} onClose={()=>{setModal(null);setImportPreview([])}} onConfirm={confirmImport}/>}
    {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
  </div>;
}

function AccessRestricted({profile,onBack}){
 return <section className="panel access-restricted"><div className="empty-state"><span className="empty-icon"><LockKeyhole size={24}/></span><h2>Feature access not enabled</h2><p>This feature is currently hidden for your account. Ask the Forma owner or a super admin to enable it for you.</p><button className="btn btn-primary" onClick={onBack}>Go to available workspace</button><small>Account role: {profile?.role||'user'}</small></div></section>;
}
function AdminAccessPage({users,loading,profile,onUpdate}){
 const [expanded,setExpanded]=useState(null);
 const isOwner=profile?.role==='owner';
 return <><PageHeading eyebrow="ADMINISTRATION" title="User access" subtitle="Choose which features each account can see. New accounts start with no feature access until an admin enables it." actions={<span className="status-tag status-good"><ShieldCheck size={14}/> {isOwner?'Owner':'Super admin'}</span>}/>
 <section className="panel"><div className="panel-header"><div><h2><Users size={18}/> Accounts & permissions</h2><p>Only the owner and super admins can manage feature access.</p></div><span className="status-tag">{users.length} users</span></div>
 {loading?<div className="loading-row"><LoaderCircle className="spin" size={18}/> Loading user access…</div>:users.length===0?<div className="empty-state"><h3>No registered users yet</h3><p>New accounts will appear here after they sign up.</p></div>:<div className="admin-user-list">{users.map(u=>{
 const features=Array.isArray(u.enabled_features)?u.enabled_features:[];
 const isSelf=u.user_id===profile?.id;
 return <article className="admin-user-card" key={u.user_id}><div className="admin-user-summary"><div className="profile-avatar">{(u.full_name||u.email||'U').slice(0,1).toUpperCase()}</div><div className="admin-user-identity"><b>{u.full_name||'Unnamed user'}</b><span>{u.email}</span><small>Joined {u.created_at?new Date(u.created_at).toLocaleDateString(): '—'}</small></div><span className={`status-tag ${u.role==='owner'?'status-good':u.role==='super_admin'?'status-pending':''}`}>{u.role==='super_admin'?'Super admin':u.role==='owner'?'Owner':'User'}</span><button className="btn btn-secondary btn-sm" onClick={()=>setExpanded(expanded===u.user_id?null:u.user_id)}>{expanded===u.user_id?'Hide features':'Manage features'}</button></div>
 {expanded===u.user_id&&<div className="admin-feature-panel"><div className="admin-feature-heading"><b>Feature visibility</b><span>{u.role==='owner'||u.role==='super_admin'?'All features available':`${features.length} of ${FEATURE_OPTIONS.length} enabled`}</span></div>{u.role==='owner'||u.role==='super_admin'?<p className="small-muted">Admin accounts can access all features. Feature toggles apply to regular users.</p>:<div className="admin-feature-grid">{FEATURE_OPTIONS.map(f=><label className="admin-feature-option" key={f.key}><input type="checkbox" checked={features.includes(f.key)} onChange={e=>{const next=e.target.checked?[...new Set([...features,f.key])]:features.filter(x=>x!==f.key);onUpdate(u.user_id,next,null)}}/><span><b>{f.label}</b><small>{f.description}</small></span></label>)}</div>}
 {isOwner&&u.role!=='owner'&&<div className="admin-role-row"><label>Account role<select value={u.role} onChange={e=>onUpdate(u.user_id,features,e.target.value)}><option value="user">User</option><option value="super_admin">Super admin</option></select></label><small>Only the owner can promote or demote super admins. The owner account cannot be changed here.</small></div>}
 {isSelf&&<p className="small-muted">This is your current account. Owner access is controlled by the database, not by feature toggles.</p>}
 </div>}</article>})}</div>}
 </section><section className="panel admin-note"><div className="settings-row"><div className="settings-icon"><LockKeyhole size={18}/></div><div><b>Secure by design</b><p>Feature access is stored in Supabase profiles. New users receive the User role automatically; changing browser UI or editing local storage cannot grant admin permissions.</p></div></div></section></>;
}

function PageHeading({eyebrow,title,subtitle,actions}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div><div className="heading-actions">{actions}</div></div>}
function MonthPicker({month,setMonth}){return <div className="month-picker"><CalendarDays size={16}/><input aria-label="Selected month" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>}
function MetricCard({label,value,change,icon:Icon,tone='blue',note}){return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-foot">{change&&<span className={change.startsWith('+')?'positive':'neutral'}>{change}</span>}<span>{note}</span></div></div>}
function Overview(p){
 const {month,setMonth,monthTx,income,expenses,net,savingsRate,monthlySeries,categoryData,needs,wants,monthBudgets,totalBudget,totalSaved,goalTarget,upcoming,goals,setPage,setModal,setEditing,setToast,displayName,greeting}=p;
 const maxSpend=Math.max(1,...categoryData.map(x=>x.value));
 const insight=expenses===0?'Add your first expense to start seeing your spending patterns.':savingsRate>=20?`Great work — you're keeping ${Math.round(savingsRate)}% of this month's income.`:net<0?'Your expenses are higher than income this month. Review flexible spending first.':`Your top spending category is ${categoryData[0]?.name||'—'}. Keep an eye on it as the month continues.`;
 return <>
  <PageHeading eyebrow="YOUR FINANCIAL PICTURE" title={`${greeting}, ${displayName} ✨`} subtitle="Here's what's happening with your money." actions={<><MonthPicker month={month} setMonth={setMonth}/><button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('transaction')}}><Plus size={17}/> Add transaction</button></>}/>
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
   <section className="panel"><div className="panel-header"><div><h2>Recent transactions</h2><p>Your latest money movements</p></div><button className="select-lite" onClick={()=>setPage('Transactions')}>View all <ArrowUpRight size={14}/></button></div><TransactionTable transactions={[...monthTx].sort((a,b)=>b.transaction_date.localeCompare(a.transaction_date)).slice(0,5)}/></section>
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
function TransactionTable({transactions,onEdit,onDelete}){
 if(!transactions.length)return <EmptyState icon={ArrowLeftRight} title="No transactions found" text="Your money movements will appear here."/>
 return <div className="table-wrap"><table className="data-table"><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Amount</th>{onEdit&&<th></th>}</tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td><div className="transaction-name"><span className={`tx-avatar ${t.type==='Income'?'tx-income':'tx-expense'}`}>{t.type==='Income'?<ArrowDownRight size={16}/>:<ArrowUpRight size={16}/>}</span><span><b>{t.description||t.category}</b><small>{t.payment_method||'Cash'}</small></span></div></td><td><span className="category-pill">{t.category}</span></td><td className="date-cell">{shortDate(t.transaction_date)}</td><td><b className={t.type==='Income'?'amount-income':'amount-expense'}>{t.type==='Income'?'+':'−'}{fmt(t.amount)}</b></td>{onEdit&&<td><div className="row-actions"><button className="icon-btn" onClick={()=>onEdit(t)}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>onDelete(t)}><Trash2 size={15}/></button></div></td>}</tr>)}</tbody></table></div>
}
function TransactionsPage(p){
 const {transactions,filtered,search,setSearch,typeFilter,setTypeFilter,categoryFilter,setCategoryFilter,setModal,setEditing,setToast,removeRecord,setTransactions,handleImport,exportCSV}=p;
 const rows=transactions.filter(t=>{
  const q=search.toLowerCase();return (!q||(t.description||'').toLowerCase().includes(q)||(t.category||'').toLowerCase().includes(q)||(t.notes||'').toLowerCase().includes(q))&&(typeFilter==='All types'||t.type===typeFilter)&&(categoryFilter==='All categories'||t.category===categoryFilter);
 }).sort((a,b)=>b.transaction_date.localeCompare(a.transaction_date));
 return <><PageHeading eyebrow="MONEY MOVEMENTS" title="Transactions" subtitle="Every income and expense, all in one place." actions={<><button className="btn btn-secondary" onClick={exportCSV}><Download size={16}/> Export</button><label className="btn btn-secondary file-btn"><Upload size={16}/> Import Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport}/></label><button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('transaction')}}><Plus size={17}/> Add transaction</button></>}/>
 <div className="metric-strip"><div><span>Total transactions</span><b>{transactions.length}</b></div><div><span>Income recorded</span><b className="amount-income">{fmt(transactions.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount),0))}</b></div><div><span>Expenses recorded</span><b>{fmt(transactions.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount),0))}</b></div></div>
 <section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={17}/><input placeholder="Search transactions..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button className="icon-btn" onClick={()=>setSearch('')}><X size={14}/></button>}</div><div className="filter-group"><SlidersHorizontal size={16}/><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option>All types</option><option>Income</option><option>Expense</option></select><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div></div>
 <TransactionTable transactions={rows} onEdit={t=>{setEditing(t);setModal('transaction')}} onDelete={t=>{if(confirm(`Delete "${t.description||t.category}"?`))removeRecord('transactions',t.id,setTransactions,transactions)}}/>
 <div className="table-bottom"><span>Showing <b>{rows.length}</b> of <b>{transactions.length}</b> transactions</span><span>Amounts in {currency}</span></div></section></>;
}
function BudgetsPage(p){
 const {budgets,transactions,month,setMonth,setModal,setEditing,setToast,removeRecord,setBudgets}=p;
 const list=expenseCategories.map(c=>{const b=budgets.find(x=>x.category===c&&(x.month||'').slice(0,7)===month);const spent=transactions.filter(t=>t.type==='Expense'&&t.category===c&&(t.transaction_date||'').slice(0,7)===month).reduce((s,t)=>s+Number(t.amount),0);return {...(b||{id:null,category:c,amount:0,month:monthStart(month)}),category:c,spent,used:b?.amount?spent/Number(b.amount)*100:0}});
 const total=list.reduce((s,b)=>s+Number(b.amount||0),0),spent=list.reduce((s,b)=>s+b.spent,0);
 return <><PageHeading eyebrow="PLAN WITH PURPOSE" title="Budgets" subtitle="Give every pound a plan, without losing flexibility." actions={<><MonthPicker month={month} setMonth={setMonth}/><button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('budget')}}><Plus size={17}/> Set budget</button></>}/>
 <div className="metric-grid three"><MetricCard label="Planned budget" value={fmt(total)} icon={Wallet} tone="blue" note={monthLabel(month)}/><MetricCard label="Spent so far" value={fmt(spent)} icon={ArrowUpRight} tone="orange" note={`${total?Math.round(spent/total*100):0}% of budget`}/><MetricCard label="Remaining" value={fmt(total-spent)} icon={PiggyBank} tone="green" note={spent>total?'Over budget':'Available to spend'}/></div>
 <div className="budget-grid">{list.map((b,i)=><div className="panel budget-card" key={b.category}><div className="budget-card-head"><span className="category-color" style={{background:palette[i%palette.length]}}/><div><b>{b.category}</b><small>{b.amount?`${fmt(b.amount)} monthly limit`:'No budget set'}</small></div><button className="icon-btn" onClick={()=>{setEditing(b);setModal('budget')}}><Pencil size={15}/></button></div><div className="budget-numbers"><b>{fmt(b.spent)}</b><span>{b.amount?`of ${fmt(b.amount)}`:'spent'}</span></div><div className="progress-track"><span style={{width:`${Math.min(100,b.used)}%`,background:b.used>=100?'#e66f78':b.used>=80?'#f1b15d':palette[i%palette.length]}}/></div><div className="budget-card-foot"><span className={b.used>=100?'text-danger':b.used>=80?'text-warn':'text-muted'}>{b.amount?(b.used>=100?'Over budget':b.used>=80?'Near limit':'On track'):'Set a limit'}</span><b>{b.amount?`${Math.round(b.used)}%`:''}</b></div></div>)}</div></>;
}
function GoalsPage(p){
 const {goals,setModal,setEditing,removeRecord,setGoals,totalSaved,goalTarget}=p;
 return <><PageHeading eyebrow="FUTURE YOU WILL THANK YOU" title="Savings goals" subtitle="Turn the things you want into a plan you can follow." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('goal')}}><Plus size={17}/> New goal</button>}/>
 <div className="metric-grid three"><MetricCard label="Total target" value={fmt(goalTarget)} icon={Target} tone="purple" note="across all goals"/><MetricCard label="Already saved" value={fmt(totalSaved)} icon={PiggyBank} tone="green" note="saved so far"/><MetricCard label="Still to save" value={fmt(Math.max(0,goalTarget-totalSaved))} icon={TrendingUp} tone="blue" note="to reach your goals"/></div>
 <div className="goal-grid">{goals.map((g,i)=>{const progress=Math.min(100,Math.round(Number(g.saved_amount)/(Number(g.target_amount)||1)*100));const remaining=Math.max(0,Number(g.target_amount)-Number(g.saved_amount));const months=g.target_date?Math.max(1,(new Date(g.target_date).getFullYear()-new Date().getFullYear())*12+new Date(g.target_date).getMonth()-new Date().getMonth()):null;return <div className="panel goal-card" key={g.id}><div className="goal-card-top"><div className={`goal-big-icon goal-tone-${i%4}`}><Target size={22}/></div><div className="goal-menu"><button className="icon-btn" onClick={()=>{setEditing(g);setModal('goal')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>{if(confirm('Delete this savings goal?'))removeRecord('savings_goals',g.id,setGoals,goals)}}><Trash2 size={15}/></button></div></div><h3>{g.name}</h3><p className="goal-deadline">{g.target_date?`Target date · ${shortDate(g.target_date)}`:'No target date set'}</p><div className="goal-amounts"><div><span>Saved so far</span><b>{fmt(g.saved_amount)}</b></div><div><span>Target amount</span><b>{fmt(g.target_amount)}</b></div></div><div className="progress-track big"><span style={{width:`${progress}%`,background:palette[i%palette.length]}}/></div><div className="progress-caption"><span>{progress}% complete</span><span>{fmt(remaining)} to go</span></div><div className="goal-footer"><span><CalendarDays size={14}/>{months?`${months} months left`:'Flexible timeline'}</span><b>{months?`${fmt(remaining/months)}/mo`:'—'}</b></div>{g.notes&&<p className="goal-note">{g.notes}</p>}</div>})}
 {goals.length===0&&<div className="panel empty-large"><EmptyState icon={Target} title="Every goal starts somewhere" text="Create your first savings goal and watch your progress grow." action={()=>{setEditing(null);setModal('goal')}} actionLabel="Create a goal"/></div>}</div></>;
}
function RecurringPage(p){
 const {recurring,setModal,setEditing,removeRecord,markRecurringPaid,paidBusy}=p;
 const total=recurring.reduce((s,r)=>s+Number(r.amount||0)*(r.frequency==='Weekly'?52/12:r.frequency==='Quarterly'?1/3:r.frequency==='Yearly'?1/12:1),0);
 const today=localISODate();
 const isPaid=r=>Boolean(r.last_paid_date&&r.next_due_date&&r.last_paid_date<r.next_due_date&&today<r.next_due_date) || Boolean(r.paid_this_cycle&&!r.next_due_date);
 const awaiting=recurring.filter(r=>!isPaid(r)).length;
 return <><PageHeading eyebrow="RECURRING COMMITMENTS" title="Subscriptions & bills" subtitle="Track subscriptions, recurring bills, renewals, and what is coming next." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('recurring')}}><Plus size={17}/> Add payment</button>}/>
 <div className="metric-grid three"><MetricCard label="Monthly commitments" value={fmt(total)} icon={Repeat2} tone="blue" note="estimated monthly equivalent"/><MetricCard label="Active payments" value={recurring.length} icon={CreditCard} tone="purple" note="tracked recurring items"/><MetricCard label="Awaiting payment" value={awaiting} icon={CalendarDays} tone="orange" note="this cycle"/></div>
 <section className="panel table-panel"><div className="panel-header section-header"><div><h2>All recurring payments</h2><p>Mark each item paid when you complete it. Auto-pay is a tracker only; Forma does not move money.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Payment</th><th>Frequency</th><th>Next due</th><th>Amount</th><th>Auto-pay</th><th>Status</th><th>Actions</th></tr></thead><tbody>{recurring.map(r=><tr key={r.id}><td><div className="transaction-name"><span className="tx-avatar tx-expense"><Repeat2 size={16}/></span><span><b>{r.name}</b><small>{r.category}{r.essential?' · Essential':' · Optional'}</small></span></div></td><td>{r.frequency}</td><td>{shortDate(r.next_due_date)}</td><td><b>{fmt(r.amount)}</b></td><td>{r.auto_pay?<span className="status-tag status-good">Enabled</span>:<span className="text-muted">Manual</span>}</td><td><span className={`status-tag ${isPaid(r)?'status-good':'status-pending'}`}>{isPaid(r)?'Paid':'Due'}</span></td><td><div className="row-actions"><button className="btn btn-sm btn-secondary" onClick={()=>markRecurringPaid(r)} disabled={paidBusy.includes(r.id)||isPaid(r)}>{paidBusy.includes(r.id)?'Saving…':isPaid(r)?'Paid':'Mark paid'}</button><button className="icon-btn" onClick={()=>{setEditing(r);setModal('recurring')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>{if(confirm('Delete this recurring payment?'))removeRecord('recurring_payments',r.id,setRecurring,recurring)}}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></section></>;
}
function ReportsPage(p){
 const {transactions,monthlySeries,needs,wants,year,setYear,month,setMonth}=p;
 const yearly=transactions.filter(t=>(t.transaction_date||'').startsWith(year));
 const yIncome=yearly.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount),0),yExpenses=yearly.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount),0);
 const byMonth=Array.from({length:12},(_,i)=>{const m=`${year}-${String(i+1).padStart(2,'0')}`,tx=yearly.filter(t=>(t.transaction_date||'').slice(0,7)===m);return {month:new Date(m+'-15T12:00:00').toLocaleDateString('en-US',{month:'short'}),Income:tx.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount),0),Expenses:tx.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount),0)}});
 const yNeeds=yearly.filter(t=>t.type==='Expense'&&t.need_want==='Need').reduce((s,t)=>s+Number(t.amount),0),yWants=yearly.filter(t=>t.type==='Expense'&&t.need_want==='Want').reduce((s,t)=>s+Number(t.amount),0);
 const cats=expenseCategories.map(c=>({name:c,value:yearly.filter(t=>t.type==='Expense'&&t.category===c).reduce((s,t)=>s+Number(t.amount),0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
 return <><PageHeading eyebrow="UNDERSTAND YOUR MONEY" title="Reports & insights" subtitle="Look back, spot patterns, and plan your next move." actions={<><button className="btn btn-secondary" onClick={()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(byMonth),'Monthly summary');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(cats.map(c=>({Category:c.name,Expense:c.value,SharePercent:yExpenses?Math.round(c.value/yExpenses*100):0}))),'Categories');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(yearly.map(t=>({Date:t.transaction_date,Type:t.type,Category:t.category,Description:t.description,Amount:t.amount,NeedOrWant:t.need_want,PaymentMethod:t.payment_method,Notes:t.notes}))), 'Transactions');XLSX.writeFile(wb,`forma-report-${year}.xlsx`)}}><Download size={16}/> Export report</button><div className="year-picker"><CalendarDays size={16}/><select value={year} onChange={e=>setYear(e.target.value)}>{Array.from({length:Math.max(6,new Date().getFullYear()-2020+2)},(_,i)=>new Date().getFullYear()+1-i).sort((a,b)=>b-a).map(y=><option key={y}>{y}</option>)}</select></div></>}/>
 <div className="metric-grid three"><MetricCard label={`${year} income`} value={fmt(yIncome)} icon={ArrowDownRight} tone="green" note="year to date"/><MetricCard label={`${year} expenses`} value={fmt(yExpenses)} icon={ArrowUpRight} tone="orange" note="year to date"/><MetricCard label="Net cash flow" value={fmt(yIncome-yExpenses)} icon={TrendingUp} tone="blue" note="income minus expenses"/></div>
 <div className="metric-grid three"><MetricCard label="Average daily expenses" value={fmt(yExpenses/(new Date().getFullYear()===Number(year)?Math.max(1,Math.floor((Date.now()-new Date(Number(year),0,1).getTime())/86400000)+1):((Number(year)%4===0&&Number(year)%100!==0)||Number(year)%400===0?366:365)))} icon={CalendarDays} tone="orange" note="expenses divided by elapsed days"/><MetricCard label="Average monthly expenses" value={fmt(yExpenses/(Number(year)===new Date().getFullYear()?Math.max(1,new Date().getMonth()+1):12))} icon={TrendingUp} tone="blue" note={Number(year)===new Date().getFullYear()?'average per elapsed month':'annual total ÷ 12'}/><MetricCard label="Expense transactions" value={yearly.filter(t=>t.type==='Expense').length} icon={ArrowLeftRight} tone="purple" note="count for selected year"/></div>
 <div className="dashboard-grid report-charts"><section className="panel chart-panel"><div className="panel-header"><div><h2>Yearly cash flow</h2><p>Monthly income compared with spending</p></div></div><div className="chart-legend"><span><i className="legend-dot income-dot"/> Income</span><span><i className="legend-dot expense-dot"/> Expenses</span></div><div className="line-chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={byMonth} margin={{top:8,right:8,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#9ba2af',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9ba2af',fontSize:11}} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={36}/><Tooltip formatter={v=>fmt(v)}/><Bar dataKey="Income" fill="#50b99a" radius={[5,5,0,0]}/><Bar dataKey="Expenses" fill="#f1b15d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section>
 <section className="panel"><div className="panel-header"><div><h2>Needs vs. wants</h2><p>How spending splits</p></div></div><div className="report-split"><div className="split-big"><span className="need-dot"/> <div><b>{fmt(yNeeds)}</b><small>Needs · {yExpenses?Math.round(yNeeds/yExpenses*100):0}%</small></div></div><div className="split-big"><span className="want-dot"/> <div><b>{fmt(yWants)}</b><small>Wants · {yExpenses?Math.round(yWants/yExpenses*100):0}%</small></div></div><div className="stacked-progress"><span style={{width:`${yExpenses?yNeeds/yExpenses*100:0}%`}}/><span style={{width:`${yExpenses?yWants/yExpenses*100:0}%`}}/></div><p className="small-muted">Categorize expenses as Needs or Wants when recording a transaction to improve this report.</p></div></section></div>
 <section className="panel report-categories"><div className="panel-header"><div><h2>Top spending categories</h2><p>Across {year}</p></div></div>{cats.length?cats.slice(0,8).map((c,i)=><div className="report-category-row" key={c.name}><span className="category-color" style={{background:palette[i%palette.length]}}/><span>{c.name}</span><div className="report-bar"><i style={{width:`${c.value/(cats[0].value||1)*100}%`,background:palette[i%palette.length]}}/></div><b>{fmt(c.value)}</b></div>):<EmptyState icon={ChartNoAxesCombined} title="No yearly data yet" text="Once you record transactions, your annual reports will appear here."/>}</section>
 <section className="panel insights-panel"><div className="insight-icon"><Sparkles size={18}/></div><div><h2>Your {year} money recap</h2><p>{yIncome===0&&yExpenses===0?'Your yearly insights will appear as you record income and expenses.':`You recorded ${fmt(yIncome)} in income and ${fmt(yExpenses)} in expenses. Your net cash flow is ${fmt(yIncome-yExpenses)}. ${yExpenses?`Your biggest category is ${cats[0]?.name||'not categorized'} at ${fmt(cats[0]?.value||0)}.`:''} ${yIncome?`Your savings rate is ${Math.round((yIncome-yExpenses)/yIncome*100)}%.`:''}`}</p></div></section></>;
}

function AccountsPage({accounts,transactions,setModal,setEditing,removeRecord,setAccounts,currency}){
 const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);
 const rows=accounts.map(a=>{const linked=transactions.filter(t=>t.account_id===a.id);const inflow=linked.filter(t=>t.type==='Income').reduce((s,t)=>s+Number(t.amount||0),0);const outflow=linked.filter(t=>t.type==='Expense').reduce((s,t)=>s+Number(t.amount||0),0);return {...a,balance:Number(a.opening_balance||0)+inflow-outflow,inflow,outflow,linkedCount:linked.length}});
 const total=rows.reduce((s,a)=>s+a.balance,0);
 return <><PageHeading eyebrow="YOUR MONEY, ORGANIZED" title="Accounts & wallets" subtitle="Track cash, bank accounts, and e-wallets in one place. Balances include only transactions linked to each account." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('account')}}><Plus size={17}/> Add account</button>}/><div className="metric-grid"><MetricCard label="Tracked balance" value={fmt(total)} icon={Wallet} tone="blue" note="opening balances + linked activity"/><MetricCard label="Accounts" value={String(accounts.length)} icon={CreditCard} tone="green" note="cash, bank, and wallets"/><MetricCard label="Linked transactions" value={String(rows.reduce((s,a)=>s+a.linkedCount,0))} icon={ArrowLeftRight} tone="orange" note="across these accounts"/></div>{rows.length?<div className="goal-grid">{rows.map((a,i)=><section className="panel goal-card" key={a.id}><div className="goal-card-top"><div className={`goal-big-icon goal-tone-${i%4}`}><Wallet size={22}/></div><div className="goal-menu"><button className="icon-btn" onClick={()=>{setEditing(a);setModal('account')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" onClick={()=>{if(confirm('Delete this account? Existing transactions will remain but will no longer contribute to this balance.'))removeRecord('financial_accounts',a.id,setAccounts,accounts)}}><Trash2 size={15}/></button></div></div><h3>{a.name}</h3><p className="goal-deadline">{a.type}</p><div className="goal-amounts"><div><span>Current tracked balance</span><b>{fmt(a.balance)}</b></div><div><span>Opening balance</span><b>{fmt(a.opening_balance)}</b></div></div><div className="split-note"><span>Money in: {fmt(a.inflow)}</span><span>Money out: {fmt(a.outflow)}</span></div><p className="goal-note">{a.linkedCount} linked transaction{a.linkedCount===1?'':'s'}. Add or edit a transaction to link it to this account.</p></section>)}</div>:<EmptyState icon={Wallet} title="No accounts yet" text="Add a cash, bank, or wallet account to start tracking balances."/>}</>;
}
function CashFlowCalendar({transactions,recurring,month,setMonth,currency}){
 const [selected,setSelected]=useState('');const [yy,mm]=month.split('-').map(Number);const first=new Date(yy,mm-1,1);const days=new Date(yy,mm,0).getDate();const offset=(first.getDay()+6)%7;
 const events={};const add=(date,item)=>{if(!date||date.slice(0,7)!==month)return;(events[date] ||= []).push(item)};
 transactions.forEach(t=>add(t.transaction_date,{kind:t.type==='Income'?'income':'expense',title:t.description||t.category,amount:Number(t.amount||0),label:t.type}));
 recurring.filter(r=>r.next_due_date).forEach(r=>add(r.next_due_date,{kind:'due',title:r.name,amount:Number(r.amount||0),label:'Due'}));
 const daysWithEvents=Object.keys(events).length;const dayEvents=events[selected]||[];const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);
 return <><PageHeading eyebrow="PLAN AHEAD" title="Cash flow calendar" subtitle="See recorded income and spending alongside upcoming recurring due dates." actions={<MonthPicker month={month} setMonth={setMonth}/>}/><section className="panel calendar-panel"><div className="calendar-heading"><button className="icon-btn" onClick={()=>setMonth(m=>{const [y,n]=m.split('-').map(Number);return `${n===1?y-1:y}-${String(n===1?12:n-1).padStart(2,'0')}`})}><ChevronLeft size={18}/></button><h2>{new Date(yy,mm-1,15).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h2><button className="icon-btn" onClick={()=>setMonth(m=>{const [y,n]=m.split('-').map(Number);return `${n===12?y+1:y}-${String(n===12?1:n+1).padStart(2,'0')}`})}><ChevronRight size={18}/></button></div><div className="calendar-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div className="calendar-weekday" key={d}>{d}</div>)}{Array.from({length:offset},(_,i)=><div className="calendar-empty" key={'e'+i}/>)}{Array.from({length:days},(_,i)=>{const d=i+1;const key=`${month}-${String(d).padStart(2,'0')}`;const ev=events[key]||[];return <button key={key} className={`calendar-day ${selected===key?'selected':''} ${key===localISODate()?'today':''}`} onClick={()=>setSelected(key)}><span>{d}</span><div className="calendar-dots">{ev.slice(0,3).map((e,j)=><i key={j} className={`calendar-dot ${e.kind}`}/>)}</div>{ev.length>0&&<small>{ev.length} item{ev.length>1?'s':''}</small>}</button>})}</div><div className="calendar-legend"><span><i className="calendar-dot income"/> Income</span><span><i className="calendar-dot expense"/> Expense</span><span><i className="calendar-dot due"/> Recurring due</span></div></section><section className="panel"><div className="panel-header"><div><h2>{selected?new Date(selected+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}):'Select a day'}</h2><p>{dayEvents.length?`${dayEvents.length} scheduled or recorded item${dayEvents.length===1?'':'s'}`:'Choose a day to inspect transactions and due dates.'}</p></div></div>{dayEvents.length?dayEvents.map((e,i)=><div className="upcoming-row" key={i}><div className={`upcoming-icon ${e.kind}`}><CalendarDays size={17}/></div><div className="upcoming-info"><b>{e.title}</b><span>{e.label}</span></div><strong className={e.kind==='income'?'amount-income':e.kind==='expense'?'amount-expense':''}>{e.kind==='income'?'+':e.kind==='expense'?'−':''}{fmt(e.amount)}</strong></div>):<p className="small-muted">No items for this date. Calendar events come from your saved transactions and recurring payment due dates; Forma does not predict salary dates unless you record them.</p>}</section><p className="small-muted">{daysWithEvents} day{daysWithEvents===1?'':'s'} with activity this month. Recurring due dates are reminders, not automatic payments.</p></>;
}
function DebtsPage({debts,setModal,setEditing,removeRecord,setDebts,currency}){
 const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);const total=debts.reduce((s,d)=>s+Number(d.remaining_amount||0),0);const payments=debts.reduce((s,d)=>s+Number(d.monthly_payment||0),0);
 return <><PageHeading eyebrow="COMMITMENTS" title="Debts & installments" subtitle="Keep outstanding balances, installment amounts, and due dates visible. Forma will not pay lenders for you." actions={<button className="btn btn-primary" onClick={()=>{setEditing(null);setModal('debt')}}><Plus size={17}/> Add debt</button>}/><div className="metric-grid"><MetricCard label="Outstanding balance" value={fmt(total)} icon={CreditCard} tone="orange" note="remaining across debts"/><MetricCard label="Planned installments" value={fmt(payments)} icon={CalendarDays} tone="blue" note="per payment cycle"/><MetricCard label="Active debts" value={String(debts.filter(d=>Number(d.remaining_amount)>0).length)} icon={ShieldCheck} tone="green" note="with a balance remaining"/></div>{debts.length?<section className="panel table-panel"><div className="table-wrap"><table className="data-table"><thead><tr><th>Debt / lender</th><th>Remaining</th><th>Original</th><th>Installment</th><th>Next due</th><th>Actions</th></tr></thead><tbody>{debts.map(d=><tr key={d.id}><td><div className="transaction-name"><span className="tx-avatar tx-expense"><CreditCard size={16}/></span><span><b>{d.name}</b><small>{d.lender||d.frequency||'Debt'}</small></span></div></td><td><b>{fmt(d.remaining_amount)}</b></td><td>{fmt(d.original_amount)}</td><td>{fmt(d.monthly_payment)}</td><td>{d.due_date?shortDate(d.due_date):'Not set'}</td><td><div className="row-actions"><button className="icon-btn" title="Edit debt" onClick={()=>{setEditing(d);setModal('debt')}}><Pencil size={15}/></button><button className="icon-btn danger-hover" title="Delete debt" onClick={()=>{if(confirm('Delete this debt record?'))removeRecord('debts',d.id,setDebts,debts)}}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></section>:<EmptyState icon={CreditCard} title="No debts tracked" text="Add a loan, credit card balance, or installment plan to see what remains and when payments are due."/>}</>;
}
function InsightsPage({transactions,month,setMonth,budgets,recurring,goals,debts,currency,setPage}){
 const fmt=n=>new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);const [y,m]=month.split('-').map(Number);const previous=new Date(y,m-2,15);const prevKey=`${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,'0')}`;const tx=transactions.filter(t=>(t.transaction_date||'').slice(0,7)===month);const prev=transactions.filter(t=>(t.transaction_date||'').slice(0,7)===prevKey);const sum=(arr,type)=>arr.filter(t=>t.type===type).reduce((s,t)=>s+Number(t.amount||0),0);const income=sum(tx,'Income'),expenses=sum(tx,'Expense'),prevExpenses=sum(prev,'Expense'),net=income-expenses;const daysInMonth=new Date(y,m,0).getDate();const currentMonth=localISODate().slice(0,7);const elapsed=month===currentMonth?Math.max(1,new Date().getDate()):month<currentMonth?daysInMonth:1;const forecast=expenses/elapsed*daysInMonth;const recurringMonthly=recurring.reduce((s,r)=>s+Number(r.amount||0)*(r.frequency==='Weekly'?4.33:r.frequency==='Quarterly'?1/3:r.frequency==='Yearly'?1/12:1),0);const limits=budgets.filter(b=>(b.month||'').slice(0,7)===month);const alerts=limits.map(b=>{const spent=tx.filter(t=>t.type==='Expense'&&t.category===b.category).reduce((s,t)=>s+Number(t.amount||0),0);return {...b,spent,pct:Number(b.amount)?spent/Number(b.amount)*100:0}}).filter(b=>b.pct>=80).sort((a,b)=>b.pct-a.pct);const cats={};tx.filter(t=>t.type==='Expense').forEach(t=>cats[t.category]=(cats[t.category]||0)+Number(t.amount||0));const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];const change=prevExpenses?((expenses-prevExpenses)/prevExpenses)*100:null;const advice=[];if(!tx.length)advice.push('Add transactions for this month to unlock data-based insights.');if(net<0)advice.push(`Recorded spending exceeds income by ${fmt(Math.abs(net))}. Review non-essential categories first.`);if(change!==null&&change>10)advice.push(`Expenses are ${Math.round(change)}% higher than last month. Check the categories that grew most.`);if(change!==null&&change<-10)advice.push(`Expenses are down ${Math.round(Math.abs(change))}% compared with last month.`);if(top)advice.push(`${top[0]} is your highest-spend category at ${fmt(top[1])} this month.`);if(alerts.length)advice.push(`${alerts.length} budget limit${alerts.length===1?' is':'s are'} at 80% or more.`);if(!advice.length)advice.push('Keep recording transactions consistently. Insights improve when both income and spending are captured.');
 return <><PageHeading eyebrow="AUTOMATION & ANALYSIS" title="Insights & forecast" subtitle="Understand recorded patterns and estimate month-end spending from the current daily average." actions={<MonthPicker month={month} setMonth={setMonth}/>}/><div className="metric-grid"><MetricCard label="Current net cash flow" value={fmt(net)} icon={CircleDollarSign} tone={net>=0?'green':'orange'} note="income minus expenses"/><MetricCard label="Month-end expense estimate" value={fmt(forecast)} icon={TrendingUp} tone="blue" note={month===localISODate().slice(0,7)?`based on ${elapsed} elapsed day(s)`:month<localISODate().slice(0,7)?'completed month total':'early estimate; future month'}/><MetricCard label="Expected recurring costs" value={fmt(recurringMonthly)} icon={Repeat2} tone="orange" note="normalized monthly equivalent"/><MetricCard label="Debt remaining" value={fmt(debts.reduce((s,d)=>s+Number(d.remaining_amount||0),0))} icon={CreditCard} tone="blue" note="tracked debt records"/></div><div className="content-grid"><section className="panel"><div className="panel-header"><div><h2><Sparkles size={17}/> Smart financial insights</h2><p>Generated from the transactions and budgets you have saved.</p></div></div>{advice.map((a,i)=><div className="insight-row" key={i}><span className="insight-bullet"><Sparkles size={15}/></span><p>{a}</p></div>)}<div className="panel-footer-action"><button className="btn btn-secondary" onClick={()=>setPage('Transactions')}>Review transactions <ArrowUpRight size={15}/></button></div></section><section className="panel"><div className="panel-header"><div><h2>Budget alerts</h2><p>Alerts at 80% of the monthly category limit.</p></div></div>{alerts.length?alerts.map(a=><div className="budget-alert-row" key={a.id}><div className="budget-alert-top"><b>{a.category}</b><span>{Math.round(a.pct)}% used</span></div><div className="progress-track"><span style={{width:`${Math.min(100,a.pct)}%`,background:a.pct>=100?'#ee8291':'#f5b85b'}}/></div><small>{fmt(a.spent)} spent of {fmt(a.amount)}{a.pct>=100?' · Over limit':''}</small></div>):<EmptyState icon={ShieldCheck} title="No budget alerts" text="Set category budgets to receive alerts when spending approaches the limit."/>}<button className="btn btn-secondary" onClick={()=>setPage('Budgets')}>Manage budgets</button></section></div><section className="panel"><div className="panel-header"><div><h2>Forecast notes</h2><p>Use this estimate as a planning aid, not a guaranteed balance.</p></div></div><div className="forecast-grid"><div><span>Estimated remaining income after projected expenses</span><b className={income-forecast>=0?'amount-income':'amount-expense'}>{fmt(income-forecast)}</b></div><div><span>Monthly recurring commitments</span><b>{fmt(recurringMonthly)}</b></div><div><span>Savings goals tracked</span><b>{goals.length}</b></div></div><p className="small-muted">Forecast assumes the current average daily expense continues for the rest of the month. It does not automatically add future salary, due dates, or unrecorded bills to actual transactions.</p></section></>;
}
function AccountModal({initial,onClose,onSave}){const [f,S]=useState({name:initial?.name||'',type:initial?.type||'Bank account',opening_balance:initial?.opening_balance??0,color:initial?.color||'#6c7cf5'});const set=(k,v)=>S(s=>({...s,[k]:v}));return <ModalShell title={initial?'Edit account':'Add account or wallet'} subtitle="Opening balance plus linked transactions determines the tracked balance." onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(f)}}><div className="form-grid"><Field label="Account name" wide><input required maxLength={60} value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Main bank, Cash, Vodafone Cash"/></Field><Field label="Account type"><select value={f.type} onChange={e=>set('type',e.target.value)}>{['Cash','Bank account','Credit card','Digital wallet','Savings account','Other'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Opening balance"><input type="number" step="0.01" required value={f.opening_balance} onChange={e=>set('opening_balance',e.target.value)}/></Field><Field label="Accent color"><select value={f.color} onChange={e=>set('color',e.target.value)}>{[['#6c7cf5','Indigo'],['#50b99a','Green'],['#f5b85b','Amber'],['#ee8291','Rose']].map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></Field></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary"><Check size={16}/>Save account</button></div></form></ModalShell>}
function DebtModal({initial,onClose,onSave,currency='EGP'}){const [f,S]=useState({name:initial?.name||'',lender:initial?.lender||'',original_amount:initial?.original_amount??'',remaining_amount:initial?.remaining_amount??'',monthly_payment:initial?.monthly_payment??'',due_date:initial?.due_date||'',frequency:initial?.frequency||'Monthly',notes:initial?.notes||''});const set=(k,v)=>S(s=>({...s,[k]:v}));return <ModalShell title={initial?'Edit debt or installment':'Add debt or installment'} subtitle="Enter balances from your lender statement; Forma tracks them but does not connect to lenders." onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(f)}}><div className="form-grid"><Field label="Debt name" wide><input required value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Phone installment"/></Field><Field label="Lender"><input value={f.lender} onChange={e=>set('lender',e.target.value)} placeholder="Bank / store / person"/></Field><Field label="Original amount"><input required min="0" type="number" step="0.01" value={f.original_amount} onChange={e=>set('original_amount',e.target.value)}/></Field><Field label="Remaining amount"><input required min="0" type="number" step="0.01" value={f.remaining_amount} onChange={e=>set('remaining_amount',e.target.value)}/></Field><Field label={`Installment (${currency})`}><input min="0" type="number" step="0.01" value={f.monthly_payment} onChange={e=>set('monthly_payment',e.target.value)}/></Field><Field label="Next due date"><input type="date" value={f.due_date} onChange={e=>set('due_date',e.target.value)}/></Field><Field label="Frequency"><select value={f.frequency} onChange={e=>set('frequency',e.target.value)}>{['Weekly','Monthly','Quarterly','Yearly'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Notes" wide><input value={f.notes} onChange={e=>set('notes',e.target.value)}/></Field></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary"><Check size={16}/>Save debt</button></div></form></ModalShell>}

function ModalShell({title,subtitle,onClose,children,wide=false}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className={`modal ${wide?'modal-wide':''}`}><div className="modal-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>{children}</div></div>}
function Field({label,children,wide=false}){return <label className={`field ${wide?'field-wide':''}`}><span>{label}</span>{children}</label>}
function TransactionModal({initial,onClose,onSave,currency='EGP',accounts=[]}){
 const [form,setForm]=useState({transaction_date:initial?.transaction_date||localISODate(),type:initial?.type||'Expense',category:initial?.category||'Food',description:initial?.description||'',amount:initial?.amount??'',need_want:initial?.need_want||'Need',fixed_variable:initial?.fixed_variable||'Variable',payment_method:initial?.payment_method||'Cash',account_id:initial?.account_id||'',recurring:initial?.recurring||false,notes:initial?.notes||''});
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 return <ModalShell title={initial?'Edit transaction':'Add transaction'} subtitle="Capture the details so your reports stay accurate." onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(form)}}><div className="type-toggle"><button type="button" className={form.type==='Expense'?'selected expense-selected':''} onClick={()=>{set('type','Expense');if(!expenseCategories.includes(form.category))set('category','Food')}}>− Expense</button><button type="button" className={form.type==='Income'?'selected income-selected':''} onClick={()=>{set('type','Income');if(!['Salary','Freelance','Bonus','Other'].includes(form.category))set('category','Salary')}}>+ Income</button></div><div className="form-grid"><Field label={`Amount (${currency})`}><input autoFocus required min="0.01" step="0.01" type="number" placeholder="0.00" value={form.amount} onChange={e=>set('amount',e.target.value)}/></Field><Field label="Date"><input required type="date" value={form.transaction_date} onChange={e=>set('transaction_date',e.target.value)}/></Field><Field label="Category"><select value={form.category} onChange={e=>set('category',e.target.value)}>{(form.type==='Income'?['Salary','Freelance','Bonus','Other']:expenseCategories).map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Description"><input placeholder="e.g. Weekly groceries" value={form.description} onChange={e=>set('description',e.target.value)}/></Field>{form.type==='Expense'&&<Field label="Need or want"><select value={form.need_want} onChange={e=>set('need_want',e.target.value)}><option>Need</option><option>Want</option></select></Field>}<Field label="Fixed or variable"><select value={form.fixed_variable} onChange={e=>set('fixed_variable',e.target.value)}><option>Variable</option><option>Fixed</option></select></Field><Field label="Payment method"><select value={form.payment_method} onChange={e=>set('payment_method',e.target.value)}>{['Cash','Debit Card','Credit Card','Bank Transfer','Wallet','Other'].map(c=><option key={c}>{c}</option>)}</select></Field>{accounts.length>0&&<Field label="Account / wallet"><select value={form.account_id} onChange={e=>set('account_id',e.target.value)}><option value="">Not linked</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>}<Field label="Notes"><input placeholder="Optional note" value={form.notes} onChange={e=>set('notes',e.target.value)}/></Field><label className="checkbox-field field-wide"><input type="checkbox" checked={form.recurring} onChange={e=>set('recurring',e.target.checked)}/> This is a recurring transaction</label></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary"><Check size={16}/>{initial?'Save changes':'Add transaction'}</button></div></form></ModalShell>;
}
function GoalModal({initial,onClose,onSave,currency='EGP'}){const [f,S]=useState({name:initial?.name||'',target_amount:initial?.target_amount??'',saved_amount:initial?.saved_amount??0,target_date:initial?.target_date||'',notes:initial?.notes||''});const set=(k,v)=>S(s=>({...s,[k]:v}));return <ModalShell title={initial?'Edit savings goal':'Create savings goal'} subtitle="Give your goal a name, target, and timeline." onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(f)}}><div className="form-grid"><Field label="Goal name" wide><input required placeholder="e.g. Emergency fund, new laptop, travel" value={f.name} onChange={e=>set('name',e.target.value)}/></Field><Field label={`Target amount (${currency})`}><input required type="number" min="1" value={f.target_amount} onChange={e=>set('target_amount',e.target.value)}/></Field><Field label={`Already saved (${currency})`}><input type="number" min="0" value={f.saved_amount} onChange={e=>set('saved_amount',e.target.value)}/></Field><Field label="Target date"><input type="date" value={f.target_date} onChange={e=>set('target_date',e.target.value)}/></Field><Field label="Notes"><input value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Optional"/></Field></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit"><Check size={16}/>Save goal</button></div></form></ModalShell>}
function RecurringModal({initial,onClose,onSave,currency='EGP'}){const [f,S]=useState({name:initial?.name||'',category:initial?.category||'Bills',amount:initial?.amount??'',frequency:initial?.frequency||'Monthly',next_due_date:initial?.next_due_date||'',auto_pay:initial?.auto_pay||false,paid_this_cycle:initial?.paid_this_cycle||false,essential:initial?.essential??true,notes:initial?.notes||''});const set=(k,v)=>S(s=>({...s,[k]:v}));return <ModalShell title={initial?'Edit recurring payment':'Add recurring payment'} subtitle="Keep bills and subscriptions visible before they are due." onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(f)}}><div className="form-grid"><Field label="Payment name" wide><input required value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Internet subscription"/></Field><Field label={`Amount (${currency})`}><input required type="number" min="0" value={f.amount} onChange={e=>set('amount',e.target.value)}/></Field><Field label="Category"><select value={f.category} onChange={e=>set('category',e.target.value)}>{expenseCategories.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Frequency"><select value={f.frequency} onChange={e=>set('frequency',e.target.value)}>{['Weekly','Monthly','Quarterly','Yearly'].map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Next due date"><input type="date" value={f.next_due_date} onChange={e=>set('next_due_date',e.target.value)}/></Field><label className="checkbox-field"><input type="checkbox" checked={f.auto_pay} onChange={e=>set('auto_pay',e.target.checked)}/> Auto-pay enabled</label><label className="checkbox-field"><input type="checkbox" checked={f.essential} onChange={e=>set('essential',e.target.checked)}/> Essential payment</label><Field label="Notes" wide><input value={f.notes} onChange={e=>set('notes',e.target.value)}/></Field></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary"><Check size={16}/>Save payment</button></div></form></ModalShell>}
function BudgetModal({initial,month,onClose,onSave,currency='EGP'}){const [f,S]=useState({category:initial?.category||'Food',month:(initial?.month||monthStart(month)).slice(0,7),amount:initial?.amount??''});const set=(k,v)=>S(s=>({...s,[k]:v}));return <ModalShell title={initial?.id?'Edit budget':'Set a category budget'} subtitle="Choose a monthly limit that feels realistic." onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(f)}}><div className="form-grid"><Field label="Category"><select value={f.category} onChange={e=>set('category',e.target.value)}>{expenseCategories.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Month"><input type="month" required value={f.month} onChange={e=>set('month',e.target.value)}/></Field><Field label={`Monthly budget (${currency})`} wide><input required type="number" min="0" value={f.amount} onChange={e=>set('amount',e.target.value)} placeholder="e.g. 2500"/></Field></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary"><Check size={16}/>Save budget</button></div></form></ModalShell>}
function ImportModal({rows,onClose,onConfirm}){return <ModalShell title="Import transactions" subtitle="Review the first rows before importing them." onClose={onClose} wide><div className="import-summary"><FileSpreadsheet size={22}/><div><b>{rows.length} transactions ready</b><span>Imported records will be added to your ledger.</span></div></div><div className="table-wrap import-table"><table className="data-table"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>{rows.slice(0,8).map((r,i)=><tr key={i}><td>{r.transaction_date}</td><td>{r.type}</td><td>{r.category}</td><td>{r.description}</td><td>{fmt(r.amount)}</td></tr>)}</tbody></table></div>{rows.length>8&&<p className="small-muted">Showing first 8 rows of {rows.length}.</p>}<div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={onConfirm}><Upload size={16}/>Import {rows.length} rows</button></div></ModalShell>}
function AuthScreen(p){
 const {authMode,setAuthMode,authName,setAuthName,authEmail,setAuthEmail,authPassword,setAuthPassword,authMsg,setAuthMsg,busy,signIn,signUp,resetPassword}=p;
 const isSignup=authMode==='signup', isForgot=authMode==='forgot';
 const submit=isSignup?signUp:isForgot?resetPassword:signIn;
 return <main className="auth-page"><section className="auth-visual">
  <div className="auth-brand"><div className="brand-mark"><CircleDollarSign size={23}/></div><span>forma<span className="brand-dot">.</span></span></div>
  <div className="auth-visual-copy"><span className="eyebrow">YOUR MONEY, IN FOCUS</span><h1>A clearer view of your financial life.</h1><p>Track your spending, plan your goals, and keep your finances in sync wherever you are.</p>
   <div className="auth-feature"><span><Check size={16}/></span><div><b>One personal finance workspace</b><small>Transactions, budgets, savings goals and reports</small></div></div>
   <div className="auth-feature"><span><Check size={16}/></span><div><b>Private by design</b><small>Your financial records are separated by account</small></div></div>
  </div><small className="auth-copyright">Forma Finance · Made for mindful money</small></section>
  <section className="auth-panel"><div className="auth-card"><div className="auth-mobile-brand"><div className="brand-mark"><CircleDollarSign size={22}/></div><b>forma<span className="brand-dot">.</span></b></div>
   <span className="eyebrow">{isSignup?'GET STARTED':isForgot?'ACCOUNT RECOVERY':'WELCOME BACK'}</span>
   <h2>{isSignup?'Create your account':isForgot?'Reset your password':'Sign in to Forma'}</h2>
   <p className="auth-subtitle">{isSignup?'Start building a healthier relationship with your money.':isForgot?'We’ll email you a secure password reset link.':'Your finances, right where you left them.'}</p>
   <form className="auth-form auth-main-form" onSubmit={submit}>
    {isSignup&&<label className="auth-field"><span>Full name</span><input autoComplete="name" required value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Your name"/></label>}
    <label className="auth-field"><span>Email address</span><input type="email" autoComplete="email" required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label>
    {!isForgot&&<label className="auth-field"><span>Password</span><input type="password" autoComplete={isSignup?'new-password':'current-password'} minLength={isSignup?8:1} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder={isSignup?'At least 8 characters':'Enter your password'}/></label>}
    {!isSignup&&!isForgot&&<button type="button" className="auth-text-link forgot-link" onClick={()=>{setAuthMode('forgot');setAuthMsg('')}}>Forgot password?</button>}
    <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:null}{busy?'Please wait…':isSignup?'Create account':isForgot?'Send reset link':'Sign in'}</button>
    {authMsg&&<p className={`auth-message ${/check your email|link has been sent|created successfully/i.test(authMsg)?'auth-message-success':'auth-message-error'}`} role="status">{authMsg}</p>}
   </form>
   <div className="auth-switch">{isForgot?<>Remembered your password? <button onClick={()=>{setAuthMode('signin');setAuthMsg('')}}>Back to sign in</button></>:isSignup?<>Already have an account? <button onClick={()=>{setAuthMode('signin');setAuthMsg('')}}>Sign in</button></>:<>New to Forma? <button onClick={()=>{setAuthMode('signup');setAuthMsg('')}}>Create an account</button></>}</div>
   <p className="auth-privacy">Your account and financial data are protected by Supabase authentication and row-level database security.</p>
  </div></section></main>;
}
function SettingsModal(p){
 const {onClose,cloudReady,session,supabase,exportCSV,exportBackup,handleImport,restoreBackup,saveProfile,profileSaving,profileName,currency,timezone}=p;
 const [name,setName]=useState(profileName||'');
 const [curr,setCurr]=useState(currency||'EGP');
 const [zone,setZone]=useState(timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC');
 const zones=typeof Intl.supportedValuesOf==='function'?Intl.supportedValuesOf('timeZone'):['UTC','Africa/Cairo','Europe/London','America/New_York','Asia/Dubai'];
 return <ModalShell title="Settings & profile" subtitle="Manage your identity, regional preferences, and complete backups." onClose={onClose}>
  <div className="settings-section"><h3>Personal profile</h3><form className="auth-form" onSubmit={e=>{e.preventDefault();saveProfile({full_name:name,currency:curr,timezone:zone})}}>
   <Field label="Display name" wide><input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></Field>
   <Field label="Currency"><select value={curr} onChange={e=>setCurr(e.target.value)}>{['EGP','USD','EUR','GBP','SAR','AED','CAD','AUD'].map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
   <Field label="Time zone" wide><select value={zone} onChange={e=>setZone(e.target.value)}>{Array.from(new Set([zone,'Africa/Cairo','UTC',...zones])).map(z=><option key={z} value={z}>{z}</option>)}</select></Field>
   {session&&<p className="small-muted">Account email: <b>{session.user.email}</b></p>}
   <button className="btn btn-primary" type="submit" disabled={profileSaving}>{profileSaving?'Saving…':'Save profile'}</button>
  </form></div>
  <div className="settings-section"><div className="settings-row"><div className="settings-icon"><CircleDollarSign size={19}/></div><div><b>Workspace mode</b><p>{cloudReady?'Your data is stored in your Supabase cloud database':'Local demo mode — data stays in this browser'}</p></div><span className={`status-tag ${cloudReady?'status-good':'status-pending'}`}>{cloudReady?'Cloud ready':'Local'}</span></div>
  {session&&<div className="auth-form"><button className="btn btn-secondary" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/>Sign out</button></div>}
  {!cloudReady&&<div className="setup-note"><CircleHelp size={17}/><p>To enable cloud sync, add your Supabase URL and public anon/publishable key to <code>.env</code>, then run the SQL in <code>supabase/schema.sql</code>. Never use a service-role key in the browser.</p></div>}</div>
  <div className="settings-section"><h3>Backup & restore</h3><div className="settings-actions"><button className="btn btn-secondary" onClick={exportBackup}><FileJson size={16}/>Full JSON backup</button><button className="btn btn-secondary" onClick={exportCSV}><Download size={16}/>Export transactions</button><label className="btn btn-secondary file-btn"><Upload size={16}/>Restore JSON backup<input type="file" accept="application/json,.json" onChange={restoreBackup}/></label><label className="btn btn-secondary file-btn"><FileSpreadsheet size={16}/>Import Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport}/></label></div><p className="small-muted">Full backup includes transactions, budgets, savings goals, recurring payments, accounts and wallets, debts/installments, profile preferences, and currency. Matching cloud IDs are updated; local/demo records without cloud IDs may be added and can duplicate if restored repeatedly. Currency changes the display format only; it does not convert existing amounts. Keep backups private because they contain financial data.</p></div>
  <div className="modal-actions"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
 </ModalShell>;
}

createRoot(document.getElementById('root')).render(<App/>);
