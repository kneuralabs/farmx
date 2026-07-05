// Converts Supabase rows (snake_case columns) into the camelCase shape the
// UI reads from `state`. Previously duplicated inline in both state.js
// (loadAll) and each insert handler in main.js, so the two copies could
// silently drift apart.

export const mapVendor = v => ({
  id: v.id, name: v.name, cat: v.category, desc: v.description,
  stage: v.stage, availFrom: v.available_from, availTo: v.available_until
});

export const mapBooking = b => ({
  id: b.id, vendorId: b.vendor_id, event: b.event, status: b.status, budget: b.budget
});

export const mapDoc = d => ({ id: d.id, name: d.name, meta: d.meta, status: d.status });

export const mapEnterprise = e => ({ id: e.id, name: e.name, type: e.type, status: e.status });

export const mapProfile = p => p ? { name: p.name, type: p.type } : { name:'', type:'' };

export const mapActivity = a => ({
  msg: a.msg,
  time: new Date(a.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
});
