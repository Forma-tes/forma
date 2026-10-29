

export function Field({label,children,wide=false}){return <label className={`field ${wide?'field-wide':''}`}><span>{label}</span>{children}</label>}
