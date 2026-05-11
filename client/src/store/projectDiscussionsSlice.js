import { createSlice } from "@reduxjs/toolkit";
const createInitialState = () => ({
  activeThreadByProject: {},
  threadsByProject: {},
});

const ensureProjectThread = (state, projectId, projectTitle, authorName) => {
  const existingThreads = state.threadsByProject[projectId] || [];

  if (existingThreads.length > 0) {
    if (!state.activeThreadByProject[projectId]) {
      state.activeThreadByProject[projectId] = existingThreads[0].id;
    }
    return;
  }

  const threadId = `project-${projectId}-${Date.now()}`;
  state.threadsByProject[projectId] = [
    {
      id: threadId,
      title: `${projectTitle} discussion`,
      createdBy: authorName,
      lastActivity: "Just now",
      messages: [
        {
          id: Date.now(),
          author: authorName,
          role: "Student Builder",
          message: `Started a new discussion room for ${projectTitle}.`,
          sentAt: new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        },
      ],
    },
  ];
  state.activeThreadByProject[projectId] = threadId;
};

const projectDiscussionsSlice = createSlice({
  name: "projectDiscussions",
  initialState: createInitialState(),
  reducers: {
    ensureDiscussionThread: (state, action) => {
      const { projectId, projectTitle, authorName } = action.payload;
      ensureProjectThread(state, projectId, projectTitle, authorName);
    },
    setActiveDiscussionThread: (state, action) => {
      const { projectId, threadId } = action.payload;
      state.activeThreadByProject[projectId] = threadId;
    },
    addDiscussionMessage: (state, action) => {
      const { projectId, projectTitle, author, message, role } = action.payload;
      ensureProjectThread(state, projectId, projectTitle, author);

      const activeThreadId = state.activeThreadByProject[projectId];
      const thread = (state.threadsByProject[projectId] || []).find(
        (item) => item.id === activeThreadId
      );

      if (!thread) {
        return;
      }

      thread.messages.push({
        id: Date.now(),
        author,
        role,
        message,
        sentAt: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      });
      thread.lastActivity = "Just now";
    },
  },
});

export const {
  addDiscussionMessage,
  ensureDiscussionThread,
  setActiveDiscussionThread,
} = projectDiscussionsSlice.actions;

export default projectDiscussionsSlice.reducer;
