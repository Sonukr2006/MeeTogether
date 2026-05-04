export default function UserMiniProfile({ user, className = "mb-4" }) {
  return (
    <div className={`${className} flex items-center gap-3`}>
      <img
        src={user.avatar}
        alt={user.name}
        className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
      />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold">{user.name}</h3>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {user.bio}
        </p>
      </div>
    </div>
  );
}
