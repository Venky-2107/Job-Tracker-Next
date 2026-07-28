"use client";

import { useState } from "react";
import { useCreateApplicationMutation } from "@/store/applicationApi";
import { useRouter } from "next/navigation";
import ApplicationForm, {
  newApplicationForm,
} from "@/components/ApplicationForm";

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
      <ApplicationForm onSubmit={onSubmit} isLoading={isLoading} />
    </section>
  );
}
