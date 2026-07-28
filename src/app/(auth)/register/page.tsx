"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterMutation } from "@/store/authApi";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

const RegisterSchema = z.object({
  name: z.string(),
  email: z.string().email("Invalid Email!!"),
  password: z.string().min(5, "Minimum 5 characters needed!!"),
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function Register() {
  const [apiError, setApiError] = useState<string>("");
  const router = useRouter();
  const [registerUser, { isLoading, isError }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await registerUser(data).unwrap();
      if (result) {
        router.push("/login");
      }
    } catch (err: any) {
      setApiError(err.data.detail);
      console.log(err);
    }
  };

  return (
    <>
      {apiError && <p>{apiError}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("name")}
          placeholder="Username"
          className="border p-2 rounded"
        />
        {errors.name && <p>{errors.name.message}</p>}

        <input
          {...register("email")}
          placeholder="Email"
          className="border p-2 rounded"
        />
        {errors.email && <p>{errors.email.message}</p>}

        <input
          {...register("password")}
          placeholder="Password"
          className="border p-2 rounded"
        />
        {errors.password && <p>{errors.password.message}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
      <p>
        Already a user?
        <button onClick={() => router.push("/login")}>Login</button>
      </p>
    </>
  );
}
