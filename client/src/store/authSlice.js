import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../lib/api";

const AUTH_TOKEN_KEY = "meetogether_access_token";
const AUTH_USER_KEY = "meetogether_current_user";

const initialToken =
  typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

export const signUpUser = createAsyncThunk(
  "auth/signUpUser",
  async (payload) => {
    return apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
);

export const signInUser = createAsyncThunk(
  "auth/signInUser",
  async (payload) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { getState }) => {
    const token = getState().auth.accessToken;

    if (token) {
      try {
        const user = await apiRequest("/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return {
          user,
          accessToken: token,
        };
      } catch (error) {
        const message = error?.message?.toLowerCase?.() ?? "";

        if (!message.includes("unauthorized")) {
          throw error;
        }
      }
    }

    try {
      const refreshed = await apiRequest("/auth/refresh", {
        method: "POST",
      });

      return {
        user: refreshed.user,
        accessToken: refreshed.accessToken,
      };
    } catch (error) {
      const message = error?.message?.toLowerCase?.() ?? "";

      if (!message.includes("unauthorized")) {
        throw error;
      }

      return null;
    }
  }
);

export const logOutUser = createAsyncThunk(
  "auth/logOutUser",
  async (_, { getState }) => {
    const token = getState().auth.accessToken;

    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });
    } catch (error) {
      const message = error?.message?.toLowerCase?.() ?? "";

      if (!message.includes("unauthorized")) {
        throw error;
      }
    }

    return true;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    accessToken: initialToken,
    currentUser: null,
    status: "idle",
    initialized: false,
    needsSessionRefresh: true,
    error: null,
  },
  reducers: {
    bootstrapComplete: (state) => {
      state.initialized = true;
    },
    updateCurrentUserAvatar: (state, action) => {
      if (!state.currentUser) {
        return;
      }

      state.currentUser.avatar = action.payload;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(state.currentUser));
    },
    clearAuthState: (state) => {
      state.accessToken = null;
      state.currentUser = null;
      state.status = "idle";
      state.error = null;
      state.initialized = true;
      state.needsSessionRefresh = false;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUpUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accessToken = action.payload.accessToken;
        state.currentUser = action.payload.user;
        state.initialized = true;
        state.needsSessionRefresh = false;
        localStorage.setItem(AUTH_TOKEN_KEY, action.payload.accessToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(action.payload.user));
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Sign up failed";
      })
      .addCase(signInUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accessToken = action.payload.accessToken;
        state.currentUser = action.payload.user;
        state.initialized = true;
        state.needsSessionRefresh = false;
        localStorage.setItem(AUTH_TOKEN_KEY, action.payload.accessToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(action.payload.user));
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Sign in failed";
      })
      .addCase(restoreSession.pending, (state) => {
        state.status = "loading";
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentUser = action.payload?.user ?? null;
        state.accessToken = action.payload?.accessToken ?? null;
        state.initialized = true;
        state.needsSessionRefresh = false;
        if (action.payload?.accessToken && action.payload?.user) {
          localStorage.setItem(AUTH_TOKEN_KEY, action.payload.accessToken);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(action.payload.user));
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.status = "idle";
        state.currentUser = null;
        state.accessToken = null;
        state.initialized = true;
        state.needsSessionRefresh = false;
        state.error = null;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      })
      .addCase(logOutUser.fulfilled, (state) => {
        state.accessToken = null;
        state.currentUser = null;
        state.status = "idle";
        state.error = null;
        state.initialized = true;
        state.needsSessionRefresh = false;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      });
  },
});

export const { bootstrapComplete, updateCurrentUserAvatar, clearAuthState } =
  authSlice.actions;
export default authSlice.reducer;
