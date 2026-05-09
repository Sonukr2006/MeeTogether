import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeAnalyzeProjectId: null,
  likedProjects: {},
  savedProjects: {},
};

const projectInteractionsSlice = createSlice({
  name: "projectInteractions",
  initialState,
  reducers: {
    openAnalyzePanel: (state, action) => {
      state.activeAnalyzeProjectId =
        state.activeAnalyzeProjectId === action.payload ? null : action.payload;
    },
    closeAnalyzePanel: (state) => {
      state.activeAnalyzeProjectId = null;
    },
    toggleProjectLike: (state, action) => {
      const projectId = action.payload;
      state.likedProjects[projectId] = !state.likedProjects[projectId];
    },
    toggleProjectSave: (state, action) => {
      const projectId = action.payload;
      state.savedProjects[projectId] = !state.savedProjects[projectId];
    },
  },
});

export const {
  closeAnalyzePanel,
  openAnalyzePanel,
  toggleProjectLike,
  toggleProjectSave,
} = projectInteractionsSlice.actions;

export default projectInteractionsSlice.reducer;
