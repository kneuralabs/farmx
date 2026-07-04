import { state, log } from './state.js';
import { toast } from './format.js';
import { renderAll, renderVendorGrid, renderActivity, onProfileVendorChange } from './render.js';
import { delRec, editRec } from './records.js';
import { selectTab, initTabs } from './navigation.js';

initTabs();

// Delegated actions for the edit/delete icon buttons and the "book" CTA.
document.addEventListener('click',e=>{
  const d=e.target.closest('[data-del]'); if(d){ const [type,id]=d.dataset.del.split(':'); delRec(type,+id); return; }
  const ed=e.target.closest('[data-edit]'); if(ed){ const [type,id]=ed.dataset.edit.split(':'); editRec(type,+id); return; }
  const bk=e.target.closest('[data-book]'); if(bk){
    selectTab(document.getElementById('tab-enterprise'));
    document.getElementById('e-vendor').value=bk.dataset.book;
    document.getElementById('e-service').focus();
  }
});

document.getElementById('vSearch').addEventListener('input',e=>renderVendorGrid(e.target.value));
document.getElementById('v-select').addEventListener('change',onProfileVendorChange);

document.getElementById('bookingForm').addEventListener('submit',e=>{
  e.preventDefault();
  const vId=+document.getElementById('e-vendor').value;
  const v=state.vendors.find(x=>x.id===vId);
  const service=document.getElementById('e-service').value;
  const date=document.getElementById('e-date').value;
  const id=state.nextId++;
  state.bookings.push({id,vendorId:vId,event:service+' — '+date,status:'pending'});
  log('Booking requested: '+(v?v.name:'')+' — '+service);
  toast('Booking request sent');
  e.target.reset(); renderAll({type:'booking',id});
});
document.getElementById('docForm').addEventListener('submit',e=>{
  e.preventDefault();
  const type=document.getElementById('e-doctype').value;
  const expiry=document.getElementById('e-expiry').value;
  const id=state.nextId++;
  state.docs.push({id,name:type,meta:expiry?('Expires '+expiry):'Pending review',status:'due'});
  log('Document uploaded: '+type);
  toast('Document submitted for review');
  e.target.reset(); renderAll({type:'doc',id});
});
document.getElementById('profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  const v=state.vendors.find(x=>x.id==document.getElementById('v-select').value);
  if(!v) return;
  v.name=document.getElementById('v-name').value||v.name;
  v.cat=document.getElementById('v-cat').value||v.cat;
  v.desc=document.getElementById('v-desc').value||v.desc;
  log('Vendor profile updated: '+v.name);
  toast('Profile saved');
  renderAll({type:'vendor',id:v.id});
});
document.getElementById('respondForm').addEventListener('submit',e=>{
  e.preventDefault();
  const bId=+document.getElementById('v-req').value;
  const b=state.bookings.find(x=>x.id===bId);
  if(!b){ toast('No pending request selected'); return; }
  const resp=document.getElementById('v-resp').value;
  b.status=resp==='Accept'?'confirmed':resp==='Decline'?'declined':'pending';
  log('Vendor responded to '+b.event+': '+resp);
  toast('Response submitted');
  e.target.reset(); renderAll({type:'booking',id:b.id});
});
document.getElementById('reviewForm').addEventListener('submit',e=>{
  e.preventDefault();
  const ent=state.enterprises.find(x=>x.id==document.getElementById('a-ent').value);
  if(!ent){ toast('No enterprise selected'); return; }
  const decision=document.getElementById('a-decision').value;
  ent.status=decision==='Approve'?'active':decision==='Reject'?'rejected':'pending';
  log('Enterprise '+decision.toLowerCase()+': '+ent.name);
  toast('Decision recorded');
  e.target.reset(); renderAll({type:'enterprise',id:ent.id});
});
document.getElementById('roleForm').addEventListener('submit',e=>{
  e.preventDefault();
  const email=document.getElementById('a-user').value;
  const role=document.getElementById('a-role').value;
  log('Role granted: '+role+' → '+email);
  toast('Access granted');
  e.target.reset(); renderActivity();
});

renderAll();
