import {
  Award,
  CheckCircle2,
  Code2,
  ExternalLink,
  GraduationCap,
  Link as LinkIcon,
  Printer,
  Rocket,
  ShieldCheck,
  Star,
} from "lucide-react";
import { proofProfile } from "../../data/proofProfile";

const resumeHighlights = [
  { label: "Shipped projects", value: `${proofProfile.shippedProjects}`, icon: Rocket },
  { label: "Completed tasks", value: `${proofProfile.completedTasks}`, icon: CheckCircle2 },
  { label: "Verified skills", value: `${proofProfile.verifiedSkills}`, icon: ShieldCheck },
  { label: "Mentor reviews", value: `${proofProfile.mentorReviews}`, icon: GraduationCap },
];

const Resume = () => {
  return (
    <div className="mx-auto max-w-5xl text-slate-900 dark:text-slate-100 print:max-w-none print:bg-white print:text-slate-950">
      <div className="mb-4 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Shareable proof document
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Proof Resume</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Printer size={16} />
          Print or save PDF
        </button>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-0 print:p-0 print:shadow-none">
        <header className="grid gap-5 border-b border-slate-200 pb-5 dark:border-slate-800 print:grid-cols-[1fr_220px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 print:border print:border-emerald-200">
                <ShieldCheck size={14} />
                Verified builder
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 print:border print:border-slate-200 print:bg-white">
                @{proofProfile.username}
              </span>
            </div>
            <h2 className="mt-4 text-4xl font-semibold tracking-normal print:text-3xl">
              {proofProfile.name}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 print:text-slate-700">
              {proofProfile.headline}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400 print:text-slate-700">
              {proofProfile.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300 print:text-slate-700">
              {proofProfile.resumeLinks.map((link) => (
                <span
                  key={link}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 dark:border-slate-700"
                >
                  <LinkIcon size={13} />
                  {link}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10 print:bg-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Proof score
                </p>
                <p className="mt-2 text-4xl font-semibold">{proofProfile.proofScore}</p>
              </div>
              <Award className="text-emerald-700 dark:text-emerald-300" size={30} />
            </div>
            <p className="mt-4 text-sm font-semibold text-emerald-900 dark:text-emerald-100 print:text-slate-900">
              {proofProfile.builderLevel}
            </p>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300 print:text-slate-700">
              {proofProfile.rank}
            </p>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {resumeHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 print:bg-white"
              >
                <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 print:text-slate-700">
                  {item.label}
                </p>
              </div>
            );
          })}
        </section>

        <main className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] print:grid-cols-[1.25fr_0.75fr]">
          <section>
            <div className="flex items-center gap-2">
              <Rocket className="text-emerald-600 dark:text-emerald-400" size={20} />
              <h3 className="text-lg font-semibold">Shipped Projects</h3>
            </div>
            <div className="mt-3 space-y-3">
              {proofProfile.projects.map((project) => (
                <div
                  key={project.name}
                  className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{project.name}</h4>
                      <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 print:border print:border-sky-200 print:bg-white">
                        {project.status}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {project.impact}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 print:text-slate-700">
                    {project.resumeProof}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(project.resumeStack || project.stack).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 print:border print:border-slate-200 print:bg-white print:text-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <section>
              <div className="flex items-center gap-2">
                <Code2 className="text-emerald-600 dark:text-emerald-400" size={20} />
                <h3 className="text-lg font-semibold">Verified Skills</h3>
              </div>
              <div className="mt-3 space-y-2">
                {proofProfile.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <p className="text-sm font-semibold">{skill.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 print:text-slate-700">
                      {skill.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2">
                <GraduationCap className="text-emerald-600 dark:text-emerald-400" size={20} />
                <h3 className="text-lg font-semibold">Mentor Reviews</h3>
              </div>
              <div className="mt-3 space-y-3">
                {proofProfile.reviews.map((review) => (
                  <div
                    key={review.mentor}
                    className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} size={13} fill="currentColor" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 print:text-slate-700">
                      "{review.text}"
                    </p>
                    <p className="mt-2 text-sm font-semibold">{review.mentor}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700">
                      {review.role}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </main>

        <footer className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 print:flex-row print:items-center print:justify-between print:text-slate-700">
          <span>Generated by MeeTogether Proof Profile</span>
          <span className="inline-flex items-center gap-1.5">
            <ExternalLink size={13} />
            /profile/sonu · /resume/sonu
          </span>
        </footer>
      </article>
    </div>
  );
};

export default Resume;
