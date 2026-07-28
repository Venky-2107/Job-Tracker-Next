"use client";

import { useFetchApplicationsQuery } from "@/store/applicationApi";
import { ApplicationRequest } from "@/types";
import ApplicationCard from "@/components/ApplicationCard";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/hooks/redux";
import { logout } from "@/store/authSlice";

export default function Dashboard() {
  const { data, isLoading, isError } = useFetchApplicationsQuery(undefined);
  const router = useRouter();
  const dispatch = useAppDispatch();

  console.log(data);
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Something went wrong</p>;
  return (
    <>
      <section>
        <button
          onClick={() => router.push("/application/new")}
          className="w-max m-2 p-2 text-sm bg-blue-500 rounded-3xl shadow-xs shadow-blue-300/50 hover:shadow-md hover:ring-2 hover:ring-blue-500"
        >
          Create New Application
        </button>
        <button
          onClick={() => {
            dispatch(logout());
            router.push("/login");
          }}
          className="w-max m-2 p-2 text-sm bg-red-500 rounded-3xl shadow-xs shadow-blue-300/50 hover:shadow-md hover:ring-2 hover:ring-red-500"
        >
          Logout
        </button>
      </section>
      <section className="flex gap-2 m-2">
        {data?.map((item: ApplicationRequest) => (
          <div key={item.id}>
            <ApplicationCard application={item} />
          </div>
        ))}
      </section>
    </>
  );
}
