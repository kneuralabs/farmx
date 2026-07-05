// Uses the vendored UMD build (js/vendor/supabase.js, loaded as a plain
// <script> before this module) instead of a CDN import, so the app has no
// runtime dependency on a third-party script host.

// Public anon key for a no-login preview: RLS on the farmx_* tables grants it
// full read/write, so exposing it in client code is expected, not a leak.
const SUPABASE_URL = 'https://brysartqcjylgqwmnjkk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeXNhcnRxY2p5bGdxd21uamtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjgyNzMsImV4cCI6MjA5MTkwNDI3M30.CanSxg9nrotjPuoFnGUaU6WMOxLovAtzNONS_JJ1WVY';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
