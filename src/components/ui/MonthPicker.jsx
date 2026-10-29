import { CalendarDays } from 'lucide-react';

export function MonthPicker({month,setMonth}){return <div className="month-picker"><CalendarDays size={16}/><input aria-label="Selected month" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>}
