import { ArrowUpRight, Check, LoaderCircle, LockKeyhole, Sparkles, X } from 'lucide-react';
import { PasswordInput } from '../../components/ui/PasswordInput.jsx';

export function AuthScreen(p){
 const {authMode,setAuthMode,authName,setAuthName,authGender,setAuthGender,authEmail,setAuthEmail,authPassword,setAuthPassword,authConfirmPassword,setAuthConfirmPassword,authMsg,setAuthMsg,stayLoggedIn,setStayLoggedIn,busy,signIn,signInWithGoogle,signUp,resetPassword,updatePassword,resendConfirmation}=p;
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
      {!isForgot&&<label className="auth-field"><span>{isUpdatePassword?'New password':'Password'}</span><PasswordInput autoComplete={isSignup||isUpdatePassword?'new-password':'current-password'} minLength={isSignup||isUpdatePassword?8:1} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder={isSignup||isUpdatePassword?'At least 8 characters':'Enter your password'}/></label>}
      {isUpdatePassword&&<label className="auth-field"><span>Confirm new password</span><PasswordInput autoComplete="new-password" minLength={8} required value={authConfirmPassword} onChange={e=>setAuthConfirmPassword(e.target.value)} placeholder="Enter the new password again"/></label>}
      {!isSignup&&!isForgot&&!isUpdatePassword&&<div className="auth-login-options"><label className="stay-logged-in"><input type="checkbox" checked={stayLoggedIn} onChange={e=>setStayLoggedIn(e.target.checked)}/><span>Stay logged in</span></label><button type="button" className="auth-text-link forgot-link" onClick={()=>{setAuthMode('forgot');setAuthMsg('')}}>Forgot password?</button></div>}
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
