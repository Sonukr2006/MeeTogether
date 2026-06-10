import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../lib/api";
import { mapApiProfileToUi } from "../lib/backendMappers";

const PROFILE_CACHE_TTL_MS = 60_000;

export const fetchProfileByUsername = createAsyncThunk(
  "profiles/fetchProfileByUsername",
  async (username) => {
    const response = await apiRequest(`/profiles/${username}`);
    return {
      username,
      profile: mapApiProfileToUi(response, username),
    };
  },
  {
    condition: (username, { getState }) => {
      if (!username) {
        return false;
      }

      const entry = getState().profiles.byUsername[username];

      if (entry?.status === "loading") {
        return false;
      }

      if (
        entry?.status === "succeeded" &&
        entry.lastFetchedAt &&
        Date.now() - entry.lastFetchedAt < PROFILE_CACHE_TTL_MS
      ) {
        return false;
      }

      return true;
    },
  },
);

const profilesSlice = createSlice({
  name: "profiles",
  initialState: {
    byUsername: {},
  },
  reducers: {
    updateCachedProfileAvatar: (state, action) => {
      const { username, avatar } = action.payload;
      const entry = state.byUsername[username];

      if (!entry?.profile) {
        return;
      }

      entry.profile.avatar = avatar;
      entry.lastFetchedAt = Date.now();
      entry.status = "succeeded";
      entry.error = null;
    },
    updateCachedProfile: (state, action) => {
      const { username, profile } = action.payload;

      state.byUsername[username] = {
        status: "succeeded",
        profile,
        error: null,
        lastFetchedAt: Date.now(),
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileByUsername.pending, (state, action) => {
        const username = action.meta.arg;
        state.byUsername[username] = {
          ...(state.byUsername[username] ?? {}),
          status: "loading",
          error: null,
        };
      })
      .addCase(fetchProfileByUsername.fulfilled, (state, action) => {
        const { username, profile } = action.payload;
        state.byUsername[username] = {
          status: "succeeded",
          profile,
          error: null,
          lastFetchedAt: Date.now(),
        };
      })
      .addCase(fetchProfileByUsername.rejected, (state, action) => {
        const username = action.meta.arg;
        state.byUsername[username] = {
          ...(state.byUsername[username] ?? {}),
          status: "failed",
          error: action.error.message ?? "Failed to load profile",
          lastFetchedAt: Date.now(),
        };
      });
  },
});

export const { updateCachedProfile, updateCachedProfileAvatar } =
  profilesSlice.actions;
export default profilesSlice.reducer;
