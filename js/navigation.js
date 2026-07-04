// Role tab switcher: shows one .view at a time and keeps ARIA/roving-tabindex
// state in sync. selectTab is also invoked from the vendor grid's "Request
// booking" action to jump the user to the Enterprise view.
let tabs = [];

export function selectTab(btn,focus){
  if(!btn) return;
  tabs.forEach(t=>{ const on=t===btn; t.classList.toggle('active',on); t.setAttribute('aria-selected',on?'true':'false'); t.tabIndex=on?0:-1; });
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(btn.dataset.view).classList.add('active');
  if(focus) btn.focus();
}

export function initTabs(){
  const roleSwitch=document.getElementById('roleSwitch');
  tabs=[...roleSwitch.querySelectorAll('button[role="tab"]')];
  roleSwitch.addEventListener('click',e=>{ selectTab(e.target.closest('button[role="tab"]')); });
  roleSwitch.addEventListener('keydown',e=>{
    const i=tabs.indexOf(document.activeElement); if(i<0) return;
    let n=null;
    if(e.key==='ArrowRight'||e.key==='ArrowDown') n=(i+1)%tabs.length;
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp') n=(i-1+tabs.length)%tabs.length;
    else if(e.key==='Home') n=0;
    else if(e.key==='End') n=tabs.length-1;
    if(n!==null){ e.preventDefault(); selectTab(tabs[n],true); }
  });
}
