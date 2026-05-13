import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const GuestOnlyRoute = () => {
  const { currentUser, initialized } = useSelector((state) => state.auth);

  if (!initialized) {
    return <Outlet />;
  }

  if (currentUser) {
    return <Navigate to={currentUser.emailVerified ? "/" : "/verify-email"} replace />;
  }

  return <Outlet />;
};

export default GuestOnlyRoute;
