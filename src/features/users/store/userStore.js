import { create } from 'zustand';

import {
  createUserProfile,
  getUserProfileByEmail,
  getUserProfileById,
  updateUserProfile,
} from '../services/users.service';

export const useUserStore = create((set, get) => ({
  currentUser: null,
  isCurrentUserLoading: false,
  isCurrentUserReady: false,
  userError: null,

  clearUserError: () => set({ userError: null }),

  clearCurrentUser: () => set({
    currentUser: null,
    isCurrentUserLoading: false,
    isCurrentUserReady: true,
    userError: null,
  }),

  setCurrentUser: (currentUser) => set({
    currentUser,
    isCurrentUserReady: true,
    userError: null,
  }),

  loadCurrentUserById: async (id) => {
    set({ isCurrentUserLoading: true, userError: null });

    const result = await getUserProfileById(id);

    set({
      currentUser: result.ok ? result.data : null,
      isCurrentUserLoading: false,
      isCurrentUserReady: true,
      userError: result.ok ? null : result.error,
    });

    return result;
  },

  loadCurrentUserByEmail: async (email) => {
    set({ isCurrentUserLoading: true, userError: null });

    const result = await getUserProfileByEmail(email);

    set({
      currentUser: result.ok ? result.data : null,
      isCurrentUserLoading: false,
      isCurrentUserReady: true,
      userError: result.ok ? null : result.error,
    });

    return result;
  },

  createCurrentUserProfile: async (profile) => {
    set({ isCurrentUserLoading: true, userError: null });

    const result = await createUserProfile(profile);

    set({
      currentUser: result.ok ? result.data : get().currentUser,
      isCurrentUserLoading: false,
      isCurrentUserReady: true,
      userError: result.ok ? null : result.error,
    });

    return result;
  },

  updateCurrentUserProfile: async (profile) => {
    const currentUserId = get().currentUser?.id || profile?.id;
    set({ isCurrentUserLoading: true, userError: null });

    const result = await updateUserProfile(currentUserId, profile);

    set({
      currentUser: result.ok ? result.data : get().currentUser,
      isCurrentUserLoading: false,
      isCurrentUserReady: true,
      userError: result.ok ? null : result.error,
    });

    return result;
  },

  resetUser: () => set({
    currentUser: null,
    isCurrentUserLoading: false,
    isCurrentUserReady: false,
    userError: null,
  }),
}));

export default useUserStore;

