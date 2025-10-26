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

  const updateUser = (id: number, data: { name?: string; email?: string }) =>
    dispatch(thunk.updateUser({ id, data }));

  const deleteUser = (id: number) =>
    dispatch(thunk.deleteUser(id));

  const fetchAllUsers = (params?: { name?: string; email?: string; skip?: number; take?: number }) =>
    dispatch(thunk.fetchAllUsers(params));

  const deleteUserByAdmin = (id: number) =>
    dispatch(thunk.deleteUserByAdmin(id));

  return {
    action: {
      login,
      register,
      updateUser,
      deleteUser,
      fetchAllUsers,
      deleteUserByAdmin,
    },
    state,
  };
};
