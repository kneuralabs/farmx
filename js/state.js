// Shared in-memory store for the preview. Every view reads from this single
// object, so a mutation in one role is reflected everywhere on the next render.
// Arrays are mutated in place (push/splice) or reassigned via `state.<key> = …`
// so the live binding is visible across modules that import `state`. The
// store starts empty and is populated from Supabase by loadAll() on boot.

import { supabase } from './supabaseClient.js';
import { TABLES, ACTIVITY_LIMIT, VENDOR_STAGE, BOOKING_STATUS, ENTERPRISE_STATUS } from './constants.js';
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
// `table` names the matching Supabase table. `fields` lists every editable
// property for the generic edit modal in records.js — `key` is the JS/state
// property name, `col` the matching Supabase column.
export const TYPES = {
  vendor:{
    arr:()=>state.vendors, label:'Vendor', table:TABLES.vendors,
    fields:[
      {key:'name', col:'name', label:'Business name', type:'text', required:true},
      {key:'cat', col:'category', label:'Service category', type:'text', required:true},
      {key:'stage', col:'stage', label:'Relationship stage', type:'select', options:[[VENDOR_STAGE.PENDING,'Pending'],[VENDOR_STAGE.ACTIVE,'Active'],[VENDOR_STAGE.PREFERRED,'Preferred'],[VENDOR_STAGE.ARCHIVED,'Archived']]},
      {key:'availFrom', col:'available_from', label:'Available from', type:'date'},
      {key:'availTo', col:'available_until', label:'Available until', type:'date'},
      {key:'desc', col:'description', label:'Service description', type:'textarea', full:true}
    ]
  },
  booking:{
    arr:()=>state.bookings, label:'Booking', table:TABLES.bookings,
    fields:[
      {key:'event', col:'event', label:'Event', type:'text', required:true},
      {key:'budget', col:'budget', label:'Budget (USD)', type:'number'},
      {key:'status', col:'status', label:'Status', type:'select', options:[[BOOKING_STATUS.PENDING,'Awaiting reply'],[BOOKING_STATUS.CONFIRMED,'Confirmed'],[BOOKING_STATUS.DECLINED,'Declined']]}
    ]
  },
  doc:{
    arr:()=>state.docs, label:'Document', table:TABLES.docs,
    fields:[
      {key:'name', col:'name', label:'Document type', type:'text', required:true},
      {key:'meta', col:'meta', label:'Details', type:'text'}
    ]
  },
  enterprise:{
    arr:()=>state.enterprises, label:'Enterprise', table:TABLES.enterprises,
    fields:[
      {key:'name', col:'name', label:'Enterprise name', type:'text', required:true},
      {key:'type', col:'type', label:'Enterprise type', type:'text', required:true},
      {key:'status', col:'status', label:'Decision', type:'select', options:[[ENTERPRISE_STATUS.PENDING,'Pending'],[ENTERPRISE_STATUS.ACTIVE,'Approve'],[ENTERPRISE_STATUS.REJECTED,'Reject']]}
    ]
  }
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
