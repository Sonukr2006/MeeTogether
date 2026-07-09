import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Home from "../Home/Home";
import LandingPage from "./LandingPage";

const LandingOrHome = () => {
  const { currentUser, initialized } = useSelector((state) => state.auth);

  if (!initialized) return null;

  if (currentUser) {
    if (!currentUser.emailVerified) {
      return <Navigate to="/verify-email" replace />;
    }
    return <Home />;
  }

  return <LandingPage />;
};

export default LandingOrHome;
