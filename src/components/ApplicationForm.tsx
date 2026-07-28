"use client";

import { ApplicationRequest } from "@/types";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface ApplicationFormProps {
  defaultValues?: ApplicationRequest;
  onSubmit: (data: newApplicationForm) => void;
  isLoading: boolean;
}

const newApplicationSchema = z.object({
  company_name: z.string(),
  role: z.string(),
  portal: z.string(),
  application_status: z.string(),
  date_of_interview: z.string(),
});

export type newApplicationForm = z.infer<typeof newApplicationSchema>;
const inputStyle =
  "border border-gray-200 rounded-md b-gray-400 p-2 text-white w-full max-w-2xs";

export default function ApplicationForm(props: ApplicationFormProps) {
  const { defaultValues, onSubmit, isLoading } = props;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<newApplicationForm>({
    resolver: zodResolver(newApplicationSchema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <input
        {...register("company_name")}
        placeholder="Company name"
        className={inputStyle}
      />
      {errors.company_name && (
        <p className="text-red-500 text-sm">{errors.company_name.message}</p>
      )}
      <input {...register("role")} placeholder="Role" className={inputStyle} />
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
    </form>
  );
}
