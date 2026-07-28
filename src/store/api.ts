import {
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

// What's happening:

// createApi — RTK Query's way of defining all API calls in one place
// baseQuery — like axios baseURL + interceptor combined in one
// prepareHeaders — same as your axios request interceptor that added the Bearer token
// endpoints: () => ({}) — empty for now, we'll add endpoints per feature

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
      const token = match ? match[1] : null;
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// wrapper around baseQuery that handles 401 globally
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    // clear the cookie
    document.cookie = "token=; path=/; max-age=0";
    // redirect to login
    window.location.href = "/login";
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  tagTypes: ["Applications"],
  baseQuery: baseQueryWithReauth, // use wrapper instead of baseQuery directly
  endpoints: () => ({}),
});
