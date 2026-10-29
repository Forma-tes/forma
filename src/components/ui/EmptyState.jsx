

export function EmptyState({icon:Icon,title,text,action,actionLabel}){return <div className="empty-state"><div className="empty-icon"><Icon size={21}/></div><b>{title}</b><p>{text}</p>{action&&<button className="btn btn-secondary btn-sm" onClick={action}>{actionLabel||'Add new'}</button>}</div>}
