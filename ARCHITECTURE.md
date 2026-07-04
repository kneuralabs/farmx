# FarmX MVP — Architecture Review & Refactor Notes

A senior-engineer walkthrough of the codebase as it was, the problems found, and
the refactor applied to `index.html`. **No functional behavior was changed** — this
was a code-quality, scalability, and maintainability pass. The one exception is a
clearly-unintended dead-control fix, called out explicitly below.

---

## 1. What this app actually is

FarmX is a **single-file, client-only prototype** (`index.html`, ~590 lines of inline
JS) for an "enterprise ↔ vendor" marketplace in the agritourism space (wineries,
farms, caterers, musicians, etc.). It is served as a static page on GitHub Pages
(`CNAME` → `farmx.kneuralabs.com`).

There is **no backend**. The entire "database" lives in a single `localStorage` key,
`farmx_data`, as one JSON blob:

```
farmx_data = {
  enterprises: [], vendors: [], relationships: [],
  bookings: [], documents: [], nextId: <int>
}
```

### Domain model (reverse-engineered)

| Entity        | Key fields                                                        | Notes |
|---------------|------------------------------------------------------------------|-------|
| `enterprise`  | id, ownerId, name, activities[], status, contacts[], locations[] | The primary business (farm/winery). |
| `vendor`      | id, ownerId, businessName, categories[], status                  | A service provider. |
| `relationship`| enterpriseId, vendorId, status, notes                            | Many-to-many tag between an enterprise and a vendor. **Has no `id`.** |
| `booking`     | id, enterpriseId, vendorId, eventName, date, bookingStatus, paymentStatus | Event request + payment lifecycle. |
| `document`    | id, entityType, entityId, docType, fileName, uploadDate          | Polymorphic (attaches to enterprise *or* vendor). |

`status` drives everything: entities are `pending` → `approved`/`rejected` by an admin;
only `approved` vendors appear in the directory.

### Roles & data flow

There is no real auth. A **role dropdown** maps to a hard-coded `currentUserId`:

```
enterprise → user-ent-1
vendor     → user-ven-1
admin      → admin-1
```

The runtime loop is:

```
Role change / tab change
        │
        ▼
  render<X>()  ──reads──►  getData()  ──parse──►  localStorage
        │
        ▼
  innerHTML = string   (string-concatenated HTML)
        │
   user acts (button)
        │
        ▼
  window.<handler>()  ──mutate──►  saveData()  ──stringify──►  localStorage
        │
        ▼
  re-render the same view
```

Views are keyed off two Bootstrap events/patterns: `shown.bs.tab` (re-render the
activated pane) and a role-selector change (swap the whole tab set + dashboard).

---

## 2. Problems found

### Bad architecture decisions
- **No separation of concerns.** Data access, business rules, HTML templating, and
  event wiring were interleaved inside each `render*` function. A single function both
  queried storage *and* built markup *and* registered global click handlers.
- **`window.*` handlers redefined on every render.** `window.addOrUpdateRelationship`,
  `window.createBooking`, `window.approveEntity`, etc. were reassigned each time a view
  rendered — global-namespace churn and a subtle source of stale-closure bugs.
- **Inline `onclick` with interpolated user data.** e.g.
  `onclick="alert('Vendor: ' + v.businessName + ...)"`. Any apostrophe or quote in the
  data breaks the handler outright — and it is an injection vector.

### Security (correctness) — XSS everywhere
- Every dynamic value (`businessName`, `description`, `notes`, `eventName`, `email`,
  `phone`, …) was concatenated **raw** into `innerHTML`. A vendor named
  `<img src=x onerror=…>` executes script. This is both a security hole and a
  functional bug (data with `<`, `&`, or quotes renders wrong).

### Duplicate logic
- The **"find my entity by ownerId"** lookup was copy-pasted into ~10 render functions.
- The **vendor `<option>` list** was built inline in two places (relationships + bookings).
- **approve vs. reject** were near-identical functions differing only by a status string.
- **Enterprise vs. vendor document** rendering was duplicated.
- Enum option lists (activities, relationship statuses, doc types) were hand-written HTML.

### Performance bottlenecks
- **`getData()` re-parsed the entire JSON blob on every call**, and each render called it
  multiple times — plus `getEnterprise`/`getVendor` each did their own `getData()` +
  `Array.find`. A single dashboard render parsed the whole DB several times over.

