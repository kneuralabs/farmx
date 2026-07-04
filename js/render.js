import { state } from './state.js';
import { esc, badge, actions } from './format.js';

// {type,id} of the record that just changed — only it animates (scoped per
// renderAll pass). hiCls appends the animation class to the matching record.
let highlight = null;
function hiCls(type,id,cls){ return highlight&&highlight.type===type&&highlight.id===id?' '+cls:''; }

function renderLedger(){
  const stages=[['preferred','Preferred'],['active','Active'],['pending','Pending'],['archived','Archived']];
  document.getElementById('ledger').innerHTML=stages.map(([key,label])=>{
    const items=state.vendors.filter(v=>v.stage===key);
    return `<div class="lcol"><div class="lcol-head"><span>${label}</span><span class="lcol-count">${items.length}</span></div><div class="lcol-body">`+
      (items.length?items.map(v=>`<div class="lcard${hiCls('vendor',v.id,'pop')}"><div class="lcard-top"><div class="vname">${esc(v.name)}</div>${actions('vendor',v.id,v.name)}</div><div class="vcat">${esc(v.cat)}</div></div>`).join(''):'<div class="empty" style="padding:6px 2px;">No vendors</div>')+
      `</div></div>`;
  }).join('');
}
export function renderVendorGrid(filter){
  filter=(filter||'').toLowerCase();
  const list=state.vendors.filter(v=>!filter||v.name.toLowerCase().includes(filter)||v.cat.toLowerCase().includes(filter));
  document.getElementById('vendorCountLbl').textContent=state.vendors.length+' vendors listed';
  document.getElementById('vendorGrid').innerHTML=list.map(v=>{
    const active=v.stage==='preferred'||v.stage==='active';
    const cta=active?'Request booking':v.stage==='archived'?'Reconnect':'Send invitation';
    const initial=esc((v.name||'').trim().charAt(0).toUpperCase()||'?');
    return `<div class="vcard${hiCls('vendor',v.id,'pop')}">
      <div class="vtop"><div class="avatar" aria-hidden="true">${initial}</div><div class="vtop-right">${v.stage!=='archived'?badge(v.stage):''}${actions('vendor',v.id,v.name)}</div></div>
      <h4>${esc(v.name)}</h4><div class="cat">${esc(v.cat)}</div><div class="desc">${esc(v.desc)}</div>
      <button class="cta ${active?'solid':'ghost'}" data-book="${v.id}">${cta}</button>
    </div>`;}).join('')||'<div class="empty" style="padding:14px 2px;">No vendors match your search.</div>';
}
function renderBookings(){
  document.getElementById('bookingCount').textContent=state.bookings.length;
  document.getElementById('bookingsRow').innerHTML=state.bookings.map(b=>{
    const v=state.vendors.find(x=>x.id===b.vendorId);
    return `<div class="row${hiCls('booking',b.id,'pop')}"><div class="row-left"><div class="name">${esc(v?v.name:'Unknown vendor')}</div><div class="meta">${esc(b.event)}</div></div><div class="row-right">${badge(b.status)}${actions('booking',b.id,b.event)}</div></div>`;
  }).join('')||'<div class="empty">No bookings yet.</div>';
}
function renderDocs(){
  document.getElementById('docsRow').innerHTML=state.docs.map(d=>`<div class="row${hiCls('doc',d.id,'pop')}"><div class="row-left"><div class="name">${esc(d.name)}</div><div class="meta">${esc(d.meta)}</div></div><div class="row-right">${badge(d.status)}${actions('doc',d.id,d.name)}</div></div>`).join('')||'<div class="empty">No documents.</div>';
}
function renderEntTable(){
  document.getElementById('entTable').innerHTML=state.enterprises.map(e=>`<tr class="${hiCls('enterprise',e.id,'flash').trim()}"><td class="name">${esc(e.name)}</td><td class="type">${esc(e.type)}</td><td>${badge(e.status)}</td><td>${actions('enterprise',e.id,e.name)}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">No enterprises.</td></tr>';
}
export function renderActivity(){
  document.getElementById('activityFeed').innerHTML=state.activity.length?state.activity.map(a=>`<div class="row"><div class="name">${esc(a.msg)}</div><div class="meta">${esc(a.time)}</div></div>`).join(''):'<div class="empty">No activity yet — try requesting a booking as an enterprise.</div>';
}

let prevStats={};
function statBlock(id,label,val){ const changed=prevStats[id]!==undefined&&prevStats[id]!==val; prevStats[id]=val; return `<div class="stat${changed?' flash':''}"><div class="num">${esc(val)}</div><div class="lbl">${esc(label)}</div></div>`; }
function renderStats(){
  document.getElementById('entStats').innerHTML=
    statBlock('rel','Active relationships',state.vendors.filter(v=>v.stage==='preferred'||v.stage==='active').length)+
    statBlock('pend','Pending bookings',state.bookings.filter(b=>b.status==='pending').length)+
    statBlock('exp','Documents expiring',state.docs.filter(d=>d.status==='due').length)+
    '<div class="stat"><div class="num">$4,850</div><div class="lbl">Vendor payments due</div></div>';
  document.getElementById('adminStats').innerHTML=
    statBlock('ent','Enterprises',state.enterprises.length)+
    statBlock('ven','Vendors',state.vendors.length)+
    statBlock('bk','Active bookings',state.bookings.filter(b=>b.status!=='declined').length)+
    statBlock('docrev','Docs needing review',state.docs.filter(d=>d.status==='due').length);
}

let lastProfileVendorId=null;
function refreshSelect(id,list,valFn,labelFn,emptyLabel){
  const el=document.getElementById(id);
  const prev=el.value;
  el.innerHTML=list.length?list.map(item=>`<option value="${esc(valFn(item))}">${esc(labelFn(item))}</option>`).join(''):`<option value="">${esc(emptyLabel)}</option>`;
  if(list.some(item=>String(valFn(item))===prev)) el.value=prev;
}
function renderSelects(){
  refreshSelect('e-vendor',state.vendors,v=>v.id,v=>v.name,'No vendors');
  refreshSelect('v-select',state.vendors,v=>v.id,v=>v.name,'No vendors');
  if(document.getElementById('v-select').value!==String(lastProfileVendorId)){ fillProfileForm(); lastProfileVendorId=document.getElementById('v-select').value; }
  const pend=state.bookings.filter(b=>b.status==='pending');
  refreshSelect('v-req',pend,b=>b.id,b=>{const v=state.vendors.find(x=>x.id===b.vendorId);return (v?v.name:'Vendor')+' — '+b.event;},'No pending requests');
  refreshSelect('a-ent',state.enterprises,e=>e.id,e=>e.name,'No enterprises');
}
export function fillProfileForm(){
  const v=state.vendors.find(x=>x.id==document.getElementById('v-select').value)||state.vendors[0];
  if(!v) return;
  document.getElementById('v-name').value=v.name;
  document.getElementById('v-cat').value=v.cat;
  document.getElementById('v-desc').value=v.desc;
}
// Called when the vendor <select> changes: always refill the form and remember
// the selection so the next renderSelects pass leaves the user's edits alone.
export function onProfileVendorChange(){
  fillProfileForm();
  lastProfileVendorId=document.getElementById('v-select').value;
}

export function renderAll(hl){
  highlight = hl || null; // scope the pop/flash animation to the one record that changed
  renderLedger(); renderVendorGrid(document.getElementById('vSearch').value); renderBookings(); renderDocs(); renderEntTable(); renderActivity(); renderStats(); renderSelects();
  highlight = null;
}
