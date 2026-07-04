// Shared in-memory store for the preview. Every view reads from this single
// object, so a mutation in one role is reflected everywhere on the next render.
// Arrays are mutated in place (push/splice) or reassigned via `state.<key> = …`
// so the live binding is visible across modules that import `state`.

export const state = {
  nextId: 100,
  vendors: [
    {id:1,name:'Sourwood Sound Co.',cat:'Musicians',desc:'Bluegrass and acoustic sets for orchard and vineyard events. Fully insured.',stage:'preferred'},
    {id:2,name:'Copper Kettle Catering',cat:'Food Vendor',desc:'Farm-to-table catering, seasonal menus, on-site service for 20–400 guests.',stage:'preferred'},
    {id:3,name:'Redline Rentals',cat:'Equipment Supplier',desc:'Tents, tables, generators — same-week delivery within the region.',stage:'preferred'},
    {id:4,name:'Piedmont Photo',cat:'Photography',desc:'Event and product photography specializing in agritourism venues.',stage:'active'},
    {id:5,name:'Maple Row Makers',cat:'Craft Vendor',desc:'Handmade goods and farm-branded merchandise.',stage:'active'},
    {id:6,name:'Foothill Transport',cat:'Transportation',desc:'Shuttle and hayride services for large-scale farm events.',stage:'pending'},
    {id:7,name:'Blue Ridge Educators',cat:'Educational Programming',desc:'School-group tours and hands-on agricultural learning workshops.',stage:'pending'},
    {id:8,name:'Old Mill Caterers',cat:'Food Vendor',desc:'Previous catering partner, no longer active.',stage:'archived'}
  ],
  bookings: [
    {id:1,vendorId:1,event:'Harvest Festival — Oct 4',status:'confirmed'},
    {id:2,vendorId:2,event:'Cider Tasting — Sep 21',status:'pending'},
    {id:3,vendorId:3,event:'Tent & Tables — Oct 4',status:'confirmed'}
  ],
  docs: [
    {id:1,name:'Liability Insurance',meta:'Expires Aug 2',status:'due'},
    {id:2,name:'Food Handler Permit',meta:'Expires Sep 15',status:'due'},
    {id:3,name:'Zoning Certificate',meta:'Valid through 2027',status:'active'}
  ],
  enterprises: [
    {id:1,name:'Green Gable Farm Market',type:'Retail / Direct-to-Consumer',status:'pending'},
    {id:2,name:'Millhouse Distillery',type:'Distillery',status:'due'},
    {id:3,name:'Stone Hollow Winery',type:'Winery',status:'active'}
  ],
  activity: []
};

// Record-type registry used by the shared edit/delete handlers. `arr()` returns
// the current array reference each call so it stays correct after reassignment.
export const TYPES = {
  vendor:{arr:()=>state.vendors,label:'Vendor'},
  booking:{arr:()=>state.bookings,label:'Booking'},
  doc:{arr:()=>state.docs,label:'Document'},
  enterprise:{arr:()=>state.enterprises,label:'Enterprise'}
};

export function log(msg){
  state.activity.unshift({msg,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
  if(state.activity.length>8) state.activity.pop();
}
