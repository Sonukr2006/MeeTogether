import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Hash,
  MessageCircle,
  Search,
  Send,
  Target,
  Users,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import PageLoadingState from "../ui/PageLoadingState";
import { fetchProjects } from "../../store/projectsSlice";

const Discussions = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messageText, setMessageText] = useState("");
  const [roomQuery, setRoomQuery] = useState("");
  const [showMobileInbox, setShowMobileInbox] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isThreadsLoading, setIsThreadsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [backendThreads, setBackendThreads] = useState({});
  const [backendMessages, setBackendMessages] = useState({});
  const [threadsErrorByProject, setThreadsErrorByProject] = useState({});
  const [messagesErrorByThread, setMessagesErrorByThread] = useState({});
  const [threadReloadTick, setThreadReloadTick] = useState(0);
  const [messageReloadTick, setMessageReloadTick] = useState(0);
  const [activeBackendThreadByProject, setActiveBackendThreadByProject] = useState(
    {},
  );
  const [sendError, setSendError] = useState("");
  const composerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const projectIdParam = searchParams.get("projectId");
  const currentUser = useSelector((state) => state.auth.currentUser);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const projectItems = useSelector((state) => state.projects.items);
  const projectsStatus = useSelector((state) => state.projects.status);

  const selectedProject = useMemo(() => {
    if (projectItems.length === 0) {
      return null;
    }

    if (projectIdParam) {
      return (
        projectItems.find((project) => String(project.id) === projectIdParam) ||
        projectItems[0]
      );
    }

    return projectItems[0];
  }, [projectIdParam, projectItems]);

  const selectedProjectId = selectedProject ? String(selectedProject.id) : "";
  const filteredProjects = useMemo(() => {
    const query = roomQuery.trim().toLowerCase();

    if (!query) {
      return projectItems;
    }

    return projectItems.filter((project) => {
      const searchableText = [
        project.title,
        project.problem,
        project.solution,
        ...project.techStack,
        ...project.openRoles,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [projectItems, roomQuery]);

  const liveThreads = backendThreads[selectedProjectId];
  const selectedThreads = liveThreads ?? [];
  const activeThreadId = activeBackendThreadByProject[selectedProjectId] ?? null;
  const selectedMessageList = activeThreadId
    ? backendMessages[activeThreadId]
    : null;
  const threadsLoadError = threadsErrorByProject[selectedProjectId] ?? "";
  const activeThread =
    selectedThreads.find((thread) => thread.id === activeThreadId) ||
    selectedThreads[0];
  const messagesLoadError = activeThread?.id
    ? messagesErrorByThread[activeThread.id] ?? ""
    : "";
  const showThreadList = selectedThreads.length > 1;

  useEffect(() => {
    const textarea = composerRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [messageText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessageList]);

  const formatActivityTime = (value) => {
    if (!value) {
      return "";
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const retryThreadLoad = () => {
    if (!selectedProjectId) {
      return;
    }

    setThreadsErrorByProject((prev) => ({
      ...prev,
      [selectedProjectId]: "",
    }));
    setThreadReloadTick((value) => value + 1);
  };

  const retryMessageLoad = () => {
    if (!activeThread?.id) {
      return;
    }

    setMessagesErrorByThread((prev) => ({
      ...prev,
      [activeThread.id]: "",
    }));
    setMessageReloadTick((value) => value + 1);
  };

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    if (!projectIdParam) {
      setSearchParams({ projectId: String(selectedProject.id) }, { replace: true });
    }
  }, [
    dispatch,
    projectIdParam,
    selectedProject,
    setSearchParams,
  ]);

  useEffect(() => {
    let ignore = false;

    const loadThreads = async () => {
      if (!selectedProjectId) {
        return;
      }

      try {
        setIsThreadsLoading(true);
        const response = await apiRequest(`/projects/${selectedProjectId}/threads`);
        const data = response?.data ?? (Array.isArray(response) ? response : []);

        if (!ignore) {
          setThreadsErrorByProject((prev) => ({
            ...prev,
            [selectedProjectId]: "",
          }));
          setBackendThreads((prev) => ({
            ...prev,
            [selectedProjectId]: data,
          }));
          setActiveBackendThreadByProject((prev) => ({
            ...prev,
            [selectedProjectId]:
              data.find((thread) => thread.id === prev[selectedProjectId])?.id ??
              data[0]?.id ??
              null,
          }));
        }
      } catch (error) {
        if (!ignore) {
          setThreadsErrorByProject((prev) => ({
            ...prev,
            [selectedProjectId]:
              error?.message || "We couldn't load the discussion rooms right now.",
          }));
          setBackendThreads((prev) => ({
            ...prev,
            [selectedProjectId]: null,
          }));
        }
      } finally {
        if (!ignore) {
          setIsThreadsLoading(false);
        }
      }
    };

    loadThreads();

    return () => {
      ignore = true;
    };
  }, [selectedProjectId, threadReloadTick]);

  useEffect(() => {
    let ignore = false;

    const loadMessages = async () => {
      if (!activeThread?.id || !selectedProjectId) {
        return;
      }

      try {
        setIsMessagesLoading(true);
        const response = await apiRequest(`/threads/${activeThread.id}/messages`);
        const data = response?.data ?? (Array.isArray(response) ? response : []);

        if (!ignore) {
          setMessagesErrorByThread((prev) => ({
            ...prev,
            [activeThread.id]: "",
          }));
          setBackendMessages((prev) => ({
            ...prev,
            [activeThread.id]: data.map((message) => ({
              ...message,
              sentAt: new Date(message.sentAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              }),
            })),
          }));

          if (currentUser?.id && accessToken) {
            try {
              await apiRequest(`/threads/${activeThread.id}/read`, {
                method: "POST",
              });
              markThreadReadLocally(selectedProjectId, activeThread.id);
            } catch (error) {
              const message = error?.message?.toLowerCase?.() ?? "";

              if (!message.includes("unauthorized")) {
                throw error;
              }
            }
          }
        }
      } catch (error) {
        if (!ignore) {
          setMessagesErrorByThread((prev) => ({
            ...prev,
            [activeThread.id]:
              error?.message || "We couldn't load the conversation right now.",
          }));
          setBackendMessages((prev) => ({
            ...prev,
            [activeThread.id]: null,
          }));
        }
      } finally {
        if (!ignore) {
          setIsMessagesLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      ignore = true;
    };
  }, [accessToken, activeThread?.id, currentUser?.id, messageReloadTick, selectedProjectId]);

  const handleProjectSelect = (projectId) => {
    setSearchParams({ projectId: String(projectId) });
    setShowMobileInbox(false);
  };

  const markThreadReadLocally = (projectId, threadId) => {
    setBackendThreads((prev) => {
      const threads = prev[projectId];

      if (!Array.isArray(threads)) {
        return prev;
      }

      return {
        ...prev,
        [projectId]: threads.map((thread) => {
          if (thread.id !== threadId) {
            return thread;
          }

          if (!thread.unreadCount && thread.hasUnread === false) {
            return thread;
          }

          return {
            ...thread,
            unreadCount: 0,
            hasUnread: false,
          };
        }),
      };
    });
  };

  const handleMessageSubmit = async (event) => {
    event.preventDefault();

    if (!messageText.trim() || isSendingMessage) {
      return;
    }

    if (!activeThread?.id || !liveThreads) {
      return;
    }

    try {
      setIsSendingMessage(true);
      setSendError("");

      const createdMessage = await apiRequest(`/threads/${activeThread.id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          message: messageText.trim(),
        }),
      });

      setBackendMessages((prev) => ({
        ...prev,
        [activeThread.id]: [
          ...(prev[activeThread.id] ?? []),
          {
            ...createdMessage,
            sentAt: new Date(createdMessage.sentAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
          },
        ],
      }));
      setBackendThreads((prev) => {
        const threads = prev[selectedProjectId];

        if (!Array.isArray(threads)) {
          return prev;
        }

        return {
          ...prev,
          [selectedProjectId]: threads.map((thread) =>
            thread.id === activeThread.id
              ? {
                  ...thread,
                  unreadCount: 0,
                  hasUnread: false,
                  messageCount: (thread.messageCount ?? 0) + 1,
                  lastActivity: createdMessage.sentAt,
                  lastMessagePreview: createdMessage.message,
                }
              : thread,
          ),
        };
      });

      setMessagesErrorByThread((prev) => ({
        ...prev,
        [activeThread.id]: "",
      }));
      setMessageText("");
    } catch (error) {
      setSendError(error?.message || "We couldn't send that message. Try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!messageText.trim() || isSendingMessage) {
      return;
    }

    handleMessageSubmit(event);
  };

  if (projectsStatus === "loading" && projectItems.length === 0) {
    return (
      <PageLoadingState
        className="max-w-4xl"
        title="Loading discussion rooms"
        message="We’re pulling your project rooms and active threads."
      />
    );
  }

  if (!selectedProject) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-semibold">No discussion rooms yet</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Discussion inbox is now backend-driven. Once projects and threads exist in the API, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Shared collaboration surface
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Discussions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Join project chats, continue active threads, and start a discussion when a build room needs input.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(240px,0.34fr)_minmax(0,1fr)] xl:grid-cols-[minmax(260px,0.3fr)_minmax(0,1fr)]">
        <aside className="hidden h-full space-y-4 rounded-lg border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:block">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target size={17} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold">Build rooms</h2>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {filteredProjects.length}
            </span>
          </div>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={roomQuery}
              onChange={(event) => setRoomQuery(event.target.value)}
              placeholder="Search build rooms"
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-2">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleProjectSelect(project.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    String(project.id) === selectedProjectId
                      ? "border-emerald-500 bg-emerald-50 shadow-[inset_4px_0_0_0_rgba(16,185,129,1),0_10px_24px_rgba(15,23,42,0.08)] dark:border-emerald-400/50 dark:bg-slate-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`text-sm font-semibold ${
                        String(project.id) === selectedProjectId
                          ? "text-emerald-800 dark:text-emerald-100"
                          : ""
                      }`}
                    >
                      {project.title}
                    </p>
                    {String(project.id) === selectedProjectId ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                        Open
                      </span>
                    ) : null}
                  </div>
                  <div
                    className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${
                      String(project.id) === selectedProjectId
                        ? "text-emerald-700/80 dark:text-emerald-200/80"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-900">
                      {project.openRoles.length} roles open
                    </span>
                    <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-900">
                      {project.techStack.length} stack tags
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  No build rooms found.
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Try searching by room title, stack, or role.
                </p>
              </div>
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#313338] dark:text-slate-100">
          <div className="flex min-h-[calc(100vh-11rem)] flex-col md:min-h-[680px]">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-[#2b2d31] lg:hidden">
              <button
                type="button"
                onClick={() => setShowMobileInbox((value) => !value)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left dark:border-slate-700 dark:bg-[#383a40]"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Inbox
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedProject.title}
                  </p>
                </div>
                {showMobileInbox ? (
                  <ChevronUp size={16} className="shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="shrink-0 text-slate-400" />
                )}
              </button>
            </div>

            {showMobileInbox && (
              <>
                <button
                  type="button"
                  aria-label="Close inbox overlay"
                  className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
                  onClick={() => setShowMobileInbox(false)}
                />
                <div className="fixed inset-x-3 top-32 z-50 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-[#2b2d31] lg:hidden">
                  <div className="relative">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={roomQuery}
                      onChange={(event) => setRoomQuery(event.target.value)}
                      placeholder="Search build rooms"
                      className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-[#383a40] dark:text-slate-100"
                    />
                  </div>

                  <div className="mt-3 space-y-2">
                    {threadsLoadError ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                        <p>{threadsLoadError}</p>
                        <button
                          type="button"
                          onClick={retryThreadLoad}
                          className="mt-2 inline-flex rounded-md border border-rose-200 px-2 py-1 font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/10"
                        >
                          Retry
                        </button>
                      </div>
                    ) : null}
                    {isThreadsLoading && selectedThreads.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        Loading project threads...
                      </div>
                    ) : null}
                    {filteredProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleProjectSelect(project.id)}
                        className={`block w-full rounded-lg border px-3 py-2 text-left transition ${
                          String(project.id) === selectedProjectId
                            ? "border-emerald-500 bg-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_8px_20px_rgba(16,185,129,0.12)] dark:border-emerald-400 dark:bg-emerald-500/20"
                            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#383a40]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-semibold ${
                              String(project.id) === selectedProjectId
                                ? "text-emerald-800 dark:text-emerald-100"
                                : ""
                            }`}
                          >
                            {project.title}
                          </p>
                          {String(project.id) === selectedProjectId ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                              Open
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={`mt-1 text-[11px] ${
                            String(project.id) === selectedProjectId
                              ? "text-emerald-700/80 dark:text-emerald-200/80"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {project.openRoles.length} roles open
                        </p>
                      </button>
                    ))}
                  </div>

                  {showThreadList ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {selectedThreads.map((thread) => (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => {
                            setActiveBackendThreadByProject((prev) => ({
                              ...prev,
                              [selectedProjectId]: thread.id,
                            }));
                            setShowMobileInbox(false);
                          }}
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            activeThread?.id === thread.id
                              ? "border-emerald-500 bg-emerald-100 text-emerald-800 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_8px_20px_rgba(16,185,129,0.12)] dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-100"
                              : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#383a40] dark:text-slate-300"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span>{thread.title}</span>
                            {thread.unreadCount > 0 ? (
                              <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {thread.unreadCount}
                              </span>
                            ) : null}
                            {activeThread?.id === thread.id ? (
                              <span className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                                Open
                              </span>
                            ) : null}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            )}

            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-800 dark:bg-[#2b2d31]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-slate-400 dark:text-slate-500" />
                  <h2 className="truncate text-lg font-semibold">{selectedProject.title}</h2>
                  {activeThread ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                      {activeThread.title}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {activeThread
                    ? `Created by ${activeThread.createdBy} · ${
                        selectedMessageList?.length ??
                        activeThread.messageCount ??
                        activeThread.messages?.length ??
                        0
                      } messages${activeThread.unreadCount > 0 ? ` · ${activeThread.unreadCount} new` : ""}`
                    : "Start the channel conversation."}
                </p>
              </div>
              <Link
                to={`/projects/${selectedProject.id}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-[#404249] dark:text-slate-200 dark:hover:bg-[#4a4d55]"
              >
                <MessageCircle size={14} />
                Open build room
              </Link>
            </div>

            <div
              className={`grid min-h-0 flex-1 gap-0 ${
                showThreadList
                  ? "lg:grid-cols-[minmax(220px,0.34fr)_minmax(0,1fr)]"
                  : "lg:grid-cols-1"
              }`}
            >
              {showThreadList ? (
                <div className="hidden border-b border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-[#2b2d31] lg:block lg:border-b-0 lg:border-r">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Users size={14} className="text-slate-400 dark:text-slate-500" />
                    Channels
                  </div>
                  <div className="space-y-2">
                    {threadsLoadError ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                        <p>{threadsLoadError}</p>
                        <button
                          type="button"
                          onClick={retryThreadLoad}
                          className="mt-2 inline-flex rounded-md border border-rose-200 px-2 py-1 font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/10"
                        >
                          Retry
                        </button>
                      </div>
                    ) : null}
                    {isThreadsLoading && selectedThreads.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-[#35373c] dark:text-slate-400">
                        Loading project threads...
                      </div>
                    ) : null}
                    {selectedThreads.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() =>
                          setActiveBackendThreadByProject((prev) => ({
                            ...prev,
                            [selectedProjectId]: thread.id,
                          }))
                        }
                        className={`w-full rounded-lg border p-3 text-left transition ${
                          activeThread?.id === thread.id
                            ? "border-emerald-500 bg-emerald-50 shadow-[inset_4px_0_0_0_rgba(16,185,129,1),0_10px_24px_rgba(15,23,42,0.08)] dark:border-emerald-400/50 dark:bg-[#404249]"
                            : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-transparent dark:hover:bg-[#35373c]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={`flex items-center gap-1.5 text-sm font-semibold ${
                              activeThread?.id === thread.id
                                ? "text-emerald-800 dark:text-emerald-100"
                                : ""
                            }`}
                          >
                            <Hash
                              size={13}
                              className={
                                activeThread?.id === thread.id
                                  ? "text-emerald-600 dark:text-emerald-300"
                                  : "text-slate-400 dark:text-slate-500"
                              }
                            />
                            {thread.title}
                          </p>
                          <span
                            className={`text-[11px] ${
                              activeThread?.id === thread.id
                                ? "text-emerald-600/80 dark:text-emerald-200/80"
                                : "text-slate-400"
                            }`}
                          >
                            {formatActivityTime(thread.lastActivity)}
                          </span>
                        </div>
                        <div
                          className={`mt-2 flex items-center gap-2 text-[11px] ${
                            activeThread?.id === thread.id
                              ? "text-emerald-700/80 dark:text-emerald-200/80"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <Users size={12} />
                          <span>
                            {thread.messageCount ?? thread.messages?.length ?? 0} updates
                          </span>
                          {thread.unreadCount > 0 ? (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-semibold text-white">
                              {thread.unreadCount} new
                            </span>
                          ) : null}
                          {activeThread?.id === thread.id ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                              Open
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={`mt-2 line-clamp-2 text-xs leading-5 ${
                            activeThread?.id === thread.id
                              ? "text-emerald-900/75 dark:text-emerald-100/75"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {thread.lastMessagePreview
                            ? thread.lastMessagePreview
                            : `Created by ${thread.createdBy}. Open the room to start the conversation.`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-3 py-4 dark:bg-[#313338]" id="discussion-messages-container">
                  <div className="w-full">
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      <span>{selectedProject.contributors.length} builders in room</span>
                      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {isMessagesLoading &&
                    !(selectedMessageList || activeThread?.messages || []).length ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Loading conversation...
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            We’re fetching the latest room messages.
                          </p>
                        </div>
                      </div>
                    ) : messagesLoadError ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
                          <p className="text-sm font-medium text-rose-700 dark:text-rose-200">
                            Couldn&apos;t load this conversation.
                          </p>
                          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
                            {messagesLoadError}
                          </p>
                          <button
                            type="button"
                            onClick={retryMessageLoad}
                            className="mt-3 inline-flex rounded-md border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/10"
                          >
                            Retry loading messages
                          </button>
                        </div>
                      </div>
                    ) : (selectedMessageList || activeThread?.messages || []).length > 0 ? (
                      <div className="space-y-3">
                        {(selectedMessageList || activeThread?.messages || []).map((discussion) => {
                          const authorInitial = discussion.author.charAt(0).toUpperCase();
                          const isCurrentUser =
                            discussion.authorUser?.id === currentUser?.id;

                          return (
                            <div
                              key={discussion.id}
                              className="flex gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-100/70 dark:hover:bg-[#2e3035]"
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                  isCurrentUser
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-700 dark:bg-[#404249] dark:text-slate-200"
                                }`}
                              >
                                {authorInitial}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {discussion.author}
                                  </p>
                                  <span className="text-[11px] text-slate-400">
                                    {discussion.role}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {discussion.sentAt || activeThread.lastActivity}
                                  </span>
                                </div>
                                <p className="mt-1 max-w-none text-sm leading-7 text-slate-700 dark:text-slate-200">
                                  {discussion.message}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            No discussion messages yet.
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Start the first conversation for this build room.
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <form
                  onSubmit={handleMessageSubmit}
                  className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#2b2d31]"
                >
                  {sendError ? (
                    <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                      {sendError}
                    </div>
                  ) : null}
                  <div className="flex w-full gap-2">
                    <textarea
                      ref={composerRef}
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder={`Message ${selectedProject.title} discussion`}
                      disabled={isSendingMessage}
                      rows={1}
                      className="min-h-[44px] max-h-40 min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-[#3f4147] dark:bg-[#383a40] dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || isSendingMessage}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                      aria-label="Send discussion message"
                      title={isSendingMessage ? "Sending" : "Send"}
                    >
                      {isSendingMessage ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Discussions;
