import { LoaderCircle, LockKeyhole, Mail } from 'lucide-react';

export function AccessRestricted({profile,onBack,onRequestAccess,requestBusy=false}){
 return <section className="panel access-restricted"><div className="empty-state"><span className="empty-icon"><LockKeyhole size={24}/></span><h2>Access needed</h2><p>Your Pocket account is created, but workspace access has not been enabled yet. Request access and the administrator will be notified privately.</p><button className="btn btn-primary" onClick={onRequestAccess} disabled={requestBusy}>{requestBusy?<LoaderCircle size={16} className="spin"/>:<Mail size={16}/>} Request access</button><button className="btn btn-secondary" onClick={onBack}>Go to available workspace</button><small>Account role: {profile?.role||'user'}</small></div></section>;
}
