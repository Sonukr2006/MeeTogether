import { Loader2 } from "lucide-react";

export default function PageLoadingState({
  title = "Loading...",
  message = "Please wait while we fetch the latest data.",
  className = "",
}) {
  return (
    <div
      className={`mx-auto rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
