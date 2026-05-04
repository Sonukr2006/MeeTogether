import { useMemo, useState } from "react";

export default function ExpandableText({
  text,
  previewLimit = 140,
  className = "text-sm leading-6 text-slate-600 dark:text-slate-300",
  buttonClassName = "mt-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
  wrapperClassName = "",
}) {
  const [expanded, setExpanded] = useState(false);

  const hasLongText = text.length > previewLimit;
  const visibleText = useMemo(() => {
    if (expanded || !hasLongText) {
      return text;
    }

    return `${text.slice(0, previewLimit).trimEnd()}...`;
  }, [expanded, hasLongText, previewLimit, text]);

  return (
    <div className={wrapperClassName}>
      <p className={className}>{visibleText}</p>
      {hasLongText && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={buttonClassName}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
