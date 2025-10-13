import { login } from "@/features/auth/thunk";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { LoginCredentials } from "./type";

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.auth);

  const action = (credentials: LoginCredentials) =>
    dispatch(login(credentials));

  return {
    action,
    state,
  };
};
