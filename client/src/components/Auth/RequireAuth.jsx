import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const RequireAuth = () => {
  const location = useLocation();
  const { currentUser, initialized } = useSelector((state) => state.auth);

  if (!initialized) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
