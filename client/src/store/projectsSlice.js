import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../lib/api";
import { mapApiProjectToCard } from "../lib/backendMappers";

const PROJECTS_CACHE_TTL_MS = 60_000;

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async () => {
    const response = await apiRequest("/projects");
    return Array.isArray(response) ? response.map(mapApiProjectToCard) : [];
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

export const { invalidateProjectsCache, upsertProjectCard } = projectsSlice.actions;
export default projectsSlice.reducer;
