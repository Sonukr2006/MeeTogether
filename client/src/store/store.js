import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import opportunityRequestsReducer from "./opportunityRequestsSlice";
import postInteractionsReducer from "./postInteractionsSlice";
import postsReducer from "./postsSlice";
import projectInteractionsReducer from "./projectInteractionsSlice";
import profilesReducer from "./profilesSlice";
import projectsReducer from "./projectsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    opportunityRequests: opportunityRequestsReducer,
    postInteractions: postInteractionsReducer,
    posts: postsReducer,
    projectInteractions: projectInteractionsReducer,
    profiles: profilesReducer,
    projects: projectsReducer,
  },
});
