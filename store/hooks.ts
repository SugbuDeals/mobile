import { AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "./types";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<AppState>();
