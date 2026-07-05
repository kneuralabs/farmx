// Escape untrusted strings before they touch innerHTML. Every record field
// rendered below is user-editable (vendor profile, booking text, document
// metadata, activity log), so anything interpolated into markup must pass
// through esc() to stay inert.
export function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

export function bClass(s){ return (s==='confirmed'||s==='active'||s==='preferred')?'active':(s==='pending'||s==='onboarding')?'pending':'due'; }
export function bLabel(s){ return {confirmed:'Confirmed',pending:'Awaiting reply',declined:'Declined',due:'Renew',active:'Current',preferred:'Preferred',archived:'Archived',rejected:'Rejected'}[s]||s; }
export function badge(status){ return `<span class="badge ${bClass(status)}">${esc(bLabel(status))}</span>`; }
export function actions(type,id,name){ const n=esc(name); return `<div class="actions"><button class="icon-btn" data-edit="${type}:${id}" aria-label="Edit ${n}" title="Edit">✎</button><button class="icon-btn del" data-del="${type}:${id}" aria-label="Delete ${n}" title="Delete">✕</button></div>`; }

export function money(n){ return '$'+Number(n||0).toLocaleString(); }

export function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200); }
