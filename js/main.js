import { state, loadAll, logActivity } from './state.js';
import { toast } from './format.js';
import { renderAll, renderVendorGrid, renderActivity, renderProfile, onProfileVendorChange, renderVendorSpotlight } from './render.js';
import { delRec, editRec } from './records.js';
import { selectTab, initTabs } from './navigation.js';
import { createRecord, updateRecord, upsertRecord } from './api.js';
import { mapVendor, mapBooking, mapDoc, mapEnterprise } from './mappers.js';
import { TABLES, BOOKING_STATUS, ENTERPRISE_STATUS, DOC_STATUS } from './constants.js';

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
document.getElementById('vSpotlightSelect').addEventListener('change',renderVendorSpotlight);

document.getElementById('bookingForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const vId=+document.getElementById('e-vendor').value;
  const v=state.vendors.find(x=>x.id===vId);
  const service=document.getElementById('e-service').value;
  const date=document.getElementById('e-date').value;
  const budget=document.getElementById('e-budget').value;
  const event=service+' — '+date;
  const {record,error}=await createRecord(TABLES.bookings,{vendor_id:vId,event,status:BOOKING_STATUS.PENDING,budget:budget===''?null:+budget},mapBooking);
  if(error){ toast('Could not send booking request'); return; }
  state.bookings.push(record);
  await logActivity('Booking requested: '+(v?v.name:'')+' — '+service);
  toast('Booking request sent');
  e.target.reset(); renderAll({type:'booking',id:record.id});
});
document.getElementById('docForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const type=document.getElementById('e-doctype').value;
  const expiry=document.getElementById('e-expiry').value;
  const meta=expiry?('Expires '+expiry):'Pending review';
  const {record,error}=await createRecord(TABLES.docs,{name:type,meta,status:DOC_STATUS.DUE},mapDoc);
  if(error){ toast('Could not submit document'); return; }
  state.docs.push(record);
  await logActivity('Document uploaded: '+type);
  toast('Document submitted for review');
  e.target.reset(); renderAll({type:'doc',id:record.id});
});
document.getElementById('profileForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const v=state.vendors.find(x=>x.id==document.getElementById('v-select').value);
  if(!v) return;
  const name=document.getElementById('v-name').value||v.name;
  const cat=document.getElementById('v-cat').value||v.cat;
  const desc=document.getElementById('v-desc').value||v.desc;
  const from=document.getElementById('v-from').value||null;
  const to=document.getElementById('v-to').value||null;
  const {error}=await updateRecord(TABLES.vendors,v.id,{name,category:cat,description:desc,available_from:from,available_until:to});
  if(error){ toast('Could not save profile'); return; }
  v.name=name; v.cat=cat; v.desc=desc; v.availFrom=from; v.availTo=to;
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
  const status=resp==='Accept'?BOOKING_STATUS.CONFIRMED:resp==='Decline'?BOOKING_STATUS.DECLINED:BOOKING_STATUS.PENDING;
  const {error}=await updateRecord(TABLES.bookings,bId,{status});
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
  const status=decision==='Approve'?ENTERPRISE_STATUS.ACTIVE:decision==='Reject'?ENTERPRISE_STATUS.REJECTED:ENTERPRISE_STATUS.PENDING;
  const {error}=await updateRecord(TABLES.enterprises,ent.id,{status});
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
document.getElementById('profileEntForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.getElementById('ent-name').value;
  const type=document.getElementById('ent-type').value;
  const {error}=await upsertRecord(TABLES.profile,{id:1,name,type});
  if(error){ toast('Could not save business profile'); return; }
  state.profile={name,type};
  await logActivity('Business profile updated: '+name);
  toast('Business profile saved');
  renderProfile();
});
document.getElementById('addVendorForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.getElementById('nv-name').value;
  const cat=document.getElementById('nv-cat').value;
  const stage=document.getElementById('nv-stage').value;
  const desc=document.getElementById('nv-desc').value;
  const {record,error}=await createRecord(TABLES.vendors,{name,category:cat,description:desc,stage},mapVendor);
  if(error){ toast('Could not add vendor'); return; }
  state.vendors.push(record);
  await logActivity('Vendor added: '+name);
  toast('Vendor added');
  e.target.reset(); renderAll({type:'vendor',id:record.id});
});
document.getElementById('addEnterpriseForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.getElementById('ne-name').value;
  const type=document.getElementById('ne-type').value;
  const {record,error}=await createRecord(TABLES.enterprises,{name,type,status:ENTERPRISE_STATUS.PENDING},mapEnterprise);
  if(error){ toast('Could not add enterprise'); return; }
  state.enterprises.push(record);
  await logActivity('Enterprise added: '+name);
  toast('Enterprise added');
  e.target.reset(); renderAll({type:'enterprise',id:record.id});
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
