import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../lib/api";
import { mapApiProjectToCard } from "../lib/backendMappers";

const PROJECTS_CACHE_TTL_MS = 60_000;

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async () => {
    const response = await apiRequest("/projects");
    const items = response?.data ?? (Array.isArray(response) ? response : []);
    return items.map(mapApiProjectToCard);
  },
  {
    condition: (_, { getState }) => {
      const { projects } = getState();

      if (projects.status === "loading") {
        return false;
      }

      if (
        projects.status === "succeeded" &&
        projects.lastFetchedAt &&
        Date.now() - projects.lastFetchedAt < PROJECTS_CACHE_TTL_MS
      ) {
        return false;
      }

      return true;
    },
  },
);

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    items: [],
    status: "idle",
    lastFetchedAt: null,
    error: null,
  },
  reducers: {
    invalidateProjectsCache: (state) => {
      state.lastFetchedAt = null;
      if (state.status === "succeeded") {
        state.status = "idle";
      }
    },
    upsertProjectCard: (state, action) => {
      const nextProject = action.payload;
      const existingIndex = state.items.findIndex((item) => item.id === nextProject.id);

      if (existingIndex >= 0) {
        state.items[existingIndex] = nextProject;
      } else {
        state.items.unshift(nextProject);
      }

      state.status = "succeeded";
      state.lastFetchedAt = Date.now();
      state.error = null;
    },
    updateProjectLikeState: (state, action) => {
      const { projectId, likesCount } = action.payload;
      const item = state.items.find((entry) => entry.id === projectId);

      if (!item) {
        return;
      }

      item.likes = likesCount;
      state.lastFetchedAt = Date.now();
    },
    adjustProjectLikeState: (state, action) => {
      const { projectId, delta } = action.payload;
      const item = state.items.find((entry) => entry.id === projectId);

      if (!item) {
        return;
      }

      item.likes = Math.max(0, (item.likes ?? 0) + delta);
      state.lastFetchedAt = Date.now();
    },
    updateProjectCommentsCount: (state, action) => {
      const { projectId, commentsCount } = action.payload;
      const item = state.items.find((entry) => entry.id === projectId);

      if (!item) {
        return;
      }

      item.comments = commentsCount;
      state.lastFetchedAt = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.lastFetchedAt = Date.now();
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load projects";
      });
  },
});

export const {
  invalidateProjectsCache,
  upsertProjectCard,
  updateProjectLikeState,
  adjustProjectLikeState,
  updateProjectCommentsCount,
} =
  projectsSlice.actions;
export default projectsSlice.reducer;
