import { state, TYPES, log } from './state.js';
import { toast } from './format.js';
import { renderAll } from './render.js';

export function delRec(type,id){
  const t=TYPES[type]; const arr=t.arr(); const idx=arr.findIndex(r=>r.id===id);
  if(idx<0) return;
  if(!confirm('Delete this '+t.label.toLowerCase()+'?')) return;
  const rec=arr[idx];
  if(type==='vendor'){ state.bookings=state.bookings.filter(b=>b.vendorId!==id); }
  arr.splice(idx,1);
  log(t.label+' deleted: '+(rec.name||rec.event));
  toast(t.label+' deleted');
  renderAll();
}
export function editRec(type,id){
  const t=TYPES[type]; const rec=t.arr().find(r=>r.id===id);
  if(!rec) return;
  const key=type==='booking'?'event':'name';
  const val=prompt('Edit '+t.label+':',rec[key]);
  if(val){ rec[key]=val; log(t.label+' updated: '+val); toast(t.label+' updated'); renderAll({type,id}); }
}
