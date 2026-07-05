// Thin wrapper around the Supabase table calls used for writes. Every form
// handler in main.js and both generic handlers in records.js used to repeat
// the same "insert/update/delete, then check .error" boilerplate — this
// centralizes it in one place instead of nine.

import { supabase } from './supabaseClient.js';

export async function createRecord(table, payload, mapper){
  const {data,error}=await supabase.from(table).insert(payload).select().single();
  return error ? {error} : {record:mapper(data)};
}

export async function updateRecord(table, id, payload){
  const {error}=await supabase.from(table).update(payload).eq('id',id);
  return {error};
}

export async function upsertRecord(table, payload){
  const {error}=await supabase.from(table).upsert(payload);
  return {error};
}

export async function deleteRecord(table, id){
  const {error}=await supabase.from(table).delete().eq('id',id);
  return {error};
}
