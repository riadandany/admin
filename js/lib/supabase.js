import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://alhjqcpdikpfhqhnpbag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsaGpxY3BkaWtwZmhxaG5wYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjcwNjksImV4cCI6MjA5NDI0MzA2OX0.1PLD1WUuOljqxr47O2WOb2KG3feBD3itbVz0n2e1mKE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const STORAGE_BUCKET = 'site-assets';

export async function uploadFile(file, folder = 'uploads') {
  const ext = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(filename, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
  return pub.publicUrl;
}
