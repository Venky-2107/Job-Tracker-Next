import { api } from "./api";
import { ApplicationRequest } from "@/types";

/** When createApplication succeeds,
 * RTK Query sees it invalidatesTags: ["Applications"]
 * and automatically refetches any query that providesTags: ["Applications"]
 * — which is fetchApplications. Dashboard updates automatically,
 * no manual refresh needed. */

export const applicationApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    CreateApplication: builder.mutation({
      query: (application: ApplicationRequest) => ({
        url: "/application/",
        method: "POST",
        body: application,
      }),
      invalidatesTags: ["Applications"],
    }),
    UpdateApplication: builder.mutation({
      query: ({ id, ...application }: { id: number } & ApplicationRequest) => ({
        url: `/application/${id}`,
        method: "PUT",
        body: application,
      }),
      invalidatesTags: ["Applications"],
    }),
    DeleteApplication: builder.mutation({
      query: (id: number) => ({
        url: `/application/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Applications"],
    }),
    FetchApplications: builder.query({
      query: () => ({
        url: "/application/",
        method: "GET",
      }),
      providesTags: ["Applications"],
    }),
  }),
});

export const {
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
  useFetchApplicationsQuery,
} = applicationApi;
