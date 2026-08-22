/**
 * Module: Public contact inquiry service
 * Purpose: Submit qualified project inquiries through the protected notification function with a CAPTCHA token
 * Used by: TanStack contact route form
 * Dependencies: Supabase browser client; send-contact-notification Edge Function
 * Public functions: submitContact()
 * Side effects: Performs one Edge Function request that writes Supabase and sends email
 */
import { getSupabaseClient } from './supabase';

export type ContactInquiry = { nama: string; email: string; telepon?: string; jenisLayanan?: string; kebutuhan: string; anggaran?: string; captchaToken: string };

export async function submitContact(inquiry: ContactInquiry): Promise<void> {
  const { error } = await getSupabaseClient().functions.invoke('send-contact-notification', {
    body: {
      nama: inquiry.nama,
      email: inquiry.email,
      telepon: inquiry.telepon || null,
      jenis_layanan: inquiry.jenisLayanan || null,
      perkiraan_anggaran: inquiry.anggaran || 'Belum ditentukan',
      pesan: inquiry.kebutuhan,
      honeypot: '',
      captcha_token: inquiry.captchaToken,
    },
  });
  if (error) throw error;
}
