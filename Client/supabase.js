// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// These will automatically read from .env (Vite does this!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Key missing:", { supabaseUrl, supabaseAnonKey })
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey , {
    auth: {
    persistSession: true,      // ensures the user stays logged in on reload
    autoRefreshToken: true,    // auto-refresh access tokens before they expire
    detectSessionInUrl: true,  // handles OAuth redirects if you use them later
    storageKey: 'sb-affiliate-auth' //
  },
  global: {
    headers: {
      'Accept': 'application/json',
    },
  },
});