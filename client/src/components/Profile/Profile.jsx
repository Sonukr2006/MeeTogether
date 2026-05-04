import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Code2,
  Download,
  ExternalLink,
  GitPullRequest,
  GraduationCap,
  Handshake,
  MessageCircle,
  MessageSquareQuote,
  Rocket,
  Send,
  ShieldCheck,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { proofProfile } from "../../data/proofProfile";
import { addRequestFromProfileAction } from "../../store/opportunityRequestsSlice";

const profileIconMap = {
  briefcase: BriefcaseBusiness,
  "check-circle": CheckCircle2,
  code: Code2,
  download: Download,
  external: ExternalLink,
  "graduation-cap": GraduationCap,
  handshake: Handshake,
  "message-circle": MessageCircle,
  review: MessageSquareQuote,
  rocket: Rocket,
  shield: ShieldCheck,
  star: Star,
  "user-plus": UserPlus,
};

const Profile = () => {
  const [activeAction, setActiveAction] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const closeAction = () => setActiveAction(null);
  const ActiveActionIcon = activeAction
    ? profileIconMap[activeAction.iconKey] || ShieldCheck
    : null;

  const handleActionContinue = () => {
    if (activeAction?.intent === "resume") {
      navigate(`/resume/${proofProfile.username}`);
      return;
    }

    dispatch(addRequestFromProfileAction({ intent: activeAction.intent }));
    navigate("/requests");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 shrink-0">
                <img
                  src={proofProfile.avatar}
                  alt={proofProfile.name}
                  className="h-28 w-28 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
                <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-white dark:border-slate-900">
                  <ShieldCheck size={18} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Verified proof profile
                  </p>
                  <p className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    @{proofProfile.username}
                  </p>
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                  {proofProfile.name}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {proofProfile.title}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {proofProfile.bio}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {proofProfile.openTo.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <Handshake size={14} />
                  Open to {item.toLowerCase()}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {proofProfile.actions.map((action) => {
                const Icon = profileIconMap[action.iconKey] || ShieldCheck;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => setActiveAction(action)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      action.primary
                        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                    }`}
                  >
                    <Icon size={16} />
                    {action.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {proofProfile.links.map((link) => {
                const Icon = profileIconMap[link.iconKey] || ExternalLink;
                return (
                  <a
                    key={link.label}
                    href="#"
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="shrink-0 text-slate-500 dark:text-slate-400" size={18} />
                      <span className="min-w-0">
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {link.label}
                        </span>
                        <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                          {link.value}
                        </span>
                      </span>
                    </span>
                    <ExternalLink className="shrink-0 text-slate-400" size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 lg:border-l lg:border-t-0 lg:p-7">
            <div className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-500/20 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Builder proof score
                  </p>
                  <p className="mt-2 text-5xl font-semibold tracking-normal">
                    {proofProfile.proofScore}
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Award size={30} />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {proofProfile.builderLevel}
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-300">
                  {proofProfile.rank}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {proofProfile.stats.slice(1).map((stat) => {
                const Icon = profileIconMap[stat.iconKey] || ShieldCheck;
                return (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <Icon size={18} className="text-slate-500 dark:text-slate-400" />
                    <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Trust signals
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">Ready for opportunity</h2>
                </div>
                <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={22} />
              </div>
              <div className="mt-4 space-y-3">
                {proofProfile.trustSignals.map((signal) => {
                  const Icon = profileIconMap[signal.iconKey] || ShieldCheck;
                  return (
                    <div key={signal.label} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{signal.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {signal.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Shipped work
                </p>
                <h2 className="mt-1 text-xl font-semibold">Projects with proof</h2>
              </div>
              <Rocket className="text-emerald-600 dark:text-emerald-400" size={22} />
            </div>

            <div className="mt-4 space-y-3">
              {proofProfile.projects.map((project) => (
                <article
                  key={project.name}
                  className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{project.name}</h3>
                        <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          {project.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {project.proof}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {project.score}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Skills verified by work
                </p>
                <h2 className="mt-1 text-xl font-semibold">Evidence-based skills</h2>
              </div>
              <Code2 className="text-emerald-600 dark:text-emerald-400" size={22} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {proofProfile.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">{skill.name}</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {skill.evidence}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Completed tasks</h2>
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={21} />
            </div>
            <div className="mt-4 space-y-3">
              {proofProfile.tasks.map((task) => (
                <div key={task} className="flex gap-3 text-sm">
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    size={16}
                  />
                  <span className="text-slate-700 dark:text-slate-300">{task}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Mentor reviews</h2>
              <GraduationCap className="text-emerald-600 dark:text-emerald-400" size={21} />
            </div>
            <div className="mt-4 space-y-4">
              {proofProfile.reviews.map((review) => (
                <article
                  key={review.mentor}
                  className="border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    "{review.text}"
                  </p>
                  <p className="mt-3 text-sm font-semibold">{review.mentor}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{review.role}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Contribution timeline</h2>
              <Clock3 className="text-emerald-600 dark:text-emerald-400" size={21} />
            </div>
            <div className="mt-4 space-y-4">
              {proofProfile.timeline.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <GitPullRequest size={15} />
                    </div>
                    <div className="mt-2 h-full w-px bg-slate-200 last:hidden dark:bg-slate-800" />
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.date}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {ActiveActionIcon && <ActiveActionIcon size={20} />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Proof action
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{activeAction.label}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAction}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close action"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {activeAction.description}
            </p>

            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Suggested proof package
              </p>
              <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                  MeeTogether project evidence
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                  Verified skills and mentor reviews
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                  GitHub and demo links
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeAction}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionContinue}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Send size={16} />
                {activeAction.actionLabel || "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
