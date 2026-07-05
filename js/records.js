import { state, TYPES, logActivity } from './state.js';
import { toast } from './format.js';
import { renderAll } from './render.js';
import { deleteRecord, updateRecord } from './api.js';
import { confirmDialog, promptDialog } from './modal.js';

export async function delRec(type,id){
  const t=TYPES[type]; const arr=t.arr(); const idx=arr.findIndex(r=>r.id===id);
  if(idx<0) return;
  const ok=await confirmDialog("This can't be undone.",{title:'Delete this '+t.label.toLowerCase()+'?',confirmLabel:'Delete',danger:true});
  if(!ok) return;
  const rec=arr[idx];
  const {error}=await deleteRecord(t.table,id);
  if(error){ toast('Could not delete — try again'); return; }
  if(type==='vendor'){ state.bookings=state.bookings.filter(b=>b.vendorId!==id); }
  arr.splice(idx,1);
  await logActivity(t.label+' deleted: '+(rec.name||rec.event));
  toast(t.label+' deleted');
  renderAll();
}
export async function editRec(type,id){
  const t=TYPES[type]; const rec=t.arr().find(r=>r.id===id);
  if(!rec) return;
  const key=type==='booking'?'event':'name';
  const val=await promptDialog('Edit '+t.label,{label:t.label,value:rec[key]});
  if(!val) return;
  const {error}=await updateRecord(t.table,id,{[key]:val});
  if(error){ toast('Could not save — try again'); return; }
  rec[key]=val;
  await logActivity(t.label+' updated: '+val);
  toast(t.label+' updated');
  renderAll({type,id});
}
