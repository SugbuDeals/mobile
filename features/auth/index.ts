import * as thunk from "@/features/auth/thunk";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { LoginCredentials } from "./types";

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.auth);

  const login = (credentials: LoginCredentials) =>
    dispatch(thunk.login(credentials));

  return {
    action: {
      login,
    },
    state,
  };
};
