import { Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PAGE_TIPS } from './pageTips.js';

function TipButton({ tips }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  return <span className="tip-wrap" ref={ref}>
    <button type="button" className="tip-btn" aria-label="Tips for this page" aria-expanded={open} onClick={() => setOpen(o => !o)}><Info size={16}/></button>
    {open && <div className="tip-pop" role="dialog" aria-label="Page tips">
      <div className="tip-head"><b>Tips</b><button type="button" aria-label="Close tips" onClick={() => setOpen(false)}><X size={14}/></button></div>
      <ul>{tips.map((t, i) => <li key={i} style={{ '--i': i }}>{t}</li>)}</ul>
      <button type="button" className="tip-replay" onClick={() => { setOpen(false); window.dispatchEvent(new Event('pocket:tour')); }}>Replay app tour</button>
    </div>}
  </span>;
}

export function PageHeading({eyebrow,title,subtitle,actions,className=''}){
  const isGreeting=className.includes('greeting-heading')||(typeof title==='string'&&/^(Good morning|Good afternoon|Good evening)/.test(title));
  const tips=isGreeting?PAGE_TIPS.overview:(typeof title==='string'?PAGE_TIPS[title]:null);
  return <div className={`page-heading ${className}${isGreeting?' greeting-heading':''}`}><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}{tips&&!isGreeting&&<TipButton tips={tips}/>}</h1>{subtitle&&<p>{subtitle}</p>}</div><div className="heading-actions">{tips&&isGreeting&&<TipButton tips={tips}/>}{actions}</div></div>
}
