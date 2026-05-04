import { createSlice } from "@reduxjs/toolkit";
import {
  actionRequestTemplates,
  initialOpportunityRequests,
  requestProofPackage,
} from "../data/proofProfile";

const initialState = {
  requests: initialOpportunityRequests,
};

const opportunityRequestsSlice = createSlice({
  name: "opportunityRequests",
  initialState,
  reducers: {
    addRequestFromProfileAction: (state, action) => {
      const template = actionRequestTemplates[action.payload.intent];

      if (!template) {
        return;
      }

      state.requests.unshift({
        id: Date.now(),
        time: "Just now",
        unread: true,
        proof: requestProofPackage,
        ...template,
      });
    },
    updateRequestStatus: (state, action) => {
      const { id, status } = action.payload;
      const request = state.requests.find((item) => item.id === id);

      if (request) {
        request.status = status;
        request.unread = false;
      }
    },
    markAllRequestsRead: (state) => {
      state.requests.forEach((request) => {
        request.unread = false;
      });
    },
  },
});

export const {
  addRequestFromProfileAction,
  markAllRequestsRead,
  updateRequestStatus,
} = opportunityRequestsSlice.actions;

export default opportunityRequestsSlice.reducer;
