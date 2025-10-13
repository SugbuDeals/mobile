import { useAppDispatch, useAppSelector } from "@/store/hooks";
import * as thunk from "./thunk";

export const useStore = () => {
  const dispatch = useAppDispatch();
  const { stores, loading, error } = useAppSelector((state) => state.store);

  const findStores = () => dispatch(thunk.findStores());

  return {
    action: {
      findStores,
    },
    state: {
      stores,
      loading,
      error,
    },
  };
};
