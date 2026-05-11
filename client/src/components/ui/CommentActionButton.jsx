import { MessageCircle } from "lucide-react";

export default function CommentActionButton({
  count = 0,
  label = "Comments",
  ariaLabel,
  onClick,
  component: Component,
  componentProps,
  className = "",
}) {
  const sharedClassName = `inline-flex items-center gap-2 text-slate-500 transition duration-200 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 ${className}`.trim();

  if (Component) {
    return (
      <Component
        className={sharedClassName}
        aria-label={ariaLabel ?? `${label}, ${count}`}
        {...componentProps}
      >
        <MessageCircle size={16} />
        <span className="text-sm">{count}</span>
        <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
      </Component>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedClassName}
      aria-label={ariaLabel ?? `${label}, ${count}`}
    >
      <MessageCircle size={16} />
      <span className="text-sm">{count}</span>
      <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
    </button>
  );
}
