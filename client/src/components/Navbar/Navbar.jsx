import { Bell, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "../Theme/ThemeToggle";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Requests", to: "/requests" },
  { label: "Issues", to: "/issues" },
  { label: "Discussions", to: "/discussions" },
  { label: "Deployments", to: "/deployments" },
  { label: "Sign In", to: "/sign-in" },
  { label: "Sign Up", to: "/sign-up" },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const unreadRequests = useSelector(
    (state) =>
      state.opportunityRequests.requests.filter((request) => request.unread).length
  );

  return (
    <>
      <header className="sticky top-1 z-30 rounded-full border border-slate-300/80 bg-white/85 backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/75">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-visible border-slate-300  dark:border-white/10 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            {/* <img src="/meet.svg" alt="MeeTogether Logo" className="h-13 w-13 max-w-none object-contain" /> */}
            <img
              src="/meet.svg"
              alt="MeeTogether Logo"
              className="h-[50px] w-[50px] max-w-none object-contain md:h-[53px] md:w-[53px]"
            />
          </div>
          <div>
            <h2 className="text-m font-semibold tracking-wide text-slate-900 dark:text-slate-100">
              MeeTogether
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Build-first tech network
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
            to="/profile/sonu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Open Proof Profile"
          >
            <User size={16} />
          </Link>
          <Link
            to="/requests"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Open Requests Center"
          >
            <Bell size={16} />
            {unreadRequests > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-1 text-[10px] font-bold leading-none text-white dark:border-slate-900">
                {unreadRequests}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white md:hidden"
            type="button"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
        </nav>
      </header>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-nav-drawer"
        className={`fixed inset-x-4 top-18 z-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl transition duration-200 md:hidden dark:border-slate-800 dark:bg-slate-900 ${
          isMobileMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Navigate MeeTogether
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proof, collaboration, and requests
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-4 grid gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-800"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                }`
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/profile/sonu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <User size={16} />
            Profile
          </Link>
          <Link
            to="/requests"
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Bell size={16} />
            Inbox {unreadRequests > 0 ? `(${unreadRequests})` : ""}
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
