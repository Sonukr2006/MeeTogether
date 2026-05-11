import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../lib/api";

const LIKED_POSTS_KEY = "meetogether_liked_posts";

const initialLikedPosts =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem(LIKED_POSTS_KEY) ?? "{}")
    : {};

export const togglePostLike = createAsyncThunk(
  "postInteractions/togglePostLike",
  async ({ postId, liked }) => {
    return apiRequest(`/posts/${postId}/like`, {
      method: "POST",
      body: JSON.stringify({ liked }),
    });
  },
);

const initialState = {
  activeCommentsPostId: null,
  likedPosts: initialLikedPosts,
  savedPosts: {},
};

function persistLikedPosts(likedPosts) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(likedPosts));
  }
}

const postInteractionsSlice = createSlice({
  name: "postInteractions",
  initialState,
  reducers: {
    openComments: (state, action) => {
      state.activeCommentsPostId =
        state.activeCommentsPostId === action.payload ? null : action.payload;
    },
    closeComments: (state) => {
      state.activeCommentsPostId = null;
    },
    setPostLikedState: (state, action) => {
      const { postId, liked } = action.payload;
      state.likedPosts[postId] = liked;
      persistLikedPosts(state.likedPosts);
    },
    toggleSave: (state, action) => {
      const postId = action.payload;
      state.savedPosts[postId] = !state.savedPosts[postId];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(togglePostLike.fulfilled, (state, action) => {
      state.likedPosts[action.payload.postId] = action.payload.liked;
      persistLikedPosts(state.likedPosts);
    });
  },
});

export const { closeComments, openComments, setPostLikedState, toggleSave } =
  postInteractionsSlice.actions;

export default postInteractionsSlice.reducer;
