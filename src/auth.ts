import { getSupabaseClient } from './supabase';

export interface User {
  email?: string;
  id?: string;
  avatar_url?: string;
}

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

  // Check current session on mount
  client.auth.getSession().then(({ data: { session } }) => {
    if (session && session.user) {
      if (onAuthSuccess) {
        onAuthSuccess(
          {
            email: session.user.email,
            id: session.user.id,
            avatar_url: session.user.user_metadata?.avatar_url,
          },
          ''
        );
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });

  const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
    if (session && session.user) {
      if (onAuthSuccess) {
        onAuthSuccess(
          {
            email: session.user.email,
            id: session.user.id,
            avatar_url: session.user.user_metadata?.avatar_url,
          },
          ''
        );
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User } | null> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum dikonfigurasi.');
  }

  const { data, error } = await client.auth.signUp({ email, password });

  if (error) throw error;

  if (data.user) {
    return {
      user: {
        email: data.user.email,
        id: data.user.id,
      }
    };
  }
  return null;
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User } | null> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum dikonfigurasi.');
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) throw error;

  if (data.user) {
    return {
      user: {
        email: data.user.email,
        id: data.user.id,
      }
    };
  }
  return null;
};

// Keep googleSignIn as alias for backward compatibility but now uses email sign-in
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  return null; // Not used directly — UI handles this now
};

export const getAccessToken = async (): Promise<string | null> => {
  return null;
};

export const logout = async () => {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
};
