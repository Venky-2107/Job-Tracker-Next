import { api } from "./api";

/**
 *injectEndpoints — adds endpoints to the base api we created earlier
 *builder.mutation — for POST/PUT/DELETE calls (anything that changes data)
 *builder.query — for GET calls (we'll use this for fetching applications)
 *RTK Query auto-generates hooks — useLoginMutation, useRegisterMutation — you call these directly in components, no useEffect needed
 */

export const authApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials: { username: string; password: string }) => ({
        url: "/auth/login",
        method: "POST",
        body: { email: credentials.username, password: credentials.password },
      }),
    }),
    Register: builder.mutation({
      query: (data: { name: string; email: string; password: string }) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
