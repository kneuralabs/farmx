// Shared in-memory store for the preview. Every view reads from this single
// object, so a mutation in one role is reflected everywhere on the next render.
// Arrays are mutated in place (push/splice) or reassigned via `state.<key> = …`
// so the live binding is visible across modules that import `state`. The
// store starts empty and is populated from Supabase by loadAll() on boot.

import { supabase } from './supabaseClient.js';
import { TABLES, ACTIVITY_LIMIT } from './constants.js';
import { mapVendor, mapBooking, mapDoc, mapEnterprise, mapProfile, mapActivity } from './mappers.js';

export const state = {
  vendors: [],
  bookings: [],
  docs: [],
  enterprises: [],
  activity: [],
  profile: { name:'', type:'' }
};

// Record-type registry used by the shared edit/delete handlers. `arr()` returns
// the current array reference each call so it stays correct after reassignment.
// `table` names the matching Supabase table; the generic edit handler in
// records.js writes to the `name`/`event` column, which matches the JS field.
export const TYPES = {
  vendor:{arr:()=>state.vendors,label:'Vendor',table:TABLES.vendors},
  booking:{arr:()=>state.bookings,label:'Booking',table:TABLES.bookings},
  doc:{arr:()=>state.docs,label:'Document',table:TABLES.docs},
  enterprise:{arr:()=>state.enterprises,label:'Enterprise',table:TABLES.enterprises}
};

// Loads every table from Supabase and replaces the in-memory arrays. Throws
// on failure so the caller can decide how to surface it to the user.
export async function loadAll(){
  const [vendors,bookings,docs,enterprises,activity,profile]=await Promise.all([
    supabase.from(TABLES.vendors).select('*').order('id'),
    supabase.from(TABLES.bookings).select('*').order('id'),
    supabase.from(TABLES.docs).select('*').order('id'),
    supabase.from(TABLES.enterprises).select('*').order('id'),
    supabase.from(TABLES.activity).select('*').order('created_at',{ascending:false}).limit(ACTIVITY_LIMIT),
    supabase.from(TABLES.profile).select('*').eq('id',1).maybeSingle()
  ]);
  for(const res of [vendors,bookings,docs,enterprises,activity,profile]) if(res.error) throw res.error;

  state.vendors=vendors.data.map(mapVendor);
  state.bookings=bookings.data.map(mapBooking);
  state.docs=docs.data.map(mapDoc);
  state.enterprises=enterprises.data.map(mapEnterprise);
  state.activity=activity.data.map(mapActivity);
  state.profile=mapProfile(profile.data);
}

// Appends to the local activity feed immediately (so the UI never waits on
// the network for its own audit trail) and persists in the background.
export async function logActivity(msg){
  state.activity.unshift({msg,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
  if(state.activity.length>ACTIVITY_LIMIT) state.activity.pop();
  const {error}=await supabase.from(TABLES.activity).insert({msg});
  if(error) console.error('Failed to persist activity log entry:',error);
}
