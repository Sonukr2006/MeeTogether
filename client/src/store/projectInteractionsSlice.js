import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../lib/api";

const LIKED_PROJECTS_KEY = "meetogether_liked_projects";

const initialLikedProjects =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem(LIKED_PROJECTS_KEY) ?? "{}")
    : {};

export const toggleLiveProjectLike = createAsyncThunk(
  "projectInteractions/toggleLiveProjectLike",
  async ({ projectId, liked }) => {
    return apiRequest(`/projects/${projectId}/like`, {
      method: "POST",
      body: JSON.stringify({ liked }),
    });
  },
);

const initialState = {
  activeAnalyzeProjectId: null,
  likedProjects: initialLikedProjects,
  savedProjects: {},
};

function persistLikedProjects(likedProjects) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LIKED_PROJECTS_KEY, JSON.stringify(likedProjects));
  }
}

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
    setProjectLikedState: (state, action) => {
      const { projectId, liked } = action.payload;
      state.likedProjects[projectId] = liked;
      persistLikedProjects(state.likedProjects);
    },
    toggleProjectSave: (state, action) => {
      const projectId = action.payload;
      state.savedProjects[projectId] = !state.savedProjects[projectId];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(toggleLiveProjectLike.fulfilled, (state, action) => {
      state.likedProjects[action.payload.projectId] = action.payload.liked;
      persistLikedProjects(state.likedProjects);
    });
  },
});

export const {
  closeAnalyzePanel,
  openAnalyzePanel,
  setProjectLikedState,
  toggleProjectSave,
} = projectInteractionsSlice.actions;

export default projectInteractionsSlice.reducer;
