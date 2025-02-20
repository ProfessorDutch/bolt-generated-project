export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

// Log to verify keys are loaded
console.log('Environment variables loaded:', {
  SUPABASE_URL: !!SUPABASE_URL,
  SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
  DEEPSEEK_API_KEY: !!DEEPSEEK_API_KEY
});
