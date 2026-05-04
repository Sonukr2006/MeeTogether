import { configureStore } from "@reduxjs/toolkit";
import opportunityRequestsReducer from "./opportunityRequestsSlice";
import postInteractionsReducer from "./postInteractionsSlice";
import projectDiscussionsReducer from "./projectDiscussionsSlice";

export const store = configureStore({
  reducer: {
    opportunityRequests: opportunityRequestsReducer,
    postInteractions: postInteractionsReducer,
    projectDiscussions: projectDiscussionsReducer,
  },
});
