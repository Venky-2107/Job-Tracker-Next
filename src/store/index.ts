import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import authReducer from "./authSlice";

// creates the redux store
export const store = configureStore({
  // empty for now, we will create slices as we go..

  // api.reducer — RTK Query needs its own slice in the store to cache API responses
  // api.middleware — handles caching, invalidation, and refetching automatically behind the scenes
  reducer: {
    // RTk query cache
    [api.reducerPath]: api.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// Typescript types to get autocomplete everywhere.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