### Scalability risks
- A single JSON blob in `localStorage` (~5 MB cap) is the whole datastore; every write
  re-serializes everything. Fine for a demo, a wall for real data.
- `nextId` is a shared client-side counter — guaranteed collisions across devices/tabs.
- Directory search is a full linear scan with no indexing.

### Maintainability issues
- A **debug `alert('✅ FarmX script started…')` fired on every page load** — a diagnostic
  artifact left in production.
- **The role selector was dead:** `window.switchRole` was defined but never wired to the
  `<select>` (`no onchange`, no listener). Switching roles did nothing, even though role
  switching is the app's headline feature.
- A `<p>No vendors found.</p>` fallback was **dead code** — the string it guarded was
  always truthy.
- 10-second `setTimeout` overlay hack + broad `try/catch` around everything masked errors.

---

## 3. Clean architecture (as refactored)

The script is now organised into explicit, top-to-bottom layers inside the IIFE. It
remains a single zero-build file **on purpose** — introducing a bundler/module system
for a static prototype adds deployment risk without payoff — but the layering is now
"ready to split" into modules the moment a backend arrives.

```
1. Config / enums    — ACTIVITY_OPTIONS, RELATIONSHIP_STATUSES, DOC_TYPES, ROLE_USER
2. Storage adapter   — localStorage with in-memory fallback (unchanged intent)
3. Store             — ONE parsed cache; load-once, mutate-in-place, save-on-write
4. Selectors         — myEnterprise(), vendorById(), … pure reads over the Store
5. DOM utilities     — esc() (HTML escaping), $(), setHtml(), val(), optionList()
6. Views             — pure HTML builders, grouped by role (enterprise/vendor/admin)
7. Actions           — the ONLY functions that mutate + persist
8. Controller        — role switch, tab routing (TAB_RENDERERS map),
                        single delegated click/submit handlers (CLICK_ACTIONS map)
9. Bootstrap         — seedDemoData() + init()
```

### Key improvements (all behavior-preserving)
- **Single Store cache** replaces repeated `JSON.parse`. Cross-tab correctness kept via a
  `storage`-event listener that invalidates the cache (matches the original's
  "always read from storage" semantics).
- **`esc()` on every interpolated value** — closes the XSS holes; renders identically for
  normal data.
- **Event delegation** — two document-level listeners dispatch via `data-action`
  attributes and `CLICK_ACTIONS`/`TAB_RENDERERS` maps. No more `window.*` handlers,
  no inline `onclick`, no per-render re-binding.
- **Deduplicated** — one `myEnterprise()`/`myVendor()`, one `vendorOptions()`, one
  `setEntityStatus(type,id,status)` for approve/reject, one `registrationItem()`,
  enums rendered by `optionList()`.
- **Removed the debug `alert()`** and the dead "No vendors found" branch.

### The one intentional behavior fix
The role selector is now wired (`change → updateUI`). It was defined-but-dead in the
original; leaving it dead would have preserved a bug, not functionality. This is the
single functional change and is isolated to one listener — trivially revertable.

---

## 4. Refactoring strategy going forward (path to production)

This prototype's data model is deliberately backend-shaped. The recommended evolution,
in order of leverage:

1. **Extract a `DataStore` interface.** The `Store` + `Selectors` + `Actions` layers
   already isolate all persistence. Swap the localStorage implementation for a REST/
   Supabase client behind the same interface — views/controller are untouched.
2. **Real auth & tenancy.** Replace the `role → hard-coded userId` map with a session;
   `ownerId` filtering becomes server-side row-level security.
3. **Server-generated IDs.** Retire the client `nextId` counter (UUIDs or DB sequences).
4. **Move rendering to a component model.** The `View` builders are already pure
   `data → HTML` functions; they map cleanly onto a template/component library if/when
   the UI grows beyond a prototype.
5. **Indexing/pagination** for the directory and lists once data outgrows a linear scan.

---

## 5. Verification

The refactor was smoke-tested headless (Chromium/Playwright) to confirm equivalence:
seed data, role switching (enterprise/vendor/admin), relationship upsert, booking
creation, document upload flipping the dashboard's "docs complete" flag, admin
approve/reject, enterprise creation, `localStorage` persistence across reload, cross-tab
cache invalidation, and confirmation that an injected `<img onerror>` payload is escaped
and inert. No console/page errors.
