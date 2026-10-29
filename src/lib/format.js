

export function titleCaseName(value){return String(value||'').trim().replace(/\s+/g,' ').split(' ').map(part=>part?part.charAt(0).toLocaleUpperCase()+part.slice(1).toLocaleLowerCase():'').join(' ');}

// Explicit timezone choices used by Account & Profile; avoids a runtime crash when opening the modal.
export const zones = ['Africa/Cairo','Africa/Casablanca','Africa/Johannesburg','Asia/Dubai','Asia/Riyadh','Asia/Kuwait','Asia/Qatar','Asia/Amman','Europe/London','Europe/Paris','Europe/Berlin','America/New_York','America/Chicago','America/Los_Angeles','Asia/Tokyo','Australia/Sydney'];

export const palette = ['#6c7cf5','#50b99a','#f5b85b','#ee8291','#9b8af7','#59a8d8','#e79a6c','#7e9b87'];

export const localISODate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const monthNow = localISODate().slice(0,7);

export const fmt = n => { let currency='EGP'; try { currency=null||'EGP'; } catch {} return new Intl.NumberFormat('en-EG',{style:'currency',currency,maximumFractionDigits:currency==='EGP'?0:2}).format(Number(n)||0); };

export const firstName = name => String(name||'').trim().split(/\s+/)[0] || '';

export const getGreeting = (timezone) => { let hour=new Date().getHours(); try { if(timezone) hour=Number(new Intl.DateTimeFormat('en-US',{hour:'2-digit',hourCycle:'h23',timeZone:timezone}).format(new Date())); } catch {} return hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'; };

export const addFrequency = (date, frequency) => { const step=d=>{if(frequency==='Weekly')d.setDate(d.getDate()+7);else if(frequency==='Monthly')d.setMonth(d.getMonth()+1);else if(frequency==='Quarterly')d.setMonth(d.getMonth()+3);else d.setFullYear(d.getFullYear()+1);return d;};let d=new Date(`${date||localISODate()}T12:00:00`);d=step(d);while(localISODate(d)<=localISODate())d=step(d);return localISODate(d); };

export const shortDate = d => d ? new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'No date';

export const monthLabel = m => new Date(m+'-15T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'});

export const monthStart = m => `${m}-01`;

export const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random());
