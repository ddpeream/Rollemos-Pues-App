import { create } from 'zustand';

import {
  getAuthSession,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  subscribeAuthState,
  unsubscribeAuthState,
} from '../services/auth.service';

export const AUTH_STATUS = {
  AUTHENTICATED: 'authenticated',
  IDLE: 'idle',
  LOADING: 'loading',
  UNAUTHENTICATED: 'unauthenticated',
};

const getAuthStatus = (session) => (
  session?.user?.id ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.UNAUTHENTICATED
);

export const useAuthStore = create((set, get) => ({
  authError: null,
  authStatus: AUTH_STATUS.IDLE,
  authUser: null,
  isAuthLoading: false,
  isAuthReady: false,
  session: null,
  subscription: null,

  clearAuthError: () => set({ authError: null }),

  setSession: (session) => set({
    authError: null,
    authStatus: getAuthStatus(session),
    authUser: session?.user || null,
    isAuthReady: true,
    session,
  }),

  initializeAuth: async () => {
    set({ authError: null, authStatus: AUTH_STATUS.LOADING, isAuthLoading: true });

    const result = await getAuthSession();

    if (!result.ok) {
      set({
        authError: result.error,
        authStatus: AUTH_STATUS.UNAUTHENTICATED,
        authUser: null,
        isAuthLoading: false,
        isAuthReady: true,
        session: null,
      });
      return result;
    }

    set({
      authError: null,
      authStatus: getAuthStatus(result.data),
      authUser: result.data?.user || null,
      isAuthLoading: false,
      isAuthReady: true,
      session: result.data,
    });

    return result;
  },

  startAuthListener: () => {
    if (get().subscription) return get().subscription;

    const subscription = subscribeAuthState(({ session }) => {
      get().setSession(session);
    });

    set({ subscription });
    return subscription;
  },

  stopAuthListener: () => {
    unsubscribeAuthState(get().subscription);
    set({ subscription: null });
  },

  loginWithEmail: async ({ email, password }) => {
    set({ authError: null, authStatus: AUTH_STATUS.LOADING, isAuthLoading: true });

    const result = await signInWithEmail({ email, password });

    if (!result.ok) {
      set({
        authError: result.error,
        authStatus: AUTH_STATUS.UNAUTHENTICATED,
        isAuthLoading: false,
      });
      return result;
    }

    get().setSession(result.data);
    set({ isAuthLoading: false });

    return result;
  },

  registerWithEmail: async ({ email, metadata, password }) => {
    set({ authError: null, authStatus: AUTH_STATUS.LOADING, isAuthLoading: true });

    const result = await signUpWithEmail({ email, metadata, password });

    if (!result.ok) {
      set({
        authError: result.error,
        authStatus: AUTH_STATUS.UNAUTHENTICATED,
        isAuthLoading: false,
      });
      return result;
    }

    get().setSession(result.data.session);
    set({
      authUser: result.data.session?.user || null,
      isAuthLoading: false,
    });

    return result;
  },

  logout: async () => {
    set({ authError: null, isAuthLoading: true });

    const result = await signOut();

    set({
      authError: result.ok ? null : result.error,
      authStatus: AUTH_STATUS.UNAUTHENTICATED,
      authUser: null,
      isAuthLoading: false,
      isAuthReady: true,
      session: null,
    });

    return result;
  },

  resetAuth: () => set({
    authError: null,
    authStatus: AUTH_STATUS.UNAUTHENTICATED,
    authUser: null,
    isAuthLoading: false,
    isAuthReady: true,
    session: null,
  }),
}));

export default useAuthStore;
