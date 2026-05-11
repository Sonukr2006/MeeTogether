import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  BriefcaseBusiness,
  Check,
  Clock3,
  Download,
  GraduationCap,
  Handshake,
  MessageCircle,
  Rocket,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import PageLoadingState from "../ui/PageLoadingState";
import {
  markAllRequestsRead,
  updateRequestStatus,
} from "../../store/opportunityRequestsSlice";

const requestFilters = ["All", "Project", "Mentor", "Internship", "Message", "Resume"];

const requestIcons = {
  internship: BriefcaseBusiness,
  mentor: GraduationCap,
  message: MessageCircle,
  project: Rocket,
  resume: Download,
};

const Requests = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [backendRequests, setBackendRequests] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const profileHandle = currentUser?.username ?? "builder";
  const profileName = currentUser?.name ?? "This builder";
  const requests = useSelector((state) => state.opportunityRequests.requests);
  const sourceRequests = backendRequests ?? requests;
  const unreadCount = sourceRequests.filter((request) => request.unread).length;
  const highIntentCount = sourceRequests.filter((request) => request.status === "High intent").length;
  const awaitingReplyCount = sourceRequests.filter((request) =>
    ["New", "Waiting", "Reply", "Sent"].includes(request.status)
  ).length;
  const summary = [
    { label: "New requests", value: unreadCount, icon: Bell },
    { label: "High intent", value: highIntentCount, icon: ShieldCheck },
    { label: "Awaiting reply", value: awaitingReplyCount, icon: Clock3 },
    { label: "Opportunities", value: sourceRequests.length, icon: Handshake },
  ];

  useEffect(() => {
    let ignore = false;

    const loadRequests = async () => {
      if (!currentUser?.username) {
        setBackendRequests(null);
        return;
      }

      setIsLoading(true);

      try {
        const data = await apiRequest(
          `/requests?username=${encodeURIComponent(currentUser.username)}`
        );

        if (!ignore && Array.isArray(data)) {
          setBackendRequests(data);
        }
      } catch {
        if (!ignore) {
          setBackendRequests(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      ignore = true;
    };
  }, [currentUser?.username]);

  const visibleRequests = useMemo(() => {
    if (activeFilter === "All") {
      return sourceRequests;
    }

    return sourceRequests.filter((request) => request.type === activeFilter);
  }, [activeFilter, sourceRequests]);

  const handleStatusUpdate = (id, status) => {
    dispatch(updateRequestStatus({ id, status }));
  };

  if (isLoading && backendRequests === null) {
    return (
      <PageLoadingState
        className="max-w-6xl"
        title="Loading requests"
        message="We’re fetching your latest opportunity inbox."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Opportunity inbox
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Requests Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Manage project invites, mentor review requests, internship offers, messages, and proof resume activity in one builder workflow.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <Search size={17} />
              <span>Search opportunities</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(markAllRequestsRead())}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {requestFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`shrink-0 rounded-md border px-3 py-2 text-xs font-semibold transition ${
              activeFilter === filter
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {visibleRequests.map((request) => {
            const Icon = requestIcons[request.iconKey] || Bell;
            return (
              <article
                key={request.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{request.title}</h2>
                        {request.unread && (
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        )}
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {request.from} · {request.role} · {request.time}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {request.message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {request.proof.map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(request.id, "Declined")}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <X size={16} />
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(request.id, "Replying")}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  >
                    <MessageCircle size={16} />
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(request.id, "Accepted")}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Check size={16} />
                    Accept
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Inbox flow</h2>
            <div className="mt-4 space-y-4">
              {["Profile action", "Request sent", "Accept or reply", "Project room"].map(
                (step, index) => (
                  <div key={step} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{step}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {index === 0 && "A recruiter, mentor, or builder starts from Proof Profile."}
                        {index === 1 && "The opportunity arrives here with proof context attached."}
                        {index === 2 && `${profileName} can accept, decline, or continue the conversation.`}
                        {index === 3 && "Accepted work can move into a collaboration room."}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <ShieldCheck className="text-emerald-700 dark:text-emerald-300" size={22} />
            <h2 className="mt-3 text-lg font-semibold text-emerald-950 dark:text-emerald-100">
              Proof attached by default
            </h2>
            <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
              Every request keeps the builder signal visible: shipped work, verified skills, reviews, and links for @{profileHandle}.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Requests;
