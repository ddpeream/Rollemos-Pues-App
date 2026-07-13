import { supabase } from '../../../config/supabase';

const USERS_TABLE = 'usuarios';
const USER_SELECT = '*';

export const normalizeUserProfile = (profile) => {
  if (!profile) return null;

  return {
    avatarUrl: profile.avatar_url || null,
    bio: profile.bio || null,
    ciudad: profile.ciudad || null,
    createdAt: profile.created_at || null,
    disciplina: profile.disciplina || null,
    email: profile.email || null,
    id: profile.id,
    nivel: profile.nivel || null,
    nombre: profile.nombre || null,
    updatedAt: profile.updated_at || null,
  };
};

const toUserProfilePayload = (profile) => ({
  avatar_url: profile.avatarUrl ?? profile.avatar_url ?? null,
  bio: profile.bio || null,
  ciudad: profile.ciudad || null,
  disciplina: profile.disciplina || null,
  email: profile.email?.trim() || null,
  id: profile.id,
  nivel: profile.nivel || null,
  nombre: profile.nombre?.trim() || null,
  updated_at: new Date().toISOString(),
});

export const getUserProfileById = async (id) => {
  if (!id) return { data: null, error: 'missing_user_id', ok: false };

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(USER_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return { data: normalizeUserProfile(data), error: null, ok: true };
};

export const getUserProfileByEmail = async (email) => {
  if (!email) return { data: null, error: 'missing_user_email', ok: false };

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(USER_SELECT)
    .eq('email', email.trim())
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return { data: normalizeUserProfile(data), error: null, ok: true };
};

export const createUserProfile = async (profile) => {
  if (!profile?.id) return { data: null, error: 'missing_user_id', ok: false };

  const payload = {
    ...toUserProfilePayload(profile),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select(USER_SELECT)
    .single();

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return { data: normalizeUserProfile(data), error: null, ok: true };
};

export const updateUserProfile = async (id, profile) => {
  if (!id) return { data: null, error: 'missing_user_id', ok: false };

  const { id: ignoredId, ...profileData } = toUserProfilePayload({ ...profile, id });
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update(profileData)
    .eq('id', id)
    .select(USER_SELECT)
    .single();

  if (error) {
    return { data: null, error: error.message, ok: false };
  }

  return { data: normalizeUserProfile(data), error: null, ok: true };
};

export const deleteUserProfile = async (id) => {
  if (!id) return { error: 'missing_user_id', ok: false };

  const { error } = await supabase
    .from(USERS_TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message, ok: false };
  }

  return { error: null, ok: true };
};
