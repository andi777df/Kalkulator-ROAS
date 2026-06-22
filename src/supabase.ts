import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SavedCalculation } from './types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let supabaseClient: SupabaseClient | null = null;

// Get stored configuration
export const getStoredSupabaseConfig = (): SupabaseConfig | null => {
  try {
    const url = localStorage.getItem('supabase_url') || ((import.meta as any).env?.VITE_SUPABASE_URL as string);
    const anonKey = localStorage.getItem('supabase_anon_key') || ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string);
    if (url && anonKey) {
      return { url, anonKey };
    }
  } catch (e) {
    console.error('Error reading Supabase credentials from local storage:', e);
  }
  return null;
};

// Initialize Supabase client
export const initSupabase = (url: string, anonKey: string): SupabaseClient | null => {
  if (!url || !anonKey) {
    supabaseClient = null;
    return null;
  }
  try {
    // Validate basic URL structure
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('URL Supabase harus diawali dengan http:// atau https://');
    }
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    return supabaseClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    supabaseClient = null;
    return null;
  }
};

// Check if currently connected
export const isSupabaseConnected = (): boolean => {
  if (!supabaseClient) {
    const config = getStoredSupabaseConfig();
    if (config) {
      const client = initSupabase(config.url, config.anonKey);
      return client !== null;
    }
    return false;
  }
  return true;
};

// Clear saved credentials
export const clearSupabaseConfig = () => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
  supabaseClient = null;
};

// Get active client
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseClient) {
    const config = getStoredSupabaseConfig();
    if (config) {
      initSupabase(config.url, config.anonKey);
    }
  }
  return supabaseClient;
};

// Save a calculation to Supabase
export const saveToSupabase = async (
  calc: SavedCalculation,
  userEmail?: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Klien Supabase belum dikonfigurasi.' };
  }

  try {
    const payload = {
      id: calc.id,
      date_string: calc.date,
      platform: calc.platform,
      product_input: calc.productInput,
      ad_input: calc.adInput,
      result: calc.result,
      user_email: userEmail || 'anonymous'
    };

    const { error } = await client
      .from('calculations')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting to Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving to Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
};

// Save/Sync multiple (bulk) calculations to Supabase
export const syncBulkToSupabase = async (
  calcs: SavedCalculation[],
  userEmail?: string
): Promise<{ success: boolean; error?: string; count: number }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Klien Supabase belum dikonfigurasi.', count: 0 };
  }
  if (calcs.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const payloads = calcs.map(calc => ({
      id: calc.id,
      date_string: calc.date,
      platform: calc.platform,
      product_input: calc.productInput,
      ad_input: calc.adInput,
      result: calc.result,
      user_email: userEmail || 'anonymous'
    }));

    const { error } = await client
      .from('calculations')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      console.error('Error bulk syncing to Supabase:', error);
      return { success: false, error: error.message, count: 0 };
    }

    return { success: true, count: calcs.length };
  } catch (err: any) {
    console.error('Error bulk syncing to Supabase:', err);
    return { success: false, error: err.message || String(err), count: 0 };
  }
};

// Fetch calculations from Supabase
export const fetchFromSupabase = async (
  userEmail?: string
): Promise<{ success: boolean; data?: SavedCalculation[]; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Klien Supabase belum dikonfigurasi.' };
  }

  try {
    const query = client.from('calculations').select('*');
    
    if (userEmail) {
      // Fetch specifically for this user OR anonymous
      // But usually we can fetch all or filter by email
      query.or(`user_email.eq.${userEmail},user_email.eq.anonymous`);
    }

    // Sort by created_at or date_string desc
    const { data, error } = await query.order('id', { ascending: false });

    if (error) {
      // If table calculations doesn't exist, we can identify that error specifically
      return { success: false, error: error.message };
    }

    const formattedList: SavedCalculation[] = (data || []).map(row => ({
      id: row.id,
      date: row.date_string || new Date().toLocaleString(),
      platform: row.platform,
      productInput: row.product_input,
      adInput: row.ad_input,
      result: row.result
    }));

    return { success: true, data: formattedList };
  } catch (err: any) {
    console.error('Error fetching calculations from Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
};

// Delete a calculation from Supabase
export const deleteFromSupabase = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Klien Supabase belum dikonfigurasi.' };
  }

  try {
    const { error } = await client
      .from('calculations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting from Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting from Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
};

// Delete all calculations from Supabase for a given user or all
export const clearSupabaseCalculations = async (
  userEmail?: string
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Klien Supabase belum dikonfigurasi.' };
  }

  try {
    let query = client.from('calculations').delete();
    
    if (userEmail) {
      query = query.eq('user_email', userEmail);
    } else {
      query = query.neq('id', 'placeholder_do_not_delete'); // delete all
    }

    const { error } = await query;

    if (error) {
      console.error('Error clearing Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error clearing Supabase tables:', err);
    return { success: false, error: err.message || String(err) };
  }
};

// Test if Supabase is reachable and can do a dummy query or check tables
export const testConnection = async (
  url: string,
  anonKey: string
): Promise<{ ok: boolean; message: string; tableExists: boolean }> => {
  try {
    const testClient = createClient(url, anonKey);
    // Try listing tables or doing a simple select from any table or just check connectivity
    const { data, error } = await testClient
      .from('calculations')
      .select('id')
      .limit(1);

    if (error) {
      // Check if it's a connection/API key error or if it is just a missing table
      if (error.code === 'PGRST116' || error.message.includes('not found') || error.message.includes('relation "calculations" does not exist')) {
        return { 
          ok: true, 
          message: 'Berhasil terhubung ke Supabase! Namun tabel "calculations" belum dibuat di database Anda.', 
          tableExists: false 
        };
      }
      return { 
        ok: false, 
        message: `Koneksi gagal atau API key salah: ${error.message} (Code: ${error.code})`, 
        tableExists: false 
      };
    }

    return { 
      ok: true, 
      message: 'Berhasil terhubung ke Supabase secara optimal!', 
      tableExists: true 
    };
  } catch (err: any) {
    return { 
      ok: false, 
      message: `Gagal menginisialisasi klien: ${err.message || String(err)}`, 
      tableExists: false 
    };
  }
};
