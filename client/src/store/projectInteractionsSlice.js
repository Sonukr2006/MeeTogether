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

export const toggleLiveProjectSave = createAsyncThunk(
  "projectInteractions/toggleLiveProjectSave",
  async ({ projectId, saved }) => {
    return apiRequest(`/projects/${projectId}/save`, {
      method: "POST",
      body: JSON.stringify({ saved }),
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
    setProjectSavedState: (state, action) => {
      const { projectId, saved } = action.payload;
      state.savedProjects[projectId] = saved;
    },
    hydrateSavedProjects: (state, action) => {
      state.savedProjects = {};
      action.payload.forEach((projectId) => {
        state.savedProjects[projectId] = true;
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(toggleLiveProjectLike.fulfilled, (state, action) => {
      state.likedProjects[action.payload.projectId] = action.payload.liked;
      persistLikedProjects(state.likedProjects);
    });
    builder.addCase(toggleLiveProjectSave.fulfilled, (state, action) => {
      state.savedProjects[action.payload.projectId] = action.payload.saved;
    });
  },
});

export const {
  closeAnalyzePanel,
  openAnalyzePanel,
  setProjectLikedState,
  setProjectSavedState,
  hydrateSavedProjects,
  toggleProjectSave,
} = projectInteractionsSlice.actions;

export default projectInteractionsSlice.reducer;
