"use client";

import { useState } from "react";
// import { z } from "zod";
// import { useForm } from "react-hook-form";
import { useCreateApplicationMutation } from "@/store/applicationApi";
// import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import ApplicationForm, {
  newApplicationForm,
} from "@/components/ApplicationForm";

// const newApplicationSchema = z.object({
//   company_name: z.string(),
//   role: z.string(),
//   portal: z.string(),
//   application_status: z.string(),
//   date_of_interview: z.string(),
// });

// type newApplicationForm = z.infer<typeof newApplicationSchema>;

export default function NewApplication() {
  const [apiError, setApiError] = useState<string>("");
  const router = useRouter();
  const [createApplication, { isLoading, isError, isSuccess }] =
    useCreateApplicationMutation();
  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors },
  // } = useForm<newApplicationForm>({
  //   resolver: zodResolver(newApplicationSchema),
  // });

  const onSubmit = async (data: newApplicationForm) => {
    console.log("onSUbmit", data);
    try {
      await createApplication(data).unwrap();
      router.push("/dashboard");
    } catch (error: any) {
      if (Array.isArray(error.data?.detail)) {
        setApiError(error.data.detail[0]?.msg || "Something went wrong");
      } else {
        setApiError(error.data?.detail || "Something went wrong");
      }
    }
  };

  return (
    <section className="flex flex-col justify-center items-center h-screen">
      <h1 className="m-4 text-2xl text-gray-200">Create Application</h1>
      {/* <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <input
          {...register("company_name")}
          placeholder="Company name"
          className={inputStyle}
        />
        {errors.company_name && (
          <p className="text-red-500 text-sm">{errors.company_name.message}</p>
        )}
        <input
          {...register("role")}
          placeholder="Role"
          className={inputStyle}
        />
        {errors.role && (
          <p className="text-red-500 text-sm">{errors.role.message}</p>
        )}
        <input
          {...register("portal")}
          placeholder="Portal"
          className={inputStyle}
        />
        {errors.portal && (
          <p className="text-red-500 text-sm">{errors.portal.message}</p>
        )}
        <input
          {...register("application_status")}
          placeholder="Status"
          className={inputStyle}
        />
        {errors.application_status && (
          <p className="text-red-500 text-sm">
            {errors.application_status.message}
          </p>
        )}
        <input
          {...register("date_of_interview")}
          placeholder="Date of Interview"
          type="date"
          min={new Date().toISOString().split("T")[0]}
          className={inputStyle}
        />
        {errors.date_of_interview && (
          <p className="text-red-500 text-sm">
            {errors.date_of_interview.message}
          </p>
        )}

        <button type="submit">{isLoading ? "Creating..." : "Create"}</button>
      </form> */}
      <ApplicationForm onSubmit={onSubmit} isLoading={isLoading} />
    </section>
  );
}
