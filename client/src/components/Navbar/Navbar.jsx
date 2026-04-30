import { Bell, CodeXml, Menu, User } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "../Theme/ThemeToggle";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Issues", to: "/issues" },
  { label: "Discussions", to: "/discussions" },
  { label: "Deployments", to: "/deployments" },
  { label: "Sign In", to: "/sign-in" },
  { label: "Sign Up", to: "/sign-up" },
];

const Navbar = () => {
  return (
    <header className="sticky top-1 z-20 rounded-full border border-slate-300/80 bg-white/85 backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/75">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-visible border-slate-300  dark:border-white/10 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            {/* <img src="/meet.svg" alt="MeeTogether Logo" className="h-13 w-13 max-w-none object-contain" /> */}
            <img
              src="/meet.svg"
              alt="MeeTogether Logo"
              className="h-12.5 w-12.5 max-w-none object-contain md:h-13.25 md:w-13.25"
            />
          </div>
          <div>
            <h2 className="text-m font-semibold tracking-wide text-slate-900 dark:text-slate-100">
              MeeTogether
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Collaborative event workspace
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-2xl border border-slate-300 bg-white/80 p-1 dark:border-white/10 dark:bg-slate-900/80 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-inner dark:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
                }`
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/profile/:user-id"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
          >
            <User />
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 "
            type="button"
          >
            <Bell size={16} />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white md:hidden"
            type="button"
          >
            <Menu size={16} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
