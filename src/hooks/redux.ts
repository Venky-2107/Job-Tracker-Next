import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";

// Instead of importing useDispatch and useSelector directly everywhere,
// sthese typed versions give you autocomplete and type safety automatically.
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelected = <T>(selector: (state: RootState) => T) =>
  useSelector(selector);
