// Floating replacement for window.confirm()/prompt(), backed by a single
// reused <dialog>. Native <dialog> gives us centered/floating positioning,
// a backdrop, focus trapping and Esc-to-close for free — we just drive its
// content and resolve a promise when it closes.

const dialog = document.getElementById('modalDialog');
const titleEl = document.getElementById('modalTitle');
const bodyEl = document.getElementById('modalBody');
const inputWrap = document.getElementById('modalInputWrap');
const inputLabelEl = document.getElementById('modalInputLabel');
const inputEl = document.getElementById('modalInput');
const confirmBtn = document.getElementById('modalConfirm');
const cancelBtn = document.getElementById('modalCancel');

let activeResolve = null;

function open({title, body, withInput, inputLabel, value, confirmLabel, danger}){
  return new Promise(resolve=>{
    activeResolve = resolve;
    titleEl.textContent = title;
    bodyEl.textContent = body || '';
    bodyEl.hidden = !body;
    inputWrap.hidden = !withInput;
    if(withInput){ inputLabelEl.textContent = inputLabel; inputEl.value = value || ''; }
    confirmBtn.textContent = confirmLabel || 'Confirm';
    confirmBtn.classList.toggle('danger', !!danger);
    dialog.returnValue = 'cancel';
    dialog.showModal();
    if(withInput){ inputEl.focus(); inputEl.select(); }
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
  activeResolve = null;
  if(!resolve) return;
  const confirmed = dialog.returnValue === 'confirm';
  resolve(withInputOpen() ? (confirmed ? inputEl.value : null) : confirmed);
});
function withInputOpen(){ return !inputWrap.hidden; }

export function confirmDialog(message, {title='Confirm', confirmLabel='Confirm', danger=false}={}){
  return open({title, body:message, withInput:false, confirmLabel, danger});
}
export function promptDialog(title, {label, value, confirmLabel='Save'}={}){
  return open({title, body:null, withInput:true, inputLabel:label, value, confirmLabel});
}
