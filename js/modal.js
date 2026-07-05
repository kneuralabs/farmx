// Floating replacement for window.confirm()/prompt(), backed by a single
// reused <dialog>. Native <dialog> gives us centered/floating positioning,
// a backdrop, focus trapping and Esc-to-close for free — we just drive its
// content and resolve a promise when it closes.

const dialog = document.getElementById('modalDialog');
const titleEl = document.getElementById('modalTitle');
const bodyEl = document.getElementById('modalBody');
const fieldsEl = document.getElementById('modalFields');
const confirmBtn = document.getElementById('modalConfirm');
const cancelBtn = document.getElementById('modalCancel');

let activeResolve = null;
let activeFields = null;

// Builds the markup for one form field. Values are never interpolated here —
// they're assigned via the `.value` property after insertion — so record
// data (vendor names, enterprise types, …) never touches innerHTML.
function fieldMarkup(f){
  const id = 'mf-'+f.key;
  const req = f.required ? ' required' : '';
  if(f.type==='textarea') return `<div class="field full"><label for="${id}">${f.label}</label><textarea id="${id}"${req}></textarea></div>`;
  if(f.type==='select') return `<div class="field"><label for="${id}">${f.label}</label><select id="${id}">${f.options.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>`;
  return `<div class="field"><label for="${id}">${f.label}</label><input id="${id}" type="${f.type||'text'}"${req}></div>`;
}

function open({title, body, fields, confirmLabel, danger}){
  return new Promise(resolve=>{
    activeResolve = resolve;
    activeFields = fields || null;
    titleEl.textContent = title;
    bodyEl.textContent = body || '';
    bodyEl.hidden = !body;
    fieldsEl.hidden = !fields;
    fieldsEl.innerHTML = fields ? fields.map(fieldMarkup).join('') : '';
    if(fields) for(const f of fields) document.getElementById('mf-'+f.key).value = f.value ?? '';
    confirmBtn.textContent = confirmLabel || 'Confirm';
    confirmBtn.classList.toggle('danger', !!danger);
    dialog.returnValue = 'cancel';
    dialog.showModal();
    if(fields){ const first=document.getElementById('mf-'+fields[0].key); first.focus(); if(first.select) first.select(); }
    else if(danger) cancelBtn.focus();
    else confirmBtn.focus();
  });
}

// Click on the backdrop (outside the dialog's own box) closes it like Cancel.
dialog.addEventListener('click', e=>{
  const r = dialog.getBoundingClientRect();
  const inside = e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom;
  if(!inside) dialog.close('cancel');
});

dialog.addEventListener('close', ()=>{
  const resolve = activeResolve;
  const fields = activeFields;
  activeResolve = null;
  activeFields = null;
  if(!resolve) return;
  const confirmed = dialog.returnValue === 'confirm';
  if(!fields){ resolve(confirmed); return; }
  if(!confirmed){ resolve(null); return; }
  const values = {};
  for(const f of fields){
    const raw = document.getElementById('mf-'+f.key).value;
    values[f.key] = f.type==='number' ? (raw===''?null:+raw) : f.type==='date' ? (raw||null) : raw;
  }
  resolve(values);
});

export function confirmDialog(message, {title='Confirm', confirmLabel='Confirm', danger=false}={}){
  return open({title, body:message, fields:null, confirmLabel, danger});
}

// Renders one field per entry in `fields` (each: {key,label,type,value,options,required,full})
// and resolves to an object keyed by field.key, or null if the user cancels.
export function formDialog(title, fields, {confirmLabel='Save'}={}){
  return open({title, body:null, fields, confirmLabel});
}
