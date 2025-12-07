import * as thunk from "@/features/auth/thunk";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { LoginCredentials, RegisterPayload } from "./types";

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.auth);

  // Derived state: showError is true when there's an error and not loading
  const showError = useAppSelector(
    (state) => !!state.auth.error && !state.auth.loading
  );

  const login = (credentials: LoginCredentials) =>
    dispatch(thunk.login(credentials));

  const register = (payload: RegisterPayload) =>
    dispatch(thunk.register(payload));

  const updateUser = (id: number, data: { name?: string; email?: string; imageUrl?: string }) =>
    dispatch(thunk.updateUser({ id, data }));

  const deleteUser = (id: number) =>
    dispatch(thunk.deleteUser(id));

  const fetchAllUsers = (params?: { name?: string; email?: string; skip?: number; take?: number }) =>
    dispatch(thunk.fetchAllUsers(params));

  const deleteUserByAdmin = (id: number) =>
    dispatch(thunk.deleteUserByAdmin(id));
  const approveRetailer = (id: number) =>
    dispatch(thunk.approveRetailer(id));

  return {
    action: {
      login,
      register,
      updateUser,
      deleteUser,
      fetchAllUsers,
      deleteUserByAdmin,
      approveRetailer,
    },
    state: {
      ...state,
      showError,
    },
  };
};
