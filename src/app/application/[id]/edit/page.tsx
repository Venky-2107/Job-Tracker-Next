"use client";

import {
  useFetchApplicationByIdQuery,
  useUpdateApplicationMutation,
} from "@/store/applicationApi";
import { use } from "react";
import { useRouter } from "next/navigation";
import ApplicationForm, {
  newApplicationForm,
} from "@/components/ApplicationForm";

export default function EditApplication({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading, isError } = useFetchApplicationByIdQuery(Number(id));
  const [updateApplication, { isLoading: isUpdating }] =
    useUpdateApplicationMutation();
  // console.log("applicaiton data", data, isLoading, isError);

  const handleUpdate = async (data: newApplicationForm) => {
    try {
      console.log("update result data", data);
      const result = await updateApplication({
        id: Number(id),
        ...data,
      }).unwrap();
      router.push("/dashboard");
    } catch (error) {
      console.log("error on updating");
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>Loading...</p>;
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <ApplicationForm
        defaultValues={data}
        isLoading={isLoading}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
