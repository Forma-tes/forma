

export function parsePocketDebtDetails(notes){const raw=String(notes||'');const match=raw.match(/\[POCKET_DEBT_DETAILS\]\s*(\{[^\n]*\})/);if(!match)return {};try{return JSON.parse(match[1])||{}}catch{return {}}}

export function cleanPocketDebtNotes(notes){return String(notes||'').replace(/(?:\r?\n)?\[POCKET_DEBT_DETAILS\]\s*\{[^\n]*\}/g,'').trim()}
