import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeCommentsPostId: null,
  likedPosts: {},
  savedPosts: {},
};

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
    toggleLike: (state, action) => {
      const postId = action.payload;
      state.likedPosts[postId] = !state.likedPosts[postId];
    },
    toggleSave: (state, action) => {
      const postId = action.payload;
      state.savedPosts[postId] = !state.savedPosts[postId];
    },
  },
});

export const { closeComments, openComments, toggleLike, toggleSave } =
  postInteractionsSlice.actions;

export default postInteractionsSlice.reducer;
