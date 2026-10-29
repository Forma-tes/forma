

export function PageHeading({eyebrow,title,subtitle,actions,className=''}){const isGreeting=className.includes('greeting-heading')||(typeof title==='string'&&/^(Good morning|Good afternoon|Good evening)/.test(title));return <div className={`page-heading ${className}${isGreeting?' greeting-heading':''}`}><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div><div className="heading-actions">{actions}</div></div>}
