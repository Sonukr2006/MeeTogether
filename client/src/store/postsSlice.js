import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../lib/api";
import { mapApiPostToCard } from "../lib/backendMappers";

const POSTS_CACHE_TTL_MS = 60_000;

export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async () => {
    const response = await apiRequest("/posts");
    return Array.isArray(response) ? response.map(mapApiPostToCard) : [];
  },
  {
    condition: (_, { getState }) => {
      const { posts } = getState();

      if (posts.status === "loading") {
        return false;
      }

      if (
        posts.status === "succeeded" &&
        posts.lastFetchedAt &&
        Date.now() - posts.lastFetchedAt < POSTS_CACHE_TTL_MS
      ) {
        return false;
      }

      return true;
    },
  },
);

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    items: [],
    status: "idle",
    lastFetchedAt: null,
    error: null,
  },
  reducers: {
    invalidatePostsCache: (state) => {
      state.lastFetchedAt = null;
      if (state.status === "succeeded") {
        state.status = "idle";
      }
    },
    prependPostCard: (state, action) => {
      state.items.unshift(action.payload);
      state.status = "succeeded";
      state.lastFetchedAt = Date.now();
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.lastFetchedAt = Date.now();
        state.error = null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load posts";
      });
  },
});

export const { invalidatePostsCache, prependPostCard } = postsSlice.actions;
export default postsSlice.reducer;
