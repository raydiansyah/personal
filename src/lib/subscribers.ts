/**
 * Module: Subscriber service
 * Purpose: Persist newsletter subscriptions through the public Supabase policy
 * Used by: PromotionStrip component
 * Dependencies: Supabase browser client; langganan insert policy
 * Public functions: subscribeEmail()
 * Side effects: Writes one email address to Supabase; duplicate emails are treated as already subscribed
 */
import { getSupabaseClient } from './supabase';

export async function subscribeEmail(email: string) {
  const { error } = await getSupabaseClient().from('langganan').insert({ email: email.trim().toLowerCase() });
  if (error && error.code !== '23505') throw error;
}
