// Single source of truth for Supabase table names and status/stage strings.
// Previously these were repeated as string literals across state.js, main.js
// and render.js — a typo in any one copy would silently break a filter.

export const TABLES = {
  vendors: 'farmx_vendors',
  bookings: 'farmx_bookings',
  docs: 'farmx_docs',
  enterprises: 'farmx_enterprises',
  activity: 'farmx_activity',
  profile: 'farmx_profile'
};

export const VENDOR_STAGE = { PENDING:'pending', ACTIVE:'active', PREFERRED:'preferred', ARCHIVED:'archived' };
export const BOOKING_STATUS = { PENDING:'pending', CONFIRMED:'confirmed', DECLINED:'declined' };
export const ENTERPRISE_STATUS = { PENDING:'pending', ACTIVE:'active', REJECTED:'rejected' };
export const DOC_STATUS = { DUE:'due' };

// Activity feed is capped to the same length client- and server-side.
export const ACTIVITY_LIMIT = 8;
