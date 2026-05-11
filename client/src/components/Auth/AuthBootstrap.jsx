import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bootstrapComplete, restoreSession } from "../../store/authSlice";

const AuthBootstrap = () => {
  const dispatch = useDispatch();
  const { accessToken, initialized, needsSessionRefresh } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (accessToken && needsSessionRefresh) {
      dispatch(restoreSession());
    }
  }, [accessToken, dispatch, needsSessionRefresh]);

  useEffect(() => {
    if (!accessToken && !initialized) {
      dispatch(bootstrapComplete());
    }
  }, [accessToken, dispatch, initialized]);

  return null;
};

export default AuthBootstrap;
