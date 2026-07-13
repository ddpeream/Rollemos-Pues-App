import { supabase } from '../../../config/supabase';

export const normalizeAuthUser = (user) => {
  if (!user) return null;

  return {
    appMetadata: user.app_metadata || {},
    aud: user.aud || null,
    createdAt: user.created_at || null,
    email: user.email || null,
    emailConfirmedAt: user.email_confirmed_at || null,
    id: user.id,
    lastSignInAt: user.last_sign_in_at || null,
    phone: user.phone || null,
    role: user.role || null,
    updatedAt: user.updated_at || null,
    userMetadata: user.user_metadata || {},
  };
};

export const normalizeAuthSession = (session) => {
  if (!session) return null;

  return {
    accessToken: session.access_token,
    expiresAt: session.expires_at || null,
    expiresIn: session.expires_in || null,
    refreshToken: session.refresh_token,
    tokenType: session.token_type || null,
    user: normalizeAuthUser(session.user),
  };
};

export const getAuthSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return {
    data: normalizeAuthSession(data?.session),
    error: null,
    ok: true,
  };
};

export const getAuthUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return {
    data: normalizeAuthUser(data?.user),
    error: null,
    ok: true,
  };
};

export const signInWithEmail = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email?.trim(),
    password,
  });

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return {
    data: normalizeAuthSession(data?.session),
    error: null,
    ok: true,
  };
};

export const signUpWithEmail = async ({ email, password, metadata = {} }) => {
  const { data, error } = await supabase.auth.signUp({
    email: email?.trim(),
    password,
    options: {
      data: metadata,
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return {
    data: {
      session: normalizeAuthSession(data?.session),
      user: normalizeAuthUser(data?.user),
    },
    error: null,
    ok: true,
  };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message, ok: false };
  }

  return { error: null, ok: true };
};

export const subscribeAuthState = (onChange) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    onChange?.({
      event,
      session: normalizeAuthSession(session),
      user: normalizeAuthUser(session?.user),
    });
  });

  return data?.subscription || null;
};

export const unsubscribeAuthState = (subscription) => {
  subscription?.unsubscribe?.();
};

