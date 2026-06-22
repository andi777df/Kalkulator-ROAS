import { getSupabaseClient } from './supabase';

export interface User {
  email?: string;
  id?: string;
  avatar_url?: string;
}

let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const client = getSupabaseClient();
  if (!client) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  // Check current session
  client.auth.getSession().then(({ data: { session } }) => {
    if (session && session.user) {
      const googleToken = session.provider_token || localStorage.getItem('supabase_google_access_token');
      if (session.provider_token) {
        localStorage.setItem('supabase_google_access_token', session.provider_token);
      }
      cachedAccessToken = googleToken;
      if (onAuthSuccess) {
        onAuthSuccess(
          {
            email: session.user.email,
            id: session.user.id,
            avatar_url: session.user.user_metadata?.avatar_url,
          },
          googleToken || ''
        );
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });

  const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
      const googleToken = session.provider_token || localStorage.getItem('supabase_google_access_token');
      if (session.provider_token) {
        localStorage.setItem('supabase_google_access_token', session.provider_token);
      }
      cachedAccessToken = googleToken;
      if (onAuthSuccess) {
        onAuthSuccess(
          {
            email: session.user.email,
            id: session.user.id,
            avatar_url: session.user.user_metadata?.avatar_url,
          },
          googleToken || ''
        );
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('supabase_google_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum dikonfigurasi. Harap isi URL dan Anon Key Supabase di pengaturan.');
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) {
    throw error;
  }

  // The page redirects, so we won't return anything.
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  return localStorage.getItem('supabase_google_access_token');
};

export const logout = async () => {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
  cachedAccessToken = null;
  localStorage.removeItem('supabase_google_access_token');
};
