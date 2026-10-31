import { ArrowUpRight, Check, CreditCard, LoaderCircle, LockKeyhole, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber.jsx';
import { PasswordInput } from '../../components/ui/PasswordInput.jsx';

const GOOGLE=<svg viewBox="0 0 48 48" aria-hidden="true" width="18" height="18"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.95 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;

function initialTheme(){
 try{const s=localStorage.getItem('pocket.loginTheme');if(s==='light'||s==='dark')return s}catch{}
 try{return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch{return 'light'}
}

export function AuthScreen(p){
 const {authMode,setAuthMode,authName,setAuthName,authGender,setAuthGender,authEmail,setAuthEmail,authUsername,setAuthUsername,authPassword,setAuthPassword,authConfirmPassword,setAuthConfirmPassword,authMsg,setAuthMsg,stayLoggedIn,setStayLoggedIn,busy,signIn,signInWithGoogle,signUp,resetPassword,updatePassword,resendConfirmation}=p;
 const mode=authMode==='choice'?'signin':authMode;
 const isSignin=mode==='signin', isSignup=mode==='signup', isForgot=mode==='forgot', isUpdatePassword=mode==='update-password';
 const showTabs=isSignin||isSignup;
 const submit=isSignup?signUp:isForgot?resetPassword:isUpdatePassword?updatePassword:signIn;
 const [theme,setTheme]=useState(initialTheme);
 const toggleTheme=()=>{const next=theme==='dark'?'light':'dark';setTheme(next);try{localStorage.setItem('pocket.loginTheme',next)}catch{}};
 const go=m=>{setAuthMode(m);setAuthMsg('')};
 const headline=['Make','room','for','what','matters.'];
 const title=isSignup?'Create your Pocket':isForgot?'Reset your password':isUpdatePassword?'Choose a new password':'Sign in';
 const subtitle=isSignup?'A clearer view of your money starts with one small step.':isForgot?'We’ll send you a secure link to reset your password.':isUpdatePassword?'Choose a strong password you have not used before.':'Welcome back to your Pocket.';
 const ok=/check your email|link has been sent|created successfully|confirmation email has been sent|account created/i.test(authMsg||'');
 let n=0;const i=()=>({'--i':n++});
 return <main className="lg-page" data-lg-theme={theme}>
  <button type="button" className="lg-theme" onClick={toggleTheme} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} title={theme==='dark'?'Light mode':'Dark mode'}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
  <section className="lg-hero">
   <div className="lg-brand"><img src="/brand/pocket-mark.svg" alt=""/><span>Pocket</span></div>
   <div className="lg-hero-body">
    <h2 className="lg-headline" aria-label="Make room for what matters.">{headline.slice(0,3).map((w,k)=><span key={k} className="lg-word" style={{'--w':k}} aria-hidden="true">{w}</span>)}<span className="lg-accent-group" aria-hidden="true">{headline.slice(3).map((w,k)=><span key={k} className="lg-word lg-accent" style={{'--w':k+3}}>{w}</span>)}</span></h2>
    <p className="lg-lead">One clear view of your money, goals and everyday decisions.</p>
    <div className="lg-preview" aria-hidden="true">
     <div className="lg-preview-top"><span className="lg-preview-title"><span className="lg-preview-icon"><CreditCard size={19}/></span>Next payment</span><span className="lg-chip">In 19 days</span></div>
     <div className="lg-preview-amount"><AnimatedNumber value="EGP 6,200" duration={1400}/></div>
     <div className="lg-bar"><i/></div>
     <div className="lg-preview-foot"><span>EGP 51,050 available</span><span>EGP 8,950 used of EGP 60,000</span></div>
    </div>
   </div>
   <p className="lg-secure"><LockKeyhole size={13}/> Secure sign-in keeps your financial workspace private.</p>
  </section>
  <section className="lg-side">
   <div className="lg-card" key={showTabs?'tabs':mode}>
    {showTabs&&<div className="lg-tabs" role="tablist" data-active={isSignup?'signup':'signin'}>
     <span className="lg-tab-pill" aria-hidden="true"/>
     <button type="button" role="tab" aria-selected={isSignin} className={isSignin?'on':''} onClick={()=>go('signin')}>Sign in</button>
     <button type="button" role="tab" aria-selected={isSignup} className={isSignup?'on':''} onClick={()=>go('signup')}>Create account</button>
    </div>}
    <div className="lg-form-head" key={mode}><h1 style={i()}>{title}</h1><p style={i()}>{subtitle}</p></div>
    <form className="lg-form" key={`f-${mode}`} onSubmit={submit}>
     {isSignup&&<>
      <label className="lg-field" style={i()}><span>Full name</span><input autoComplete="name" required value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="What should we call you?"/></label>
      <fieldset className="lg-field lg-gender" style={i()}><legend>Gender</legend><div className="lg-pills">{[{value:'female',label:'Female'},{value:'male',label:'Male'},{value:'prefer_not_to_say',label:'Prefer not to say'}].map(g=><button key={g.value} type="button" className={authGender===g.value?'on':''} aria-pressed={authGender===g.value} onClick={()=>setAuthGender(g.value)}>{authGender===g.value&&<Check size={14}/>}{g.label}</button>)}</div><small>Used to personalize suggested transaction categories. You can change it later in Account &amp; Profile.</small></fieldset>
     </>}
     {!isUpdatePassword&&<label className="lg-field" style={i()}><span>{isSignin?'Email or username':isSignup?'Email address (optional)':'Email address'}</span><input type={isSignin?'text':'email'} autoComplete={isSignin?'username':'email'} required={!isSignup} value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label>}
     {isSignup&&!authEmail.trim()&&<label className="lg-field" style={i()}><span>Username</span><input autoComplete="username" required minLength={3} maxLength={32} value={authUsername} onChange={e=>setAuthUsername(e.target.value)} placeholder="e.g. nora.m"/><small>No email? Pick a username to sign in with. Without an email you can’t reset your password by email. You can add one later in your profile.</small></label>}
     {!isForgot&&<label className="lg-field" style={i()}><span>{isUpdatePassword?'New password':'Password'}</span><PasswordInput autoComplete={isSignup||isUpdatePassword?'new-password':'current-password'} minLength={isSignup||isUpdatePassword?8:1} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder={isSignup||isUpdatePassword?'At least 8 characters':'Enter your password'}/></label>}
     {isUpdatePassword&&<label className="lg-field" style={i()}><span>Confirm new password</span><PasswordInput autoComplete="new-password" minLength={8} required value={authConfirmPassword} onChange={e=>setAuthConfirmPassword(e.target.value)} placeholder="Enter the new password again"/></label>}
     {isSignin&&<div className="lg-options" style={i()}><label className="lg-check"><input type="checkbox" checked={stayLoggedIn} onChange={e=>setStayLoggedIn(e.target.checked)}/><span>Stay logged in</span></label><button type="button" className="lg-link" onClick={()=>go('forgot')}>Forgot password?</button></div>}
     <button className="lg-submit" type="submit" disabled={busy} style={i()}>{busy?<LoaderCircle size={18} className="spin"/>:null}<span>{busy?'Please wait…':isSignup?'Create account':isForgot?'Send reset link':isUpdatePassword?'Update password':'Sign in'}</span>{!busy&&<ArrowUpRight size={17} className="lg-submit-arrow" aria-hidden="true"/>}</button>
     {!isForgot&&!isUpdatePassword&&<>
      <div className="lg-or" style={i()}><span/>or<span/></div>
      <button type="button" className="lg-google" onClick={signInWithGoogle} disabled={busy} style={i()}>{GOOGLE}<span>Continue with Google</span></button>
     </>}
     {authMsg&&<p className={`lg-msg ${ok?'ok':'bad'}`} role="status">{authMsg}</p>}
     {isSignin&&/not confirmed|confirmation email|confirm your email/i.test(authMsg||'')&&<button type="button" className="lg-link lg-resend" onClick={resendConfirmation} disabled={busy}>{busy?'Sending…':'Resend confirmation email'}</button>}
    </form>
    {(isForgot||isSignin||isSignup)&&<p className="lg-switch" style={i()}>{isForgot?<>Remembered your password? <button type="button" className="lg-link" onClick={()=>go('signin')}>Back to sign in</button></>:isSignup?<>Already have a Pocket account? <button type="button" className="lg-link" onClick={()=>go('signin')}>Sign in</button></>:<>New to Pocket? <button type="button" className="lg-link" onClick={()=>go('signup')}>Create an account</button></>}</p>}
   </div>
   <p className="lg-secure lg-secure-mobile"><LockKeyhole size={13}/> Secure sign-in keeps your financial workspace private.</p>
  </section>
 </main>;
}
