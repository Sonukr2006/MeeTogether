import { useEffect, useState } from "react";
import { Activity, ExternalLink, GitBranch, Rocket, ShieldCheck, TimerReset } from "lucide-react";
import { apiRequest } from "../../lib/api";

export default function Deployments() {
  const [deploymentCards, setDeploymentCards] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadDeployments = async () => {
      try {
        const response = await apiRequest("/deployments");
        if (isMounted && Array.isArray(response)) {
          setDeploymentCards(
            response.map((deployment) => ({
              ...deployment,
              status: {
                ...deployment.status,
                chipClassName:
                  deployment.status.label === "Live"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : deployment.status.label === "Preview"
                      ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
              },
            })),
          );
        }
      } catch {
        if (isMounted) {
          setDeploymentCards([]);
        }
      }
    };

    void loadDeployments();

    return () => {
      isMounted = false;
    };
  }, []);

  const liveCount = deploymentCards.filter((card) => card.status.label === "Live").length;
  const previewCount = deploymentCards.filter((card) => card.status.label === "Preview").length;

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Shipping visibility
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Deployments</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Track live builds, preview environments, and deployment readiness across active project rooms.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <Rocket size={18} className="text-emerald-600 dark:text-emerald-400" />
            <p className="mt-3 text-2xl font-semibold">{liveCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Live environments</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <Activity size={18} className="text-sky-600 dark:text-sky-400" />
            <p className="mt-3 text-2xl font-semibold">{previewCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Preview deployments</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <ShieldCheck size={18} className="text-violet-600 dark:text-violet-400" />
            <p className="mt-3 text-2xl font-semibold">{deploymentCards.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tracked build rooms</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {deploymentCards.length > 0 ? (
          deploymentCards.map((deployment) => (
            <article
              key={deployment.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{deployment.title}</h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${deployment.status.chipClassName}`}
                  >
                    <Rocket size={12} />
                    {deployment.status.label}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {deployment.environment}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {deployment.status.note}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {deployment.updatedAt}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {deployment.buildHealth}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {deployment.mentorStatus}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={deployment.liveUrl}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <ExternalLink size={14} />
                  Open build
                </a>
                <a
                  href={deployment.repoUrl}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <GitBranch size={14} />
                  Repository
                </a>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Deployment progress
                    </p>
                    <p className="mt-1 text-lg font-semibold">{deployment.progress}% shipped</p>
                  </div>
                  <TimerReset className="text-slate-400 dark:text-slate-500" size={18} />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${deployment.progress}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Current release focus: {deployment.milestone}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Stack deployed
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {deployment.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">No tracked deployments yet</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Deployment cards now come only from backend records.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
