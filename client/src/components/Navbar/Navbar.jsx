import { Bell, FileText, FolderPlus, LogOut, Menu, PlusCircle, User, X } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import { useAlert } from "../../contexts/AlertProvider";
import { emptyProfile } from "../../lib/uiDefaults";
import { logOutUser } from "../../store/authSlice";
import ThemeToggle from "../Theme/ThemeToggle";

const baseNavItems = [
  { label: "Home", to: "/" },
  { label: "Requests", to: "/requests" },
  { label: "Issues", to: "/issues" },
  { label: "Discussions", to: "/discussions" },
  { label: "Deployments", to: "/deployments" },
];

const guestNavItems = [
  { label: "Sign In", to: "/sign-in" },
  { label: "Sign Up", to: "/sign-up" },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const { currentUser, initialized } = useSelector((state) => state.auth);
  const unreadRequests = useSelector(
    (state) =>
      state.opportunityRequests.requests.filter((request) => request.unread).length
  );
  const navItems = !initialized ? [] : currentUser ? baseNavItems : guestNavItems;
  const profileTarget = !initialized
    ? "#"
    : currentUser?.username
      ? `/profile/${currentUser.username}`
      : "/sign-in";
  const requestsTarget = !initialized ? "#" : currentUser ? "/requests" : "/sign-in";

  const openLogoutConfirm = () => {
    setIsLogoutConfirmOpen(true);
  };

  const closeLogoutConfirm = () => {
    setIsLogoutConfirmOpen(false);
  };

  const closeCreateMenu = () => {
    setIsCreateMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logOutUser()).unwrap();
      showAlert("Signed out successfully.", "success");
      setIsMobileMenuOpen(false);
      setIsLogoutConfirmOpen(false);
    } catch (error) {
      showAlert(error.message || "Sign out failed.", "error");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 rounded-b-[1.5rem] rounded-t-none border-x-0 border-b border-t-0 border-slate-300/80 bg-white/85 backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/75 md:top-1 md:rounded-full md:border">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center overflow-visible border-slate-300 dark:border-white/10 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:h-10 sm:w-10">
            {/* <img src="/meet.svg" alt="MeeTogether Logo" className="h-13 w-13 max-w-none object-contain" /> */}
            <img
              src="/meet.svg"
              alt="MeeTogether Logo"
              className="h-[44px] w-[44px] max-w-none object-contain sm:h-[50px] sm:w-[50px] md:h-[53px] md:w-[53px]"
            />
          </div>
          <div>
            <h2 className="text-[0.95rem] font-semibold tracking-wide text-slate-900 dark:text-slate-100 sm:text-[1.05rem]">
              MeeTogether
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
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
          <div className="hidden md:block">
            <ThemeToggle className="rounded-full" />
          </div>
          {currentUser ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setIsCreateMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700"
                aria-expanded={isCreateMenuOpen}
                aria-haspopup="menu"
                aria-label="Create"
                title="Create"
              >
                <PlusCircle size={16} />
              </button>

              {isCreateMenuOpen ? (
                <div className="absolute right-0 top-12 z-40 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <Link
                    to="/create/project"
                    onClick={closeCreateMenu}
                    className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <FolderPlus size={16} />
                    <div>
                      <p className="font-semibold">New project</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Start a build room
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/create/post"
                    onClick={closeCreateMenu}
                    className="mt-1 flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <FileText size={16} />
                    <div>
                      <p className="font-semibold">New post</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Share a live update
                      </p>
                    </div>
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
          {initialized && currentUser ? (
            <button
              type="button"
              onClick={openLogoutConfirm}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60 md:inline-flex"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          ) : null}
          <Link
            to={profileTarget}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 sm:h-10 sm:w-10 md:border md:border-slate-300 md:rounded-full md:dark:border-white/10"
            aria-label={
              !initialized
                ? "Checking your session"
                : currentUser
                  ? "Open Proof Profile"
                  : "Open Sign In"
            }
            title={
              !initialized
                ? "Checking your session"
                : currentUser
                  ? "Profile"
                  : "Sign in"
            }
            onClick={(event) => {
              if (!initialized) {
                event.preventDefault();
              }
            }}
          >
            {currentUser ? (
              <img
                src={currentUser.avatar || emptyProfile.avatar}
                alt={currentUser.name || "Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={16} />
            )}
          </Link>
          <Link
            to={requestsTarget}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 sm:h-10 sm:w-10 md:border md:border-slate-300 md:rounded-full md:dark:border-white/10"
            aria-label={
              !initialized
                ? "Checking your session"
                : currentUser
                  ? "Open Requests Center"
                  : "Open Sign In"
            }
            title={
              !initialized
                ? "Checking your session"
                : currentUser
                  ? "Requests"
                  : "Sign in"
            }
            onClick={(event) => {
              if (!initialized) {
                event.preventDefault();
              }
            }}
          >
            <Bell size={16} />
            {initialized && unreadRequests > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-1 text-[10px] font-bold leading-none text-white dark:border-slate-900">
                {unreadRequests}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white sm:h-10 sm:w-10 md:hidden"
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
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsCreateMenuOpen(false);
          }}
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
          {initialized && currentUser ? (
            <>
              <Link
                to="/create/project"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              >
                <FolderPlus size={16} />
                New Project
              </Link>
              <Link
                to="/create/post"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
              >
                <FileText size={16} />
                New Post
              </Link>
            </>
          ) : null}
          <Link
            to={profileTarget}
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-disabled={!initialized}
          >
            {currentUser ? (
              <img
                src={currentUser.avatar || emptyProfile.avatar}
                alt={currentUser.name || "Profile"}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <User size={16} />
            )}
            {!initialized ? "Checking session" : currentUser ? "Profile" : "Sign In"}
          </Link>
          <Link
            to={requestsTarget}
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            aria-disabled={!initialized}
          >
            <Bell size={16} />
            {!initialized
              ? "Checking session"
              : currentUser
                ? `Inbox ${unreadRequests > 0 ? `(${unreadRequests})` : ""}`
                : "Sign In"}
          </Link>
        </div>

        {initialized && currentUser && (
          <button
            type="button"
            onClick={openLogoutConfirm}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        )}
      </div>

      {isLogoutConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Confirm sign out
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Are you sure you want to sign out?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeLogoutConfirm}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Close sign out confirmation"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              You’ll return to the guest view and protected pages will ask you to sign in again.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeLogoutConfirm}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Navbar;
