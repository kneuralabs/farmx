import { state, loadAll, logActivity } from './state.js';
import { toast } from './format.js';
import { renderAll, renderVendorGrid, renderActivity, onProfileVendorChange } from './render.js';
import { delRec, editRec } from './records.js';
import { selectTab, initTabs } from './navigation.js';
import { supabase } from './supabaseClient.js';

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

document.getElementById('bookingForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const vId=+document.getElementById('e-vendor').value;
  const v=state.vendors.find(x=>x.id===vId);
  const service=document.getElementById('e-service').value;
  const date=document.getElementById('e-date').value;
  const event=service+' — '+date;
  const {data,error}=await supabase.from('farmx_bookings').insert({vendor_id:vId,event,status:'pending'}).select().single();
  if(error){ toast('Could not send booking request'); return; }
  state.bookings.push({id:data.id,vendorId:data.vendor_id,event:data.event,status:data.status});
  await logActivity('Booking requested: '+(v?v.name:'')+' — '+service);
  toast('Booking request sent');
  e.target.reset(); renderAll({type:'booking',id:data.id});
});
document.getElementById('docForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const type=document.getElementById('e-doctype').value;
  const expiry=document.getElementById('e-expiry').value;
  const meta=expiry?('Expires '+expiry):'Pending review';
  const {data,error}=await supabase.from('farmx_docs').insert({name:type,meta,status:'due'}).select().single();
  if(error){ toast('Could not submit document'); return; }
  state.docs.push({id:data.id,name:data.name,meta:data.meta,status:data.status});
  await logActivity('Document uploaded: '+type);
  toast('Document submitted for review');
  e.target.reset(); renderAll({type:'doc',id:data.id});
});
document.getElementById('registerForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.getElementById('r-name').value.trim();
  const cat=document.getElementById('r-cat').value.trim();
  const desc=document.getElementById('r-desc').value.trim();
  if(!name||!cat) return;
  const {data,error}=await supabase.from('farmx_vendors').insert({name,category:cat,description:desc,stage:'pending'}).select().single();
  if(error){ toast('Could not submit registration'); return; }
  state.vendors.push({id:data.id,name:data.name,cat:data.category,desc:data.description,stage:data.stage});
  await logActivity('New vendor registered: '+name);
  toast('Vendor registered — pending admin review');
  e.target.reset(); renderAll({type:'vendor',id:data.id});
});
document.getElementById('profileForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const v=state.vendors.find(x=>x.id==document.getElementById('v-select').value);
  if(!v) return;
  const name=document.getElementById('v-name').value||v.name;
  const cat=document.getElementById('v-cat').value||v.cat;
  const desc=document.getElementById('v-desc').value||v.desc;
  const {error}=await supabase.from('farmx_vendors').update({name,category:cat,description:desc}).eq('id',v.id);
  if(error){ toast('Could not save profile'); return; }
  v.name=name; v.cat=cat; v.desc=desc;
  await logActivity('Vendor profile updated: '+v.name);
  toast('Profile saved');
  renderAll({type:'vendor',id:v.id});
});
document.getElementById('respondForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const bId=+document.getElementById('v-req').value;
  const b=state.bookings.find(x=>x.id===bId);
  if(!b){ toast('No pending request selected'); return; }
  const resp=document.getElementById('v-resp').value;
  const status=resp==='Accept'?'confirmed':resp==='Decline'?'declined':'pending';
  const {error}=await supabase.from('farmx_bookings').update({status}).eq('id',bId);
  if(error){ toast('Could not submit response'); return; }
  b.status=status;
  await logActivity('Vendor responded to '+b.event+': '+resp);
  toast('Response submitted');
  e.target.reset(); renderAll({type:'booking',id:b.id});
});
document.getElementById('reviewForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const ent=state.enterprises.find(x=>x.id==document.getElementById('a-ent').value);
  if(!ent){ toast('No enterprise selected'); return; }
  const decision=document.getElementById('a-decision').value;
  const status=decision==='Approve'?'active':decision==='Reject'?'rejected':'pending';
  const {error}=await supabase.from('farmx_enterprises').update({status}).eq('id',ent.id);
  if(error){ toast('Could not record decision'); return; }
  ent.status=status;
  await logActivity('Enterprise '+decision.toLowerCase()+': '+ent.name);
  toast('Decision recorded');
  e.target.reset(); renderAll({type:'enterprise',id:ent.id});
});
document.getElementById('roleForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=document.getElementById('a-user').value;
  const role=document.getElementById('a-role').value;
  await logActivity('Role granted: '+role+' → '+email);
  toast('Access granted');
  e.target.reset(); renderActivity();
});

async function boot(){
  try{
    await loadAll();
  }catch(err){
    console.error('Failed to load data from Supabase:',err);
    toast('Could not load live data — showing empty state');
  }
  renderAll();
}
boot();
