import * as thunk from "@/features/auth/thunk";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { LoginCredentials, RegisterPayload } from "./types";

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.auth);

  const login = (credentials: LoginCredentials) =>
    dispatch(thunk.login(credentials));

  const register = (payload: RegisterPayload) =>
    dispatch(thunk.register(payload));

  return {
    action: {
      login,
      register,
    },
    state,
  };
};
