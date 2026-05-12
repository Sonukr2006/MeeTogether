import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { restoreSession } from "../../store/authSlice";

const AuthBootstrap = () => {
  const dispatch = useDispatch();
  const { initialized, needsSessionRefresh } = useSelector((state) => state.auth);

  useEffect(() => {
    if (needsSessionRefresh && !initialized) {
      dispatch(restoreSession());
    }
  }, [dispatch, initialized, needsSessionRefresh]);

  return null;
};

export default AuthBootstrap;
