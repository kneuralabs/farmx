// Shared in-memory store for the preview. Every view reads from this single
// object, so a mutation in one role is reflected everywhere on the next render.
// Arrays are mutated in place (push/splice) or reassigned via `state.<key> = …`
// so the live binding is visible across modules that import `state`. The
// store starts empty and is populated from Supabase by loadAll() on boot.

import { supabase } from './supabaseClient.js';

export const state = {
  vendors: [],
  bookings: [],
  docs: [],
  enterprises: [],
  activity: []
};

// Record-type registry used by the shared edit/delete handlers. `arr()` returns
// the current array reference each call so it stays correct after reassignment.
// `table` names the matching Supabase table; the generic edit handler in
// records.js writes to the `name`/`event` column, which matches the JS field.
export const TYPES = {
  vendor:{arr:()=>state.vendors,label:'Vendor',table:'farmx_vendors'},
  booking:{arr:()=>state.bookings,label:'Booking',table:'farmx_bookings'},
  doc:{arr:()=>state.docs,label:'Document',table:'farmx_docs'},
  enterprise:{arr:()=>state.enterprises,label:'Enterprise',table:'farmx_enterprises'}
};

// Loads every table from Supabase and replaces the in-memory arrays. Throws
// on failure so the caller can decide how to surface it to the user.
export async function loadAll(){
  const [vendors,bookings,docs,enterprises,activity]=await Promise.all([
    supabase.from('farmx_vendors').select('*').order('id'),
    supabase.from('farmx_bookings').select('*').order('id'),
    supabase.from('farmx_docs').select('*').order('id'),
    supabase.from('farmx_enterprises').select('*').order('id'),
    supabase.from('farmx_activity').select('*').order('created_at',{ascending:false}).limit(8)
  ]);
  for(const res of [vendors,bookings,docs,enterprises,activity]) if(res.error) throw res.error;

  state.vendors=vendors.data.map(v=>({id:v.id,name:v.name,cat:v.category,desc:v.description,stage:v.stage}));
  state.bookings=bookings.data.map(b=>({id:b.id,vendorId:b.vendor_id,event:b.event,status:b.status}));
  state.docs=docs.data.map(d=>({id:d.id,name:d.name,meta:d.meta,status:d.status}));
  state.enterprises=enterprises.data.map(e=>({id:e.id,name:e.name,type:e.type,status:e.status}));
  state.activity=activity.data.map(a=>({msg:a.msg,time:new Date(a.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}));
}

// Appends to the local activity feed immediately (so the UI never waits on
// the network for its own audit trail) and persists in the background.
export async function logActivity(msg){
  state.activity.unshift({msg,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
  if(state.activity.length>8) state.activity.pop();
  const {error}=await supabase.from('farmx_activity').insert({msg});
  if(error) console.error('Failed to persist activity log entry:',error);
}
