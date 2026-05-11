import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const GuestOnlyRoute = () => {
  const { currentUser, initialized } = useSelector((state) => state.auth);

  if (!initialized) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Checking your session...
        </p>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default GuestOnlyRoute;
