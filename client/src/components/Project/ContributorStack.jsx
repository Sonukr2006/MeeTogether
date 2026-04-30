import { FaEllipsisH, FaUserAlt } from "react-icons/fa";

const avatarColors = [
  "bg-green-100 text-green-700 ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30",
  "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
  "bg-purple-100 text-purple-700 ring-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-500/30",
  "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
];

function normalizeContributors(contributors) {
  if (Array.isArray(contributors)) {
    return contributors;
  }

  return Array.from({ length: contributors || 0 }, (_, index) => ({
    id: index + 1,
    name: `Contributor ${index + 1}`,
  }));
}

export default function ContributorStack({ contributors = 0, maxVisible = 4 }) {
  const contributorList = normalizeContributors(contributors);
  const visibleContributors = contributorList.slice(0, maxVisible);
  const extraCount = Math.max(contributorList.length - maxVisible, 0);

  if (!contributorList.length) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex -space-x-2">
        {visibleContributors.map((contributor, index) => (
          <div
            key={contributor.id || contributor.name || index}
            title={contributor.name}
            className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-sm ring-1 ${
              avatarColors[index % avatarColors.length]
            }`}
          >
            {contributor.avatar ? (
              <img
                src={contributor.avatar}
                alt={contributor.name || "Contributor"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FaUserAlt className="text-xs" />
            )}
          </div>
        ))}

        {extraCount > 0 && (
          <div
            title={`${extraCount} more contributor${extraCount > 1 ? "s" : ""}`}
            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 flex items-center justify-center shadow-sm ring-1 ring-gray-300 dark:ring-gray-700"
          >
            <FaEllipsisH className="text-xs" />
          </div>
        )}
      </div>

      <span className="text-xs text-gray-500 dark:text-gray-400">
        {contributorList.length} Contributor{contributorList.length > 1 ? "s" : ""}
      </span>
    </div>
  );
}
