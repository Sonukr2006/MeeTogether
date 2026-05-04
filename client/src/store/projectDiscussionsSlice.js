import { createSlice } from "@reduxjs/toolkit";
import { projects } from "../data/projects";

const createInitialState = () => {
  const threadsByProject = {};
  const activeThreadByProject = {};

  projects.forEach((project) => {
    const messages = (project.discussions || []).map((discussion) => ({
      id: discussion.id,
      author: discussion.author,
      role: discussion.role,
      message: discussion.message,
    }));

    if (messages.length > 0) {
      const threadId = `project-${project.id}-general`;
      threadsByProject[project.id] = [
        {
          id: threadId,
          title: `${project.title} discussion`,
          createdBy: messages[0].author,
          lastActivity: project.time,
          messages,
        },
      ];
      activeThreadByProject[project.id] = threadId;
    } else {
      threadsByProject[project.id] = [];
      activeThreadByProject[project.id] = null;
    }
  });

  return {
    activeThreadByProject,
    threadsByProject,
  };
};

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
