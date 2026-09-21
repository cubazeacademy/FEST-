import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sebphzbptktohcisskht.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Q5kbGgWhHvmZ_UMi9qdKtw_7-VMbSJq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const FEST_STATE_KEY = 'fest_core_data_v1';
export const USERS_STATE_KEY = 'fest_users_data_v1';

/**
 * Fetch fest state from Supabase
 */
export async function fetchCloudFestState() {
  try {
    const { data, error } = await supabase
      .from('fest_state')
      .select('data, updated_at')
      .eq('id', FEST_STATE_KEY)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    return data?.data || null;
  } catch (err) {
    console.error('Failed to fetch state from Supabase:', err);
    return null;
  }
}

/**
 * Persist fest state to Supabase
 */
export async function saveCloudFestState(stateData: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('fest_state')
      .upsert(
        {
          id: FEST_STATE_KEY,
          data: stateData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Supabase save error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save state to Supabase:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Fetch users from Supabase
 */
export async function fetchCloudUsers() {
  try {
    const { data, error } = await supabase
      .from('fest_state')
      .select('data, updated_at')
      .eq('id', USERS_STATE_KEY)
      .maybeSingle();

    if (error) {
      console.warn('Supabase users fetch error:', error.message);
      return null;
    }

    return data?.data || null;
  } catch (err) {
    console.error('Failed to fetch users from Supabase:', err);
    return null;
  }
}

/**
 * Save users to Supabase
 */
export async function saveCloudUsers(users: any[]) {
  try {
    const { error } = await supabase
      .from('fest_state')
      .upsert(
        {
          id: USERS_STATE_KEY,
          data: users,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Supabase users save error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save users to Supabase:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}
